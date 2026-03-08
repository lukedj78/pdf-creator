import { describe, it, expect } from "vitest"
import {
  createEmptyTemplate,
  addElement,
  removeElement,
  updateElement,
  moveElement,
  duplicateElement,
  getPageElementId,
  updateState,
  removeState,
} from "../utils"

describe("Template Manipulation", () => {
  describe("createEmptyTemplate", () => {
    it("should create a template with Document > Page structure", () => {
      const t = createEmptyTemplate("My Template")
      expect(t.name).toBe("My Template")
      expect(t.root).toBeDefined()
      expect(t.elements[t.root]!.type).toBe("Document")

      const pageId = getPageElementId(t)!
      expect(pageId).toBeDefined()
      expect(t.elements[pageId]!.type).toBe("Page")
      expect(t.elements[pageId]!.props.size).toBe("A4")
    })
  })

  describe("addElement", () => {
    it("should add element to Page by default", () => {
      const t = createEmptyTemplate("Test")
      const pageId = getPageElementId(t)!
      const { template, elementId } = addElement(t, "Text", { text: "Hello" })

      expect(template.elements[elementId]).toBeDefined()
      expect(template.elements[elementId]!.type).toBe("Text")
      expect(template.elements[pageId]!.children).toContain(elementId)
    })

    it("should add element as child of specified parent", () => {
      const t = createEmptyTemplate("Test")
      const { template: t1, elementId: viewId } = addElement(t, "View")
      const { template: t2, elementId: textId } = addElement(t1, "Text", { text: "Hello" }, { parentId: viewId })

      expect(t2.elements[viewId]!.children).toContain(textId)
    })

    it("should add element at specific index in parent", () => {
      const t = createEmptyTemplate("Test")
      const { template: t1, elementId: text1 } = addElement(t, "Text", { text: "1" })
      const { template: t2, elementId: text2 } = addElement(t1, "Text", { text: "2" })

      const pageId = getPageElementId(t2)!
      const pageBefore = t2.elements[pageId]!
      const idx = pageBefore.children.indexOf(text1)

      // Insert at the position of text1
      const { template: t3, elementId: text3 } = addElement(t2, "Text", { text: "3" }, { parentId: pageId, index: idx })
      expect(t3.elements[pageId]!.children.indexOf(text3)).toBe(idx)
    })
  })

  describe("removeElement", () => {
    it("should remove element from parent", () => {
      const t = createEmptyTemplate("Test")
      const { template: t1, elementId } = addElement(t, "Text", { text: "Hello" })
      const t2 = removeElement(t1, elementId)

      expect(t2.elements[elementId]).toBeUndefined()
      const pageId = getPageElementId(t2)!
      expect(t2.elements[pageId]!.children).not.toContain(elementId)
    })

    it("should remove element and its children recursively", () => {
      const t = createEmptyTemplate("Test")
      const { template: t1, elementId: viewId } = addElement(t, "View")
      const { template: t2, elementId: textId } = addElement(t1, "Text", { text: "Hello" }, { parentId: viewId })
      const t3 = removeElement(t2, viewId)

      expect(t3.elements[viewId]).toBeUndefined()
      expect(t3.elements[textId]).toBeUndefined()
    })

    it("should not allow removing Document", () => {
      const t = createEmptyTemplate("Test")
      const t2 = removeElement(t, t.root)
      expect(t2.elements[t.root]).toBeDefined()
    })

    it("should not allow removing the last Page", () => {
      const t = createEmptyTemplate("Test")
      const pageId = getPageElementId(t)!
      const t2 = removeElement(t, pageId)
      expect(t2.elements[pageId]).toBeDefined()
    })
  })

  describe("updateElement", () => {
    it("should update element props", () => {
      const t = createEmptyTemplate("Test")
      const { template: t1, elementId } = addElement(t, "Text", { text: "Hello" })
      const t2 = updateElement(t1, elementId, { props: { text: "World" } })

      expect(t2.elements[elementId]!.props.text).toBe("World")
    })

    it("should merge props (not replace)", () => {
      const t = createEmptyTemplate("Test")
      const { template: t1, elementId } = addElement(t, "Text", { text: "Hello", fontSize: 12 })
      const t2 = updateElement(t1, elementId, { props: { color: "#000" } })

      expect(t2.elements[elementId]!.props.text).toBe("Hello")
      expect(t2.elements[elementId]!.props.fontSize).toBe(12)
      expect(t2.elements[elementId]!.props.color).toBe("#000")
    })

    it("should update visible condition", () => {
      const t = createEmptyTemplate("Test")
      const { template: t1, elementId } = addElement(t, "Text", { text: "Hello" })
      const t2 = updateElement(t1, elementId, {
        visible: { $state: "/show", eq: true },
      })

      expect(t2.elements[elementId]!.visible).toEqual({ $state: "/show", eq: true })
    })

    it("should update repeat config", () => {
      const t = createEmptyTemplate("Test")
      const { template: t1, elementId } = addElement(t, "View")
      const t2 = updateElement(t1, elementId, {
        repeat: { statePath: "/items", key: "id" },
      })

      expect(t2.elements[elementId]!.repeat).toEqual({ statePath: "/items", key: "id" })
    })
  })

  describe("moveElement", () => {
    it("should move element between parents", () => {
      const t = createEmptyTemplate("Test")
      const pageId = getPageElementId(t)!
      const { template: t1, elementId: view1 } = addElement(t, "View")
      const { template: t2, elementId: view2 } = addElement(t1, "View")
      const { template: t3, elementId: textId } = addElement(t2, "Text", { text: "Move me" }, { parentId: view1 })

      expect(t3.elements[view1]!.children).toContain(textId)

      const t4 = moveElement(t3, textId, view2, 0)
      expect(t4.elements[view1]!.children).not.toContain(textId)
      expect(t4.elements[view2]!.children).toContain(textId)
    })

    it("should not allow moving Document or Page", () => {
      const t = createEmptyTemplate("Test")
      const pageId = getPageElementId(t)!
      const { template: t1, elementId: viewId } = addElement(t, "View")

      const t2 = moveElement(t1, t1.root, viewId, 0)
      expect(t2.elements[t2.root]!.type).toBe("Document") // unchanged

      const t3 = moveElement(t1, pageId, viewId, 0)
      expect(t3.elements[pageId]!.type).toBe("Page") // unchanged
    })
  })

  describe("duplicateElement", () => {
    it("should duplicate an element", () => {
      const t = createEmptyTemplate("Test")
      const { template: t1, elementId } = addElement(t, "Text", { text: "Hello" })
      const result = duplicateElement(t1, elementId)

      expect(result).not.toBeNull()
      expect(result!.newElementId).not.toBe(elementId)
      expect(result!.template.elements[result!.newElementId]!.props.text).toBe("Hello")
    })

    it("should duplicate element with children", () => {
      const t = createEmptyTemplate("Test")
      const { template: t1, elementId: viewId } = addElement(t, "View")
      const { template: t2 } = addElement(t1, "Text", { text: "Child" }, { parentId: viewId })

      const result = duplicateElement(t2, viewId)
      expect(result).not.toBeNull()

      const newView = result!.template.elements[result!.newElementId]!
      expect(newView.children).toHaveLength(1)
      expect(newView.children[0]).not.toBe(viewId)
    })

    it("should return null for non-existent element", () => {
      const t = createEmptyTemplate("Test")
      const result = duplicateElement(t, "non-existent")
      expect(result).toBeNull()
    })

    it("should not duplicate Document or Page", () => {
      const t = createEmptyTemplate("Test")
      expect(duplicateElement(t, t.root)).toBeNull()

      const pageId = getPageElementId(t)!
      expect(duplicateElement(t, pageId)).toBeNull()
    })
  })

  describe("updateState", () => {
    it("should add a value to state", () => {
      const t = createEmptyTemplate("Test")
      const t2 = updateState(t, "/company/name", "Acme")

      expect((t2.state.company as Record<string, unknown>).name).toBe("Acme")
    })

    it("should create nested objects", () => {
      const t = createEmptyTemplate("Test")
      const t2 = updateState(t, "/a/b/c", "deep")

      expect(
        ((t2.state.a as Record<string, unknown>).b as Record<string, unknown>).c
      ).toBe("deep")
    })

    it("should not mutate original template", () => {
      const t = createEmptyTemplate("Test")
      const t2 = updateState(t, "/key", "value")

      expect(t.state).toEqual({})
      expect(t2.state.key).toBe("value")
    })
  })

  describe("removeState", () => {
    it("should remove a value from state", () => {
      let t = createEmptyTemplate("Test")
      t = updateState(t, "/company/name", "Acme")
      t = updateState(t, "/company/email", "a@b.com")
      t = removeState(t, "/company/email")

      const company = t.state.company as Record<string, unknown>
      expect(company.name).toBe("Acme")
      expect(company.email).toBeUndefined()
    })
  })
})
