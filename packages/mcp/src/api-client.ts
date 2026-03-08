/**
 * HTTP client for the SpecDesigner REST API.
 * The MCP server uses this instead of direct DB/tRPC access,
 * so external users only need an API key + base URL.
 */

export class ApiClient {
  constructor(
    private baseUrl: string,
    private apiKey: string,
  ) {
    // Ensure no trailing slash
    this.baseUrl = baseUrl.replace(/\/+$/, "")
  }

  private async request<T = unknown>(
    path: string,
    method: string = "GET",
    body?: unknown,
  ): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!res.ok) {
      const text = await res.text().catch(() => "")
      throw new Error(`API ${method} ${path} failed (${res.status}): ${text}`)
    }

    const json = (await res.json()) as { success: boolean; data: T; error?: { message: string } }

    if (!json.success) {
      throw new Error(json.error?.message ?? "Unknown API error")
    }

    return json.data
  }

  // -- Templates --

  async listTemplates(params?: { search?: string; status?: string }) {
    const qs = new URLSearchParams()
    if (params?.search) qs.set("search", params.search)
    if (params?.status) qs.set("status", params.status)
    const query = qs.toString() ? `?${qs.toString()}` : ""
    return this.request<{
      items: Array<{
        id: string
        name: string
        status: string
        description: string | null
        schema: Record<string, unknown> | null
        updatedAt: string | Date
      }>
    }>("/templates" + query, "GET")
  }

  async getTemplate(id: string) {
    return this.request<{
      id: string
      name: string
      status: string
      description: string | null
      schema: Record<string, unknown> | null
    }>(`/templates/${id}`, "GET")
  }

  async createTemplate(data: { name: string; schema: Record<string, unknown>; description?: string; status?: string }) {
    return this.request<{ id: string; name: string }>("/templates", "POST", data)
  }

  async updateTemplate(id: string, data: { name?: string; description?: string; status?: string; schema?: Record<string, unknown> }) {
    return this.request(`/templates/${id}`, "PUT", data)
  }

  async deleteTemplate(id: string) {
    return this.request(`/templates/${id}`, "DELETE")
  }

  // -- Generate (export spec) --

  async generateSpec(data: { templateId: string; data?: Record<string, unknown> }) {
    // Generate endpoint uses a different response shape
    const res = await fetch(`${this.baseUrl}/generate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => "")
      throw new Error(`API POST /generate failed (${res.status}): ${text}`)
    }

    const json = (await res.json()) as { success: boolean; data: { id: string; spec: unknown } }
    return json.data
  }
}
