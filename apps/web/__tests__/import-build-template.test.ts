import { describe, it, expect } from "vitest"
import { buildTemplate, importResultSchema } from "../lib/import/build-template"
import { templateSchema } from "@workspace/template-engine/schema"
import type { ImportResult } from "../lib/import/build-template"

// --- Fixtures ---

const singlePageInvoice: ImportResult = {
  name: "Invoice #1234",
  pages: [
    {
      pageSettings: {
        size: "A4",
        orientation: "portrait",
        marginTop: 40,
        marginRight: 40,
        marginBottom: 40,
        marginLeft: 40,
      },
      elements: [
        { type: "Heading", props: { text: "Invoice", level: "h1" } },
        { type: "Text", props: { text: "Invoice #1234", fontSize: 12 } },
        { type: "Divider", props: { thickness: 1, color: "#e5e5e5" } },
        {
          type: "Table",
          props: {
            columns: [
              { header: "Item" },
              { header: "Qty" },
              { header: "Price" },
            ],
            rows: [
              ["Widget", "2", "$10.00"],
              ["Gadget", "1", "$25.00"],
            ],
          },
        },
        { type: "Spacer", props: { height: 20 } },
        { type: "Text", props: { text: "Total: $45.00", fontWeight: "bold" } },
      ],
    },
  ],
  state: { invoiceNumber: "1234" },
}

const multiPageReport: ImportResult = {
  name: "Annual Report 2025",
  pages: [
    {
      pageSettings: {
        size: "A4",
        orientation: "portrait",
        marginTop: 40,
        marginRight: 40,
        marginBottom: 40,
        marginLeft: 40,
      },
      elements: [
        { type: "Heading", props: { text: "Annual Report 2025", level: "h1" } },
        { type: "Text", props: { text: "Executive Summary", fontSize: 14 } },
        { type: "PageNumber", props: { format: "{pageNumber} / {totalPages}" } },
      ],
    },
    {
      pageSettings: {
        size: "A4",
        orientation: "portrait",
        marginTop: 40,
        marginRight: 40,
        marginBottom: 40,
        marginLeft: 40,
      },
      elements: [
        { type: "Heading", props: { text: "Financial Overview", level: "h2" } },
        {
          type: "Table",
          props: {
            columns: [{ header: "Quarter" }, { header: "Revenue" }],
            rows: [
              ["Q1", "$1M"],
              ["Q2", "$1.2M"],
            ],
          },
        },
        { type: "PageNumber", props: { format: "{pageNumber} / {totalPages}" } },
      ],
    },
  ],
}

const nestedLayoutPage: ImportResult = {
  name: "Two Column Layout",
  pages: [
    {
      pageSettings: {
        size: "A4",
        orientation: "portrait",
        marginTop: 40,
        marginRight: 40,
        marginBottom: 40,
        marginLeft: 40,
      },
      elements: [
        // 0: Heading (top-level)
        { type: "Heading", props: { text: "Title", level: "h1" } },
        // 1: Row (top-level, contains columns at 2 and 3)
        { type: "Row", props: { gap: 16 }, children: [2, 3] },
        // 2: Column (child of Row, contains text at 4)
        { type: "Column", props: { flex: 1 }, children: [4] },
        // 3: Column (child of Row, contains text at 5)
        { type: "Column", props: { flex: 1 }, children: [5] },
        // 4: Text (child of Column 2)
        { type: "Text", props: { text: "Left column content" } },
        // 5: Text (child of Column 3)
        { type: "Text", props: { text: "Right column content" } },
      ],
    },
  ],
}

// --- Tests ---

describe("buildTemplate", () => {
  it("should create a valid template from a single-page invoice", () => {
    const template = buildTemplate(singlePageInvoice)

    // Validate against Zod schema
    const result = templateSchema.safeParse(template)
    expect(result.success).toBe(true)

    // Check name
    expect(template.name).toBe("Invoice #1234")

    // Check Document > Page structure
    const doc = template.elements[template.root]!
    expect(doc.type).toBe("Document")
    expect(doc.children).toHaveLength(1)

    const pageId = doc.children[0]!
    const page = template.elements[pageId]!
    expect(page.type).toBe("Page")
    expect(page.props.size).toBe("A4")

    // Check page has 6 children (all elements are top-level)
    expect(page.children).toHaveLength(6)

    // Check element types
    const childTypes = page.children.map((id) => template.elements[id]!.type)
    expect(childTypes).toEqual(["Heading", "Text", "Divider", "Table", "Spacer", "Text"])

    // Check state
    expect(template.state).toEqual({ invoiceNumber: "1234" })
  })

  it("should create a valid template from a multi-page report", () => {
    const template = buildTemplate(multiPageReport)

    const result = templateSchema.safeParse(template)
    expect(result.success).toBe(true)

    // Document should have 2 pages
    const doc = template.elements[template.root]!
    expect(doc.children).toHaveLength(2)

    // Page 1
    const page1 = template.elements[doc.children[0]!]!
    expect(page1.type).toBe("Page")
    expect(page1.children).toHaveLength(3)

    // Page 2
    const page2 = template.elements[doc.children[1]!]!
    expect(page2.type).toBe("Page")
    expect(page2.children).toHaveLength(3)

    // Check content of page 2
    const page2FirstChild = template.elements[page2.children[0]!]!
    expect(page2FirstChild.type).toBe("Heading")
    expect(page2FirstChild.props.text).toBe("Financial Overview")

    // No state
    expect(template.state).toEqual({})
  })

  it("should handle nested Row/Column layouts correctly", () => {
    const template = buildTemplate(nestedLayoutPage)

    const result = templateSchema.safeParse(template)
    expect(result.success).toBe(true)

    const doc = template.elements[template.root]!
    const pageId = doc.children[0]!
    const page = template.elements[pageId]!

    // Only Heading and Row should be top-level (indices 0 and 1)
    expect(page.children).toHaveLength(2)

    const [headingId, rowId] = page.children
    expect(template.elements[headingId!]!.type).toBe("Heading")

    const row = template.elements[rowId!]!
    expect(row.type).toBe("Row")
    expect(row.children).toHaveLength(2)

    // Columns
    const [col1Id, col2Id] = row.children
    const col1 = template.elements[col1Id!]!
    const col2 = template.elements[col2Id!]!
    expect(col1.type).toBe("Column")
    expect(col2.type).toBe("Column")

    // Column children
    expect(col1.children).toHaveLength(1)
    expect(col2.children).toHaveLength(1)

    const leftText = template.elements[col1.children[0]!]!
    const rightText = template.elements[col2.children[0]!]!
    expect(leftText.props.text).toBe("Left column content")
    expect(rightText.props.text).toBe("Right column content")
  })

  it("should preserve page settings per page", () => {
    const input: ImportResult = {
      name: "Mixed Orientations",
      pages: [
        {
          pageSettings: {
            size: "A4",
            orientation: "portrait",
            marginTop: 40,
            marginRight: 40,
            marginBottom: 40,
            marginLeft: 40,
          },
          elements: [
            { type: "Text", props: { text: "Portrait page" } },
          ],
        },
        {
          pageSettings: {
            size: "LETTER",
            orientation: "landscape",
            marginTop: 20,
            marginRight: 20,
            marginBottom: 20,
            marginLeft: 20,
          },
          elements: [
            { type: "Text", props: { text: "Landscape page" } },
          ],
        },
      ],
    }

    const template = buildTemplate(input)
    const doc = template.elements[template.root]!

    const page1 = template.elements[doc.children[0]!]!
    const page2 = template.elements[doc.children[1]!]!

    expect(page1.props.size).toBe("A4")
    expect(page1.props.orientation).toBe("portrait")
    expect(page1.props.marginTop).toBe(40)

    expect(page2.props.size).toBe("LETTER")
    expect(page2.props.orientation).toBe("landscape")
    expect(page2.props.marginTop).toBe(20)
  })

  it("should generate unique IDs for all elements", () => {
    const template = buildTemplate(singlePageInvoice)

    const allIds = Object.keys(template.elements)
    const uniqueIds = new Set(allIds)
    expect(uniqueIds.size).toBe(allIds.length)
  })

  it("should handle empty page elements", () => {
    const input: ImportResult = {
      name: "Empty Page",
      pages: [
        {
          pageSettings: {
            size: "A4",
            orientation: "portrait",
            marginTop: 40,
            marginRight: 40,
            marginBottom: 40,
            marginLeft: 40,
          },
          elements: [],
        },
      ],
    }

    const template = buildTemplate(input)
    const result = templateSchema.safeParse(template)
    expect(result.success).toBe(true)

    const doc = template.elements[template.root]!
    const page = template.elements[doc.children[0]!]!
    expect(page.children).toHaveLength(0)
  })
})

describe("importResultSchema", () => {
  it("should validate a correct import result", () => {
    const result = importResultSchema.safeParse(singlePageInvoice)
    expect(result.success).toBe(true)
  })

  it("should reject empty pages array", () => {
    const result = importResultSchema.safeParse({
      name: "Test",
      pages: [],
    })
    expect(result.success).toBe(false)
  })

  it("should reject missing name", () => {
    const result = importResultSchema.safeParse({
      pages: [{ pageSettings: { size: "A4" }, elements: [] }],
    })
    expect(result.success).toBe(false)
  })

  it("should reject invalid element type", () => {
    const result = importResultSchema.safeParse({
      name: "Test",
      pages: [{
        pageSettings: { size: "A4" },
        elements: [{ type: "InvalidType", props: {} }],
      }],
    })
    expect(result.success).toBe(false)
  })

  it("should apply defaults to page settings", () => {
    const result = importResultSchema.parse({
      name: "Test",
      pages: [{
        pageSettings: {},
        elements: [],
      }],
    })

    expect(result.pages[0]!.pageSettings.size).toBe("A4")
    expect(result.pages[0]!.pageSettings.orientation).toBe("portrait")
    expect(result.pages[0]!.pageSettings.marginTop).toBe(40)
  })
})
