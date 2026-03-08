import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  addElement,
  removeElement,
  updateElement,
  moveElement,
  updateState,
  createEmptyTemplate,
  getPageElementId,
} from "@workspace/template-engine/utils"
import { templateSchema, toSpec } from "@workspace/template-engine/schema"
import type { ElementType } from "@workspace/template-engine/schema"
import { ApiClient } from "./api-client"

// ---------------------------------------------------------------------------
// Helper: load template from API and parse with Zod
// ---------------------------------------------------------------------------

async function loadTemplate(api: ApiClient, id: string) {
  const row = await api.getTemplate(id)
  if (!row) throw new Error(`Template not found: ${id}`)

  return templateSchema.parse({
    id: row.id,
    name: row.name,
    ...(row.schema as Record<string, unknown>),
  })
}

async function saveTemplate(
  api: ApiClient,
  id: string,
  name: string,
  template: { root: string; elements: Record<string, unknown>; state: Record<string, unknown>; version: number; meta: Record<string, unknown> },
) {
  const { root, elements, state, version, meta } = template
  await api.updateTemplate(id, {
    name,
    schema: { root, elements, state, version, meta } as Record<string, unknown>,
  })
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type McpMutationEvent = {
  templateId: string
  action: string
}

export type McpServerOptions = {
  onMutation?: (event: McpMutationEvent) => void | Promise<void>
}

// ---------------------------------------------------------------------------
// Create the MCP server
// ---------------------------------------------------------------------------

export function createMcpServer(apiKey: string, baseUrl: string, options: McpServerOptions = {}) {
  const server = new McpServer({
    name: "pdfcreator",
    version: "0.1.0",
  })

  const api = new ApiClient(baseUrl, apiKey)

  async function notifyMutation(templateId: string, action: string) {
    if (options.onMutation) {
      await options.onMutation({ templateId, action })
    }
  }

  // -------------------------------------------------------------------------
  // Resources
  // -------------------------------------------------------------------------

  server.resource(
    "templates",
    "pdfcreator://templates",
    {
      description: "List all templates in your organization",
    },
    async () => {
      const result = await api.listTemplates()
      const items = result.items.map((t) => ({
        id: t.id,
        name: t.name,
        status: t.status,
        description: t.description,
        updatedAt: t.updatedAt,
      }))
      return {
        contents: [
          {
            uri: "pdfcreator://templates",
            mimeType: "application/json",
            text: JSON.stringify(items, null, 2),
          },
        ],
      }
    },
  )

  server.resource(
    "template",
    "pdfcreator://templates/{id}",
    {
      description: "Get the full spec of a template by ID",
    },
    async (uri) => {
      const id = uri.pathname.split("/").pop()!
      const template = await loadTemplate(api, id)
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(template, null, 2),
          },
        ],
      }
    },
  )

  // -------------------------------------------------------------------------
  // Tools
  // -------------------------------------------------------------------------

  server.tool(
    "list_templates",
    "Search and list templates. Returns id, name, status, description.",
    {
      search: z.string().optional().describe("Search by name or description"),
      status: z.enum(["draft", "published"]).optional().describe("Filter by status"),
    },
    async ({ search, status }) => {
      const result = await api.listTemplates({ search, status })
      const items = result.items.map((t) => ({
        id: t.id,
        name: t.name,
        status: t.status,
        description: t.description,
        elementCount: t.schema ? Object.keys((t.schema as Record<string, unknown>).elements ?? {}).length : 0,
      }))
      return {
        content: [{ type: "text", text: JSON.stringify(items, null, 2) }],
      }
    },
  )

  server.tool(
    "get_template",
    "Get the full spec of a template. Returns the complete structure with all elements, props, and state.",
    {
      templateId: z.string().describe("Template ID"),
    },
    async ({ templateId }) => {
      const template = await loadTemplate(api, templateId)
      return {
        content: [{ type: "text", text: JSON.stringify(template, null, 2) }],
      }
    },
  )

  server.tool(
    "create_template",
    "Create a new empty template with Document > Page structure. Returns the template ID and URL.",
    {
      name: z.string().describe("Template name"),
      pageSize: z.enum(["A4", "A3", "A5", "LETTER", "LEGAL", "TABLOID"]).default("A4"),
      orientation: z.enum(["portrait", "landscape"]).default("portrait"),
    },
    async ({ name, pageSize, orientation }) => {
      const template = createEmptyTemplate(name)
      const pageId = getPageElementId(template)!
      template.elements[pageId] = {
        ...template.elements[pageId]!,
        props: { ...template.elements[pageId]!.props, size: pageSize, orientation },
      }

      const { id: _id, ...schema } = template
      const created = await api.createTemplate({
        name,
        schema: schema as Record<string, unknown>,
      })

      await notifyMutation(created.id, "create_template")

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              id: created.id,
              name,
              message: `Template "${name}" created successfully.`,
            }),
          },
        ],
      }
    },
  )

  server.tool(
    "update_template_info",
    "Update template name, description, or status.",
    {
      templateId: z.string().describe("Template ID"),
      name: z.string().optional().describe("New name"),
      description: z.string().optional().describe("New description"),
      status: z.enum(["draft", "published"]).optional().describe("New status"),
    },
    async ({ templateId, name, description, status }) => {
      await api.updateTemplate(templateId, { name, description, status })
      await notifyMutation(templateId, "update_template_info")
      return {
        content: [{ type: "text", text: `Template ${templateId} updated.` }],
      }
    },
  )

  server.tool(
    "add_element",
    `Add an element to a template. Element types: Text, Heading, Image, Link, Table, List, View, Row, Column, Spacer, Divider, PageNumber.
Props vary by type:
- Text: { text, fontSize, color, align, fontWeight, fontStyle }
- Heading: { text, level "h1"|"h2"|"h3"|"h4", color, align }
- Image: { src, width, height }
- Table: { columns: [{header, width?, align?}], rows: [string[]] }
- List: { items: [string], ordered }
- Row: { gap, alignItems, justifyContent } — children added via parentId
- Column: { flex, gap, padding } — children added via parentId
- View: { padding, backgroundColor, borderWidth, borderColor, borderRadius }
- Spacer: { height }
- Divider: { color, thickness }
- PageNumber: { format, fontSize, align }
Elements are added to the Page by default. Use parentId to nest inside Row, Column, or View.`,
    {
      templateId: z.string().describe("Template ID"),
      type: z.enum([
        "Text", "Heading", "Image", "Link",
        "Table", "List",
        "View", "Row", "Column",
        "Spacer", "Divider", "PageNumber",
      ]).describe("Element type"),
      props: z.record(z.unknown()).default({}).describe("Element properties"),
      parentId: z.string().optional().describe("Parent element ID (for nesting inside Row/Column/View)"),
      index: z.number().int().min(0).optional().describe("Insert at this index in parent children (default: append at end)"),
    },
    async ({ templateId, type, props, parentId, index }) => {
      const template = await loadTemplate(api, templateId)

      const { template: updated, elementId } = addElement(
        template,
        type as ElementType,
        props,
        { parentId, index },
      )

      await saveTemplate(api, templateId, updated.name, updated)
      await notifyMutation(templateId, "add_element")

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              elementId,
              type,
              message: `Added ${type} element (${elementId}).`,
            }),
          },
        ],
      }
    },
  )

  server.tool(
    "update_element",
    "Update properties of an existing element. Props are merged with existing ones.",
    {
      templateId: z.string().describe("Template ID"),
      elementId: z.string().describe("Element ID to update"),
      props: z.record(z.unknown()).describe("Properties to merge"),
    },
    async ({ templateId, elementId, props }) => {
      const template = await loadTemplate(api, templateId)

      if (!template.elements[elementId]) {
        return { content: [{ type: "text", text: `Element ${elementId} not found.` }], isError: true }
      }

      const updated = updateElement(template, elementId, { props })
      await saveTemplate(api, templateId, updated.name, updated)
      await notifyMutation(templateId, "update_element")

      return {
        content: [{ type: "text", text: `Element ${elementId} updated.` }],
      }
    },
  )

  server.tool(
    "remove_element",
    "Remove an element from a template.",
    {
      templateId: z.string().describe("Template ID"),
      elementId: z.string().describe("Element ID to remove"),
    },
    async ({ templateId, elementId }) => {
      const template = await loadTemplate(api, templateId)

      if (!template.elements[elementId]) {
        return { content: [{ type: "text", text: `Element ${elementId} not found.` }], isError: true }
      }

      const updated = removeElement(template, elementId)
      await saveTemplate(api, templateId, updated.name, updated)
      await notifyMutation(templateId, "remove_element")

      return {
        content: [{ type: "text", text: `Element ${elementId} removed.` }],
      }
    },
  )

  server.tool(
    "move_element",
    "Move an element to a new position (same or different parent). Use index to specify position in the parent's children list.",
    {
      templateId: z.string().describe("Template ID"),
      elementId: z.string().describe("Element ID to move"),
      parentId: z.string().optional().describe("Parent element ID (default: page)"),
      index: z.number().int().min(0).describe("Index in parent's children (0 = first)"),
    },
    async ({ templateId, elementId, parentId, index }) => {
      const template = await loadTemplate(api, templateId)
      if (!template.elements[elementId]) {
        return { content: [{ type: "text", text: `Element ${elementId} not found.` }], isError: true }
      }
      const targetParentId = parentId ?? getPageElementId(template)
      if (!targetParentId || !template.elements[targetParentId]) {
        return { content: [{ type: "text", text: "Parent not found." }], isError: true }
      }
      const updated = moveElement(template, elementId, targetParentId, index)
      await saveTemplate(api, templateId, updated.name, updated)
      await notifyMutation(templateId, "move_element")
      return {
        content: [{ type: "text", text: `Element ${elementId} moved to index ${index}.` }],
      }
    },
  )

  server.tool(
    "update_state",
    "Set a value in the template state. Use JSON Pointer paths (e.g. /company/name). State values are referenced by elements via $state expressions.",
    {
      templateId: z.string().describe("Template ID"),
      pointer: z.string().describe("JSON Pointer path, e.g. /company/name"),
      value: z.unknown().describe("Value to set"),
    },
    async ({ templateId, pointer, value }) => {
      const template = await loadTemplate(api, templateId)
      const updated = updateState(template, pointer, value)
      await saveTemplate(api, templateId, updated.name, updated)
      await notifyMutation(templateId, "update_state")

      return {
        content: [{ type: "text", text: `State ${pointer} set to ${JSON.stringify(value)}.` }],
      }
    },
  )

  server.tool(
    "export_spec",
    "Export a template as a json-render compatible JSON spec. Optionally merge data into the state before export.",
    {
      templateId: z.string().describe("Template ID"),
      data: z.record(z.unknown()).optional().describe("Data to merge into state before export"),
    },
    async ({ templateId, data }) => {
      let template = await loadTemplate(api, templateId)

      // Merge data into state
      if (data) {
        for (const [key, value] of Object.entries(data)) {
          template = updateState(template, `/${key}`, value)
        }
      }

      const spec = toSpec(template)
      return {
        content: [{ type: "text", text: JSON.stringify(spec, null, 2) }],
      }
    },
  )

  server.tool(
    "delete_template",
    "Delete a template permanently.",
    {
      templateId: z.string().describe("Template ID"),
    },
    async ({ templateId }) => {
      await api.deleteTemplate(templateId)
      await notifyMutation(templateId, "delete_template")
      return {
        content: [{ type: "text", text: `Template ${templateId} deleted.` }],
      }
    },
  )

  // -------------------------------------------------------------------------
  // Prompts
  // -------------------------------------------------------------------------

  server.prompt(
    "improve_layout",
    "Analyze a template and suggest layout improvements",
    {
      templateId: z.string().describe("Template ID to analyze"),
    },
    async ({ templateId }) => {
      const template = await loadTemplate(api, templateId)
      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `Analyze this template and suggest improvements to the layout, spacing, typography, and visual hierarchy. Use the available tools to apply your suggestions.

Template "${template.name}":
${JSON.stringify(template, null, 2)}`,
            },
          },
        ],
      }
    },
  )

  server.prompt(
    "generate_from_description",
    "Create a complete template from a text description",
    {
      description: z.string().describe("Description of the document to create"),
      pageSize: z.enum(["A4", "A3", "A5", "LETTER", "LEGAL"]).default("A4"),
    },
    async ({ description, pageSize }) => {
      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `Create a complete PDF template based on this description. Use the create_template tool first, then add all necessary elements with add_element, and set sample data with update_state.

Page size: ${pageSize}

Description:
${description}

Use a professional layout with proper spacing, headings, and visual hierarchy.`,
            },
          },
        ],
      }
    },
  )

  server.prompt(
    "translate_content",
    "Translate all text content in a template to another language",
    {
      templateId: z.string().describe("Template ID"),
      language: z.string().describe("Target language (e.g. English, Italian, Spanish)"),
    },
    async ({ templateId, language }) => {
      const template = await loadTemplate(api, templateId)
      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `Translate all text content in this template to ${language}. Use update_element to change each text element. Keep data-bound expressions ($state, $template) unchanged — only translate static text.

Template "${template.name}":
${JSON.stringify(template, null, 2)}`,
            },
          },
        ],
      }
    },
  )

  return server
}
