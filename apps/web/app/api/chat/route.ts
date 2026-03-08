import { streamText, tool, convertToModelMessages, stepCountIs } from "ai"
import { gateway } from "@ai-sdk/gateway"
import { z } from "zod"
import { auth } from "@workspace/auth"
import { headers } from "next/headers"
import { db } from "@workspace/db"
import { chatMessages } from "@workspace/db/schema"

const SYSTEM_PROMPT = `You are an AI assistant that helps users design JSON spec templates compatible with @json-render/react-pdf.

## Template Structure
Templates use a flat element map with Document > Page as root structure:
- **Document**: top-level wrapper (props: title, author, subject)
- **Page**: a page (props: size, orientation, marginTop/Right/Bottom/Left, backgroundColor)
- Content elements are children of Page.

## Element Types (PascalCase)
- **Text**: text content (props: text, fontSize, color, align, fontWeight "normal"|"bold", fontStyle "normal"|"italic", lineHeight)
- **Heading**: headings (props: text, level "h1"|"h2"|"h3"|"h4", color, align)
- **Image**: images (props: src, width, height, objectFit "contain"|"cover"|"fill"|"none")
- **Link**: hyperlinks (props: text, href, fontSize, color)
- **Table**: data tables (props: columns [{header, width?, align?}], rows [string[]], headerBackgroundColor, headerTextColor, borderColor, fontSize, striped)
- **List**: bullet/numbered lists (props: items [string], ordered, fontSize, color, spacing)
- **View**: generic container (props: padding, backgroundColor, borderWidth, borderColor, borderRadius, flex, alignItems, justifyContent)
- **Row**: horizontal flex layout (props: gap, alignItems, justifyContent, padding, wrap)
- **Column**: flex column within a row (props: gap, flex, padding, alignItems, justifyContent)
- **Spacer**: vertical spacing (props: height)
- **Divider**: horizontal line (props: color, thickness, marginTop, marginBottom)
- **PageNumber**: page numbers (props: format, fontSize, color, align)

## Data Binding
Use expression objects for dynamic content:
- \`{ "$state": "/path/to/value" }\` — resolve value from template state (JSON Pointer)
- \`{ "$template": "Hello \${/user/name}!" }\` — string interpolation with state values

## Rules
1. Use the provided tools to make changes — do NOT output JSON directly.
2. Elements are added as children of the Page (no need to specify parentId unless nesting inside Row/Column/View).
3. There are NO separate styles — all visual properties are element props.
4. Table rows are \`string[][]\` (array of arrays), NOT objects.
5. Heading level is a string: "h1", "h2", "h3", "h4".
6. When creating a template, use createTemplate. Then add elements with addElement.
7. For data-bound content, set the \`text\` prop to an expression object like \`{ "$state": "/company/name" }\` and add sample data to state with updateState.
8. Always respond in the same language the user writes in.
9. Explain what you're doing concisely. Suggest improvements when appropriate.`

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return new Response("Unauthorized", { status: 401 })
  }

  const body = await req.json()
  const { messages: uiMessages, sessionId } = body

  // Save user message to DB
  const lastMessage = uiMessages[uiMessages.length - 1]
  if (lastMessage?.role === "user" && sessionId) {
    const textContent = lastMessage.parts
      ?.filter((p: { type: string }) => p.type === "text")
      .map((p: { text: string }) => p.text)
      .join("") ?? lastMessage.content ?? ""

    await db.insert(chatMessages).values({
      sessionId,
      role: "user",
      content: textContent,
    })
  }

  const modelMessages = await convertToModelMessages(uiMessages)

  const result = streamText({
    model: gateway("anthropic/claude-sonnet-4"),
    system: SYSTEM_PROMPT,
    messages: modelMessages,
    stopWhen: stepCountIs(15),
    tools: {
      createTemplate: tool({
        description: "Create a new template with Document > Page structure. Always call this first.",
        inputSchema: z.object({
          name: z.string().describe("Template name"),
          pageSize: z.enum(["A4", "A3", "A5", "LETTER", "LEGAL", "TABLOID"]).default("A4"),
          orientation: z.enum(["portrait", "landscape"]).default("portrait"),
          marginTop: z.number().default(40),
          marginRight: z.number().default(40),
          marginBottom: z.number().default(40),
          marginLeft: z.number().default(40),
        }),
        execute: async (input) => ({
          action: "createTemplate" as const,
          template: {
            name: input.name,
            pageSize: input.pageSize,
            orientation: input.orientation,
            marginTop: input.marginTop,
            marginRight: input.marginRight,
            marginBottom: input.marginBottom,
            marginLeft: input.marginLeft,
          },
        }),
      }),

      addElement: tool({
        description: "Add an element to the template. Elements are added to the Page by default. Use parentId to nest inside Row, Column, or View.",
        inputSchema: z.object({
          type: z.enum([
            "Text", "Heading", "Image", "Link",
            "Table", "List",
            "View", "Row", "Column",
            "Spacer", "Divider", "PageNumber",
          ]).describe("Element type (PascalCase)"),
          props: z.record(z.unknown()).describe("Element properties"),
          parentId: z.string().optional().describe("Parent element ID for nesting inside Row/Column/View"),
        }),
        execute: async (input) => ({
          action: "addElement" as const,
          type: input.type,
          props: input.props,
          parentId: input.parentId,
        }),
      }),

      updateElement: tool({
        description: "Update properties of an existing element. Props are merged with existing ones.",
        inputSchema: z.object({
          elementId: z.string().describe("ID of the element to update"),
          props: z.record(z.unknown()).describe("Properties to merge"),
        }),
        execute: async (input) => ({
          action: "updateElement" as const,
          elementId: input.elementId,
          props: input.props,
        }),
      }),

      removeElement: tool({
        description: "Remove an element from the template",
        inputSchema: z.object({
          elementId: z.string().describe("ID of the element to remove"),
        }),
        execute: async (input) => ({
          action: "removeElement" as const,
          elementId: input.elementId,
        }),
      }),

      setPageSettings: tool({
        description: "Update page settings (size, orientation, margins). Updates the Page element props.",
        inputSchema: z.object({
          size: z.enum(["A4", "A3", "A5", "LETTER", "LEGAL", "TABLOID"]).optional(),
          orientation: z.enum(["portrait", "landscape"]).optional(),
          marginTop: z.number().optional(),
          marginRight: z.number().optional(),
          marginBottom: z.number().optional(),
          marginLeft: z.number().optional(),
          backgroundColor: z.string().optional(),
        }),
        execute: async (input) => ({
          action: "setPageSettings" as const,
          settings: input,
        }),
      }),

      updateState: tool({
        description: "Add or update a value in the template state. Use JSON Pointer paths (e.g. /company/name). This data is used with $state expressions.",
        inputSchema: z.object({
          pointer: z.string().describe("JSON Pointer path, e.g. /company/name"),
          value: z.unknown().describe("Value to set"),
        }),
        execute: async (input) => ({
          action: "updateState" as const,
          pointer: input.pointer,
          value: input.value,
        }),
      }),

      saveTemplate: tool({
        description: "Save the current template as a persistent template in the database. Use when the user asks to save, or when they want to open it in the editor.",
        inputSchema: z.object({
          reason: z.string().optional().describe("Brief reason for saving"),
        }),
        execute: async (input) => ({
          action: "saveTemplate" as const,
          reason: input.reason,
        }),
      }),
    },
    onFinish: async ({ text }) => {
      if (sessionId && text) {
        await db.insert(chatMessages).values({
          sessionId,
          role: "assistant",
          content: text,
        })
      }
    },
  })

  return result.toUIMessageStreamResponse()
}
