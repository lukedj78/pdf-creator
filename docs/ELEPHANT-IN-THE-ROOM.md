# L'Elefante nella Stanza — Riallineamento Completo a json-render

## Il Problema Fondamentale

Questo prodotto si posiziona come "PDF Generator SaaS" ma **non deve generare PDF**.

Il vero prodotto e: una piattaforma per **creare, gestire e servire JSON spec** compatibili
con `@json-render/react-pdf`. L'utente finale (lo sviluppatore cliente) prende lo spec JSON
e genera il PDF nella propria applicazione usando `@json-render/react-pdf`.

```
NOSTRO SAAS                                    APP DEL CLIENTE
-----------                                    ---------------
Visual Editor ---+
                 |
AI Chat Agent ---+--> JSON Spec --> API/SDK --> @json-render/react-pdf --> PDF
                 |                              (nel loro runtime)
REST API --------+
```

**Noi non generiamo PDF. Noi gestiamo JSON spec.**

---

## Indice

1. [Differenze Schema](#1-differenze-schema)
2. [Element Types: Mapping Completo](#2-element-types-mapping-completo)
3. [Props: Dove Tutto Diverge](#3-props-dove-tutto-diverge)
4. [Data Binding: Da Mustache a $state](#4-data-binding-da-mustache-a-state)
5. [Funzionalita Mancanti in json-render](#5-funzionalita-mancanti-in-json-render)
6. [Codice da Eliminare](#6-codice-da-eliminare)
7. [Codice da Modificare](#7-codice-da-modificare)
8. [Database: Impatto sullo Schema](#8-database-impatto-sullo-schema)
9. [SDK: Ripensamento Completo](#9-sdk-ripensamento-completo)
10. [AI Chat: Nuovo System Prompt e Tools](#10-ai-chat-nuovo-system-prompt-e-tools)
11. [Editor: Adattamenti UI](#11-editor-adattamenti-ui)
12. [API Pubblica: Nuovo Contratto](#12-api-pubblica-nuovo-contratto)
13. [Test: Cosa Riscrivere](#13-test-cosa-riscrivere)
14. [Piano di Migrazione Ordinato](#14-piano-di-migrazione-ordinato)

---

## 1. Differenze Schema

### Struttura Root

| Campo | NOI (oggi) | json-render | Note |
|-------|-----------|-------------|------|
| Root entry | `rootIds: string[]` | `root: string` | json-render ha un singolo root, non un array |
| Elements map | `elements: Record<string, Element>` | `elements: Record<string, Element>` | Stesso concetto |
| State | Non esiste | `state: Record<string, unknown>` | I dati sample/default per le variabili |
| ID nell'elemento | `element.id` (duplicato nella key) | Solo la key della map | json-render non ha `id` dentro l'elemento |

### Struttura Elemento

| Campo | NOI (oggi) | json-render | Note |
|-------|-----------|-------------|------|
| type | `type: "text"` (lowercase) | `type: "Text"` (PascalCase) | Naming convention diversa |
| props | `props: Record<string, unknown>` | `props: Record<string, unknown>` | Stesso, MA i nostri stili sono separati |
| children | `children?: string[]` | `children: string[]` | json-render ha sempre l'array (vuoto se leaf) |
| styles | `styles?: StyleProps` (oggetto separato) | Non esiste | **Stili dentro props** in json-render |
| visible | Non esiste | `visible?: { $state, eq }` | Visibilita condizionale |
| repeat | Non esiste | `repeat?: { statePath, key }` | Iterazione su array |

### Struttura Template (wrapper)

| Campo | NOI (oggi) | json-render | Note |
|-------|-----------|-------------|------|
| `id` | Nel template | Non nel spec | ID e nostro metadata, non parte dello spec |
| `name` | Nel template | Non nel spec (e in Document.title) | Nostro metadata |
| `version` | Nel template | Non esiste | Nostro metadata |
| `meta` | Nel template | Non esiste | Nostro metadata |
| `page` | Oggetto separato `page: { size, orientation, margins }` | Elemento `Page` con props | In json-render Document > Page sono elementi |

### Conclusione Schema

Il nostro "Template" nel DB dovra avere:
- **Metadata nostro**: `id, name, description, version, meta, thumbnail, status, etc.`
- **Spec json-render**: il JSON puro compatibile con `@json-render/react-pdf`, salvato nel campo `schema` (jsonb)

Lo spec json-render dentro `schema` avra la forma:
```json
{
  "root": "doc",
  "elements": {
    "doc": {
      "type": "Document",
      "props": { "title": "Invoice" },
      "children": ["page-1"]
    },
    "page-1": {
      "type": "Page",
      "props": { "size": "A4", "orientation": "portrait", "marginTop": 40 },
      "children": ["header", "body", "footer"]
    },
    "header": {
      "type": "Row",
      "props": { "gap": 20, "justifyContent": "space-between" },
      "children": ["company-name", "invoice-title"]
    }
  },
  "state": {
    "company": { "name": "Acme Corp" },
    "invoice": { "number": "INV-001" }
  }
}
```

---

## 2. Element Types: Mapping Completo

### Tipi che esistono in entrambi (da rinominare/adattare)

| NOI (oggi) | json-render | Differenze Props |
|-----------|-------------|------------------|
| `text` | `Text` | Noi: `content, bold, italic, underline`. JR: `text, fontSize, color, align, fontWeight, fontStyle, lineHeight` |
| `heading` | `Heading` | Noi: `content, level` (number 1-6). JR: `text, level` (string "h1"-"h4"), `color, align` |
| `image` | `Image` | Noi: `src, alt` + styles separati. JR: `src, width, height, objectFit` (no alt) |
| `table` | `Table` | Noi: `columns [{key,header,width,align}], rows [Record<string,unknown>]`. JR: `columns [{header,width?,align?}], rows [string[][]]` — righe sono array di stringhe, non oggetti |
| `list` | `List` | Noi: `items, ordered`. JR: `items, ordered, fontSize, color, spacing` |
| `row` | `Row` | Noi: `gap, wrap` + styles. JR: `gap, alignItems, justifyContent, padding, flex, wrap` |
| `column` | `Column` | Noi: `flex` + styles. JR: `gap, alignItems, justifyContent, padding, flex` |
| `spacer` | `Spacer` | Noi: `height`. JR: `height`. Quasi identico |
| `divider` | `Divider` | Noi: `thickness, color`. JR: `color, thickness, marginTop, marginBottom` |
| `page-break` | N/A | json-render non ha page-break esplicito, si usa separazione in Page children |

### Tipi che NOI abbiamo e json-render NO

| NOI | Cosa farne |
|-----|-----------|
| `container` | Diventa `View` in json-render |
| `chart` | **Non esiste in json-render react-pdf**. Opzioni: (a) rimuovere, (b) custom component nel registry del cliente, (c) renderizzare come SVG/Image |
| `page-break` | In json-render si gestisce con elementi `Page` multipli come children di `Document` |

### Tipi che json-render ha e NOI NO

| json-render | Cosa manca |
|------------|-----------|
| `Document` | Wrapper root obbligatorio. props: `title, author, subject` |
| `Page` | Elemento pagina. props: `size, orientation, marginTop/Bottom/Left/Right, backgroundColor` |
| `View` | Container generico (noi abbiamo `container` ma con props diverse) |
| `Link` | Hyperlink. props: `text, href, fontSize, color` |
| `PageNumber` | Numero pagina. props: `format, fontSize, color, align` |

---

## 3. Props: Dove Tutto Diverge

### Il problema `styles` vs `props`

**Oggi**: ogni elemento ha `props` (dati) + `styles` (CSS) separati:
```json
{
  "id": "company-name",
  "type": "heading",
  "props": { "content": "Acme Corp", "level": 2 },
  "styles": { "fontSize": 24, "fontWeight": 700, "marginBottom": 8 }
}
```

**json-render**: tutto e in `props`, gli stili sono proprieta del componente:
```json
{
  "type": "Heading",
  "props": { "text": "Acme Corp", "level": "h2", "color": "#000", "align": "left" },
  "children": []
}
```

**Conseguenza**: Il concetto di "stile libero CSS" non esiste in json-render.
Ogni componente ha un set **finito e tipizzato** di props. Non puoi passare `marginBottom: 8`
a un Heading — non e nel suo schema.

Per gestire spaziatura/layout, si usano `View`, `Spacer`, e le props di layout dei container.

### Mapping Props per Componente

#### Text
| NOI | json-render | Note |
|-----|-------------|------|
| `content` | `text` | Rename |
| `bold` | `fontWeight: "bold"` | Boolean -> enum |
| `italic` | `fontStyle: "italic"` | Boolean -> enum |
| `underline` | N/A | Non supportato in json-render Text |
| (in styles) `fontSize` | `fontSize` | Da styles a props |
| (in styles) `color` | `color` | Da styles a props |
| (in styles) `textAlign` | `align` | Rename |
| (in styles) `lineHeight` | `lineHeight` | Da styles a props |

#### Heading
| NOI | json-render | Note |
|-----|-------------|------|
| `content` | `text` | Rename |
| `level` (number 1-6) | `level` (string "h1"-"h4") | Type change + range ridotto |
| (in styles) `fontSize` | N/A | Non esiste, determinato dal level |
| (in styles) `color` | `color` | Da styles a props |
| (in styles) `textAlign` | `align` | Rename |

#### Image
| NOI | json-render | Note |
|-----|-------------|------|
| `src` | `src` | Uguale |
| `alt` | N/A | Non esiste in json-render Image |
| (in styles) `width` | `width` | Da styles a props, solo number |
| (in styles) `height` | `height` | Da styles a props, solo number |
| (in styles) `objectFit` | `objectFit` | Da styles a props |

#### Table
| NOI | json-render | Note |
|-----|-------------|------|
| `columns[].key` | N/A | Non esiste. JR usa indice posizionale |
| `columns[].header` | `columns[].header` | Uguale |
| `columns[].width` | `columns[].width` | Uguale (string) |
| `columns[].align` | `columns[].align` | Uguale |
| `rows` (array di oggetti `{key: value}`) | `rows` (array di array `string[][]`) | **Cambiamento strutturale** |
| `showHeader` | N/A | Non esiste (header sempre visibile) |
| `bordered` | `borderColor` | Boolean -> string color |
| `striped` | `striped` | Uguale |
| N/A | `headerBackgroundColor` | Nuovo |
| N/A | `headerTextColor` | Nuovo |
| N/A | `fontSize` | Nuovo |

#### Row
| NOI | json-render | Note |
|-----|-------------|------|
| `gap` | `gap` | Uguale |
| `wrap` | `wrap` | Uguale |
| (in styles) `justifyContent` | `justifyContent` | Da styles a props |
| (in styles) `alignItems` | `alignItems` | Da styles a props |
| N/A | `padding` | Nuovo |
| N/A | `flex` | Nuovo |

#### Column
| NOI | json-render | Note |
|-----|-------------|------|
| `flex` | `flex` | Uguale |
| N/A | `gap` | Nuovo |
| N/A | `alignItems` | Nuovo |
| N/A | `justifyContent` | Nuovo |
| N/A | `padding` | Nuovo |

#### View (nostro `container`)
| NOI | json-render | Note |
|-----|-------------|------|
| `{}` (vuoto) | `padding, paddingTop/Bottom/Left/Right, margin, backgroundColor, borderWidth, borderColor, borderRadius, flex, alignItems, justifyContent` | Completamente diverso |

#### Divider
| NOI | json-render | Note |
|-----|-------------|------|
| `thickness` | `thickness` | Uguale |
| `color` | `color` | Uguale |
| N/A | `marginTop` | Nuovo |
| N/A | `marginBottom` | Nuovo |

#### List
| NOI | json-render | Note |
|-----|-------------|------|
| `items` | `items` | Uguale |
| `ordered` | `ordered` | Uguale |
| N/A | `fontSize` | Nuovo |
| N/A | `color` | Nuovo |
| N/A | `spacing` | Nuovo |

---

## 4. Data Binding: Da Mustache a $state

### Oggi: Mustache syntax
```json
{
  "type": "text",
  "props": { "content": "Invoice #: {{invoice.number}}" }
}
```
Risolto a runtime dal nostro `resolveBindings()` con regex `{{path}}`.

### json-render: Espressioni tipizzate

json-render ha **6 tipi di espressione** per dati dinamici:

#### 4.1 `$state` — Lettura da state
```json
{
  "type": "Text",
  "props": { "text": { "$state": "/invoice/number" } }
}
```
Path in formato **JSON Pointer** (RFC 6901): `/user/name` non `user.name`.

#### 4.2 `$template` — Interpolazione stringa
```json
{
  "type": "Text",
  "props": { "text": { "$template": "Invoice #: ${/invoice/number}" } }
}
```
Per mescolare testo statico e dinamico. Syntax: `${/path}` non `{{path}}`.

#### 4.3 `$item` — Campo dell'elemento corrente in un repeat
```json
{
  "type": "Text",
  "props": { "text": { "$item": "title" } }
}
```
Usato dentro un `repeat` block per accedere ai campi dell'elemento corrente dell'array.

#### 4.4 `$index` — Indice corrente in un repeat
```json
{
  "type": "Text",
  "props": { "text": { "$index": true } }
}
```

#### 4.5 `$cond` / `$then` / `$else` — Condizionali
```json
{
  "type": "Badge",
  "props": {
    "label": {
      "$cond": { "$state": "/invoice/isPaid" },
      "$then": "Paid",
      "$else": "Pending"
    }
  }
}
```

#### 4.6 `$computed` — Funzioni registrate
```json
{
  "type": "Text",
  "props": {
    "text": {
      "$computed": "formatCurrency",
      "args": { "amount": { "$state": "/invoice/total" } }
    }
  }
}
```

### Cosa Cambia per Noi

| Aspetto | Oggi | Dopo |
|---------|------|------|
| Syntax variabili | `{{path.dot.notation}}` | `{ "$state": "/path/slash/notation" }` o `{ "$template": "testo ${/path}" }` |
| Path format | Dot notation `user.name` | JSON Pointer `/user/name` |
| Tipo valore | Sempre stringa (replace in content) | Espressione oggetto `{ "$state": ... }` — puo essere qualsiasi tipo |
| Dati sample | Passati come argomento `data` a runtime | Dentro lo spec come `state: {}` |
| Iterazione array | Non supportata | `repeat: { statePath: "/items", key: "id" }` con `$item` |
| Condizionali | Non supportati | `$cond/$then/$else` nelle props + `visible` sugli elementi |
| Computed | Non supportati | `$computed` con funzioni registrate |

### Impatto sull'Editor

L'editor deve permettere all'utente di:
1. **Definire lo state schema**: quali variabili il template si aspetta (nome, tipo, struttura)
2. **Inserire binding nelle props**: invece di digitare `{{company.name}}`, selezionare un campo dallo state che diventa `{ "$state": "/company/name" }`
3. **Creare template strings**: per testo misto statico/dinamico (`{ "$template": "Invoice #${/invoice/number}" }`)
4. **Definire repeat**: per tabelle/liste con dati dinamici
5. **Impostare condizionali**: mostrare/nascondere sezioni
6. **Fornire dati sample nello state**: per l'anteprima nell'editor

### Impatto sull'AI Chat

Il system prompt deve insegnare all'AI:
- La syntax `$state`, `$template`, `$item`, `$index`, `$cond`, `$computed`
- Il formato JSON Pointer per i path
- Come strutturare `repeat` per iterazione
- Come mettere dati sample in `state`

---

## 5. Funzionalita Mancanti in json-render

Funzionalita presenti in json-render che noi non supportiamo affatto:

| Funzionalita | Descrizione | Priorita |
|-------------|-------------|----------|
| `Document` element | Root wrapper obbligatorio (title, author, subject) | P0 |
| `Page` element | Pagina come elemento (size, margins, bg color) | P0 |
| `View` element | Container generico con props layout complete | P0 |
| `Link` element | Hyperlink con text e href | P1 |
| `PageNumber` element | Numero pagina con formato personalizzabile | P1 |
| `state` nel spec | Dati default/sample dentro lo spec JSON | P0 |
| `$state` binding | Lettura da state con JSON Pointer | P0 |
| `$template` binding | Interpolazione stringa | P0 |
| `repeat` su elementi | Iterazione su array con `$item`/`$index` | P0 |
| `visible` condizionale | Mostrare/nascondere elementi | P1 |
| `$cond/$then/$else` | Props condizionali | P1 |
| `$computed` | Funzioni registrate | P2 |
| `$bindState` | Two-way binding (form inputs) | P3 (non rilevante per PDF) |

---

## 6. Codice da Eliminare

### 6.1 `packages/template-engine/src/pdf/` (TUTTA la directory)

| File | Motivo |
|------|--------|
| `pdf-generator.ts` | Genera PDF con Playwright. **Non e il nostro lavoro.** |
| `html-renderer.ts` | Renderizza HTML per Playwright. Non serve piu. |
| `index.ts` | Esporta i due sopra. |

Dipendenza `playwright` in template-engine: **da rimuovere**.

### 6.2 Export da `packages/template-engine/src/index.ts`

Rimuovere:
```typescript
// ELIMINARE
export { renderToHtml, generatePdf } from "./pdf"
export type { RenderToHtmlOptions, GeneratePdfOptions, GeneratePdfResult } from "./pdf"
```

### 6.3 `packages/api/src/routers/generations.ts` — metodo `generate`

Il metodo `generate` nella mutation chiama `generatePdf()`. Questa logica va rimossa o
trasformata: il backend non genera piu PDF, serve lo spec JSON.

### 6.4 `apps/web/app/api/v1/generate/route.ts`

Endpoint REST che chiama `generatePdf()`. Da ripensare completamente:
non restituisce piu un PDF buffer ma lo spec JSON (o una URL per scaricarlo).

### 6.5 Test HTML renderer

`packages/template-engine/src/__tests__/html-renderer.test.ts` — da eliminare interamente.

### 6.6 DB: tabella `generations`

La tabella `generations` traccia generazioni PDF fatte dal nostro server.
Se non generiamo piu PDF, il concetto di "generation" cambia:
- Potrebbe diventare un log di "spec exports" o "spec versions"
- Oppure potrebbe essere rimossa interamente
- I campi `outputUrl`, `status` (processing/completed/failed), `format` (pdf/png/jpg) non hanno piu senso

### 6.7 Dashboard Exports page

`apps/web/app/dashboard/exports/` — la pagina mostra generazioni PDF con download.
Se non generiamo PDF, questa pagina cambia scopo (diventa "Export History" di JSON spec,
o un version log).

---

## 7. Codice da Modificare

### 7.1 `packages/template-engine/src/schema/types.ts`

**Riscrittura completa.** Il nuovo schema deve produrre JSON compatibile json-render:

Da cambiare:
- `rootIds: string[]` → `root: string`
- `elementTypeSchema` → PascalCase + nuovi tipi (Document, Page, View, Link, PageNumber)
- Rimuovere `stylePropsSchema` come oggetto separato — stili vanno in props
- `element.id` → rimuovere (l'id e solo la chiave nella map)
- `element.styles` → rimuovere
- `element.children` → sempre presente (array vuoto per leaf)
- Aggiungere `element.visible` e `element.repeat`
- Aggiungere `state` nel template spec
- Props per ogni tipo: riscrivere per matchare json-render esattamente
- Supporto espressioni: ogni prop stringa puo essere `string | { $state } | { $template } | { $item } | { $cond }`

### 7.2 `packages/template-engine/src/utils/data-binding.ts`

**Riscrittura completa.** Da mustache `{{}}` a espressioni `$state`, `$template`, `$item`.

- `resolveBindings()` → supportare `{ "$state": "/path" }`, `{ "$template": "..." }`, `{ "$item": "field" }`
- `resolveElementBindings()` → risolvere ricorsivamente espressioni in props
- Path: da dot notation a JSON Pointer (`/user/name`)
- Supporto `repeat` → iterazione con context `$item`/`$index`
- Supporto `$cond` → risoluzione condizionale

### 7.3 `packages/template-engine/src/utils/manipulation.ts`

- `addElement()` → non aggiungere `element.id`, non gestire `styles` separato
- `updateElement()` → rimuovere `styles` parameter, tutto in `props`
- `createEmptyTemplate()` → creare spec con `root` (singolo), elemento `Document` > `Page`
- Tutte le funzioni: usare `root` invece di `rootIds`

### 7.4 `packages/template-engine/src/utils/page.ts`

Puo restare per calcoli di preview nell'editor, ma **non e piu usato per PDF generation**.
La struttura pagina e ora nell'elemento `Page` nello spec.

### 7.5 `packages/template-engine/src/elements/*.tsx` (React components per preview)

Ogni componente deve:
- Accettare le nuove props (json-render format)
- Rimuovere il parametro `styles` separato
- Risolvere espressioni `$state`/`$template` per la preview

Mapping:
| File attuale | Nuovo componente | Cambiamenti |
|-------------|-----------------|-------------|
| `text-element.tsx` | `TextElement` | Props: `text` invece di `content`, `fontWeight/fontStyle` enum |
| `heading-element.tsx` | `HeadingElement` | Props: `text` e `level` stringa "h1"-"h4" |
| `image-element.tsx` | `ImageElement` | Props: `width/height/objectFit` in props, no `alt` |
| `table-element.tsx` | `TableElement` | Props: `rows` diventa `string[][]` |
| `layout-elements.tsx` | `ViewElement`, `RowElement`, `ColumnElement` | Props layout da `styles` a `props` |
| `utility-elements.tsx` | `SpacerElement`, `DividerElement`, `ListElement` | Props aggiornate |
| `chart-element.tsx` | **Da decidere** | Non esiste in json-render |
| N/A | `DocumentElement` | Nuovo |
| N/A | `PageElement` | Nuovo |
| N/A | `LinkElement` | Nuovo |
| N/A | `PageNumberElement` | Nuovo |

### 7.6 `packages/template-engine/src/renderer/template-renderer.tsx`

- Risolvere espressioni `$state`/`$template` dalle props prima di passarle ai componenti
- Gestire `repeat` (renderizzare children N volte per ogni item dell'array)
- Gestire `visible` (nascondere elementi condizionalmente)
- Root singolo (`root`) invece di iterare `rootIds`
- Wrappare in Document > Page per la preview
- Passare `state` come context ai componenti

### 7.7 `packages/template-engine/src/defaults/*.ts` (template di default)

Riscrivere tutti i template di default (invoice, report, contract) nel formato json-render:

Esempio — Invoice (prima):
```json
{
  "rootIds": ["header", "bill-to-section", "items-table", ...],
  "elements": {
    "company-name": {
      "id": "company-name",
      "type": "heading",
      "props": { "content": "{{company.name}}", "level": 2 },
      "styles": { "fontSize": 24, "fontWeight": 700 }
    }
  }
}
```

Esempio — Invoice (dopo):
```json
{
  "root": "doc",
  "elements": {
    "doc": {
      "type": "Document",
      "props": { "title": "Invoice" },
      "children": ["page-1"]
    },
    "page-1": {
      "type": "Page",
      "props": { "size": "A4", "marginTop": 40, "marginRight": 40, "marginBottom": 40, "marginLeft": 40 },
      "children": ["header", "bill-to-section", "items-table", "totals-section", "footer-note"]
    },
    "company-name": {
      "type": "Heading",
      "props": { "text": { "$state": "/company/name" }, "level": "h2" },
      "children": []
    }
  },
  "state": {
    "company": { "name": "Acme Corp", "address": "123 Main St", "city": "New York, NY", "email": "billing@acme.com" },
    "invoice": { "number": "INV-001", "date": "2024-01-15", "subtotal": "$1,200.00", "taxRate": "10", "tax": "$120.00", "total": "$1,320.00" },
    "client": { "name": "John Doe", "address": "456 Oak Ave", "city": "Los Angeles, CA" }
  }
}
```

### 7.8 `apps/web/app/api/chat/route.ts` (AI Chat)

**Riscrittura system prompt e tools.**

System prompt attuale dice:
- Element types lowercase
- `{{variable.path}}` per data binding
- Tools: `createTemplate`, `addElement`, `updateElement`, `removeElement`, `setPageSettings`

Nuovo system prompt deve insegnare:
- Element types PascalCase (Document, Page, View, Text, Heading, etc.)
- `$state`, `$template`, `$item` per data binding
- JSON Pointer path format
- Document > Page come struttura obbligatoria
- Tools aggiornati con nuovi tipi e props

Tools da modificare:
- `createTemplate` → deve creare Document > Page come struttura base
- `addElement` → tipi PascalCase, props unificate (no `styles` separato)
- `updateElement` → solo `props` (no `styles`)
- `setPageSettings` → aggiorna le props dell'elemento Page, non un oggetto separato
- **Nuovo**: `setState` → per aggiungere/modificare variabili nello state
- **Nuovo**: `setRepeat` → per configurare iterazione su un elemento
- **Nuovo**: `setVisibility` → per configurare visibilita condizionale

### 7.9 `apps/web/app/dashboard/chat/page.tsx` (Chat UI)

- `applyToolResult()` → aggiornare per il nuovo schema (root singolo, no styles, nuovi tool)
- Template preview: gia usa `TemplateRenderer`, ma dovra funzionare con il nuovo formato

### 7.10 `apps/web/components/editor/components-panel.tsx`

Aggiornare la lista componenti:
- Tipi PascalCase
- Aggiungere: Document, Page, View, Link, PageNumber
- Rinominare: container → View
- Rimuovere o marcare come custom: chart
- Rimuovere: page-break (gestito via Page multipli)

### 7.11 `apps/web/components/editor/properties-panel.tsx`

**Riscrittura significativa:**
- Rimuovere `StyleEditor` come sezione separata — stili vanno nelle props
- Ogni componente: props aggiornate (text→Text, content→text, etc.)
- Aggiungere editor per:
  - Binding `$state`: UI per selezionare un campo dallo state
  - `$template`: UI per comporre stringhe con placeholder
  - `repeat`: UI per configurare iterazione
  - `visible`: UI per condizioni

### 7.12 `apps/web/lib/editor/editor-context.ts` (o simile)

Lo state dell'editor (useReducer/Zustand) deve gestire:
- `root` singolo invece di `rootIds`
- Niente `styles` separato nelle azioni
- Gestione `state` (le variabili del template)
- Azioni per `repeat` e `visible`

### 7.13 `packages/sdk/src/client.ts` e `types.ts`

L'SDK non puo piu avere `generate()` che restituisce un PDF buffer.
Il metodo deve restituire lo spec JSON.

Vedi sezione 9 per il dettaglio.

### 7.14 `packages/api/src/routers/templates.ts`

Il campo `schema` salvato nel DB dovra essere nel formato json-render.
Le query che leggono/scrivono template devono validare il nuovo formato.

---

## 8. Database: Impatto sullo Schema

### Tabella `templates`

Nessun cambiamento strutturale. Il campo `schema` (jsonb) cambia solo contenuto:
da formato proprietario a formato json-render.

**Attenzione**: i template esistenti nel DB saranno invalidi dopo la migrazione.
Servira uno script di migrazione dati o un reset del DB.

### Tabella `generations`

Tre opzioni:

**Opzione A — Eliminare**: Se non generiamo PDF, non servono "generations".

**Opzione B — Ripurpose come "Exports"**: Traccia ogni volta che un utente esporta/scarica
lo spec JSON. Rimuovere `outputUrl`, `format`, semplificare `status`.

**Opzione C — Mantenere per "preview generation"**: Se offriamo un servizio di preview
(generiamo un'anteprima PNG del template), possiamo tenere una versione semplificata.

Raccomandazione: **Opzione B** per ora.

---

## 9. SDK: Ripensamento Completo

### Oggi
```typescript
class PdfGeneratorClient {
  generate(input): Promise<{ buffer, contentType, filename, pages }>
}
```
L'SDK chiama il nostro server che genera il PDF e restituisce il buffer.

### Dopo
L'SDK deve:
1. **Gestire template** (CRUD) — resta uguale
2. **Servire lo spec JSON** — il client scarica lo spec e lo usa con `@json-render/react-pdf`
3. **Non generare PDF** — il PDF lo genera il client

```typescript
class TemplateClient {
  // Template CRUD — invariato
  listTemplates(): Promise<Template[]>
  getTemplate(id: string): Promise<Template>
  createTemplate(input): Promise<Template>
  updateTemplate(id, input): Promise<Template>
  deleteTemplate(id): Promise<void>

  // Spec export — NUOVO
  getSpec(templateId: string): Promise<JsonRenderSpec>
  getSpecWithState(templateId: string, state: Record<string, unknown>): Promise<JsonRenderSpec>

  // RIMOSSO
  // generate() — non esiste piu
  // listGenerations() — non esiste piu
}
```

Il client poi fa:
```typescript
import { renderToBuffer } from "@json-render/react-pdf/render"
import { TemplateClient } from "@your-saas/sdk"

const client = new TemplateClient({ apiKey: "..." })
const spec = await client.getSpec("template-id")

// Il cliente genera il PDF nel suo runtime
const pdf = await renderToBuffer(spec, {
  state: { invoice: { number: "INV-042", total: "$1,500" } }
})
```

### Naming

Il pacchetto non puo piu chiamarsi `@pdf-generator/sdk`. Suggerimenti:
- `@your-brand/sdk`
- `@your-brand/template-client`

---

## 10. AI Chat: Nuovo System Prompt e Tools

### Nuovo System Prompt (bozza)

```
You are a PDF template designer AI assistant. You help users create and modify
JSON specs compatible with @json-render/react-pdf.

You work with a declarative JSON-based system. Specs follow this structure:
{
  "root": "element-id",
  "elements": { ... },
  "state": { ... }
}

Every spec MUST have a Document as root, with one or more Page children.

Available element types:
- Document: Root wrapper (props: title, author, subject)
- Page: Single page (props: size, orientation, marginTop/Bottom/Left/Right, backgroundColor)
- View: Generic container (props: padding, margin, backgroundColor, borderWidth, borderColor, borderRadius, flex, alignItems, justifyContent)
- Row: Horizontal flex layout (props: gap, alignItems, justifyContent, padding, flex, wrap)
- Column: Vertical flex layout (props: gap, alignItems, justifyContent, padding, flex)
- Text: Body text (props: text, fontSize, color, align, fontWeight, fontStyle, lineHeight)
- Heading: Headings h1-h4 (props: text, level, color, align)
- Image: Images (props: src, width, height, objectFit)
- Link: Hyperlinks (props: text, href, fontSize, color)
- Table: Data tables (props: columns [{header, width?, align?}], rows [string[][]], headerBackgroundColor, headerTextColor, borderColor, fontSize, striped)
- List: Lists (props: items, ordered, fontSize, color, spacing)
- Divider: Horizontal line (props: color, thickness, marginTop, marginBottom)
- Spacer: Vertical spacing (props: height)
- PageNumber: Page numbering (props: format, fontSize, color, align)

Data binding:
- { "$state": "/path/to/value" } — read from state
- { "$template": "Text with ${/path}" } — string interpolation
- { "$item": "fieldName" } — current array item in repeat
- { "$index": true } — current index in repeat
- { "$cond": ..., "$then": ..., "$else": ... } — conditional

For dynamic content, add variables to the state object.
For repeating sections (table rows, lists), use repeat: { statePath: "/items", key: "id" }.

All styling is done through component props, NOT through a separate styles object.
```

### Tools Aggiornati

```typescript
tools: {
  createTemplate: tool({
    description: "Create a new template with Document > Page structure",
    inputSchema: z.object({
      title: z.string(),
      pageSize: z.enum(["A4", "A3", "A5", "LETTER", "LEGAL"]).default("A4"),
      orientation: z.enum(["portrait", "landscape"]).default("portrait"),
    }),
    // Crea spec con Document > Page vuota
  }),

  addElement: tool({
    description: "Add an element to the template",
    inputSchema: z.object({
      type: z.enum(["View", "Row", "Column", "Text", "Heading", "Image", "Link",
                     "Table", "List", "Divider", "Spacer", "PageNumber"]),
      props: z.record(z.unknown()),
      parentId: z.string(),
    }),
  }),

  updateElement: tool({
    description: "Update props of an existing element",
    inputSchema: z.object({
      elementId: z.string(),
      props: z.record(z.unknown()),
    }),
    // NO styles parameter
  }),

  removeElement: tool({ ... }), // invariato

  updateState: tool({
    description: "Add or update variables in the template state",
    inputSchema: z.object({
      path: z.string().describe("JSON Pointer path, e.g. /company/name"),
      value: z.unknown(),
    }),
  }),

  setRepeat: tool({
    description: "Configure repeat (array iteration) on an element",
    inputSchema: z.object({
      elementId: z.string(),
      statePath: z.string().describe("JSON Pointer to the array in state"),
      key: z.string().describe("Field name for stable key"),
    }),
  }),

  setVisibility: tool({
    description: "Set visibility condition on an element",
    inputSchema: z.object({
      elementId: z.string(),
      statePath: z.string(),
      eq: z.unknown(),
    }),
  }),
}
```

---

## 11. Editor: Adattamenti UI

### Components Panel

Nuova lista componenti (grouped):

**Document Structure** (non draggabili, creati automaticamente):
- Document
- Page

**Layout**:
- View (era "Container")
- Row
- Column

**Content**:
- Text
- Heading
- Image
- Link (NUOVO)
- Table
- List

**Utility**:
- Divider
- Spacer
- PageNumber (NUOVO)

### Properties Panel

Per ogni componente, mostrare SOLO le props che json-render supporta.
Non c'e piu la sezione "Styles" separata.

Aggiungere sezioni speciali:
- **Data Binding**: per ogni prop che accetta binding, un toggle "static / dynamic"
  - Static: input testuale normale
  - Dynamic: picker che mostra le variabili disponibili nello `state`
- **Repeat**: se l'elemento e un container, opzione per configurare `repeat`
- **Visibility**: toggle per aggiungere condizione `visible`

### State Editor (NUOVO pannello)

Un nuovo pannello (tab o sidebar) dove l'utente:
1. Definisce le variabili del template (lo "state schema")
2. Inserisce valori di esempio per la preview
3. Vede la struttura JSON dello state

Esempio UI:
```
State Variables
---------------
+ Add Variable

company
  name: "Acme Corp"          [edit] [delete]
  address: "123 Main St"     [edit] [delete]

invoice
  number: "INV-001"          [edit] [delete]
  items: [array, 3 items]    [edit] [delete]
```

### Canvas/Preview

Il canvas deve:
- Mostrare Document > Page come struttura
- Risolvere `$state` con i valori sample per la preview
- Risolvere `repeat` mostrando N ripetizioni con dati sample
- Mostrare/nascondere in base a `visible`

---

## 12. API Pubblica: Nuovo Contratto

### Endpoint da Modificare

| Endpoint | Oggi | Dopo |
|---------|------|------|
| `POST /api/v1/generate` | Genera PDF, restituisce buffer | **Eliminare** o trasformare in `GET /api/v1/templates/:id/spec` |
| `GET /api/v1/templates` | Lista template | Invariato |
| `GET /api/v1/templates/:id` | Dettaglio template | Invariato, ma il campo `schema` e ora formato json-render |
| `GET /api/v1/generations` | Lista generazioni | **Eliminare** o ripurpose |
| `GET /api/v1/generations/:id` | Dettaglio generazione | **Eliminare** o ripurpose |

### Nuovi Endpoint

| Endpoint | Scopo |
|---------|-------|
| `GET /api/v1/templates/:id/spec` | Restituisce lo spec JSON puro (pronto per json-render) |
| `POST /api/v1/templates/:id/spec` | Restituisce lo spec con state custom (merge del default + quello passato) |

### Response `/spec`

```json
{
  "root": "doc",
  "elements": { ... },
  "state": { ... }
}
```

Puro JSON, zero wrapper. Il cliente lo passa direttamente a `renderToBuffer()`.

---

## 13. Test: Cosa Riscrivere

### Da Eliminare
- `packages/template-engine/src/__tests__/html-renderer.test.ts` — HTML renderer non esiste piu

### Da Riscrivere
- `packages/template-engine/src/__tests__/schema.test.ts` — nuovo formato schema
- `packages/template-engine/src/__tests__/manipulation.test.ts` — nuove funzioni (root singolo, no styles)
- `packages/template-engine/src/__tests__/data-binding.test.ts` — da mustache a $state/$template
- `packages/template-engine/src/__tests__/page.test.ts` — potrebbe restare se il calcolo dimensioni serve per preview

### Nuovi Test
- Validazione spec json-render (Document > Page obbligatorio)
- Risoluzione espressioni `$state`, `$template`, `$item`, `$cond`
- Risoluzione `repeat` (iterazione corretta)
- Conversione/export spec (spec pulito senza metadata nostro)
- Componenti React: render con props json-render format

### E2E
- Chat flow: l'AI crea spec json-render valido
- Editor flow: modifica produce spec json-render valido
- API: `/spec` restituisce spec valido

---

## 14. Piano di Migrazione Ordinato

### Fase A — Schema Foundation (blocca tutto il resto)

1. Riscrivere `packages/template-engine/src/schema/types.ts`
   - Nuovo schema Zod compatibile json-render
   - Tipi PascalCase, no styles separato, root singolo, state, visible, repeat
   - Supporto espressioni ($state, $template, $item, $cond)

2. Riscrivere `packages/template-engine/src/utils/data-binding.ts`
   - Da mustache a espressioni json-render
   - JSON Pointer path resolution

3. Riscrivere `packages/template-engine/src/utils/manipulation.ts`
   - Root singolo, no styles, Document > Page come base

4. Riscrivere template di default (invoice, report, contract)
   - Formato json-render con state

### Fase B — Renderer per Preview

5. Aggiornare tutti i React element components (`src/elements/*.tsx`)
   - Nuove props, no styles separato
   - Nuovi componenti: DocumentElement, PageElement, ViewElement, LinkElement, PageNumberElement

6. Riscrivere `template-renderer.tsx`
   - Root singolo, risoluzione $state/$template, repeat, visible

### Fase C — Rimuovere PDF Generation

7. Eliminare `packages/template-engine/src/pdf/` (tutta la directory)
8. Rimuovere export da `packages/template-engine/src/index.ts`
9. Rimuovere dipendenza `playwright` dal package
10. Aggiornare `packages/api/src/routers/generations.ts` — rimuovere `generatePdf`
11. Aggiornare `apps/web/app/api/v1/generate/route.ts` — trasformare in `/spec`

### Fase D — Editor UI

12. Aggiornare components-panel (nuovi tipi)
13. Riscrivere properties-panel (props json-render, no styles section)
14. Aggiornare editor-context/store (root singolo, state, repeat, visible)
15. Aggiungere State Editor panel
16. Aggiungere UI binding picker nelle props

### Fase E — AI Chat

17. Riscrivere system prompt (`apps/web/app/api/chat/route.ts`)
18. Aggiornare tools (nuovi tipi, nuove azioni)
19. Aggiornare `applyToolResult()` nel chat page

### Fase F — API & SDK

20. Aggiornare endpoint REST (nuovo contratto, rimuovere /generate)
21. Riscrivere SDK (rimuovere generate, aggiungere getSpec)
22. Aggiornare tipi SDK

### Fase G — Test & Cleanup

23. Riscrivere tutti i test unitari
24. Aggiornare test E2E
25. Script migrazione dati DB (o reset)
26. Aggiornare documentazione marketing (docs pages)
27. Aggiornare MEMORY.md e PRD.md

---

## Riepilogo Impatto

| Area | Livello Cambiamento |
|------|-------------------|
| Schema/Types | Riscrittura completa |
| Data Binding | Riscrittura completa |
| Manipulation Utils | Riscrittura significativa |
| React Elements | Riscrittura significativa |
| Template Renderer | Riscrittura significativa |
| Default Templates | Riscrittura completa |
| PDF Generation | Eliminazione completa |
| HTML Renderer | Eliminazione completa |
| AI Chat (system prompt + tools) | Riscrittura completa |
| AI Chat (UI) | Modifiche moderate |
| Editor Components Panel | Modifiche moderate |
| Editor Properties Panel | Riscrittura significativa |
| Editor Context/Store | Riscrittura significativa |
| REST API | Riscrittura significativa |
| SDK | Riscrittura significativa |
| DB Schema | Modifiche minori (solo generations) |
| Test | Riscrittura quasi completa |
| Marketing/Docs | Aggiornamento contenuti |

**Non e un refactoring. E un riallineamento architetturale.**
La buona notizia: la struttura del monorepo, l'auth, il multi-tenant, il tRPC, le settings,
il team management — tutto questo resta. Il "guscio" e solido. Il "cuore" (template engine +
come viene usato) va ricostruito.
