import { streamObject } from "ai"
import { gateway } from "@ai-sdk/gateway"
import { auth } from "@workspace/auth"
import { headers } from "next/headers"
import { variationsResultSchema } from "@/lib/variations-schema"
import { db } from "@workspace/db"
import { checkAiCredits, trackAiUsage } from "@workspace/api/lib/polar"
import { getOrgPlan } from "@workspace/api/lib/quota"

const VARIATION_MODEL = "anthropic/claude-sonnet-4"

const scopeInstructions: Record<string, string> = {
  layout: "Focus on layout changes: spacing, padding, alignment, flex properties, gap. Do NOT change colors or typography.",
  colors: "Focus on color changes: text color, background color, border color, accent colors. Do NOT change layout or font sizes.",
  typography: "Focus on typography: fontSize, fontWeight, fontStyle, text alignment, line height. Do NOT change colors or layout.",
  content: "Focus on content alternatives: rewrite text with different wording/tone, restructure table data, change list items. Keep styling similar.",
  all: "Vary everything: layout, colors, typography, and content. Create distinctly different visual approaches.",
}

function buildPrompt(
  element: { type: string; props: Record<string, unknown> },
  scope: string,
  context: { templateName: string; siblingTypes: string[]; customPrompt?: string },
): string {
  const customSection = context.customPrompt
    ? `\n## User Request\n${context.customPrompt}\n\nIncorporate the user's request into all variations while respecting the scope constraints.`
    : ""

  return `You are a senior document designer. Generate 3-4 design variations for the following element.

## Context
- Template: "${context.templateName}"
- Element type: ${element.type}
- Sibling elements: ${context.siblingTypes.join(", ") || "none"}
- Current props: ${JSON.stringify(element.props, null, 2)}

## Scope
${scopeInstructions[scope] ?? scopeInstructions.all}
${customSection}

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

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return new Response("Unauthorized", { status: 401 })
  }

  // Check AI quota
  const orgId = session.session.activeOrganizationId
  if (orgId) {
    const plan = await getOrgPlan(db, orgId)
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
  const { element, scope, templateName, siblingTypes, customPrompt } = body as {
    element: { type: string; props: Record<string, unknown> }
    scope: string
    templateName: string
    siblingTypes: string[]
    customPrompt?: string
  }

  if (!element || !scope) {
    return new Response("Missing element or scope", { status: 400 })
  }

  const prompt = buildPrompt(element, scope, {
    templateName: templateName || "Untitled",
    siblingTypes: siblingTypes || [],
    customPrompt,
  })

  const result = streamObject({
    model: gateway(VARIATION_MODEL),
    schema: variationsResultSchema,
    prompt,
    onFinish: ({ usage: aiUsage }) => {
      if (orgId) {
        trackAiUsage({
          userId: session.user.id,
          organizationId: orgId,
          type: "remix",
          totalTokens: aiUsage?.totalTokens,
        })
      }
    },
  })

  return result.toTextStreamResponse()
}
