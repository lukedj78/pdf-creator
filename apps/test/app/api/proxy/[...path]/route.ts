const PLATFORM = "http://localhost:3002"

async function proxyRequest(req: Request) {
  const url = new URL(req.url)
  // Strip /api/proxy prefix → forward to platform
  const targetPath = url.pathname.replace(/^\/api\/proxy/, "")
  const targetUrl = `${PLATFORM}${targetPath}${url.search}`

  const headers = new Headers()
  // Forward relevant headers
  for (const key of ["authorization", "content-type"]) {
    const val = req.headers.get(key)
    if (val) headers.set(key, val)
  }

  const res = await fetch(targetUrl, {
    method: req.method,
    headers,
    body: req.method !== "GET" && req.method !== "HEAD" ? await req.text() : undefined,
  })

  // Forward response with all headers
  const responseHeaders = new Headers(res.headers)
  responseHeaders.set("Access-Control-Allow-Origin", "*")

  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: responseHeaders,
  })
}

export const GET = proxyRequest
export const POST = proxyRequest
export const PUT = proxyRequest
export const DELETE = proxyRequest

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  })
}
