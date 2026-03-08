"use client"

import {
  DocsPage,
  DocsSection,
  CodeBlock,
  Callout,
} from "@/components/marketing/docs-components"

export default function SdkPage() {
  return (
    <DocsPage
      title="TypeScript SDK"
      description="Official TypeScript SDK for Node.js, Deno, and Bun."
    >
      <DocsSection id="installation" title="Installation">
        <CodeBlock
          code={`npm install @pdf-generator/sdk`}
          language="bash"
          title="Terminal"
        />
        <CodeBlock
          language="typescript"
          title="Setup"
          code={`import { SpecDesignerClient } from "@pdf-generator/sdk"

const client = new SpecDesignerClient({
  apiKey: process.env.SPEC_DESIGNER_API_KEY!,
  baseUrl: "https://your-domain.com",
})`}
        />
      </DocsSection>

      <DocsSection id="templates" title="Templates">
        <h4 className="text-[13px] font-semibold">List templates</h4>
        <CodeBlock
          language="typescript"
          code={`const templates = await client.listTemplates()
// Template[] — all templates in your organization`}
        />

        <h4 className="mt-4 text-[13px] font-semibold">Get template</h4>
        <CodeBlock
          language="typescript"
          code={`const template = await client.getTemplate("tpl_abc123")
// { id, name, description, schema, status, ... }`}
        />

        <h4 className="mt-4 text-[13px] font-semibold">Create template</h4>
        <CodeBlock
          language="typescript"
          code={`const template = await client.createTemplate({
  name: "Monthly Report",
  description: "Auto-generated monthly report",
  schema: {
    root: "doc",
    elements: {
      doc: { type: "Document", props: { title: "Monthly Report" }, children: ["page"] },
      page: { type: "Page", props: { size: "A4" }, children: ["title"] },
      title: { type: "Heading", props: { text: "Report — {{month}} {{year}}", level: "h1" }, children: [] },
    },
    state: {},
  },
  status: "published",
})`}
        />

        <h4 className="mt-4 text-[13px] font-semibold">Update template</h4>
        <CodeBlock
          language="typescript"
          code={`await client.updateTemplate("tpl_abc123", {
  name: "Updated Invoice",
  status: "published",
})`}
        />

        <h4 className="mt-4 text-[13px] font-semibold">Delete & Duplicate</h4>
        <CodeBlock
          language="typescript"
          code={`await client.deleteTemplate("tpl_abc123")

const copy = await client.duplicateTemplate("tpl_abc123")
// Returns the new template`}
        />
      </DocsSection>

      <DocsSection id="export" title="Spec Export">
        <h4 className="text-[13px] font-semibold">From a saved template</h4>
        <CodeBlock
          language="typescript"
          code={`const result = await client.exportSpec({
  templateId: "tpl_abc123",
  data: {
    invoiceNumber: "INV-001",
    customerName: "Acme Corp",
    items: [
      { description: "Widget", quantity: 10, price: 9.99 },
    ],
  },
})

// result.id   → "gen_xyz789"
// result.spec → { root: {...}, elements: {...}, state: {...} }
// The spec is a json-render compatible JSON object`}
        />

        <h4 className="mt-4 text-[13px] font-semibold">From inline template</h4>
        <CodeBlock
          language="typescript"
          code={`const result = await client.exportSpec({
  template: {
    root: "doc",
    elements: {
      doc: { type: "Document", props: { title: "Quick Doc" }, children: ["page"] },
      page: { type: "Page", props: { size: "A4" }, children: ["text"] },
      text: { type: "Text", props: { text: "Hello, {{name}}!", fontSize: 24 }, children: [] },
    },
    state: {},
  },
  data: { name: "World" },
})`}
        />

        <Callout type="tip">
          The exported spec is a json-render compatible JSON structure that can be
          used directly with any json-render consumer.
        </Callout>
      </DocsSection>

      <DocsSection id="generations-list" title="Export History">
        <CodeBlock
          language="typescript"
          code={`// List recent exports
const exports = await client.listGenerations({ limit: 10, offset: 0 })

// Get a specific export record
const record = await client.getGeneration("gen_xyz789")
// { id, templateId, status, format: "json", createdAt, ... }

// Delete an export record
await client.deleteGeneration("gen_xyz789")`}
        />
      </DocsSection>

      <DocsSection id="usage" title="Usage & Rate Limits">
        <CodeBlock
          language="typescript"
          code={`const usage = await client.getUsage()

console.log(usage.rateLimit.remaining) // 87 requests left this hour
console.log(usage.usage.generationsThisMonth) // 342 specs exported this month`}
        />
      </DocsSection>

      <DocsSection id="errors" title="Error Handling">
        <CodeBlock
          language="typescript"
          code={`import { SpecDesignerClient, SpecDesignerError } from "@pdf-generator/sdk"

try {
  await client.exportSpec({ templateId: "nonexistent" })
} catch (error) {
  if (error instanceof SpecDesignerError) {
    console.error(error.message) // "Template not found"
    console.error(error.code)    // "NOT_FOUND"
    console.error(error.status)  // 404
  }
}`}
        />
        <p>
          <code className="rounded bg-accent px-1.5 py-0.5 text-[12px]">SpecDesignerError</code>{" "}
          extends <code className="rounded bg-accent px-1.5 py-0.5 text-[12px]">Error</code>{" "}
          with additional <code className="text-[12px]">code</code> and{" "}
          <code className="text-[12px]">status</code> properties.
        </p>
      </DocsSection>

      <DocsSection id="types" title="TypeScript Types">
        <p>
          All types are exported from the package:
        </p>
        <CodeBlock
          language="typescript"
          code={`import type {
  Template,
  CreateTemplateInput,
  UpdateTemplateInput,
  Generation,
  ExportInput,
  ExportResult,
  ExportByTemplateId,
  ExportByTemplate,
  SpecDesignerConfig,
  ApiResponse,
  ApiErrorResponse,
  PaginatedResponse,
} from "@pdf-generator/sdk"`}
        />
      </DocsSection>
    </DocsPage>
  )
}
