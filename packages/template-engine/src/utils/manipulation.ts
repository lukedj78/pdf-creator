import type { Element, ElementType, Template } from "../schema/types"
import { generateId } from "./id"

// ---------------------------------------------------------------------------
// Container types (elements that can have children)
// ---------------------------------------------------------------------------

const CONTAINER_TYPES: Set<ElementType> = new Set([
  "Document", "Page", "View", "Row", "Column",
])

function isContainerType(type: ElementType): boolean {
  return CONTAINER_TYPES.has(type)
}

// ---------------------------------------------------------------------------
// createEmptyTemplate — creates Document > Page as base structure
// ---------------------------------------------------------------------------

export function createEmptyTemplate(
  name: string,
  id?: string
): Template {
  const docId = generateId("doc")
  const pageId = generateId("page")

  return {
    id: id ?? generateId("tmpl"),
    name,
    version: 1,
    meta: {},
    root: docId,
    elements: {
      [docId]: {
        type: "Document",
        props: { title: name },
        children: [pageId],
      },
      [pageId]: {
        type: "Page",
        props: {
          size: "A4",
          orientation: "portrait",
          marginTop: 40,
          marginRight: 40,
          marginBottom: 40,
          marginLeft: 40,
        },
        children: [],
      },
    },
    state: {},
  }
}

// ---------------------------------------------------------------------------
// getPageElementId — finds the first Page element
// ---------------------------------------------------------------------------

export function getPageElementId(template: Template): string | null {
  const doc = template.elements[template.root]
  if (!doc) return null
  return doc.children.find((id) => template.elements[id]?.type === "Page") ?? null
}

// ---------------------------------------------------------------------------
// addElement
// ---------------------------------------------------------------------------

export function addElement(
  template: Template,
  type: ElementType,
  props: Record<string, unknown> = {},
  options?: {
    parentId?: string
    index?: number
  }
): { template: Template; elementId: string } {
  const id = generateId()
  const element: Element = {
    type,
    props,
    children: [],
  }

  const elements = { ...template.elements, [id]: element }

  // Determine parent: explicit, or auto-detect Page
  const parentId = options?.parentId ?? getPageElementId(template)

  if (parentId && elements[parentId]) {
    const parent = elements[parentId]!
    const children = [...parent.children]
    const index = options?.index ?? children.length
    children.splice(index, 0, id)
    elements[parentId] = { ...parent, children }
  }

  return {
    template: { ...template, elements },
    elementId: id,
  }
}

// ---------------------------------------------------------------------------
// removeElement
// ---------------------------------------------------------------------------

export function removeElement(
  template: Template,
  elementId: string
): Template {
  const element = template.elements[elementId]
  if (!element) return template

  // Don't allow removing Document or the last Page
  if (element.type === "Document") return template
  if (element.type === "Page") {
    const doc = template.elements[template.root]
    const pages = doc?.children.filter((id) => template.elements[id]?.type === "Page") ?? []
    if (pages.length <= 1) return template
  }

  // Recursively collect all descendant IDs
  const toRemove = new Set<string>()
  function collect(id: string) {
    toRemove.add(id)
    const el = template.elements[id]
    if (el?.children) {
      for (const childId of el.children) {
        collect(childId)
      }
    }
  }
  collect(elementId)

  // Remove from elements map
  const elements = { ...template.elements }
  for (const id of toRemove) {
    delete elements[id]
  }

  // Remove from parent's children
  for (const [id, el] of Object.entries(elements)) {
    if (el.children.includes(elementId)) {
      elements[id] = {
        ...el,
        children: el.children.filter((cid) => !toRemove.has(cid)),
      }
    }
  }

  return { ...template, elements }
}

// ---------------------------------------------------------------------------
// updateElement
// ---------------------------------------------------------------------------

export function updateElement(
  template: Template,
  elementId: string,
  updates: {
    props?: Record<string, unknown>
    visible?: Element["visible"]
    repeat?: Element["repeat"]
  }
): Template {
  const element = template.elements[elementId]
  if (!element) return template

  const updated: Element = {
    ...element,
    props: updates.props ? { ...element.props, ...updates.props } : element.props,
    visible: updates.visible !== undefined ? updates.visible : element.visible,
    repeat: updates.repeat !== undefined ? updates.repeat : element.repeat,
  }

  return {
    ...template,
    elements: { ...template.elements, [elementId]: updated },
  }
}

// ---------------------------------------------------------------------------
// moveElement
// ---------------------------------------------------------------------------

export function moveElement(
  template: Template,
  elementId: string,
  newParentId: string,
  index: number
): Template {
  const element = template.elements[elementId]
  if (!element) return template

  // Don't move Document or Page
  if (element.type === "Document" || element.type === "Page") return template

  const elements = { ...template.elements }

  // Remove from current parent
  for (const [id, el] of Object.entries(elements)) {
    if (el.children.includes(elementId)) {
      elements[id] = {
        ...el,
        children: el.children.filter((cid) => cid !== elementId),
      }
    }
  }

  // Add to new parent
  if (elements[newParentId]) {
    const parent = elements[newParentId]!
    const children = [...parent.children]
    children.splice(index, 0, elementId)
    elements[newParentId] = { ...parent, children }
  }

  return { ...template, elements }
}

// ---------------------------------------------------------------------------
// duplicateElement
// ---------------------------------------------------------------------------

export function duplicateElement(
  template: Template,
  elementId: string
): { template: Template; newElementId: string } | null {
  const element = template.elements[elementId]
  if (!element) return null

  // Don't duplicate Document or Page
  if (element.type === "Document" || element.type === "Page") return null

  const idMap = new Map<string, string>()

  function cloneTree(id: string): Record<string, Element> {
    const el = template.elements[id]
    if (!el) return {}

    const newId = generateId()
    idMap.set(id, newId)

    let childElements: Record<string, Element> = {}
    const newChildren: string[] = []

    for (const childId of el.children) {
      const cloned = cloneTree(childId)
      childElements = { ...childElements, ...cloned }
      const mappedId = idMap.get(childId)
      if (mappedId) newChildren.push(mappedId)
    }

    return {
      ...childElements,
      [newId]: {
        ...el,
        children: newChildren,
      },
    }
  }

  const cloned = cloneTree(elementId)
  const newId = idMap.get(elementId)!
  const elements = { ...template.elements, ...cloned }

  // Insert after original in parent's children
  for (const [id, el] of Object.entries(elements)) {
    if (el.children.includes(elementId) && id !== newId) {
      const children = [...el.children]
      const idx = children.indexOf(elementId)
      children.splice(idx + 1, 0, newId)
      elements[id] = { ...el, children }
      break
    }
  }

  return {
    template: { ...template, elements },
    newElementId: newId,
  }
}

// ---------------------------------------------------------------------------
// updateState — add/update a value in the template state
// ---------------------------------------------------------------------------

export function updateState(
  template: Template,
  pointer: string,
  value: unknown
): Template {
  if (!pointer.startsWith("/")) return template

  const parts = pointer.slice(1).split("/")
  const state = structuredClone(template.state)

  let current: Record<string, unknown> = state
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]!
    if (!(part in current) || typeof current[part] !== "object" || current[part] === null) {
      current[part] = {}
    }
    current = current[part] as Record<string, unknown>
  }

  const lastPart = parts[parts.length - 1]!
  current[lastPart] = value

  return { ...template, state }
}

// ---------------------------------------------------------------------------
// removeState — remove a value from the template state
// ---------------------------------------------------------------------------

export function removeState(
  template: Template,
  pointer: string
): Template {
  if (!pointer.startsWith("/")) return template

  const parts = pointer.slice(1).split("/")
  const state = structuredClone(template.state)

  let current: Record<string, unknown> = state
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]!
    if (!(part in current) || typeof current[part] !== "object") return template
    current = current[part] as Record<string, unknown>
  }

  const lastPart = parts[parts.length - 1]!
  delete current[lastPart]

  return { ...template, state }
}
