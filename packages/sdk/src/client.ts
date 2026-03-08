import type {
  SpecDesignerConfig,
  Template,
  CreateTemplateInput,
  UpdateTemplateInput,
  Generation,
  ExportInput,
  ExportResult,
  UsageInfo,
} from "./types.js"
import { SpecDesignerError } from "./types.js"

export class SpecDesignerClient {
  private readonly apiKey: string
  private readonly baseUrl: string

  constructor(config: SpecDesignerConfig) {
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl.replace(/\/$/, "")
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}/api/v1${path}`
    const res = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    })

    if (!res.ok) {
      let errorData: { error?: { message?: string; code?: string } } = {}
      try {
        errorData = await res.json()
      } catch {
        // ignore parse errors
      }
      throw new SpecDesignerError(
        errorData.error?.message ?? `Request failed with status ${res.status}`,
        errorData.error?.code ?? "UNKNOWN_ERROR",
        res.status
      )
    }

    const json = await res.json()
    return json.data ?? json
  }

  // --- Templates ---

  async listTemplates(): Promise<Template[]> {
    return this.request<Template[]>("/templates")
  }

  async getTemplate(id: string): Promise<Template> {
    return this.request<Template>(`/templates/${id}`)
  }

  async createTemplate(input: CreateTemplateInput): Promise<Template> {
    return this.request<Template>("/templates", {
      method: "POST",
      body: JSON.stringify(input),
    })
  }

  async updateTemplate(
    id: string,
    input: UpdateTemplateInput
  ): Promise<Template> {
    return this.request<Template>(`/templates/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    })
  }

  async deleteTemplate(id: string): Promise<void> {
    await this.request(`/templates/${id}`, { method: "DELETE" })
  }

  async duplicateTemplate(id: string): Promise<Template> {
    return this.request<Template>(`/templates/${id}/duplicate`, {
      method: "POST",
    })
  }

  // --- Spec Export ---

  /** Export a json-render compatible spec from a template */
  async exportSpec(input: ExportInput): Promise<ExportResult> {
    return this.request<ExportResult>("/generate", {
      method: "POST",
      body: JSON.stringify(input),
    })
  }

  // --- Generations (export history) ---

  async listGenerations(options?: {
    limit?: number
    offset?: number
  }): Promise<Generation[]> {
    const params = new URLSearchParams()
    if (options?.limit) params.set("limit", String(options.limit))
    if (options?.offset) params.set("offset", String(options.offset))
    const qs = params.toString()
    return this.request<Generation[]>(
      `/generations${qs ? `?${qs}` : ""}`
    )
  }

  async getGeneration(id: string): Promise<Generation> {
    return this.request<Generation>(`/generations/${id}`)
  }

  async deleteGeneration(id: string): Promise<void> {
    await this.request(`/generations/${id}`, { method: "DELETE" })
  }

  // --- Usage ---

  async getUsage(): Promise<UsageInfo> {
    return this.request<UsageInfo>("/usage")
  }
}

/** @deprecated Use SpecDesignerClient instead */
export const PdfGeneratorClient = SpecDesignerClient
