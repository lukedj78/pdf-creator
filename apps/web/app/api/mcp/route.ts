import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js"
import { createMcpServer } from "@workspace/mcp/server"
import { recordSyncEvent } from "@/lib/sync"

export async function POST(req: Request) {
  const apiKey = req.headers.get("authorization")?.replace("Bearer ", "")

  if (!apiKey) {
    return new Response("Missing Authorization header", { status: 401 })
  }

  // MCP server connects back to our own REST API
  const baseUrl = `${process.env.BETTER_AUTH_URL ?? "http://localhost:3002"}/api/v1`

  const server = createMcpServer(apiKey, baseUrl, {
    onMutation: ({ templateId, action }) =>
      recordSyncEvent("", templateId, action),
  })
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  })

  await server.connect(transport)

  return transport.handleRequest(req)
}

export async function GET() {
  return new Response("MCP Streamable HTTP endpoint. Use POST to interact.", {
    status: 405,
  })
}

export async function DELETE() {
  return new Response(null, { status: 204 })
}
