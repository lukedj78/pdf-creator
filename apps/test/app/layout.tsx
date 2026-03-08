import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Integration Test App",
  description: "Test app for API, SDK, and Webhooks integration",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, padding: "2rem", background: "#0a0a0a", color: "#ededed" }}>
        <nav style={{ marginBottom: "2rem", display: "flex", gap: "1.5rem", borderBottom: "1px solid #222", paddingBottom: "1rem" }}>
          <a href="/" style={{ color: "#ededed", fontWeight: "bold", textDecoration: "none" }}>Home</a>
          <a href="/sdk" style={{ color: "#888", textDecoration: "none" }}>SDK Tests</a>
          <a href="/api-raw" style={{ color: "#888", textDecoration: "none" }}>Raw API Tests</a>
          <a href="/webhooks" style={{ color: "#888", textDecoration: "none" }}>Webhook Tests</a>
        </nav>
        {children}
      </body>
    </html>
  )
}
