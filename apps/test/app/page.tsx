export default function Home() {
  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Integration Test App</h1>
      <p style={{ color: "#888", marginBottom: "2rem" }}>
        Test all API, SDK, and Webhook flows against the running platform at <code>localhost:3002</code>.
      </p>

      <div style={{ display: "grid", gap: "1rem", maxWidth: "600px" }}>
        <Section
          href="/sdk"
          title="SDK Tests"
          description="Full SDK flow: list templates, create, update, export spec, list generations, delete, check usage."
        />
        <Section
          href="/api-raw"
          title="Raw API Tests"
          description="Same flows using raw fetch() calls to /api/v1/* endpoints. Tests auth, error handling, rate limit headers."
        />
        <Section
          href="/webhooks"
          title="Webhook Tests"
          description="Test webhook delivery: register a local receiver, trigger events, verify HMAC signatures and retry behavior."
        />
      </div>

      <div style={{ marginTop: "2rem", padding: "1rem", background: "#111", borderRadius: "8px", border: "1px solid #222" }}>
        <h3 style={{ fontSize: "0.875rem", marginBottom: "0.5rem" }}>Setup</h3>
        <ol style={{ color: "#888", fontSize: "0.875rem", paddingLeft: "1.25rem", lineHeight: 1.8 }}>
          <li>Start the main app: <code>pnpm dev --filter @workspace/web</code> (port 3002)</li>
          <li>Start this test app: <code>pnpm dev --filter @workspace/test-app</code> (port 3003)</li>
          <li>Create an API key in the dashboard at <code>localhost:3002/dashboard/api-keys</code></li>
          <li>Paste your API key in any test page to start running tests</li>
        </ol>
      </div>
    </div>
  )
}

function Section({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <a
      href={href}
      style={{
        display: "block",
        padding: "1rem",
        background: "#111",
        borderRadius: "8px",
        border: "1px solid #222",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <h2 style={{ fontSize: "1rem", marginBottom: "0.25rem" }}>{title}</h2>
      <p style={{ color: "#888", fontSize: "0.813rem", margin: 0 }}>{description}</p>
    </a>
  )
}
