import { Button, Text } from "@react-email/components"
import { EmailLayout } from "./layout"

interface VerifyEmailProps {
  url: string
  name: string
}

export function VerifyEmail({ url, name }: VerifyEmailProps) {
  return (
    <EmailLayout preview="Verify your email address">
      <Text style={heading}>Verify your email</Text>
      <Text style={paragraph}>
        Hi {name}, thanks for signing up. Please verify your email address to
        get started.
      </Text>
      <Button style={button} href={url}>
        Verify Email
      </Button>
      <Text style={muted}>
        If you didn&apos;t create an account, you can safely ignore this email.
      </Text>
    </EmailLayout>
  )
}

const heading = {
  fontSize: "24px",
  fontWeight: "600" as const,
  color: "#09090b",
  margin: "0 0 12px",
}

const paragraph = {
  fontSize: "14px",
  lineHeight: "24px",
  color: "#3f3f46",
  margin: "0 0 24px",
}

const button = {
  backgroundColor: "#09090b",
  color: "#fafafa",
  fontSize: "14px",
  fontWeight: "500" as const,
  borderRadius: "6px",
  padding: "10px 20px",
  textDecoration: "none",
  display: "inline-block" as const,
}

const muted = {
  fontSize: "12px",
  color: "#a1a1aa",
  marginTop: "24px",
}
