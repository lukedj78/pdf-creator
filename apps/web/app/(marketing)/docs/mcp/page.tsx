"use client"

import {
  DocsPage,
  DocsSection,
  CodeBlock,
  Callout,
} from "@/components/marketing/docs-components"

export default function McpPage() {
  return (
    <DocsPage
      title="MCP Server"
      description="Manage templates directly from AI agents like Claude, Cursor, Windsurf, and VS Code Copilot."
    >
      <DocsSection id="overview" title="Overview">
        <p className="text-sm text-muted-foreground">
          The MCP (Model Context Protocol) server lets AI agents create, edit, and export templates
          using natural language. Just connect your API key and ask your AI to manage templates for you.
        </p>
        <Callout>
          The MCP server connects to the REST API using your API key. No database credentials or
          server configuration needed.
        </Callout>
      </DocsSection>

      <DocsSection id="setup" title="Setup">
        <p className="text-sm text-muted-foreground">
          Add the server to your AI client configuration. The only required variable is your API key,
          which you can create in the dashboard under Settings &rarr; API Keys.
        </p>

        <h4 className="mt-4 text-[13px] font-semibold">Cursor / Windsurf</h4>
        <p className="text-xs text-muted-foreground mb-2">
          Add to <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">.cursor/mcp.json</code> in your project root.
        </p>
        <CodeBlock
          language="json"
          title="mcp.json"
          code={`{
  "mcpServers": {
    "specdesigner": {
      "command": "npx",
      "args": ["@specdesigner/mcp"],
      "env": {
        "PDFCREATOR_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}`}
        />

        <h4 className="mt-6 text-[13px] font-semibold">Claude Desktop</h4>
        <p className="text-xs text-muted-foreground mb-2">
          Add to <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">~/Library/Application Support/Claude/claude_desktop_config.json</code>
        </p>
        <CodeBlock
          language="json"
          title="claude_desktop_config.json"
          code={`{
  "mcpServers": {
    "specdesigner": {
      "command": "npx",
      "args": ["@specdesigner/mcp"],
      "env": {
        "PDFCREATOR_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}`}
        />

        <h4 className="mt-6 text-[13px] font-semibold">Claude Code CLI</h4>
        <CodeBlock
          language="bash"
          title="Terminal"
          code={`claude mcp add specdesigner -e PDFCREATOR_API_KEY=YOUR_API_KEY -- npx @specdesigner/mcp`}
        />
      </DocsSection>

      <DocsSection id="tools" title="Tools">
        <p className="text-sm text-muted-foreground mb-4">
          The MCP server exposes 11 tools that AI agents can call to manage templates.
        </p>

        <div className="rounded-md border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 text-left">
                <th className="px-3 py-2 font-medium text-xs">Tool</th>
                <th className="px-3 py-2 font-medium text-xs">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {[
                ["list_templates", "Search and list templates by name, description, or status"],
                ["get_template", "Get the full spec of a template with all elements and state"],
                ["create_template", "Create a new empty template with Document > Page structure"],
                ["update_template_info", "Update template name, description, or status"],
                ["delete_template", "Delete a template permanently"],
                ["add_element", "Add an element (Text, Heading, Image, Table, List, View, Row, Column, Spacer, Divider, PageNumber)"],
                ["update_element", "Update properties of an existing element (props are merged)"],
                ["remove_element", "Remove an element from a template"],
                ["move_element", "Move an element to a new position or parent"],
                ["update_state", "Set a value in the template state using JSON Pointer paths"],
                ["export_spec", "Export a template as a json-render compatible JSON spec"],
              ].map(([name, desc]) => (
                <tr key={name}>
                  <td className="px-3 py-2 font-mono text-xs">{name}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DocsSection>

      <DocsSection id="prompts" title="Prompts">
        <p className="text-sm text-muted-foreground mb-4">
          Pre-built prompts that guide the AI agent through complex workflows.
        </p>

        <div className="rounded-md border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 text-left">
                <th className="px-3 py-2 font-medium text-xs">Prompt</th>
                <th className="px-3 py-2 font-medium text-xs">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {[
                ["improve_layout", "Analyze a template and suggest layout, spacing, and typography improvements"],
                ["generate_from_description", "Create a complete template from a text description"],
                ["translate_content", "Translate all text content to another language (preserves data bindings)"],
              ].map(([name, desc]) => (
                <tr key={name}>
                  <td className="px-3 py-2 font-mono text-xs">{name}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DocsSection>

      <DocsSection id="examples" title="Usage Examples">
        <p className="text-sm text-muted-foreground">
          Once connected, you can ask your AI agent in natural language:
        </p>

        <CodeBlock
          language="text"
          title="Example prompts"
          code={`"List all my templates"
"Create a new invoice template with company header, items table, and total"
"Add a Heading element with text 'Invoice #001' to template tpl_abc123"
"Change the font size of element h_1 to 24"
"Set the company name in state to 'Acme Corp'"
"Export template tpl_abc123 as a JSON spec"
"Translate all text in template tpl_abc123 to Italian"`}
        />
      </DocsSection>

      <DocsSection id="resources" title="Resources">
        <p className="text-sm text-muted-foreground mb-4">
          The server also exposes MCP resources for read-only access.
        </p>

        <div className="rounded-md border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 text-left">
                <th className="px-3 py-2 font-medium text-xs">URI</th>
                <th className="px-3 py-2 font-medium text-xs">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {[
                ["pdfcreator://templates", "List all templates in your organization"],
                ["pdfcreator://templates/{id}", "Get the full spec of a template by ID"],
              ].map(([uri, desc]) => (
                <tr key={uri}>
                  <td className="px-3 py-2 font-mono text-xs">{uri}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DocsSection>
    </DocsPage>
  )
}
