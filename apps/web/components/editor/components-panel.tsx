"use client"

import { useState } from "react"
import { useDraggable } from "@dnd-kit/core"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  TextIcon,
  Heading01Icon,
  Image01Icon,
  Table01Icon,
  LayoutLeftIcon,
  LayoutTopIcon,
  MinusSignIcon,
  ListViewIcon,
  AlignVerticalSpaceBetweenIcon,
  ContainerIcon,
  Link01Icon,
  HashtagIcon,
  File01Icon,
  ArrowDown01Icon,
  ArrowRight01Icon,
  Layers01Icon,
  GridIcon,
} from "@hugeicons/core-free-icons"
import { useEditor } from "@/lib/editor/editor-context"
import { cn } from "@/lib/utils"
import type { ElementType } from "@workspace/template-engine/schema"
import type { IconSvgElement } from "@hugeicons/react"

// --- Shared icon map ---

const elementIconMap: Record<string, IconSvgElement> = {
  Document: File01Icon,
  Page: File01Icon,
  View: ContainerIcon,
  Row: LayoutLeftIcon,
  Column: LayoutTopIcon,
  Heading: Heading01Icon,
  Text: TextIcon,
  Image: Image01Icon,
  Link: Link01Icon,
  Table: Table01Icon,
  List: ListViewIcon,
  Spacer: AlignVerticalSpaceBetweenIcon,
  Divider: MinusSignIcon,
  PageNumber: HashtagIcon,
}

// --- Components Tab ---

type ComponentItem = {
  type: ElementType
  label: string
  icon: IconSvgElement
  category: "structure" | "layout" | "content" | "data" | "decorative" | "page-level"
}

const components: ComponentItem[] = [
  { type: "Page", label: "Page", icon: File01Icon, category: "structure" },
  { type: "View", label: "View", icon: ContainerIcon, category: "layout" },
  { type: "Row", label: "Row", icon: LayoutLeftIcon, category: "layout" },
  { type: "Column", label: "Column", icon: LayoutTopIcon, category: "layout" },
  { type: "Heading", label: "Heading", icon: Heading01Icon, category: "content" },
  { type: "Text", label: "Text", icon: TextIcon, category: "content" },
  { type: "Image", label: "Image", icon: Image01Icon, category: "content" },
  { type: "Link", label: "Link", icon: Link01Icon, category: "content" },
  { type: "Table", label: "Table", icon: Table01Icon, category: "data" },
  { type: "List", label: "List", icon: ListViewIcon, category: "data" },
  { type: "Spacer", label: "Spacer", icon: AlignVerticalSpaceBetweenIcon, category: "decorative" },
  { type: "Divider", label: "Divider", icon: MinusSignIcon, category: "decorative" },
  { type: "PageNumber", label: "Page #", icon: HashtagIcon, category: "page-level" },
]

const categories = [
  { key: "structure" as const, label: "Document" },
  { key: "layout" as const, label: "Layout" },
  { key: "content" as const, label: "Content" },
  { key: "data" as const, label: "Data" },
  { key: "decorative" as const, label: "Decorative" },
  { key: "page-level" as const, label: "Page-Level" },
]

function DraggableComponent({ item }: { item: ComponentItem }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `component-${item.type}`,
    data: { type: "new-element", elementType: item.type },
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex items-center gap-2 px-2.5 py-2 rounded-md cursor-grab active:cursor-grabbing border border-transparent hover:bg-muted hover:border-border transition-colors text-sm ${isDragging ? "opacity-50" : ""}`}
    >
      <HugeiconsIcon icon={item.icon} size={16} className="text-muted-foreground shrink-0" />
      <span>{item.label}</span>
    </div>
  )
}

function ComponentsTab() {
  return (
    <div className="space-y-4">
      {categories.map((cat) => (
        <div key={cat.key} className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground px-1 mb-1.5">
            {cat.label}
          </p>
          {components
            .filter((c) => c.category === cat.key)
            .map((item) => (
              <DraggableComponent key={item.type} item={item} />
            ))}
        </div>
      ))}
    </div>
  )
}

// --- Structure Tab (Tree View) ---

const CONTAINER_TYPES = new Set(["Document", "Page", "View", "Row", "Column"])

function TreeNode({
  elementId,
  depth,
  defaultExpanded,
}: {
  elementId: string
  depth: number
  defaultExpanded?: boolean
}) {
  const { state, dispatch } = useEditor()
  const element = state.template.elements[elementId]
  if (!element) return null

  const hasChildren = element.children.length > 0
  const isContainer = CONTAINER_TYPES.has(element.type)
  const [expanded, setExpanded] = useState(defaultExpanded ?? (depth < 2))

  const isSelected = state.selectedElementId === elementId
  const isHovered = state.hoveredElementId === elementId

  const icon = elementIconMap[element.type]

  // Label: type + short id suffix
  const shortId = elementId.length > 8 ? elementId.slice(-4) : elementId
  const label = element.type === "Document"
    ? "Document"
    : element.type === "Page"
      ? `Page`
      : element.type

  // Extract display text for content elements
  const props = element.props as Record<string, unknown>
  const displayText = typeof props.text === "string" && props.text.length > 0
    ? props.text.length > 18 ? props.text.slice(0, 18) + "…" : props.text
    : null

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1 py-1 px-1.5 rounded-md cursor-pointer transition-colors text-sm group",
          isSelected
            ? "bg-accent text-accent-foreground"
            : isHovered
              ? "bg-muted"
              : "hover:bg-muted/60",
        )}
        style={{ paddingLeft: depth * 16 + 4 }}
        onClick={(e) => {
          e.stopPropagation()
          dispatch({ type: "SELECT_ELEMENT", elementId })
        }}
        onMouseEnter={() => dispatch({ type: "HOVER_ELEMENT", elementId })}
        onMouseLeave={() => dispatch({ type: "HOVER_ELEMENT", elementId: null })}
      >
        {/* Expand/collapse toggle */}
        {isContainer && hasChildren ? (
          <button
            className="w-4 h-4 flex items-center justify-center shrink-0 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation()
              setExpanded(!expanded)
            }}
          >
            <HugeiconsIcon
              icon={expanded ? ArrowDown01Icon : ArrowRight01Icon}
              size={12}
            />
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}

        {/* Element icon */}
        {icon && (
          <HugeiconsIcon
            icon={icon}
            size={14}
            className={cn(
              "shrink-0",
              isSelected ? "text-accent-foreground" : "text-muted-foreground",
            )}
          />
        )}

        {/* Label */}
        <span className="truncate text-xs font-medium">
          {label}
        </span>

        {/* Display text preview */}
        {displayText && (
          <span className="truncate text-[10px] text-muted-foreground ml-auto opacity-70">
            {displayText}
          </span>
        )}
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <div>
          {element.children.map((childId) => (
            <TreeNode
              key={childId}
              elementId={childId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function StructureTab() {
  const { state } = useEditor()
  const rootId = state.template.root

  if (!rootId || !state.template.elements[rootId]) {
    return (
      <p className="text-xs text-muted-foreground px-1">
        No document structure
      </p>
    )
  }

  return (
    <div className="space-y-0.5">
      <TreeNode elementId={rootId} depth={0} defaultExpanded />
    </div>
  )
}

// --- Panel with Tabs ---

export function ComponentsPanel({ mobile }: { mobile?: boolean } = {}) {
  const [tab, setTab] = useState<"components" | "structure">("components")

  return (
    <div className={`${mobile ? "" : "hidden md:block"} w-56 border-r bg-background overflow-y-auto flex flex-col`}>
      {/* Tab toggle */}
      <div className="flex border-b px-2 pt-2 gap-1 shrink-0">
        <button
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-t-md transition-colors",
            tab === "components"
              ? "bg-muted text-foreground border border-b-0 border-border"
              : "text-muted-foreground hover:text-foreground",
          )}
          onClick={() => setTab("components")}
        >
          <HugeiconsIcon icon={GridIcon} size={13} />
          Components
        </button>
        <button
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-t-md transition-colors",
            tab === "structure"
              ? "bg-muted text-foreground border border-b-0 border-border"
              : "text-muted-foreground hover:text-foreground",
          )}
          onClick={() => setTab("structure")}
        >
          <HugeiconsIcon icon={Layers01Icon} size={13} />
          Structure
        </button>
      </div>

      {/* Tab content */}
      <div className="p-3 flex-1 overflow-y-auto">
        {tab === "components" ? <ComponentsTab /> : <StructureTab />}
      </div>
    </div>
  )
}
