import { neon, Pool } from "@neondatabase/serverless"

const url = process.env.DATABASE_URL!

async function main() {
  // Test HTTP driver
  console.log("--- HTTP Driver (neon) ---")
  const sql = neon(url)
  let start = Date.now()
  await sql`SELECT 1`
  console.log("  Cold query:", Date.now() - start, "ms")
  start = Date.now()
  await sql`SELECT count(*) FROM templates`
  console.log("  Warm query:", Date.now() - start, "ms")

  // Test Pool driver
  console.log("\n--- Pool Driver (WebSocket) ---")
  const pool = new Pool({ connectionString: url })
  start = Date.now()
  await pool.query("SELECT 1")
  console.log("  Cold query:", Date.now() - start, "ms")
  start = Date.now()
  await pool.query("SELECT count(*) FROM templates")
  console.log("  Warm query:", Date.now() - start, "ms")
  start = Date.now()
  await pool.query("SELECT count(*) FROM templates")
  console.log("  Warm query 2:", Date.now() - start, "ms")
  await pool.end()
}

main()
