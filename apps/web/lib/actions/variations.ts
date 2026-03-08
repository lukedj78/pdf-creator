"use server"

import { generateObject } from "ai"
import { gateway } from "@ai-sdk/gateway"
import { auth } from "@workspace/auth"
import { headers } from "next/headers"
import { z } from "zod"
import type { Template, Element } from "@workspace/template-engine/schema"

const VARIATION_MODEL = "anthropic/claude-sonnet-4"

const variationScopes = ["layout", "colors", "typography", "content", "all"] as const
export type VariationScope = (typeof variationScopes)[number]

// Schema for a single variation — partial element props
const variationSchema = z.object({
  label: z.string().describe("Short label for this variation, e.g. 'Bold & Dark' or 'Compact Layout'"),
  props: z.record(z.unknown()).describe("Updated element props for this variation"),
})

const variationsResultSchema = z.object({
  variations: z.array(variationSchema).min(1).max(4),
})

function buildPrompt(
  element: Element,
  scope: VariationScope,
  context: { templateName: string; siblingTypes: string[] },
): string {
  const scopeInstructions: Record<VariationScope, string> = {
    layout: "Focus on layout changes: spacing, padding, alignment, flex properties, gap. Do NOT change colors or typography.",
    colors: "Focus on color changes: text color, background color, border color, accent colors. Do NOT change layout or font sizes.",
    typography: "Focus on typography: fontSize, fontWeight, fontStyle, text alignment, line height. Do NOT change colors or layout.",
    content: "Focus on content alternatives: rewrite text with different wording/tone, restructure table data, change list items. Keep styling similar.",
    all: "Vary everything: layout, colors, typography, and content. Create distinctly different visual approaches.",
  }

  return `You are a senior document designer. Generate 3-4 design variations for the following element.

## Context
- Template: "${context.templateName}"
- Element type: ${element.type}
- Sibling elements: ${context.siblingTypes.join(", ") || "none"}
- Current props: ${JSON.stringify(element.props, null, 2)}

## Scope
${scopeInstructions[scope]}

## Rules
- Each variation must be visually distinct from the others and from the original
- Keep the element type the same (${element.type})
- Return valid props for this element type
- Use professional, print-ready design choices
- For text: use neutral colors (#1a1a1a, #333, #666, #999) unless scope is "colors"
- For layout containers (Row, Column, View): adjust gap, padding, alignment, flex
- For Table: you can change column widths, alignment, header styles, striping
- Give each variation a short descriptive label (2-4 words)
- Return between 3 and 4 variations`
}

type VariationsResponse =
  | { success: true; variations: Array<{ label: string; props: Record<string, unknown> }> }
  | { success: false; error: string }

export async function generateVariations(
  template: Template,
  elementId: string,
  scope: VariationScope,
): Promise<VariationsResponse> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return { success: false, error: "Not authenticated" }
  }

  const element = template.elements[elementId]
  if (!element) {
    return { success: false, error: "Element not found" }
  }

  // Find parent to get sibling context
  let siblingTypes: string[] = []
  for (const el of Object.values(template.elements)) {
    if (el.children.includes(elementId)) {
      siblingTypes = el.children
        .filter((id) => id !== elementId)
        .map((id) => template.elements[id]?.type ?? "Unknown")
      break
    }
  }

  const prompt = buildPrompt(element, scope, {
    templateName: template.name,
    siblingTypes,
  })

  try {
    const { object } = await generateObject({
      model: gateway(VARIATION_MODEL),
      schema: variationsResultSchema,
      prompt,
    })

    return {
      success: true,
      variations: object.variations.map((v) => ({
        label: v.label,
        // Merge with original props so we don't lose required fields
        props: { ...element.props, ...v.props },
      })),
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to generate variations",
    }
  }
}
