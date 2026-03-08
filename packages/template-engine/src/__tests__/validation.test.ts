import { describe, it, expect } from "vitest"
import { validateTemplate, validateTemplateStrict, createEmptyTemplate } from "../utils"

describe("validateTemplate", () => {
  it("should return success for a valid template", () => {
    const template = createEmptyTemplate("Valid")
    const result = validateTemplate(template)
    expect(result.success).toBe(true)
    expect(result.data).toBeDefined()
    expect(result.error).toBeUndefined()
  })

  it("should return error for missing required fields", () => {
    const result = validateTemplate({})
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
    expect(result.error!.length).toBeGreaterThan(0)
  })

  it("should return error for invalid element type", () => {
    const result = validateTemplate({
      id: "test",
      name: "Test",
      root: "doc",
      elements: {
        doc: { type: "InvalidType", props: {}, children: [] },
      },
    })
    expect(result.success).toBe(false)
  })

  it("should return error for missing name", () => {
    const result = validateTemplate({
      id: "test",
      root: "doc",
      elements: {
        doc: { type: "Document", props: {}, children: [] },
      },
    })
    expect(result.success).toBe(false)
  })

  it("should return error for null input", () => {
    const result = validateTemplate(null)
    expect(result.success).toBe(false)
  })

  it("should return error for string input", () => {
    const result = validateTemplate("not a template")
    expect(result.success).toBe(false)
  })
})

describe("validateTemplateStrict", () => {
  it("should return parsed template for valid input", () => {
    const template = createEmptyTemplate("Strict")
    const result = validateTemplateStrict(template)
    expect(result.name).toBe("Strict")
    expect(result.root).toBeDefined()
  })

  it("should throw for invalid input", () => {
    expect(() => validateTemplateStrict({})).toThrow()
  })

  it("should throw for missing name", () => {
    expect(() =>
      validateTemplateStrict({
        id: "test",
        root: "doc",
        elements: {
          doc: { type: "Document", props: {}, children: [] },
        },
      })
    ).toThrow()
  })
})
