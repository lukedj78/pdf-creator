"use client"

import {
  DocsPage,
  DocsSection,
  CodeBlock,
  EndpointCard,
  ParamTable,
  Callout,
} from "@/components/marketing/docs-components"

export default function ApiReferencePage() {
  return (
    <DocsPage
      title="REST API Reference"
      description="All endpoints use the base URL /api/v1 and require Bearer token authentication."
    >
      {/* Authentication */}
      <DocsSection id="authentication" title="Authentication">
        <p>
          All API requests require an API key passed as a Bearer token in the{" "}
          <code className="rounded bg-accent px-1.5 py-0.5 text-[12px]">
            Authorization
          </code>{" "}
          header.
        </p>
        <CodeBlock
          code={`Authorization: Bearer your_api_key_here`}
          language="http"
          title="Header"
        />
        <p>
          Create API keys from{" "}
          <code className="rounded bg-accent px-1.5 py-0.5 text-[12px]">
            Dashboard &rarr; API Keys
          </code>
          . Keys are shown only once at creation — store them securely.
        </p>
        <Callout type="info">
          API keys are scoped to your organization. All resources created via API
          belong to the organization that owns the key.
        </Callout>
      </DocsSection>

      {/* Templates */}
      <DocsSection id="templates" title="Templates">
        <div className="space-y-4">
          <EndpointCard
            method="GET"
            path="/api/v1/templates"
            description="List all templates in your organization."
          >
            <ParamTable
              params={[
                { name: "search", type: "string", description: "Filter by name (optional)" },
                { name: "status", type: '"draft" | "published"', description: "Filter by status (optional)" },
                { name: "limit", type: "number", description: "Results per page (default: 20)" },
                { name: "offset", type: "number", description: "Pagination offset (default: 0)" },
              ]}
            />
            <CodeBlock
              title="Response"
              language="json"
              code={`{
  "success": true,
  "data": [
    {
      "id": "tpl_abc123",
      "name": "Invoice Template",
      "description": "Standard invoice layout",
      "status": "published",
      "isPublic": false,
      "createdAt": "2025-01-15T10:00:00Z",
      "updatedAt": "2025-01-15T10:00:00Z"
    }
  ]
}`}
            />
          </EndpointCard>

          <EndpointCard
            method="POST"
            path="/api/v1/templates"
            description="Create a new template."
          >
            <ParamTable
              params={[
                { name: "name", type: "string", required: true, description: "Template name" },
                { name: "description", type: "string", description: "Optional description" },
                { name: "schema", type: "TemplateSchema", required: true, description: "JSON template schema (see Template Schema docs)" },
                { name: "status", type: '"draft" | "published"', description: 'Default: "draft"' },
              ]}
            />
          </EndpointCard>

          <EndpointCard
            method="GET"
            path="/api/v1/templates/:id"
            description="Get a single template by ID."
          />

          <EndpointCard
            method="PUT"
            path="/api/v1/templates/:id"
            description="Update an existing template."
          >
            <ParamTable
              params={[
                { name: "name", type: "string", description: "New name" },
                { name: "description", type: "string", description: "New description" },
                { name: "schema", type: "TemplateSchema", description: "Updated schema" },
                { name: "status", type: '"draft" | "published"', description: "New status" },
                { name: "isPublic", type: "boolean", description: "Make template public" },
              ]}
            />
          </EndpointCard>

          <EndpointCard
            method="DELETE"
            path="/api/v1/templates/:id"
            description="Delete a template permanently."
          />

          <EndpointCard
            method="POST"
            path="/api/v1/templates/:id/duplicate"
            description="Create a copy of an existing template."
          />
        </div>
      </DocsSection>

      {/* Export Spec */}
      <DocsSection id="generate" title="Export Spec">
        <EndpointCard
          method="POST"
          path="/api/v1/generate"
          description="Export a json-render compatible JSON spec from a template with data."
        >
          <p className="mb-3 text-[13px] text-muted-foreground">
            Accepts either a <code className="rounded bg-accent px-1 py-0.5 text-[12px]">templateId</code> to
            use a saved template, or a full <code className="rounded bg-accent px-1 py-0.5 text-[12px]">template</code> object
            for inline export.
          </p>

          <h4 className="mb-2 text-[13px] font-semibold">Option A: By template ID</h4>
          <ParamTable
            params={[
              { name: "templateId", type: "string", required: true, description: "ID of a saved template" },
              { name: "data", type: "object", description: "Data to bind to template variables" },
              { name: "callbackUrl", type: "string", description: "URL to receive a POST when export completes or fails" },
            ]}
          />

          <h4 className="mb-2 mt-4 text-[13px] font-semibold">Option B: Inline template</h4>
          <ParamTable
            params={[
              { name: "template", type: "TemplateSchema", required: true, description: "Full template JSON schema" },
              { name: "data", type: "object", description: "Data to bind to template variables" },
              { name: "callbackUrl", type: "string", description: "URL to receive a POST when export completes or fails" },
            ]}
          />

          <CodeBlock
            title="Request"
            language="json"
            code={`{
  "templateId": "tpl_abc123",
  "data": {
    "invoiceNumber": "INV-001",
    "customerName": "Acme Corp",
    "items": [
      { "description": "Widget", "quantity": 10, "price": 9.99 }
    ]
  }
}`}
          />

          <CodeBlock
            title="Response"
            language="json"
            code={`{
  "success": true,
  "data": {
    "id": "gen_xyz789",
    "spec": {
      "root": { ... },
      "elements": { ... },
      "state": { ... }
    }
  }
}`}
          />

          <Callout type="info">
            The response is a JSON object containing the exported spec. The{" "}
            <code className="text-[12px]">spec</code> field is a json-render
            compatible structure with <code className="text-[12px]">root</code>,{" "}
            <code className="text-[12px]">elements</code>, and{" "}
            <code className="text-[12px]">state</code> properties.
          </Callout>
        </EndpointCard>
      </DocsSection>

      {/* Generations */}
      <DocsSection id="generations" title="Generations">
        <div className="space-y-4">
          <EndpointCard
            method="GET"
            path="/api/v1/generations"
            description="List past spec exports."
          >
            <ParamTable
              params={[
                { name: "limit", type: "number", description: "Results per page (default: 20)" },
                { name: "offset", type: "number", description: "Pagination offset (default: 0)" },
              ]}
            />
            <CodeBlock
              title="Response"
              language="json"
              code={`{
  "success": true,
  "data": [
    {
      "id": "gen_xyz789",
      "templateId": "tpl_abc123",
      "status": "completed",
      "format": "json",
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ]
}`}
            />
          </EndpointCard>

          <EndpointCard
            method="GET"
            path="/api/v1/generations/:id"
            description="Get details of a specific export record."
          />

          <EndpointCard
            method="DELETE"
            path="/api/v1/generations/:id"
            description="Delete an export record permanently."
          />
        </div>
      </DocsSection>

      {/* Usage */}
      <DocsSection id="usage" title="Rate Limiting & Usage">
        <p>
          Every API response includes rate limit headers:
        </p>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-2 pr-4 font-medium">Header</th>
                <th className="pb-2 font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr><td className="py-2 pr-4"><code className="text-[12px]">X-RateLimit-Limit</code></td><td className="py-2 text-muted-foreground">Max requests per window</td></tr>
              <tr><td className="py-2 pr-4"><code className="text-[12px]">X-RateLimit-Remaining</code></td><td className="py-2 text-muted-foreground">Requests remaining in current window</td></tr>
            </tbody>
          </table>
        </div>

        <EndpointCard
          method="GET"
          path="/api/v1/usage"
          description="Check your current rate limit status and monthly export count."
        >
          <CodeBlock
            title="Response"
            language="json"
            code={`{
  "success": true,
  "data": {
    "rateLimit": {
      "limit": 100,
      "remaining": 87,
      "window": "1h"
    },
    "usage": {
      "generationsThisMonth": 342,
      "periodStart": "2025-01-01T00:00:00.000Z"
    }
  }
}`}
          />
        </EndpointCard>
      </DocsSection>

      {/* Errors */}
      <DocsSection id="errors" title="Error Handling">
        <p>
          All errors return a consistent JSON structure:
        </p>
        <CodeBlock
          language="json"
          title="Error Response"
          code={`{
  "success": false,
  "error": {
    "message": "Template not found",
    "code": "NOT_FOUND"
  }
}`}
        />
        <h4 className="mt-4 text-[13px] font-semibold">HTTP Status Codes</h4>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 font-medium">Meaning</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr><td className="py-2 pr-4"><code>200</code></td><td className="py-2 text-muted-foreground">Success</td></tr>
              <tr><td className="py-2 pr-4"><code>400</code></td><td className="py-2 text-muted-foreground">Bad request — invalid input</td></tr>
              <tr><td className="py-2 pr-4"><code>401</code></td><td className="py-2 text-muted-foreground">Unauthorized — missing or invalid API key</td></tr>
              <tr><td className="py-2 pr-4"><code>404</code></td><td className="py-2 text-muted-foreground">Resource not found</td></tr>
              <tr><td className="py-2 pr-4"><code>429</code></td><td className="py-2 text-muted-foreground">Rate limit exceeded</td></tr>
              <tr><td className="py-2 pr-4"><code>500</code></td><td className="py-2 text-muted-foreground">Internal server error</td></tr>
            </tbody>
          </table>
        </div>
      </DocsSection>
    </DocsPage>
  )
}
