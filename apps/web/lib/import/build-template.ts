import { z } from "zod"
import { createEmptyTemplate } from "@workspace/template-engine/utils"
import type { Template, Element } from "@workspace/template-engine/schema"

// Schema for AI output — simpler than our internal format.
// Children reference by index in the array (easier for AI).
// We transform this into our flat Template structure after.
export const aiElementSchema = z.object({
  type: z.enum([
    "Text", "Heading", "Image", "Table", "List",
    "View", "Row", "Column", "Spacer", "Divider",
    "PageNumber", "Link",
  ]),
  props: z.record(z.unknown()).describe("Element properties matching the type"),
  children: z
    .array(z.number())
    .optional()
    .describe("Indices of child elements in the elements array (for Row, Column, View containers only)"),
})

export const aiPageSchema = z.object({
  pageSettings: z.object({
    size: z.enum(["A4", "A3", "A5", "LETTER", "LEGAL", "TABLOID"]).default("A4"),
    orientation: z.enum(["portrait", "landscape"]).default("portrait"),
    marginTop: z.number().default(40),
    marginRight: z.number().default(40),
    marginBottom: z.number().default(40),
    marginLeft: z.number().default(40),
  }),
  elements: z.array(aiElementSchema).describe("Flat list of content elements for this page in document order"),
})

export const importResultSchema = z.object({
  name: z.string().describe("Document name derived from its content"),
  pages: z.array(aiPageSchema).min(1).describe("One entry per page in the document"),
  state: z.record(z.unknown()).optional().describe("Sample data for dynamic fields"),
})

export type ImportResult = z.infer<typeof importResultSchema>
export type AiPage = z.infer<typeof aiPageSchema>

function generateId(): string {
  return Math.random().toString(36).substring(2, 10)
}

/**
 * Build elements for a single page and return { pageId, entries }.
 */
function buildPageElements(
  page: AiPage,
): { pageId: string; entries: Record<string, Element> } {
  const pageId = generateId()
  const entries: Record<string, Element> = {}

  // Generate IDs for all AI elements in this page
  const idMap: string[] = page.elements.map(() => generateId())

  // Create element entries
  for (let i = 0; i < page.elements.length; i++) {
    const aiEl = page.elements[i]!
    const id = idMap[i]!
    const childIds = (aiEl.children ?? []).map((idx) => idMap[idx]!)

    entries[id] = {
      type: aiEl.type,
      props: aiEl.props,
      children: childIds,
    }
  }

  // Find top-level elements (not referenced as children of any other element)
  const allChildIndices = new Set<number>()
  for (const aiEl of page.elements) {
    for (const childIdx of aiEl.children ?? []) {
      allChildIndices.add(childIdx)
    }
  }
  const topLevelIds = idMap.filter((_, i) => !allChildIndices.has(i))

  // Create the Page element
  entries[pageId] = {
    type: "Page",
    props: { ...page.pageSettings },
    children: topLevelIds,
  }

  return { pageId, entries }
}

/**
 * Transform AI output (multi-page, index-based children) into our flat Template structure.
 */
export function buildTemplate(result: ImportResult): Template {
  const base = createEmptyTemplate(result.name)
  const docElement = base.elements[base.root]!

  // Remove the default empty page created by createEmptyTemplate
  const defaultPageId = docElement.children[0]!
  delete base.elements[defaultPageId]

  // Build each page
  const pageIds: string[] = []
  for (const page of result.pages) {
    const { pageId, entries } = buildPageElements(page)
    pageIds.push(pageId)
    Object.assign(base.elements, entries)
  }

  // Set Document children to all pages
  base.elements[base.root] = {
    ...docElement,
    children: pageIds,
  }

  // Set state if provided
  if (result.state) {
    base.state = result.state
  }

  return base
}
