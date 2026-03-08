# MCP Server — PDF Creator

Connect your AI agent (Claude Desktop, Cursor, Claude Code, Windsurf, VS Code) to PDF Creator and manage templates directly from your IDE.

## Quick Start

### 1. Get your API key

Go to **Dashboard → Settings → API Keys → Create New Key** and copy the key.

### 2. Configure your AI agent

#### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "pdfcreator": {
      "command": "npx",
      "args": ["@pdfcreator/mcp"],
      "env": {
        "PDFCREATOR_API_KEY": "sk_live_your_key_here"
      }
    }
  }
}
```

Restart Claude Desktop.

#### Claude Code

```bash
claude mcp add pdfcreator -e PDFCREATOR_API_KEY=sk_live_your_key_here -- npx @pdfcreator/mcp
```

#### Cursor

Create `.cursor/mcp.json` in your project root:

```json
{
  "mcpServers": {
    "pdfcreator": {
      "command": "npx",
      "args": ["@pdfcreator/mcp"],
      "env": {
        "PDFCREATOR_API_KEY": "sk_live_your_key_here"
      }
    }
  }
}
```

#### Windsurf

Create `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "pdfcreator": {
      "command": "npx",
      "args": ["@pdfcreator/mcp"],
      "env": {
        "PDFCREATOR_API_KEY": "sk_live_your_key_here"
      }
    }
  }
}
```

#### VS Code (Copilot)

Add to your VS Code settings (`.vscode/settings.json`):

```json
{
  "mcp": {
    "servers": {
      "pdfcreator": {
        "command": "npx",
        "args": ["@pdfcreator/mcp"],
        "env": {
          "PDFCREATOR_API_KEY": "sk_live_your_key_here"
        }
      }
    }
  }
}
```

### 3. Start using it

Once configured, you can talk to your AI agent naturally:

- *"Show me my templates"*
- *"Create a professional invoice template"*
- *"Add a footer with page numbers to the Invoice template"*
- *"Change the heading font size to 24 in the Report template"*
- *"Export the Invoice spec as JSON"*

---

## Available Tools

| Tool | Description |
|------|-------------|
| `list_templates` | Search and list templates by name, description, or status |
| `get_template` | Get the full spec of a template with all elements and state |
| `create_template` | Create a new empty template (Document > Page structure) |
| `update_template_info` | Update name, description, or status (draft/published) |
| `delete_template` | Delete a template permanently |
| `add_element` | Add an element to a template (Text, Heading, Table, etc.) |
| `update_element` | Update properties of an existing element |
| `remove_element` | Remove an element from a template |
| `update_state` | Set a value in the template state (for data binding) |
| `export_spec` | Export a json-render compatible JSON spec |

### Element Types

Elements you can add with `add_element`:

| Type | Key Props |
|------|-----------|
| `Text` | text, fontSize, color, align, fontWeight, fontStyle |
| `Heading` | text, level (h1-h4), color, align |
| `Image` | src, width, height |
| `Table` | columns [{header, width?, align?}], rows [string[]] |
| `List` | items [string], ordered |
| `Row` | gap, alignItems, justifyContent |
| `Column` | flex, gap, padding |
| `View` | padding, backgroundColor, borderWidth, borderColor, borderRadius |
| `Spacer` | height |
| `Divider` | color, thickness |
| `Link` | text, href, fontSize, color |
| `PageNumber` | format, fontSize, align |

### Data Binding

Templates support dynamic content via state expressions:

```
"text": { "$state": "/company/name" }         → resolves from state
"text": { "$template": "Hello ${/user/name}" } → string interpolation
```

Use `update_state` to set values:
- `update_state(templateId, "/company/name", "Acme Srl")`
- `update_state(templateId, "/items", [{ name: "Widget", price: 10 }])`

---

## Available Prompts

Prompts are pre-built workflows you can invoke from your AI agent.

| Prompt | Description | Arguments |
|--------|-------------|-----------|
| `improve_layout` | Analyze a template and apply layout improvements | templateId |
| `generate_from_description` | Create a complete template from a text description | description, pageSize |
| `translate_content` | Translate all text content to another language | templateId, language |

---

## HTTP Transport

For programmatic access or remote MCP clients, use the HTTP endpoint:

```
POST /api/mcp
Authorization: Bearer sk_live_your_key_here
Content-Type: application/json
```

This uses the MCP Streamable HTTP transport protocol.

---

## Example Conversations

### Create a template from scratch

```
You: Create an invoice template with company logo, billing details,
     a product table, and a total section at the bottom.

Agent: I'll create that for you.
       [creates template, adds elements, sets sample data]

       Done! Template "Invoice" created with:
       - Header with logo placeholder and company info
       - Billing details section (Row with 2 columns)
       - Product table (Item, Qty, Price, Total)
       - Divider + Total amount in bold

       View it in the editor: /dashboard/editor?id=tmpl_abc123
```

### Modify an existing template

```
You: Show me my templates

Agent: You have 3 templates:
       1. Invoice (published) - 14 elements
       2. Report (draft) - 8 elements
       3. Contract (draft) - 22 elements

You: In the Report, change the heading to "Q1 2026 Report"
     and add a table with columns Quarter, Revenue, Growth

Agent: [updates heading, adds table]
       Done. Updated the heading and added the data table.
```

### Bulk operations

```
You: Publish all my draft templates

Agent: [updates Invoice, Contract to published]
       Done. 2 templates moved from draft to published.
```

### Export for use with @json-render/react-pdf

```
You: Export the Invoice template as JSON

Agent: Here's the spec:
       {
         "root": "doc_1",
         "elements": { ... },
         "state": { ... }
       }

       Use it with @json-render/react-pdf or send it to the
       POST /api/v1/generate endpoint.
```
