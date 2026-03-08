# Documentazione Tecnica — JSON Spec Editor SaaS

> Documento di riferimento per due diligence tecnica e valutazione acquisizione.
> Ultimo aggiornamento: Marzo 2026

---

## Indice

1. [Panoramica Progetto](#1-panoramica-progetto)
2. [Architettura Monorepo](#2-architettura-monorepo)
3. [Stack Tecnologico](#3-stack-tecnologico)
4. [Database Schema](#4-database-schema)
5. [Sistema di Autenticazione](#5-sistema-di-autenticazione)
6. [Permessi e Ruoli (RBAC)](#6-permessi-e-ruoli-rbac)
7. [API Layer — tRPC](#7-api-layer--trpc)
8. [REST API Pubblica](#8-rest-api-pubblica)
9. [Template Engine (Core IP)](#9-template-engine-core-ip)
10. [Visual Editor](#10-visual-editor)
11. [Integrazione AI](#11-integrazione-ai)
12. [SDK npm](#12-sdk-npm)
13. [MCP Server](#13-mcp-server)
14. [Server Actions](#14-server-actions)
15. [Routing e Pagine](#15-routing-e-pagine)
16. [Sistema UI e Design](#16-sistema-ui-e-design)
17. [Sistema di Animazione](#17-sistema-di-animazione)
18. [Billing e Piani](#18-billing-e-piani)
19. [Webhook System](#19-webhook-system)
20. [Testing](#20-testing)
21. [Variabili d'Ambiente](#21-variabili-dambiente)
22. [Build e Deploy](#22-build-e-deploy)
23. [Fasi di Sviluppo Completate](#23-fasi-di-sviluppo-completate)

---

## 1. Panoramica Progetto

**Nome**: JSON Spec Editor SaaS
**Tipo**: Piattaforma SaaS multi-tenant per la creazione e gestione di template documentali basati su specifiche JSON
**Versione**: 0.0.1 (feature-complete, pre-launch)

### Cosa fa

- Editor visuale drag-and-drop per costruire template documentali
- Integrazione AI agentica per generazione e modifica template via chat
- Export in formato JSON compatibile `@json-render/react-pdf`
- API pubblica REST + SDK npm + MCP Server per integrazione programmatica
- Multi-tenancy con organizzazioni, team, ruoli e permessi granulari

### Metriche del Codice

| Metrica | Valore |
|---------|--------|
| Linee di codice (TypeScript) | ~35.500 |
| File sorgente | ~270 |
| Pacchetti monorepo | 12 (8 app/lib + 4 config) |
| Tabelle database | 16 |
| Endpoint tRPC | 37 procedure |
| Endpoint REST | 10+ |
| Pagine applicazione | 27 route |
| Test unitari | 94+ |
| Test E2E | 13 |
| Ore sviluppo stimate | 600–800h |

---

## 2. Architettura Monorepo

```
pdf-generator/
├── apps/
│   └── web/                          # Next.js 16 — App principale SaaS
│       ├── app/                      # App Router (route, layout, API)
│       ├── components/               # Componenti React (editor, marketing, AI)
│       ├── lib/                      # Actions, store, utils, env
│       └── providers/                # MotionProvider
│
├── packages/
│   ├── api/                          # tRPC routers — UNICA fonte business logic
│   │   ├── src/routers/              # 8 router (templates, generations, chat, org, webhooks, billing, activity-log, user-preferences)
│   │   ├── src/trpc.ts               # Context, middleware, procedure types
│   │   ├── src/lib/                  # Quota, webhook dispatcher
│   │   └── src/__tests__/            # Test unitari
│   │
│   ├── auth/                         # Better Auth configurazione
│   │   ├── src/index.ts              # Auth config + plugin
│   │   └── src/permissions.ts        # RBAC: ruoli, risorse, azioni
│   │
│   ├── db/                           # Drizzle ORM + Neon PostgreSQL
│   │   ├── src/schema/               # Schema tabelle (auth, templates, generations, chat, webhooks, activity-log, subscription)
│   │   ├── src/client.ts             # Connessione database
│   │   └── src/seed.ts               # Dati iniziali
│   │
│   ├── template-engine/              # Core: schema JSON, renderer, utils
│   │   ├── src/schema/types.ts       # Zod schema completo (344 righe)
│   │   ├── src/renderer/             # React renderer con registry
│   │   ├── src/utils/                # Manipolazione, data binding, validazione
│   │   ├── src/defaults/             # Template preset (Invoice, Report, Contract)
│   │   └── src/__tests__/            # 8 file di test
│   │
│   ├── rest-api/                     # Adapter REST su tRPC (Hono)
│   │   ├── src/routes/               # templates, generate, generations, usage
│   │   ├── src/middleware/            # API key auth
│   │   └── src/lib/                  # Rate limit, response format
│   │
│   ├── sdk/                          # npm SDK pubblico
│   │   ├── src/client.ts             # SpecDesignerClient (11 metodi)
│   │   ├── src/types.ts              # Tipi TypeScript
│   │   └── src/__tests__/            # Test client
│   │
│   ├── mcp/                          # MCP Server (Claude/Cursor)
│   │   ├── src/server.ts             # 10 tool, 3 prompt, 2 resource
│   │   ├── src/api-client.ts         # Client HTTP interno
│   │   ├── src/stdio.ts              # Transport stdio
│   │   └── src/__tests__/            # Test server
│   │
│   ├── ui/                           # Componenti UI condivisi
│   │   ├── src/components/           # shadcn/ui v4 + shared + dashboard + landing
│   │   ├── src/lib/animation.ts      # Sistema animazione centralizzato
│   │   └── src/styles/globals.css    # Tema OKLCH + CSS custom dashboard
│   │
│   ├── eslint-config/                # ESLint config condiviso
│   └── typescript-config/            # TypeScript config condiviso
│
├── e2e/                              # Test Playwright E2E
├── turbo.json                        # Configurazione Turborepo
├── PRD.md                            # Product Requirements Document (11 fasi)
└── package.json                      # Root workspace
```

### Regole Architetturali

1. **Nessuna app accede al DB direttamente** → tutto via `packages/db/`
2. **Business logic SOLO in `packages/api/`** → tRPC è la fonte unica
3. **REST API è un thin adapter** → nessuna logica duplicata
4. **Server Actions wrappano tRPC** → non lo sostituiscono
5. **Auth centralizzata** → `packages/auth/` condiviso
6. **UI condivisa** → `packages/ui/` con componenti, animazioni, stili

---

## 3. Stack Tecnologico

### Frontend

| Tecnologia | Versione | Ruolo |
|-----------|---------|-------|
| Next.js | 16.1.6 | Framework React, App Router, Turbopack |
| React | 19.2.4 | UI library (RSC, Server Components) |
| TypeScript | 5.9.3 | Type safety (strict mode) |
| Tailwind CSS | 4.1.18 | Utility-first CSS (v4 con PostCSS) |
| shadcn/ui | v4 | Component library (preset `aIkfGvY`, style `base-vega`) |
| @base-ui/react | 1.2.0 | Primitivi UI headless (NON Radix) |
| Framer Motion | 12.35.0 | Animazioni e transizioni |
| @dnd-kit | 6.3.1 / 10.0.0 | Drag & drop (core + sortable) |
| @tanstack/react-query | 5.90.21 | Data fetching e caching |
| @tanstack/react-table | 8.21.3 | Tabelle avanzate |
| @hugeicons/react | 1.1.5 | Icone |
| nuqs | — | URL state management |

### Backend

| Tecnologia | Versione | Ruolo |
|-----------|---------|-------|
| tRPC | 11.12.0 | API type-safe (unica fonte business logic) |
| Better Auth | 1.2.0 | Autenticazione + plugin (org, 2FA, admin, API key) |
| Drizzle ORM | 0.44.0 | ORM type-safe per PostgreSQL |
| Neon | — | PostgreSQL serverless |
| Hono | 4.7.10 | REST API adapter leggero |
| Vercel AI SDK | 6.0.116 | Integrazione AI multi-modello |
| @ai-sdk/gateway | 3.0.66 | AI Gateway (routing modelli) |
| Upstash Redis | 1.36.3 | Rate limiting (produzione) |
| @upstash/ratelimit | 2.0.8 | Algoritmo sliding window |
| Zod | 3.25.76 | Validazione schema runtime |

### DevOps & Testing

| Tecnologia | Versione | Ruolo |
|-----------|---------|-------|
| Turborepo | 2.8.8 | Orchestrazione monorepo |
| pnpm | 9.0.6 | Package manager |
| Vitest | 4.0.18 | Test unitari |
| Playwright | 1.58.2 | Test E2E |
| @vitest/coverage-v8 | 4.0.18 | Code coverage |
| ESLint | 9 | Linting |
| Prettier | 3.8.1 | Formatting |
| @t3-oss/env-nextjs | 0.13.10 | Validazione env vars |

---

## 4. Database Schema

Database PostgreSQL serverless (Neon) gestito con Drizzle ORM. 16 tabelle totali.

### Tabelle Autenticazione (Better Auth)

#### `user`
| Colonna | Tipo | Note |
|---------|------|------|
| `id` | text (PK) | |
| `name` | text (NOT NULL) | |
| `email` | text (NOT NULL, UNIQUE) | |
| `emailVerified` | boolean (default: false) | |
| `image` | text (nullable) | Avatar URL |
| `createdAt` | timestamp (default: now()) | |
| `updatedAt` | timestamp (auto) | |
| `twoFactorEnabled` | boolean (default: false) | |
| `role` | text (nullable) | Ruolo piattaforma: superadmin/admin/user |
| `banned` | boolean (default: false) | |
| `banReason` | text (nullable) | |
| `banExpires` | timestamp (nullable) | |

#### `session`
| Colonna | Tipo | Note |
|---------|------|------|
| `id` | text (PK) | |
| `expiresAt` | timestamp (NOT NULL) | Scadenza 7 giorni |
| `token` | text (NOT NULL, UNIQUE) | |
| `createdAt` | timestamp | |
| `updatedAt` | timestamp | |
| `ipAddress` | text (nullable) | |
| `userAgent` | text (nullable) | |
| `userId` | text (FK→user, CASCADE) | |
| `activeOrganizationId` | text (nullable) | Org attiva nella sessione |
| `impersonatedBy` | text (nullable) | Admin che sta impersonando |

**Index**: `session_userId_idx`

#### `account`
| Colonna | Tipo | Note |
|---------|------|------|
| `id` | text (PK) | |
| `accountId` | text (NOT NULL) | ID provider esterno |
| `providerId` | text (NOT NULL) | google/github/credential |
| `userId` | text (FK→user, CASCADE) | |
| `accessToken` | text (nullable) | OAuth token |
| `refreshToken` | text (nullable) | |
| `idToken` | text (nullable) | |
| `accessTokenExpiresAt` | timestamp (nullable) | |
| `refreshTokenExpiresAt` | timestamp (nullable) | |
| `scope` | text (nullable) | |
| `password` | text (nullable) | Hash password (credential) |
| `createdAt` | timestamp | |
| `updatedAt` | timestamp | |

**Index**: `account_userId_idx`

#### `verification`
| Colonna | Tipo | Note |
|---------|------|------|
| `id` | text (PK) | |
| `identifier` | text (NOT NULL) | Email o tipo token |
| `value` | text (NOT NULL) | Token di verifica |
| `expiresAt` | timestamp (NOT NULL) | |
| `createdAt` | timestamp | |
| `updatedAt` | timestamp | |

**Index**: `verification_identifier_idx`

#### `twoFactor`
| Colonna | Tipo | Note |
|---------|------|------|
| `id` | text (PK) | |
| `secret` | text (NOT NULL) | TOTP secret |
| `backupCodes` | text (NOT NULL) | Codici di backup |
| `userId` | text (FK→user, CASCADE) | |

**Index**: `twoFactor_secret_idx`, `twoFactor_userId_idx`

#### `apikey`
| Colonna | Tipo | Note |
|---------|------|------|
| `id` | text (PK) | |
| `configId` | text (default: "default") | |
| `name` | text (nullable) | Nome descrittivo |
| `start` | text (nullable) | Prefisso visibile della chiave |
| `referenceId` | text (NOT NULL) | Riferimento utente/org |
| `prefix` | text (nullable) | |
| `key` | text (NOT NULL) | Chiave hashata |
| `refillInterval` | integer (nullable) | |
| `refillAmount` | integer (nullable) | |
| `lastRefillAt` | timestamp (nullable) | |
| `enabled` | boolean (default: true) | |
| `rateLimitEnabled` | boolean (default: true) | |
| `rateLimitTimeWindow` | integer (default: 86400000) | Finestra in ms (24h) |
| `rateLimitMax` | integer (default: 10) | Max richieste per finestra |
| `requestCount` | integer (default: 0) | |
| `remaining` | integer (nullable) | |
| `lastRequest` | timestamp (nullable) | |
| `expiresAt` | timestamp (nullable) | |
| `createdAt` | timestamp (NOT NULL) | |
| `updatedAt` | timestamp (NOT NULL) | |
| `permissions` | text (nullable) | |
| `metadata` | text (nullable) | |

**Index**: `apikey_configId_idx`, `apikey_referenceId_idx`, `apikey_key_idx`

### Tabelle Organizzazione

#### `organization`
| Colonna | Tipo | Note |
|---------|------|------|
| `id` | text (PK) | |
| `name` | text (NOT NULL) | |
| `slug` | text (NOT NULL, UNIQUE) | URL-friendly |
| `logo` | text (nullable) | |
| `createdAt` | timestamp (NOT NULL) | |
| `metadata` | text (nullable) | JSON metadata |

#### `member`
| Colonna | Tipo | Note |
|---------|------|------|
| `id` | text (PK) | |
| `organizationId` | text (FK→organization, CASCADE) | |
| `userId` | text (FK→user, CASCADE) | |
| `role` | text (default: "member") | owner/admin/member/viewer |
| `createdAt` | timestamp (NOT NULL) | |

**Index**: `member_organizationId_idx`, `member_userId_idx`

#### `invitation`
| Colonna | Tipo | Note |
|---------|------|------|
| `id` | text (PK) | |
| `organizationId` | text (FK→organization, CASCADE) | |
| `email` | text (NOT NULL) | |
| `role` | text (nullable) | |
| `status` | text (default: "pending") | pending/accepted/rejected |
| `expiresAt` | timestamp (NOT NULL) | 7 giorni dalla creazione |
| `createdAt` | timestamp (default: now()) | |
| `inviterId` | text (FK→user, CASCADE) | |

**Index**: `invitation_organizationId_idx`, `invitation_email_idx`

### Tabelle Applicazione

#### `templates`
| Colonna | Tipo | Note |
|---------|------|------|
| `id` | text (PK, UUID) | |
| `name` | text (NOT NULL) | |
| `description` | text (nullable) | |
| `schema` | jsonb (NOT NULL) | Spec JSON completa del template |
| `thumbnail` | text (nullable) | |
| `status` | enum (default: "draft") | draft / published |
| `organizationId` | text (NOT NULL) | Isolamento multi-tenant |
| `createdBy` | text (NOT NULL) | User ID del creatore |
| `isPublic` | boolean (default: false) | |
| `createdAt` | timestamp (default: now()) | |
| `updatedAt` | timestamp (auto) | |

#### `generations`
| Colonna | Tipo | Note |
|---------|------|------|
| `id` | text (PK, UUID) | |
| `templateId` | text (FK→templates, CASCADE, nullable) | |
| `data` | jsonb (nullable) | Dati merge per lo state |
| `outputUrl` | text (nullable) | URL output generato |
| `status` | enum (default: "pending") | pending/processing/completed/failed |
| `format` | enum (default: "json") | json/pdf/png/jpg |
| `callbackUrl` | text (nullable) | URL callback asincrono |
| `organizationId` | text (NOT NULL) | |
| `createdBy` | text (NOT NULL) | |
| `createdAt` | timestamp (default: now()) | |

#### `chatSessions`
| Colonna | Tipo | Note |
|---------|------|------|
| `id` | text (PK, UUID) | |
| `templateId` | text (FK→templates, SET NULL, nullable) | |
| `templateSchema` | jsonb (nullable) | Snapshot schema al momento del chat |
| `organizationId` | text (NOT NULL) | |
| `createdBy` | text (NOT NULL) | |
| `createdAt` | timestamp (default: now()) | |

#### `chatMessages`
| Colonna | Tipo | Note |
|---------|------|------|
| `id` | text (PK, UUID) | |
| `sessionId` | text (FK→chatSessions, CASCADE, NOT NULL) | |
| `role` | enum (NOT NULL) | user/assistant/system |
| `content` | text (NOT NULL) | |
| `createdAt` | timestamp (default: now()) | |

#### `webhooks`
| Colonna | Tipo | Note |
|---------|------|------|
| `id` | text (PK, UUID) | |
| `url` | text (NOT NULL) | Endpoint destinazione |
| `events` | jsonb (NOT NULL) | Array di nomi evento |
| `secret` | text (NOT NULL) | Chiave per HMAC signing |
| `organizationId` | text (NOT NULL) | |
| `active` | boolean (default: true) | |
| `createdAt` | timestamp (default: now()) | |

#### `activityLog`
| Colonna | Tipo | Note |
|---------|------|------|
| `id` | text (PK) | |
| `organizationId` | text (FK→organization, CASCADE, NOT NULL) | |
| `actorId` | text (FK→user, CASCADE, NOT NULL) | |
| `action` | text (NOT NULL) | Nome azione (es. "template.created") |
| `targetType` | text (nullable) | Tipo risorsa |
| `targetId` | text (nullable) | ID risorsa |
| `metadata` | jsonb (nullable) | Dati aggiuntivi |
| `createdAt` | timestamp (default: now()) | |

**Index**: `activity_log_orgId_idx`, `activity_log_createdAt_idx`

#### `userPreferences`
| Colonna | Tipo | Note |
|---------|------|------|
| `id` | text (PK) | |
| `userId` | text (FK→user, CASCADE, NOT NULL, UNIQUE) | |
| `emailNotifications` | boolean (default: true) | |
| `marketingEmails` | boolean (default: false) | |
| `updatedAt` | timestamp (auto) | |

#### `subscription`
| Colonna | Tipo | Note |
|---------|------|------|
| `id` | text (PK, UUID) | |
| `organizationId` | text (FK→organization, CASCADE, NOT NULL) | |
| `polarSubscriptionId` | text (NOT NULL, UNIQUE) | Riferimento Polar |
| `polarProductId` | text (NOT NULL) | |
| `plan` | enum (default: "free") | free/pro/enterprise |
| `status` | enum (NOT NULL) | active/canceled/past_due/trialing |
| `currentPeriodEnd` | timestamp (nullable) | |
| `createdAt` | timestamp (default: now()) | |
| `updatedAt` | timestamp (auto) | |

### Relazioni e Cascade

```
user ← session (CASCADE)
user ← account (CASCADE)
user ← member (CASCADE)
user ← invitation (CASCADE)
user ← twoFactor (CASCADE)
user ← userPreferences (CASCADE)
user ← activityLog (CASCADE)
organization ← member (CASCADE)
organization ← invitation (CASCADE)
organization ← activityLog (CASCADE)
organization ← subscription (CASCADE)
templates ← generations (CASCADE)
templates ← chatSessions (SET NULL)  ← preserva la chat history
chatSessions ← chatMessages (CASCADE)
```

---

## 5. Sistema di Autenticazione

Basato su **Better Auth 1.2.0** con 5 plugin.

### Metodi di Login

| Metodo | Configurazione |
|--------|---------------|
| Email + Password | Abilitato con reset flow |
| Google OAuth | Condizionale su `GOOGLE_CLIENT_ID` |
| GitHub OAuth | Condizionale su `GITHUB_CLIENT_ID` |
| Magic Link | Via email (Resend) |

### Plugin Attivi

1. **Organization** — Multi-tenancy con organizzazioni, team, ruoli
   - Ruolo creatore: `owner`
   - Limite membri: 50
   - Email invito personalizzata

2. **Two Factor** — TOTP con backup codes

3. **Admin** — Gestione utenti piattaforma
   - Ruoli admin: `["superadmin", "admin"]`
   - Ruolo default: `"user"`

4. **API Key** — Chiavi API per accesso programmatico
   - Riferimento: `"organization"`
   - Rate limit gestito a livello tabella

5. **Polar** (condizionale su `POLAR_ACCESS_TOKEN`) — Billing
   - Checkout, portal, usage tracking, webhooks
   - Prodotti: Pro, Enterprise, AI Credits (100/500/1000)

### Configurazione Sessione

- **Durata**: 7 giorni
- **Refresh**: ogni 24 ore
- **Impersonation**: supportata (campo `impersonatedBy` in session)

### Email Transazionali

- Verifica email (registrazione)
- Reset password
- Invito organizzazione

---

## 6. Permessi e Ruoli (RBAC)

File: `packages/auth/src/permissions.ts`

### Ruoli Piattaforma (`user.role`)

| Ruolo | Permessi |
|-------|----------|
| `superadmin` | Tutto: gestione utenti, ban, impersonation, impersonate-admins, delete, set-password, sessioni |
| `admin` | Gestione utenti (no impersonation), ban, delete, set-password, sessioni |
| `user` | Accesso standard alla piattaforma |

### Ruoli Organizzazione (`member.role`)

| Ruolo | template | generation | chat | apiKey | webhook |
|-------|----------|-----------|------|--------|---------|
| `owner` | CRUD + duplicate | CRD | CR | CRD | CRUD |
| `admin` | CRUD + duplicate | CRD | CR | CRD | CRUD |
| `member` | CRUD + duplicate | CRD | CR | R | R |
| `viewer` | R | R | R | R | R |

### Risorse Custom

```typescript
template:    ["create", "read", "update", "delete", "duplicate"]
generation:  ["create", "read", "delete"]
chat:        ["create", "read"]
apiKey:      ["create", "read", "delete"]
webhook:     ["create", "read", "update", "delete"]
```

### Enforcement

Il middleware tRPC `orgProcedureWith()` verifica i permessi su ogni procedure:

```typescript
// Esempio: solo chi ha permesso template.create può creare
router.create = orgProcedureWith({ template: ["create"] })
  .input(createTemplateSchema)
  .mutation(...)
```

---

## 7. API Layer — tRPC

File principale: `packages/api/src/trpc.ts`

### Tipo di Context

```typescript
type Context = {
  db: Database
  session: {
    user: { id, name, email, image?, role? }
    session: { id, activeOrganizationId? }
  } | null
}
```

### Gerarchia Procedure

```
publicProcedure          → Nessuna autenticazione
  └── protectedProcedure → Richiede session.user
       ├── platformAdminProcedure → Richiede role superadmin|admin
       └── orgProcedure  → Richiede activeOrganizationId
            └── orgProcedureWith(perms) → Verifica permessi RBAC
```

### Router: `templates` (7 procedure)

| Procedura | Tipo | Permesso | Input | Output |
|-----------|------|----------|-------|--------|
| `list` | query | template.read | `{ search?, status?, dateFrom?, dateTo?, sortBy?, sortOrder?, page?, perPage? }` | `{ items, pagination }` |
| `getById` | query | template.read | `{ id }` | `Template \| null` |
| `create` | mutation | template.create | `{ name, description?, schema, status? }` | `Template` — webhook: `template.created` |
| `update` | mutation | template.update | `{ id, name?, description?, schema?, status?, isPublic? }` | `Template` — webhook: `template.updated` |
| `delete` | mutation | template.delete | `{ id }` | `{ success: true }` — webhook: `template.deleted` |
| `duplicate` | mutation | template.duplicate | `{ id }` | `Template` (copia con " (Copy)") |
| `gallery` | query | pubblico | — | Array metadata template preset |

### Router: `generations` (4 procedure)

| Procedura | Tipo | Permesso | Input | Output |
|-----------|------|----------|-------|--------|
| `list` | query | generation.read | `{ limit?, offset? }` | Array con join template name |
| `getById` | query | generation.read | `{ id }` | `Generation \| null` |
| `exportSpec` | mutation | generation.create | `{ templateId, data? }` oppure `{ template, data? }` | `{ id, spec }` |
| `delete` | mutation | generation.delete | `{ id }` | `{ success: true }` |

### Router: `chat` (6 procedure)

| Procedura | Tipo | Permesso | Input |
|-----------|------|----------|-------|
| `listSessions` | query | chat.read | — |
| `getMessages` | query | chat.read | `{ sessionId }` |
| `createSession` | mutation | chat.create | `{ templateId? }` |
| `getSession` | query | chat.read | `{ id }` |
| `updateSessionTemplate` | mutation | chat.create | `{ id, templateSchema }` |
| `deleteSession` | mutation | chat.create | `{ id }` |

### Router: `organization` (11 procedure)

| Procedura | Tipo | Permesso | Input |
|-----------|------|----------|-------|
| `get` | query | org | — |
| `update` | mutation | organization.update | `{ name?, slug?, logo? }` |
| `listMembers` | query | org | — |
| `updateMemberRole` | mutation | member.update | `{ memberId, role }` |
| `removeMember` | mutation | member.delete | `{ memberId }` |
| `listInvitations` | query | invitation.create | — |
| `createInvitation` | mutation | invitation.create | `{ email, role? }` |
| `cancelInvitation` | mutation | invitation.cancel | `{ invitationId }` |
| `myRole` | query | org | — |
| `leave` | mutation | org | — |
| `delete` | mutation | organization.delete | — |

### Router: `webhooks` (4 procedure)

| Procedura | Tipo | Permesso | Input |
|-----------|------|----------|-------|
| `list` | query | webhook.read | — |
| `create` | mutation | webhook.create | `{ url, events[] }` |
| `delete` | mutation | webhook.delete | `{ id }` |
| `toggle` | mutation | webhook.update | `{ id, active }` |

### Router: `billing` (2 procedure)

| Procedura | Tipo | Input | Output |
|-----------|------|-------|--------|
| `getUsage` | query | — | `{ plan, limits, usage, subscription }` |
| `getPlan` | query | — | `{ plan, limits }` |

### Router: `activityLog` (1 procedura)

| Procedura | Tipo | Input | Output |
|-----------|------|-------|--------|
| `list` | query | `{ limit?, offset? }` | Array con join attore (nome, email, immagine) |

### Router: `userPreferences` (2 procedure)

| Procedura | Tipo | Input |
|-----------|------|-------|
| `get` | query | — |
| `update` | mutation | `{ emailNotifications?, marketingEmails? }` |

---

## 8. REST API Pubblica

Framework: **Hono 4.7.10**
Mount: `/api/v1/`
File: `packages/rest-api/src/`

### Autenticazione

Header `Authorization: Bearer {api-key}` → validata via `auth.api.verifyApiKey()`

### Rate Limiting

- **Produzione**: Upstash Redis, sliding window, 100 richieste/ora
- **Sviluppo**: bypass con `SKIP_RATE_LIMIT=true`
- **Header risposta**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`

### Endpoint

#### Templates

| Metodo | Path | Descrizione |
|--------|------|-------------|
| `GET` | `/templates` | Lista template |
| `POST` | `/templates` | Crea template (richiede `name`, `schema`) |
| `GET` | `/templates/:id` | Dettaglio template |
| `PUT` | `/templates/:id` | Aggiorna template (parziale) |
| `DELETE` | `/templates/:id` | Elimina template |
| `POST` | `/templates/:id/duplicate` | Duplica template |

#### Generate

| Metodo | Path | Descrizione |
|--------|------|-------------|
| `POST` | `/generate` | Esporta spec JSON da template. Input: `{ templateId?, template?, data?, callbackUrl? }` |

#### Generations

| Metodo | Path | Descrizione |
|--------|------|-------------|
| `GET` | `/generations` | Lista generazioni (query: `limit`, `offset`) |
| `GET` | `/generations/:id` | Dettaglio generazione |
| `DELETE` | `/generations/:id` | Elimina generazione |

#### Usage

| Metodo | Path | Descrizione |
|--------|------|-------------|
| `GET` | `/usage` | Rate limit + statistiche uso mensile |

### Formato Risposta

```json
// Successo
{ "success": true, "data": { ... } }

// Errore
{ "success": false, "error": { "message": "...", "code": "..." } }
```

---

## 9. Template Engine (Core IP)

Pacchetto: `packages/template-engine/`
File schema: `src/schema/types.ts` (344 righe di definizioni Zod)

### Struttura Spec

```typescript
type Spec = {
  root: string                           // ID elemento Document
  elements: Record<string, Element>      // Mappa piatta tutti gli elementi
  state: Record<string, unknown>         // Dati dinamici
}

type Template = Spec & {
  id: string
  name: string
  version: number
  meta?: { author?, description?, tags?, category? }
}
```

### Tipi Elemento (14 tipi, PascalCase)

| Tipo | Categoria | Proprietà Principali |
|------|-----------|---------------------|
| `Document` | Struttura | title?, author?, subject? |
| `Page` | Struttura | size (A4/A3/A5/LETTER/LEGAL/TABLOID), orientation, margin* |
| `View` | Layout | padding*, margin, backgroundColor, border*, flex, alignItems, justifyContent |
| `Row` | Layout | gap, alignItems, justifyContent, padding, flex, wrap |
| `Column` | Layout | gap, alignItems, justifyContent, padding, flex |
| `Text` | Contenuto | text, fontSize, color, align, fontWeight, fontStyle, lineHeight |
| `Heading` | Contenuto | text, level (h1-h4), color, align |
| `Image` | Contenuto | src, width, height, objectFit |
| `Link` | Contenuto | text, href, fontSize, color |
| `Table` | Dati | columns[{header, width?, align?, field?}], rows[][], header*, striped |
| `List` | Dati | items[], ordered, fontSize, color, spacing |
| `Divider` | Decorativo | color, thickness, marginTop, marginBottom |
| `Spacer` | Decorativo | height |
| `PageNumber` | Pagina | format ("{pageNumber} / {totalPages}"), fontSize, color, align |

### Sistema Espressioni (Data Binding)

```typescript
// JSON Pointer — risolve valore da state
{ "$state": "/company/name" }

// String interpolation — testo con placeholder
{ "$template": "Fattura #{/invoiceNumber}" }

// Item context — campo dell'item corrente in un repeat
{ "$item": "name" }        // campo specifico
{ "$item": "" }            // intero item

// Index — indice corrente in un repeat
{ "$index": true }

// Condizionale — if/then/else
{ "$cond": { "$state": "/isPaid" }, "$then": "Pagato", "$else": "In attesa" }

// Computed — espressione server-side (non risolta client)
{ "$computed": "sum", "args": { "path": "/items/*/amount" } }
```

### Visibilità Condizionale

```typescript
// Mostra elemento solo quando stato corrisponde
visible: { "$state": "/status", "eq": "active" }
```

### Repeat (Iterazione Array)

```typescript
// Ripeti elemento per ogni item nell'array
repeat: { statePath: "/items", key: "id" }
// Dentro l'elemento: usa $item e $index
```

### Funzioni Utilità

#### Manipolazione (`src/utils/manipulation.ts`)

| Funzione | Descrizione |
|----------|-------------|
| `createEmptyTemplate(name, id?)` | Crea Document > Page vuoto (A4 portrait, margini 40pt) |
| `addElement(template, type, props?, options?)` | Aggiunge elemento con ID generato, auto-detect parent |
| `removeElement(template, elementId)` | Rimuove elemento + tutti i discendenti |
| `updateElement(template, elementId, updates)` | Merge shallow di props, visible, repeat |
| `moveElement(template, elementId, newParentId, index)` | Sposta elemento tra parent |
| `duplicateElement(template, elementId)` | Clona albero con nuovi ID |
| `updateState(template, pointer, value)` | Imposta valore nello state via JSON Pointer |
| `removeState(template, pointer)` | Rimuove chiave dallo state |
| `getPageElementId(template)` | Trova prima Page figlia di Document |

#### Data Binding (`src/utils/data-binding.ts`)

| Funzione | Descrizione |
|----------|-------------|
| `resolvePointer(state, pointer)` | Risolve JSON Pointer RFC 6901 |
| `resolveExpression(expr, ctx)` | Risolve qualsiasi tipo di espressione |
| `resolveProps(props, ctx)` | Risolve ricorsivamente tutte le espressioni nelle props |
| `evaluateVisible(visible, ctx)` | Valuta condizione di visibilità |

#### Validazione (`src/utils/validation.ts`)

| Funzione | Descrizione |
|----------|-------------|
| `validateTemplate(data)` | Safe parse con Zod, ritorna `{ success, data?, error? }` |
| `validateTemplateStrict(data)` | Throw su errore di validazione |

#### ID e Pagine

| Funzione | Descrizione |
|----------|-------------|
| `generateId(prefix)` | `${prefix}_${timestamp.toString(36)}_${counter}` |
| `PAGE_SIZES` | Dimensioni in punti: A3, A4, A5, LETTER, LEGAL, TABLOID |
| `getPageDimensions(pageProps)` | Width/height con orientamento |
| `getContentArea(pageProps)` | Area stampabile (dimensioni - margini) |

### Template Preset

4 template pronti all'uso:

1. **Invoice** — Fattura professionale (info azienda, tabella voci, totali)
2. **Invoice Repeat** — Fattura con righe dinamiche via repeat
3. **Report** — Report aziendale con sezioni
4. **Contract** — Contratto/accordo legale

### Export del Pacchetto

```typescript
// Entry point principali
"."           → Template, Spec, Element types + toSpec() + validation
"./schema"    → Tutti gli schema Zod
"./renderer"  → TemplateRenderer component
"./elements"  → Element registry
"./utils"     → Tutte le utility functions
"./defaults"  → Template preset
```

---

## 10. Visual Editor

### Architettura

Il visual editor è un'applicazione React complessa composta da:

- **Store** (`apps/web/lib/editor/use-editor-store.ts`) — State management con `useReducer`
- **Canvas** (`components/editor/editor-canvas.tsx`) — Rendering elementi con DnD
- **Properties Panel** (`components/editor/properties-panel.tsx`) — Editing proprietà
- **Components Panel** (`components/editor/components-panel.tsx`) — Palette elementi + albero
- **Toolbar** (`components/editor/editor-toolbar.tsx`) — Azioni globali
- **AI Assistant** (`components/editor/ai-assistant.tsx`) — Chat AI integrata
- **Context Menu** (`components/editor/element-context-menu.tsx`) — Menu contestuale
- **Import Modal** (`components/editor/import-modal.tsx`) — Import PDF/immagini
- **Variations Modal** (`components/editor/variations-modal.tsx`) — Variazioni AI

### Editor State

```typescript
type EditorState = {
  template: Template          // Template corrente
  selectedElementId: string | null
  hoveredElementId: string | null
  zoom: number               // 0.25 – 2.0
  isDirty: boolean           // Modifiche non salvate
  history: Template[]        // Stack undo (max 50)
  historyIndex: number       // Posizione corrente nello stack
}
```

### Azioni Disponibili (18 action types)

| Azione | Descrizione |
|--------|-------------|
| `SET_TEMPLATE` | Carica nuovo template, reset selezione |
| `SYNC_TEMPLATE` | Sync esterno, mantiene selezione se valida |
| `AI_UPDATE_TEMPLATE` | Aggiornamento da AI, push nella history |
| `ADD_ELEMENT` | Aggiunge elemento con tipo, parent, indice, props |
| `REMOVE_ELEMENT` | Rimuove elemento + pulizia state orfano |
| `UPDATE_ELEMENT` | Aggiorna props di un elemento |
| `SET_REPEAT` | Configura/rimuove repeat su un elemento |
| `MOVE_ELEMENT` | Sposta elemento tra parent diversi |
| `DUPLICATE_ELEMENT` | Duplica albero elemento |
| `SELECT_ELEMENT` | Seleziona elemento (o null per deselezionare) |
| `HOVER_ELEMENT` | Hover su elemento (o null) |
| `SET_ZOOM` | Imposta livello zoom |
| `UPDATE_PAGE_PROPS` | Aggiorna proprietà pagina |
| `UPDATE_DOCUMENT_PROPS` | Aggiorna proprietà documento |
| `UPDATE_TEMPLATE_NAME` | Rinomina template |
| `SET_STATE` | Imposta valore state via JSON Pointer |
| `REMOVE_STATE` | Rimuove chiave dallo state |
| `UNDO` / `REDO` | Navigazione history (max 50 step) |
| `MARK_SAVED` | Resetta flag isDirty |

### Canvas (DnD)

- Usa `@dnd-kit/core` + `@dnd-kit/sortable`
- Elementi draggabili dalla palette componenti al canvas
- Elementi riordinabili all'interno dei container (Row, Column, View)
- Outline blu solid per elemento selezionato, dashed per hover
- Badge `↻ repeat` su elementi con configurazione repeat
- Rendering a dimensioni reali della pagina con zoom scalabile

### Properties Panel

Editor proprietà contestuale per tipo:
- **Text/Heading**: textarea per testo, font size, colore, allineamento, peso, stile
- **Image**: src, dimensioni, object-fit
- **Table**: editor colonne (add/remove), griglia righe, colori header, striped
- **Row/Column**: gap, align, justify, padding, flex
- **View**: padding (4 lati), margine, background, bordo, flex layout
- **Divider/Spacer**: dimensioni e stile
- **Page**: size, orientation, margini, background
- **Repeat config**: dialog con statePath e key

### Shortcuts

- `Cmd+Z` / `Ctrl+Z` → Undo
- `Cmd+Shift+Z` / `Ctrl+Shift+Z` → Redo
- `Cmd+Shift+R` → Variazioni AI
- `d` → Toggle dark/light mode

---

## 11. Integrazione AI

### Chat Editor (`/api/chat/editor`)

**Modello**: `anthropic/claude-sonnet-4` via AI Gateway
**Framework**: Vercel AI SDK v6 (`streamText` + `createUIMessageStream`)

#### Tool AI Disponibili (9)

| Tool | Parametri | Descrizione |
|------|-----------|-------------|
| `createTemplate` | name, pageSize?, orientation?, margins | Inizializza template vuoto |
| `batchAddElements` | elements[{type, props, parentId?}] | Creazione bulk con riferimenti `$N` |
| `batchUpdateState` | entries[{pointer, value}] | Aggiornamento bulk state |
| `addElement` | type, props, parentId? | Aggiunge singolo elemento |
| `updateElement` | elementId, props | Modifica proprietà elemento |
| `removeElement` | elementId | Rimuove elemento |
| `setPageSettings` | size?, orientation?, margins, bg | Imposta pagina |
| `updateState` | pointer, value | Imposta valore state |
| `saveTemplate` | reason? | Salva template nel database |

#### Flusso Streaming

1. L'utente invia messaggio nel chat panel
2. Il server crea un `UIMessageStream` bidirezionale
3. L'AI genera testo + chiama tool per manipolare il template
4. Ogni tool call invia un `data-template-update` al client
5. Il client applica le modifiche allo store via `AI_UPDATE_TEMPLATE`
6. Il tool `saveTemplate` persiste nel database

#### Sistema di Crediti AI

| Piano | Crediti/mese |
|-------|-------------|
| Free | 10 |
| Pro | 500 |
| Enterprise | Illimitati |

Tracking via Polar con meter ID.

### Import Intelligente (`lib/actions/import.ts`)

- **Input**: PDF, PNG, JPG, JPEG, WebP (base64 o URL)
- **Modello**: `anthropic/claude-sonnet-4` con vision
- **Output**: Template JSON spec completa
- L'AI analizza il layout visuale e genera elementi corrispondenti

### Variazioni AI (`lib/actions/variations.ts`)

- **Trigger**: Context menu → "AI Variations" o `Cmd+Shift+R`
- **Scope**: layout, colors, typography, content, all
- **Output**: Array di variazioni `{ label, props }` applicabili all'elemento
- Preview prima di applicare

---

## 12. SDK npm

Pacchetto: `packages/sdk/`
Nome: `@pdf-generator/sdk`

### Classe: `SpecDesignerClient`

```typescript
const client = new SpecDesignerClient({
  apiKey: "sk-...",
  baseUrl: "https://specdesigner.com"
})
```

### Metodi (11)

| Metodo | Return | Descrizione |
|--------|--------|-------------|
| `listTemplates()` | `Promise<Template[]>` | GET `/api/v1/templates` |
| `getTemplate(id)` | `Promise<Template>` | GET `/api/v1/templates/:id` |
| `createTemplate(input)` | `Promise<Template>` | POST `/api/v1/templates` |
| `updateTemplate(id, input)` | `Promise<Template>` | PUT `/api/v1/templates/:id` |
| `deleteTemplate(id)` | `Promise<void>` | DELETE `/api/v1/templates/:id` |
| `duplicateTemplate(id)` | `Promise<Template>` | POST `/api/v1/templates/:id/duplicate` |
| `exportSpec(input)` | `Promise<ExportResult>` | POST `/api/v1/generate` |
| `listGenerations(options?)` | `Promise<Generation[]>` | GET `/api/v1/generations` |
| `getGeneration(id)` | `Promise<Generation>` | GET `/api/v1/generations/:id` |
| `deleteGeneration(id)` | `Promise<void>` | DELETE `/api/v1/generations/:id` |
| `getUsage()` | `Promise<UsageInfo>` | GET `/api/v1/usage` |

### Gestione Errori

```typescript
class SpecDesignerError extends Error {
  code: string    // es. "NOT_FOUND", "UNAUTHORIZED"
  status: number  // HTTP status code
}
```

### Alias Retrocompatibilità

```typescript
PdfGeneratorClient = SpecDesignerClient   // deprecated
PdfGeneratorError = SpecDesignerError     // deprecated
```

---

## 13. MCP Server

Pacchetto: `packages/mcp/`
Protocollo: Model Context Protocol (integrazione Claude, Cursor, altri agent AI)

### Setup

```typescript
import { createMcpServer } from "@workspace/mcp"

const server = createMcpServer(apiKey, baseUrl, {
  onMutation: (event) => { /* notifica sync */ }
})
```

### Transport

| Tipo | Uso |
|------|-----|
| `stdio` | Connessione diretta (Claude locale) |
| `HTTP` | Endpoint remoto (`/api/mcp`) |
| `Polling` | Sync bidirezionale via `/api/sync/poll` |

### Risorse (2)

| URI | Descrizione |
|-----|-------------|
| `pdfcreator://templates` | Lista tutti i template (JSON) |
| `pdfcreator://templates/{id}` | Dettaglio template con spec completa |

### Tool (11)

| Tool | Parametri | Descrizione |
|------|-----------|-------------|
| `list_templates` | search?, status? | Cerca e lista template |
| `get_template` | templateId | Template completo con spec |
| `create_template` | name, pageSize?, orientation? | Crea template vuoto |
| `update_template_info` | templateId, name?, description?, status? | Aggiorna metadata |
| `add_element` | templateId, type, props, parentId?, index? | Aggiunge elemento |
| `update_element` | templateId, elementId, props | Modifica proprietà |
| `remove_element` | templateId, elementId | Rimuove elemento |
| `move_element` | templateId, elementId, parentId?, index | Riposiziona elemento |
| `update_state` | templateId, pointer, value | Imposta stato via JSON Pointer |
| `export_spec` | templateId, data? | Genera spec json-render |
| `delete_template` | templateId | Elimina permanentemente |

### Prompt (3)

| Prompt | Argomenti | Descrizione |
|--------|-----------|-------------|
| `improve_layout` | templateId | Analisi e suggerimenti layout |
| `generate_from_description` | description, pageSize? | Genera template da testo libero |
| `translate_content` | templateId, language | Traduce contenuti testuali |

### Variabili Ambiente

```
PDFCREATOR_API_KEY    → API key per autenticazione
PDFCREATOR_URL        → Base URL (default: https://specdesigner.com/api/v1)
```

---

## 14. Server Actions

Directory: `apps/web/lib/actions/`

Le server actions sono wrapper sottili sulle procedure tRPC, usate dal frontend Next.js.

### `templates.ts`
- `getTemplates(input?)` → Lista con filtri e paginazione
- `getTemplate(id)` → Dettaglio singolo
- `createTemplate({name, description?, schema})` → Crea
- `updateTemplate({id, ...})` → Aggiorna
- `deleteTemplate(id)` → Elimina
- `duplicateTemplate(id)` → Duplica
- `getTemplateGallery()` → Template preset dalla gallery

### `generations.ts`
- `getGenerations(input?)` → Lista export con limit/offset
- `getGeneration(id)` → Dettaglio singolo

### `chat.ts`
- `getChatSessions()` → Lista sessioni chat
- `getChatMessages(sessionId)` → Messaggi di una sessione
- `createChatSession({templateId?})` → Nuova sessione

### `organization.ts`
- `getOrganization()` / `updateOrganization({name?, slug?, logo?})`
- `listMembers()` / `updateMemberRole({memberId, role})` / `removeMember(memberId)`
- `listInvitations()` / `createInvitation({email, role?})` / `cancelInvitation(id)`
- `getMyRole()` / `leaveOrganization()` / `deleteOrganization()`

### `webhooks.ts`
- `getWebhooks()` / `createWebhook({url, events[]})` / `deleteWebhook(id)` / `toggleWebhook(id, active)`

### `import.ts`
- `importFromUrl({url})` → Import da URL (PDF/immagine)
- `importFromFile({fileBase64, mimeType})` → Import da file upload
- Usa AI vision per convertire in JSON spec

### `variations.ts`
- `generateVariations(template, elementId, scope)` → Variazioni AI per elemento
- Scope: `"layout" | "colors" | "typography" | "content" | "all"`

### `pdf.ts`
- `generatePdfPreview(template)` → Preview base64

---

## 15. Routing e Pagine

### Marketing (route group `(marketing)`)

| Path | Descrizione |
|------|-------------|
| `/` | Landing page (hero, features, CTA) |
| `/features` | Showcase funzionalità |
| `/pricing` | Piani e prezzi |
| `/blog` | Blog con articoli |
| `/contact` | Form di contatto |
| `/docs` | Hub documentazione (layout con sidebar) |
| `/docs/quickstart` | Guida rapida |
| `/docs/api` | Documentazione API REST |
| `/docs/sdk` | Documentazione SDK |
| `/docs/templates` | Guida schema template |
| `/docs/webhooks` | Guida webhook |
| `/docs/mcp` | Guida MCP Server |

Layout: `MarketingHeader` + contenuto + `MarketingFooter`

### Autenticazione (route group `(auth)`)

| Path | Descrizione |
|------|-------------|
| `/login` | Login (email/password + OAuth Google/GitHub) |
| `/register` | Registrazione |
| `/forgot-password` | Recupero password |
| `/reset-password` | Reset password (con token) |
| `/verify-email` | Verifica email |

Layout: UI centrata per auth

### Dashboard (protetto)

| Path | Descrizione |
|------|-------------|
| `/dashboard` | Home — KPI cards, attività recenti |
| `/dashboard/templates` | Lista template con filtri, ricerca, ordinamento |
| `/dashboard/templates/gallery` | Gallery template preset |
| `/dashboard/editor` | Editor visuale completo |
| `/dashboard/chat` | Chat AI per template |
| `/dashboard/exports` | Storico export/generazioni |
| `/dashboard/api-keys` | Gestione chiavi API |
| `/dashboard/docs` | Documentazione in-app |
| `/dashboard/admin` | Pannello admin (solo superadmin/admin) |
| `/dashboard/settings` | Settings con 6 tab |

Layout: `Header` + `IconSidebar` (56px, icon-only) + area contenuto + `MobileNav`

#### Tab Settings

| Tab | Sotto-tab | Contenuto |
|-----|-----------|-----------|
| Profile | — | Nome, email, avatar |
| Workspace | General / Members / Activity | Info org, gestione membri, activity log |
| Security | Password / 2FA / Sessions | Cambio password, TOTP, sessioni attive |
| Billing | — | Piano, usage, upgrade (Polar) |
| Webhooks | — | Lista, crea, elimina, toggle |
| Danger Zone | — | Eliminazione organizzazione |

### API Routes

| Path | Metodo | Descrizione |
|------|--------|-------------|
| `/api/auth/[...all]` | * | Better Auth handler |
| `/api/trpc/[trpc]` | POST | tRPC bridge |
| `/api/chat` | POST | Chat AI streaming |
| `/api/chat/editor` | POST | Chat AI per editor visuale |
| `/api/variations` | POST | Generazione variazioni AI |
| `/api/v1/[[...path]]` | * | REST API pubblica (Hono) |
| `/api/mcp` | POST | MCP HTTP transport |
| `/api/sync/poll` | GET | Polling sync per MCP |

---

## 16. Sistema UI e Design

### Libreria Componenti

**Base (`packages/ui/src/components/`)**: 24 componenti shadcn/ui v4
- accordion, avatar, badge, breadcrumb, button, card, chart, checkbox, dialog, dropdown-menu, field, input, input-group, label, navigation-menu, progress, select, separator, sheet, sidebar, skeleton, switch, table, textarea, tooltip

**Shared (`packages/ui/src/components/shared/`)**: 8 componenti riutilizzabili
- animated-tabs, data-table (con `renderMobileCard`), footer, marquee, navbar, page-shell, page-title, table-page-skeleton

**Dashboard (`packages/ui/src/components/dashboard/`)**: charts, stats

**Landing (`packages/ui/src/components/landing/`)**: blog, contact, cta, faq, features, footer, logo-cloud, newsletter, pricing, testimonials

### Componenti App (`apps/web/components/`)

- **Layout**: header, icon-sidebar, mobile-nav, org-guard, impersonation-banner, theme-provider, trpc-provider
- **Dashboard**: kpi-cards, main-content, sidebar-cards
- **Editor**: 9 componenti (vedi sezione 10)
- **Marketing**: marketing-header, marketing-footer, docs-search, docs-components
- **AI**: suggestion, suggestions-config

### Tema Colori

Sistema OKLCH neutro (nessun colore brand: no teal, blu, viola).

```css
/* Light mode */
--background: oklch(1 0 0)           /* Bianco */
--foreground: oklch(0.145 0 0)       /* Quasi nero */
--primary: oklch(0.205 0 0)          /* Grigio scuro */
--border: oklch(0.922 0 0)           /* Grigio chiaro */

/* Dark mode (default) */
--background: oklch(0.145 0 0)       /* Quasi nero */
--foreground: oklch(0.985 0 0)       /* Quasi bianco */
--primary: oklch(0.87 0.00 0)        /* Grigio chiaro */
--card: oklch(0.205 0 0)             /* Card grigio scuro */
--border: oklch(1 0 0 / 10%)         /* Bordo trasparente */
```

### CSS Dashboard Custom

```css
.dashboard-panel    /* Sfondo con glass-morphism, bordo arrotondato */
.dash-card          /* Card con backdrop-blur, bordo, ombra */
.dash-card-inner    /* Inner card con sfondo solido */
.dash-btn-details   /* Bottone con hover trasparente */
```

### Skeleton Loading (convenzione obbligatoria)

Ogni pagina dashboard ha un file `loading.tsx` con skeleton responsive:
- `hidden sm:grid` per desktop
- `sm:hidden` per mobile
- Componenti riutilizzabili: `TablePageSkeleton`

---

## 17. Sistema di Animazione

File: `packages/ui/src/lib/animation.ts`
Provider: `apps/web/providers/motion-provider.tsx` → `<MotionConfig reducedMotion="user">`
Import: `from "@workspace/ui/lib/animation"`

### Spring Presets

| Preset | Stiffness | Damping | Uso |
|--------|-----------|---------|-----|
| `spring.default` | 300 | 30 | Modali, card |
| `spring.gentle` | 200 | 24 | Tooltip, reveal |
| `spring.bouncy` | 400 | 25 | Bottoni, toggle |
| `spring.snappy` | 420 | 32 | Input glow, progress |
| `spring.micro` | 400 | 17 | Micro-interazioni |
| `spring.toggle` | 700 | 30 | Switch, toggle |
| `spring.layout` | duration: 0.4, bounce: 0.15 | — | layoutId, tab |

### Transition Presets

| Preset | Durata | Uso |
|--------|--------|-----|
| `transition.fast` | 0.2s | Fade/slide semplici |
| `transition.normal` | 0.35s | Transizioni contenuto |
| `transition.slow` | 0.5s | Entrate sezione |
| `transition.stagger` | configurabile | staggerChildren |

### Varianti (hidden → visible)

| Variante | Effetto |
|----------|---------|
| `scrollReveal` | opacity 0→1, y 24→0 |
| `staggerContainer()` | opacity + staggerChildren |
| `staggerItem` | opacity 0→1, y 12→0 |
| `popIn` | opacity 0→1, scale 0.92→1 |
| `slideIn(direction)` | Slide da left/right/up/down |
| `fade` | opacity transition |
| `containerVariants` | opacity + scale con stagger |
| `contentVariants` | opacity + x slide |
| `itemVariants` | opacity + y slide |

### Hover/Tap

```
hover.lift      → y: -2
hover.scale     → scale: 1.02
hover.card      → y: -4, scale: 1.01
tap.press       → scale: 0.97
tap.deep        → scale: 0.95
scale.subtle    → hover 1.02 / tap 0.98
scale.standard  → hover 1.05 / tap 0.95
```

### Keyframe

```
keyframes.pulse → scale [1, 1.3, 1]
keyframes.shake → x: [0, -3, 3, -3, 3, 0]
keyframes.ring  → rotate: [0, ±15, ±10, ±5, 0]
```

---

## 18. Billing e Piani

File: `packages/api/src/lib/quota.ts`
Provider: Polar (condizionale su env vars)

### Piani

| Feature | Free | Pro | Enterprise |
|---------|------|-----|-----------|
| Export/mese | 100 | 5.000 | ∞ |
| Template | 3 | ∞ | ∞ |
| Membri | 1 | 5 | ∞ |
| Crediti AI | 10 | 500 | ∞ |
| Webhook | ✗ | ✓ | ✓ |
| MCP | ✗ | ✓ | ✓ |
| Credit Pack | ✗ | ✓ | ✗ |

### Prodotti Polar

- Pro Plan
- Enterprise Plan
- AI Credits Pack: 100, 500, 1.000

### Feature Gating

```typescript
getOrgPlan(db, organizationId)        // Ritorna piano corrente (default: "free")
assertFeatureAccess(plan, feature)     // Throw se feature non disponibile nel piano
checkAiCredits()                       // Verifica crediti AI residui
trackAiUsage()                         // Traccia utilizzo crediti AI
```

---

## 19. Webhook System

### Dispatcher (`packages/api/src/lib/webhook-dispatcher.ts`)

```typescript
dispatchWebhookEvent(db, organizationId, event, payload)
```

### Eventi Supportati

| Evento | Trigger |
|--------|---------|
| `template.created` | Creazione template |
| `template.updated` | Aggiornamento template |
| `template.deleted` | Eliminazione template |
| `template.duplicated` | Duplicazione template |
| `generation.completed` | Export spec completato |

### Sicurezza

- **Signing**: HMAC con secret per webhook
- **Validazione URL**: Zod `z.string().url()`
- **Toggle**: Attivazione/disattivazione per webhook
- **Lista eventi**: Minimo 1 evento richiesto

---

## 20. Testing

### Test Unitari (Vitest) — 94+ test, 20 file

#### Template Engine (8 file)

| File | Focus |
|------|-------|
| `schema.test.ts` | Validazione Zod schema |
| `validation.test.ts` | validateTemplate, validateTemplateStrict |
| `defaults.test.ts` | Template preset rendering |
| `data-binding.test.ts` | Risoluzione espressioni ($state, $template, $item, $cond) |
| `element-registry.test.ts` | Registry elementi |
| `manipulation.test.ts` | addElement, removeElement, moveElement, duplicateElement |
| `page.test.ts` | Dimensioni pagina, content area |
| `id.test.ts` | Generazione ID stabile |
| `types-helpers.test.ts` | Type helper functions |

#### API (2 file)

| File | Focus |
|------|-------|
| `trpc.test.ts` | Procedure tRPC, context, middleware |
| `webhook-dispatcher.test.ts` | Dispatch eventi, HMAC signing |

#### SDK (1 file)

| File | Focus |
|------|-------|
| `client.test.ts` | Tutti 11 metodi, error handling, SpecDesignerError |

#### MCP (1 file)

| File | Focus |
|------|-------|
| `server.test.ts` | Inizializzazione server, 10 tool, 2 risorse, 3 prompt |

#### Web App (7 file)

| File | Focus |
|------|-------|
| `api-auth.test.ts` | Autenticazione API |
| `api-response.test.ts` | Formato risposte |
| `with-api-key.test.ts` | Middleware API key |
| `rate-limit.test.ts` | Rate limiting |
| `variations-schema.test.ts` | Schema variazioni AI |
| `import-build-template.test.ts` | Build template da import AI |
| `utils.test.ts` | Utility functions |

### Test E2E (Playwright) — 13 test, 3 file

| File | Test | Copertura |
|------|------|-----------|
| `auth.spec.ts` | 5 | Login, registrazione, verifica email, 2FA, reset password |
| `dashboard.spec.ts` | 4 | Lista template, creazione, editing, eliminazione |
| `marketing.spec.ts` | 4 | Landing page, navigazione docs, form contatto |

### Comandi

```bash
pnpm test           # Vitest (tutti i test unitari)
pnpm test:e2e       # Playwright (headless Chrome)
pnpm test:coverage  # Coverage report (v8 provider)
```

### Coverage Configurata

Pacchetti tracciati:
- `packages/api/src/**`
- `packages/template-engine/src/**`
- `packages/sdk/src/**`
- `packages/mcp/src/**`
- `packages/auth/src/**`
- `apps/web/lib/**`

---

## 21. Variabili d'Ambiente

File: `apps/web/lib/env.ts` (validazione via `@t3-oss/env-nextjs`)

### Server-Side

| Variabile | Tipo | Obbligatoria | Descrizione |
|-----------|------|-------------|-------------|
| `DATABASE_URL` | string | No | URL PostgreSQL (Neon) |
| `BETTER_AUTH_SECRET` | string (min 32) | Sì | Secret per auth |
| `BETTER_AUTH_URL` | URL | Sì | Base URL auth |
| `GOOGLE_CLIENT_ID` | string | No | OAuth Google |
| `GOOGLE_CLIENT_SECRET` | string | No | OAuth Google |
| `GITHUB_CLIENT_ID` | string | No | OAuth GitHub |
| `GITHUB_CLIENT_SECRET` | string | No | OAuth GitHub |
| `AI_GATEWAY_URL` | string | No | URL AI Gateway |
| `AI_GATEWAY_API_KEY` | string | No | Chiave AI Gateway |
| `BLOB_READ_WRITE_TOKEN` | string | No | Vercel Blob storage |
| `UPSTASH_REDIS_REST_URL` | string | No | Redis per rate limit |
| `UPSTASH_REDIS_REST_TOKEN` | string | No | Token Redis |
| `SKIP_RATE_LIMIT` | boolean | No (default: false) | Bypass rate limit in dev |
| `POLAR_ACCESS_TOKEN` | string | No | Polar billing |
| `POLAR_WEBHOOK_SECRET` | string | No | Polar webhook signing |
| `POLAR_AI_METER_ID` | string | No | Meter ID crediti AI |
| `POLAR_PRO_PRODUCT_ID` | string | No | Prodotto Pro |
| `POLAR_ENTERPRISE_PRODUCT_ID` | string | No | Prodotto Enterprise |
| `POLAR_CREDITS_100_PRODUCT_ID` | string | No | Pack 100 crediti |
| `POLAR_CREDITS_500_PRODUCT_ID` | string | No | Pack 500 crediti |
| `POLAR_CREDITS_1000_PRODUCT_ID` | string | No | Pack 1000 crediti |

### Client-Side

| Variabile | Tipo | Obbligatoria | Descrizione |
|-----------|------|-------------|-------------|
| `NEXT_PUBLIC_APP_URL` | URL | Sì | URL pubblico dell'app |

### Skip Validazione

`SKIP_ENV_VALIDATION=true` per CI/testing.

---

## 22. Build e Deploy

### Turborepo (`turbo.json`)

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"],
      "env": ["DATABASE_URL", "BETTER_AUTH_SECRET", "BETTER_AUTH_URL", "NEXT_PUBLIC_APP_URL"]
    },
    "dev": { "cache": false, "persistent": true },
    "lint": { "dependsOn": ["^lint"] },
    "typecheck": { "dependsOn": ["^typecheck"] }
  }
}
```

### Script Principali

```bash
pnpm dev          # Avvia tutti i pacchetti in dev (Turbopack)
pnpm build        # Build produzione
pnpm lint         # Lint tutti i pacchetti
pnpm format       # Format con Prettier
pnpm typecheck    # Type checking TypeScript
pnpm db:push      # Sync schema DB
pnpm db:seed      # Popola dati iniziali
pnpm test         # Test unitari (Vitest)
pnpm test:e2e     # Test E2E (Playwright)
```

### Target di Deploy

| Servizio | Uso |
|----------|-----|
| Vercel | Frontend Next.js (ottimizzato) |
| Neon | Database PostgreSQL (serverless) |
| Upstash | Redis per rate limiting (serverless) |
| Resend | Email transazionali |
| Vercel AI Gateway | Routing modelli AI |
| Polar | Billing e subscription |
| npm | Pubblicazione SDK |

### CI/CD

Attualmente non configurato (nessun GitHub Actions). Predisposto per:
- Build + typecheck + lint + test su PR
- Deploy automatico su merge in main (Vercel)
- Pubblicazione SDK su npm

---

## 23. Fasi di Sviluppo Completate

Tutte le 11 fasi del PRD sono state implementate e verificate.

| Fase | Descrizione | Stato |
|------|-------------|-------|
| **1** | Database, Auth, tRPC, API pubblica, validazione env | ✅ |
| **2** | Template Schema Zod, React Renderer, Element Registry | ✅ |
| **3** | Template CRUD dashboard, gallery, filtri, ricerca | ✅ |
| **4** | Visual Editor (DnD, properties, toolbar, canvas) | ✅ |
| **5** | AI Chat Agent (Vercel AI SDK v6, tool, streaming) | ✅ |
| **6** | REST API endpoints (Hono), API Keys, npm SDK | ✅ |
| **7** | Export History, generazioni tracking, delete | ✅ |
| **8** | Webhooks, Settings completa, Team Management, Activity Log | ✅ |
| **9** | Import Intelligente (AI vision: PDF/immagini → JSON spec) | ✅ |
| **10** | Remix / Variazioni AI (context menu, scope selector, preview, apply) | ✅ |
| **11** | MCP Server (10 tool, 3 prompt, 2 risorse, stdio+HTTP, sync bidirezionale) | ✅ |

### Fasi Aggiuntive Completate

| Fase | Descrizione | Stato |
|------|-------------|-------|
| **Migration** | Da PDF Generator a JSON Spec Editor (7 sotto-fasi A-G) | ✅ |
| **Testing** | Vitest (94 unit test) + Playwright (13 E2E test) | ✅ |

---

## File di Riferimento Chiave

| File | Importanza | Righe | Descrizione |
|------|-----------|-------|-------------|
| `packages/template-engine/src/schema/types.ts` | CRITICO | 344 | Schema Zod completo del template engine |
| `packages/api/src/trpc.ts` | CRITICO | ~120 | Context, middleware, procedure types |
| `packages/auth/src/permissions.ts` | ALTO | ~100 | Sistema RBAC completo |
| `packages/mcp/src/server.ts` | ALTO | ~500 | MCP server con 10 tool |
| `apps/web/app/api/chat/editor/route.ts` | ALTO | ~300 | AI system prompt + 9 tool |
| `apps/web/lib/editor/use-editor-store.ts` | ALTO | ~350 | State management editor |
| `apps/web/components/editor/editor-canvas.tsx` | ALTO | ~400 | Canvas rendering + DnD |
| `packages/rest-api/src/index.ts` | MEDIO | ~50 | Entry point REST API |
| `packages/sdk/src/client.ts` | MEDIO | ~150 | SDK client class |
| `packages/ui/src/lib/animation.ts` | MEDIO | ~200 | Sistema animazione centralizzato |
| `packages/ui/src/styles/globals.css` | MEDIO | ~250 | Tema OKLCH + CSS custom |
| `PRD.md` | RIFERIMENTO | 450+ | Product Requirements Document completo |
