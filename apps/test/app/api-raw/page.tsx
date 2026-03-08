"use client"

import { useState, useCallback } from "react"

const BASE = "/api/proxy/api/v1"

const SAMPLE_SCHEMA = {
  id: "test-inline",
  name: "Raw API Test",
  root: "doc",
  elements: {
    doc: { type: "Document", props: { title: "Raw API Test" }, children: ["page"] },
    page: { type: "Page", props: { size: "A4" }, children: ["text"] },
    text: { type: "Text", props: { content: "Hello from raw API test" }, children: [] },
  },
  state: {},
}

type LogEntry = { time: string; label: string; status: "pending" | "success" | "error"; detail?: string }

async function api(
  apiKey: string,
  method: string,
  path: string,
  body?: unknown
): Promise<{ status: number; headers: Headers; data: unknown }> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => null)
  return { status: res.status, headers: res.headers, data }
}

export default function ApiRawTestPage() {
  const [apiKey, setApiKey] = useState("")
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [running, setRunning] = useState(false)

  const log = useCallback((label: string, status: LogEntry["status"], detail?: string) => {
    setLogs((prev) => [...prev, { time: new Date().toLocaleTimeString(), label, status, detail }])
  }, [])

  async function runAllTests() {
    if (!apiKey.trim()) return
    setLogs([])
    setRunning(true)

    let templateId = ""
    let generationId = ""

    // 1. Auth — no key
    log("GET /templates (no key)", "pending")
    try {
      const res = await fetch(`${BASE}/templates`)
      const data = await res.json().catch(() => null)
      if (res.status === 401) {
        log("GET /templates (no key)", "success", `401 Unauthorized — ${(data as { error?: { message?: string } })?.error?.message}`)
      } else {
        log("GET /templates (no key)", "error", `Expected 401, got ${res.status}`)
      }
    } catch (e: unknown) {
      log("GET /templates (no key)", "error", (e as Error).message)
    }

    // 2. Auth — bad key
    log("GET /templates (bad key)", "pending")
    try {
      const { status, data } = await api("sk_invalid_key_12345", "GET", "/templates")
      if (status === 401) {
        log("GET /templates (bad key)", "success", `401 — ${(data as { error?: { message?: string } })?.error?.message}`)
      } else {
        log("GET /templates (bad key)", "error", `Expected 401, got ${status}`)
      }
    } catch (e: unknown) {
      log("GET /templates (bad key)", "error", (e as Error).message)
    }

    // 3. List templates
    log("GET /templates", "pending")
    try {
      const { status, data, headers } = await api(apiKey, "GET", "/templates")
      const rateLimit = headers.get("X-RateLimit-Remaining")
      log("GET /templates", status === 200 ? "success" : "error",
        `${status} — ${Array.isArray((data as { data?: unknown[] })?.data) ? (data as { data: unknown[] }).data.length : "?"} templates — Rate remaining: ${rateLimit}`)
    } catch (e: unknown) {
      log("GET /templates", "error", (e as Error).message)
    }

    // 4. Create template
    log("POST /templates", "pending")
    try {
      const { status, data } = await api(apiKey, "POST", "/templates", {
        name: "Raw API Test Template",
        schema: SAMPLE_SCHEMA,
      })
      if (status === 201) {
        templateId = (data as { data: { id: string } }).data.id
        log("POST /templates", "success", `201 Created — ID: ${templateId}`)
      } else {
        log("POST /templates", "error", `${status} — ${JSON.stringify(data)}`)
      }
    } catch (e: unknown) {
      log("POST /templates", "error", (e as Error).message)
      setRunning(false)
      return
    }

    // 5. Get template
    log(`GET /templates/${templateId}`, "pending")
    try {
      const { status } = await api(apiKey, "GET", `/templates/${templateId}`)
      log(`GET /templates/${templateId}`, status === 200 ? "success" : "error", `${status}`)
    } catch (e: unknown) {
      log(`GET /templates/${templateId}`, "error", (e as Error).message)
    }

    // 6. Update template
    log(`PUT /templates/${templateId}`, "pending")
    try {
      const { status, data } = await api(apiKey, "PUT", `/templates/${templateId}`, {
        name: "Raw API Test (Updated)",
        status: "published",
      })
      const name = (data as { data?: { name?: string } })?.data?.name
      log(`PUT /templates/${templateId}`, status === 200 ? "success" : "error", `${status} — Name: ${name}`)
    } catch (e: unknown) {
      log(`PUT /templates/${templateId}`, "error", (e as Error).message)
    }

    // 7. Duplicate
    log(`POST /templates/${templateId}/duplicate`, "pending")
    try {
      const { status, data } = await api(apiKey, "POST", `/templates/${templateId}/duplicate`)
      const dupId = (data as { data?: { id?: string } })?.data?.id
      if (status === 201 && dupId) {
        log(`POST /templates/${templateId}/duplicate`, "success", `201 — Copy: ${dupId}`)
        // Clean up duplicate
        await api(apiKey, "DELETE", `/templates/${dupId}`)
      } else {
        log(`POST /templates/${templateId}/duplicate`, "error", `${status}`)
      }
    } catch (e: unknown) {
      log(`POST /templates/${templateId}/duplicate`, "error", (e as Error).message)
    }

    // 8. Generate spec
    log("POST /generate", "pending")
    try {
      const { status, data } = await api(apiKey, "POST", "/generate", {
        templateId,
        data: { invoiceNumber: "RAW-001" },
      })
      if (status === 200) {
        const d = data as { data: { id: string; spec: { root: string; elements: Record<string, unknown> } } }
        generationId = d.data.id
        log("POST /generate", "success", `200 — Gen: ${generationId}, Root: ${d.data.spec.root}, Elements: ${Object.keys(d.data.spec.elements).length}`)
      } else {
        log("POST /generate", "error", `${status} — ${JSON.stringify(data)}`)
      }
    } catch (e: unknown) {
      log("POST /generate", "error", (e as Error).message)
    }

    // 9. Generate with inline template
    log("POST /generate (inline)", "pending")
    try {
      const { status } = await api(apiKey, "POST", "/generate", {
        template: SAMPLE_SCHEMA,
      })
      log("POST /generate (inline)", status === 200 ? "success" : "error", `${status}`)
    } catch (e: unknown) {
      log("POST /generate (inline)", "error", (e as Error).message)
    }

    // 10. Bad request — no templateId or template
    log("POST /generate (bad body)", "pending")
    try {
      const { status } = await api(apiKey, "POST", "/generate", { data: {} })
      log("POST /generate (bad body)", status === 400 ? "success" : "error", `${status} ${status === 400 ? "(correct)" : "(expected 400)"}`)
    } catch (e: unknown) {
      log("POST /generate (bad body)", "error", (e as Error).message)
    }

    // 11. List generations
    log("GET /generations?limit=5", "pending")
    try {
      const { status, data } = await api(apiKey, "GET", "/generations?limit=5")
      const count = Array.isArray((data as { data?: unknown[] })?.data) ? (data as { data: unknown[] }).data.length : "?"
      log("GET /generations?limit=5", status === 200 ? "success" : "error", `${status} — ${count} records`)
    } catch (e: unknown) {
      log("GET /generations?limit=5", "error", (e as Error).message)
    }

    // 12. Get single generation
    if (generationId) {
      log(`GET /generations/${generationId}`, "pending")
      try {
        const { status, data } = await api(apiKey, "GET", `/generations/${generationId}`)
        const genStatus = (data as { data?: { status?: string } })?.data?.status
        log(`GET /generations/${generationId}`, status === 200 ? "success" : "error", `${status} — Status: ${genStatus}`)
      } catch (e: unknown) {
        log(`GET /generations/${generationId}`, "error", (e as Error).message)
      }
    }

    // 13. Usage
    log("GET /usage", "pending")
    try {
      const { status, data } = await api(apiKey, "GET", "/usage")
      const d = data as { data?: { rateLimit?: { remaining?: number; limit?: number }; usage?: { generationsThisMonth?: number } } }
      log("GET /usage", status === 200 ? "success" : "error",
        `${status} — Remaining: ${d.data?.rateLimit?.remaining}/${d.data?.rateLimit?.limit}, This month: ${d.data?.usage?.generationsThisMonth}`)
    } catch (e: unknown) {
      log("GET /usage", "error", (e as Error).message)
    }

    // 14. Delete generation
    if (generationId) {
      log(`DELETE /generations/${generationId}`, "pending")
      try {
        const { status } = await api(apiKey, "DELETE", `/generations/${generationId}`)
        log(`DELETE /generations/${generationId}`, status === 200 ? "success" : "error", `${status}`)
      } catch (e: unknown) {
        log(`DELETE /generations/${generationId}`, "error", (e as Error).message)
      }
    }

    // 15. Delete template
    log(`DELETE /templates/${templateId}`, "pending")
    try {
      const { status } = await api(apiKey, "DELETE", `/templates/${templateId}`)
      log(`DELETE /templates/${templateId}`, status === 200 ? "success" : "error", `${status}`)
    } catch (e: unknown) {
      log(`DELETE /templates/${templateId}`, "error", (e as Error).message)
    }

    // 16. 404 on deleted
    log(`GET /templates/${templateId} (deleted)`, "pending")
    try {
      const { status } = await api(apiKey, "GET", `/templates/${templateId}`)
      log(`GET /templates/${templateId} (deleted)`, status === 404 ? "success" : "error",
        `${status} ${status === 404 ? "(correct 404)" : "(expected 404)"}`)
    } catch (e: unknown) {
      log(`GET /templates/${templateId} (deleted)`, "error", (e as Error).message)
    }

    setRunning(false)
  }

  const passed = logs.filter((l) => l.status === "success").length
  const failed = logs.filter((l) => l.status === "error").length

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Raw API Integration Tests</h1>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <input
          type="text"
          placeholder="Paste your API key..."
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          style={{ flex: 1, padding: "0.5rem 0.75rem", background: "#111", border: "1px solid #333", borderRadius: "6px", color: "#ededed", fontFamily: "monospace", fontSize: "0.813rem" }}
        />
        <button
          onClick={runAllTests}
          disabled={running || !apiKey.trim()}
          style={{ padding: "0.5rem 1.25rem", background: running ? "#333" : "#ededed", color: running ? "#666" : "#0a0a0a", border: "none", borderRadius: "6px", fontWeight: 600, cursor: running ? "not-allowed" : "pointer" }}
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
              display: "flex", alignItems: "baseline", gap: "0.75rem",
              padding: "0.5rem 0.75rem", background: "#111", borderRadius: "6px", fontSize: "0.813rem",
              borderLeft: `3px solid ${entry.status === "success" ? "#22c55e" : entry.status === "error" ? "#ef4444" : "#666"}`,
            }}
          >
            <span style={{ color: "#555", fontSize: "0.75rem", flexShrink: 0 }}>{entry.time}</span>
            <span style={{ fontFamily: "monospace", fontWeight: 500, flexShrink: 0 }}>{entry.label}</span>
            {entry.detail && <span style={{ color: "#888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.detail}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
