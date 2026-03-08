export interface SpecDesignerConfig {
  apiKey: string
  baseUrl: string
}

/** @deprecated Use SpecDesignerConfig instead */
export type PdfGeneratorConfig = SpecDesignerConfig

export interface ApiResponse<T> {
  success: true
  data: T
}

export interface ApiErrorResponse {
  success: false
  error: {
    message: string
    code: string
  }
}

export interface PaginatedResponse<T> {
  success: true
  data: T[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

export interface Template {
  id: string
  name: string
  description: string | null
  schema: Record<string, unknown>
  thumbnail: string | null
  status: "draft" | "published"
  organizationId: string
  createdBy: string
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateTemplateInput {
  name: string
  description?: string
  schema: Record<string, unknown>
  status?: "draft" | "published"
}

export interface UpdateTemplateInput {
  name?: string
  description?: string
  schema?: Record<string, unknown>
  status?: "draft" | "published"
  isPublic?: boolean
}

/** A json-render compatible spec */
export interface Spec {
  root: string
  elements: Record<string, {
    type: string
    props: Record<string, unknown>
    children: string[]
    visible?: { $state: string; eq?: unknown }
    repeat?: { statePath: string; key: string }
  }>
  state: Record<string, unknown>
}

export interface ExportByTemplateId {
  templateId: string
  data?: Record<string, unknown>
  /** URL to receive a webhook POST when the export completes or fails */
  callbackUrl?: string
}

export interface ExportByTemplate {
  template: Record<string, unknown>
  data?: Record<string, unknown>
  /** URL to receive a webhook POST when the export completes or fails */
  callbackUrl?: string
}

export type ExportInput = ExportByTemplateId | ExportByTemplate

export interface ExportResult {
  id: string
  spec: Spec
}

export interface Generation {
  id: string
  templateId: string
  data: Record<string, unknown> | null
  outputUrl: string | null
  status: "pending" | "processing" | "completed" | "failed"
  format: "json" | "pdf" | "png" | "jpg"
  organizationId: string
  createdBy: string
  createdAt: string
}

export interface UsageInfo {
  rateLimit: {
    limit: number
    remaining: number
    window: string
  }
  usage: {
    generationsThisMonth: number
    periodStart: string
  }
}

export class SpecDesignerError extends Error {
  public readonly code: string
  public readonly status: number

  constructor(message: string, code: string, status: number) {
    super(message)
    this.name = "SpecDesignerError"
    this.code = code
    this.status = status
  }
}

/** @deprecated Use SpecDesignerError instead */
export const PdfGeneratorError = SpecDesignerError
