"use client"

import Feature from "@workspace/ui/components/landing/features"
import Testimonials from "@workspace/ui/components/landing/testimonials"
import CTA from "@workspace/ui/components/landing/cta"
import {
  File01Icon,
  ZapIcon,
  GlobeIcon,
  ArrowUpDownIcon,
  Tag01Icon,
  NotificationBubbleIcon,
  RotateClockwiseIcon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons"

const featureData = [
  {
    icon: File01Icon,
    title: "Visual Template Editor",
    content:
      "Design PDF templates with a visual drag-and-drop editor. Add text, images, tables, charts, and more. Preview changes in real-time with live data binding.",
  },
  {
    icon: ZapIcon,
    title: "AI-Powered Generation",
    content:
      "Describe the PDF you need in natural language. Our AI agent analyzes your requirements and builds a complete template with proper structure and styling.",
  },
  {
    icon: GlobeIcon,
    title: "REST API",
    content:
      "Export specs from any application with our REST API. Send a JSON template and data, get a JSON spec back. Full OpenAPI specification included.",
  },
  {
    icon: ArrowUpDownIcon,
    title: "TypeScript SDK",
    content:
      "First-class npm package with full type safety and autocompletion. Zero-config setup — install, import, and start exporting specs in minutes.",
  },
  {
    icon: Tag01Icon,
    title: "Template Engine",
    content:
      "Powerful JSON-based template system with 12 element types. Support for data binding with {{variables}}, nested layouts, and page settings.",
  },
  {
    icon: NotificationBubbleIcon,
    title: "Webhooks & Events",
    content:
      "Get real-time notifications when specs are exported. Configure webhooks per-request or through the dashboard. HMAC-SHA256 signed payloads.",
  },
  {
    icon: RotateClockwiseIcon,
    title: "Generation History",
    content:
      "Track every spec export with full metadata. View status, download outputs, and monitor usage across your entire organization.",
  },
  {
    icon: ArrowRight01Icon,
    title: "Team Management",
    content:
      "Invite team members, assign roles, and manage permissions. Organization-level access control with activity logging and API key management.",
  },
]

export default function FeaturesPage() {
  return (
    <div>
      <Feature
        featureData={featureData}
        badge="Features"
        heading="Built for developers, designed for everyone"
      />
      <Testimonials />
      <CTA />
    </div>
  )
}
