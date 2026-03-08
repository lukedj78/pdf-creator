import { renderToBuffer } from "@json-render/react-pdf/render"
import type { Template } from "../schema/types"
import { resolvePointer } from "../utils/data-binding"
import { getPageDimensions, getContentArea } from "../utils/page"

/**
 * Pre-process template for PDF rendering.
 *
 * Normalizes differences between our HTML canvas preview and @react-pdf/renderer:
 * - Table with repeat + field → expand rows, remove repeat/field
 * - View/Column children of Row without flex/width → add flex:1
 * - Image width capped to fit within parent context
 * - PageNumber format normalization
 * - Strip `field` from Table columns
 */
function prepareSpec(template: Template) {
  const state = template.state ?? {}
  const elements: Record<string, Record<string, unknown>> = {}

  // Calculate page content width for image capping
  let contentWidth = 515 // A4 default minus 40+40 margins
  for (const el of Object.values(template.elements)) {
    if (el.type === "Page") {
      const p = el.props as Record<string, unknown>
      try {
        const area = getContentArea(p as any)
        contentWidth = area.width
      } catch {
        // fallback
      }
      break
    }
  }

  // First pass: copy all elements with basic fixes
  for (const [id, element] of Object.entries(template.elements)) {
    const el = { ...element } as Record<string, unknown>
    const props = { ...(element.props as Record<string, unknown>) }

    // Table with repeat + field → expand rows from data, remove repeat
    if (element.repeat && element.type === "Table") {
      const array = resolvePointer(state, element.repeat.statePath)
      const columns = (props.columns ?? []) as Array<{ header: string; width?: string; align?: string; field?: string }>

      let dynamicRows: string[][] = []
      if (Array.isArray(array)) {
        dynamicRows = array.map((item) => {
          const itemObj = typeof item === "object" && item !== null ? item as Record<string, unknown> : {}
          return columns.map((col) => col.field ? String(itemObj[col.field] ?? "") : "")
        })
      }

      const staticRows = (props.rows ?? []) as string[][]
      props.rows = [...staticRows, ...dynamicRows]
      props.columns = columns.map(({ field: _field, ...rest }) => rest)
      delete el.repeat
    }

    // Strip `field` from any Table columns
    if (element.type === "Table" && Array.isArray(props.columns)) {
      props.columns = (props.columns as Array<Record<string, unknown>>).map(
        ({ field: _field, ...rest }) => rest
      )
    }

    // PageNumber: normalize format placeholders
    if (element.type === "PageNumber" && typeof props.format === "string") {
      props.format = (props.format as string)
        .replace(/\{current\}/g, "{pageNumber}")
        .replace(/\{total\}/g, "{totalPages}")
    }

    // Image: cap width to not exceed page content width
    if (element.type === "Image" && typeof props.width === "number") {
      if ((props.width as number) > contentWidth) {
        const ratio = (props.height as number) / (props.width as number)
        props.width = contentWidth
        if (typeof props.height === "number") {
          props.height = Math.round(contentWidth * ratio)
        }
      }
    }

    el.props = props
    elements[id] = el
  }

  // Second pass: fix flex layout for Row children
  // In HTML flexbox, children auto-stretch. In @react-pdf, they collapse without flex.
  for (const element of Object.values(elements)) {
    if ((element as any).type !== "Row") continue
    const children = (element as any).children as string[] | undefined
    if (!children || children.length === 0) continue

    // Count how many children are "container" types that could take flex
    for (const childId of children) {
      const child = elements[childId]
      if (!child) continue
      const childType = (child as any).type as string
      const childProps = (child as any).props as Record<string, unknown>

      // For container children (View, Column) without explicit sizing → flex:1
      if ((childType === "View" || childType === "Column") && childProps.flex == null && childProps.width == null) {
        childProps.flex = 1
      }

      // For non-container children (Text, PageNumber, etc) in a Row → also flex:1
      // so they share space (like HTML flexbox) instead of collapsing
      if (childType === "Text" || childType === "Heading" || childType === "PageNumber") {
        if (childProps.flex == null && childProps.width == null) {
          childProps.flex = 1
        }
      }
    }

    // If a Row has Image children alongside other content, cap image width
    // to half the content area to prevent it from pushing siblings
    const childTypes = children.map((cid) => (elements[cid] as any)?.type).filter(Boolean)
    const hasImage = childTypes.some((t: string) => t === "Image")
    const hasOther = childTypes.some((t: string) => t !== "Image")
    if (hasImage && hasOther) {
      for (const childId of children) {
        const child = elements[childId]
        if (!child || (child as any).type !== "Image") continue
        const childProps = (child as any).props as Record<string, unknown>
        const maxW = contentWidth / children.length
        if (typeof childProps.width === "number" && (childProps.width as number) > maxW) {
          const ratio = (childProps.height as number) / (childProps.width as number)
          childProps.width = Math.round(maxW)
          if (typeof childProps.height === "number") {
            childProps.height = Math.round(maxW * ratio)
          }
        }
      }
    }

    // For Column children containing Images, cap the image width
    for (const childId of children) {
      const child = elements[childId]
      if (!child) continue
      const childType = (child as any).type as string
      if (childType !== "Column" && childType !== "View") continue
      const grandchildren = (child as any).children as string[] | undefined
      if (!grandchildren) continue

      const siblingCount = children.length
      const maxColWidth = contentWidth / siblingCount

      for (const gcId of grandchildren) {
        const gc = elements[gcId]
        if (!gc || (gc as any).type !== "Image") continue
        const gcProps = (gc as any).props as Record<string, unknown>
        if (typeof gcProps.width === "number" && (gcProps.width as number) > maxColWidth) {
          const ratio = typeof gcProps.height === "number" ? (gcProps.height as number) / (gcProps.width as number) : 1
          gcProps.width = Math.round(maxColWidth - 20) // small margin
          if (typeof gcProps.height === "number") {
            gcProps.height = Math.round((maxColWidth - 20) * ratio)
          }
        }
      }
    }
  }

  return { root: template.root, elements, state }
}

/**
 * Render a Template to a PDF buffer (Uint8Array).
 * Server-side only — uses @json-render/react-pdf under the hood.
 */
export async function renderPdf(template: Template): Promise<Uint8Array> {
  const spec = prepareSpec(template)
  return renderToBuffer(spec as any)
}
