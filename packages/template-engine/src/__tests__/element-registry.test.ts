import { describe, it, expect, beforeEach } from "vitest"
import { registerElement, getElementComponent, getRegistry } from "../renderer/element-registry"

describe("Element Registry", () => {
  it("should register and retrieve a component", () => {
    const MockComponent = () => null
    registerElement("TestElement", MockComponent as any)
    const result = getElementComponent("TestElement" as any)
    expect(result).toBe(MockComponent)
  })

  it("should return undefined for unregistered type", () => {
    const result = getElementComponent("NonExistent" as any)
    expect(result).toBeUndefined()
  })

  it("should return a readonly map from getRegistry", () => {
    const registry = getRegistry()
    expect(registry).toBeInstanceOf(Map)
  })

  it("should overwrite existing registration", () => {
    const First = () => null
    const Second = () => null
    registerElement("Overwrite", First as any)
    registerElement("Overwrite", Second as any)
    expect(getElementComponent("Overwrite" as any)).toBe(Second)
  })
})
