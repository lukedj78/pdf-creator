# Feature Ispirate da Paper.design — Piano di Sviluppo

> Spunti estratti dall'analisi di [paper.design](https://paper.design/) adattati al nostro JSON Spec Editor SaaS.
> Queste feature si collocano **dopo la Fase 8** (completata) e possono essere integrate nel PRD come fasi 9-12.

---

## Feature A — MCP Server (Model Context Protocol)

**Obiettivo**: Esporre i template e lo spec editor come MCP server, permettendo ad agenti AI esterni (Claude, Cursor, Windsurf, Copilot) di leggere, creare e modificare template direttamente dall'IDE dell'utente.

**Valore**: Differenziatore competitivo forte — l'utente può dire "modifica il template invoice" dal proprio IDE e l'agente interagisce col nostro backend.

### Tasks

| # | Task | Descrizione | Dipendenze |
|---|------|-------------|------------|
| A.1 | Setup package `packages/mcp/` | Nuovo package monorepo, configurazione TypeScript, dipendenza `@modelcontextprotocol/sdk` | — |
| A.2 | Definire risorse MCP | Risorse esposte: `template` (list, read), `element` (read), `spec` (read) con URI scheme `speceditor://` | A.1 |
| A.3 | Definire tool MCP | Tool disponibili: `create_template`, `update_element`, `add_element`, `remove_element`, `update_styles`, `preview_template` | A.1 |
| A.4 | Definire prompt MCP | Prompt preconfigurati: `improve_layout`, `add_section`, `translate_content`, `generate_from_description` | A.1 |
| A.5 | Integrazione autenticazione | Auth via API key (riuso `packages/auth` + API key esistenti dalla Fase 6) per collegare MCP server all'account utente | A.1 |
| A.6 | Transport layer — Streamable HTTP | Endpoint `/api/mcp` con Streamable HTTP transport (standard MCP attuale) | A.2, A.3, A.4, A.5 |
| A.7 | Transport layer — stdio (CLI) | Binary `npx @speceditor/mcp` per uso locale da terminale/IDE, legge API key da env | A.5 |
| A.8 | Sync bidirezionale | Quando un agente modifica un template via MCP, la dashboard si aggiorna in real-time (WebSocket/SSE) | A.6 |
| A.9 | Documentazione MCP | Pagina docs con istruzioni setup per Claude Desktop, Cursor, VS Code + esempi di prompt | A.6, A.7 |
| A.10 | Test e2e MCP | Test automatizzati: connessione, list resources, call tool, verifica risultato | A.6 |

---

## Feature B — Import Intelligente (PDF/Immagine → JSON Spec)

**Obiettivo**: Permettere all'utente di importare un PDF o un'immagine direttamente nell'editor per generare uno spec JSON come punto di partenza. L'import popola il canvas dell'editor — il template viene creato solo quando l'utente salva.

**Valore**: Onboarding drasticamente più veloce — l'utente parte da un documento esistente, lo raffina nell'editor, e salva quando è soddisfatto.

**Flusso**: Editor toolbar → "Import from file" → upload → AI analizza → spec caricato nel canvas → utente modifica/raffina → salva = template creato.

### Tasks

| # | Task | Descrizione | Dipendenze |
|---|------|-------------|------------|
| B.1 | Bottone import nel dock editor | Aggiungere DockItem "Import from file" nel `editor-dock.tsx` (sezione editor actions), apre modal di upload | — |
| B.2 | Modal upload con drag & drop | Componente modal: drag & drop o file picker per PDF/PNG/JPG, preview file, limite 10MB | B.1 |
| B.3 | Server action + tRPC procedure | Server action `importFromFile` in `apps/web/lib/actions/` che wrappa tRPC `template.importFromFile`. Riceve file base64, nessun storage permanente | B.2 |
| B.4 | AI Vision analysis | Prompt engineering via Vercel AI Gateway (già in stack). Modello vision da definire (es. `anthropic/claude-sonnet-4`, `openai/gpt-4o`, `google/gemini-2.5-pro`). Analizza layout, identifica elementi (Heading, Text, Table, Image, View, Row, Column, etc.), restituisce struttura gerarchica JSON | B.3 |
| B.5 | Mapping AI output → JSON Spec | Parser che converte output AI in spec `{ root, elements, state }` valido, genera ID univoci, valida con schema Zod. Se validazione fallisce → retry con feedback | B.4 |
| B.6 | Carica spec nel canvas editor | Lo spec generato viene iniettato nell'editor state (`use-editor-store`), sovrascrivendo il canvas corrente (con conferma se non vuoto). L'utente vede il risultato nel canvas e può modificare liberamente | B.5 |
| B.7 | Refinement con AI Chat | Dopo l'import, l'AI Chat Agent (Fase 5) ha il contesto dello spec importato — l'utente può raffinare via chat. Nessun lavoro nuovo, solo collegamento | B.6 |
| B.8 | Multi-page PDF support | PDF multi-pagina: AI analizza ogni pagina separatamente, ognuna diventa un `Page` element nello spec. Opzione per selezionare quali pagine importare | B.4 |
| B.9 | Import da URL | Campo URL nella modal di import: backend scarica il file dall'URL, poi segue lo stesso pipeline. Validazione URL + timeout | B.3 |
| B.10 | Test import pipeline | Test con PDF/immagini campione (invoice, report, contratto), validazione output Zod, verifica rendering nel canvas | B.5 |

---

## Feature C — Remix / Variazioni AI

**Obiettivo**: Aggiungere un'azione "Suggerisci variazioni" nell'editor visuale che usa l'AI per proporre alternative di layout, stile o contenuto per un elemento o una sezione selezionata.

**Valore**: Accelera il design exploration — l'utente esplora opzioni senza doverle immaginare o descrivere manualmente.

### Tasks

| # | Task | Descrizione | Dipendenze |
|---|------|-------------|------------|
| C.1 | Context menu nell'editor | Aggiungere voce "Suggest variations" nel menu contestuale (click destro) su ogni elemento dell'editor | — |
| C.2 | Selezione scope variazione | Modal per scegliere cosa variare: layout, colori, tipografia, contenuto, tutto | C.1 |
| C.3 | AI variation engine | tRPC procedure `ai.generateVariations`: riceve elemento + scope, restituisce 3-4 varianti come spec JSON parziali | C.2 |
| C.4 | Preview carousel variazioni | UI carousel/grid che mostra le varianti renderizzate side-by-side con `<TemplateRenderer>` | C.3 |
| C.5 | Applica variazione | Click su una variante → applica le modifiche allo spec corrente nell'editor | C.4 |
| C.6 | History variazioni | Salva le variazioni provate nella session, possibilità di tornare indietro | C.5 |
| C.7 | Variazioni a livello pagina | Estendere le variazioni all'intera pagina, non solo singolo elemento | C.3 |
| C.8 | Quick remix shortcut | Shortcut keyboard (es. `Cmd+Shift+R`) per remix rapido dell'elemento selezionato | C.1 |

---

## Feature D — Connettori Dati Live

**Obiettivo**: Permettere di collegare lo `$state` del template a fonti dati esterne (API REST, Google Sheets, webhook) per generare documenti con dati sempre aggiornati.

**Valore**: Automazione completa — i template si popolano da soli, ideale per fatture ricorrenti, report periodici, certificati batch.

### Tasks

| # | Task | Descrizione | Dipendenze |
|---|------|-------------|------------|
| D.1 | Schema connettore | Definire schema Zod per connettore: `{ type, url, auth, mapping, refresh }` in `packages/template-engine/` | — |
| D.2 | Connettore REST API | Tipo `rest`: fetch da endpoint, mapping JSON response → state fields con JSONPath | D.1 |
| D.3 | Connettore Google Sheets | Tipo `sheets`: collegamento a spreadsheet via Google API, mapping colonne → state fields | D.1 |
| D.4 | Connettore Webhook (push) | Tipo `webhook`: endpoint dedicato che riceve dati in push e aggiorna lo state | D.1 |
| D.5 | UI configurazione connettore | Pannello nell'editor per aggiungere/configurare connettori, test connessione, preview dati | D.2 |
| D.6 | Mapping visuale | UI drag & drop per mappare campi del connettore ai campi `$state` del template | D.5 |
| D.7 | Refresh automatico | Scheduler per refresh periodico (5min, 1h, 1d) + refresh manuale | D.2 |
| D.8 | Batch generation | Quando il connettore restituisce un array (es. righe spreadsheet), genera N documenti in batch | D.2, D.3 |
| D.9 | Error handling e retry | Gestione errori connessione, retry con backoff, notifica utente su failure | D.2 |
| D.10 | Test integrazione connettori | Test con mock API, mock Sheets, webhook simulato | D.2, D.3, D.4 |

---

## Priorità e Sequenza Suggerita

```
Fase 9  → Feature B (Import Intelligente)     — massimo impatto su onboarding
Fase 10 → Feature C (Remix / Variazioni AI)   — estende AI Agent già esistente
Fase 11 → Feature A (MCP Server)              — differenziatore, richiede più infra
Fase 12 → Feature D (Connettori Dati Live)    — automazione avanzata, ultimo step
```

### Rationale

1. **Import (B)** prima perché riduce la frizione d'ingresso: senza template di partenza l'utente non usa nient'altro
2. **Remix (C)** secondo perché riusa l'infrastruttura AI Agent (Fase 5) e arricchisce l'editor
3. **MCP (A)** terzo perché richiede un package nuovo e il mercato MCP sta maturando (meglio aspettare stabilizzazione)
4. **Connettori (D)** ultimo perché è la feature più enterprise e richiede che il core sia solido

---

## Effort Stimato

| Feature | Tasks | Complessità |
|---------|-------|-------------|
| A — MCP Server | 10 | Alta |
| B — Import Intelligente | 9 | Media-Alta |
| C — Remix AI | 8 | Media |
| D — Connettori Dati | 10 | Alta |
| **Totale** | **37 tasks** | |

---

## Note

- Tutte le feature riusano lo stack esistente (tRPC, AI Gateway, template-engine, auth)
- Nessuna richiede cambio di database schema significativo (eccetto D che aggiunge tabella connettori)
- L'ordine può cambiare in base a feedback utenti e priorità di go-to-market
