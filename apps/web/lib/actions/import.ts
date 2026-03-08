"use server"

import { generateObject } from "ai"
import { gateway } from "@ai-sdk/gateway"
import { auth } from "@workspace/auth"
import { headers } from "next/headers"
import { importResultSchema, buildTemplate } from "@/lib/import/build-template"
import type { Template } from "@workspace/template-engine/schema"

const IMPORT_MODEL = "anthropic/claude-sonnet-4"

const IMPORT_PROMPT = `You are an expert at analyzing documents and converting them into structured JSON specs.

Analyze the provided document image/PDF and extract its layout as a list of elements.

## Element Types
- **Heading**: headings (props: text, level "h1"|"h2"|"h3"|"h4", color, align)
- **Text**: text content (props: text, fontSize, color, align, fontWeight "normal"|"bold", fontStyle "normal"|"italic", lineHeight)
- **Image**: images/logos (props: src "", width, height) — leave src empty, set approximate dimensions
- **Table**: data tables (props: columns [{header, width?, align?}], rows [string[]], headerBackgroundColor, headerTextColor, borderColor, fontSize, striped)
- **List**: bullet/numbered lists (props: items [string], ordered, fontSize, color)
- **View**: generic container with background/border (props: padding, backgroundColor, borderWidth, borderColor, borderRadius)
- **Row**: horizontal layout (props: gap, alignItems, justifyContent) — children are indices of Column/View elements
- **Column**: flex column within a Row (props: flex, gap, padding) — children are indices of content elements
- **Spacer**: vertical spacing (props: height)
- **Divider**: horizontal line (props: color, thickness, marginTop, marginBottom)
- **Link**: hyperlinks (props: text, href, fontSize, color)
- **PageNumber**: page numbers (props: format "{pageNumber} / {totalPages}", fontSize, align)

## Rules
1. Reproduce the document layout as faithfully as possible.
2. Use Row + Column for multi-column layouts.
3. Use View for sections with background colors or borders.
4. Extract ALL text content exactly as it appears.
5. For tables, extract all headers and rows.
6. Set realistic fontSize values (body: 10-12, h1: 24-28, h2: 18-22, h3: 14-16).
7. The \`children\` field on Row/Column/View should contain the indices of their child elements **within the same page's elements array**.
8. Top-level elements (not nested inside any container) should NOT appear as children of any other element.
9. Detect page size and orientation from the document proportions.
10. Keep colors as hex values when visible.
11. For multi-page documents, create one entry in the \`pages\` array per page. Each page has its own elements array with independent indices starting from 0.
12. Single-page documents should still have one entry in \`pages\`.`

const MEDIA_TYPE_MAP: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
}

function inferMediaType(url: string): string {
  const pathname = new URL(url).pathname.toLowerCase()
  for (const [ext, type] of Object.entries(MEDIA_TYPE_MAP)) {
    if (pathname.endsWith(ext)) return type
  }
  return "application/pdf"
}

type ImportResponse =
  | { success: true; template: Template }
  | { success: false; error: string }

/**
 * Call AI Gateway to analyze a document and return a Template.
 * Accepts either base64 data or a direct URL (the model fetches the URL itself).
 */
async function analyzeDocument(
  file: { type: "data"; data: string; mediaType: string } | { type: "url"; url: string },
): Promise<ImportResponse> {
  try {
    const filePart = file.type === "url"
      ? { type: "file" as const, data: new URL(file.url), mediaType: inferMediaType(file.url) }
      : { type: "file" as const, data: file.data, mediaType: file.mediaType }

    const { object } = await generateObject({
      model: gateway(IMPORT_MODEL),
      schema: importResultSchema,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: IMPORT_PROMPT },
            filePart,
          ],
        },
      ],
    })

    const template = buildTemplate(object)
    return { success: true, template }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Import failed"
    return { success: false, error: message }
  }
}

/**
 * Import from a public URL — passes the URL directly to the AI model (no download).
 */
export async function importFromUrl(input: {
  url: string
}): Promise<ImportResponse> {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return { success: false, error: "Unauthorized" }
  }

  return analyzeDocument({ type: "url", url: input.url })
}

/**
 * Import from a file upload (base64).
 */
export async function importFromFile(input: {
  fileBase64: string
  mimeType: string
}): Promise<ImportResponse> {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return { success: false, error: "Unauthorized" }
  }

  return analyzeDocument({ type: "data", data: input.fileBase64, mediaType: input.mimeType })
}
