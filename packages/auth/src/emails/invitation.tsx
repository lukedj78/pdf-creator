import { Button, Text } from "@react-email/components"
import { EmailLayout } from "./layout"

interface InvitationProps {
  url: string
  inviterName: string
  organizationName: string
}

export function Invitation({
  url,
  inviterName,
  organizationName,
}: InvitationProps) {
  return (
    <EmailLayout
      preview={`${inviterName} invited you to join ${organizationName}`}
    >
      <Text style={heading}>You&apos;re invited</Text>
      <Text style={paragraph}>
        {inviterName} has invited you to join{" "}
        <strong>{organizationName}</strong> on Pdf Creator. Click below to
        accept the invitation.
      </Text>
      <Button style={button} href={url}>
        Accept Invitation
      </Button>
      <Text style={muted}>
        This invitation expires in 7 days. If you weren&apos;t expecting this,
        you can safely ignore this email.
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
