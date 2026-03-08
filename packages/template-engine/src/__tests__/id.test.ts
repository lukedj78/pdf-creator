import { describe, it, expect } from "vitest"
import { generateId } from "../utils"

describe("generateId", () => {
  it("should generate a string", () => {
    const id = generateId()
    expect(typeof id).toBe("string")
  })

  it("should use default prefix 'el'", () => {
    const id = generateId()
    expect(id.startsWith("el_")).toBe(true)
  })

  it("should use custom prefix", () => {
    const id = generateId("doc")
    expect(id.startsWith("doc_")).toBe(true)
  })

  it("should generate unique IDs", () => {
    const ids = new Set<string>()
    for (let i = 0; i < 100; i++) {
      ids.add(generateId())
    }
    expect(ids.size).toBe(100)
  })

  it("should contain timestamp component", () => {
    const id = generateId("el")
    const parts = id.split("_")
    expect(parts.length).toBeGreaterThanOrEqual(3)
  })
})
