import { Button, Text } from "@react-email/components"
import { EmailLayout } from "./layout"

interface ResetPasswordProps {
  url: string
  name: string
}

export function ResetPassword({ url, name }: ResetPasswordProps) {
  return (
    <EmailLayout preview="Reset your password">
      <Text style={heading}>Reset your password</Text>
      <Text style={paragraph}>
        Hi {name}, we received a request to reset your password. Click the
        button below to choose a new one.
      </Text>
      <Button style={button} href={url}>
        Reset Password
      </Button>
      <Text style={muted}>
        This link expires in 1 hour. If you didn&apos;t request a password
        reset, you can safely ignore this email.
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
