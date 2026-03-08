# PDF Generator SaaS — Product Requirements Document

## Vision

Piattaforma SaaS per generare PDF in modo visuale, con AI, o via API. Ispirata a `vercel-labs/json-render` (flat element map JSON, catalog/registry pattern, streaming via JSON Patch).

---

## Status Attuale

### Completato
- Monorepo Turborepo + pnpm (apps/web, packages/ui, eslint-config, typescript-config)
- Layout marketing (landing `/`, features, pricing, docs, blog) con header/footer
- Layout dashboard (`/dashboard`) con header, icon sidebar, KPI cards, sidebar cards, main grid
- 33+ componenti UI shadcn (base-vega, @base-ui/react, preset aIkfGvY)
- Tema neutro OKLCH dark/light con hotkey toggle
- Sotto-pagine dashboard placeholder (templates, editor, chat, exports, api-keys, settings)
- Framer Motion animations

### Mancante
- Backend (API routes, server actions)
- Database + ORM
- Autenticazione
- Engine di generazione PDF
- JSON Template Schema
- Visual Editor funzionante
- AI Chat Agent
- REST API + npm SDK
- Test
- CI/CD
- Deployment

---

## Architettura Monorepo

### Packages (shared)
| Package | Scopo | Fase |
|---|---|---|
| `packages/db/` | Drizzle schema + client Neon | 1 |
| `packages/api/` | tRPC routers — unica fonte di business logic | 1 |
| `packages/auth/` | Better Auth config condiviso tra app | 1 |
| `packages/ui/` | Componenti UI shadcn (esistente) | - |
| `packages/template-engine/` | JSON schema + renderer PDF | 2 |
| `packages/sdk/` | npm SDK per clienti esterni | 6 |
| `packages/events/` | Event types + queue (Inngest/Trigger.dev) | 7 |
| `packages/eslint-config/` | ESLint config condivisa (esistente) | - |
| `packages/typescript-config/` | TypeScript config condivise (esistente) | - |

### Apps (consumers)
| App | Scopo | Fase |
|---|---|---|
| `apps/web/` | SaaS principale (dashboard + marketing) | 1 |
| `apps/admin/` | Pannello admin interno (futuro) | post-launch |
| `apps/docs/` | Documentazione standalone (futuro) | post-launch |
| `apps/worker/` | Background jobs: PDF gen, cleanup (futuro) | post-launch |

### Regole di Comunicazione
1. **Nessuna app accede al DB direttamente** → sempre via `packages/db/`
2. **Nessuna app ha business logic propria** → sempre via `packages/api/` (tRPC)
3. **REST `/api/v1/` è solo un adapter** → chiama tRPC, zero logica duplicata
4. **Server Actions sono convenienze** → wrappano tRPC per il frontend web
5. **Auth è condiviso** → `packages/auth/` esporta config, ogni app lo importa
6. **Eventi sono tipizzati** → `packages/events/` definisce tipi, publisher e consumer

### Flussi di Comunicazione
| Chi → Chi | Come | Dove |
|---|---|---|
| Frontend → Backend (stesso app) | Server Actions + Server Components | `apps/web/lib/actions/` |
| App → App (interno monorepo) | tRPC caller | `packages/api/` |
| Esterno → Piattaforma | REST `/api/v1/` + API key (Better Auth) | `apps/web/app/api/v1/` |
| Piattaforma → Esterno | Webhooks HTTP | `packages/events/` |
| Real-time (futuro) | SSE / WebSocket | `apps/web/app/api/` |
| Background jobs (futuro) | Event queue (Inngest/Trigger.dev) | `apps/worker/` |
| SDK → REST | HTTP client wrapper | `packages/sdk/` |

---

## Fasi di Sviluppo

---

### FASE 1 — Infrastruttura Backend
> Database, autenticazione, configurazione ambiente

#### 1.1 Environment & Configuration
- [ ] Creare `.env.local` e `.env.example` con variabili necessarie
- [ ] Configurare `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`
- [ ] Configurare `VERCEL_AI_GATEWAY_URL` per AI Gateway
- [ ] Aggiungere validazione env con `@t3-oss/env-nextjs` e Zod

#### 1.2 Database Setup
- [ ] Installare Drizzle ORM + `drizzle-kit` + `@neondatabase/serverless`
- [ ] Creare `packages/db/` come pacchetto workspace condiviso
- [ ] Definire schema Drizzle per tabelle applicative (Better Auth gestisce le sue):
  - `templates` (id, name, description, schema JSON, thumbnail, organizationId, createdBy, isPublic, createdAt, updatedAt)
  - `generations` (id, templateId, data JSON, outputUrl, status, format, organizationId, createdBy, createdAt)
  - `chat_sessions` (id, templateId, organizationId, createdBy, createdAt)
  - `chat_messages` (id, sessionId, role, content, createdAt)
  - `webhooks` (id, url, events, secret, organizationId, active, createdAt)
  - Note: tabelle auth (users, sessions, accounts, organizations, api_keys) gestite da Better Auth
- [ ] Configurare `drizzle.config.ts`
- [ ] Creare script di migrazione (`pnpm db:push`, `pnpm db:generate`, `pnpm db:studio`)
- [ ] Seed iniziale con dati demo

#### 1.3 Autenticazione (Better Auth)
- [ ] Installare `better-auth` + `@better-auth/client`
- [ ] Configurare `lib/auth.ts` con adapter Drizzle + Neon
- [ ] Plugin Better Auth:
  - `organization` — gestione org + team + membri + ruoli + inviti
  - `twoFactor` — 2FA opzionale
  - `magicLink` — login via magic link
  - `admin` — pannello admin
- [ ] Provider: Email/Password, Google OAuth, GitHub OAuth
- [ ] Creare `lib/auth-client.ts` per il client-side
- [ ] Creare pagine auth in route group `(auth)`:
  - `/login` — login con email/password + OAuth
  - `/register` — registrazione + creazione org
  - `/forgot-password` — reset password
  - `/verify-email` — verifica email
- [ ] Middleware (`middleware.ts`) per protezione route `/dashboard/*`
- [ ] Aggiornare UserMenu dropdown con dati utente reali + logout
- [ ] Aggiornare header dashboard con avatar e nome utente

#### 1.4 tRPC (comunicazione interna monorepo)
- [ ] Creare `packages/api/` come pacchetto workspace condiviso
- [ ] Installare `@trpc/server`, `@trpc/client`, `@trpc/next` + `superjson`
- [ ] Configurare tRPC context con sessione Better Auth + DB
- [ ] Creare router base con procedure protette (requireAuth middleware)
- [ ] Router iniziali (placeholder):
  - `templates` — CRUD template
  - `generations` — lista/dettaglio generazioni
  - `chat` — sessioni e messaggi chat
  - `webhooks` — CRUD webhooks
- [ ] Setup tRPC client nel frontend (`apps/web/lib/trpc.ts`)
- [ ] Server Actions in `apps/web/lib/actions/` per mutazioni frontend

#### 1.5 API Pubblica Foundation
- [ ] Creare `app/api/v1/` directory per endpoint REST pubblici
- [ ] API key authentication via Better Auth plugin `apiKey`
- [ ] Rate limiting:
  - Produzione: `@upstash/ratelimit` + `@upstash/redis`
  - Sviluppo: bypass con flag `SKIP_RATE_LIMIT=true`
- [ ] Utility risposte standardizzate (success, error, pagination)
- [ ] Error handling globale con logging

---

### FASE 2 — JSON Template Schema & Renderer
> Cuore del prodotto: lo schema JSON e il renderer React

#### 2.1 Template Schema Definition
- [ ] Creare `packages/template-engine/` come pacchetto workspace
- [ ] Definire lo schema JSON TypeScript (ispirato a json-render):
  ```
  Template {
    id, name, version, meta (pageSize, orientation, margins)
    elements: Record<string, Element>
    rootId: string
  }
  Element {
    type: string (text, heading, image, table, row, column, spacer, divider, chart, list, container)
    props: Record<string, any>
    children?: string[] (riferimenti ad altri element IDs)
    styles?: CSSProperties
  }
  ```
- [ ] Validazione schema con Zod
- [ ] Utility per manipolazione schema (addElement, removeElement, updateElement, moveElement)
- [ ] Template di default pre-costruiti (invoice, report, contract, catalog, certificate)

#### 2.2 React Renderer
- [ ] Creare catalogo/registry di componenti renderizzabili
- [ ] Componenti base:
  - `TextElement` — testo con formattazione (bold, italic, underline, colore, size)
  - `HeadingElement` — h1-h6
  - `ImageElement` — immagine con src, alt, dimensioni
  - `TableElement` — tabella con header, righe, colonne
  - `RowElement` / `ColumnElement` — layout flex
  - `ContainerElement` — wrapper con padding, border, background
  - `SpacerElement` — spaziatura verticale
  - `DividerElement` — linea separatrice
  - `ListElement` — lista ordinata/non ordinata
  - `ChartElement` — grafici (bar, line, pie via Recharts)
- [ ] `TemplateRenderer` component che prende il JSON e renderizza in React
- [ ] Supporto per variabili/data binding (`{{variableName}}`)
- [ ] Preview in tempo reale con aspect ratio A4/Letter

#### 2.3 PDF Export Engine
- [ ] Installare `@react-pdf/renderer` o `puppeteer`/`playwright` per generazione server-side
- [ ] Creare API route `POST /api/pdf/generate`
- [ ] Input: template JSON + data object
- [ ] Output: PDF buffer / stream
- [ ] Supporto formati pagina (A4, Letter, Legal, Custom)
- [ ] Supporto orientamento (portrait, landscape)
- [ ] Supporto header/footer di pagina
- [ ] Upload PDF generato su storage (S3/R2/Vercel Blob)
- [ ] Salvare record in tabella `generations`

---

### FASE 3 — Template Management (CRUD)
> Gestione template: lista, creazione, duplicazione, eliminazione

#### 3.1 API Routes Templates
- [ ] `GET /api/templates` — lista template (con paginazione, filtri, search)
- [ ] `POST /api/templates` — crea template
- [ ] `GET /api/templates/[id]` — dettaglio template
- [ ] `PUT /api/templates/[id]` — aggiorna template
- [ ] `DELETE /api/templates/[id]` — elimina template
- [ ] `POST /api/templates/[id]/duplicate` — duplica template
- [ ] `GET /api/templates/gallery` — template pubblici/preset

#### 3.2 Dashboard Templates Page
- [ ] Implementare `/dashboard/templates` con:
  - Grid/lista di template con preview thumbnail
  - Search e filtri (per tipo, data, autore)
  - Azione "New Template" (da zero o da preset)
  - Azioni per ogni template: Edit, Duplicate, Delete, Export
  - Stato template (draft, published)
- [ ] Modale creazione nuovo template (nome, tipo, formato pagina)
- [ ] Preview template in hover/click

---

### FASE 4 — Visual Editor (Drag & Drop)
> Editor visuale per costruire template PDF

#### 4.1 Editor Layout
- [ ] Implementare `/dashboard/editor/[id]` con layout dedicato:
  - Toolbar superiore (undo, redo, zoom, save, preview, export)
  - Panel sinistro: componenti disponibili (drag source)
  - Area centrale: canvas A4 con rendering live del template
  - Panel destro: proprietà elemento selezionato (props editor)
- [ ] Stato editor con Zustand o useReducer

#### 4.2 Drag & Drop System
- [ ] Installare `@dnd-kit/core` + `@dnd-kit/sortable`
- [ ] Drag da panel componenti → canvas
- [ ] Drag per riordinare elementi nel canvas
- [ ] Drop zones con indicatori visuari
- [ ] Selezione elemento con click (highlight + handles)
- [ ] Multi-selezione con Shift+click

#### 4.3 Property Editor Panel
- [ ] Form dinamico basato sul tipo di elemento selezionato
- [ ] Editor proprietà comuni: margins, padding, background, border
- [ ] Editor testo: font, size, weight, color, alignment
- [ ] Editor immagine: src (upload), alt, object-fit, dimensioni
- [ ] Editor tabella: colonne, righe, header styling
- [ ] Editor layout: direction, gap, alignment, wrap

#### 4.4 Canvas & Preview
- [ ] Canvas con dimensioni reali pagina (scalato)
- [ ] Zoom in/out (slider o Ctrl+scroll)
- [ ] Griglia/guide opzionali per allineamento
- [ ] Anteprima PDF live (side panel o modale)
- [ ] Supporto multi-pagina (page break element)

#### 4.5 Editor Features
- [ ] Undo/Redo stack (history)
- [ ] Copia/Incolla elementi
- [ ] Salvataggio automatico (debounced)
- [ ] Keyboard shortcuts (Delete, Ctrl+C, Ctrl+V, Ctrl+Z, Ctrl+S)
- [ ] Layer panel (ordine elementi, visibilità, lock)

---

### FASE 5 — AI Chat Agent
> Chatbot agentico per creare e modificare template

#### 5.1 AI Infrastructure
- [ ] Installare `ai` SDK di Vercel + `@ai-sdk/gateway` (Vercel AI Gateway)
- [ ] Configurare AI Gateway per gestione multi-model (Claude, GPT, Gemini, ecc.)
- [ ] Creare API route `POST /api/chat`
- [ ] System prompt specializzato per PDF template generation
- [ ] Definire tools/functions per l'agente:
  - `createTemplate` — crea nuovo template da descrizione
  - `addElement` — aggiunge elemento al template
  - `updateElement` — modifica proprietà elemento
  - `removeElement` — rimuove elemento
  - `updateLayout` — modifica layout/struttura
  - `setPageSettings` — imposta dimensioni, margini, orientamento
  - `populateData` — inserisce dati di esempio
- [ ] Streaming delle risposte (SSE/RSC)

#### 5.2 Chat Interface
- [ ] Implementare `/dashboard/chat` con:
  - Lista sessioni chat (sidebar)
  - Area messaggi con rendering markdown
  - Input con invio messaggio
  - Preview template in tempo reale accanto alla chat
  - Indicatore di "thinking" / streaming
- [ ] Messaggi con rendering inline del template modificato
- [ ] Azioni rapide suggerite ("Add a table", "Change colors", "Add logo")
- [ ] Possibilità di aprire template generato nell'editor visuale

#### 5.3 AI Features Avanzate
- [ ] Generazione template da screenshot/immagine (vision)
- [ ] Iterazione: "Make the header bigger", "Add a footer with page numbers"
- [ ] Suggerimenti contestuali basati sul tipo di documento
- [ ] Salvare template generato direttamente nella libreria

---

### FASE 6 — REST API & SDK
> API pubblica e pacchetto npm per integrazione terze parti

#### 6.1 REST API Endpoints
- [ ] `POST /api/v1/generate` — genera PDF da template + dati
- [ ] `GET /api/v1/templates` — lista template pubblici/team
- [ ] `GET /api/v1/templates/[id]` — dettaglio template
- [ ] `POST /api/v1/render` — render preview (immagine)
- [ ] `GET /api/v1/generations/[id]` — status/download generazione
- [ ] `GET /api/v1/generations` — lista generazioni
- [ ] Autenticazione via API key (header `Authorization: Bearer <key>`)
- [ ] Rate limiting per piano (Free: 100/mese, Pro: 10k/mese, Enterprise: illimitato)
- [ ] Documentazione OpenAPI/Swagger

#### 6.2 API Keys Management
- [ ] Implementare `/dashboard/api-keys` con:
  - Lista API key attive
  - Crea nuova API key (con nome e scadenza opzionale)
  - Revoca API key
  - Statistiche utilizzo per key
  - Copia key negli appunti
- [ ] API routes per CRUD api keys
- [ ] Hash delle key nel database (mostrare solo alla creazione)

#### 6.3 npm SDK (`@pdf-gen/sdk`)
- [ ] Creare `packages/sdk/` come pacchetto npm pubblicabile
- [ ] Client class con metodi:
  ```typescript
  class PDFGenerator {
    constructor(apiKey: string, options?: { baseUrl?: string })
    generatePDF(templateId: string, data: object): Promise<Buffer>
    generatePDFFromSchema(schema: TemplateSchema, data: object): Promise<Buffer>
    listTemplates(): Promise<Template[]>
    getTemplate(id: string): Promise<Template>
  }
  ```
- [ ] TypeScript types esportati
- [ ] README con esempi d'uso
- [ ] Pubblicazione su npm

---

### FASE 7 — Export & Storage
> Gestione esportazioni, storage file, history

#### 7.1 Storage Setup
- [ ] Configurare file storage (Vercel Blob, AWS S3, o Cloudflare R2)
- [ ] Upload thumbnails template
- [ ] Upload PDF generati
- [ ] Upload immagini utente (per template)
- [ ] Cleanup automatico file vecchi (retention policy)

#### 7.2 Export History Page
- [ ] Implementare `/dashboard/exports` con:
  - Lista generazioni (tabella paginata)
  - Filtri: per template, data, stato, formato
  - Download diretto PDF
  - Preview PDF inline
  - Bulk download (zip)
  - Elimina generazioni vecchie
- [ ] API routes per generazioni CRUD

---

### FASE 8 — Team & Settings
> Collaborazione team, impostazioni account, billing

#### 8.1 Team Management
- [ ] Invito membri via email
- [ ] Ruoli: Owner, Admin, Editor, Viewer
- [ ] Permessi granulari per template (chi può edit/view)
- [ ] Activity log del team

#### 8.2 Settings Page
- [ ] Implementare `/dashboard/settings` con tabs:
  - **Profile**: nome, email, avatar, password
  - **Team**: gestione membri, inviti, ruoli
  - **Billing**: piano corrente, upgrade, fatture
  - **Notifications**: preferenze email
  - **Webhooks**: gestione webhook endpoints
  - **Danger Zone**: elimina account/team
- [ ] API routes per settings CRUD

#### 8.3 Webhooks
- [ ] CRUD webhook endpoints
- [ ] Eventi: `generation.completed`, `generation.failed`, `template.created`, `template.updated`
- [ ] Firma HMAC per sicurezza
- [ ] Retry con backoff esponenziale
- [ ] Log webhook deliveries

---

### FASE 9 — Marketing Pages Complete
> Contenuti reali per le pagine marketing

#### 9.1 Landing Page
- [ ] Aggiornare hero con demo interattiva o video
- [ ] Sezione social proof (loghi aziende, testimonial)
- [ ] Sezione metriche ("10k+ PDFs generati", "500+ template")
- [ ] FAQ section

#### 9.2 Features Page
- [ ] Implementare `/features` con contenuto dettagliato per ogni feature
- [ ] Screenshot/GIF di ogni funzionalità
- [ ] Comparison table vs competitor

#### 9.3 Pricing Page
- [ ] Implementare `/pricing` con piani:
  - **Free**: 100 PDF/mese, 3 template, 1 utente
  - **Pro**: 10k PDF/mese, template illimitati, 5 utenti, API access — $29/mese
  - **Enterprise**: Illimitato, SSO, support dedicato, SLA — custom
- [ ] Toggle mensile/annuale
- [ ] FAQ pricing
- [ ] Integrazione Stripe Checkout (o Lemon Squeezy)

#### 9.4 Docs Page
- [ ] Sistema documentazione (MDX con `next-mdx-remote` o `contentlayer`)
- [ ] Sezioni: Getting Started, API Reference, SDK, Templates, Webhooks
- [ ] Code examples con syntax highlighting
- [ ] Search nella documentazione

#### 9.5 Blog
- [ ] Sistema blog con MDX
- [ ] Lista articoli con thumbnail, data, autore
- [ ] Pagina singolo articolo
- [ ] Categorie/tag

---

### FASE 10 — Testing & Quality
> Test, CI/CD, monitoring

#### 10.1 Testing Setup
- [ ] Configurare Vitest per unit test
- [ ] Configurare Playwright per E2E test
- [ ] Test unitari:
  - Template schema validation
  - Template engine (render, manipolazione)
  - API routes (mock DB)
  - SDK methods
- [ ] Test E2E:
  - Flow auth (login, register, logout)
  - Flow template (crea, edit, duplica, elimina)
  - Flow editor (drag, drop, edit properties, save)
  - Flow export (genera PDF, download)
  - Flow API key (crea, usa, revoca)

#### 10.2 CI/CD
- [ ] GitHub Actions workflow:
  - Lint + Type check + Format check
  - Unit tests
  - E2E tests
  - Build check
  - Preview deployment (Vercel)
- [ ] Branch protection rules
- [ ] Automatic deployment su merge a main

#### 10.3 Monitoring & Logging
- [ ] Setup error tracking (Sentry)
- [ ] Logging strutturato (pino)
- [ ] Analytics (PostHog o Vercel Analytics)
- [ ] Uptime monitoring

---

### FASE 11 — Deployment & Launch
> Configurazione produzione e lancio

#### 11.1 Infrastructure
- [ ] Setup Vercel project (o alternativa)
- [ ] Configurare database produzione (Neon, PlanetScale, Supabase)
- [ ] Configurare storage produzione
- [ ] Configurare dominio custom
- [ ] SSL/TLS
- [ ] CDN per asset statici

#### 11.2 Performance
- [ ] Ottimizzazione immagini (next/image)
- [ ] Code splitting e lazy loading
- [ ] Caching strategico (Redis per API responses)
- [ ] Ottimizzazione bundle size
- [ ] Core Web Vitals check

#### 11.3 Security
- [ ] CORS configuration
- [ ] CSP headers
- [ ] Input sanitization
- [ ] SQL injection prevention (ORM)
- [ ] XSS prevention
- [ ] Rate limiting produzione
- [ ] Audit dipendenze (`pnpm audit`)

#### 11.4 Launch Checklist
- [ ] SEO: meta tags, sitemap.xml, robots.txt
- [ ] Open Graph images per social sharing
- [ ] Pagina 404 custom
- [ ] Pagina 500 custom
- [ ] Legal: Privacy Policy, Terms of Service
- [ ] Cookie consent
- [ ] Email transazionali (welcome, reset password, invoice)

---

## Priorità Suggerita

| Priorità | Fase | Descrizione | Impatto |
|----------|------|-------------|---------|
| P0 | 1 | Infrastruttura Backend | Blocca tutto il resto |
| P0 | 2 | Template Schema & Renderer | Core del prodotto |
| P1 | 3 | Template Management | Prima feature utilizzabile |
| P1 | 4 | Visual Editor | Feature differenziante |
| P1 | 5 | AI Chat Agent | Feature differenziante |
| P2 | 6 | REST API & SDK | Monetizzazione B2B |
| P2 | 7 | Export & Storage | Completamento UX |
| P2 | 8 | Team & Settings | Enterprise readiness |
| P3 | 9 | Marketing Pages | Acquisizione utenti |
| P3 | 10 | Testing & Quality | Stabilità produzione |
| P3 | 11 | Deployment & Launch | Go live |

---

## Stack Tecnologico Finale

| Layer | Tecnologia |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS v4, Framer Motion |
| UI | shadcn/ui (base-vega), @base-ui/react, Lucide, HugeIcons |
| Editor | @dnd-kit, Zustand |
| Business Logic | tRPC in `packages/api/` (single source of truth) |
| Server Actions | `apps/web/lib/actions/` (wrappano tRPC per frontend) |
| API Pubblica | REST `/api/v1/` (thin adapter su tRPC) |
| Database | PostgreSQL (Neon serverless) + Drizzle ORM |
| Auth | Better Auth + plugin organization/twoFactor/magicLink/admin |
| AI | Vercel AI SDK + AI Gateway (multi-model) |
| PDF Engine | @react-pdf/renderer o Puppeteer |
| Storage | Vercel Blob / AWS S3 / Cloudflare R2 |
| Rate Limiting | Upstash Redis (solo produzione) |
| Payments | Stripe / Lemon Squeezy |
| SDK | TypeScript npm package |
| Testing | Vitest + Playwright |
| CI/CD | GitHub Actions + Vercel |
| Monitoring | Sentry + PostHog |
