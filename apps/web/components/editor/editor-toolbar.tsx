"use client"

import { useState } from "react"
import { useEditor } from "@/lib/editor/editor-context"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@workspace/ui/components/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@workspace/ui/components/dialog"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@workspace/ui/components/tooltip"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowTurnBackwardIcon,
  ArrowTurnForwardIcon,
  ZoomInAreaIcon,
  ZoomOutAreaIcon,
  FloppyDiskIcon,
  ViewIcon,
  CodeIcon,
  RulerIcon,
  ArrowLeft01Icon,
  Menu01Icon,
  Settings01Icon,
} from "@hugeicons/core-free-icons"
import { Badge } from "@workspace/ui/components/badge"
import Link from "next/link"
import { toSpec } from "@workspace/template-engine/schema"
import { getPageElementId } from "@workspace/template-engine/utils"

export function EditorToolbar({
  onSave,
  onPreview,
  isSaving,
  onToggleComponents,
  onToggleProperties,
  showJson,
  onShowJsonChange,
  showPageSettings,
  onShowPageSettingsChange,
  status,
  onStatusChange,
}: {
  onSave: () => void
  onPreview: () => void
  isSaving: boolean
  onToggleComponents?: () => void
  onToggleProperties?: () => void
  showJson: boolean
  onShowJsonChange: (open: boolean) => void
  showPageSettings: boolean
  onShowPageSettingsChange: (open: boolean) => void
  status?: "draft" | "published"
  onStatusChange?: (status: "draft" | "published") => void
}) {
  const { state, dispatch, canUndo, canRedo } = useEditor()
  const [copied, setCopied] = useState(false)

  // Read page props from the Page element
  const pageId = getPageElementId(state.template)
  const pageProps = pageId ? (state.template.elements[pageId]?.props as Record<string, unknown>) ?? {} : {}

  function updatePageProp(updates: Record<string, unknown>) {
    dispatch({ type: "UPDATE_PAGE_PROPS", props: updates })
  }

  return (
    <TooltipProvider delay={300}>
      <div className="h-12 border-b bg-background flex items-center px-2 md:px-3 gap-1 md:gap-2 shrink-0">
        {/* Mobile: toggle components panel */}
        {onToggleComponents && (
          <Tooltip>
            <TooltipTrigger render={<Button variant="ghost" size="icon-sm" onClick={onToggleComponents} className="md:hidden" />}>
              <HugeiconsIcon icon={Menu01Icon} size={18} />
            </TooltipTrigger>
            <TooltipContent>Components</TooltipContent>
          </Tooltip>
        )}

        {/* Back */}
        <Tooltip>
          <TooltipTrigger render={<Link href="/dashboard/templates" />}>
            <Button variant="ghost" size="icon-sm">
              <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Back to templates</TooltipContent>
        </Tooltip>

        {/* Template name */}
        <Input
          value={state.template.name}
          onChange={(e) => dispatch({ type: "UPDATE_TEMPLATE_NAME", name: e.target.value })}
          className="w-24 md:w-48 h-7 text-sm font-medium border-transparent hover:border-input focus-visible:border-ring"
        />

        {status && onStatusChange && (
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  onClick={() => onStatusChange(status === "draft" ? "published" : "draft")}
                  className="hidden md:inline-flex cursor-pointer"
                />
              }
            >
              <Badge
                variant={status === "published" ? "default" : "outline"}
                className="text-[10px] h-5 font-normal"
              >
                {status === "published" ? "Published" : "Draft"}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              Click to {status === "draft" ? "publish" : "set as draft"} (save to apply)
            </TooltipContent>
          </Tooltip>
        )}

        {state.isDirty && (
          <span className="hidden md:inline text-xs text-destructive">Unsaved</span>
        )}

        <div className="flex-1" />

        {/* Undo/Redo */}
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger render={<Button variant="ghost" size="icon-sm" disabled={!canUndo} onClick={() => dispatch({ type: "UNDO" })} />}>
              <HugeiconsIcon icon={ArrowTurnBackwardIcon} size={16} />
            </TooltipTrigger>
            <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger render={<Button variant="ghost" size="icon-sm" disabled={!canRedo} onClick={() => dispatch({ type: "REDO" })} />}>
              <HugeiconsIcon icon={ArrowTurnForwardIcon} size={16} />
            </TooltipTrigger>
            <TooltipContent>Redo (Ctrl+Shift+Z)</TooltipContent>
          </Tooltip>
        </div>

        <div className="hidden md:block w-px h-5 bg-border" />

        {/* Zoom — hidden on mobile */}
        <div className="hidden md:flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger render={<Button variant="ghost" size="icon-sm" onClick={() => dispatch({ type: "SET_ZOOM", zoom: state.zoom - 0.1 })} disabled={state.zoom <= 0.25} />}>
              <HugeiconsIcon icon={ZoomOutAreaIcon} size={16} />
            </TooltipTrigger>
            <TooltipContent>Zoom out</TooltipContent>
          </Tooltip>
          <span className="text-xs text-muted-foreground w-10 text-center">
            {Math.round(state.zoom * 100)}%
          </span>
          <Tooltip>
            <TooltipTrigger render={<Button variant="ghost" size="icon-sm" onClick={() => dispatch({ type: "SET_ZOOM", zoom: state.zoom + 0.1 })} disabled={state.zoom >= 2} />}>
              <HugeiconsIcon icon={ZoomInAreaIcon} size={16} />
            </TooltipTrigger>
            <TooltipContent>Zoom in</TooltipContent>
          </Tooltip>
        </div>

        <div className="hidden md:block w-px h-5 bg-border" />

        {/* Actions */}
        <Tooltip>
          <TooltipTrigger render={<Button variant="ghost" size="icon-sm" onClick={() => onShowPageSettingsChange(true)} />}>
            <HugeiconsIcon icon={RulerIcon} size={16} />
          </TooltipTrigger>
          <TooltipContent>Page settings</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger render={<Button variant="ghost" size="icon-sm" onClick={() => onShowJsonChange(true)} />}>
            <HugeiconsIcon icon={CodeIcon} size={16} />
          </TooltipTrigger>
          <TooltipContent>View JSON Spec</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger render={<Button variant="ghost" size="sm" onClick={onPreview} className="hidden md:inline-flex" />}>
            <HugeiconsIcon icon={ViewIcon} data-icon="inline-start" size={16} />
            Preview
          </TooltipTrigger>
          <TooltipContent>Preview template</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger render={<Button variant="ghost" size="icon-sm" onClick={onPreview} className="md:hidden" />}>
            <HugeiconsIcon icon={ViewIcon} size={16} />
          </TooltipTrigger>
          <TooltipContent>Preview</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger render={<Button size="sm" onClick={onSave} disabled={isSaving || !state.isDirty} className="hidden md:inline-flex" />}>
            <HugeiconsIcon icon={FloppyDiskIcon} data-icon="inline-start" size={16} />
            {isSaving ? "Saving..." : "Save"}
          </TooltipTrigger>
          <TooltipContent>Save template (Ctrl+S)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger render={<Button size="icon-sm" onClick={onSave} disabled={isSaving || !state.isDirty} className="md:hidden" />}>
            <HugeiconsIcon icon={FloppyDiskIcon} size={16} />
          </TooltipTrigger>
          <TooltipContent>Save (Ctrl+S)</TooltipContent>
        </Tooltip>

        {/* Mobile: toggle properties panel */}
        {onToggleProperties && (
          <Tooltip>
            <TooltipTrigger render={<Button variant="ghost" size="icon-sm" onClick={onToggleProperties} className="md:hidden" />}>
              <HugeiconsIcon icon={Settings01Icon} size={18} />
            </TooltipTrigger>
            <TooltipContent>Properties</TooltipContent>
          </Tooltip>
        )}

        {/* Page Settings Dialog */}
        <Dialog open={showPageSettings} onOpenChange={onShowPageSettingsChange}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Page Settings</DialogTitle>
              <DialogDescription>
                Configure page size, orientation and margins.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Page Size</Label>
                <Select
                  value={String(pageProps.size || "A4")}
                  onValueChange={(v) => updatePageProp({ size: v })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {(value: string) => value}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A3">A3</SelectItem>
                    <SelectItem value="A4">A4</SelectItem>
                    <SelectItem value="A5">A5</SelectItem>
                    <SelectItem value="LETTER">Letter</SelectItem>
                    <SelectItem value="LEGAL">Legal</SelectItem>
                    <SelectItem value="TABLOID">Tabloid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Orientation</Label>
                <Select
                  value={String(pageProps.orientation || "portrait")}
                  onValueChange={(v) => updatePageProp({ orientation: v })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {(value: string) => value === "portrait" ? "Portrait" : "Landscape"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portrait">Portrait</SelectItem>
                    <SelectItem value="landscape">Landscape</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Margins (px)</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground uppercase">Top</Label>
                    <Input
                      type="number"
                      value={String(pageProps.marginTop ?? 40)}
                      onChange={(e) => updatePageProp({ marginTop: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground uppercase">Right</Label>
                    <Input
                      type="number"
                      value={String(pageProps.marginRight ?? 40)}
                      onChange={(e) => updatePageProp({ marginRight: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground uppercase">Bottom</Label>
                    <Input
                      type="number"
                      value={String(pageProps.marginBottom ?? 40)}
                      onChange={(e) => updatePageProp({ marginBottom: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground uppercase">Left</Label>
                    <Input
                      type="number"
                      value={String(pageProps.marginLeft ?? 40)}
                      onChange={(e) => updatePageProp({ marginLeft: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* JSON Spec Dialog */}
        <Dialog open={showJson} onOpenChange={onShowJsonChange}>
          <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>JSON Spec</DialogTitle>
              <DialogDescription>
                json-render compatible spec output. This is what gets exported.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-auto">
              <pre className="text-xs bg-muted rounded-lg p-4 overflow-auto max-h-[60vh] whitespace-pre-wrap break-all">
                {JSON.stringify(toSpec(state.template), null, 2)}
              </pre>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(toSpec(state.template), null, 2))
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                }}
              >
                {copied ? "Copied!" : "Copy"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => onShowJsonChange(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}
