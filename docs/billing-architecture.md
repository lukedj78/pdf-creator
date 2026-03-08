# Billing Architecture — Polar + Better Auth

## Decisione

**Polar.sh** come Merchant of Record (MoR) integrato via plugin Better Auth.

### Perché Polar

- **MoR completo**: gestisce IVA/VAT, sales tax, fatturazione in 50+ giurisdizioni → zero gestione fiscale
- **Plugin Better Auth ufficiale**: `@polar-sh/better-auth` con checkout, portal, usage, webhooks
- **Commissione ~5%** tutto incluso (vs Stripe ~3% + tool tax + commercialista = 8-12% effettivo)
- **Usage-based billing** built-in con meters e events
- **Customer portal hosted** → meno UI da costruire
- **Developer-first**: API moderna, SDK TypeScript

### Cosa perdi vs Stripe diretto

- Meno controllo granulare sui flussi di pagamento
- Ecosystem più piccolo
- Se un domani vuoi fatturazione custom, sei più vincolato
- Exit strategy: a $50k+ MRR valutare migrazione a Stripe + tax automation

---

## Piani & Pricing

| | **Free** | **Pro** | **Enterprise** |
|---|---|---|---|
| **Prezzo** | $0/mese | $29/mese ($290/anno) | Custom |
| **Spec exports/mese** | 100 | 5.000 | Illimitati |
| **Templates** | 3 | Illimitati | Illimitati |
| **Team members** | 1 | 5 | Illimitati |
| **AI generations/mese** | 10 (trial) | 500 | Illimitate |
| **AI credit packs** | No | Sì ($5–$35) | N/A |
| **Webhooks** | No | Sì | Sì |
| **API access** | Sì (rate limited) | Sì | Sì |
| **MCP Server** | No | Sì | Sì |
| **SSO/SAML** | No | No | Sì |
| **Support** | Community | Priority | Dedicated |

### Stima Ricavi

```
MRR = (utenti_pro × $29) + (enterprise × prezzo_custom)

Scenario conservativo (12 mesi):
  1.000 free → 50 pro (5% conversione) → $1.450/mese
  + 2 enterprise ($199/mese) → $398/mese
  = ~$1.850 MRR → ~$22.200 ARR

Scenario ottimistico (12 mesi):
  10.000 free → 500 pro (5%) → $14.500/mese
  + 10 enterprise ($299/mese) → $2.990/mese
  = ~$17.500 MRR → ~$210.000 ARR
```

---

## Packages

```bash
pnpm add @polar-sh/better-auth @polar-sh/sdk --filter @workspace/auth
```

- `@polar-sh/better-auth` — plugin Better Auth (server + client exports)
- `@polar-sh/sdk` — Polar SDK per creare l'istanza client

---

## Environment Variables

```env
POLAR_ACCESS_TOKEN=pol_xxx          # Polar dashboard > Settings > Access Tokens
POLAR_WEBHOOK_SECRET=whsec_xxx      # Polar dashboard > Webhooks
```

Da aggiungere a `apps/web/.env.example` e `apps/web/lib/env.ts`.

---

## Server Plugin

`packages/auth/src/index.ts` — aggiungere al `plugins[]` esistente:

```typescript
import { polar, checkout, portal, usage, webhooks } from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";

const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  server: "sandbox", // → "production" in prod
});

polar({
  client: polarClient,
  createCustomerOnSignUp: true,
  use: [
    checkout({
      products: [
        { productId: "POLAR_PRO_PRODUCT_ID", slug: "pro" },
        { productId: "POLAR_ENTERPRISE_PRODUCT_ID", slug: "enterprise" },
      ],
      successUrl: "/dashboard/settings?tab=billing&checkout={CHECKOUT_ID}",
      authenticatedUsersOnly: true,
    }),
    portal(),
    usage(),
    webhooks({
      secret: process.env.POLAR_WEBHOOK_SECRET!,
      onSubscriptionActive: async ({ data }) => {
        // Sync → tabella locale subscriptions
        const orgId = data.metadata?.organizationId as string;
        await db.insert(subscription).values({
          organizationId: orgId,
          polarSubscriptionId: data.id,
          polarProductId: data.productId,
          plan: mapProductToPlan(data.productId),
          status: "active",
          currentPeriodEnd: new Date(data.currentPeriodEnd),
        }).onConflictDoUpdate({
          target: subscription.polarSubscriptionId,
          set: { status: "active", updatedAt: new Date() },
        });
      },
      onSubscriptionCanceled: async ({ data }) => {
        await db.update(subscription)
          .set({ status: "canceled", updatedAt: new Date() })
          .where(eq(subscription.polarSubscriptionId, data.id));
      },
    }),
  ],
})
```

---

## Client Plugin

`packages/auth/src/client.ts` — aggiungere al `plugins[]` esistente:

```typescript
import { polarClient } from "@polar-sh/better-auth/client";

polarClient()
```

### Metodi esposti

```typescript
// Checkout → redirect a Polar hosted page
await authClient.checkout({ slug: "pro", metadata: { organizationId: activeOrgId } });

// Customer state (subscriptions, benefits, meters)
const { data: state } = await authClient.customer.state();

// Customer portal → redirect a Polar hosted portal
await authClient.customer.portal();

// Usage ingestion (AI features)
await authClient.usage.ingest({
  event: "ai_generation",
  metadata: { type: "chat", organizationId: orgId },
});

// List meters (usage tracking)
const { data: meters } = await authClient.usage.meters.list({
  query: { page: 1, limit: 10 },
});
```

---

## Database Schema

`packages/db/src/schema/subscriptions.ts`

Polar **non crea tabelle** nel DB. Serve una tabella locale per org-level billing:

```typescript
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { organization } from "./auth";

export const subscription = pgTable("subscription", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  polarSubscriptionId: text("polar_subscription_id").notNull().unique(),
  polarProductId: text("polar_product_id").notNull(),
  plan: text("plan", { enum: ["free", "pro", "enterprise"] })
    .notNull()
    .default("free"),
  status: text("status", { enum: ["active", "canceled", "past_due", "trialing"] })
    .notNull(),
  currentPeriodEnd: timestamp("current_period_end"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

---

## Quota Enforcement

`packages/api/src/lib/quota.ts`

```typescript
export const PLAN_LIMITS = {
  free: {
    exports: 100,
    templates: 3,
    members: 1,
    aiCredits: 10,       // meter-based (Polar)
    webhooks: false,
    mcp: false,
    creditPacks: false,  // non può comprare credit packs
  },
  pro: {
    exports: 5_000,
    templates: Infinity,
    members: 5,
    aiCredits: 500,      // meter-based (Polar)
    webhooks: true,
    mcp: true,
    creditPacks: true,   // può comprare credit packs
  },
  enterprise: {
    exports: Infinity,
    templates: Infinity,
    members: Infinity,
    aiCredits: Infinity,  // no meter
    webhooks: true,
    mcp: true,
    creditPacks: false,   // non servono
  },
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;
```

### Enforcement nei tRPC Routers

```typescript
// Middleware riusabile
export const withQuota = (resource: keyof typeof PLAN_LIMITS["free"]) =>
  orgProcedure.use(async ({ ctx, next }) => {
    const sub = await db.query.subscription.findFirst({
      where: eq(subscription.organizationId, ctx.orgId),
    });
    const plan = sub?.plan ?? "free";
    const limits = PLAN_LIMITS[plan];

    // Boolean feature gate (ai, webhooks, mcp)
    if (typeof limits[resource] === "boolean" && !limits[resource]) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `${resource} requires a paid plan`,
      });
    }

    // Numeric limit (exports, templates, members)
    if (typeof limits[resource] === "number" && limits[resource] !== Infinity) {
      const currentUsage = await countUsage(ctx.orgId, resource);
      if (currentUsage >= limits[resource]) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `${resource} limit reached (${limits[resource]})`,
        });
      }
    }

    return next({ ctx: { ...ctx, plan, limits } });
  });
```

### Punti di enforcement

| Risorsa | Router / Procedura | Check |
|---|---|---|
| **Exports/mese** | `generations.create` | Conta per org + mese corrente |
| **Templates max** | `templates.create` | Conta per org |
| **Team members** | `organization.addMember` | Conta membri org |
| **AI generations** | `chat.create`, import, remix | Polar meter balance check |
| **Webhooks** | `webhooks.create` | Boolean gate `webhooks: true` |
| **MCP access** | MCP auth middleware | Boolean gate `mcp: true` |
| **API rate limit** | REST API middleware | Rate diverso per piano |

---

## Usage-Based Billing & AI Meters

### Concetti Chiave

Polar usage-based billing si basa su 3 componenti:

1. **Events** — azioni tracciabili inviate dalla tua app (es. "ai_generation")
2. **Meters** — aggregatori configurati su Polar Dashboard che filtrano e contano gli events
3. **Meter Credits Benefit** — crediti inclusi nel piano che si resettano ogni billing cycle

### Come Funziona il Sistema di Crediti

I crediti usano un sistema a **bilancio negativo**:

```
Sottoscrizione Pro → Polar assegna 500 crediti → balance = -500
Utente usa 1 AI generation → balance = -499
...usa 499 → balance = -1
...usa 500 → balance = 0 (crediti esauriti)
...usa 501 → balance = +1 (overage)
```

**Cosa succede quando i crediti finiscono:**
- Polar **NON blocca** automaticamente l'utente
- Se c'è un metered price → l'overage viene fatturato (es. $0.02/generation extra)
- Se NON c'è metered price → nessun addebito, ma devi enforciare tu il blocco nel codice
- Puoi usare un **cap** per limitare l'addebito massimo per overage

### Strategia per Piano

| Piano | AI Generations/mese | Comportamento overage |
|---|---|---|
| **Free** | 10 (trial) | Hard cap — blocco a 0 + upsell Pro |
| **Pro** | 500 incluse | Hard cap — blocco a 0 + upsell credit packs |
| **Enterprise** | Illimitate | Nessun limite |

### Pattern: Hard Cap + Credit Packs

- Free include 10 AI generations per far provare la feature (migliora conversione)
- Pro include 500 AI generations via Meter Credits Benefit
- Quando i crediti finiscono → **blocco + possibilità di comprare pacchetti extra**
- I pacchetti sono prodotti **one-time** su Polar con Meter Credits Benefit
- I crediti dei pacchetti **NON si resettano** — si consumano e basta
- I crediti del piano **SI resettano** ogni billing cycle

### Credit Packs (prodotti one-time su Polar)

| Pacchetto | Crediti | Prezzo | Prezzo/credito |
|---|---|---|---|
| **Starter Pack** | 100 | $5 | $0.050 |
| **Power Pack** | 500 | $20 | $0.040 |
| **Mega Pack** | 1.000 | $35 | $0.035 |

Sconto a volume → incentiva pacchetti più grandi.

### Setup Credit Packs su Polar Dashboard

Creare **3 prodotti one-time**, ognuno con Meter Credits Benefit:

```
Prodotto: "AI Credits — 100"
  Tipo:     One-time ($5)
  Benefit:  Meter Credits → meter "ai-generations" → 100 crediti

Prodotto: "AI Credits — 500"
  Tipo:     One-time ($20)
  Benefit:  Meter Credits → meter "ai-generations" → 500 crediti

Prodotto: "AI Credits — 1000"
  Tipo:     One-time ($35)
  Benefit:  Meter Credits → meter "ai-generations" → 1000 crediti
```

### Checkout Credit Packs

```typescript
// Server plugin — aggiungere ai products nel checkout
checkout({
  products: [
    { productId: "POLAR_PRO_ID", slug: "pro" },
    { productId: "POLAR_ENTERPRISE_ID", slug: "enterprise" },
    { productId: "POLAR_CREDITS_100_ID", slug: "ai-credits-100" },
    { productId: "POLAR_CREDITS_500_ID", slug: "ai-credits-500" },
    { productId: "POLAR_CREDITS_1000_ID", slug: "ai-credits-1000" },
  ],
  successUrl: "/dashboard/settings?tab=billing&purchased=credits",
  authenticatedUsersOnly: true,
}),
```

```typescript
// Frontend — bottone acquisto crediti
await authClient.checkout({
  slug: "ai-credits-100",
  metadata: { organizationId: activeOrgId },
});
```

### Come si sommano crediti piano + crediti comprati

```
Inizio mese → Polar assegna 500 crediti piano → balance = -500
Utente usa 500 → balance = 0 (finiti)
Utente compra Starter Pack (100) → Polar aggiunge 100 → balance = -100
Utente usa 50 → balance = -50 (ne restano 50)
Inizio mese successivo → Polar assegna 500 del piano → balance = -550
(i 50 residui del pack + 500 nuovi del piano)
```

### Enforcement con Credit Packs

```typescript
// Server-side check prima di ogni AI call
const meters = await polarClient.customerMeters.list({
  externalCustomerId: ctx.userId,
  meterId: AI_GENERATIONS_METER_ID,
});
const balance = meters.items[0]?.balance ?? 0;
if (balance >= 0) {
  throw new TRPCError({
    code: "FORBIDDEN",
    message: "AI credits exhausted. Buy a credit pack or wait for next billing cycle.",
  });
}
```

Il check è identico — non serve distinguere crediti piano da crediti comprati.
Polar li somma tutti nello stesso meter balance.

### Impatto sui Ricavi

```
Scenario: 50 utenti Pro, 30% compra un pacchetto/mese

  50 Pro × $29                    = $1.450/mese (subscription)
  15 utenti × $5-20 medio ($10)   = $150/mese (credit packs)

  Revenue boost: +10% puro margine extra
```

---

### Meters da Creare su Polar Dashboard

#### Meter 1: `ai-generations`

- **Filter**: event `name` equals `ai_generation`
- **Aggregation**: Count
- **Scopo**: traccia tutte le chiamate AI (chat, import, remix)

#### Meter 2 (opzionale futuro): `ai-tokens`

- **Filter**: event `name` equals `ai_generation`
- **Aggregation**: Sum di `metadata.totalTokens`
- **Scopo**: billing basato su token consumati (più granulare)

### Meter Credits Benefit per Prodotto

| Prodotto | Meter | Crediti | Reset |
|---|---|---|---|
| **Free** (default) | `ai-generations` | 10 | Ogni mese |
| **Pro Monthly** | `ai-generations` | 500 | Ogni mese |
| **Pro Yearly** | `ai-generations` | 500/mese (6.000/anno) | Ogni anno |
| **Enterprise** | Nessuno | Illimitato (no meter) | N/A |
| **Starter Pack** | `ai-generations` | 100 | Mai (one-time) |
| **Power Pack** | `ai-generations` | 500 | Mai (one-time) |
| **Mega Pack** | `ai-generations` | 1.000 | Mai (one-time) |

---

### Punti di Ingestion (dove inviare events)

5 endpoint nel codebase dove avvengono chiamate AI:

| Feature | File | Funzione AI | Event da inviare |
|---|---|---|---|
| **Chat (main)** | `apps/web/app/api/chat/route.ts` | `streamText()` | `ai_generation` type=chat |
| **Chat (editor)** | `apps/web/app/api/chat/editor/route.ts` | `streamText()` | `ai_generation` type=editor |
| **Import URL** | `apps/web/lib/actions/import.ts` | `generateObject()` | `ai_generation` type=import |
| **Import File** | `apps/web/lib/actions/import.ts` | `generateObject()` | `ai_generation` type=import |
| **Variations** | `apps/web/app/api/variations/route.ts` | `streamObject()` | `ai_generation` type=remix |

### Implementazione Ingestion

**Server-side** (via Polar SDK diretto, non via Better Auth plugin — per batch e metadata):

```typescript
// packages/api/src/lib/usage.ts
import { Polar } from "@polar-sh/sdk";

const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  server: process.env.NODE_ENV === "production" ? "production" : "sandbox",
});

export async function trackAiUsage(opts: {
  userId: string;
  organizationId: string;
  type: "chat" | "editor" | "import" | "remix";
  totalTokens?: number;
  model?: string;
}) {
  await polar.events.ingest({
    events: [{
      name: "ai_generation",
      externalCustomerId: opts.userId,
      metadata: {
        type: opts.type,
        organizationId: opts.organizationId,
        totalTokens: opts.totalTokens ?? 0,
        model: opts.model ?? "claude-sonnet-4",
      },
    }],
  });
}
```

**Uso nei route handler:**

```typescript
// apps/web/app/api/chat/route.ts — dopo streamText()
const result = streamText({ model: gateway("anthropic/claude-sonnet-4"), ... });

// Track dopo che lo stream è completato
result.then(async (finalResult) => {
  await trackAiUsage({
    userId: session.user.id,
    organizationId: session.session.activeOrganizationId,
    type: "chat",
    totalTokens: finalResult.usage?.totalTokens,
    model: "claude-sonnet-4",
  });
});
```

### Check Balance (Enforcement)

```typescript
// packages/api/src/lib/usage.ts
export async function checkAiQuota(userId: string, plan: PlanType): Promise<void> {
  // Enterprise = illimitato, nessun check
  if (plan === "enterprise") return;

  // Free e Pro usano entrambi i meter credits (10 e 500 rispettivamente)
  // Il check è identico — Polar gestisce i crediti per piano
  const meters = await polar.customerMeters.list({
    externalCustomerId: userId,
    meterId: process.env.AI_GENERATIONS_METER_ID,
  });

  const balance = meters.items[0]?.balance ?? 0;
  if (balance >= 0) {
    const message = plan === "free"
      ? "AI trial credits exhausted (10/month). Upgrade to Pro for 500/month."
      : "AI credits exhausted. Buy a credit pack or wait for next billing cycle.";
    throw new TRPCError({ code: "FORBIDDEN", message });
  }
}
```

### Event Metadata

Ogni event inviato a Polar può contenere fino a **50 metadata fields**:

```typescript
{
  name: "ai_generation",
  externalCustomerId: "user_abc123",
  externalId: "evt_unique_id",        // deduplication key (opzionale)
  metadata: {
    type: "chat",                      // chat | editor | import | remix
    organizationId: "org_xyz",
    model: "claude-sonnet-4",
    totalTokens: 1250,
    promptTokens: 800,
    completionTokens: 450,
    _cost: {                           // speciale: Polar calcola margini
      amount: 3,                       // centesimi USD
      currency: "usd",
    },
  },
}
```

Il campo `_cost` è speciale: Polar lo usa per mostrare **Customer Costs, Margins & Cashflow** nella dashboard.

### Limiti Tecnici Events

- Max **50** metadata key-value pairs per event
- Key max **40** caratteri
- String value max **500** caratteri
- Rate limit: **300 requests/minuto** per org
- Events sono **immutabili** (non modificabili/cancellabili dopo l'invio)
- `external_id` per deduplicazione (se re-invii stesso ID, conta come duplicato)

### Billing Cycle & Reset

- **Monthly**: usage aggregata per il mese del billing period, fatturata a fine periodo
- **Yearly**: usage aggregata per l'anno intero
- **Credits** si refreshano all'inizio di ogni nuovo billing cycle
- **Cancellazione**: subscription resta attiva fino al grace period, usage continua ad essere tracciata, fattura finale emessa a fine periodo
- **Cambio piano mid-cycle**: proration gestita automaticamente da Polar

---

### Dashboard Utente — Visualizzazione Usage

Per mostrare i crediti rimasti nella billing tab:

```typescript
// Client-side via Better Auth plugin
const { data: meters } = await authClient.usage.meters.list({
  query: { page: 1, limit: 10 },
});

// meters.items[0] contiene:
// - consumed_units: 150
// - credited_units: 500
// - balance: -350 (350 crediti rimasti)

const aiMeter = meters.items.find(m => m.meter.name === "ai-generations");
const used = aiMeter?.consumed_units ?? 0;      // 150
const total = aiMeter?.credited_units ?? 0;      // 500
const remaining = Math.max(0, total - used);     // 350
const percentage = total > 0 ? (used / total) * 100 : 0; // 30%
```

### Dove mostrare il contatore

#### 1. Billing Tab (settings) — usage completo

```
╔═══════════════════════════════════════════════════════╗
║  AI Generations        150 / 500                      ║
║  ████████████░░░░░░░░░░░░░░░░░░░░  30%               ║
║                                                       ║
║  Spec Exports          45 / 5.000                     ║
║  █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  1%                 ║
║                                                       ║
║  Templates             8 / ∞                          ║
║  Team Members          3 / 5                          ║
╚═══════════════════════════════════════════════════════╝
```

#### 2. Editor AI Assistant — badge inline

```
Toolbar: 🤖 AI Assistant                    142/500
Quando vicino al limite:  🤖 AI Assistant  ⚠️ 485/500
```

#### 3. UI quando crediti esauriti — upsell credit packs

Nella billing tab e come dialog nell'editor quando l'utente prova a usare AI:

```
╔═══════════════════════════════════════════════════════╗
║  ⚠️  AI credits esauriti                              ║
║                                                       ║
║  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐ ║
║  │  100 credits │ │  500 credits │ │  1.000 credits  │ ║
║  │     $5       │ │     $20      │ │      $35        │ ║
║  │  $0.05/ea    │ │  $0.04/ea    │ │   $0.035/ea     │ ║
║  │  [ Compra ]  │ │  [ Compra ]  │ │   [ Compra ]    │ ║
║  └─────────────┘ └─────────────┘ └─────────────────┘ ║
║                                                       ║
║  I crediti del piano si resettano tra 12 giorni        ║
╚═══════════════════════════════════════════════════════╝
```

Per utenti Free, stessa UI ma con CTA diversa:

```
╔═══════════════════════════════════════════════════════╗
║  ⚠️  AI trial credits esauriti (10/mese)              ║
║                                                       ║
║  Passa a Pro per 500 AI generations/mese              ║
║                                                       ║
║  [ Upgrade to Pro — $29/mese ]                        ║
╚═══════════════════════════════════════════════════════╝
```

### Env Variables Aggiuntive

```env
AI_GENERATIONS_METER_ID=meter_xxx   # ID del meter creato su Polar Dashboard
```

---

## Checkout Flow Completo

```
User signup
  → Polar customer auto-creato (externalId = userId)
  → Org su piano Free (default, nessuna row in subscription)

Click "Upgrade to Pro"
  → authClient.checkout({ slug: "pro", metadata: { organizationId } })
  → Redirect a Polar hosted checkout (pagamento, IVA automatica)

Pagamento completato
  → Polar webhook → onSubscriptionActive
  → INSERT/UPDATE subscription table (orgId, plan: "pro", status: "active")

Feature access
  → tRPC middleware legge subscription → PLAN_LIMITS["pro"]
  → AI, webhooks, MCP sbloccati
  → Export limit: 5.000/mese

Gestione abbonamento
  → authClient.customer.portal()
  → Redirect a Polar hosted portal (cancella, cambia piano, fatture)

Cancellazione
  → Polar webhook → onSubscriptionCanceled
  → UPDATE subscription status = "canceled"
  → Downgrade a Free limits al termine del periodo
```

---

## Tipi di Enforcement

3 meccanismi diversi in base alla risorsa:

```typescript
// 1. GATE BOOLEANO — feature on/off per piano (nessun conteggio)
//    Webhooks, MCP, Credit Packs
if (!limits.webhooks) throw "requires Pro";

// 2. COUNT LOCALE DB — risorse permanenti, contate nel tuo DB
//    Templates (esistono, non si consumano), Team Members
const count = await db.select({ count: sql`count(*)` })
  .from(templates)
  .where(eq(templates.organizationId, orgId));
if (count >= limits.templates) throw "limit reached";

// 3. POLAR METER — risorse a consumo mensile, contate da Polar
//    AI Generations, Spec Exports
const meter = await polar.customerMeters.list({ ... });
if (meter.balance >= 0) throw "credits exhausted";
```

| | Polar Meter | Count locale DB | Gate booleano |
|---|---|---|---|
| **Risorse** | AI, Exports | Templates, Members | Webhooks, MCP |
| **Reset** | Automatico (billing cycle) | Mai | N/A |
| **Latenza** | ~100ms (API esterna) | ~5ms (DB locale) | ~0ms (in-memory) |
| **Billing** | Può generare overage | No | No |

---

## Setup Polar Dashboard

1. **Creare Organization** su [polar.sh](https://polar.sh)
2. **Creare Meter**: `ai-generations` (Count aggregation, filter `name = ai_generation`)
3. **Creare Products Subscription**:
   - "Free" — $0/month, Meter Credits Benefit: 10 su `ai-generations`
   - "Pro" — $29/month, Meter Credits Benefit: 500 su `ai-generations`
   - "Enterprise" — custom pricing (contatto)
4. **Creare Products One-Time (Credit Packs)**:
   - "AI Credits — 100" — $5, Meter Credits Benefit: 100 su `ai-generations`
   - "AI Credits — 500" — $20, Meter Credits Benefit: 500 su `ai-generations`
   - "AI Credits — 1000" — $35, Meter Credits Benefit: 1.000 su `ai-generations`
5. **Configurare Webhook**: URL `https://dominio.com/api/auth/polar/webhooks`
6. **Generare Access Token**: Settings > Access Tokens
7. **Copiare Webhook Secret**: dalla config webhook

---

## File da Creare/Modificare

| File | Azione |
|---|---|
| `packages/auth/src/index.ts` | Aggiungere `polar()` plugin |
| `packages/auth/src/client.ts` | Aggiungere `polarClient()` plugin |
| `packages/auth/package.json` | Aggiungere `@polar-sh/better-auth`, `@polar-sh/sdk` |
| `packages/db/src/schema/subscriptions.ts` | **Nuovo** — tabella subscription |
| `packages/db/src/schema/index.ts` | Export nuova tabella |
| `packages/api/src/lib/quota.ts` | **Nuovo** — PLAN_LIMITS + middleware |
| `packages/api/src/routers/billing.ts` | **Nuovo** — router billing (get plan, usage) |
| `apps/web/lib/env.ts` | Aggiungere POLAR_ACCESS_TOKEN, POLAR_WEBHOOK_SECRET |
| `apps/web/.env.example` | Aggiungere env vars |
| `apps/web/app/dashboard/settings/tabs/billing-tab.tsx` | Collegare a checkout/portal reale + usage meters |
| `packages/ui/src/components/landing/pricing.tsx` | Collegare bottoni a checkout |
| `apps/web/components/editor/ai-assistant.tsx` | Badge crediti AI inline |
| `apps/web/components/credit-pack-dialog.tsx` | **Nuovo** — dialog upsell credit packs |
