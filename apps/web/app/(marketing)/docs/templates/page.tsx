"use client"

import {
  DocsPage,
  DocsSection,
  CodeBlock,
  Callout,
  ParamTable,
} from "@/components/marketing/docs-components"

export default function TemplatesPage() {
  return (
    <DocsPage
      title="Template Schema"
      description="JSON specification for defining templates — elements, styles, data binding, and page settings."
    >
      <DocsSection id="overview" title="Overview">
        <p>
          Templates use a flat element map architecture inspired by{" "}
          <code className="rounded bg-accent px-1.5 py-0.5 text-[12px]">
            vercel-labs/json-render
          </code>
          . Each element is stored by ID in a flat{" "}
          <code className="rounded bg-accent px-1.5 py-0.5 text-[12px]">elements</code>{" "}
          map, and{" "}
          <code className="rounded bg-accent px-1.5 py-0.5 text-[12px]">root</code>{" "}
          points to the top-level Document element.
        </p>
        <CodeBlock
          language="json"
          title="Template structure"
          code={`{
  "root": "doc",
  "elements": {
    "doc": {
      "type": "Document",
      "props": { "title": "Invoice" },
      "children": ["page"]
    },
    "page": {
      "type": "Page",
      "props": { "size": "A4" },
      "children": ["header", "details"]
    },
    "header": {
      "type": "Heading",
      "props": { "text": "Invoice {{invoiceNumber}}", "level": "h1" },
      "children": []
    },
    "details": {
      "type": "Text",
      "props": { "text": "Bill to: {{customerName}}", "fontSize": 14, "color": "#666666" },
      "children": []
    }
  },
  "state": {}
}`}
        />
      </DocsSection>

      <DocsSection id="elements" title="Element Types">
        <p>11 element types are available (plus Document and Page for structure):</p>

        <div className="mt-4 space-y-6">
          <div>
            <h4 className="text-[13px] font-semibold">Text</h4>
            <p className="text-muted-foreground">Text content with formatting options.</p>
            <ParamTable params={[
              { name: "text", type: "string", required: true, description: "Text content (supports {{variable}} binding)" },
              { name: "fontSize", type: "number", description: "Font size in pixels" },
              { name: "color", type: "string", description: "Text color" },
              { name: "align", type: '"left" | "center" | "right"', description: "Text alignment" },
              { name: "fontWeight", type: '"normal" | "bold"', description: "Font weight" },
              { name: "fontStyle", type: '"normal" | "italic"', description: "Font style" },
              { name: "lineHeight", type: "number", description: "Line height multiplier" },
            ]} />
          </div>

          <div>
            <h4 className="text-[13px] font-semibold">Heading</h4>
            <p className="text-muted-foreground">Heading element (h1 through h4).</p>
            <ParamTable params={[
              { name: "text", type: "string", required: true, description: "Heading text" },
              { name: "level", type: '"h1" | "h2" | "h3" | "h4"', description: 'Heading level (default: "h1")' },
              { name: "color", type: "string", description: "Text color" },
              { name: "align", type: '"left" | "center" | "right"', description: "Text alignment" },
            ]} />
          </div>

          <div>
            <h4 className="text-[13px] font-semibold">Image</h4>
            <p className="text-muted-foreground">Image with source URL.</p>
            <ParamTable params={[
              { name: "src", type: "string", required: true, description: "Image URL" },
              { name: "width", type: "number", description: "Width in pixels" },
              { name: "height", type: "number", description: "Height in pixels" },
              { name: "objectFit", type: '"contain" | "cover" | "fill" | "none"', description: "Object fit mode" },
            ]} />
          </div>

          <div>
            <h4 className="text-[13px] font-semibold">Link</h4>
            <p className="text-muted-foreground">Hyperlink element.</p>
            <ParamTable params={[
              { name: "text", type: "string", required: true, description: "Link text" },
              { name: "href", type: "string", required: true, description: "URL destination" },
              { name: "fontSize", type: "number", description: "Font size in pixels" },
              { name: "color", type: "string", description: "Link color" },
            ]} />
          </div>

          <div>
            <h4 className="text-[13px] font-semibold">Table</h4>
            <p className="text-muted-foreground">Data table with configurable columns.</p>
            <ParamTable params={[
              { name: "columns", type: "TableColumn[]", required: true, description: "Column definitions: { header, width?, align? }" },
              { name: "rows", type: "string[][]", required: true, description: "Row data (array of string arrays)" },
              { name: "headerBackgroundColor", type: "string", description: "Header background color" },
              { name: "headerTextColor", type: "string", description: "Header text color" },
              { name: "borderColor", type: "string", description: "Border color" },
              { name: "fontSize", type: "number", description: "Font size in pixels" },
              { name: "striped", type: "boolean", description: "Alternating row colors (default: false)" },
            ]} />
          </div>

          <div>
            <h4 className="text-[13px] font-semibold">Row / Column</h4>
            <p className="text-muted-foreground">Flex layout containers for horizontal/vertical arrangement.</p>
            <ParamTable params={[
              { name: "gap", type: "number", description: "Gap between children" },
              { name: "alignItems", type: '"flex-start" | "center" | "flex-end" | "stretch"', description: "Cross-axis alignment" },
              { name: "justifyContent", type: '"flex-start" | "center" | "flex-end" | "space-between" | "space-around"', description: "Main-axis alignment" },
              { name: "padding", type: "number", description: "Inner padding in pixels" },
              { name: "flex", type: "number", description: "Flex grow value" },
              { name: "wrap", type: "boolean", description: "Allow wrapping (Row only)" },
            ]} />
            <Callout type="tip">
              Use <code className="text-[12px]">children</code> array to nest
              elements inside a row or column.
            </Callout>
          </div>

          <div>
            <h4 className="text-[13px] font-semibold">View</h4>
            <p className="text-muted-foreground">
              Generic wrapper element for grouping and styling. Supports padding, margins, borders,
              backgrounds, and flex layout via props.
            </p>
            <ParamTable params={[
              { name: "padding", type: "number", description: "Inner padding (all sides)" },
              { name: "backgroundColor", type: "string", description: "Background color" },
              { name: "borderWidth", type: "number", description: "Border width in pixels" },
              { name: "borderColor", type: "string", description: "Border color" },
              { name: "borderRadius", type: "number", description: "Border radius in pixels" },
              { name: "flex", type: "number", description: "Flex grow value" },
            ]} />
          </div>

          <div>
            <h4 className="text-[13px] font-semibold">Spacer</h4>
            <p className="text-muted-foreground">Vertical spacing element.</p>
            <ParamTable params={[
              { name: "height", type: "number", description: "Height in pixels (default: 20)" },
            ]} />
          </div>

          <div>
            <h4 className="text-[13px] font-semibold">Divider</h4>
            <p className="text-muted-foreground">Horizontal line separator.</p>
            <ParamTable params={[
              { name: "thickness", type: "number", description: "Line thickness (default: 1)" },
              { name: "color", type: "string", description: 'Line color (default: "#e5e5e5")' },
              { name: "marginTop", type: "number", description: "Top margin in pixels" },
              { name: "marginBottom", type: "number", description: "Bottom margin in pixels" },
            ]} />
          </div>

          <div>
            <h4 className="text-[13px] font-semibold">List</h4>
            <p className="text-muted-foreground">Ordered or unordered list.</p>
            <ParamTable params={[
              { name: "items", type: "string[]", required: true, description: "List items" },
              { name: "ordered", type: "boolean", description: "Numbered list (default: false)" },
              { name: "fontSize", type: "number", description: "Font size in pixels" },
              { name: "color", type: "string", description: "Text color" },
              { name: "spacing", type: "number", description: "Spacing between items" },
            ]} />
          </div>

          <div>
            <h4 className="text-[13px] font-semibold">PageNumber</h4>
            <p className="text-muted-foreground">
              Displays current page number and total pages.
            </p>
            <ParamTable params={[
              { name: "format", type: "string", description: 'Format string (default: "{pageNumber} / {totalPages}")' },
              { name: "fontSize", type: "number", description: "Font size in pixels" },
              { name: "color", type: "string", description: "Text color" },
              { name: "align", type: '"left" | "center" | "right"', description: "Text alignment" },
            ]} />
          </div>
        </div>
      </DocsSection>

      <DocsSection id="styles" title="Styling via Props">
        <p>
          All styling is defined directly as{" "}
          <code className="rounded bg-accent px-1.5 py-0.5 text-[12px]">props</code>{" "}
          on each element (there is no separate <code className="rounded bg-accent px-1.5 py-0.5 text-[12px]">styles</code> object):
        </p>
        <CodeBlock
          language="json"
          code={`{
  "type": "Text",
  "props": {
    "text": "Hello world",
    "width": "100%",
    "padding": 16,
    "marginBottom": 12,
    "backgroundColor": "#f9fafb",
    "color": "#111",
    "fontSize": 14,
    "fontWeight": "bold",
    "fontFamily": "Helvetica",
    "textAlign": "center",
    "border": "1px solid #e5e5e5",
    "borderRadius": 8,
    "display": "flex",
    "flexDirection": "row",
    "justifyContent": "space-between",
    "alignItems": "center",
    "gap": 12,
    "opacity": 0.9
  },
  "children": []
}`}
        />
        <Callout type="info">
          All CSS-like properties accept either string or number values. Numbers
          are treated as pixels. The schema supports layout (flexbox),
          typography, spacing, borders, and positioning properties — all as props.
        </Callout>
      </DocsSection>

      <DocsSection id="data-binding" title="Data Binding">
        <p>
          Use <code className="rounded bg-accent px-1.5 py-0.5 text-[12px]">{"{{variable}}"}</code>{" "}
          syntax in any text content to bind dynamic data:
        </p>
        <CodeBlock
          language="json"
          title="Template element"
          code={`{
  "type": "Text",
  "props": { "text": "Hello, {{customer.name}}! Your order #{{orderId}} is ready." },
  "children": []
}`}
        />
        <CodeBlock
          language="json"
          title="Data passed at generation"
          code={`{
  "customer": { "name": "Jane Doe" },
  "orderId": "ORD-1234"
}`}
        />
        <CodeBlock
          language="text"
          title="Rendered output"
          code={`Hello, Jane Doe! Your order #ORD-1234 is ready.`}
        />
        <Callout type="tip">
          Nested paths are supported:{" "}
          <code className="text-[12px]">{"{{company.address.city}}"}</code>. If a
          variable is not found, the placeholder is left as-is.
        </Callout>
      </DocsSection>

      <DocsSection id="page-settings" title="Page Settings">
        <p>
          Page settings are defined as props on <code className="rounded bg-accent px-1.5 py-0.5 text-[12px]">Page</code> elements:
        </p>
        <ParamTable params={[
          { name: "size", type: '"A4" | "A3" | "A5" | "LETTER" | "LEGAL" | "TABLOID"', description: 'Page size (default: "A4")' },
          { name: "orientation", type: '"portrait" | "landscape"', description: 'Orientation (default: "portrait")' },
          { name: "marginTop", type: "number", description: "Top margin in px" },
          { name: "marginBottom", type: "number", description: "Bottom margin in px" },
          { name: "marginLeft", type: "number", description: "Left margin in px" },
          { name: "marginRight", type: "number", description: "Right margin in px" },
          { name: "backgroundColor", type: "string", description: "Page background color" },
        ]} />
      </DocsSection>

      <DocsSection id="children" title="Nesting Elements">
        <p>
          Layout elements (<code className="text-[12px]">Row</code>,{" "}
          <code className="text-[12px]">Column</code>,{" "}
          <code className="text-[12px]">View</code>) use a{" "}
          <code className="rounded bg-accent px-1.5 py-0.5 text-[12px]">children</code>{" "}
          array of element IDs to nest other elements:
        </p>
        <CodeBlock
          language="json"
          code={`{
  "root": "doc",
  "elements": {
    "doc": {
      "type": "Document",
      "props": { "title": "Example" },
      "children": ["page"]
    },
    "page": {
      "type": "Page",
      "props": { "size": "A4" },
      "children": ["header-row"]
    },
    "header-row": {
      "type": "Row",
      "props": { "gap": 20 },
      "children": ["logo", "company-info"]
    },
    "logo": {
      "type": "Image",
      "props": { "src": "https://example.com/logo.png", "width": 80, "height": 80 },
      "children": []
    },
    "company-info": {
      "type": "Text",
      "props": { "text": "{{companyName}}\\n{{companyAddress}}", "fontSize": 12 },
      "children": []
    }
  },
  "state": {}
}`}
        />
      </DocsSection>
    </DocsPage>
  )
}
