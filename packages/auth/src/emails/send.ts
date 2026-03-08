import { Resend } from "resend"

let resend: Resend | null = null

function getResend() {
  if (!resend) {
    const key = process.env.RESEND_API_KEY
    if (!key) throw new Error("RESEND_API_KEY is not set")
    resend = new Resend(key)
  }
  return resend
}

const FROM =
  process.env.RESEND_FROM_EMAIL ?? "Pdf Creator <noreply@pdfcreator.dev>"

/**
 * If EMAIL_OVERRIDE_TO is set, redirect all emails to that address.
 * Useful for testing in non-production environments.
 */
function resolveRecipient(to: string): string {
  const override = process.env.EMAIL_OVERRIDE_TO
  return override || to
}

export async function sendEmail({
  to,
  subject,
  react,
}: {
  to: string
  subject: string
  react: React.ReactElement
}) {
  const r = getResend()
  const { error } = await r.emails.send({
    from: FROM,
    to: resolveRecipient(to),
    subject,
    react,
  })

  if (error) {
    console.error("[email] Failed to send:", error)
    throw new Error(`Failed to send email: ${error.message}`)
  }
}
