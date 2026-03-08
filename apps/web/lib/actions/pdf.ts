"use server"

import type { Template } from "@workspace/template-engine/schema"
import { renderPdf } from "@workspace/template-engine/pdf"

/**
 * Render a template to PDF and return as base64 string.
 */
export async function generatePdfPreview(
  template: Template,
): Promise<{ base64: string }> {
  const buffer = await renderPdf(template)
  const base64 = Buffer.from(buffer).toString("base64")
  return { base64 }
}
