import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
  Hr,
} from "@react-email/components"

interface EmailLayoutProps {
  preview: string
  children: React.ReactNode
}

export function EmailLayout({ preview, children }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>Pdf Creator</Text>
          </Section>
          <Section style={content}>{children}</Section>
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              Pdf Creator - Design and export JSON specs with ease.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const body = {
  backgroundColor: "#f4f4f5",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}

const container = {
  backgroundColor: "#ffffff",
  margin: "40px auto",
  borderRadius: "8px",
  maxWidth: "480px",
  overflow: "hidden" as const,
}

const header = {
  padding: "32px 32px 0",
}

const logo = {
  fontSize: "20px",
  fontWeight: "600" as const,
  color: "#09090b",
  margin: "0",
}

const content = {
  padding: "24px 32px 32px",
}

const hr = {
  borderColor: "#e4e4e7",
  margin: "0",
}

const footer = {
  padding: "24px 32px",
}

const footerText = {
  fontSize: "12px",
  color: "#a1a1aa",
  margin: "0",
}
