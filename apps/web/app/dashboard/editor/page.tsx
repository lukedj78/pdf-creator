"use client"

import { useEffect, useCallback, useState, useId, useRef } from "react"
import { useSearchParams } from "next/navigation"
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  pointerWithin,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { trpc } from "@/lib/trpc"
import { useEditorStore } from "@/lib/editor/use-editor-store"
import { useSyncPolling } from "@/hooks/use-sync-polling"
import { EditorProvider } from "@/lib/editor/editor-context"
import { EditorToolbar } from "@/components/editor/editor-toolbar"
import { ComponentsPanel } from "@/components/editor/components-panel"
import { EditorCanvas } from "@/components/editor/editor-canvas"
import { PropertiesPanel } from "@/components/editor/properties-panel"
import { templateSchema } from "@workspace/template-engine/schema"
import { TemplateRenderer } from "@workspace/template-engine/renderer"
import { getPageElementId } from "@workspace/template-engine/utils"
import { motion } from "framer-motion"
import { fade, staggerContainer, staggerItem } from "@workspace/ui/lib/animation"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Sheet, SheetContent } from "@workspace/ui/components/sheet"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  TooltipProvider,
} from "@workspace/ui/components/tooltip"
import { AiAssistantTrigger, AiAssistantPanel } from "@/components/editor/ai-assistant"
import { EditorDock } from "@/components/editor/editor-dock"
import { ImportModal } from "@/components/editor/import-modal"
import { ElementContextMenu, type ContextMenuPosition } from "@/components/editor/element-context-menu"
import { VariationsModal } from "@/components/editor/variations-modal"
import type { Template, ElementType } from "@workspace/template-engine/schema"

export default function EditorPage() {
  const searchParams = useSearchParams()
  const templateId = searchParams.get("id")

  if (templateId) {
    return <EditorWithTemplate templateId={templateId} />
  }

  return <EditorNew />
}

function EditorNew() {
  const store = useEditorStore()
  return <EditorShell store={store} />
}

function EditorWithTemplate({ templateId }: { templateId: string }) {
  const { data, isLoading } = trpc.templates.getById.useQuery({ id: templateId }, {
    refetchInterval: 5000,
  })
  const store = useEditorStore()
  const initialLoadDone = useRef(false)

  useEffect(() => {
    if (data?.schema) {
      try {
        const parsed = templateSchema.parse({
          id: data.id,
          name: data.name,
          ...(data.schema as Record<string, unknown>),
        })
        if (!initialLoadDone.current) {
          // First load: set template normally
          store.dispatch({ type: "SET_TEMPLATE", template: parsed })
          initialLoadDone.current = true
        } else if (!store.state.isDirty) {
          // Subsequent loads (from sync): update template data without resetting selection
          store.dispatch({ type: "SYNC_TEMPLATE", template: parsed })
        }
      } catch {
        if (!initialLoadDone.current) {
          store.dispatch({
            type: "UPDATE_TEMPLATE_NAME",
            name: data.name,
          })
          initialLoadDone.current = true
        }
      }
    }
  }, [data])

  // Poll for MCP sync events
  useSyncPolling({ templateId })

  if (isLoading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col">
        <Skeleton className="h-12 w-full" />
        <div className="flex flex-1">
          <Skeleton className="w-56 h-full" />
          <Skeleton className="flex-1 h-full" />
          <Skeleton className="w-64 h-full" />
        </div>
      </motion.div>
    )
  }

  return <EditorShell store={store} templateId={templateId} initialStatus={data?.status ?? "draft"} />
}

function EditorShell({
  store,
  templateId,
  initialStatus = "draft",
}: {
  store: ReturnType<typeof useEditorStore>
  templateId?: string
  initialStatus?: string
}) {
  const dndId = useId()
  const [activeDragType, setActiveDragType] = useState<string | null>(null)
  const [showComponents, setShowComponents] = useState(false)
  const [showProperties, setShowProperties] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showAiAssistant, setShowAiAssistant] = useState(false)
  const [showJson, setShowJson] = useState(false)
  const [showPageSettings, setShowPageSettings] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [contextMenu, setContextMenu] = useState<ContextMenuPosition>(null)
  const [variationsElementId, setVariationsElementId] = useState<string | null>(null)
  const [status, setStatus] = useState<"draft" | "published">(initialStatus as "draft" | "published")
  const utils = trpc.useUtils()

  const updateMutation = trpc.templates.update.useMutation({
    onSuccess: () => {
      store.dispatch({ type: "MARK_SAVED" })
      utils.templates.list.invalidate()
    },
  })

  const createMutation = trpc.templates.create.useMutation({
    onSuccess: (data) => {
      if (data) {
        store.dispatch({ type: "MARK_SAVED" })
        window.history.replaceState(null, "", `/dashboard/editor?id=${data.id}`)
      }
    },
  })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  )

  const handleSave = useCallback(() => {
    const { template } = store.state
    const { id, name, ...schema } = template

    if (templateId) {
      updateMutation.mutate({
        id: templateId,
        name,
        status,
        schema: schema as Record<string, unknown>,
      })
    } else {
      createMutation.mutate({
        name,
        schema: schema as Record<string, unknown>,
      })
    }
  }, [store.state, templateId, status])

  const handlePreview = useCallback(() => {
    setShowPreview(true)
  }, [])

  const handleImport = useCallback((template: Template) => {
    // Use AI_UPDATE_TEMPLATE to mark dirty (so user must save explicitly)
    store.dispatch({ type: "AI_UPDATE_TEMPLATE", template })
  }, [store])

  const handleElementContextMenu = useCallback((e: React.MouseEvent, elementId: string) => {
    setContextMenu({ x: e.clientX, y: e.clientY, elementId })
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      if (e.key === "z" && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
        e.preventDefault()
        store.dispatch({ type: "UNDO" })
      }
      if (e.key === "z" && (e.metaKey || e.ctrlKey) && e.shiftKey) {
        e.preventDefault()
        store.dispatch({ type: "REDO" })
      }
      if (e.key === "s" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        handleSave()
      }
      if ((e.key === "Delete" || e.key === "Backspace") && store.state.selectedElementId) {
        e.preventDefault()
        store.dispatch({ type: "REMOVE_ELEMENT", elementId: store.state.selectedElementId })
      }
      if (e.key === "d" && (e.metaKey || e.ctrlKey) && store.state.selectedElementId) {
        e.preventDefault()
        store.dispatch({ type: "DUPLICATE_ELEMENT", elementId: store.state.selectedElementId })
      }
      if (e.key === "r" && (e.metaKey || e.ctrlKey) && e.shiftKey && store.state.selectedElementId) {
        e.preventDefault()
        setVariationsElementId(store.state.selectedElementId)
      }
      if (e.key === "Escape") {
        if (contextMenu) {
          setContextMenu(null)
        } else if (showPreview) {
          setShowPreview(false)
        } else {
          store.dispatch({ type: "SELECT_ELEMENT", elementId: null })
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [store, handleSave, showPreview, contextMenu])

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current
    if (data?.type === "new-element") {
      setActiveDragType(data.elementType)
    } else if (data?.type === "existing-element") {
      setActiveDragType(data.elementId)
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragType(null)
    const { active, over } = event

    if (!over) return

    const activeData = active.data.current
    const pageId = getPageElementId(store.state.template)

    // Adding a new element from components panel
    if (activeData?.type === "new-element") {
      const elementType = activeData.elementType as ElementType
      const overData = over.data.current

      let parentId: string | undefined
      let index: number | undefined

      if (overData?.type === "container") {
        parentId = overData.parentId ?? undefined
      } else if (overData?.type === "existing-element") {
        parentId = overData.parentId ?? pageId ?? undefined
        const siblings = parentId
          ? store.state.template.elements[parentId]?.children ?? []
          : []
        const overIndex = siblings.indexOf(String(over.id))
        index = overIndex >= 0 ? overIndex + 1 : undefined
      }

      store.dispatch({
        type: "ADD_ELEMENT",
        elementType,
        parentId,
        index,
      })
      return
    }

    // Reordering an existing element
    if (activeData?.type === "existing-element") {
      const activeId = String(active.id)
      const overId = String(over.id)
      if (activeId === overId) return

      const overData = over.data.current
      const activeParentId: string = activeData.parentId ?? pageId ?? ""

      let targetParentId: string = pageId ?? ""
      let targetIndex = 0

      if (overData?.type === "container") {
        targetParentId = overData.parentId ?? pageId ?? ""
        const containerChildren = store.state.template.elements[targetParentId]?.children ?? []
        targetIndex = containerChildren.length
      } else {
        const overParentId: string = overData?.parentId ?? pageId ?? ""
        targetParentId = overParentId

        const siblings = store.state.template.elements[targetParentId]?.children ?? []
        const oldIndex = siblings.indexOf(activeId)
        const newIndex = siblings.indexOf(overId)

        if (activeParentId === targetParentId && oldIndex >= 0 && newIndex >= 0) {
          store.dispatch({
            type: "MOVE_ELEMENT",
            elementId: activeId,
            newParentId: targetParentId,
            index: newIndex,
          })
          return
        }

        targetIndex = newIndex >= 0 ? newIndex : siblings.length
      }

      if (targetParentId) {
        store.dispatch({
          type: "MOVE_ELEMENT",
          elementId: activeId,
          newParentId: targetParentId,
          index: targetIndex,
        })
      }
    }
  }

  return (
    <EditorProvider store={store}>
      <DndContext
        id={dndId}
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer(0.1)}
          className="h-full -mx-3 -mb-4 -mt-2 md:mx-0 md:mb-0 md:mt-0 md:rounded-lg md:border md:border-border overflow-hidden flex flex-col"
        >
          <motion.div variants={staggerItem}>
            <EditorToolbar
              onSave={handleSave}
              onPreview={handlePreview}
              isSaving={updateMutation.isPending || createMutation.isPending}
              onToggleComponents={() => setShowComponents(true)}
              onToggleProperties={() => setShowProperties(true)}
              showJson={showJson}
              onShowJsonChange={setShowJson}
              showPageSettings={showPageSettings}
              onShowPageSettingsChange={setShowPageSettings}
              status={status}
              onStatusChange={setStatus}
            />
          </motion.div>
          <motion.div variants={fade} className="flex flex-1 overflow-hidden relative">
            <ComponentsPanel />
            <EditorCanvas onElementContextMenu={handleElementContextMenu} />
            <PropertiesPanel />
            <EditorDock
              onSave={handleSave}
              onPreview={handlePreview}
              onShowJson={() => setShowJson(true)}
              onShowPageSettings={() => setShowPageSettings(true)}
              onImport={() => setShowImport(true)}
              isSaving={updateMutation.isPending || createMutation.isPending}
            />
          </motion.div>
        </motion.div>

        <DragOverlay>
          {activeDragType && (
            <div className="px-3 py-2 bg-background border rounded-md shadow-lg text-sm font-medium opacity-80">
              {store.state.template.elements[activeDragType]?.type ?? activeDragType}
            </div>
          )}
        </DragOverlay>

        {/* Mobile panels */}
        <Sheet open={showComponents} onOpenChange={setShowComponents}>
          <SheetContent side="left" className="w-56 p-0">
            <div className="pt-10">
              <ComponentsPanel mobile />
            </div>
          </SheetContent>
        </Sheet>
        <Sheet open={showProperties} onOpenChange={setShowProperties}>
          <SheetContent side="right" className="w-72 p-0">
            <div className="pt-10">
              <PropertiesPanel mobile />
            </div>
          </SheetContent>
        </Sheet>

        {/* Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="px-6 pt-6 pb-2">
              <DialogTitle>Preview</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-auto bg-muted/30 flex justify-center p-6">
              <TemplateRenderer
                template={store.state.template}
                scale={0.75}
              />
            </div>
          </DialogContent>
        </Dialog>
        {/* AI Assistant */}
        <TooltipProvider delay={300}>
          <AiAssistantTrigger
            isOpen={showAiAssistant}
            onToggle={() => setShowAiAssistant((v) => !v)}
          />
        </TooltipProvider>
        <AiAssistantPanel
          isOpen={showAiAssistant}
          onClose={() => setShowAiAssistant(false)}
          onSave={handleSave}
          templateId={templateId}
        />

        {/* Import Modal */}
        <ImportModal
          open={showImport}
          onOpenChange={setShowImport}
          onImport={handleImport}
        />

        {/* Element Context Menu */}
        <ElementContextMenu
          position={contextMenu}
          onClose={() => setContextMenu(null)}
          onVariations={(elementId) => setVariationsElementId(elementId)}
          onDuplicate={(elementId) => store.dispatch({ type: "DUPLICATE_ELEMENT", elementId })}
          onDelete={(elementId) => store.dispatch({ type: "REMOVE_ELEMENT", elementId })}
        />

        {/* AI Variations Modal */}
        <VariationsModal
          open={variationsElementId !== null}
          onOpenChange={(open) => { if (!open) setVariationsElementId(null) }}
          elementId={variationsElementId}
        />
      </DndContext>
    </EditorProvider>
  )
}
