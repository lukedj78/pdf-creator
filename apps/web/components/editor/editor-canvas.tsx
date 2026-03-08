"use client"

import { useDroppable } from "@dnd-kit/core"
import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useEditor } from "@/lib/editor/editor-context"
import type { Template, Element, PageProps } from "@workspace/template-engine/schema"
import { getPageElementId, getPageDimensions, resolveExpression, resolvePointer, resolveProps, type ResolveContext } from "@workspace/template-engine/utils"

function CanvasElement({
  elementId,
  element,
  template,
  depth = 0,
  parentId,
  onContextMenu,
}: {
  elementId: string
  element: Element
  template: Template
  depth?: number
  parentId: string
  onContextMenu?: (e: React.MouseEvent, elementId: string) => void
}) {
  const { state, dispatch } = useEditor()
  const isSelected = state.selectedElementId === elementId
  const isHovered = state.hoveredElementId === elementId

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: elementId,
    data: {
      type: "existing-element",
      elementId,
      parentId,
    },
  })

  const children = element.children
    .map((id) => ({ id, el: template.elements[id] }))
    .filter((c): c is { id: string; el: Element } => !!c.el)

  const sortableStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const props = element.props as Record<string, unknown>
  const ctx: ResolveContext = { state: template.state }

  function renderContent() {
    switch (element.type) {
      case "Text":
        return (
          <p style={{
            margin: 0,
            fontSize: props.fontSize ? Number(props.fontSize) : undefined,
            color: props.color ? String(props.color) : undefined,
            textAlign: props.align as React.CSSProperties["textAlign"],
            fontWeight: props.fontWeight ? String(props.fontWeight) : undefined,
            fontStyle: props.fontStyle ? String(props.fontStyle) : undefined,
            whiteSpace: "pre-wrap",
          }}>
            {renderTextValue(props.text, ctx)}
          </p>
        )
      case "Heading": {
        const level = String(props.level || "h2")
        const Tag = (["h1", "h2", "h3", "h4"].includes(level) ? level : "h2") as "h1" | "h2" | "h3" | "h4"
        const sizes: Record<string, number> = { h1: 32, h2: 24, h3: 20, h4: 16 }
        return (
          <Tag style={{
            margin: 0,
            fontSize: sizes[level] ?? 24,
            color: props.color ? String(props.color) : undefined,
            textAlign: props.align as React.CSSProperties["textAlign"],
          }}>
            {renderTextValue(props.text, ctx)}
          </Tag>
        )
      }
      case "Image":
        return props.src ? (
          <img
            src={String(props.src)}
            style={{
              maxWidth: "100%",
              display: "block",
              width: props.width ? Number(props.width) : undefined,
              height: props.height ? Number(props.height) : undefined,
              objectFit: props.objectFit ? String(props.objectFit) as React.CSSProperties["objectFit"] : undefined,
            }}
          />
        ) : (
          <div className="bg-muted rounded flex items-center justify-center text-muted-foreground text-xs" style={{ width: "100%", height: 80 }}>
            Image placeholder
          </div>
        )
      case "Link":
        return (
          <span style={{
            color: props.color ? String(props.color) : "#2563eb",
            fontSize: props.fontSize ? Number(props.fontSize) : undefined,
            textDecoration: "underline",
            cursor: "pointer",
          }}>
            {renderTextValue(props.text, ctx) || "Link"}
          </span>
        )
      case "Table": {
        const columns = (props.columns as Array<{ header: string; width?: string; align?: string; field?: string }>) || []
        const staticRows = (props.rows as string[][]) || []

        // Build dynamic rows from repeat data source
        let dynamicRows: string[][] = []
        if (element.repeat) {
          const array = resolvePointer(template.state, element.repeat.statePath)
          if (Array.isArray(array)) {
            dynamicRows = array.map((item) => {
              const itemObj = typeof item === "object" && item !== null ? item as Record<string, unknown> : {}
              return columns.map((col) => col.field ? String(itemObj[col.field] ?? "") : "")
            })
          }
        }

        const allRows = [...staticRows, ...dynamicRows]

        return (
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: props.fontSize ? Number(props.fontSize) : 11,
          }}>
            {columns.length > 0 && (
              <thead>
                <tr>
                  {columns.map((col, i) => (
                    <th key={i} style={{
                      border: `1px solid ${props.borderColor || "#ddd"}`,
                      padding: "4px 6px",
                      textAlign: (col.align as React.CSSProperties["textAlign"]) || "left",
                      backgroundColor: props.headerBackgroundColor ? String(props.headerBackgroundColor) : "#f5f5f5",
                      color: props.headerTextColor ? String(props.headerTextColor) : undefined,
                      fontWeight: 600,
                      width: col.width || undefined,
                    }}>
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {allRows.length === 0 && element.repeat && (
                <tr>
                  <td colSpan={columns.length} style={{ padding: "8px", textAlign: "center", color: "#999", fontStyle: "italic", border: `1px solid ${props.borderColor || "#ddd"}` }}>
                    No data in {element.repeat.statePath}
                  </td>
                </tr>
              )}
              {allRows.map((row, i) => {
                const isDynamic = i >= staticRows.length
                return (
                  <tr key={i} style={{
                    backgroundColor: props.striped && i % 2 === 1 ? "#f9fafb" : undefined,
                    opacity: isDynamic && element.repeat ? 0.85 : undefined,
                  }}>
                    {(row || []).map((cell, j) => (
                      <td key={j} style={{
                        border: `1px solid ${props.borderColor || "#ddd"}`,
                        padding: "4px 6px",
                        textAlign: columns[j]?.align as React.CSSProperties["textAlign"] || "left",
                      }}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        )
      }
      case "Row":
        return (
          <SortableContainer elementId={elementId} element={element} template={template} depth={depth} direction="horizontal">
            <div style={{
              display: "flex",
              gap: props.gap ? Number(props.gap) : 0,
              alignItems: props.alignItems ? String(props.alignItems) : undefined,
              justifyContent: props.justifyContent ? String(props.justifyContent) : undefined,
              padding: props.padding ? Number(props.padding) : undefined,
              flexWrap: props.wrap ? "wrap" : undefined,
            }}>
              {children.map((child) => (
                <CanvasElement key={child.id} elementId={child.id} element={child.el} template={template} depth={depth + 1} parentId={elementId} onContextMenu={onContextMenu} />
              ))}
              {children.length === 0 && (
                <div className="flex-1 border border-dashed border-muted-foreground/30 rounded p-2 text-xs text-muted-foreground text-center">
                  Drop elements here
                </div>
              )}
            </div>
          </SortableContainer>
        )
      case "Column":
        return (
          <SortableContainer elementId={elementId} element={element} template={template} depth={depth}>
            <div style={{
              flex: props.flex ? Number(props.flex) : 1,
              gap: props.gap ? Number(props.gap) : undefined,
              display: "flex",
              flexDirection: "column",
              padding: props.padding ? Number(props.padding) : undefined,
            }}>
              {children.map((child) => (
                <CanvasElement key={child.id} elementId={child.id} element={child.el} template={template} depth={depth + 1} parentId={elementId} onContextMenu={onContextMenu} />
              ))}
              {children.length === 0 && (
                <div className="border border-dashed border-muted-foreground/30 rounded p-2 text-xs text-muted-foreground text-center">
                  Drop elements here
                </div>
              )}
            </div>
          </SortableContainer>
        )
      case "View":
        return (
          <SortableContainer elementId={elementId} element={element} template={template} depth={depth}>
            <div style={{
              padding: props.padding ? Number(props.padding) : undefined,
              backgroundColor: props.backgroundColor ? String(props.backgroundColor) : undefined,
              borderWidth: props.borderWidth ? Number(props.borderWidth) : undefined,
              borderColor: props.borderColor ? String(props.borderColor) : undefined,
              borderStyle: props.borderWidth ? "solid" : undefined,
              borderRadius: props.borderRadius ? Number(props.borderRadius) : undefined,
            }}>
              {children.map((child) => (
                <CanvasElement key={child.id} elementId={child.id} element={child.el} template={template} depth={depth + 1} parentId={elementId} onContextMenu={onContextMenu} />
              ))}
              {children.length === 0 && (
                <div className="border border-dashed border-muted-foreground/30 rounded p-2 text-xs text-muted-foreground text-center min-h-[40px]">
                  Drop elements here
                </div>
              )}
            </div>
          </SortableContainer>
        )
      case "Spacer":
        return <div style={{ height: (props.height as number) || 20 }} />
      case "Divider":
        return <hr style={{
          border: "none",
          borderTop: `${(props.thickness as number) || 1}px solid ${String(props.color || "#e5e5e5")}`,
          margin: `${(props.marginTop as number) || 8}px 0 ${(props.marginBottom as number) || 8}px 0`,
        }} />
      case "List": {
        const items = ((props.items as unknown[]) || []).map((item) =>
          typeof item === "string" ? item : JSON.stringify(item)
        )
        const Tag = props.ordered ? "ol" : "ul"
        return (
          <Tag style={{
            margin: 0,
            paddingLeft: 20,
            fontSize: props.fontSize ? Number(props.fontSize) : undefined,
            color: props.color ? String(props.color) : undefined,
          }}>
            {items.map((item, i) => <li key={i} style={{ marginBottom: props.spacing ? Number(props.spacing) : undefined }}>{item}</li>)}
          </Tag>
        )
      }
      case "PageNumber":
        return (
          <div style={{
            fontSize: props.fontSize ? Number(props.fontSize) : 10,
            color: props.color ? String(props.color) : "#666",
            textAlign: props.align as React.CSSProperties["textAlign"] || "center",
          }}>
            {String(props.format || "{pageNumber} / {totalPages}")}
          </div>
        )
      default:
        return <div className="text-xs text-muted-foreground">Unknown: {element.type}</div>
    }
  }

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        e.stopPropagation()
        dispatch({ type: "SELECT_ELEMENT", elementId })
      }}
      onContextMenu={(e) => {
        e.preventDefault()
        e.stopPropagation()
        dispatch({ type: "SELECT_ELEMENT", elementId })
        onContextMenu?.(e, elementId)
      }}
      onMouseEnter={() => dispatch({ type: "HOVER_ELEMENT", elementId })}
      onMouseLeave={() => dispatch({ type: "HOVER_ELEMENT", elementId: null })}
      className="relative group"
      style={{
        ...sortableStyle,
        outline: isSelected
          ? "2px solid #2563eb"
          : isHovered
            ? "2px dashed #93b4f8"
            : "1px solid transparent",
        outlineOffset: 2,
        borderRadius: 3,
        cursor: "grab",
        backgroundColor: isSelected
          ? "rgba(37, 99, 235, 0.04)"
          : isHovered
            ? "rgba(37, 99, 235, 0.02)"
            : undefined,
      }}
    >
      {(isSelected || isHovered) && (
        <div className="absolute -top-5 left-0 flex items-center gap-1 z-10">
          <div
            className="px-1.5 py-0.5 text-[10px] font-semibold rounded"
            style={{
              backgroundColor: isSelected ? "#2563eb" : "#93b4f8",
              color: "#ffffff",
            }}
          >
            {element.type}
          </div>
          {element.repeat && (
            <div
              className="px-1.5 py-0.5 text-[10px] font-semibold rounded"
              style={{ backgroundColor: "#7c3aed", color: "#ffffff" }}
            >
              ↻ repeat
            </div>
          )}
        </div>
      )}
      {renderContent()}
      {/* Ghost preview rows for repeat elements */}
      {element.repeat && (isSelected || isHovered) && (
        <RepeatGhostRows element={element} template={template} />
      )}
    </div>
  )
}

/** Render 1-2 ghost rows showing how a repeat element looks with real data */
function RepeatGhostRows({
  element,
  template,
}: {
  element: Element
  template: Template
}) {
  if (!element.repeat) return null

  const array = resolvePointer(template.state, element.repeat.statePath)
  if (!Array.isArray(array) || array.length === 0) {
    return (
      <div className="border border-dashed border-purple-400/40 rounded px-2 py-1 mt-1">
        <p className="text-[10px] text-purple-400/60 italic">
          No data in {element.repeat.statePath}
        </p>
      </div>
    )
  }

  // Show up to 2 ghost rows from the data
  const ghostItems = array.slice(0, 2)

  return (
    <div className="mt-1 space-y-0.5">
      {ghostItems.map((item, index) => {
        const itemCtx: ResolveContext = {
          state: template.state,
          item: typeof item === "object" && item !== null ? item as Record<string, unknown> : {},
          index,
        }
        const resolved = resolveProps(element.props as Record<string, unknown>, itemCtx)

        return (
          <div
            key={index}
            className="opacity-35 pointer-events-none border border-dashed border-purple-400/30 rounded px-1"
          >
            <GhostContent type={element.type} props={resolved} />
          </div>
        )
      })}
      {array.length > 2 && (
        <p className="text-[10px] text-purple-400/50 italic pl-1">
          +{array.length - 2} more item{array.length - 2 > 1 ? "s" : ""}
        </p>
      )}
    </div>
  )
}

/** Simplified content renderer for ghost rows */
function GhostContent({ type, props }: { type: string; props: Record<string, unknown> }) {
  switch (type) {
    case "Text":
      return (
        <p style={{
          margin: 0,
          fontSize: props.fontSize ? Number(props.fontSize) : undefined,
          color: props.color ? String(props.color) : undefined,
          whiteSpace: "pre-wrap",
        }}>
          {typeof props.text === "string" ? props.text : "…"}
        </p>
      )
    case "Heading": {
      const level = String(props.level || "h2")
      const sizes: Record<string, number> = { h1: 32, h2: 24, h3: 20, h4: 16 }
      return (
        <p style={{
          margin: 0,
          fontSize: sizes[level] ?? 24,
          fontWeight: 700,
          color: props.color ? String(props.color) : undefined,
        }}>
          {typeof props.text === "string" ? props.text : "…"}
        </p>
      )
    }
    case "Row":
    case "View":
      return (
        <div className="text-[10px] text-muted-foreground py-0.5">
          {type} (repeated)
        </div>
      )
    default:
      return (
        <div className="text-[10px] text-muted-foreground py-0.5">
          {type}
        </div>
      )
  }
}

function SortableContainer({
  elementId,
  element,
  template,
  depth,
  direction = "vertical",
  children,
}: {
  elementId: string
  element: Element
  template: Template
  depth: number
  direction?: "vertical" | "horizontal"
  children: React.ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `container-${elementId}`,
    data: { type: "container", parentId: elementId },
  })

  const childIds = element.children ?? []

  return (
    <div
      ref={setNodeRef}
      style={{
        outline: isOver ? "2px dashed #2563eb" : undefined,
        outlineOffset: -2,
        borderRadius: 3,
      }}
    >
      <SortableContext items={childIds} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </div>
  )
}

/** Render a text value, resolving $state/$template expressions against template state */
function renderTextValue(value: unknown, ctx: ResolveContext): string {
  if (typeof value === "string") return value || "Text"
  if (typeof value === "object" && value !== null) {
    const resolved = resolveExpression(value, ctx)
    if (resolved !== undefined && resolved !== null) return String(resolved)
  }
  return "Text"
}

function CanvasPage({
  pageId,
  pageIndex,
  template,
  zoom,
  onElementContextMenu,
}: {
  pageId: string
  pageIndex: number
  template: Template
  zoom: number
  onElementContextMenu?: (e: React.MouseEvent, elementId: string) => void
}) {
  const { dispatch } = useEditor()
  const pageElement = template.elements[pageId]
  const pageProps = (pageElement?.props ?? {}) as Record<string, unknown>

  const { width, height } = getPageDimensions(pageProps as PageProps)

  const mt = (pageProps.marginTop as number) ?? 40
  const mr = (pageProps.marginRight as number) ?? 40
  const mb = (pageProps.marginBottom as number) ?? 40
  const ml = (pageProps.marginLeft as number) ?? 40

  const pageChildren = pageElement?.children ?? []

  const { setNodeRef, isOver } = useDroppable({
    id: `canvas-page-${pageId}`,
    data: { type: "container", parentId: pageId },
  })

  return (
    <div className="relative">
      <div className="absolute -top-6 left-0 text-[10px] text-muted-foreground font-medium">
        Page {pageIndex + 1}
      </div>
      <div
        ref={setNodeRef}
        onClick={(e) => {
          e.stopPropagation()
          dispatch({ type: "SELECT_ELEMENT", elementId: pageId })
        }}
        className="shadow-lg"
        style={{
          width: width * zoom,
          minHeight: height * zoom,
          backgroundColor: pageProps.backgroundColor ? String(pageProps.backgroundColor) : "#ffffff",
          color: "#000000",
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: 12 * zoom,
          lineHeight: 1.5,
          boxSizing: "border-box",
          padding: `${mt * zoom}px ${mr * zoom}px ${mb * zoom}px ${ml * zoom}px`,
          transformOrigin: "top center",
          position: "relative",
          outline: isOver ? "2px dashed hsl(var(--primary))" : undefined,
        }}
      >
        {pageChildren.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-sm text-gray-400">
              Drag components from the left panel
            </p>
            <p className="text-xs text-gray-300 mt-1">
              or click &quot;Add&quot; in the toolbar
            </p>
          </div>
        )}
        <SortableContext items={pageChildren} strategy={verticalListSortingStrategy}>
          {pageChildren.map((childId) => {
            const element = template.elements[childId]
            if (!element) return null
            return (
              <CanvasElement
                key={childId}
                elementId={childId}
                element={element}
                template={template}
                parentId={pageId}
                onContextMenu={onElementContextMenu}
              />
            )
          })}
        </SortableContext>
      </div>
    </div>
  )
}

export function EditorCanvas({
  onElementContextMenu,
}: {
  onElementContextMenu?: (e: React.MouseEvent, elementId: string) => void
} = {}) {
  const { state, dispatch } = useEditor()
  const { template, zoom } = state

  // Get all Page elements from the Document
  const docElement = template.elements[template.root]
  const pageIds = (docElement?.children ?? []).filter(
    (id) => template.elements[id]?.type === "Page"
  )

  return (
    <div
      className="flex-1 overflow-auto bg-muted/30 flex flex-col items-center gap-10 p-2 md:p-8"
      onClick={() => dispatch({ type: "SELECT_ELEMENT", elementId: null })}
    >
      {pageIds.map((pageId, index) => (
        <CanvasPage
          key={pageId}
          pageId={pageId}
          pageIndex={index}
          template={template}
          zoom={zoom}
          onElementContextMenu={onElementContextMenu}
        />
      ))}
    </div>
  )
}
