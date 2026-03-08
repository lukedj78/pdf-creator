import { templateSchema, type Template } from "../schema/types"

export function validateTemplate(data: unknown): {
  success: boolean
  data?: Template
  error?: string
} {
  const result = templateSchema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return {
    success: false,
    error: result.error.issues.map((i) => i.message).join(", "),
  }
}

export function validateTemplateStrict(data: unknown): Template {
  return templateSchema.parse(data)
}
