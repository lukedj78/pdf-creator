import { db } from "./client"
import { eq, sql } from "drizzle-orm"
import { templates, webhooks } from "./schema/index"

const demoSchemas = [
  {
    name: "Invoice Standard",
    description: "Clean invoice template with line items and totals",
    schema: {
      root: "doc",
      elements: {
        doc: { type: "Document", props: { title: "Invoice" }, children: ["page"] },
        page: { type: "Page", props: { size: "A4", orientation: "portrait", marginTop: 40, marginRight: 40, marginBottom: 40, marginLeft: 40 }, children: ["header", "items", "total"] },
        header: { type: "Heading", props: { text: "Invoice", level: "h1" }, children: [] },
        items: { type: "Table", props: { columns: [{ header: "Item" }, { header: "Qty" }, { header: "Price" }, { header: "Total" }], rows: [] }, children: [] },
        total: { type: "Text", props: { text: { $state: "/total" }, fontWeight: "bold", align: "right" }, children: [] },
      },
      state: { total: "$0.00" },
    },
  },
  {
    name: "Monthly Report",
    description: "Monthly business report with summary",
    schema: {
      root: "doc",
      elements: {
        doc: { type: "Document", props: { title: "Monthly Report" }, children: ["page"] },
        page: { type: "Page", props: { size: "A4", orientation: "portrait", marginTop: 40, marginRight: 40, marginBottom: 40, marginLeft: 40 }, children: ["title", "summary"] },
        title: { type: "Heading", props: { text: { $template: "Monthly Report — ${/month}" }, level: "h1" }, children: [] },
        summary: { type: "Text", props: { text: { $state: "/summary" } }, children: [] },
      },
      state: { month: "January 2026", summary: "Report summary goes here." },
    },
  },
  {
    name: "Invoice (Dynamic Lines)",
    description: "Invoice with dynamic repeating line items — ideal for variable-length invoices",
    schema: {
      root: "doc",
      elements: {
        doc: { type: "Document", props: { title: "Invoice" }, children: ["page"] },
        page: { type: "Page", props: { size: "A4", orientation: "portrait", marginTop: 40, marginRight: 40, marginBottom: 40, marginLeft: 40 }, children: ["header", "table-header", "line-item", "total"] },
        header: { type: "Heading", props: { text: { $template: "Invoice ${/invoice/number}" }, level: "h1" }, children: [] },
        "table-header": { type: "Row", props: { gap: 0, padding: 8 }, children: ["th-desc", "th-qty", "th-amount"] },
        "th-desc": { type: "Text", props: { text: "Description", fontSize: 10, fontWeight: "bold", color: "#666" }, children: [] },
        "th-qty": { type: "Text", props: { text: "Qty", fontSize: 10, fontWeight: "bold", color: "#666", align: "center" }, children: [] },
        "th-amount": { type: "Text", props: { text: "Amount", fontSize: 10, fontWeight: "bold", color: "#666", align: "right" }, children: [] },
        "line-item": { type: "Row", props: { gap: 0, padding: 8 }, children: ["li-desc", "li-qty", "li-amount"], repeat: { statePath: "/lines", key: "id" } },
        "li-desc": { type: "Text", props: { text: { $item: "description" }, fontSize: 11 }, children: [] },
        "li-qty": { type: "Text", props: { text: { $item: "qty" }, fontSize: 11, align: "center" }, children: [] },
        "li-amount": { type: "Text", props: { text: { $item: "amount" }, fontSize: 11, align: "right" }, children: [] },
        total: { type: "Text", props: { text: { $state: "/total" }, fontWeight: "bold", align: "right", fontSize: 14 }, children: [] },
      },
      state: {
        invoice: { number: "FT-001" },
        lines: [
          { id: "1", description: "Web Design", qty: "1", amount: "$800" },
          { id: "2", description: "Development", qty: "2", amount: "$300" },
        ],
        total: "$1,100.00",
      },
    },
  },
  {
    name: "Contract Agreement",
    description: "Legal contract template with signature blocks",
    schema: {
      root: "doc",
      elements: {
        doc: { type: "Document", props: { title: "Contract Agreement" }, children: ["page"] },
        page: { type: "Page", props: { size: "A4", orientation: "portrait", marginTop: 40, marginRight: 40, marginBottom: 40, marginLeft: 40 }, children: ["title", "parties", "terms"] },
        title: { type: "Heading", props: { text: "Contract Agreement", level: "h1" }, children: [] },
        parties: { type: "Text", props: { text: { $template: "Between ${/partyA} and ${/partyB}" } }, children: [] },
        terms: { type: "Text", props: { text: { $state: "/terms" } }, children: [] },
      },
      state: { partyA: "Company A", partyB: "Company B", terms: "Terms and conditions go here." },
    },
  },
]

/** Map old webhook event names to new ones */
const EVENT_RENAMES: Record<string, string> = {
  "generation.completed": "export.completed",
  "generation.failed": "export.failed",
}

async function seed() {
  console.log("Seeding database...")

  // 1. Find the first organization to assign seed templates to
  const result = await db.execute(sql`SELECT id FROM organization LIMIT 1`)
  const firstOrg = result.rows[0]
  if (!firstOrg) {
    console.error("  No organizations found — create a user first, then re-run seed.")
    process.exit(1)
  }
  const orgId = (firstOrg as { id: string }).id
  console.log(`  Using organization: ${orgId}`)

  // 2. Clean old seed templates and insert new ones
  await db.delete(templates).where(eq(templates.createdBy, "seed"))
  console.log(`  Cleaned old seed templates`)

  for (const t of demoSchemas) {
    await db.insert(templates).values({
      ...t,
      organizationId: orgId,
      createdBy: "seed",
      isPublic: true,
    })
    console.log(`  Created template: ${t.name}`)
  }

  // 3. Fix webhook events: rename generation.* → export.*
  const allWebhooks = await db.select().from(webhooks)
  for (const wh of allWebhooks) {
    const updated = wh.events.map((e) => EVENT_RENAMES[e] ?? e)
    if (JSON.stringify(updated) !== JSON.stringify(wh.events)) {
      await db.update(webhooks).set({ events: updated }).where(eq(webhooks.id, wh.id))
      console.log(`  Fixed webhook events: ${wh.id}`)
    }
  }

  console.log("Seeding complete.")
}

seed().catch((err) => {
  console.error("Seed failed:", err)
  process.exit(1)
})
