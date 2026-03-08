import { describe, it, expect } from "vitest"
import { variationSchema, variationsResultSchema } from "../lib/variations-schema"

describe("variationSchema", () => {
  it("should validate a valid variation", () => {
    const result = variationSchema.safeParse({
      label: "Bold & Dark",
      props: { fontSize: 16, color: "#000" },
    })
    expect(result.success).toBe(true)
  })

  it("should reject missing label", () => {
    const result = variationSchema.safeParse({
      props: { fontSize: 16 },
    })
    expect(result.success).toBe(false)
  })

  it("should reject missing props", () => {
    const result = variationSchema.safeParse({
      label: "Test",
    })
    expect(result.success).toBe(false)
  })

  it("should accept empty props", () => {
    const result = variationSchema.safeParse({
      label: "Minimal",
      props: {},
    })
    expect(result.success).toBe(true)
  })
})

describe("variationsResultSchema", () => {
  it("should validate result with 1 variation", () => {
    const result = variationsResultSchema.safeParse({
      variations: [{ label: "A", props: {} }],
    })
    expect(result.success).toBe(true)
  })

  it("should validate result with 4 variations", () => {
    const result = variationsResultSchema.safeParse({
      variations: [
        { label: "A", props: {} },
        { label: "B", props: {} },
        { label: "C", props: {} },
        { label: "D", props: {} },
      ],
    })
    expect(result.success).toBe(true)
  })

  it("should reject empty variations array", () => {
    const result = variationsResultSchema.safeParse({
      variations: [],
    })
    expect(result.success).toBe(false)
  })

  it("should reject more than 4 variations", () => {
    const result = variationsResultSchema.safeParse({
      variations: [
        { label: "A", props: {} },
        { label: "B", props: {} },
        { label: "C", props: {} },
        { label: "D", props: {} },
        { label: "E", props: {} },
      ],
    })
    expect(result.success).toBe(false)
  })

  it("should reject missing variations key", () => {
    const result = variationsResultSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})
