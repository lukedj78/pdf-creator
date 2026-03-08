"use client"

import React, { useRef } from "react"
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion"
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
  ArrowTurnBackwardIcon,
  ArrowTurnForwardIcon,
  ViewIcon,
  CodeIcon,
  RulerIcon,
  FloppyDiskIcon,
  Delete02Icon,
  Copy01Icon,
  FileUploadIcon,
} from "@hugeicons/core-free-icons"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@workspace/ui/components/tooltip"
import { useEditor } from "@/lib/editor/editor-context"
import { cn } from "@/lib/utils"
import type { ElementType } from "@workspace/template-engine/schema"
import type { IconSvgElement } from "@hugeicons/react"

const DEFAULT_SIZE = 40
const DEFAULT_MAGNIFICATION = 56
const DEFAULT_DISTANCE = 120

// --- Dock wrapper ---

function Dock({
  children,
  className,
  iconSize = DEFAULT_SIZE,
  iconMagnification = DEFAULT_MAGNIFICATION,
  iconDistance = DEFAULT_DISTANCE,
}: {
  children: React.ReactNode
  className?: string
  iconSize?: number
  iconMagnification?: number
  iconDistance?: number
}) {
  const mouseX = useMotionValue(Infinity)

  const renderChildren = () =>
    React.Children.map(children, (child) => {
      if (React.isValidElement<DockItemProps>(child) && (child.type === DockItem || child.type === DockDraggableItem)) {
        return React.cloneElement(child, {
          ...child.props,
          mouseX,
          size: iconSize,
          magnification: iconMagnification,
          distance: iconDistance,
        })
      }
      if (React.isValidElement(child) && child.type === DockSeparator) {
        return child
      }
      return child
    })

  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={cn(
        "flex h-[58px] items-end gap-1 rounded-2xl border bg-background/80 backdrop-blur-xl p-2 shadow-lg",
        className,
      )}
    >
      {renderChildren()}
    </motion.div>
  )
}

// --- Dock separator ---

function DockSeparator() {
  return <div className="w-px h-8 bg-border mx-1 self-center shrink-0" />
}

// --- Dock item ---

interface DockItemProps {
  size?: number
  magnification?: number
  distance?: number
  mouseX?: MotionValue<number>
  className?: string
  children?: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  active?: boolean
  label?: string
}

function DockItem({
  size = DEFAULT_SIZE,
  magnification = DEFAULT_MAGNIFICATION,
  distance = DEFAULT_DISTANCE,
  mouseX,
  className,
  children,
  onClick,
  disabled,
  active,
  label,
}: DockItemProps) {
  const ref = useRef<HTMLDivElement>(null)
  const defaultMouseX = useMotionValue(Infinity)

  const distanceCalc = useTransform(mouseX ?? defaultMouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 }
    return val - bounds.x - bounds.width / 2
  })

  const sizeTransform = useTransform(
    distanceCalc,
    [-distance, 0, distance],
    [size, magnification, size],
  )

  const scaleSize = useSpring(sizeTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  })

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <motion.div
            ref={ref}
            style={{ width: scaleSize, height: scaleSize }}
            className={cn(
              "flex aspect-square cursor-pointer items-center justify-center rounded-xl transition-colors",
              disabled
                ? "opacity-30 cursor-not-allowed"
                : "hover:bg-muted",
              active && "bg-muted ring-1 ring-foreground/10",
              className,
            )}
            onClick={disabled ? undefined : onClick}
          />
        }
      >
        {children}
      </TooltipTrigger>
      {label && <TooltipContent side="top" sideOffset={8}>{label}</TooltipContent>}
    </Tooltip>
  )
}

// --- Draggable Dock item (for elements) ---

function DockDraggableItem({
  elementType,
  size = DEFAULT_SIZE,
  magnification = DEFAULT_MAGNIFICATION,
  distance = DEFAULT_DISTANCE,
  mouseX,
  className,
  children,
  label,
}: DockItemProps & { elementType: ElementType }) {
  const ref = useRef<HTMLDivElement>(null)
  const defaultMouseX = useMotionValue(Infinity)

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `dock-${elementType}`,
    data: { type: "new-element", elementType },
  })

  const distanceCalc = useTransform(mouseX ?? defaultMouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 }
    return val - bounds.x - bounds.width / 2
  })

  const sizeTransform = useTransform(
    distanceCalc,
    [-distance, 0, distance],
    [size, magnification, size],
  )

  const scaleSize = useSpring(sizeTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  })

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <motion.div
            ref={(node) => {
              // Merge refs: dnd-kit + local measurement ref
              setNodeRef(node)
              ;(ref as React.MutableRefObject<HTMLDivElement | null>).current = node
            }}
            {...attributes}
            {...listeners}
            style={{ width: scaleSize, height: scaleSize, opacity: isDragging ? 0.4 : 1 }}
            className={cn(
              "flex aspect-square cursor-grab items-center justify-center rounded-xl transition-colors hover:bg-muted",
              isDragging && "cursor-grabbing",
              className,
            )}
          />
        }
      >
        {children}
      </TooltipTrigger>
      {label && <TooltipContent side="top" sideOffset={8}>{label}</TooltipContent>}
    </Tooltip>
  )
}

// --- Editor Dock ---

type DockAction = {
  icon: IconSvgElement
  label: string
  onClick: () => void
  disabled?: boolean
  active?: boolean
}

type DockElementAction = {
  type: ElementType
  icon: IconSvgElement
  label: string
}

const elementActions: DockElementAction[] = [
  { type: "Heading", icon: Heading01Icon, label: "Heading" },
  { type: "Text", icon: TextIcon, label: "Text" },
  { type: "Image", icon: Image01Icon, label: "Image" },
  { type: "Table", icon: Table01Icon, label: "Table" },
  { type: "List", icon: ListViewIcon, label: "List" },
  { type: "Link", icon: Link01Icon, label: "Link" },
  { type: "Row", icon: LayoutLeftIcon, label: "Row" },
  { type: "Column", icon: LayoutTopIcon, label: "Column" },
  { type: "View", icon: ContainerIcon, label: "View" },
  { type: "Spacer", icon: AlignVerticalSpaceBetweenIcon, label: "Spacer" },
  { type: "Divider", icon: MinusSignIcon, label: "Divider" },
  { type: "PageNumber", icon: HashtagIcon, label: "Page #" },
]

export function EditorDock({
  onSave,
  onPreview,
  onShowJson,
  onShowPageSettings,
  onImport,
  isSaving,
}: {
  onSave: () => void
  onPreview: () => void
  onShowJson: () => void
  onShowPageSettings: () => void
  onImport: () => void
  isSaving: boolean
}) {
  const { state, dispatch, canUndo, canRedo } = useEditor()

  const toolActions: DockAction[] = [
    {
      icon: ArrowTurnBackwardIcon,
      label: "Undo",
      onClick: () => dispatch({ type: "UNDO" }),
      disabled: !canUndo,
    },
    {
      icon: ArrowTurnForwardIcon,
      label: "Redo",
      onClick: () => dispatch({ type: "REDO" }),
      disabled: !canRedo,
    },
  ]

  const selectionActions: DockAction[] = [
    {
      icon: Copy01Icon,
      label: "Duplicate",
      onClick: () => {
        if (state.selectedElementId) {
          dispatch({ type: "DUPLICATE_ELEMENT", elementId: state.selectedElementId })
        }
      },
      disabled: !state.selectedElementId,
    },
    {
      icon: Delete02Icon,
      label: "Delete",
      onClick: () => {
        if (state.selectedElementId) {
          dispatch({ type: "REMOVE_ELEMENT", elementId: state.selectedElementId })
        }
      },
      disabled: !state.selectedElementId,
    },
  ]

  const editorActions: DockAction[] = [
    {
      icon: FileUploadIcon,
      label: "Import File",
      onClick: onImport,
    },
    {
      icon: RulerIcon,
      label: "Page Settings",
      onClick: onShowPageSettings,
    },
    {
      icon: CodeIcon,
      label: "JSON Spec",
      onClick: onShowJson,
    },
    {
      icon: ViewIcon,
      label: "Preview",
      onClick: onPreview,
    },
    {
      icon: FloppyDiskIcon,
      label: isSaving ? "Saving..." : "Save",
      onClick: onSave,
      disabled: isSaving || !state.isDirty,
    },
  ]

  return (
    <TooltipProvider delay={200}>
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 z-50 hidden md:block">
        <Dock iconSize={36} iconMagnification={52} iconDistance={100}>
          {/* Element tools (draggable) */}
          {elementActions.map((item) => (
            <DockDraggableItem
              key={item.type}
              label={item.label}
              elementType={item.type}
            >
              <HugeiconsIcon icon={item.icon} size={20} />
            </DockDraggableItem>
          ))}

          <DockSeparator />

          {/* Undo / Redo */}
          {toolActions.map((action) => (
            <DockItem
              key={action.label}
              label={action.label}
              onClick={action.onClick}
              disabled={action.disabled}
            >
              <HugeiconsIcon icon={action.icon} size={18} />
            </DockItem>
          ))}

          {/* Duplicate / Delete */}
          {selectionActions.map((action) => (
            <DockItem
              key={action.label}
              label={action.label}
              onClick={action.onClick}
              disabled={action.disabled}
            >
              <HugeiconsIcon icon={action.icon} size={18} />
            </DockItem>
          ))}

          <DockSeparator />

          {/* Editor actions */}
          {editorActions.map((action) => (
            <DockItem
              key={action.label}
              label={action.label}
              onClick={action.onClick}
              disabled={action.disabled}
            >
              <HugeiconsIcon icon={action.icon} size={18} />
            </DockItem>
          ))}
        </Dock>
      </div>
    </TooltipProvider>
  )
}
