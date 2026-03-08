"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { staggerItem } from "@workspace/ui/lib/animation"
import { PageShell } from "@workspace/ui/components/shared/page-shell"
import { PageTitle } from "@workspace/ui/components/shared/page-title"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Copy01Icon,
  CheckmarkCircle01Icon,
  ArrowDown01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons"

const BASE_URL =
  typeof window !== "undefined" ? window.location.origin : "https://your-domain.com"

type Method = "GET" | "POST" | "PUT" | "DELETE"

const methodColors: Record<Method, string> = {
  GET: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  POST: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  PUT: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  DELETE: "bg-red-500/10 text-red-600 dark:text-red-400",
}

interface Endpoint {
  method: Method
  path: string
  summary: string
  description: string
  params?: { name: string; in: "path" | "query" | "body"; type: string; required: boolean; description: string }[]
  requestBody?: string
  responseBody: string
  status: number
  curl?: string
}

const endpoints: Endpoint[] = [
  {
    method: "GET",
    path: "/api/v1/templates",
    summary: "List templates",
    description: "Returns all templates belonging to the organization associated with the API key.",
    responseBody: `{
  "success": true,
  "data": [
    {
      "id": "tpl_abc123",
      "name": "Invoice Standard",
      "description": "Monthly invoice template",
      "status": "published",
      "isPublic": false,
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-01-15T10:30:00.000Z",
      "schema": { ... }
    }
  ]
}`,
    status: 200,
    curl: `curl -X GET ${BASE_URL}/api/v1/templates \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
  },
  {
    method: "POST",
    path: "/api/v1/templates",
    summary: "Create template",
    description: "Creates a new template with the given name, schema, and optional description.",
    params: [
      { name: "name", in: "body", type: "string", required: true, description: "Template name" },
      { name: "description", in: "body", type: "string", required: false, description: "Template description" },
      { name: "schema", in: "body", type: "object", required: true, description: "Template JSON schema with root, elements, and state" },
      { name: "status", in: "body", type: '"draft" | "published"', required: false, description: "Template status (default: draft)" },
    ],
    requestBody: `{
  "name": "Invoice Standard",
  "description": "Monthly invoice template",
  "schema": {
    "root": "doc",
    "elements": {
      "doc": { "type": "Document", "props": { "title": "Invoice Standard" }, "children": ["page"] },
      "page": { "type": "Page", "props": { "size": "A4" }, "children": [] }
    },
    "state": {}
  }
}`,
    responseBody: `{
  "success": true,
  "data": {
    "id": "tpl_abc123",
    "name": "Invoice Standard",
    "status": "draft",
    ...
  }
}`,
    status: 201,
    curl: `curl -X POST ${BASE_URL}/api/v1/templates \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Invoice Standard",
    "schema": {
      "root": "doc",
      "elements": {
        "doc": { "type": "Document", "props": { "title": "Invoice Standard" }, "children": ["page"] },
        "page": { "type": "Page", "props": { "size": "A4" }, "children": [] }
      },
      "state": {}
    }
  }'`,
  },
  {
    method: "GET",
    path: "/api/v1/templates/{id}",
    summary: "Get template",
    description: "Retrieves a single template by ID.",
    params: [
      { name: "id", in: "path", type: "string", required: true, description: "Template ID" },
    ],
    responseBody: `{
  "success": true,
  "data": {
    "id": "tpl_abc123",
    "name": "Invoice Standard",
    "schema": { ... },
    ...
  }
}`,
    status: 200,
    curl: `curl -X GET ${BASE_URL}/api/v1/templates/tpl_abc123 \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
  },
  {
    method: "PUT",
    path: "/api/v1/templates/{id}",
    summary: "Update template",
    description: "Updates a template. All fields are optional — only provided fields are updated.",
    params: [
      { name: "id", in: "path", type: "string", required: true, description: "Template ID" },
      { name: "name", in: "body", type: "string", required: false, description: "New template name" },
      { name: "description", in: "body", type: "string", required: false, description: "New description" },
      { name: "schema", in: "body", type: "object", required: false, description: "Updated template schema" },
      { name: "status", in: "body", type: '"draft" | "published"', required: false, description: "Template status" },
      { name: "isPublic", in: "body", type: "boolean", required: false, description: "Public visibility" },
    ],
    requestBody: `{
  "name": "Invoice Pro",
  "status": "published"
}`,
    responseBody: `{
  "success": true,
  "data": {
    "id": "tpl_abc123",
    "name": "Invoice Pro",
    "status": "published",
    ...
  }
}`,
    status: 200,
    curl: `curl -X PUT ${BASE_URL}/api/v1/templates/tpl_abc123 \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "name": "Invoice Pro", "status": "published" }'`,
  },
  {
    method: "DELETE",
    path: "/api/v1/templates/{id}",
    summary: "Delete template",
    description: "Permanently deletes a template and all associated exports.",
    params: [
      { name: "id", in: "path", type: "string", required: true, description: "Template ID" },
    ],
    responseBody: `{
  "success": true,
  "data": { "deleted": true }
}`,
    status: 200,
    curl: `curl -X DELETE ${BASE_URL}/api/v1/templates/tpl_abc123 \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
  },
  {
    method: "POST",
    path: "/api/v1/templates/{id}/duplicate",
    summary: "Duplicate template",
    description: "Creates a copy of a template. The new template is always created with status 'draft'.",
    params: [
      { name: "id", in: "path", type: "string", required: true, description: "Template ID to duplicate" },
    ],
    responseBody: `{
  "success": true,
  "data": {
    "id": "tpl_xyz789",
    "name": "Invoice Standard (copy)",
    "status": "draft",
    ...
  }
}`,
    status: 201,
    curl: `curl -X POST ${BASE_URL}/api/v1/templates/tpl_abc123/duplicate \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
  },
  {
    method: "POST",
    path: "/api/v1/generate",
    summary: "Export JSON Spec",
    description: "Exports a json-render compatible JSON spec from a template. You can reference an existing template by ID or provide a template schema inline. Optionally pass a callbackUrl for async webhook notification.",
    params: [
      { name: "templateId", in: "body", type: "string", required: false, description: "ID of an existing template (required if template not provided)" },
      { name: "template", in: "body", type: "object", required: false, description: "Inline template schema (required if templateId not provided)" },
      { name: "data", in: "body", type: "object", required: false, description: "Data bindings for {{variable}} placeholders in the template" },
      { name: "callbackUrl", in: "body", type: "string", required: false, description: "URL to receive a webhook POST when the export completes or fails" },
    ],
    requestBody: `{
  "templateId": "tpl_abc123",
  "data": {
    "client": { "name": "Acme Corp", "email": "billing@acme.com" },
    "invoice": { "number": "INV-001", "total": "$1,250.00" }
  },
  "callbackUrl": "https://your-app.com/webhooks/export"
}`,
    responseBody: `{
  "success": true,
  "data": {
    "id": "gen_abc123",
    "spec": {
      "root": { ... },
      "elements": { ... },
      "state": { ... }
    }
  }
}`,
    status: 200,
    curl: `curl -X POST ${BASE_URL}/api/v1/generate \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "templateId": "tpl_abc123",
    "data": { "client": { "name": "Acme Corp" } }
  }'`,
  },
  {
    method: "GET",
    path: "/api/v1/generations",
    summary: "List exports",
    description: "Returns a paginated list of all export records for the organization.",
    params: [
      { name: "limit", in: "query", type: "number", required: false, description: "Number of records to return (default: 20, max: 100)" },
      { name: "offset", in: "query", type: "number", required: false, description: "Number of records to skip (default: 0)" },
    ],
    responseBody: `{
  "success": true,
  "data": [
    {
      "id": "gen_abc123",
      "templateId": "tpl_abc123",
      "status": "completed",
      "format": "json",
      "createdAt": "2025-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 42,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}`,
    status: 200,
    curl: `curl -X GET "${BASE_URL}/api/v1/generations?limit=10&offset=0" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
  },
  {
    method: "GET",
    path: "/api/v1/generations/{id}",
    summary: "Get export",
    description: "Retrieves a single export record by ID.",
    params: [
      { name: "id", in: "path", type: "string", required: true, description: "Generation ID" },
    ],
    responseBody: `{
  "success": true,
  "data": {
    "id": "gen_abc123",
    "templateId": "tpl_abc123",
    "status": "completed",
    "format": "json",
    "data": { ... },
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
}`,
    status: 200,
    curl: `curl -X GET ${BASE_URL}/api/v1/generations/gen_abc123 \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
  },
  {
    method: "DELETE",
    path: "/api/v1/generations/{id}",
    summary: "Delete export",
    description: "Permanently deletes an export record by ID.",
    params: [
      { name: "id", in: "path", type: "string", required: true, description: "Generation ID" },
    ],
    responseBody: `{
  "success": true,
  "data": { "deleted": true }
}`,
    status: 200,
    curl: `curl -X DELETE ${BASE_URL}/api/v1/generations/gen_abc123 \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
  },
  {
    method: "GET",
    path: "/api/v1/usage",
    summary: "Get usage & rate limits",
    description: "Returns current rate limit status and usage statistics for the API key.",
    responseBody: `{
  "success": true,
  "data": {
    "rateLimit": {
      "limit": 100,
      "remaining": 87,
      "window": "1h"
    },
    "usage": {
      "generationsThisMonth": 156,
      "periodStart": "2025-01-01T00:00:00.000Z"
    }
  }
}`,
    status: 200,
    curl: `curl -X GET ${BASE_URL}/api/v1/usage \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
  },
]

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button variant="ghost" size="icon-xs" onClick={handleCopy} className="shrink-0">
      <HugeiconsIcon
        icon={copied ? CheckmarkCircle01Icon : Copy01Icon}
        size={14}
      />
    </Button>
  )
}

function EndpointCard({ endpoint }: { endpoint: Endpoint }) {
  const [open, setOpen] = useState(false)

  return (
    <motion.div
      className="rounded-lg border overflow-hidden"
      variants={staggerItem}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
      >
        <span
          className={`inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-bold font-mono min-w-[52px] ${methodColors[endpoint.method]}`}
        >
          {endpoint.method}
        </span>
        <code className="text-sm font-mono flex-1 truncate">
          {endpoint.path}
        </code>
        <span className="text-sm text-muted-foreground hidden sm:block">
          {endpoint.summary}
        </span>
        <HugeiconsIcon
          icon={open ? ArrowDown01Icon : ArrowRight01Icon}
          size={16}
          className="text-muted-foreground shrink-0"
        />
      </button>

      {open && (
        <div className="border-t px-4 py-4 space-y-4 bg-muted/20">
          <p className="text-sm text-muted-foreground">{endpoint.description}</p>

          {/* Parameters */}
          {endpoint.params && endpoint.params.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                Parameters
              </h4>
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 text-left">
                      <th className="px-3 py-2 font-medium text-xs">Name</th>
                      <th className="px-3 py-2 font-medium text-xs">In</th>
                      <th className="px-3 py-2 font-medium text-xs">Type</th>
                      <th className="px-3 py-2 font-medium text-xs hidden sm:table-cell">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {endpoint.params.map((p) => (
                      <tr key={p.name}>
                        <td className="px-3 py-2 font-mono text-xs">
                          {p.name}
                          {p.required && <span className="text-red-500 ml-0.5">*</span>}
                        </td>
                        <td className="px-3 py-2">
                          <Badge variant="outline" className="text-[10px]">
                            {p.in}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                          {p.type}
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground hidden sm:table-cell">
                          {p.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Request Body */}
          {endpoint.requestBody && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                  Request Body
                </h4>
                <CopyButton text={endpoint.requestBody} />
              </div>
              <pre className="bg-muted rounded-lg p-3 text-xs font-mono overflow-x-auto whitespace-pre">
                {endpoint.requestBody}
              </pre>
            </div>
          )}

          {/* Response */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                Response{" "}
                <Badge variant="outline" className="ml-1.5 text-[10px]">
                  {endpoint.status}
                </Badge>
              </h4>
              <CopyButton text={endpoint.responseBody} />
            </div>
            <pre className="bg-muted rounded-lg p-3 text-xs font-mono overflow-x-auto whitespace-pre">
              {endpoint.responseBody}
            </pre>
          </div>

          {/* cURL */}
          {endpoint.curl && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                  cURL Example
                </h4>
                <CopyButton text={endpoint.curl} />
              </div>
              <pre className="bg-muted rounded-lg p-3 text-xs font-mono overflow-x-auto whitespace-pre">
                {endpoint.curl}
              </pre>
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}

export default function DocsPage() {
  return (
    <PageShell>
      <PageTitle
        title="API Reference"
        subtitle="REST API documentation for programmatic access to templates and spec exports."
      />

      {/* Auth info */}
      <motion.div
        className="rounded-lg border p-4 space-y-3"
        variants={staggerItem}
      >
        <h3 className="text-sm font-medium">Authentication</h3>
        <p className="text-sm text-muted-foreground">
          All API requests require an API key sent via the <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">Authorization</code> header.
        </p>
        <div className="flex items-center gap-2">
          <pre className="bg-muted rounded-lg p-3 text-xs font-mono flex-1 overflow-x-auto">
            Authorization: Bearer YOUR_API_KEY
          </pre>
          <CopyButton text="Authorization: Bearer YOUR_API_KEY" />
        </div>
        <p className="text-xs text-muted-foreground">
          Rate limit: <strong>100 requests/hour</strong> per API key. Exceeding the limit returns <code className="bg-muted px-1 py-0.5 rounded text-[10px] font-mono">429 Too Many Requests</code>.
        </p>
      </motion.div>

      {/* Base URL */}
      <motion.div
        className="rounded-lg border p-4 space-y-2"
        variants={staggerItem}
      >
        <h3 className="text-sm font-medium">Base URL</h3>
        <div className="flex items-center gap-2">
          <pre className="bg-muted rounded-lg p-3 text-xs font-mono flex-1">
            {BASE_URL}
          </pre>
          <CopyButton text={BASE_URL} />
        </div>
      </motion.div>

      {/* Error format */}
      <motion.div
        className="rounded-lg border p-4 space-y-3"
        variants={staggerItem}
      >
        <h3 className="text-sm font-medium">Error Responses</h3>
        <p className="text-sm text-muted-foreground">
          All errors follow a consistent format with standard HTTP status codes.
        </p>
        <pre className="bg-muted rounded-lg p-3 text-xs font-mono overflow-x-auto whitespace-pre">{`{
  "success": false,
  "error": {
    "message": "Template not found",
    "code": "NOT_FOUND"
  }
}`}</pre>
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="outline">400 Bad Request</Badge>
          <Badge variant="outline">401 Unauthorized</Badge>
          <Badge variant="outline">404 Not Found</Badge>
          <Badge variant="outline">429 Rate Limited</Badge>
          <Badge variant="outline">500 Server Error</Badge>
        </div>
      </motion.div>

      {/* Templates section */}
      <motion.div className="space-y-3" variants={staggerItem}>
        <h2 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">
          Templates
        </h2>
        {endpoints
          .filter((e) => e.path.startsWith("/api/v1/templates"))
          .map((e) => (
            <EndpointCard key={`${e.method}-${e.path}`} endpoint={e} />
          ))}
      </motion.div>

      {/* Export Spec section */}
      <motion.div className="space-y-3" variants={staggerItem}>
        <h2 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">
          Export Spec
        </h2>
        {endpoints
          .filter((e) => e.path === "/api/v1/generate")
          .map((e) => (
            <EndpointCard key={`${e.method}-${e.path}`} endpoint={e} />
          ))}
      </motion.div>

      {/* Exports section */}
      <motion.div className="space-y-3" variants={staggerItem}>
        <h2 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">
          Exports
        </h2>
        {endpoints
          .filter((e) => e.path.startsWith("/api/v1/generations"))
          .map((e) => (
            <EndpointCard key={`${e.method}-${e.path}`} endpoint={e} />
          ))}
      </motion.div>

      {/* Usage section */}
      <motion.div className="space-y-3" variants={staggerItem}>
        <h2 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">
          Usage & Rate Limits
        </h2>
        {endpoints
          .filter((e) => e.path === "/api/v1/usage")
          .map((e) => (
            <EndpointCard key={`${e.method}-${e.path}`} endpoint={e} />
          ))}
      </motion.div>

    </PageShell>
  )
}
