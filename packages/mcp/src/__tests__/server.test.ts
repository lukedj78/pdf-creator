import { describe, it, expect, vi, beforeAll, afterAll } from "vitest"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js"
import http from "node:http"

// ---------------------------------------------------------------------------
// Mock REST API server
// ---------------------------------------------------------------------------

const mockTemplate = {
  id: "tmpl_test",
  name: "Test Invoice",
  description: "A test template",
  status: "draft",
  schema: {
    root: "doc_1",
    elements: {
      doc_1: { type: "Document", props: {}, children: ["page_1"] },
      page_1: {
        type: "Page",
        props: { size: "A4", orientation: "portrait", marginTop: 40, marginRight: 40, marginBottom: 40, marginLeft: 40 },
        children: ["h_1"],
      },
      h_1: { type: "Heading", props: { text: "Invoice", level: "h1" }, children: [] },
    },
    state: {},
    version: 1,
    meta: {},
  },
}

let mockServer: http.Server
let baseUrl: string

beforeAll(async () => {
  mockServer = http.createServer((req, res) => {
    let body = ""
    req.on("data", (chunk) => (body += chunk))
    req.on("end", () => {
      res.setHeader("Content-Type", "application/json")

      // GET /templates
      if (req.method === "GET" && req.url === "/templates") {
        res.end(JSON.stringify({ success: true, data: { items: [mockTemplate] } }))
        return
      }

      // GET /templates/:id
      if (req.method === "GET" && req.url?.match(/^\/templates\/[\w-]+$/)) {
        res.end(JSON.stringify({ success: true, data: mockTemplate }))
        return
      }

      // POST /templates
      if (req.method === "POST" && req.url === "/templates") {
        const data = JSON.parse(body)
        res.statusCode = 201
        res.end(JSON.stringify({ success: true, data: { id: "tmpl_new", name: data.name } }))
        return
      }

      // PUT /templates/:id
      if (req.method === "PUT" && req.url?.match(/^\/templates\/[\w-]+$/)) {
        res.end(JSON.stringify({ success: true, data: mockTemplate }))
        return
      }

      // DELETE /templates/:id
      if (req.method === "DELETE" && req.url?.match(/^\/templates\/[\w-]+$/)) {
        res.end(JSON.stringify({ success: true, data: { deleted: true } }))
        return
      }

      // POST /generate
      if (req.method === "POST" && req.url === "/generate") {
        res.end(JSON.stringify({ success: true, data: { id: "gen_1", spec: { root: "doc_1", elements: {} } } }))
        return
      }

      res.statusCode = 404
      res.end(JSON.stringify({ success: false, error: { message: "Not found" } }))
    })
  })

  await new Promise<void>((resolve) => {
    mockServer.listen(0, () => {
      const addr = mockServer.address() as { port: number }
      baseUrl = `http://localhost:${addr.port}`
      resolve()
    })
  })
})

afterAll(() => {
  mockServer.close()
})

// Import after setup
import { createMcpServer } from "../server.js"

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

async function createTestClient(options?: { onMutation?: (...args: unknown[]) => void }) {
  const server = createMcpServer("test_key", baseUrl, {
    onMutation: options?.onMutation,
  })
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()

  const client = new Client({
    name: "test-client",
    version: "1.0.0",
  })

  await Promise.all([
    server.connect(serverTransport),
    client.connect(clientTransport),
  ])

  return client
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("MCP Server", () => {
  it("should expose resources", async () => {
    const client = await createTestClient()
    const resources = await client.listResources()
    const uris = resources.resources.map((r) => r.uri)
    expect(uris).toContain("pdfcreator://templates")
  })

  it("should expose all tools", async () => {
    const client = await createTestClient()
    const tools = await client.listTools()
    const names = tools.tools.map((t) => t.name)

    expect(names).toContain("list_templates")
    expect(names).toContain("get_template")
    expect(names).toContain("create_template")
    expect(names).toContain("add_element")
    expect(names).toContain("update_element")
    expect(names).toContain("remove_element")
    expect(names).toContain("update_state")
    expect(names).toContain("export_spec")
    expect(names).toContain("delete_template")
    expect(names).toContain("update_template_info")
  })

  it("should expose all prompts", async () => {
    const client = await createTestClient()
    const prompts = await client.listPrompts()
    const names = prompts.prompts.map((p) => p.name)

    expect(names).toContain("improve_layout")
    expect(names).toContain("generate_from_description")
    expect(names).toContain("translate_content")
  })

  it("should have proper tool input schemas", async () => {
    const client = await createTestClient()
    const tools = await client.listTools()

    const addElement = tools.tools.find((t) => t.name === "add_element")
    expect(addElement).toBeDefined()
    expect(addElement!.description).toContain("Add an element")
    expect(addElement!.inputSchema.properties).toHaveProperty("templateId")
    expect(addElement!.inputSchema.properties).toHaveProperty("type")
    expect(addElement!.inputSchema.properties).toHaveProperty("props")
  })

  it("should have proper prompt arguments", async () => {
    const client = await createTestClient()
    const prompts = await client.listPrompts()

    const improve = prompts.prompts.find((p) => p.name === "improve_layout")
    expect(improve!.arguments!.some((a) => a.name === "templateId")).toBe(true)

    const generate = prompts.prompts.find((p) => p.name === "generate_from_description")
    expect(generate!.arguments!.some((a) => a.name === "description")).toBe(true)

    const translate = prompts.prompts.find((p) => p.name === "translate_content")
    expect(translate!.arguments!.some((a) => a.name === "language")).toBe(true)
  })

  it("should have 10 tools total", async () => {
    const client = await createTestClient()
    const tools = await client.listTools()
    expect(tools.tools.length).toBe(10)
  })

  it("should have 3 prompts total", async () => {
    const client = await createTestClient()
    const prompts = await client.listPrompts()
    expect(prompts.prompts.length).toBe(3)
  })

  it("should call onMutation callback after mutating tools", async () => {
    const onMutation = vi.fn()
    const client = await createTestClient({ onMutation })

    const result = await client.callTool({
      name: "add_element",
      arguments: {
        templateId: "tmpl_test",
        type: "Text",
        props: { text: "Hello" },
      },
    })

    expect(result.isError).toBeFalsy()
    expect(onMutation).toHaveBeenCalledWith({
      templateId: "tmpl_test",
      action: "add_element",
    })
  })

  it("should list templates via list_templates tool", async () => {
    const client = await createTestClient()
    const result = await client.callTool({
      name: "list_templates",
      arguments: {},
    })

    expect(result.isError).toBeFalsy()
    expect(result.content).toBeDefined()
    const content = result.content as Array<{ type: string; text: string }>
    expect(content.length).toBeGreaterThan(0)
  })

  it("should call get_template tool", async () => {
    const client = await createTestClient()
    const result = await client.callTool({
      name: "get_template",
      arguments: { templateId: "tmpl_test" },
    })

    expect(result.content).toBeDefined()
    const content = result.content as Array<{ type: string; text: string }>
    expect(content.length).toBeGreaterThan(0)
  })

  it("should create template via create_template tool", async () => {
    const onMutation = vi.fn()
    const client = await createTestClient({ onMutation })
    const result = await client.callTool({
      name: "create_template",
      arguments: {
        name: "New Template",
        pageSize: "A4",
        orientation: "portrait",
      },
    })

    expect(result.isError).toBeFalsy()
    expect(onMutation).toHaveBeenCalledWith(
      expect.objectContaining({ action: "create_template" })
    )
  })

  it("should update element via update_element tool", async () => {
    const client = await createTestClient()
    const result = await client.callTool({
      name: "update_element",
      arguments: {
        templateId: "tmpl_test",
        elementId: "h_1",
        props: { text: "Updated" },
      },
    })

    expect(result.isError).toBeFalsy()
  })

  it("should handle update_element for non-existent element", async () => {
    const client = await createTestClient()
    const result = await client.callTool({
      name: "update_element",
      arguments: {
        templateId: "tmpl_test",
        elementId: "non_existent_xyz",
        props: { text: "Test" },
      },
    })

    expect(result.isError).toBeTruthy()
  })

  it("should remove element via remove_element tool", async () => {
    const client = await createTestClient()
    const result = await client.callTool({
      name: "remove_element",
      arguments: {
        templateId: "tmpl_test",
        elementId: "h_1",
      },
    })

    expect(result.isError).toBeFalsy()
  })

  it("should handle remove_element for non-existent element", async () => {
    const client = await createTestClient()
    const result = await client.callTool({
      name: "remove_element",
      arguments: {
        templateId: "tmpl_test",
        elementId: "non_existent_xyz",
      },
    })

    expect(result.isError).toBeTruthy()
  })

  it("should update state via update_state tool", async () => {
    const client = await createTestClient()
    const result = await client.callTool({
      name: "update_state",
      arguments: {
        templateId: "tmpl_test",
        pointer: "/company/name",
        value: "New Corp",
      },
    })

    expect(result.isError).toBeFalsy()
    const content = result.content as Array<{ type: string; text: string }>
    expect(content[0]!.text).toContain("/company/name")
  })

  it("should export spec via export_spec tool", async () => {
    const client = await createTestClient()
    const result = await client.callTool({
      name: "export_spec",
      arguments: {
        templateId: "tmpl_test",
      },
    })

    expect(result.isError).toBeFalsy()
    const content = result.content as Array<{ type: string; text: string }>
    const spec = JSON.parse(content[0]!.text)
    expect(spec.root).toBeDefined()
    expect(spec.elements).toBeDefined()
  })

  it("should export spec with data merge", async () => {
    const client = await createTestClient()
    const result = await client.callTool({
      name: "export_spec",
      arguments: {
        templateId: "tmpl_test",
        data: { company: { name: "Merged Corp" } },
      },
    })

    expect(result.isError).toBeFalsy()
  })

  it("should delete template via delete_template tool", async () => {
    const onMutation = vi.fn()
    const client = await createTestClient({ onMutation })
    const result = await client.callTool({
      name: "delete_template",
      arguments: { templateId: "tmpl_test" },
    })

    expect(result.isError).toBeFalsy()
    expect(onMutation).toHaveBeenCalledWith(
      expect.objectContaining({ action: "delete_template" })
    )
  })

  it("should update template info via update_template_info tool", async () => {
    const onMutation = vi.fn()
    const client = await createTestClient({ onMutation })
    const result = await client.callTool({
      name: "update_template_info",
      arguments: {
        templateId: "tmpl_test",
        name: "Updated Name",
        status: "published",
      },
    })

    expect(result.isError).toBeFalsy()
    expect(onMutation).toHaveBeenCalledWith(
      expect.objectContaining({ action: "update_template_info" })
    )
  })

  it("should read templates resource", async () => {
    const client = await createTestClient()
    const result = await client.readResource({
      uri: "pdfcreator://templates",
    })

    expect(result.contents).toBeDefined()
    expect(result.contents.length).toBeGreaterThan(0)
    expect(result.contents[0]!.mimeType).toBe("application/json")
  })

  it("should have proper prompt definitions", async () => {
    const client = await createTestClient()
    const prompts = await client.listPrompts()

    const improve = prompts.prompts.find((p) => p.name === "improve_layout")
    expect(improve!.arguments!.length).toBeGreaterThanOrEqual(1)
    expect(improve!.arguments![0]!.name).toBe("templateId")

    const generate = prompts.prompts.find((p) => p.name === "generate_from_description")
    expect(generate!.arguments!.some((a) => a.name === "description")).toBe(true)
    expect(generate!.arguments!.some((a) => a.name === "pageSize")).toBe(true)

    const translate = prompts.prompts.find((p) => p.name === "translate_content")
    expect(translate!.arguments!.some((a) => a.name === "templateId")).toBe(true)
    expect(translate!.arguments!.some((a) => a.name === "language")).toBe(true)
  })
})
