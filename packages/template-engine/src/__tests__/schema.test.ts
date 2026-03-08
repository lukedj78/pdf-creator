import { describe, it, expect } from "vitest"
import { validateTemplate, validateTemplateStrict, createEmptyTemplate } from "../utils"
import { invoiceTemplate, reportTemplate, contractTemplate } from "../defaults"
import { templateSchema, specSchema, toSpec } from "../schema/types"

describe("Template Schema", () => {
  it("should validate a valid template", () => {
    const template = createEmptyTemplate("Test")
    const result = validateTemplate(template)
    expect(result.success).toBe(true)
    expect(result.data?.name).toBe("Test")
  })

  it("should reject invalid template (missing name)", () => {
    const result = validateTemplate({ id: "test", root: "x", elements: {} })
    expect(result.success).toBe(false)
  })

  it("should create template with Document > Page structure", () => {
    const template = createEmptyTemplate("Test")
    expect(template.root).toBeDefined()
    expect(template.elements[template.root]).toBeDefined()
    expect(template.elements[template.root]!.type).toBe("Document")

    const docChildren = template.elements[template.root]!.children
    expect(docChildren).toHaveLength(1)

    const pageEl = template.elements[docChildren[0]!]!
    expect(pageEl.type).toBe("Page")
    expect(pageEl.props.size).toBe("A4")
    expect(pageEl.props.orientation).toBe("portrait")
    expect(pageEl.props.marginTop).toBe(40)
  })

  it("should validate default invoice template", () => {
    const result = templateSchema.safeParse(invoiceTemplate)
    expect(result.success).toBe(true)
  })

  it("should validate default report template", () => {
    const result = templateSchema.safeParse(reportTemplate)
    expect(result.success).toBe(true)
  })

  it("should validate default contract template", () => {
    const result = templateSchema.safeParse(contractTemplate)
    expect(result.success).toBe(true)
  })

  it("should extract spec from template", () => {
    const template = createEmptyTemplate("Test")
    const spec = toSpec(template)
    expect(spec.root).toBe(template.root)
    expect(spec.elements).toBe(template.elements)
    expect(spec.state).toBe(template.state)
    // Spec should NOT have id, name, version, meta
    expect((spec as Record<string, unknown>).id).toBeUndefined()
    expect((spec as Record<string, unknown>).name).toBeUndefined()
  })

  it("should validate spec format", () => {
    const template = createEmptyTemplate("Test")
    const spec = toSpec(template)
    const result = specSchema.safeParse(spec)
    expect(result.success).toBe(true)
  })

  it("should have state default to empty object", () => {
    const template = createEmptyTemplate("Test")
    expect(template.state).toEqual({})
  })

  it("should validate invoice template state", () => {
    expect(invoiceTemplate.state.company).toBeDefined()
    expect(invoiceTemplate.state.invoice).toBeDefined()
    expect(invoiceTemplate.state.client).toBeDefined()
  })
})
