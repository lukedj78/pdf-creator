"use client"

import {
  DocsPage,
  DocsSection,
  CodeBlock,
  Callout,
} from "@/components/marketing/docs-components"

export default function QuickstartPage() {
  return (
    <DocsPage
      title="Quickstart"
      description="Export your first JSON spec in under 5 minutes."
    >
      <DocsSection id="install" title="1. Install the SDK">
        <CodeBlock
          code={`npm install @pdf-generator/sdk`}
          language="bash"
          title="Terminal"
        />
        <p>Or use your preferred package manager:</p>
        <CodeBlock
          code={`pnpm add @pdf-generator/sdk
# or
yarn add @pdf-generator/sdk
# or
bun add @pdf-generator/sdk`}
          language="bash"
        />
      </DocsSection>

      <DocsSection id="api-key" title="2. Get your API key">
        <p>
          Go to{" "}
          <code className="rounded bg-accent px-1.5 py-0.5 text-[12px]">
            Dashboard &rarr; API Keys
          </code>{" "}
          and create a new key. Copy it — you will only see it once.
        </p>
        <Callout type="warning">
          Keep your API key secret. Never expose it in client-side code or
          public repositories.
        </Callout>
      </DocsSection>

      <DocsSection id="first-export" title="3. Export your first spec">
        <CodeBlock
          language="typescript"
          title="export-spec.ts"
          code={`import { SpecDesignerClient } from "@pdf-generator/sdk"
import { writeFileSync } from "fs"

const client = new SpecDesignerClient({
  apiKey: process.env.SPEC_DESIGNER_API_KEY!,
  baseUrl: "https://your-domain.com",
})

// Export a json-render spec from a saved template
const result = await client.exportSpec({
  templateId: "your-template-id",
  data: {
    invoiceNumber: "INV-001",
    customerName: "Acme Corp",
    items: [
      { description: "Widget", quantity: 10, price: 9.99 },
      { description: "Gadget", quantity: 5, price: 24.99 },
    ],
    total: 224.85,
  },
})

// result.id   → "gen_xyz789"
// result.spec → { root, elements, state }
writeFileSync("invoice-spec.json", JSON.stringify(result.spec, null, 2))
console.log(\`Exported spec: \${result.id}\`)`}
        />
      </DocsSection>

      <DocsSection id="inline-template" title="4. Or use an inline template">
        <p>
          You can also pass a full template schema instead of referencing a saved
          template:
        </p>
        <CodeBlock
          language="typescript"
          title="inline-template.ts"
          code={`const result = await client.exportSpec({
  template: {
    root: "doc",
    elements: {
      doc: { type: "Document", props: { title: "Simple Invoice" }, children: ["page"] },
      page: { type: "Page", props: { size: "A4" }, children: ["title", "customer"] },
      title: { type: "Heading", props: { text: "Invoice {{invoiceNumber}}", level: "h1" }, children: [] },
      customer: { type: "Text", props: { text: "Bill to: {{customerName}}", fontSize: 14, color: "#666" }, children: [] },
    },
    state: {},
  },
  data: {
    invoiceNumber: "INV-002",
    customerName: "Globex Corp",
  },
})

writeFileSync("invoice-spec.json", JSON.stringify(result.spec, null, 2))`}
        />
      </DocsSection>

      <DocsSection id="curl" title="5. Or use cURL directly">
        <CodeBlock
          language="bash"
          title="Terminal"
          code={`curl -X POST https://your-domain.com/api/v1/generate \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "templateId": "your-template-id",
    "data": {
      "invoiceNumber": "INV-001",
      "customerName": "Acme Corp"
    }
  }'

# Returns JSON: { "success": true, "data": { "id": "...", "spec": { ... } } }`}
        />
      </DocsSection>

      <DocsSection id="next-steps" title="Next steps">
        <ul className="list-inside list-disc space-y-2 text-muted-foreground">
          <li>
            <a href="/docs/api" className="text-foreground underline underline-offset-4">
              API Reference
            </a>{" "}
            — all REST endpoints
          </li>
          <li>
            <a href="/docs/sdk" className="text-foreground underline underline-offset-4">
              SDK Guide
            </a>{" "}
            — full TypeScript SDK documentation
          </li>
          <li>
            <a href="/docs/templates" className="text-foreground underline underline-offset-4">
              Template Schema
            </a>{" "}
            — element types, styles, data binding
          </li>
          <li>
            <a href="/docs/webhooks" className="text-foreground underline underline-offset-4">
              Webhooks
            </a>{" "}
            — real-time event notifications
          </li>
        </ul>
      </DocsSection>
    </DocsPage>
  )
}
