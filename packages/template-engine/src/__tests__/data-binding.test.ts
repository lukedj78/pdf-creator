import { describe, it, expect } from "vitest"
import { resolvePointer, resolveExpression, resolveProps, evaluateVisible } from "../utils"
import type { ResolveContext } from "../utils"

const sampleState = {
  user: { name: "Alice", email: "alice@example.com" },
  invoice: { number: "INV-001", total: 1320, isPaid: true },
  items: [
    { id: "1", title: "Widget", price: 10 },
    { id: "2", title: "Gadget", price: 20 },
  ],
}

const ctx: ResolveContext = { state: sampleState }

describe("Data Binding — JSON Pointer", () => {
  describe("resolvePointer", () => {
    it("should resolve simple path", () => {
      expect(resolvePointer(sampleState, "/user/name")).toBe("Alice")
    })

    it("should resolve nested path", () => {
      expect(resolvePointer(sampleState, "/user/email")).toBe("alice@example.com")
    })

    it("should resolve array index", () => {
      expect(resolvePointer(sampleState, "/items/0/title")).toBe("Widget")
      expect(resolvePointer(sampleState, "/items/1/price")).toBe(20)
    })

    it("should return undefined for missing path", () => {
      expect(resolvePointer(sampleState, "/missing/path")).toBeUndefined()
    })

    it("should return undefined for invalid pointer (no leading slash)", () => {
      expect(resolvePointer(sampleState, "user/name")).toBeUndefined()
    })

    it("should resolve numbers", () => {
      expect(resolvePointer(sampleState, "/invoice/total")).toBe(1320)
    })

    it("should resolve booleans", () => {
      expect(resolvePointer(sampleState, "/invoice/isPaid")).toBe(true)
    })
  })
})

describe("Data Binding — Expressions", () => {
  describe("$state", () => {
    it("should resolve $state expression", () => {
      const result = resolveExpression({ $state: "/user/name" }, ctx)
      expect(result).toBe("Alice")
    })

    it("should return undefined for missing $state path", () => {
      const result = resolveExpression({ $state: "/missing" }, ctx)
      expect(result).toBeUndefined()
    })
  })

  describe("$template", () => {
    it("should interpolate string template", () => {
      const result = resolveExpression(
        { $template: "Hello ${/user/name}!" },
        ctx
      )
      expect(result).toBe("Hello Alice!")
    })

    it("should interpolate multiple values", () => {
      const result = resolveExpression(
        { $template: "${/user/name} - ${/invoice/number}" },
        ctx
      )
      expect(result).toBe("Alice - INV-001")
    })

    it("should handle missing values as empty string", () => {
      const result = resolveExpression(
        { $template: "Hello ${/missing}!" },
        ctx
      )
      expect(result).toBe("Hello !")
    })
  })

  describe("$item", () => {
    it("should resolve $item field", () => {
      const itemCtx: ResolveContext = {
        state: sampleState,
        item: { title: "Widget", price: 10 },
        index: 0,
      }
      expect(resolveExpression({ $item: "title" }, itemCtx)).toBe("Widget")
      expect(resolveExpression({ $item: "price" }, itemCtx)).toBe(10)
    })

    it("should return entire item when field is empty string", () => {
      const itemCtx: ResolveContext = {
        state: sampleState,
        item: { title: "Widget" },
        index: 0,
      }
      expect(resolveExpression({ $item: "" }, itemCtx)).toEqual({ title: "Widget" })
    })

    it("should return undefined when no item context", () => {
      expect(resolveExpression({ $item: "title" }, ctx)).toBeUndefined()
    })
  })

  describe("$index", () => {
    it("should resolve $index", () => {
      const itemCtx: ResolveContext = { state: sampleState, index: 3 }
      expect(resolveExpression({ $index: true }, itemCtx)).toBe(3)
    })

    it("should default to 0", () => {
      expect(resolveExpression({ $index: true }, ctx)).toBe(0)
    })
  })

  describe("$cond", () => {
    it("should resolve to $then when truthy", () => {
      const result = resolveExpression(
        { $cond: { $state: "/invoice/isPaid" }, $then: "Paid", $else: "Pending" },
        ctx
      )
      expect(result).toBe("Paid")
    })

    it("should resolve to $else when falsy", () => {
      const result = resolveExpression(
        { $cond: { $state: "/missing" }, $then: "Yes", $else: "No" },
        ctx
      )
      expect(result).toBe("No")
    })

    it("should resolve nested expressions in $then/$else", () => {
      const result = resolveExpression(
        { $cond: { $state: "/invoice/isPaid" }, $then: { $state: "/user/name" }, $else: "Unknown" },
        ctx
      )
      expect(result).toBe("Alice")
    })
  })

  describe("$computed", () => {
    it("should return $computed expression as-is", () => {
      const expr = { $computed: "sum", args: { field: "amount" } }
      const result = resolveExpression(expr, ctx)
      expect(result).toEqual(expr)
    })

    it("should return $computed without args as-is", () => {
      const expr = { $computed: "total" }
      const result = resolveExpression(expr, ctx)
      expect(result).toEqual(expr)
    })
  })

  describe("literal values", () => {
    it("should pass through strings", () => {
      expect(resolveExpression("hello", ctx)).toBe("hello")
    })

    it("should pass through numbers", () => {
      expect(resolveExpression(42, ctx)).toBe(42)
    })

    it("should pass through booleans", () => {
      expect(resolveExpression(true, ctx)).toBe(true)
    })

    it("should pass through null", () => {
      expect(resolveExpression(null, ctx)).toBeNull()
    })
  })
})

describe("Data Binding — resolveProps", () => {
  it("should resolve all expressions in props", () => {
    const props = {
      text: { $state: "/user/name" },
      fontSize: 12,
      color: "#000",
    }
    const resolved = resolveProps(props, ctx)
    expect(resolved.text).toBe("Alice")
    expect(resolved.fontSize).toBe(12)
    expect(resolved.color).toBe("#000")
  })

  it("should resolve expressions in arrays", () => {
    const props = {
      items: [
        { $state: "/items/0/title" },
        { $state: "/items/1/title" },
        "Static item",
      ],
    }
    const resolved = resolveProps(props, ctx)
    expect(resolved.items).toEqual(["Widget", "Gadget", "Static item"])
  })

  it("should resolve nested objects in arrays", () => {
    const props = {
      columns: [
        { header: "Name", value: { $state: "/user/name" } },
      ],
    }
    const resolved = resolveProps(props, ctx)
    expect((resolved.columns as any)[0].value).toBe("Alice")
  })

  it("should pass through non-expression objects", () => {
    const props = {
      config: { nested: "value" },
    }
    const resolved = resolveProps(props, ctx)
    expect(resolved.config).toEqual({ nested: "value" })
  })

  it("should handle array with primitive values", () => {
    const props = {
      items: [1, "two", true],
    }
    const resolved = resolveProps(props, ctx)
    expect(resolved.items).toEqual([1, "two", true])
  })
})

describe("Data Binding — evaluateVisible", () => {
  it("should return true when condition matches", () => {
    const result = evaluateVisible(
      { $state: "/invoice/isPaid", eq: true },
      ctx
    )
    expect(result).toBe(true)
  })

  it("should return false when condition does not match", () => {
    const result = evaluateVisible(
      { $state: "/invoice/isPaid", eq: false },
      ctx
    )
    expect(result).toBe(false)
  })

  it("should return false for missing path", () => {
    const result = evaluateVisible(
      { $state: "/missing", eq: true },
      ctx
    )
    expect(result).toBe(false)
  })
})
