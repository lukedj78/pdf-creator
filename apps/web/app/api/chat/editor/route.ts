import {
  streamText,
  tool,
  convertToModelMessages,
  stepCountIs,
  createUIMessageStream,
  createUIMessageStreamResponse,
} from "ai"
import { gateway } from "@ai-sdk/gateway"
import { z } from "zod"
import { auth } from "@workspace/auth"
import { headers } from "next/headers"
import { db as database } from "@workspace/db"
import { checkAiCredits, trackAiUsage } from "@workspace/api/lib/polar"
import { getOrgPlan } from "@workspace/api/lib/quota"
import {
  createEmptyTemplate,
  addElement as addElementToTemplate,
  updateElement as updateElementInTemplate,
  removeElement as removeElementFromTemplate,
  getPageElementId,
  updateState as updateTemplateState,
} from "@workspace/template-engine/utils"
import type { Template, ElementType } from "@workspace/template-engine/schema"

const SYSTEM_PROMPT = `You are a senior document designer AI embedded in a visual template editor. You create beautiful, professional JSON spec templates compatible with @json-render/react-pdf.

## Design Standards
You produce **premium, print-ready** documents. Every template must feel like it was designed by a professional graphic designer:
- **Typography hierarchy**: Clear size/weight contrasts. Titles: bold, 20-28pt. Headings: bold, 16-20pt. Subheadings: semibold, 12-14pt. Body: normal, 10-11pt. Labels: bold, 9-10pt. Captions/fine print: 8-9pt. Always set explicit fontSize, color, fontWeight on every Text element.
- **Neutral color palette**: Black (#1a1a1a) for headings, dark gray (#333333) for body, medium gray (#666666) for secondary text, light gray (#999999) for captions. Accent sparingly with one muted tone if appropriate.
- **Whitespace**: Generous page margins (40-50pt). Consistent spacing between sections (Spacer height 16-28). Padding inside containers (12-16pt). Let the content breathe.
- **Alignment**: Left-align body text. Right-align numbers and monetary amounts. Center sparingly, only for standalone titles.
- **Dividers**: Subtle thin lines (#e0e0e0, thickness 1) to separate sections. Avoid heavy borders.
- **Tables**: Clean and minimal — light header background (#f5f5f5), subtle borderColor (#e0e0e0), no heavy borders. Set explicit column widths for alignment.
- **Data binding**: Use $state expressions for all dynamic content. Always populate state with realistic, complete sample data so the preview looks real.
- **Completeness**: Every document must be thorough. Include all sections a real-world document of that type would have. Add page numbers when appropriate.

## Template Structure
Flat element map with Document > Page as root:
- **Document**: top-level wrapper (props: title, author, subject)
- **Page**: a page (props: size, orientation, marginTop/Right/Bottom/Left, backgroundColor)
- Content elements are children of Page.

**IMPORTANT — Structured Grouping**: Always organize elements into logical groups using **View**, **Row**, and **Column** containers. This is critical for both layout control and the tree view hierarchy:
- Wrap related content in a **View** (e.g., "header-section", "bill-to-section", "totals-section"). This makes the document tree navigable and maintainable.
- Use **Row** to place elements side by side (e.g., logo + company info, label + value pairs, two-column layouts).
- Use **Column** inside Row to create multi-column sections with flexible widths (use the \`flex\` prop).
- **Never** place all elements as flat children of Page. Group them semantically: a header group, a content group, a footer group, etc.
- Give elements meaningful IDs that reflect their purpose (e.g., "header", "company-info", "invoice-details", "items-table", "totals-section", "footer-note").

Example structure:
\`\`\`
Page
├── header (Row) — logo + title side by side
│   ├── company-info (View)
│   └── invoice-info (View)
├── divider-1
├── bill-to-section (View)
├── items-table (Table)
├── totals-section (View)
│   ├── subtotal-row (Row)
│   ├── tax-row (Row)
│   └── total-row (Row)
└── footer-note
\`\`\`

## Element Types (PascalCase)
- **Text**: (props: text, fontSize, color, align, fontWeight "normal"|"bold", fontStyle "normal"|"italic", lineHeight)
- **Heading**: (props: text, level "h1"|"h2"|"h3"|"h4", color, align)
- **Image**: (props: src, width, height, objectFit "contain"|"cover"|"fill"|"none")
- **Link**: (props: text, href, fontSize, color)
- **Table**: (props: columns [{header, width?, align?}], rows [string[]], headerBackgroundColor, headerTextColor, borderColor, fontSize, striped)
- **List**: (props: items [string], ordered, fontSize, color, spacing)
- **View**: semantic container — use to group related elements (props: padding, backgroundColor, borderWidth, borderColor, borderRadius, flex, alignItems, justifyContent)
- **Row**: horizontal flex — use for side-by-side layouts (props: gap, alignItems, justifyContent, padding, wrap)
- **Column**: flex column within Row — use flex prop for proportional widths (props: gap, flex, padding, alignItems, justifyContent)
- **Spacer**: vertical spacing (props: height)
- **Divider**: horizontal line (props: color, thickness, marginTop, marginBottom)
- **PageNumber**: (props: format, fontSize, color, align)

## Data Binding
- \`{ "$state": "/path/to/value" }\` — resolve from template state (JSON Pointer)
- \`{ "$template": "Hello \${/user/name}!" }\` — string interpolation with state values

## Rules
1. Use tools to make changes — never output raw JSON.
2. Elements are added to the Page by default. Use parentId for nesting inside Row/Column/View.
3. No separate styles — all visual properties are element props.
4. Table rows are \`string[][]\`, not objects.
5. Heading level is a string: "h1", "h2", "h3", "h4".
6. When creating from scratch: createTemplate → batchUpdateState (sample data) → batchAddElements (content).
7. Always respond in the same language the user writes in.
8. Be concise — focus on tool calls, minimal explanation.
9. Reference existing elements by their IDs when modifying.
10. Use saveTemplate only when the user explicitly asks to save.
11. **Prefer batch tools**: batchUpdateState over multiple updateState, batchAddElements over multiple addElement. Group elements logically by section.
12. Plan the full document structure before starting tool calls. Think about all sections needed, then execute efficiently.`

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return new Response("Unauthorized", { status: 401 })
  }

  // Check AI quota
  const orgId = session.session.activeOrganizationId
  if (orgId) {
    const plan = await getOrgPlan(database, orgId)
    if (plan !== "enterprise") {
      const credits = await checkAiCredits(session.user.id)
      if (!credits.allowed) {
        const message = plan === "free"
          ? "AI trial credits exhausted (10/month). Upgrade to Pro for 500/month."
          : "AI credits exhausted. Buy a credit pack or wait for next billing cycle."
        return new Response(JSON.stringify({ error: message }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        })
      }
    }
  }

  const body = await req.json()
  const { messages: uiMessages, template: clientTemplate, templateId } = body

  // Mutable template that tools modify in-place during multi-step
  let currentTemplate: Template = clientTemplate
    ? (clientTemplate as Template)
    : createEmptyTemplate("Untitled")

  const modelMessages = await convertToModelMessages(uiMessages)

  // Use createUIMessageStream so we can write custom data parts
  // (template updates) alongside the AI stream
  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const result = streamText({
        model: gateway("anthropic/claude-sonnet-4"),
        system: SYSTEM_PROMPT,
        messages: modelMessages,
        stopWhen: stepCountIs(100),
        prepareStep: () => {
          const templateJson = JSON.stringify(currentTemplate, null, 2)
          return {
            system: SYSTEM_PROMPT + `\n\n## Current Template State\n\`\`\`json\n${templateJson}\n\`\`\``,
          }
        },
        tools: {
          createTemplate: tool({
            description: "Create a new empty template with Document > Page structure. After this, use batchUpdateState to set sample data, then batchAddElements to add content.",
            inputSchema: z.object({
              name: z.string().describe("Template name"),
              pageSize: z.enum(["A4", "A3", "A5", "LETTER", "LEGAL", "TABLOID"]).default("A4"),
              orientation: z.enum(["portrait", "landscape"]).default("portrait"),
              marginTop: z.number().default(40),
              marginRight: z.number().default(40),
              marginBottom: z.number().default(40),
              marginLeft: z.number().default(40),
            }),
            execute: async (input) => {
              currentTemplate = createEmptyTemplate(input.name)
              const pageId = getPageElementId(currentTemplate)
              if (pageId) {
                const pageProps: Record<string, unknown> = {}
                if (input.pageSize) pageProps.size = input.pageSize
                if (input.orientation) pageProps.orientation = input.orientation
                if (input.marginTop) pageProps.marginTop = input.marginTop
                if (input.marginRight) pageProps.marginRight = input.marginRight
                if (input.marginBottom) pageProps.marginBottom = input.marginBottom
                if (input.marginLeft) pageProps.marginLeft = input.marginLeft
                currentTemplate = updateElementInTemplate(currentTemplate, pageId, { props: pageProps })
              }
              return { action: "templateUpdate" as const, success: true }
            },
          }),

          batchUpdateState: tool({
            description: "Set multiple state values at once. Much more efficient than calling updateState multiple times. Use this to populate all sample data in one step.",
            inputSchema: z.object({
              entries: z.array(z.object({
                pointer: z.string().describe("JSON Pointer path, e.g. /company/name"),
                value: z.unknown().describe("Value to set"),
              })).describe("Array of {pointer, value} entries to set"),
            }),
            execute: async (input) => {
              for (const entry of input.entries) {
                currentTemplate = updateTemplateState(currentTemplate, entry.pointer, entry.value)
              }
              return { action: "templateUpdate" as const, success: true }
            },
          }),

          batchAddElements: tool({
            description: "Add multiple elements in one call. Elements are processed in order — use $parentRef to reference an element added earlier in the same batch by its index (e.g., \"$0\" references the first element's generated ID, \"$1\" the second, etc.).",
            inputSchema: z.object({
              elements: z.array(z.object({
                type: z.enum([
                  "Text", "Heading", "Image", "Link",
                  "Table", "List",
                  "View", "Row", "Column",
                  "Spacer", "Divider", "PageNumber",
                ]).describe("Element type (PascalCase)"),
                props: z.record(z.unknown()).describe("Element properties"),
                parentId: z.string().optional().describe("Parent element ID, or $N to reference element added at index N in this batch"),
              })).describe("Array of elements to add in order"),
            }),
            execute: async (input) => {
              const generatedIds: string[] = []
              for (const el of input.elements) {
                let parentId = el.parentId
                if (parentId && parentId.startsWith("$")) {
                  const refIndex = parseInt(parentId.slice(1), 10)
                  if (!isNaN(refIndex) && refIndex < generatedIds.length) {
                    parentId = generatedIds[refIndex]
                  }
                }
                const { template: newT, elementId } = addElementToTemplate(
                  currentTemplate,
                  el.type as ElementType,
                  el.props,
                  { parentId }
                )
                currentTemplate = newT
                generatedIds.push(elementId)
              }
              return { action: "templateUpdate" as const, success: true, elementIds: generatedIds }
            },
          }),

          addElement: tool({
            description: "Add a single element. Prefer batchAddElements for adding multiple elements. Use parentId to nest inside Row/Column/View.",
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
            execute: async (input) => {
              const { template: newT, elementId } = addElementToTemplate(
                currentTemplate,
                input.type as ElementType,
                input.props,
                { parentId: input.parentId }
              )
              currentTemplate = newT
              return { action: "templateUpdate" as const, success: true, elementId }
            },
          }),

          updateElement: tool({
            description: "Update properties of an existing element. Props are merged with existing ones.",
            inputSchema: z.object({
              elementId: z.string().describe("ID of the element to update"),
              props: z.record(z.unknown()).describe("Properties to merge"),
            }),
            execute: async (input) => {
              currentTemplate = updateElementInTemplate(currentTemplate, input.elementId, {
                props: input.props,
              })
              return { action: "templateUpdate" as const, success: true }
            },
          }),

          removeElement: tool({
            description: "Remove an element from the template",
            inputSchema: z.object({
              elementId: z.string().describe("ID of the element to remove"),
            }),
            execute: async (input) => {
              currentTemplate = removeElementFromTemplate(currentTemplate, input.elementId)
              return { action: "templateUpdate" as const, success: true }
            },
          }),

          setPageSettings: tool({
            description: "Update page settings (size, orientation, margins).",
            inputSchema: z.object({
              size: z.enum(["A4", "A3", "A5", "LETTER", "LEGAL", "TABLOID"]).optional(),
              orientation: z.enum(["portrait", "landscape"]).optional(),
              marginTop: z.number().optional(),
              marginRight: z.number().optional(),
              marginBottom: z.number().optional(),
              marginLeft: z.number().optional(),
              backgroundColor: z.string().optional(),
            }),
            execute: async (input) => {
              const pageId = getPageElementId(currentTemplate)
              if (pageId) {
                currentTemplate = updateElementInTemplate(currentTemplate, pageId, { props: input })
              }
              return { action: "templateUpdate" as const, success: true }
            },
          }),

          updateState: tool({
            description: "Add or update a single state value. Prefer batchUpdateState for multiple values.",
            inputSchema: z.object({
              pointer: z.string().describe("JSON Pointer path, e.g. /company/name"),
              value: z.unknown().describe("Value to set"),
            }),
            execute: async (input) => {
              currentTemplate = updateTemplateState(currentTemplate, input.pointer, input.value)
              return { action: "templateUpdate" as const, success: true }
            },
          }),

          saveTemplate: tool({
            description: "Save the current template to the database. Use this when the user asks to save.",
            inputSchema: z.object({
              reason: z.string().optional().describe("Brief reason for saving"),
            }),
            execute: async (input) => ({
              action: "saveTemplate" as const,
              success: true,
              reason: input.reason,
              templateId: templateId ?? null,
            }),
          }),
        },
        onFinish: ({ usage: aiUsage }) => {
          // Track AI usage in Polar
          if (orgId) {
            trackAiUsage({
              userId: session.user.id,
              organizationId: orgId,
              type: "editor",
              totalTokens: aiUsage?.totalTokens,
            })
          }
        },
        onStepFinish: ({ finishReason, toolCalls }) => {
          console.log("[editor-chat] step:", { finishReason, tools: toolCalls?.length ?? 0, elements: Object.keys(currentTemplate.elements).length })

          // Send template to client via data part (NOT in tool results, so it
          // won't bloat the model's conversation context)
          writer.write({
            type: "data-template-update" as `data-${string}`,
            data: currentTemplate,
          })
        },
      })

      // Merge the AI stream into our custom stream
      writer.merge(result.toUIMessageStream())
    },
  })

  return createUIMessageStreamResponse({ stream })
}
