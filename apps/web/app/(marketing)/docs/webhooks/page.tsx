"use client"

import {
  DocsPage,
  DocsSection,
  CodeBlock,
  Callout,
  ParamTable,
} from "@/components/marketing/docs-components"

export default function WebhooksPage() {
  return (
    <DocsPage
      title="Webhooks & Callbacks"
      description="Get notified when specs are exported — via per-request callbacks or persistent webhook subscriptions."
    >
      <DocsSection id="callback-url" title="Callback URL (per-request)">
        <p>
          The simplest way to get notified. Pass a{" "}
          <code className="rounded bg-accent px-1.5 py-0.5 text-[12px]">callbackUrl</code>{" "}
          in your export request and we will POST to it when the spec export is ready
          (or fails).
        </p>
        <CodeBlock
          language="json"
          title="POST /api/v1/generate"
          code={`{
  "templateId": "tpl_abc123",
  "data": { "invoiceNumber": "INV-001" },
  "callbackUrl": "https://your-app.com/api/spec-ready"
}`}
        />

        <h4 className="mt-4 text-[13px] font-semibold">Success payload</h4>
        <CodeBlock
          language="json"
          title="POST to your callbackUrl"
          code={`{
  "event": "export.completed",
  "generationId": "gen_xyz789",
  "templateId": "tpl_abc123",
  "format": "json",
  "timestamp": "2025-01-15T10:30:00Z"
}`}
        />

        <h4 className="mt-4 text-[13px] font-semibold">Failure payload</h4>
        <CodeBlock
          language="json"
          title="POST to your callbackUrl"
          code={`{
  "event": "export.failed",
  "generationId": "gen_xyz789",
  "templateId": "tpl_abc123",
  "format": "json",
  "error": "Template rendering timed out",
  "timestamp": "2025-01-15T10:30:05Z"
}`}
        />

        <Callout type="tip">
          The callback is fire-and-forget. You still receive the JSON spec in
          the response — the callback is an additional notification, useful for
          logging, triggering downstream workflows, or confirming delivery.
        </Callout>

        <h4 className="mt-4 text-[13px] font-semibold">SDK example</h4>
        <CodeBlock
          language="typescript"
          code={`const result = await client.exportSpec({
  templateId: "tpl_abc123",
  data: { invoiceNumber: "INV-001" },
  callbackUrl: "https://your-app.com/api/spec-ready",
})`}
        />
      </DocsSection>

      <DocsSection id="setup" title="Dashboard Webhooks (persistent)">
        <p>
          For broader event subscriptions across your entire organization,
          configure persistent webhooks from{" "}
          <code className="rounded bg-accent px-1.5 py-0.5 text-[12px]">
            Dashboard &rarr; Settings &rarr; Webhooks
          </code>.
          These fire for all matching events, regardless of which API call
          triggered them.
        </p>
        <ParamTable
          params={[
            { name: "url", type: "string", required: true, description: "HTTPS endpoint that receives POST requests" },
            { name: "events", type: "string[]", required: true, description: "List of event types to subscribe to" },
          ]}
        />
        <Callout type="info">
          Webhook URLs must use HTTPS in production. Each organization can have
          multiple webhooks with different event subscriptions.
        </Callout>
      </DocsSection>

      <DocsSection id="events" title="Events">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-2 pr-4 font-medium">Event</th>
                <th className="pb-2 font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="py-2 pr-4"><code className="text-[12px]">export.completed</code></td>
                <td className="py-2 text-muted-foreground">A spec export finished successfully</td>
              </tr>
              <tr>
                <td className="py-2 pr-4"><code className="text-[12px]">export.failed</code></td>
                <td className="py-2 text-muted-foreground">A spec export failed</td>
              </tr>
              <tr>
                <td className="py-2 pr-4"><code className="text-[12px]">template.created</code></td>
                <td className="py-2 text-muted-foreground">A new template was created</td>
              </tr>
              <tr>
                <td className="py-2 pr-4"><code className="text-[12px]">template.updated</code></td>
                <td className="py-2 text-muted-foreground">A template was modified</td>
              </tr>
              <tr>
                <td className="py-2 pr-4"><code className="text-[12px]">template.deleted</code></td>
                <td className="py-2 text-muted-foreground">A template was deleted</td>
              </tr>
            </tbody>
          </table>
        </div>
      </DocsSection>

      <DocsSection id="security" title="Security">
        <p>
          Dashboard webhook requests include an HMAC-SHA256 signature in the{" "}
          <code className="rounded bg-accent px-1.5 py-0.5 text-[12px]">
            X-Webhook-Signature
          </code>{" "}
          header. Verify it to ensure the request is authentic.
        </p>
        <CodeBlock
          language="typescript"
          title="Verification example (Node.js)"
          code={`import { createHmac } from "crypto"

function verifyWebhook(payload: string, signature: string, secret: string): boolean {
  const expected = createHmac("sha256", secret)
    .update(payload)
    .digest("hex")
  return signature === expected
}

// In your webhook handler:
app.post("/webhook", (req, res) => {
  const signature = req.headers["x-webhook-signature"] as string
  const isValid = verifyWebhook(JSON.stringify(req.body), signature, WEBHOOK_SECRET)

  if (!isValid) {
    return res.status(401).send("Invalid signature")
  }

  const { event, data } = req.body
  console.log(\`Received \${event}\`, data)

  res.status(200).send("OK")
})`}
        />

        <Callout type="info">
          Per-request <code className="text-[12px]">callbackUrl</code> notifications
          do not include HMAC signatures. If you need signed payloads, use
          dashboard webhooks instead.
        </Callout>

        <h4 className="mt-6 text-[13px] font-semibold">Retry policy</h4>
        <p>
          Dashboard webhooks: failed deliveries are retried with exponential
          backoff (1 min, 5 min, 30 min, 2 hours, 12 hours). After 5 failures,
          the webhook is marked as failing. Callback URLs are fire-and-forget
          with no retries.
        </p>
      </DocsSection>
    </DocsPage>
  )
}
