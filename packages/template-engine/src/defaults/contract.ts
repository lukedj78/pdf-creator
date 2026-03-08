import type { Template } from "../schema/types"

export const contractTemplate: Template = {
  id: "default-contract",
  name: "Contract Agreement",
  version: 1,
  meta: {
    description: "Standard contract template with parties, terms, and signature blocks",
    category: "legal",
    tags: ["contract", "agreement", "legal"],
  },
  root: "doc",
  elements: {
    doc: {
      type: "Document",
      props: { title: "Contract Agreement" },
      children: ["page-1"],
    },
    "page-1": {
      type: "Page",
      props: {
        size: "A4",
        orientation: "portrait",
        marginTop: 60,
        marginRight: 60,
        marginBottom: 60,
        marginLeft: 60,
      },
      children: [
        "title",
        "effective-date",
        "spacer-1",
        "parties-title",
        "parties-text",
        "spacer-2",
        "terms-title",
        "terms-list",
        "spacer-3",
        "compensation-title",
        "compensation-text",
        "spacer-4",
        "signature-row",
      ],
    },

    title: {
      type: "Heading",
      props: { text: { $state: "/contract/title" }, level: "h1", align: "center" },
      children: [],
    },
    "effective-date": {
      type: "Text",
      props: {
        text: { $template: "Effective Date: ${/contract/effectiveDate}" },
        fontSize: 11,
        align: "center",
        color: "#666666",
      },
      children: [],
    },
    "spacer-1": {
      type: "Spacer",
      props: { height: 30 },
      children: [],
    },
    "parties-title": {
      type: "Heading",
      props: { text: "Parties", level: "h2" },
      children: [],
    },
    "parties-text": {
      type: "Text",
      props: {
        text: {
          $template: "This Agreement is entered into between ${/party1/name} (\"${/party1/role}\") and ${/party2/name} (\"${/party2/role}\").",
        },
        fontSize: 11,
        lineHeight: 1.8,
      },
      children: [],
    },
    "spacer-2": {
      type: "Spacer",
      props: { height: 20 },
      children: [],
    },
    "terms-title": {
      type: "Heading",
      props: { text: "Terms and Conditions", level: "h2" },
      children: [],
    },
    "terms-list": {
      type: "List",
      props: {
        items: [
          { $state: "/contract/term1" },
          { $state: "/contract/term2" },
          { $state: "/contract/term3" },
          { $state: "/contract/term4" },
        ],
        ordered: true,
        fontSize: 11,
        spacing: 8,
      },
      children: [],
    },
    "spacer-3": {
      type: "Spacer",
      props: { height: 20 },
      children: [],
    },
    "compensation-title": {
      type: "Heading",
      props: { text: "Compensation", level: "h2" },
      children: [],
    },
    "compensation-text": {
      type: "Text",
      props: {
        text: { $state: "/contract/compensation" },
        fontSize: 11,
        lineHeight: 1.8,
      },
      children: [],
    },
    "spacer-4": {
      type: "Spacer",
      props: { height: 40 },
      children: [],
    },

    // Signature blocks
    "signature-row": {
      type: "Row",
      props: { justifyContent: "space-between", gap: 60 },
      children: ["sig-party1", "sig-party2"],
    },
    "sig-party1": {
      type: "Column",
      props: { flex: 1 },
      children: ["sig1-line", "sig1-name", "sig1-date"],
    },
    "sig1-line": {
      type: "Divider",
      props: { thickness: 1, color: "#333333" },
      children: [],
    },
    "sig1-name": {
      type: "Text",
      props: { text: { $state: "/party1/name" }, fontSize: 11, fontWeight: "bold" },
      children: [],
    },
    "sig1-date": {
      type: "Text",
      props: { text: "Date: _______________", fontSize: 10, color: "#666666" },
      children: [],
    },
    "sig-party2": {
      type: "Column",
      props: { flex: 1 },
      children: ["sig2-line", "sig2-name", "sig2-date"],
    },
    "sig2-line": {
      type: "Divider",
      props: { thickness: 1, color: "#333333" },
      children: [],
    },
    "sig2-name": {
      type: "Text",
      props: { text: { $state: "/party2/name" }, fontSize: 11, fontWeight: "bold" },
      children: [],
    },
    "sig2-date": {
      type: "Text",
      props: { text: "Date: _______________", fontSize: 10, color: "#666666" },
      children: [],
    },
  },
  state: {
    contract: {
      title: "Service Agreement",
      effectiveDate: "January 1, 2024",
      term1: "The Provider agrees to deliver the services described in Exhibit A within the agreed timeline.",
      term2: "The Client agrees to provide all necessary materials and access required for service delivery.",
      term3: "This agreement shall remain in effect for a period of 12 months from the effective date.",
      term4: "Either party may terminate this agreement with 30 days written notice.",
      compensation: "The Client shall pay the Provider a total fee of $10,000, payable in monthly installments of $833.33, due on the first business day of each month.",
    },
    party1: {
      name: "Acme Corp",
      role: "Provider",
    },
    party2: {
      name: "John Doe",
      role: "Client",
    },
  },
}
