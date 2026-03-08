import type { Template } from "../schema/types"

export const invoiceRepeatTemplate: Template = {
  id: "default-invoice-repeat",
  name: "Invoice (Dynamic Lines)",
  version: 1,
  meta: {
    description: "Invoice with dynamic line items using repeat on a Table — rows auto-generated from data",
    category: "business",
    tags: ["invoice", "billing", "repeat", "dynamic"],
  },
  root: "doc",
  elements: {
    doc: {
      type: "Document",
      props: { title: "Invoice" },
      children: ["page-1"],
    },
    "page-1": {
      type: "Page",
      props: {
        size: "A4",
        orientation: "portrait",
        marginTop: 40,
        marginRight: 40,
        marginBottom: 40,
        marginLeft: 40,
      },
      children: [
        "header",
        "divider-1",
        "bill-to-section",
        "spacer-1",
        "items-table",
        "spacer-2",
        "totals-section",
        "spacer-3",
        "footer-note",
        "page-num",
      ],
    },

    // ── Header ──────────────────────────────────────────────
    header: {
      type: "Row",
      props: { justifyContent: "space-between", gap: 20 },
      children: ["company-info", "invoice-info"],
    },
    "company-info": {
      type: "View",
      props: {},
      children: ["company-name", "company-address"],
    },
    "company-name": {
      type: "Heading",
      props: { text: { $state: "/company/name" }, level: "h2" },
      children: [],
    },
    "company-address": {
      type: "Text",
      props: {
        text: { $template: "${/company/address}\n${/company/city}\n${/company/email}" },
        fontSize: 10,
        color: "#666666",
        lineHeight: 1.6,
      },
      children: [],
    },
    "invoice-info": {
      type: "View",
      props: {},
      children: ["invoice-title", "invoice-number", "invoice-date", "invoice-due"],
    },
    "invoice-title": {
      type: "Heading",
      props: { text: "INVOICE", level: "h1", align: "right", color: "#333333" },
      children: [],
    },
    "invoice-number": {
      type: "Text",
      props: {
        text: { $template: "Invoice #: ${/invoice/number}" },
        fontSize: 11,
        align: "right",
      },
      children: [],
    },
    "invoice-date": {
      type: "Text",
      props: {
        text: { $template: "Date: ${/invoice/date}" },
        fontSize: 11,
        align: "right",
        color: "#666666",
      },
      children: [],
    },
    "invoice-due": {
      type: "Text",
      props: {
        text: { $template: "Due: ${/invoice/dueDate}" },
        fontSize: 11,
        align: "right",
        color: "#666666",
      },
      children: [],
    },

    "divider-1": {
      type: "Divider",
      props: { thickness: 2, color: "#333333", marginTop: 16, marginBottom: 20 },
      children: [],
    },

    // ── Bill To ─────────────────────────────────────────────
    "bill-to-section": {
      type: "View",
      props: {},
      children: ["bill-to-label", "bill-to-name", "bill-to-address"],
    },
    "bill-to-label": {
      type: "Text",
      props: { text: "Bill To:", fontSize: 10, fontWeight: "bold", color: "#999999" },
      children: [],
    },
    "bill-to-name": {
      type: "Text",
      props: {
        text: { $state: "/client/name" },
        fontSize: 13,
        fontWeight: "bold",
      },
      children: [],
    },
    "bill-to-address": {
      type: "Text",
      props: {
        text: { $template: "${/client/address}\n${/client/city}\n${/client/email}" },
        fontSize: 10,
        color: "#666666",
        lineHeight: 1.6,
      },
      children: [],
    },

    "spacer-1": {
      type: "Spacer",
      props: { height: 24 },
      children: [],
    },

    // ── Items Table (with repeat) ───────────────────────────
    "items-table": {
      type: "Table",
      props: {
        columns: [
          { header: "Description", width: "45%", align: "left", field: "description" },
          { header: "Qty", width: "10%", align: "center", field: "qty" },
          { header: "Rate", width: "20%", align: "right", field: "rate" },
          { header: "Amount", width: "25%", align: "right", field: "amount" },
        ],
        rows: [],
        striped: true,
        borderColor: "#e5e5e5",
        headerBackgroundColor: "#f9fafb",
        fontSize: 11,
      },
      children: [],
      repeat: {
        statePath: "/lines",
        key: "id",
      },
    },

    "spacer-2": {
      type: "Spacer",
      props: { height: 24 },
      children: [],
    },

    // ── Totals ──────────────────────────────────────────────
    "totals-section": {
      type: "View",
      props: { padding: 0 },
      children: ["subtotal-row", "tax-row", "total-divider", "total-row"],
    },
    "subtotal-row": {
      type: "Row",
      props: { justifyContent: "flex-end", gap: 40 },
      children: ["subtotal-label", "subtotal-value"],
    },
    "subtotal-label": {
      type: "Text",
      props: { text: "Subtotal:", fontSize: 11, color: "#666666" },
      children: [],
    },
    "subtotal-value": {
      type: "Text",
      props: { text: { $state: "/invoice/subtotal" }, fontSize: 11, align: "right" },
      children: [],
    },
    "tax-row": {
      type: "Row",
      props: { justifyContent: "flex-end", gap: 40 },
      children: ["tax-label", "tax-value"],
    },
    "tax-label": {
      type: "Text",
      props: {
        text: { $template: "Tax (${/invoice/taxRate}%):" },
        fontSize: 11,
        color: "#666666",
      },
      children: [],
    },
    "tax-value": {
      type: "Text",
      props: { text: { $state: "/invoice/tax" }, fontSize: 11, align: "right" },
      children: [],
    },
    "total-divider": {
      type: "Divider",
      props: { thickness: 2, color: "#333333", marginTop: 8, marginBottom: 8 },
      children: [],
    },
    "total-row": {
      type: "Row",
      props: { justifyContent: "flex-end", gap: 40 },
      children: ["total-label", "total-value"],
    },
    "total-label": {
      type: "Text",
      props: { text: "Total Due:", fontSize: 14, fontWeight: "bold" },
      children: [],
    },
    "total-value": {
      type: "Text",
      props: { text: { $state: "/invoice/total" }, fontSize: 14, fontWeight: "bold", align: "right" },
      children: [],
    },

    "spacer-3": {
      type: "Spacer",
      props: { height: 32 },
      children: [],
    },

    // ── Footer ──────────────────────────────────────────────
    "footer-note": {
      type: "Text",
      props: {
        text: { $state: "/invoice/notes" },
        fontSize: 10,
        color: "#999999",
        fontStyle: "italic",
      },
      children: [],
    },
    "page-num": {
      type: "PageNumber",
      props: { format: "{pageNumber} / {totalPages}", align: "center", fontSize: 9, color: "#cccccc" },
      children: [],
    },
  },
  state: {
    company: {
      name: "Studio Digitale Srl",
      address: "Via Roma 42",
      city: "Milano, MI 20121",
      email: "fatture@studiodigitale.it",
    },
    client: {
      name: "Marco Bianchi",
      address: "Corso Italia 15",
      city: "Torino, TO 10128",
      email: "marco@example.com",
    },
    invoice: {
      number: "FT-2026-003",
      date: "2026-03-08",
      dueDate: "2026-04-07",
      subtotal: "€ 2.350,00",
      taxRate: "22",
      tax: "€ 517,00",
      total: "€ 2.867,00",
      notes: "Pagamento entro 30 giorni dalla data di emissione. Coordinate bancarie: IT60 X054 2811 1010 0000 1234 567",
    },
    lines: [
      { id: "1", description: "Progettazione UI/UX — App Mobile", qty: "1", rate: "€ 800,00", amount: "€ 800,00" },
      { id: "2", description: "Sviluppo Frontend React Native", qty: "40h", rate: "€ 25,00/h", amount: "€ 1.000,00" },
      { id: "3", description: "Integrazione API Backend", qty: "20h", rate: "€ 25,00/h", amount: "€ 500,00" },
      { id: "4", description: "Testing & QA", qty: "1", rate: "€ 50,00", amount: "€ 50,00" },
    ],
  },
}
