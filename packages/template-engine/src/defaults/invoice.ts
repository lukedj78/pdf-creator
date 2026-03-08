import type { Template } from "../schema/types"

export const invoiceTemplate: Template = {
  id: "default-invoice",
  name: "Invoice",
  version: 1,
  meta: {
    description: "Professional invoice template with company details, line items, and totals",
    category: "business",
    tags: ["invoice", "billing", "payment"],
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
        "bill-to-section",
        "spacer-1",
        "items-table",
        "spacer-2",
        "totals-section",
        "spacer-3",
        "footer-note",
      ],
    },

    // Header
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
      },
      children: [],
    },
    "invoice-info": {
      type: "View",
      props: {},
      children: ["invoice-title", "invoice-number", "invoice-date"],
    },
    "invoice-title": {
      type: "Heading",
      props: { text: "INVOICE", level: "h1", align: "right" },
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
      },
      children: [],
    },

    // Divider after header
    "spacer-1": {
      type: "Divider",
      props: { thickness: 2, color: "#333333", marginTop: 16, marginBottom: 24 },
      children: [],
    },

    // Bill To
    "bill-to-section": {
      type: "View",
      props: {},
      children: ["bill-to-label", "bill-to-name", "bill-to-address"],
    },
    "bill-to-label": {
      type: "Text",
      props: { text: "Bill To:", fontSize: 11, fontWeight: "bold", color: "#666666" },
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
        text: { $template: "${/client/address}\n${/client/city}" },
        fontSize: 10,
        color: "#666666",
      },
      children: [],
    },

    // Spacer
    "spacer-2": {
      type: "Spacer",
      props: { height: 24 },
      children: [],
    },

    // Items Table
    "items-table": {
      type: "Table",
      props: {
        columns: [
          { header: "Description", width: "50%", align: "left" },
          { header: "Qty", width: "10%", align: "center" },
          { header: "Rate", width: "20%", align: "right" },
          { header: "Amount", width: "20%", align: "right" },
        ],
        rows: [
          ["Web Design", "1", "$800.00", "$800.00"],
          ["Development", "2", "$150.00", "$300.00"],
          ["Hosting (annual)", "1", "$100.00", "$100.00"],
        ],
        striped: true,
        borderColor: "#e5e5e5",
        headerBackgroundColor: "#f9fafb",
      },
      children: [],
    },

    // Spacer
    "spacer-3": {
      type: "Spacer",
      props: { height: 24 },
      children: [],
    },

    // Totals
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
      props: { text: "Subtotal:", fontSize: 11 },
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
      props: { text: "Total:", fontSize: 14, fontWeight: "bold" },
      children: [],
    },
    "total-value": {
      type: "Text",
      props: { text: { $state: "/invoice/total" }, fontSize: 14, fontWeight: "bold", align: "right" },
      children: [],
    },

    // Footer
    "footer-note": {
      type: "Text",
      props: {
        text: { $state: "/invoice/notes" },
        fontSize: 10,
        color: "#666666",
        fontStyle: "italic",
      },
      children: [],
    },
  },
  state: {
    company: {
      name: "Acme Corp",
      address: "123 Main Street",
      city: "New York, NY 10001",
      email: "billing@acme.com",
    },
    client: {
      name: "John Doe",
      address: "456 Oak Avenue",
      city: "Los Angeles, CA 90001",
    },
    invoice: {
      number: "INV-001",
      date: "2024-01-15",
      subtotal: "$1,200.00",
      taxRate: "10",
      tax: "$120.00",
      total: "$1,320.00",
      notes: "Payment due within 30 days. Thank you for your business!",
    },
  },
}
