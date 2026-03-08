"use client"

import { useState, useCallback, useEffect } from "react"

const PLATFORM = "/api/proxy"
const RECEIVER = "http://localhost:3004/api/webhook-receiver"

const SAMPLE_SCHEMA = {
  id: "test-webhook",
  name: "Webhook Test",
  root: "doc",
  elements: {
    doc: { type: "Document", props: { title: "Webhook Test" }, children: ["page"] },
    page: { type: "Page", props: { size: "A4" }, children: ["text"] },
    text: { type: "Text", props: { content: "webhook test doc" }, children: [] },
  },
  state: {},
}

type LogEntry = { time: string; label: string; status: "pending" | "success" | "error"; detail?: string }

type WebhookEntry = {
  id: string
  timestamp: string
  event: string
  signature: string | null
  signatureValid: boolean | null
  headers: Record<string, string>
  body: unknown
}

export default function WebhookTestPage() {
  const [apiKey, setApiKey] = useState("")
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [running, setRunning] = useState(false)
  const [receivedWebhooks, setReceivedWebhooks] = useState<WebhookEntry[]>([])

  const log = useCallback((label: string, status: LogEntry["status"], detail?: string) => {
    setLogs((prev) => [...prev, { time: new Date().toLocaleTimeString(), label, status, detail }])
  }, [])

  // Poll received webhooks
  useEffect(() => {
    if (!running && logs.length === 0) return
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${RECEIVER}?_t=${Date.now()}`)
        const data = await res.json()
        setReceivedWebhooks(data.entries ?? [])
      } catch {
        // ignore
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [running, logs.length])

  async function runWebhookTests() {
    if (!apiKey.trim()) return
    setLogs([])
    setReceivedWebhooks([])
    setRunning(true)

    // Step 1: Clear receiver
    log("Clear webhook receiver", "pending")
    try {
      await fetch(`${RECEIVER}?clear=true`)
      log("Clear webhook receiver", "success", "Cleared all entries")
    } catch (e: unknown) {
      log("Clear webhook receiver", "error", (e as Error).message)
    }

    // Step 2: Test callbackUrl — export with callback pointing to our receiver
    log("Export with callbackUrl", "pending")
    try {
      const res = await fetch(`${PLATFORM}/api/v1/generate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          template: SAMPLE_SCHEMA,
          callbackUrl: RECEIVER,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        log("Export with callbackUrl", "success", `Gen: ${data.data.id} — callback sent to receiver`)
      } else {
        log("Export with callbackUrl", "error", `${res.status} — ${data?.error?.message}`)
      }
    } catch (e: unknown) {
      log("Export with callbackUrl", "error", (e as Error).message)
    }

    // Step 3: Create a template (triggers template.created webhook if configured)
    log("Create template (triggers webhook)", "pending")
    let templateId = ""
    try {
      const res = await fetch(`${PLATFORM}/api/v1/templates`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: "Webhook Test Template", schema: SAMPLE_SCHEMA }),
      })
      const data = await res.json()
      if (res.status === 201) {
        templateId = data.data.id
        log("Create template (triggers webhook)", "success", `ID: ${templateId}`)
      } else {
        log("Create template (triggers webhook)", "error", `${res.status}`)
      }
    } catch (e: unknown) {
      log("Create template (triggers webhook)", "error", (e as Error).message)
    }

    // Step 4: Update template (triggers template.updated)
    if (templateId) {
      log("Update template (triggers webhook)", "pending")
      try {
        const res = await fetch(`${PLATFORM}/api/v1/templates/${templateId}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: "Webhook Test (Updated)" }),
        })
        log("Update template (triggers webhook)", res.ok ? "success" : "error", `${res.status}`)
      } catch (e: unknown) {
        log("Update template (triggers webhook)", "error", (e as Error).message)
      }
    }

    // Step 5: Export spec (triggers export.completed)
    if (templateId) {
      log("Export spec (triggers webhook)", "pending")
      try {
        const res = await fetch(`${PLATFORM}/api/v1/generate`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ templateId }),
        })
        log("Export spec (triggers webhook)", res.ok ? "success" : "error", `${res.status}`)
      } catch (e: unknown) {
        log("Export spec (triggers webhook)", "error", (e as Error).message)
      }
    }

    // Step 6: Delete template (triggers template.deleted)
    if (templateId) {
      log("Delete template (triggers webhook)", "pending")
      try {
        const res = await fetch(`${PLATFORM}/api/v1/templates/${templateId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${apiKey}` },
        })
        log("Delete template (triggers webhook)", res.ok ? "success" : "error", `${res.status}`)
      } catch (e: unknown) {
        log("Delete template (triggers webhook)", "error", (e as Error).message)
      }
    }

    // Wait a moment for webhooks to arrive
    log("Waiting 2s for webhooks to arrive...", "pending")
    await new Promise((r) => setTimeout(r, 2000))
    log("Waiting 2s for webhooks to arrive...", "success", "Done")

    // Fetch final webhook count
    try {
      const res = await fetch(`${RECEIVER}?_t=${Date.now()}`)
      const data = await res.json()
      setReceivedWebhooks(data.entries ?? [])
      const count = data.entries?.length ?? 0
      log(`Received ${count} webhook(s)`, count > 0 ? "success" : "error",
        count > 0
          ? `Events: ${(data.entries as WebhookEntry[]).map((e: WebhookEntry) => e.event).join(", ")}`
          : "No webhooks received — make sure you configured a dashboard webhook pointing to http://localhost:3004/api/webhook-receiver"
      )
    } catch (e: unknown) {
      log("Check received webhooks", "error", (e as Error).message)
    }

    setRunning(false)
  }

  const passed = logs.filter((l) => l.status === "success").length
  const failed = logs.filter((l) => l.status === "error").length

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Webhook Integration Tests</h1>
      <p style={{ color: "#888", fontSize: "0.813rem", marginBottom: "1.5rem" }}>
        Tests both <strong>callbackUrl</strong> (per-request) and <strong>dashboard webhooks</strong> (persistent).
        For dashboard webhooks, create one in Settings → Webhooks with URL: <code>http://localhost:3004/api/webhook-receiver</code>
      </p>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <input
          type="text"
          placeholder="Paste your API key..."
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          style={{ flex: 1, padding: "0.5rem 0.75rem", background: "#111", border: "1px solid #333", borderRadius: "6px", color: "#ededed", fontFamily: "monospace", fontSize: "0.813rem" }}
        />
        <button
          onClick={runWebhookTests}
          disabled={running || !apiKey.trim()}
          style={{ padding: "0.5rem 1.25rem", background: running ? "#333" : "#ededed", color: running ? "#666" : "#0a0a0a", border: "none", borderRadius: "6px", fontWeight: 600, cursor: running ? "not-allowed" : "pointer" }}
        >
          {running ? "Running..." : "Run Webhook Tests"}
        </button>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <button
          onClick={async () => { await fetch(`${RECEIVER}?clear=true`); setReceivedWebhooks([]) }}
          style={{ padding: "0.375rem 0.75rem", background: "transparent", border: "1px solid #333", borderRadius: "6px", color: "#888", fontSize: "0.75rem", cursor: "pointer" }}
        >
          Clear Receiver
        </button>
        <button
          onClick={async () => {
            const secret = prompt("Paste webhook signing secret:")
            if (secret) {
              await fetch(`${RECEIVER}?secret=${encodeURIComponent(secret)}`)
            }
          }}
          style={{ padding: "0.375rem 0.75rem", background: "transparent", border: "1px solid #333", borderRadius: "6px", color: "#888", fontSize: "0.75rem", cursor: "pointer" }}
        >
          Set Verify Secret
        </button>
      </div>

      {logs.length > 0 && (
        <div style={{ marginBottom: "1rem", fontSize: "0.813rem", color: "#888" }}>
          {passed + failed} / {logs.length} completed — <span style={{ color: "#22c55e" }}>{passed} passed</span>{" "}
          {failed > 0 && <span style={{ color: "#ef4444" }}>{failed} failed</span>}
        </div>
      )}

      {/* Test Logs */}
      <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "2rem" }}>
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

      {/* Received Webhooks */}
      <h2 style={{ fontSize: "1.125rem", marginBottom: "0.75rem" }}>
        Received Webhooks ({receivedWebhooks.length})
      </h2>
      {receivedWebhooks.length === 0 ? (
        <p style={{ color: "#555", fontSize: "0.813rem" }}>No webhooks received yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {receivedWebhooks.map((wh) => (
            <div
              key={wh.id}
              style={{
                padding: "0.75rem",
                background: "#111",
                borderRadius: "8px",
                border: `1px solid ${wh.signatureValid === true ? "#22c55e33" : wh.signatureValid === false ? "#ef444433" : "#222"}`,
                fontSize: "0.813rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span>
                  <strong>{wh.event}</strong>
                  <span style={{ color: "#555", marginLeft: "0.75rem" }}>{wh.timestamp}</span>
                </span>
                {wh.signatureValid !== null && (
                  <span style={{ color: wh.signatureValid ? "#22c55e" : "#ef4444", fontWeight: 600, fontSize: "0.75rem" }}>
                    {wh.signatureValid ? "HMAC Valid" : "HMAC Invalid"}
                  </span>
                )}
                {wh.signatureValid === null && wh.signature && (
                  <span style={{ color: "#888", fontSize: "0.75rem" }}>Signature present (set secret to verify)</span>
                )}
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                {Object.entries(wh.headers).filter(([, v]) => v).map(([k, v]) => (
                  <span key={k} style={{ fontSize: "0.688rem", color: "#666", background: "#1a1a1a", padding: "2px 6px", borderRadius: "4px" }}>
                    {k}: {v}
                  </span>
                ))}
              </div>
              <pre style={{ margin: 0, color: "#888", fontSize: "0.75rem", overflow: "auto", maxHeight: "150px" }}>
                {JSON.stringify(wh.body, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
