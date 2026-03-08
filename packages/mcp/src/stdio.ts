#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { createMcpServer } from "./server.js"

const apiKey = process.env.PDFCREATOR_API_KEY
const baseUrl = process.env.PDFCREATOR_URL ?? "https://specdesigner.com/api/v1"

if (!apiKey) {
  console.error("Error: PDFCREATOR_API_KEY environment variable is required.")
  console.error("")
  console.error("Get your API key from the dashboard: Settings → API Keys")
  console.error("Then set it: export PDFCREATOR_API_KEY=sk_live_...")
  process.exit(1)
}

const server = createMcpServer(apiKey, baseUrl)
const transport = new StdioServerTransport()

await server.connect(transport)
