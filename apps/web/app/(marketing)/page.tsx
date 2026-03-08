"use client"

import Link from "next/link"
import { Instrument_Serif } from "next/font/google"
import { motion } from "framer-motion"
import { Button } from "@workspace/ui/components/button"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowUpRight01Icon,
  File01Icon,
  ZapIcon,
  GlobeIcon,
  ArrowUpDownIcon,
  Tag01Icon,
  NotificationBubbleIcon,
} from "@hugeicons/core-free-icons"
import Feature from "@workspace/ui/components/landing/features"
import LogoCloud from "@workspace/ui/components/landing/logo-cloud"
import CTA from "@workspace/ui/components/landing/cta"
import Faq from "@workspace/ui/components/landing/faq"
import Testimonials from "@workspace/ui/components/landing/testimonials"
import Newsletter from "@workspace/ui/components/landing/newsletter"

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["italic"],
})

const featureData = [
  {
    icon: File01Icon,
    title: "Visual Template Editor",
    content:
      "Design PDF templates with a drag-and-drop visual editor. Add text, images, tables, charts and preview in real-time.",
  },
  {
    icon: ZapIcon,
    title: "AI-Powered Generation",
    content:
      "Describe your PDF in natural language. Our AI agent builds and refines the template structure automatically.",
  },
  {
    icon: GlobeIcon,
    title: "REST API",
    content:
      "Export specs from any stack. Send a JSON template and data, receive a JSON spec back. Full OpenAPI spec included.",
  },
  {
    icon: ArrowUpDownIcon,
    title: "TypeScript SDK",
    content:
      "First-class npm package with full type safety, autocompletion, and zero-config setup for any JS/TS project.",
  },
  {
    icon: Tag01Icon,
    title: "Template Engine",
    content:
      "12 element types, {{variable}} data binding, nested layouts, conditional rendering, and page settings.",
  },
  {
    icon: NotificationBubbleIcon,
    title: "Webhooks & Events",
    content:
      "Real-time notifications when PDFs are generated. HMAC-SHA256 signed payloads with automatic retries.",
  },
]

export default function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <section>
        <div className="w-full h-full relative">
          <div className="relative w-full pt-0 md:pt-20 pb-6 md:pb-10">
            <div className="container mx-auto relative z-10">
              <div className="flex flex-col max-w-5xl mx-auto gap-8">
                <div className="relative flex flex-col text-center items-center sm:gap-6 gap-4">
                  <motion.h1
                    initial={{ opacity: 0, y: 32 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                    className="lg:text-8xl md:text-7xl text-5xl font-medium leading-14 md:leading-20 lg:leading-24"
                  >
                    Document creation{" "}
                    <span
                      className={`${instrumentSerif.className} tracking-tight`}
                    >
                      for developers
                    </span>
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, y: 32 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 1,
                      delay: 0.1,
                      ease: "easeInOut",
                    }}
                    className="text-base font-normal max-w-2xl text-muted-foreground"
                  >
                    Design templates visually, generate with AI, or integrate
                    via API. One platform for invoices, reports, contracts, and
                    any PDF you need.
                  </motion.p>
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 32 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 1,
                    delay: 0.2,
                    ease: "easeInOut",
                  }}
                  className="flex items-center flex-col md:flex-row justify-center gap-6"
                >
                  <Button
                    className="relative text-sm font-medium rounded-full h-12 p-1 ps-6 pe-14 group transition-all duration-500 hover:ps-14 hover:pe-6 w-fit overflow-hidden cursor-pointer"
                    nativeButton={false}
                    render={<Link href="/register" />}
                  >
                    <span className="relative z-10 transition-all duration-500">
                      Get Started Free
                    </span>
                    <span className="absolute right-1 w-10 h-10 bg-background text-foreground rounded-full flex items-center justify-center transition-all duration-500 group-hover:right-[calc(100%-44px)] group-hover:rotate-45">
                      <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} />
                    </span>
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-full cursor-pointer"
                    nativeButton={false}
                    render={<Link href="/docs" />}
                  >
                    View Documentation
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Code Preview */}
      <section className="pb-8 sm:pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeInOut" }}
            className="rounded-2xl border border-border bg-card overflow-hidden shadow-xl"
          >
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <div className="flex gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-foreground/10" />
                <div className="h-2.5 w-2.5 rounded-full bg-foreground/10" />
                <div className="h-2.5 w-2.5 rounded-full bg-foreground/10" />
              </div>
              <span className="ml-2 text-[11px] text-muted-foreground">
                generate.ts
              </span>
            </div>
            <pre className="overflow-x-auto p-6 text-[13px] leading-relaxed">
              <code className="text-muted-foreground">
                {`import { PdfGenerator } from '@pdfgen/sdk'

const client = new PdfGenerator('pk_live_...')

const pdf = await client.generate({
  template: 'invoice-v2',
  data: {
    company: 'Acme Inc.',
    items: [
      { name: 'Widget', qty: 10, price: 9.99 },
      { name: 'Gadget', qty: 5, price: 24.99 },
    ],
    total: '$224.85',
  },
})

// Save to file or stream to client
await pdf.save('invoice-001.pdf')`}
              </code>
            </pre>
          </motion.div>
        </div>
      </section>

      {/* Logo Cloud */}
      <LogoCloud
        brandList={[
          { image: "", lightimg: "", name: "Vercel" },
          { image: "", lightimg: "", name: "Stripe" },
          { image: "", lightimg: "", name: "GitHub" },
          { image: "", lightimg: "", name: "Slack" },
          { image: "", lightimg: "", name: "Linear" },
        ]}
      />

      {/* Features */}
      <Feature
        featureData={featureData}
        badge="Features"
        heading="Everything you need to create documents"
      />

      {/* Testimonials */}
      <Testimonials />

      {/* FAQ */}
      <Faq />

      {/* Newsletter */}
      <Newsletter />

      {/* CTA */}
      <CTA />
    </div>
  )
}
