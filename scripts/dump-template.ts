import { db, eq } from "@workspace/db"
import { templates } from "@workspace/db/schema"

const id = process.argv[2]
if (!id) {
  console.error("Usage: npx tsx scripts/dump-template.ts <template-id>")
  process.exit(1)
}

async function main() {
  const [t] = await db.select().from(templates).where(eq(templates.id, id))
  if (!t) { console.log("Not found"); process.exit(1) }

  const schema = t.schema as Record<string, unknown>
  const elements = schema.elements as Record<string, any>

  console.log("Template:", t.name)
  console.log("Root:", schema.root)
  console.log("Elements:", Object.keys(elements).length)
  console.log("")

  // Print tree structure
  function printTree(elId: string, depth: number = 0) {
    const el = elements[elId]
    if (!el) return
    const props = el.props || {}
    const info = []
    if (props.flex != null) info.push(`flex=${props.flex}`)
    if (props.width != null) info.push(`width=${props.width}`)
    if (props.gap != null) info.push(`gap=${props.gap}`)
    if (props.justifyContent) info.push(`jc=${props.justifyContent}`)
    if (props.text) {
      const text = typeof props.text === "string" ? props.text : JSON.stringify(props.text)
      info.push(`"${text.slice(0, 40)}"`)
    }
    if (props.src) info.push(`src=${(props.src as string).slice(0, 40)}...`)
    if (el.repeat) info.push(`REPEAT=${el.repeat.statePath}`)

    const indent = "  ".repeat(depth)
    console.log(`${indent}${elId} (${el.type}) ${info.join(" ")}`)

    for (const childId of (el.children || [])) {
      printTree(childId, depth + 1)
    }
  }

  printTree(schema.root as string)
  process.exit(0)
}

main()
