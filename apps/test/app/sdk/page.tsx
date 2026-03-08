"use client"

import { useState, useCallback } from "react"
import { SpecDesignerClient } from "@pdf-generator/sdk"

const BASE_URL = typeof window !== "undefined" ? `${window.location.origin}/api/proxy` : "http://localhost:3004/api/proxy"

const SAMPLE_SCHEMA = {
  id: "test-sdk",
  name: "SDK Test Invoice",
  root: "doc",
  elements: {
    doc: { type: "Document", props: { title: "Test Invoice" }, children: ["page"] },
    page: { type: "Page", props: { size: "A4" }, children: ["heading", "text"] },
    heading: { type: "Heading", props: { level: 1, content: "Invoice #${/invoiceNumber}" }, children: [] },
    text: { type: "Text", props: { content: "Client: ${/clientName}" }, children: [] },
  },
  state: { invoiceNumber: "INV-001", clientName: "Acme Corp" },
}

type LogEntry = { time: string; label: string; status: "pending" | "success" | "error"; detail?: string }

export default function SdkTestPage() {
  const [apiKey, setApiKey] = useState("")
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [running, setRunning] = useState(false)

  const log = useCallback((label: string, status: LogEntry["status"], detail?: string) => {
    setLogs((prev) => [
      ...prev,
      { time: new Date().toLocaleTimeString(), label, status, detail },
    ])
  }, [])

  async function runAllTests() {
    if (!apiKey.trim()) return
    setLogs([])
    setRunning(true)

    const client = new SpecDesignerClient({ apiKey, baseUrl: BASE_URL })

    let templateId = ""
    let duplicateId = ""
    let generationId = ""

    // 1. List templates
    log("listTemplates()", "pending")
    try {
      const templates = await client.listTemplates()
      log("listTemplates()", "success", `Found ${templates.length} template(s)`)
    } catch (e: unknown) {
      log("listTemplates()", "error", (e as Error).message)
    }

    // 2. Create template
    log("createTemplate()", "pending")
    try {
      const t = await client.createTemplate({
        name: "SDK Test Template",
        description: "Created by integration test",
        schema: SAMPLE_SCHEMA,
        status: "draft",
      })
      templateId = t.id
      log("createTemplate()", "success", `ID: ${t.id}`)
    } catch (e: unknown) {
      log("createTemplate()", "error", (e as Error).message)
      setRunning(false)
      return
    }

    // 3. Get template
    log("getTemplate()", "pending")
    try {
      const t = await client.getTemplate(templateId)
      log("getTemplate()", "success", `Name: ${t.name}, Status: ${t.status}`)
    } catch (e: unknown) {
      log("getTemplate()", "error", (e as Error).message)
    }

    // 4. Update template
    log("updateTemplate()", "pending")
    try {
      const t = await client.updateTemplate(templateId, {
        name: "SDK Test Template (Updated)",
        status: "published",
      })
      log("updateTemplate()", "success", `Name: ${t.name}, Status: ${t.status}`)
    } catch (e: unknown) {
      log("updateTemplate()", "error", (e as Error).message)
    }

    // 5. Duplicate template
    log("duplicateTemplate()", "pending")
    try {
      const t = await client.duplicateTemplate(templateId)
      duplicateId = t.id
      log("duplicateTemplate()", "success", `Copy ID: ${t.id}, Name: ${t.name}`)
    } catch (e: unknown) {
      log("duplicateTemplate()", "error", (e as Error).message)
    }

    // 6. Export spec (by template ID)
    log("exportSpec({ templateId })", "pending")
    try {
      const result = await client.exportSpec({
        templateId,
        data: { invoiceNumber: "INV-999", clientName: "Test Corp" },
      })
      generationId = result.id
      log("exportSpec({ templateId })", "success", `Generation ID: ${result.id}, Root: ${result.spec.root}, Elements: ${Object.keys(result.spec.elements).length}`)
    } catch (e: unknown) {
      log("exportSpec({ templateId })", "error", (e as Error).message)
    }

    // 7. Export spec (inline template)
    log("exportSpec({ template })", "pending")
    try {
      const result = await client.exportSpec({
        template: SAMPLE_SCHEMA,
        data: { invoiceNumber: "INV-INLINE", clientName: "Inline Corp" },
      })
      log("exportSpec({ template })", "success", `Generation ID: ${result.id}`)
    } catch (e: unknown) {
      log("exportSpec({ template })", "error", (e as Error).message)
    }

    // 8. Export spec with callbackUrl
    log("exportSpec({ callbackUrl })", "pending")
    try {
      const result = await client.exportSpec({
        templateId,
        data: { invoiceNumber: "INV-CALLBACK" },
        callbackUrl: "http://localhost:3004/api/webhook-receiver",
      })
      log("exportSpec({ callbackUrl })", "success", `Generation ID: ${result.id} — callback sent to localhost:3004`)
    } catch (e: unknown) {
      log("exportSpec({ callbackUrl })", "error", (e as Error).message)
    }

    // 9. List generations
    log("listGenerations()", "pending")
    try {
      const gens = await client.listGenerations({ limit: 5 })
      log("listGenerations()", "success", `Found ${gens.length} generation(s)`)
    } catch (e: unknown) {
      log("listGenerations()", "error", (e as Error).message)
    }

    // 10. Get generation
    if (generationId) {
      log("getGeneration()", "pending")
      try {
        const g = await client.getGeneration(generationId)
        log("getGeneration()", "success", `Status: ${g.status}, Format: ${g.format}`)
      } catch (e: unknown) {
        log("getGeneration()", "error", (e as Error).message)
      }
    }

    // 11. Get usage
    log("getUsage()", "pending")
    try {
      const u = await client.getUsage()
      log("getUsage()", "success", `Remaining: ${u.rateLimit.remaining}/${u.rateLimit.limit}, Generations this month: ${u.usage.generationsThisMonth}`)
    } catch (e: unknown) {
      log("getUsage()", "error", (e as Error).message)
    }

    // 12. Delete generation
    if (generationId) {
      log("deleteGeneration()", "pending")
      try {
        await client.deleteGeneration(generationId)
        log("deleteGeneration()", "success", `Deleted ${generationId}`)
      } catch (e: unknown) {
        log("deleteGeneration()", "error", (e as Error).message)
      }
    }

    // 13. Delete duplicate
    if (duplicateId) {
      log("deleteTemplate() [duplicate]", "pending")
      try {
        await client.deleteTemplate(duplicateId)
        log("deleteTemplate() [duplicate]", "success", `Deleted ${duplicateId}`)
      } catch (e: unknown) {
        log("deleteTemplate() [duplicate]", "error", (e as Error).message)
      }
    }

    // 14. Delete original
    log("deleteTemplate() [original]", "pending")
    try {
      await client.deleteTemplate(templateId)
      log("deleteTemplate() [original]", "success", `Deleted ${templateId}`)
    } catch (e: unknown) {
      log("deleteTemplate() [original]", "error", (e as Error).message)
    }

    // 15. Error handling — get deleted template
    log("getTemplate(deleted) — expect 404", "pending")
    try {
      await client.getTemplate(templateId)
      log("getTemplate(deleted)", "error", "Should have thrown but did not")
    } catch (e: unknown) {
      const err = e as { code?: string; status?: number; message?: string }
      if (err.status === 404 || err.code === "NOT_FOUND") {
        log("getTemplate(deleted) — expect 404", "success", `Correctly got ${err.status} ${err.code}`)
      } else {
        log("getTemplate(deleted)", "error", err.message ?? "Unknown error")
      }
    }

    setRunning(false)
  }

  const passed = logs.filter((l) => l.status === "success").length
  const failed = logs.filter((l) => l.status === "error").length

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>SDK Integration Tests</h1>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <input
          type="text"
          placeholder="Paste your API key..."
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          style={{
            flex: 1,
            padding: "0.5rem 0.75rem",
            background: "#111",
            border: "1px solid #333",
            borderRadius: "6px",
            color: "#ededed",
            fontFamily: "monospace",
            fontSize: "0.813rem",
          }}
        />
        <button
          onClick={runAllTests}
          disabled={running || !apiKey.trim()}
          style={{
            padding: "0.5rem 1.25rem",
            background: running ? "#333" : "#ededed",
            color: running ? "#666" : "#0a0a0a",
            border: "none",
            borderRadius: "6px",
            fontWeight: 600,
            cursor: running ? "not-allowed" : "pointer",
          }}
        >
          {running ? "Running..." : "Run All Tests"}
        </button>
      </div>

      {logs.length > 0 && (
        <div style={{ marginBottom: "1rem", fontSize: "0.813rem", color: "#888" }}>
          {passed + failed} / {logs.length} completed — <span style={{ color: "#22c55e" }}>{passed} passed</span>{" "}
          {failed > 0 && <span style={{ color: "#ef4444" }}>{failed} failed</span>}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {logs.map((entry, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "0.75rem",
              padding: "0.5rem 0.75rem",
              background: "#111",
              borderRadius: "6px",
              fontSize: "0.813rem",
              borderLeft: `3px solid ${entry.status === "success" ? "#22c55e" : entry.status === "error" ? "#ef4444" : "#666"}`,
            }}
          >
            <span style={{ color: "#555", fontSize: "0.75rem", flexShrink: 0 }}>{entry.time}</span>
            <span style={{ fontFamily: "monospace", fontWeight: 500, flexShrink: 0 }}>{entry.label}</span>
            {entry.detail && (
              <span style={{ color: "#888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {entry.detail}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
