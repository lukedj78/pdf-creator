import { useReducer } from "react"
import type { Template, Element, ElementType } from "@workspace/template-engine/schema"
import {
  addElement,
  removeElement,
  updateElement,
  moveElement,
  duplicateElement,
  createEmptyTemplate,
  getPageElementId,
  updateState,
  removeState,
} from "@workspace/template-engine/utils"

export type EditorState = {
  template: Template
  selectedElementId: string | null
  hoveredElementId: string | null
  zoom: number
  isDirty: boolean
  history: Template[]
  historyIndex: number
}

type EditorAction =
  | { type: "SET_TEMPLATE"; template: Template }
  | { type: "SYNC_TEMPLATE"; template: Template }
  | { type: "AI_UPDATE_TEMPLATE"; template: Template }
  | { type: "ADD_ELEMENT"; elementType: ElementType; parentId?: string; index?: number; props?: Record<string, unknown> }
  | { type: "REMOVE_ELEMENT"; elementId: string }
  | { type: "UPDATE_ELEMENT"; elementId: string; props?: Record<string, unknown> }
  | { type: "MOVE_ELEMENT"; elementId: string; newParentId: string; index: number }
  | { type: "DUPLICATE_ELEMENT"; elementId: string }
  | { type: "SELECT_ELEMENT"; elementId: string | null }
  | { type: "HOVER_ELEMENT"; elementId: string | null }
  | { type: "SET_ZOOM"; zoom: number }
  | { type: "UPDATE_PAGE_PROPS"; props: Record<string, unknown> }
  | { type: "UPDATE_DOCUMENT_PROPS"; props: Record<string, unknown> }
  | { type: "UPDATE_TEMPLATE_NAME"; name: string }
  | { type: "SET_STATE"; pointer: string; value: unknown }
  | { type: "REMOVE_STATE"; pointer: string }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "MARK_SAVED" }

const MAX_HISTORY = 50

function pushHistory(state: EditorState, newTemplate: Template): EditorState {
  const history = state.history.slice(0, state.historyIndex + 1)
  history.push(newTemplate)
  if (history.length > MAX_HISTORY) history.shift()
  return {
    ...state,
    template: newTemplate,
    history,
    historyIndex: history.length - 1,
    isDirty: true,
  }
}

function getDefaultProps(type: ElementType): Record<string, unknown> {
  switch (type) {
    case "Text": return { text: "New text" }
    case "Heading": return { text: "New Heading", level: "h2" }
    case "Image": return { src: "" }
    case "Link": return { text: "Link text", href: "" }
    case "Table": return { columns: [{ header: "Column 1" }, { header: "Column 2" }], rows: [["Value 1", "Value 2"]] }
    case "Row": return { gap: 16 }
    case "Column": return { flex: 1 }
    case "View": return {}
    case "Spacer": return { height: 20 }
    case "Divider": return { thickness: 1, color: "#e5e5e5" }
    case "List": return { items: ["Item 1", "Item 2"], ordered: false }
    case "PageNumber": return { format: "{pageNumber} / {totalPages}", align: "center", fontSize: 10 }
    case "Page": return { size: "A4", orientation: "portrait", marginTop: 40, marginRight: 40, marginBottom: 40, marginLeft: 40 }
    default: return {}
  }
}

/** Find the parent ID of an element by searching the tree */
function findParentId(template: Template, elementId: string): string | null {
  for (const [id, el] of Object.entries(template.elements)) {
    if (el.children.includes(elementId)) return id
  }
  return null
}

/** Extract all state pointers from an element's props */
function extractPointersFromProps(props: Record<string, unknown>): string[] {
  const pointers: string[] = []
  for (const val of Object.values(props)) {
    if (val && typeof val === "object" && !Array.isArray(val)) {
      const obj = val as Record<string, unknown>
      if ("$state" in obj) pointers.push(String(obj.$state))
      if ("$template" in obj) {
        const tmpl = String(obj.$template)
        for (const m of tmpl.matchAll(/\$\{(\/[^}]+)\}/g)) pointers.push(m[1]!)
      }
    }
  }
  return pointers
}

/** Collect all pointers used by an element and its descendants */
function collectPointers(template: Template, elementId: string): string[] {
  const el = template.elements[elementId]
  if (!el) return []
  const pointers = extractPointersFromProps(el.props as Record<string, unknown>)
  for (const childId of el.children) {
    pointers.push(...collectPointers(template, childId))
  }
  return pointers
}

/** Check if any element in the template still uses a given pointer */
function isPointerUsed(template: Template, pointer: string): boolean {
  for (const el of Object.values(template.elements)) {
    const ptrs = extractPointersFromProps(el.props as Record<string, unknown>)
    if (ptrs.includes(pointer)) return true
  }
  return false
}

/** Remove state entries that are no longer referenced by any element */
function cleanOrphanedState(template: Template, pointersToCheck: string[]): Template {
  const unique = [...new Set(pointersToCheck)]
  let cleaned = template
  for (const ptr of unique) {
    if (!isPointerUsed(cleaned, ptr)) {
      cleaned = removeState(cleaned, ptr)
    }
  }
  return cleaned
}

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "SET_TEMPLATE": {
      return {
        ...state,
        template: action.template,
        history: [action.template],
        historyIndex: 0,
        isDirty: false,
        selectedElementId: null,
      }
    }

    case "SYNC_TEMPLATE": {
      // Update template data from external sync without resetting selection
      const selectedStillExists = state.selectedElementId
        ? !!action.template.elements[state.selectedElementId]
        : true
      return {
        ...state,
        template: action.template,
        history: [action.template],
        historyIndex: 0,
        isDirty: false,
        selectedElementId: selectedStillExists ? state.selectedElementId : null,
      }
    }

    case "AI_UPDATE_TEMPLATE": {
      return pushHistory(state, action.template)
    }

    case "ADD_ELEMENT": {
      // Page elements must be children of the Document (root), not of another Page
      const parentId = action.elementType === "Page"
        ? state.template.root
        : action.parentId
      const mergedProps = action.props
        ? { ...getDefaultProps(action.elementType), ...action.props }
        : getDefaultProps(action.elementType)
      const { template, elementId } = addElement(
        state.template,
        action.elementType,
        mergedProps,
        { parentId, index: action.index }
      )
      const newState = pushHistory(state, template)
      return { ...newState, selectedElementId: elementId }
    }

    case "REMOVE_ELEMENT": {
      const element = state.template.elements[action.elementId]
      if (!element) return state

      // Find next sibling to select after deletion
      let nextSelectedId: string | null = null
      if (state.selectedElementId === action.elementId) {
        const parentId = findParentId(state.template, action.elementId)
        const siblings = parentId
          ? state.template.elements[parentId]?.children ?? []
          : []
        const idx = siblings.indexOf(action.elementId)
        if (idx >= 0) {
          if (idx < siblings.length - 1) {
            nextSelectedId = siblings[idx + 1]!
          } else if (idx > 0) {
            nextSelectedId = siblings[idx - 1]!
          }
        }
      }

      // Collect pointers used by the element (and its descendants)
      const pointersToCheck = collectPointers(state.template, action.elementId)

      const template = removeElement(state.template, action.elementId)

      // Remove state entries no longer referenced by any remaining element
      const cleanedTemplate = cleanOrphanedState(template, pointersToCheck)

      const newState = pushHistory(state, cleanedTemplate)
      return {
        ...newState,
        selectedElementId:
          state.selectedElementId === action.elementId
            ? nextSelectedId
            : state.selectedElementId,
      }
    }

    case "UPDATE_ELEMENT": {
      const template = updateElement(state.template, action.elementId, {
        props: action.props,
      })
      return pushHistory(state, template)
    }

    case "MOVE_ELEMENT": {
      const template = moveElement(
        state.template,
        action.elementId,
        action.newParentId,
        action.index
      )
      return pushHistory(state, template)
    }

    case "DUPLICATE_ELEMENT": {
      const result = duplicateElement(state.template, action.elementId)
      if (!result) return state
      const newState = pushHistory(state, result.template)
      return { ...newState, selectedElementId: result.newElementId }
    }

    case "SELECT_ELEMENT":
      return { ...state, selectedElementId: action.elementId }

    case "HOVER_ELEMENT":
      return { ...state, hoveredElementId: action.elementId }

    case "SET_ZOOM":
      return { ...state, zoom: Math.min(2, Math.max(0.25, action.zoom)) }

    case "UPDATE_PAGE_PROPS": {
      const pageId = getPageElementId(state.template)
      if (!pageId) return state
      const template = updateElement(state.template, pageId, {
        props: action.props,
      })
      return pushHistory(state, template)
    }

    case "UPDATE_DOCUMENT_PROPS": {
      const docId = state.template.root
      if (!docId) return state
      const template = updateElement(state.template, docId, {
        props: action.props,
      })
      return pushHistory(state, template)
    }

    case "UPDATE_TEMPLATE_NAME": {
      const template = { ...state.template, name: action.name }
      return { ...state, template, isDirty: true }
    }

    case "SET_STATE": {
      const template = updateState(state.template, action.pointer, action.value)
      return pushHistory(state, template)
    }

    case "REMOVE_STATE": {
      const template = removeState(state.template, action.pointer)
      return pushHistory(state, template)
    }

    case "UNDO": {
      if (state.historyIndex <= 0) return state
      const newIndex = state.historyIndex - 1
      return {
        ...state,
        template: state.history[newIndex]!,
        historyIndex: newIndex,
        isDirty: true,
      }
    }

    case "REDO": {
      if (state.historyIndex >= state.history.length - 1) return state
      const newIndex = state.historyIndex + 1
      return {
        ...state,
        template: state.history[newIndex]!,
        historyIndex: newIndex,
        isDirty: true,
      }
    }

    case "MARK_SAVED":
      return { ...state, isDirty: false }

    default:
      return state
  }
}

export function useEditorStore(initialTemplate?: Template) {
  const template = initialTemplate ?? createEmptyTemplate("Untitled")
  const [state, dispatch] = useReducer(editorReducer, {
    template,
    selectedElementId: null,
    hoveredElementId: null,
    zoom: 1,
    isDirty: false,
    history: [template],
    historyIndex: 0,
  })

  const canUndo = state.historyIndex > 0
  const canRedo = state.historyIndex < state.history.length - 1
  const selectedElement = state.selectedElementId
    ? state.template.elements[state.selectedElementId] ?? null
    : null

  return {
    state,
    dispatch,
    canUndo,
    canRedo,
    selectedElement,
  }
}

export type EditorStore = ReturnType<typeof useEditorStore>
