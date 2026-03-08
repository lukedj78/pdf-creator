import { describe, it, expect } from "vitest"
import {
  isExpression,
  isStateExpr,
  isTemplateExpr,
  isItemExpr,
  toSpec,
  templateSchema,
  specSchema,
  elementTypeSchema,
  elementSchema,
  templateMetaSchema,
  stateExprSchema,
  templateExprSchema,
  itemExprSchema,
  indexExprSchema,
  condExprSchema,
  computedExprSchema,
  visibleSchema,
  repeatSchema,
  documentPropsSchema,
  pagePropsSchema,
  textPropsSchema,
  headingPropsSchema,
  imagePropsSchema,
  linkPropsSchema,
  tablePropsSchema,
  listPropsSchema,
  dividerPropsSchema,
  spacerPropsSchema,
  pageNumberPropsSchema,
  viewPropsSchema,
  rowPropsSchema,
  columnPropsSchema,
} from "../schema/types"
import { createEmptyTemplate } from "../utils"

describe("isExpression", () => {
  it("should return true for $state expression", () => {
    expect(isExpression({ $state: "/user/name" })).toBe(true)
  })

  it("should return true for $template expression", () => {
    expect(isExpression({ $template: "Hello ${/name}" })).toBe(true)
  })

  it("should return true for $item expression", () => {
    expect(isExpression({ $item: "field" })).toBe(true)
  })

  it("should return true for $index expression", () => {
    expect(isExpression({ $index: true })).toBe(true)
  })

  it("should return true for $cond expression", () => {
    expect(isExpression({ $cond: true, $then: "a", $else: "b" })).toBe(true)
  })

  it("should return true for $computed expression", () => {
    expect(isExpression({ $computed: "sum" })).toBe(true)
  })

  it("should return false for plain string", () => {
    expect(isExpression("hello")).toBe(false)
  })

  it("should return false for number", () => {
    expect(isExpression(42)).toBe(false)
  })

  it("should return false for null", () => {
    expect(isExpression(null)).toBe(false)
  })

  it("should return false for plain object", () => {
    expect(isExpression({ foo: "bar" })).toBe(false)
  })

  it("should return false for undefined", () => {
    expect(isExpression(undefined)).toBe(false)
  })
})

describe("isStateExpr", () => {
  it("should return true for $state", () => {
    expect(isStateExpr({ $state: "/path" })).toBe(true)
  })

  it("should return false for $template", () => {
    expect(isStateExpr({ $template: "text" })).toBe(false)
  })

  it("should return false for string", () => {
    expect(isStateExpr("hello")).toBe(false)
  })

  it("should return false for null", () => {
    expect(isStateExpr(null)).toBe(false)
  })
})

describe("isTemplateExpr", () => {
  it("should return true for $template", () => {
    expect(isTemplateExpr({ $template: "text" })).toBe(true)
  })

  it("should return false for $state", () => {
    expect(isTemplateExpr({ $state: "/path" })).toBe(false)
  })

  it("should return false for number", () => {
    expect(isTemplateExpr(42)).toBe(false)
  })
})

describe("isItemExpr", () => {
  it("should return true for $item", () => {
    expect(isItemExpr({ $item: "field" })).toBe(true)
  })

  it("should return false for $state", () => {
    expect(isItemExpr({ $state: "/path" })).toBe(false)
  })

  it("should return false for string", () => {
    expect(isItemExpr("hello")).toBe(false)
  })
})

describe("toSpec", () => {
  it("should strip metadata from template", () => {
    const template = createEmptyTemplate("Test")
    const spec = toSpec(template)

    expect(spec.root).toBe(template.root)
    expect(spec.elements).toBe(template.elements)
    expect(spec.state).toBe(template.state)
    expect((spec as any).id).toBeUndefined()
    expect((spec as any).name).toBeUndefined()
    expect((spec as any).version).toBeUndefined()
    expect((spec as any).meta).toBeUndefined()
  })
})

describe("Zod Schemas", () => {
  describe("elementTypeSchema", () => {
    const validTypes = [
      "Document", "Page", "View", "Row", "Column",
      "Text", "Heading", "Image", "Link",
      "Table", "List", "Divider", "Spacer", "PageNumber",
    ]

    for (const type of validTypes) {
      it(`should accept '${type}'`, () => {
        expect(elementTypeSchema.safeParse(type).success).toBe(true)
      })
    }

    it("should reject invalid type", () => {
      expect(elementTypeSchema.safeParse("Button").success).toBe(false)
    })
  })

  describe("expression schemas", () => {
    it("should validate $state expression", () => {
      expect(stateExprSchema.safeParse({ $state: "/path" }).success).toBe(true)
    })

    it("should reject $state without string", () => {
      expect(stateExprSchema.safeParse({ $state: 123 }).success).toBe(false)
    })

    it("should validate $template expression", () => {
      expect(templateExprSchema.safeParse({ $template: "Hello ${/name}" }).success).toBe(true)
    })

    it("should validate $item expression", () => {
      expect(itemExprSchema.safeParse({ $item: "field" }).success).toBe(true)
    })

    it("should validate $index expression", () => {
      expect(indexExprSchema.safeParse({ $index: true }).success).toBe(true)
    })

    it("should reject $index with false", () => {
      expect(indexExprSchema.safeParse({ $index: false }).success).toBe(false)
    })

    it("should validate $cond expression", () => {
      expect(condExprSchema.safeParse({ $cond: true, $then: "a", $else: "b" }).success).toBe(true)
    })

    it("should validate $computed expression", () => {
      expect(computedExprSchema.safeParse({ $computed: "sum" }).success).toBe(true)
    })

    it("should validate $computed with args", () => {
      expect(computedExprSchema.safeParse({ $computed: "sum", args: { a: 1 } }).success).toBe(true)
    })
  })

  describe("visibleSchema", () => {
    it("should validate visible condition", () => {
      expect(visibleSchema.safeParse({ $state: "/show", eq: true }).success).toBe(true)
    })

    it("should reject missing $state", () => {
      expect(visibleSchema.safeParse({ eq: true }).success).toBe(false)
    })
  })

  describe("repeatSchema", () => {
    it("should validate repeat config", () => {
      expect(repeatSchema.safeParse({ statePath: "/items", key: "id" }).success).toBe(true)
    })

    it("should reject missing key", () => {
      expect(repeatSchema.safeParse({ statePath: "/items" }).success).toBe(false)
    })
  })

  describe("props schemas", () => {
    it("should validate document props", () => {
      expect(documentPropsSchema.safeParse({ title: "Doc" }).success).toBe(true)
    })

    it("should accept empty document props", () => {
      expect(documentPropsSchema.safeParse({}).success).toBe(true)
    })

    it("should validate page props", () => {
      expect(pagePropsSchema.safeParse({ size: "A4", orientation: "portrait" }).success).toBe(true)
    })

    it("should reject invalid page size", () => {
      expect(pagePropsSchema.safeParse({ size: "CUSTOM" }).success).toBe(false)
    })

    it("should validate text props", () => {
      expect(textPropsSchema.safeParse({ text: "Hello", fontSize: 12 }).success).toBe(true)
    })

    it("should validate text with expression", () => {
      expect(textPropsSchema.safeParse({ text: { $state: "/name" } }).success).toBe(true)
    })

    it("should validate heading props", () => {
      expect(headingPropsSchema.safeParse({ text: "Title", level: "h1" }).success).toBe(true)
    })

    it("should reject invalid heading level", () => {
      expect(headingPropsSchema.safeParse({ text: "Title", level: "h5" }).success).toBe(false)
    })

    it("should validate image props", () => {
      expect(imagePropsSchema.safeParse({ src: "https://example.com/img.png", width: 100 }).success).toBe(true)
    })

    it("should validate link props", () => {
      expect(linkPropsSchema.safeParse({ text: "Click", href: "https://example.com" }).success).toBe(true)
    })

    it("should validate table props", () => {
      expect(tablePropsSchema.safeParse({
        columns: [{ header: "Name" }],
        rows: [["Alice"]],
      }).success).toBe(true)
    })

    it("should validate list props", () => {
      expect(listPropsSchema.safeParse({ items: ["a", "b"], ordered: true }).success).toBe(true)
    })

    it("should validate divider props", () => {
      expect(dividerPropsSchema.safeParse({ color: "#000", thickness: 2 }).success).toBe(true)
    })

    it("should validate spacer props", () => {
      expect(spacerPropsSchema.safeParse({ height: 20 }).success).toBe(true)
    })

    it("should validate page number props", () => {
      expect(pageNumberPropsSchema.safeParse({ format: "{pageNumber}", align: "center" }).success).toBe(true)
    })

    it("should validate view props", () => {
      expect(viewPropsSchema.safeParse({ padding: 10, backgroundColor: "#fff" }).success).toBe(true)
    })

    it("should validate row props", () => {
      expect(rowPropsSchema.safeParse({ gap: 8, justifyContent: "space-between" }).success).toBe(true)
    })

    it("should validate column props", () => {
      expect(columnPropsSchema.safeParse({ flex: 1, gap: 8 }).success).toBe(true)
    })
  })

  describe("elementSchema", () => {
    it("should validate a basic element", () => {
      expect(elementSchema.safeParse({
        type: "Text",
        props: { text: "Hello" },
        children: [],
      }).success).toBe(true)
    })

    it("should apply defaults", () => {
      const result = elementSchema.parse({ type: "Text" })
      expect(result.props).toEqual({})
      expect(result.children).toEqual([])
    })

    it("should accept visible condition", () => {
      expect(elementSchema.safeParse({
        type: "Text",
        props: {},
        children: [],
        visible: { $state: "/show", eq: true },
      }).success).toBe(true)
    })

    it("should accept repeat config", () => {
      expect(elementSchema.safeParse({
        type: "View",
        props: {},
        children: [],
        repeat: { statePath: "/items", key: "id" },
      }).success).toBe(true)
    })
  })

  describe("specSchema", () => {
    it("should validate a minimal spec", () => {
      expect(specSchema.safeParse({
        root: "doc",
        elements: {
          doc: { type: "Document", props: {}, children: [] },
        },
      }).success).toBe(true)
    })

    it("should apply state default", () => {
      const result = specSchema.parse({
        root: "doc",
        elements: {
          doc: { type: "Document", props: {}, children: [] },
        },
      })
      expect(result.state).toEqual({})
    })
  })

  describe("templateMetaSchema", () => {
    it("should validate full meta", () => {
      expect(templateMetaSchema.safeParse({
        author: "Test",
        description: "A template",
        tags: ["invoice"],
        category: "business",
      }).success).toBe(true)
    })

    it("should accept empty meta", () => {
      expect(templateMetaSchema.safeParse({}).success).toBe(true)
    })
  })

  describe("templateSchema", () => {
    it("should validate a complete template", () => {
      const template = createEmptyTemplate("Test")
      expect(templateSchema.safeParse(template).success).toBe(true)
    })

    it("should apply version default", () => {
      const result = templateSchema.parse({
        id: "test",
        name: "Test",
        root: "doc",
        elements: {
          doc: { type: "Document", props: {}, children: [] },
        },
      })
      expect(result.version).toBe(1)
    })

    it("should reject missing id", () => {
      expect(templateSchema.safeParse({
        name: "Test",
        root: "doc",
        elements: { doc: { type: "Document", props: {}, children: [] } },
      }).success).toBe(false)
    })
  })
})
