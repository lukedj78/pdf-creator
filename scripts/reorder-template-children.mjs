#!/usr/bin/env node
/**
 * Reorder template children: move divider (el_mmi17w3c_a) before table (index 3).
 * Usage: PDFCREATOR_URL=http://localhost:3002/api/v1 PDFCREATOR_API_KEY=xxx node scripts/reorder-template-children.mjs
 */
const TEMPLATE_ID = "9c8cdb27-d630-4188-902b-61cb0ac72f46";
const DIVIDER_ID = "el_mmi17w3c_a";
const TARGET_INDEX = 3;

const baseUrl = process.env.PDFCREATOR_URL || "http://localhost:3002/api/v1";
const apiKey = process.env.PDFCREATOR_API_KEY;
if (!apiKey) {
  console.error("Set PDFCREATOR_API_KEY");
  process.exit(1);
}

async function run() {
  const res = await fetch(`${baseUrl}/templates/${TEMPLATE_ID}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) throw new Error(`GET failed: ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || "GET failed");
  const template = json.data;
  const schema = template.schema || template;
  const elements = schema.elements;
  if (!elements) throw new Error("No schema.elements");

  const pageEntry = Object.entries(elements).find(([, el]) => el.type === "Page");
  if (!pageEntry) throw new Error("No Page element");
  const [pageId, pageEl] = pageEntry;
  let children = [...(pageEl.children || [])];
  const fromIdx = children.indexOf(DIVIDER_ID);
  if (fromIdx === -1) throw new Error(`Divider ${DIVIDER_ID} not in page children`);
  children.splice(fromIdx, 1);
  children.splice(TARGET_INDEX, 0, DIVIDER_ID);
  const updatedElements = { ...elements, [pageId]: { ...pageEl, children } };
  const updatedSchema = { ...schema, elements: updatedElements };

  const putRes = await fetch(`${baseUrl}/templates/${TEMPLATE_ID}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ schema: updatedSchema }),
  });
  if (!putRes.ok) throw new Error(`PUT failed: ${putRes.status}`);
  const putJson = await putRes.json();
  if (!putJson.success) throw new Error(putJson.error?.message || "PUT failed");
  console.log("Template updated: divider moved to index", TARGET_INDEX);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
