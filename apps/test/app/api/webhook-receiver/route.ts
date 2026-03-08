import crypto from "node:crypto"

// In-memory store for received webhooks (reset on server restart)
const received: Array<{
  id: string
  timestamp: string
  event: string
  signature: string | null
  signatureValid: boolean | null
  headers: Record<string, string>
  body: unknown
}> = []

// Secret used for HMAC verification — set via query param when checking
let verifySecret = ""

export async function POST(req: Request) {
  const rawBody = await req.text()
  let body: unknown
  try {
    body = JSON.parse(rawBody)
  } catch {
    body = rawBody
  }

  const signature = req.headers.get("x-webhook-signature")
  const event = req.headers.get("x-webhook-event") ?? (body as { event?: string })?.event ?? "unknown"
  const attempt = req.headers.get("x-webhook-attempt")

  // Verify HMAC if we have a secret and a signature
  let signatureValid: boolean | null = null
  if (signature && verifySecret) {
    const expected = crypto.createHmac("sha256", verifySecret).update(rawBody).digest("hex")
    signatureValid = signature === expected
  }

  const entry = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    event,
    signature,
    signatureValid,
    headers: {
      "x-webhook-signature": signature ?? "",
      "x-webhook-event": event,
      "x-webhook-attempt": attempt ?? "1",
      "content-type": req.headers.get("content-type") ?? "",
    },
    body,
  }

  received.unshift(entry)
  // Keep max 50 entries
  if (received.length > 50) received.length = 50

  console.log(`[webhook-receiver] ${event} — signature: ${signatureValid === null ? "no secret set" : signatureValid ? "valid" : "INVALID"}`)

  return Response.json({ received: true })
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const secret = url.searchParams.get("secret")
  if (secret) {
    verifySecret = secret
  }
  const clear = url.searchParams.get("clear")
  if (clear === "true") {
    received.length = 0
    return Response.json({ cleared: true, secret: verifySecret ? "set" : "not set" })
  }

  return Response.json({
    count: received.length,
    secret: verifySecret ? "set" : "not set",
    entries: received,
  })
}
