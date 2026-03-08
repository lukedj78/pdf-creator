"use client"

import { useState } from "react"
import { useEditor } from "@/lib/editor/editor-context"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Button } from "@workspace/ui/components/button"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@workspace/ui/components/select"
import { HugeiconsIcon } from "@hugeicons/react"
import { Delete02Icon, Copy01Icon } from "@hugeicons/core-free-icons"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { Switch } from "@workspace/ui/components/switch"
import { Separator } from "@workspace/ui/components/separator"
import type { Element } from "@workspace/template-engine/schema"

function PropField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string | undefined) => void }) {
  return (
    <PropField label={label}>
      <div className="flex gap-2">
        <input
          type="color"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded border border-input cursor-pointer"
        />
        <Input
          value={value || ""}
          onChange={(e) => onChange(e.target.value || undefined)}
          placeholder="inherit"
          className="flex-1"
        />
      </div>
    </PropField>
  )
}

// ---------------------------------------------------------------------------
// Per-input data binding
// ---------------------------------------------------------------------------

function getStateValue(stateObj: Record<string, unknown>, pointer: string): string {
  const parts = pointer.split("/").filter(Boolean)
  let current: unknown = stateObj
  for (const part of parts) {
    if (current && typeof current === "object" && !Array.isArray(current)) {
      current = (current as Record<string, unknown>)[part]
    } else return ""
  }
  return typeof current === "string" ? current : current != null ? JSON.stringify(current) : ""
}

/** Extract pointers from a $template string like "${/a}\n${/b}" */
function extractTemplatePointers(tmpl: string): string[] {
  return [...new Set([...tmpl.matchAll(/\$\{(\/[^}]+)\}/g)].map(m => m[1]!))]
}

/**
 * Input with a {} button that opens a dialog to bind to a $template.
 * Always uses $template format — even for a single variable: "${/key}"
 */
function BindableField({
  propValue,
  onChangeProp,
  placeholder,
}: {
  propValue: unknown
  onChangeProp: (v: unknown) => void
  placeholder?: string
}) {
  const { state, dispatch } = useEditor()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState("")

  // Detect bound state: $template or $state (legacy, treated same)
  const isObj = propValue !== null && typeof propValue === "object"
  const templateStr = isObj && "$template" in (propValue as Record<string, unknown>)
    ? String((propValue as Record<string, unknown>).$template)
    : isObj && "$state" in (propValue as Record<string, unknown>)
      ? `\${${(propValue as Record<string, unknown>).$state}}`
      : null
  const isBound = templateStr !== null
  const pointers = isBound ? extractTemplatePointers(templateStr) : []
  const stringValue = typeof propValue === "string" ? propValue : ""
  const draftPointers = extractTemplatePointers(draft)

  function handleBind() {
    if (!draft.trim() || draftPointers.length === 0) return
    onChangeProp({ $template: draft })
    setDraft("")
    setOpen(false)
  }

  function handleUnbind() {
    // Resolve template to static string
    let result = templateStr ?? ""
    for (const ptr of pointers) {
      result = result.replaceAll(`\${${ptr}}`, getStateValue(state.template.state, ptr))
    }
    onChangeProp(result)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => {
      setOpen(o)
      if (o) setDraft(isBound ? templateStr : "")
    }}>
      {isBound ? (
        <div className="flex items-center gap-1">
          <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded truncate flex-1">
            {pointers.length} var{pointers.length > 1 ? "s" : ""}
            <span className="text-muted-foreground">
              {" "}({pointers.map(p => p.split("/").pop()).join(", ")})
            </span>
          </span>
          <DialogTrigger render={<Button variant="ghost" size="icon-xs" className="shrink-0 text-primary" title="Edit binding" />}>
            <span className="text-[10px] font-mono leading-none">{'{}'}</span>
          </DialogTrigger>
        </div>
      ) : (
        <div className="flex gap-1">
          <Input
            value={stringValue}
            onChange={(e) => onChangeProp(e.target.value)}
            placeholder={placeholder}
            className="flex-1"
          />
          <DialogTrigger render={<Button variant="ghost" size="icon-xs" className="shrink-0 text-muted-foreground" title="Bind to variable" />}>
            <span className="text-[10px] font-mono leading-none">{'{}'}</span>
          </DialogTrigger>
        </div>
      )}
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{isBound ? "Edit binding" : "Bind to variable"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <div className="space-y-1">
            <Label className="text-xs">Template</Label>
            <textarea
              className="w-full min-h-[36px] rounded-md border border-input bg-transparent px-2.5 py-1.5 text-sm font-mono shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none overflow-hidden"
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value)
                e.target.style.height = "auto"
                e.target.style.height = `${e.target.scrollHeight}px`
              }}
              ref={(el) => {
                if (el) {
                  el.style.height = "auto"
                  el.style.height = `${el.scrollHeight}px`
                }
              }}
              placeholder="e.g. ${/company/name}"
              autoFocus
            />
            <p className="text-[10px] text-muted-foreground">
              Use <code className="bg-muted px-1 rounded">{"${/key}"}</code> for variables
            </p>
          </div>
          {draftPointers.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs">Preview values</Label>
              {draftPointers.map(ptr => (
                <div key={ptr} className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-muted-foreground shrink-0 w-24 truncate" title={ptr}>{ptr}</span>
                  <Input
                    value={getStateValue(state.template.state, ptr)}
                    onChange={(e) => dispatch({ type: "SET_STATE", pointer: ptr, value: e.target.value })}
                    className="h-7 text-xs flex-1"
                    placeholder="Value"
                  />
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={handleBind} disabled={draftPointers.length === 0} className="flex-1">
              {isBound ? "Update" : "Bind"}
            </Button>
            {isBound && (
              <Button variant="outline" onClick={handleUnbind} className="flex-1">Unbind</Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Per-element prop editors
// ---------------------------------------------------------------------------

function TextPropsEditor({ element, onUpdate }: { element: Element; onUpdate: (props: Record<string, unknown>) => void }) {
  const props = element.props as Record<string, unknown>
  return (
    <>
      <PropField label="Text">
        <BindableField
          propValue={props.text}
          onChangeProp={(v) => onUpdate({ text: v })}
        />
      </PropField>
      <PropField label="Font Size">
        <Input
          type="number"
          value={String(props.fontSize || "")}
          onChange={(e) => onUpdate({ fontSize: e.target.value ? Number(e.target.value) : undefined })}
          placeholder="12"
        />
      </PropField>
      <ColorField label="Color" value={String(props.color || "")} onChange={(v) => onUpdate({ color: v })} />
      <PropField label="Align">
        <Select
          value={String(props.align || "")}
          onValueChange={(v) => onUpdate({ align: v || undefined })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Left">
              {(value: string) => ({ left: "Left", center: "Center", right: "Right" })[value] ?? "Left"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="right">Right</SelectItem>
          </SelectContent>
        </Select>
      </PropField>
      <PropField label="Font Weight">
        <Select
          value={String(props.fontWeight || "")}
          onValueChange={(v) => onUpdate({ fontWeight: v || undefined })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Normal">
              {(value: string) => value === "bold" ? "Bold" : "Normal"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="bold">Bold</SelectItem>
          </SelectContent>
        </Select>
      </PropField>
      <PropField label="Font Style">
        <Select
          value={String(props.fontStyle || "")}
          onValueChange={(v) => onUpdate({ fontStyle: v || undefined })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Normal">
              {(value: string) => value === "italic" ? "Italic" : "Normal"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="italic">Italic</SelectItem>
          </SelectContent>
        </Select>
      </PropField>
      <PropField label="Line Height">
        <Input
          type="number"
          step="0.1"
          value={String(props.lineHeight || "")}
          onChange={(e) => onUpdate({ lineHeight: e.target.value ? Number(e.target.value) : undefined })}
          placeholder="1.5"
        />
      </PropField>
    </>
  )
}

function HeadingPropsEditor({ element, onUpdate }: { element: Element; onUpdate: (props: Record<string, unknown>) => void }) {
  const props = element.props as Record<string, unknown>
  return (
    <>
      <PropField label="Text">
        <BindableField
          propValue={props.text}
          onChangeProp={(v) => onUpdate({ text: v })}
        />
      </PropField>
      <PropField label="Level">
        <Select
          value={String(props.level || "h2")}
          onValueChange={(v) => onUpdate({ level: v })}
        >
          <SelectTrigger className="w-full">
            <SelectValue>
              {(value: string) => value.toUpperCase()}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="h1">H1</SelectItem>
            <SelectItem value="h2">H2</SelectItem>
            <SelectItem value="h3">H3</SelectItem>
            <SelectItem value="h4">H4</SelectItem>
          </SelectContent>
        </Select>
      </PropField>
      <ColorField label="Color" value={String(props.color || "")} onChange={(v) => onUpdate({ color: v })} />
      <PropField label="Align">
        <Select
          value={String(props.align || "")}
          onValueChange={(v) => onUpdate({ align: v || undefined })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Left">
              {(value: string) => ({ left: "Left", center: "Center", right: "Right" })[value] ?? "Left"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="right">Right</SelectItem>
          </SelectContent>
        </Select>
      </PropField>
    </>
  )
}

function ImagePropsEditor({ element, onUpdate }: { element: Element; onUpdate: (props: Record<string, unknown>) => void }) {
  const props = element.props as Record<string, unknown>
  return (
    <>
      <PropField label="Source URL">
        <BindableField
          propValue={props.src}
          onChangeProp={(v) => onUpdate({ src: v })}
          placeholder="https://..."
        />
      </PropField>
      <div className="grid grid-cols-2 gap-2">
        <PropField label="Width">
          <Input
            type="number"
            value={String(props.width || "")}
            onChange={(e) => onUpdate({ width: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="auto"
          />
        </PropField>
        <PropField label="Height">
          <Input
            type="number"
            value={String(props.height || "")}
            onChange={(e) => onUpdate({ height: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="auto"
          />
        </PropField>
      </div>
      <PropField label="Object Fit">
        <Select
          value={String(props.objectFit || "")}
          onValueChange={(v) => onUpdate({ objectFit: v || undefined })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Default">
              {(value: string) => value || "Default"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="contain">Contain</SelectItem>
            <SelectItem value="cover">Cover</SelectItem>
            <SelectItem value="fill">Fill</SelectItem>
            <SelectItem value="none">None</SelectItem>
          </SelectContent>
        </Select>
      </PropField>
    </>
  )
}

function LinkPropsEditor({ element, onUpdate }: { element: Element; onUpdate: (props: Record<string, unknown>) => void }) {
  const props = element.props as Record<string, unknown>
  return (
    <>
      <PropField label="Text">
        <BindableField
          propValue={props.text}
          onChangeProp={(v) => onUpdate({ text: v })}
        />
      </PropField>
      <PropField label="URL">
        <BindableField
          propValue={props.href}
          onChangeProp={(v) => onUpdate({ href: v })}
          placeholder="https://..."
        />
      </PropField>
      <PropField label="Font Size">
        <Input
          type="number"
          value={String(props.fontSize || "")}
          onChange={(e) => onUpdate({ fontSize: e.target.value ? Number(e.target.value) : undefined })}
          placeholder="12"
        />
      </PropField>
      <ColorField label="Color" value={String(props.color || "")} onChange={(v) => onUpdate({ color: v })} />
    </>
  )
}

function TablePropsEditor({ element, onUpdate }: { element: Element; onUpdate: (props: Record<string, unknown>) => void }) {
  const props = element.props as Record<string, unknown>
  const columns = (props.columns as Array<{ header: string; width?: string; align?: string; field?: string }>) || []
  const rows = (props.rows as string[][]) || []
  const hasRepeat = !!element.repeat

  function updateColumn(i: number, updates: Partial<{ header: string; width: string; align: string; field: string }>) {
    const newCols = [...columns]
    newCols[i] = { ...newCols[i]!, ...updates }
    onUpdate({ columns: newCols })
  }

  function addColumn() {
    const newCols = [...columns, { header: `Column ${columns.length + 1}` }]
    const newRows = rows.map((row) => [...row, ""])
    onUpdate({ columns: newCols, rows: newRows })
  }

  function removeColumn(i: number) {
    const newCols = columns.filter((_, j) => j !== i)
    const newRows = rows.map((row) => row.filter((_, j) => j !== i))
    onUpdate({ columns: newCols, rows: newRows })
  }

  function updateCell(rowIdx: number, colIdx: number, value: string) {
    const newRows = rows.map((row, i) =>
      i === rowIdx ? row.map((cell, j) => (j === colIdx ? value : cell)) : row
    )
    onUpdate({ rows: newRows })
  }

  function addRow() {
    const newRow = columns.map(() => "")
    onUpdate({ rows: [...rows, newRow] })
  }

  function removeRow(i: number) {
    onUpdate({ rows: rows.filter((_, j) => j !== i) })
  }

  return (
    <>
      <PropField label="Columns">
        <div className="space-y-2">
          {columns.map((col, i) => (
            <div key={i} className="space-y-1 border border-border rounded-md p-2">
              <div className="flex gap-1 items-start">
                <div className="flex-1">
                  <BindableField
                    propValue={col.header}
                    onChangeProp={(v) => updateColumn(i, { header: typeof v === "string" ? v : "" })}
                    placeholder="Header"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => removeColumn(i)}
                  className="mt-1"
                >
                  <HugeiconsIcon icon={Delete02Icon} size={12} />
                </Button>
              </div>
              {hasRepeat && (
                <div className="flex items-center gap-1">
                  <Label className="text-[10px] text-muted-foreground shrink-0">Field:</Label>
                  <Input
                    value={col.field || ""}
                    onChange={(e) => updateColumn(i, { field: e.target.value || undefined })}
                    placeholder="item field name"
                    className="h-6 text-xs font-mono flex-1"
                  />
                </div>
              )}
            </div>
          ))}
          <Button variant="outline" size="xs" className="w-full" onClick={addColumn}>
            Add Column
          </Button>
        </div>
      </PropField>
      {/* Static rows — only shown when no repeat, or as "extra" fixed rows */}
      {!hasRepeat && (
        <PropField label="Rows">
          <div className="space-y-2">
            {rows.map((row, ri) => (
              <div key={ri} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">Row {ri + 1}</span>
                  <Button variant="ghost" size="icon-xs" onClick={() => removeRow(ri)}>
                    <HugeiconsIcon icon={Delete02Icon} size={12} />
                  </Button>
                </div>
                <div className="space-y-1">
                  {row.map((cell, ci) => (
                    <BindableField
                      key={ci}
                      propValue={cell}
                      onChangeProp={(v) => updateCell(ri, ci, typeof v === "string" ? v : "")}
                      placeholder={columns[ci]?.header || ""}
                    />
                  ))}
                </div>
              </div>
            ))}
            <Button variant="outline" size="xs" className="w-full" onClick={addRow}>
              Add Row
            </Button>
          </div>
        </PropField>
      )}
      <PropField label="Font Size">
        <Input
          type="number"
          value={String(props.fontSize || "")}
          onChange={(e) => onUpdate({ fontSize: e.target.value ? Number(e.target.value) : undefined })}
          placeholder="11"
        />
      </PropField>
      <ColorField label="Header Background" value={String(props.headerBackgroundColor || "")} onChange={(v) => onUpdate({ headerBackgroundColor: v })} />
      <ColorField label="Header Text Color" value={String(props.headerTextColor || "")} onChange={(v) => onUpdate({ headerTextColor: v })} />
      <ColorField label="Border Color" value={String(props.borderColor || "")} onChange={(v) => onUpdate({ borderColor: v })} />
      <PropField label="Striped Rows">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!props.striped}
            onChange={(e) => onUpdate({ striped: e.target.checked })}
          />
          Alternate row colors
        </label>
      </PropField>
    </>
  )
}

function LayoutPropsEditor({ element, onUpdate }: { element: Element; onUpdate: (props: Record<string, unknown>) => void }) {
  const props = element.props as Record<string, unknown>
  const alignLabels: Record<string, string> = { "flex-start": "Start", center: "Center", "flex-end": "End", stretch: "Stretch" }
  const justifyLabels: Record<string, string> = { "flex-start": "Start", center: "Center", "flex-end": "End", "space-between": "Space Between", "space-around": "Space Around" }
  return (
    <>
      {(element.type === "Row" || element.type === "Column") && (
        <PropField label="Gap">
          <Input
            type="number"
            value={String(props.gap || "")}
            onChange={(e) => onUpdate({ gap: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="0"
          />
        </PropField>
      )}
      <PropField label="Flex">
        <Input
          type="number"
          value={String(props.flex || "")}
          onChange={(e) => onUpdate({ flex: e.target.value ? Number(e.target.value) : undefined })}
          placeholder="1"
        />
      </PropField>
      <PropField label="Align Items">
        <Select
          value={String(props.alignItems || "")}
          onValueChange={(v) => onUpdate({ alignItems: v || undefined })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Default">
              {(value: string) => alignLabels[value] ?? "Default"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="flex-start">Start</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="flex-end">End</SelectItem>
            <SelectItem value="stretch">Stretch</SelectItem>
          </SelectContent>
        </Select>
      </PropField>
      <PropField label="Justify Content">
        <Select
          value={String(props.justifyContent || "")}
          onValueChange={(v) => onUpdate({ justifyContent: v || undefined })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Default">
              {(value: string) => justifyLabels[value] ?? "Default"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="flex-start">Start</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="flex-end">End</SelectItem>
            <SelectItem value="space-between">Space Between</SelectItem>
            <SelectItem value="space-around">Space Around</SelectItem>
          </SelectContent>
        </Select>
      </PropField>
      <PropField label="Padding">
        <Input
          type="number"
          value={String(props.padding || "")}
          onChange={(e) => onUpdate({ padding: e.target.value ? Number(e.target.value) : undefined })}
          placeholder="0"
        />
      </PropField>
      {element.type === "View" && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <PropField label="Padding Top">
              <Input type="number" value={String(props.paddingTop || "")} onChange={(e) => onUpdate({ paddingTop: e.target.value ? Number(e.target.value) : undefined })} placeholder="0" />
            </PropField>
            <PropField label="Padding Right">
              <Input type="number" value={String(props.paddingRight || "")} onChange={(e) => onUpdate({ paddingRight: e.target.value ? Number(e.target.value) : undefined })} placeholder="0" />
            </PropField>
            <PropField label="Padding Bottom">
              <Input type="number" value={String(props.paddingBottom || "")} onChange={(e) => onUpdate({ paddingBottom: e.target.value ? Number(e.target.value) : undefined })} placeholder="0" />
            </PropField>
            <PropField label="Padding Left">
              <Input type="number" value={String(props.paddingLeft || "")} onChange={(e) => onUpdate({ paddingLeft: e.target.value ? Number(e.target.value) : undefined })} placeholder="0" />
            </PropField>
          </div>
          <PropField label="Margin">
            <Input
              type="number"
              value={String(props.margin || "")}
              onChange={(e) => onUpdate({ margin: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="0"
            />
          </PropField>
          <ColorField label="Background Color" value={String(props.backgroundColor || "")} onChange={(v) => onUpdate({ backgroundColor: v })} />
          <PropField label="Border Width">
            <Input
              type="number"
              value={String(props.borderWidth || "")}
              onChange={(e) => onUpdate({ borderWidth: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="0"
            />
          </PropField>
          <ColorField label="Border Color" value={String(props.borderColor || "")} onChange={(v) => onUpdate({ borderColor: v })} />
          <PropField label="Border Radius">
            <Input
              type="number"
              value={String(props.borderRadius || "")}
              onChange={(e) => onUpdate({ borderRadius: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="0"
            />
          </PropField>
        </>
      )}
      {element.type === "Row" && (
        <PropField label="Wrap">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!props.wrap}
              onChange={(e) => onUpdate({ wrap: e.target.checked })}
            />
            Wrap items
          </label>
        </PropField>
      )}
    </>
  )
}

function SpacerPropsEditor({ element, onUpdate }: { element: Element; onUpdate: (props: Record<string, unknown>) => void }) {
  const props = element.props as Record<string, unknown>
  return (
    <PropField label="Height (px)">
      <Input
        type="number"
        value={String(props.height || 20)}
        onChange={(e) => onUpdate({ height: Number(e.target.value) })}
      />
    </PropField>
  )
}

function DividerPropsEditor({ element, onUpdate }: { element: Element; onUpdate: (props: Record<string, unknown>) => void }) {
  const props = element.props as Record<string, unknown>
  return (
    <>
      <PropField label="Thickness">
        <Input
          type="number"
          value={String(props.thickness || 1)}
          onChange={(e) => onUpdate({ thickness: Number(e.target.value) })}
        />
      </PropField>
      <ColorField label="Color" value={String(props.color || "#e5e5e5")} onChange={(v) => onUpdate({ color: v || "#e5e5e5" })} />
      <div className="grid grid-cols-2 gap-2">
        <PropField label="Margin Top">
          <Input
            type="number"
            value={String(props.marginTop || "")}
            onChange={(e) => onUpdate({ marginTop: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="0"
          />
        </PropField>
        <PropField label="Margin Bottom">
          <Input
            type="number"
            value={String(props.marginBottom || "")}
            onChange={(e) => onUpdate({ marginBottom: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="0"
          />
        </PropField>
      </div>
    </>
  )
}

function ListPropsEditor({ element, onUpdate }: { element: Element; onUpdate: (props: Record<string, unknown>) => void }) {
  const props = element.props as Record<string, unknown>
  const items = ((props.items as unknown[]) || []).map((item) =>
    typeof item === "string" ? item : ""
  )
  return (
    <>
      <PropField label="Items">
        <div className="space-y-1">
          {items.map((item, i) => (
            <div key={i} className="flex gap-1 items-start">
              <div className="flex-1">
                <BindableField
                  propValue={item}
                  onChangeProp={(v) => {
                    const newItems = [...items]
                    newItems[i] = typeof v === "string" ? v : ""
                    onUpdate({ items: newItems })
                  }}
                />
              </div>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => onUpdate({ items: items.filter((_, j) => j !== i) })}
                className="mt-1"
              >
                <HugeiconsIcon icon={Delete02Icon} size={12} />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="xs"
            className="w-full"
            onClick={() => onUpdate({ items: [...items, "New item"] })}
          >
            Add Item
          </Button>
        </div>
      </PropField>
      <PropField label="Ordered">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!props.ordered}
            onChange={(e) => onUpdate({ ordered: e.target.checked })}
          />
          Numbered list
        </label>
      </PropField>
      <PropField label="Font Size">
        <Input
          type="number"
          value={String(props.fontSize || "")}
          onChange={(e) => onUpdate({ fontSize: e.target.value ? Number(e.target.value) : undefined })}
          placeholder="12"
        />
      </PropField>
      <ColorField label="Color" value={String(props.color || "")} onChange={(v) => onUpdate({ color: v })} />
      <PropField label="Spacing">
        <Input
          type="number"
          value={String(props.spacing || "")}
          onChange={(e) => onUpdate({ spacing: e.target.value ? Number(e.target.value) : undefined })}
          placeholder="0"
        />
      </PropField>
    </>
  )
}

function PageNumberPropsEditor({ element, onUpdate }: { element: Element; onUpdate: (props: Record<string, unknown>) => void }) {
  const props = element.props as Record<string, unknown>
  return (
    <>
      <PropField label="Format">
        <BindableField
          propValue={props.format ?? "{pageNumber} / {totalPages}"}
          onChangeProp={(v) => onUpdate({ format: v })}
          placeholder="{pageNumber} / {totalPages}"
        />
      </PropField>
      <PropField label="Font Size">
        <Input
          type="number"
          value={String(props.fontSize || "")}
          onChange={(e) => onUpdate({ fontSize: e.target.value ? Number(e.target.value) : undefined })}
          placeholder="10"
        />
      </PropField>
      <ColorField label="Color" value={String(props.color || "")} onChange={(v) => onUpdate({ color: v })} />
      <PropField label="Align">
        <Select
          value={String(props.align || "center")}
          onValueChange={(v) => onUpdate({ align: v })}
        >
          <SelectTrigger className="w-full">
            <SelectValue>
              {(value: string) => ({ left: "Left", center: "Center", right: "Right" })[value] ?? "Center"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="right">Right</SelectItem>
          </SelectContent>
        </Select>
      </PropField>
    </>
  )
}

function PagePropsEditor({ pageId, onUpdate }: { pageId?: string; onUpdate: (props: Record<string, unknown>) => void }) {
  const { state } = useEditor()
  const resolvedPageId = pageId ?? Object.entries(state.template.elements).find(([, el]) => el.type === "Page")?.[0]
  const pageProps = resolvedPageId ? (state.template.elements[resolvedPageId]?.props as Record<string, unknown>) ?? {} : {}

  return (
    <>
      <PropField label="Page Size">
        <Select
          value={String(pageProps.size || "A4")}
          onValueChange={(v) => onUpdate({ size: v })}
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
      </PropField>
      <PropField label="Orientation">
        <Select
          value={String(pageProps.orientation || "portrait")}
          onValueChange={(v) => onUpdate({ orientation: v })}
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
      </PropField>
      <div className="grid grid-cols-2 gap-2">
        <PropField label="Margin Top">
          <Input type="number" value={String(pageProps.marginTop ?? 40)} onChange={(e) => onUpdate({ marginTop: Number(e.target.value) })} />
        </PropField>
        <PropField label="Margin Right">
          <Input type="number" value={String(pageProps.marginRight ?? 40)} onChange={(e) => onUpdate({ marginRight: Number(e.target.value) })} />
        </PropField>
        <PropField label="Margin Bottom">
          <Input type="number" value={String(pageProps.marginBottom ?? 40)} onChange={(e) => onUpdate({ marginBottom: Number(e.target.value) })} />
        </PropField>
        <PropField label="Margin Left">
          <Input type="number" value={String(pageProps.marginLeft ?? 40)} onChange={(e) => onUpdate({ marginLeft: Number(e.target.value) })} />
        </PropField>
      </div>
      <ColorField label="Background Color" value={String(pageProps.backgroundColor || "")} onChange={(v) => onUpdate({ backgroundColor: v })} />
    </>
  )
}

function DocumentPropsEditor({ onUpdate }: { onUpdate: (props: Record<string, unknown>) => void }) {
  const { state } = useEditor()
  const docProps = (state.template.elements[state.template.root]?.props as Record<string, unknown>) ?? {}

  return (
    <>
      <PropField label="Title">
        <Input
          value={String(docProps.title || "")}
          onChange={(e) => onUpdate({ title: e.target.value || undefined })}
          placeholder="Document title"
        />
      </PropField>
      <PropField label="Author">
        <Input
          value={String(docProps.author || "")}
          onChange={(e) => onUpdate({ author: e.target.value || undefined })}
          placeholder="Author name"
        />
      </PropField>
      <PropField label="Subject">
        <Input
          value={String(docProps.subject || "")}
          onChange={(e) => onUpdate({ subject: e.target.value || undefined })}
          placeholder="Document subject"
        />
      </PropField>
    </>
  )
}

// ---------------------------------------------------------------------------
// Repeat Section
// ---------------------------------------------------------------------------

/** Find all state paths that point to arrays */
function getArrayPaths(state: Record<string, unknown>, prefix = ""): string[] {
  const paths: string[] = []
  for (const [key, value] of Object.entries(state)) {
    const path = `${prefix}/${key}`
    if (Array.isArray(value)) {
      paths.push(path)
    } else if (value && typeof value === "object") {
      paths.push(...getArrayPaths(value as Record<string, unknown>, path))
    }
  }
  return paths
}

/** Get field names from the first item of an array in state */
function getItemFields(state: Record<string, unknown>, statePath: string): string[] {
  const parts = statePath.split("/").filter(Boolean)
  let current: unknown = state
  for (const part of parts) {
    if (current && typeof current === "object" && !Array.isArray(current)) {
      current = (current as Record<string, unknown>)[part]
    } else {
      return []
    }
  }
  if (!Array.isArray(current) || current.length === 0) return []
  const first = current[0]
  if (first && typeof first === "object" && !Array.isArray(first)) {
    return Object.keys(first as Record<string, unknown>)
  }
  return []
}

function RepeatSection({ elementId, element }: { elementId: string; element: Element }) {
  const { state, dispatch } = useEditor()
  const repeat = element.repeat
  const isEnabled = !!repeat
  const arrayPaths = getArrayPaths(state.template.state)

  function handleToggle(enabled: boolean) {
    if (enabled) {
      const defaultPath = arrayPaths[0] || "/items"
      const fields = getItemFields(state.template.state, defaultPath)
      dispatch({
        type: "SET_REPEAT",
        elementId,
        repeat: { statePath: defaultPath, key: fields[0] || "id" },
      })
    } else {
      dispatch({ type: "SET_REPEAT", elementId, repeat: undefined })
    }
  }

  const currentFields = repeat ? getItemFields(state.template.state, repeat.statePath) : []

  // Count items in the array for preview info
  const itemCount = repeat
    ? (() => {
        const parts = repeat.statePath.split("/").filter(Boolean)
        let current: unknown = state.template.state
        for (const part of parts) {
          if (current && typeof current === "object" && !Array.isArray(current)) {
            current = (current as Record<string, unknown>)[part]
          } else return 0
        }
        return Array.isArray(current) ? current.length : 0
      })()
    : 0

  return (
    <div className="space-y-3">
      <Separator />
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Repeat
        </h4>
        <Switch
          checked={isEnabled}
          onCheckedChange={handleToggle}
        />
      </div>

      {isEnabled && repeat && (
        <>
          <PropField label="Data Source">
            {arrayPaths.length > 0 ? (
              <Select
                value={repeat.statePath}
                onValueChange={(v) => {
                  if (!v) return
                  dispatch({
                    type: "SET_REPEAT",
                    elementId,
                    repeat: { ...repeat, statePath: v },
                  })
                }}
              >
                <SelectTrigger className="w-full font-mono text-xs">
                  <SelectValue>
                    {(value: string) => value}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {arrayPaths.map((path) => (
                    <SelectItem key={path} value={path}>
                      <span className="font-mono text-xs">{path}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={repeat.statePath}
                onChange={(e) =>
                  dispatch({
                    type: "SET_REPEAT",
                    elementId,
                    repeat: { ...repeat, statePath: e.target.value },
                  })
                }
                placeholder="/items"
                className="font-mono text-xs"
              />
            )}
          </PropField>

          <PropField label="Key Field">
            {currentFields.length > 0 ? (
              <Select
                value={repeat.key}
                onValueChange={(v) => {
                  if (!v) return
                  dispatch({
                    type: "SET_REPEAT",
                    elementId,
                    repeat: { ...repeat, key: v },
                  })
                }}
              >
                <SelectTrigger className="w-full font-mono text-xs">
                  <SelectValue>
                    {(value: string) => value}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {currentFields.map((field) => (
                    <SelectItem key={field} value={field}>
                      <span className="font-mono text-xs">{field}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={repeat.key}
                onChange={(e) =>
                  dispatch({
                    type: "SET_REPEAT",
                    elementId,
                    repeat: { ...repeat, key: e.target.value },
                  })
                }
                placeholder="id"
                className="font-mono text-xs"
              />
            )}
          </PropField>

          {itemCount > 0 && (
            <p className="text-[10px] text-muted-foreground">
              {itemCount} item{itemCount !== 1 ? "s" : ""} in data source
            </p>
          )}

          {currentFields.length > 0 && (
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">Available fields</Label>
              <div className="flex flex-wrap gap-1">
                {currentFields.map((field) => (
                  <span
                    key={field}
                    className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors"
                    title={`Use as: { "$item": "${field}" }`}
                  >
                    $item.{field}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Panel
// ---------------------------------------------------------------------------

export function PropertiesPanel({ mobile }: { mobile?: boolean } = {}) {
  const { state, dispatch, selectedElement } = useEditor()
  const selectedId = state.selectedElementId

  function handlePropsUpdate(props: Record<string, unknown>) {
    dispatch({
      type: "UPDATE_ELEMENT",
      elementId: selectedId!,
      props,
    })
  }

  function handlePagePropsUpdate(props: Record<string, unknown>) {
    dispatch({ type: "UPDATE_PAGE_PROPS", props })
  }

  function handleDocumentPropsUpdate(props: Record<string, unknown>) {
    dispatch({ type: "UPDATE_DOCUMENT_PROPS", props })
  }

  function renderPropsEditor() {
    if (!selectedElement || !selectedId) return null

    switch (selectedElement.type) {
      case "Text": return <TextPropsEditor element={selectedElement} onUpdate={handlePropsUpdate} />
      case "Heading": return <HeadingPropsEditor element={selectedElement} onUpdate={handlePropsUpdate} />
      case "Image": return <ImagePropsEditor element={selectedElement} onUpdate={handlePropsUpdate} />
      case "Link": return <LinkPropsEditor element={selectedElement} onUpdate={handlePropsUpdate} />
      case "Table": return <TablePropsEditor element={selectedElement} onUpdate={handlePropsUpdate} />
      case "Row":
      case "Column":
      case "View":
        return <LayoutPropsEditor element={selectedElement} onUpdate={handlePropsUpdate} />
      case "Spacer": return <SpacerPropsEditor element={selectedElement} onUpdate={handlePropsUpdate} />
      case "Divider": return <DividerPropsEditor element={selectedElement} onUpdate={handlePropsUpdate} />
      case "List": return <ListPropsEditor element={selectedElement} onUpdate={handlePropsUpdate} />
      case "PageNumber": return <PageNumberPropsEditor element={selectedElement} onUpdate={handlePropsUpdate} />
      case "Page": return <PagePropsEditor pageId={selectedId} onUpdate={handlePropsUpdate} />
      default: return null
    }
  }

  const isDocument = selectedElement?.type === "Document"
  const isPage = selectedElement?.type === "Page"
  const showDocumentStructure = !selectedElement || !selectedId

  // Count pages to prevent deleting the last one
  const docElement = state.template.elements[state.template.root]
  const pageCount = (docElement?.children ?? []).filter(
    (id) => state.template.elements[id]?.type === "Page"
  ).length
  const canDeletePage = isPage && pageCount > 1

  // Find page index for display
  const pageIndex = isPage && selectedId
    ? (docElement?.children ?? []).filter(
        (id) => state.template.elements[id]?.type === "Page"
      ).indexOf(selectedId)
    : -1

  return (
    <div className={`${mobile ? "" : "hidden md:block"} w-64 border-l bg-background overflow-y-auto`}>
      <div className="p-3 space-y-4">
        {/* Element Properties */}
        {selectedElement && selectedId && (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {isPage ? `Page ${pageIndex + 1}` : selectedElement.type}
              </h3>
              {!isDocument && (
                <div className="flex gap-1">
                  {!isPage && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => dispatch({ type: "DUPLICATE_ELEMENT", elementId: selectedId })}
                    >
                      <HugeiconsIcon icon={Copy01Icon} size={14} />
                    </Button>
                  )}
                  {(!isPage || canDeletePage) && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => dispatch({ type: "REMOVE_ELEMENT", elementId: selectedId })}
                    >
                      <HugeiconsIcon icon={Delete02Icon} size={14} />
                    </Button>
                  )}
                </div>
              )}
            </div>
            <div className="space-y-3">
              {renderPropsEditor()}
            </div>
            {/* Repeat config — only for content/layout elements, not Document/Page */}
            {!isDocument && !isPage && selectedId && selectedElement && (
              <RepeatSection elementId={selectedId} element={selectedElement} />
            )}
          </>
        )}

        {/* Document — shown when no element is selected */}
        {showDocumentStructure && (
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Document
            </h3>
            <div className="space-y-3">
              <DocumentPropsEditor onUpdate={handleDocumentPropsUpdate} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
