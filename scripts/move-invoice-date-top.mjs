#!/usr/bin/env node
/**
 * Move Invoice # and Date to top of page (indices 0 and 1).
 */
const TEMPLATE_ID = "9c8cdb27-d630-4188-902b-61cb0ac72f46";
const INVOICE_NUMBER_ID = "el_mmi29vv5_g";
const INVOICE_DATE_ID = "el_mmi2a0gb_h";

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
  const rest = children.filter((id) => id !== INVOICE_NUMBER_ID && id !== INVOICE_DATE_ID);
  const childrenNew = [INVOICE_NUMBER_ID, INVOICE_DATE_ID, ...rest];
  const updatedElements = { ...elements, [pageId]: { ...pageEl, children: childrenNew } };
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
  console.log("Invoice # and Date moved to top.");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
