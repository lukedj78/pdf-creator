"use client"

import { useState, useCallback, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  FileUploadIcon,
  Cancel01Icon,
  Loading03Icon,
  File01Icon,
  Link01Icon,
} from "@hugeicons/core-free-icons"
import { importFromFile, importFromUrl } from "@/lib/actions/import"
import type { Template } from "@workspace/template-engine/schema"

const ACCEPTED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
]

const MAX_SIZE = 10 * 1024 * 1024 // 10MB

type ImportMode = "file" | "url"

type ImportState =
  | { status: "idle" }
  | { status: "selected"; file: File; preview?: string }
  | { status: "analyzing" }
  | { status: "error"; message: string }

export function ImportModal({
  open,
  onOpenChange,
  onImport,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (template: Template) => void
}) {
  const [mode, setMode] = useState<ImportMode>("file")
  const [state, setState] = useState<ImportState>({ status: "idle" })
  const [url, setUrl] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const reset = useCallback(() => {
    setState({ status: "idle" })
    setUrl("")
  }, [])

  const handleClose = useCallback(
    (open: boolean) => {
      if (!open) {
        reset()
        setMode("file")
      }
      onOpenChange(open)
    },
    [onOpenChange, reset],
  )

  const handleFile = useCallback((file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setState({ status: "error", message: "Unsupported file type. Use PDF, PNG, JPG or WebP." })
      return
    }
    if (file.size > MAX_SIZE) {
      setState({ status: "error", message: "File too large. Maximum 10MB." })
      return
    }

    const preview = file.type.startsWith("image/")
      ? URL.createObjectURL(file)
      : undefined

    setState({ status: "selected", file, preview })
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile],
  )

  const handleAnalyzeFile = useCallback(async () => {
    if (state.status !== "selected") return

    const { file } = state
    setState({ status: "analyzing" })

    try {
      const buffer = await file.arrayBuffer()
      const base64 = btoa(
        new Uint8Array(buffer).reduce((s, b) => s + String.fromCharCode(b), ""),
      )

      const result = await importFromFile({
        fileBase64: base64,
        mimeType: file.type,
      })

      if (result.success) {
        onImport(result.template)
        handleClose(false)
      } else {
        setState({ status: "error", message: result.error })
      }
    } catch {
      setState({ status: "error", message: "Something went wrong during analysis." })
    }
  }, [state, onImport, handleClose])

  const handleAnalyzeUrl = useCallback(async () => {
    if (!url.trim()) return

    setState({ status: "analyzing" })

    try {
      const result = await importFromUrl({ url: url.trim() })

      if (result.success) {
        onImport(result.template)
        handleClose(false)
      } else {
        setState({ status: "error", message: result.error })
      }
    } catch {
      setState({ status: "error", message: "Something went wrong during analysis." })
    }
  }, [url, onImport, handleClose])

  const canAnalyze =
    mode === "file"
      ? state.status === "selected"
      : url.trim().length > 0 && state.status !== "analyzing"

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md overflow-hidden">
        <DialogHeader>
          <DialogTitle>Import from file</DialogTitle>
          <DialogDescription>
            Upload a PDF or image and AI will convert it into an editable spec.
          </DialogDescription>
        </DialogHeader>

        {/* Mode tabs */}
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          <button
            type="button"
            onClick={() => { setMode("file"); reset() }}
            className={`flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === "file"
                ? "bg-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <HugeiconsIcon icon={FileUploadIcon} size={14} />
            File
          </button>
          <button
            type="button"
            onClick={() => { setMode("url"); reset() }}
            className={`flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === "url"
                ? "bg-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <HugeiconsIcon icon={Link01Icon} size={14} />
            URL
          </button>
        </div>

        {/* File mode */}
        {mode === "file" && state.status === "idle" && (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 p-8 cursor-pointer transition-colors hover:border-muted-foreground/40 hover:bg-muted/50"
          >
            <HugeiconsIcon icon={FileUploadIcon} size={32} className="text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm font-medium">Drop a file here or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">PDF, PNG, JPG, WebP — max 10MB</p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFile(file)
                e.target.value = ""
              }}
            />
          </div>
        )}

        {mode === "file" && state.status === "selected" && (
          <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-4 min-w-0">
            {state.preview ? (
              <img
                src={state.preview}
                alt="Preview"
                className="h-16 w-16 rounded object-cover border"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded border bg-muted">
                <HugeiconsIcon icon={File01Icon} size={24} className="text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{state.file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(state.file.size / 1024).toFixed(0)} KB
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={reset}>
              <HugeiconsIcon icon={Cancel01Icon} size={16} />
            </Button>
          </div>
        )}

        {/* URL mode */}
        {mode === "url" && state.status !== "analyzing" && state.status !== "error" && (
          <div className="space-y-2">
            <Input
              placeholder="https://example.com/document.pdf"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canAnalyze) {
                  handleAnalyzeUrl()
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              Direct link to a PDF or image file (PNG, JPG, WebP)
            </p>
          </div>
        )}

        {/* Shared states */}
        {state.status === "analyzing" && (
          <div className="flex flex-col items-center gap-3 py-8">
            <HugeiconsIcon
              icon={Loading03Icon}
              size={28}
              className="text-muted-foreground animate-spin"
            />
            <p className="text-sm text-muted-foreground">Analyzing document...</p>
          </div>
        )}

        {state.status === "error" && (
          <div className="flex flex-col gap-3">
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
              <p className="text-sm text-destructive">{state.message}</p>
            </div>
            <Button variant="outline" size="sm" onClick={reset}>
              Try again
            </Button>
          </div>
        )}

        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancel</Button>} />
          <Button
            onClick={mode === "file" ? handleAnalyzeFile : handleAnalyzeUrl}
            disabled={!canAnalyze || state.status === "analyzing"}
          >
            {state.status === "analyzing" ? "Analyzing..." : "Analyze & Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
