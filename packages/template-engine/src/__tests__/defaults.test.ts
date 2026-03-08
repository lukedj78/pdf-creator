import { describe, it, expect } from "vitest"
import {
  invoiceTemplate,
  reportTemplate,
  contractTemplate,
  defaultTemplates,
} from "../defaults"
import { templateSchema } from "../schema/types"

describe("Default Templates", () => {
  it("should export 3 default templates", () => {
    expect(defaultTemplates).toHaveLength(3)
  })

  it("should include invoice, report, and contract", () => {
    expect(defaultTemplates).toContain(invoiceTemplate)
    expect(defaultTemplates).toContain(reportTemplate)
    expect(defaultTemplates).toContain(contractTemplate)
  })

  describe("Invoice Template", () => {
    it("should be valid", () => {
      expect(templateSchema.safeParse(invoiceTemplate).success).toBe(true)
    })

    it("should have correct metadata", () => {
      expect(invoiceTemplate.name).toBe("Invoice")
      expect(invoiceTemplate.id).toBe("default-invoice")
      expect(invoiceTemplate.meta.category).toBe("business")
      expect(invoiceTemplate.meta.tags).toContain("invoice")
    })

    it("should have Document > Page structure", () => {
      const doc = invoiceTemplate.elements[invoiceTemplate.root]!
      expect(doc.type).toBe("Document")
      expect(doc.children.length).toBeGreaterThanOrEqual(1)

      const pageId = doc.children[0]!
      expect(invoiceTemplate.elements[pageId]!.type).toBe("Page")
    })

    it("should have state with company, client, and invoice data", () => {
      expect(invoiceTemplate.state.company).toBeDefined()
      expect(invoiceTemplate.state.client).toBeDefined()
      expect(invoiceTemplate.state.invoice).toBeDefined()
    })

    it("should have a Table element", () => {
      const hasTable = Object.values(invoiceTemplate.elements).some(
        (el) => el.type === "Table"
      )
      expect(hasTable).toBe(true)
    })
  })

  describe("Report Template", () => {
    it("should be valid", () => {
      expect(templateSchema.safeParse(reportTemplate).success).toBe(true)
    })

    it("should have correct metadata", () => {
      expect(reportTemplate.name).toBe("Monthly Report")
      expect(reportTemplate.id).toBe("default-report")
      expect(reportTemplate.meta.category).toBe("business")
    })

    it("should have state with report data", () => {
      expect(reportTemplate.state.report).toBeDefined()
    })
  })

  describe("Contract Template", () => {
    it("should be valid", () => {
      expect(templateSchema.safeParse(contractTemplate).success).toBe(true)
    })

    it("should have correct metadata", () => {
      expect(contractTemplate.name).toBe("Contract Agreement")
      expect(contractTemplate.id).toBe("default-contract")
      expect(contractTemplate.meta.category).toBe("legal")
    })

    it("should have state with contract and parties data", () => {
      expect(contractTemplate.state.contract).toBeDefined()
      expect(contractTemplate.state.party1).toBeDefined()
      expect(contractTemplate.state.party2).toBeDefined()
    })

    it("should have signature row elements", () => {
      expect(invoiceTemplate.elements["footer-note"]).toBeDefined()
      expect(contractTemplate.elements["signature-row"]).toBeDefined()
      expect(contractTemplate.elements["signature-row"]!.type).toBe("Row")
    })

    it("should have a List element for terms", () => {
      const hasList = Object.values(contractTemplate.elements).some(
        (el) => el.type === "List"
      )
      expect(hasList).toBe(true)
    })
  })
})
