import { z } from "zod"

// ---------------------------------------------------------------------------
// Element Types (PascalCase, matching @json-render/react-pdf catalog)
// ---------------------------------------------------------------------------

export const elementTypeSchema = z.enum([
  // Document structure
  "Document",
  "Page",
  // Layout
  "View",
  "Row",
  "Column",
  // Content
  "Text",
  "Heading",
  "Image",
  "Link",
  // Data
  "Table",
  "List",
  // Decorative
  "Divider",
  "Spacer",
  // Page-level
  "PageNumber",
])

// ---------------------------------------------------------------------------
// Expressions ($state, $template, $item, $index, $cond, $computed)
// ---------------------------------------------------------------------------

export const stateExprSchema = z.object({
  $state: z.string(), // JSON Pointer, e.g. "/user/name"
})

export const templateExprSchema = z.object({
  $template: z.string(), // e.g. "Hello ${/user/name}!"
})

export const itemExprSchema = z.object({
  $item: z.string(), // field name, or "" for entire item
})

export const indexExprSchema = z.object({
  $index: z.literal(true),
})

export const condExprSchema = z.object({
  $cond: z.unknown(),
  $then: z.unknown(),
  $else: z.unknown(),
})

export const computedExprSchema = z.object({
  $computed: z.string(),
  args: z.record(z.unknown()).optional(),
})

export const expressionSchema = z.union([
  stateExprSchema,
  templateExprSchema,
  itemExprSchema,
  indexExprSchema,
  condExprSchema,
  computedExprSchema,
])

/** A prop value can be a literal or an expression */
export const propValueSchema: z.ZodType = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    expressionSchema,
    z.array(z.union([z.string(), z.number(), z.record(z.unknown())])),
    z.record(z.unknown()),
  ])
)

// ---------------------------------------------------------------------------
// Visibility & Repeat
// ---------------------------------------------------------------------------

export const visibleSchema = z.object({
  $state: z.string(),
  eq: z.unknown(),
})

export const repeatSchema = z.object({
  statePath: z.string(), // JSON Pointer to array in state
  key: z.string(), // field name for stable key
})

// ---------------------------------------------------------------------------
// Props per Element Type
// ---------------------------------------------------------------------------

export const documentPropsSchema = z.object({
  title: z.string().nullable().optional(),
  author: z.string().nullable().optional(),
  subject: z.string().nullable().optional(),
})

export const pagePropsSchema = z.object({
  size: z.enum(["A4", "A3", "A5", "LETTER", "LEGAL", "TABLOID"]).nullable().optional(),
  orientation: z.enum(["portrait", "landscape"]).nullable().optional(),
  marginTop: z.number().nullable().optional(),
  marginBottom: z.number().nullable().optional(),
  marginLeft: z.number().nullable().optional(),
  marginRight: z.number().nullable().optional(),
  backgroundColor: z.string().nullable().optional(),
})

export const viewPropsSchema = z.object({
  padding: z.number().nullable().optional(),
  paddingTop: z.number().nullable().optional(),
  paddingBottom: z.number().nullable().optional(),
  paddingLeft: z.number().nullable().optional(),
  paddingRight: z.number().nullable().optional(),
  margin: z.number().nullable().optional(),
  backgroundColor: z.string().nullable().optional(),
  borderWidth: z.number().nullable().optional(),
  borderColor: z.string().nullable().optional(),
  borderRadius: z.number().nullable().optional(),
  flex: z.number().nullable().optional(),
  alignItems: z.enum(["flex-start", "center", "flex-end", "stretch"]).nullable().optional(),
  justifyContent: z.enum(["flex-start", "center", "flex-end", "space-between", "space-around"]).nullable().optional(),
})

export const rowPropsSchema = z.object({
  gap: z.number().nullable().optional(),
  alignItems: z.enum(["flex-start", "center", "flex-end", "stretch"]).nullable().optional(),
  justifyContent: z.enum(["flex-start", "center", "flex-end", "space-between", "space-around"]).nullable().optional(),
  padding: z.number().nullable().optional(),
  flex: z.number().nullable().optional(),
  wrap: z.boolean().nullable().optional(),
})

export const columnPropsSchema = z.object({
  gap: z.number().nullable().optional(),
  alignItems: z.enum(["flex-start", "center", "flex-end", "stretch"]).nullable().optional(),
  justifyContent: z.enum(["flex-start", "center", "flex-end", "space-between", "space-around"]).nullable().optional(),
  padding: z.number().nullable().optional(),
  flex: z.number().nullable().optional(),
})

export const textPropsSchema = z.object({
  text: z.union([z.string(), stateExprSchema, templateExprSchema, itemExprSchema, condExprSchema]).default(""),
  fontSize: z.number().nullable().optional(),
  color: z.string().nullable().optional(),
  align: z.enum(["left", "center", "right"]).nullable().optional(),
  fontWeight: z.enum(["normal", "bold"]).nullable().optional(),
  fontStyle: z.enum(["normal", "italic"]).nullable().optional(),
  lineHeight: z.number().nullable().optional(),
})

export const headingPropsSchema = z.object({
  text: z.union([z.string(), stateExprSchema, templateExprSchema, itemExprSchema, condExprSchema]).default(""),
  level: z.enum(["h1", "h2", "h3", "h4"]).nullable().optional(),
  color: z.string().nullable().optional(),
  align: z.enum(["left", "center", "right"]).nullable().optional(),
})

export const imagePropsSchema = z.object({
  src: z.union([z.string(), stateExprSchema, templateExprSchema, itemExprSchema]).default(""),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
  objectFit: z.enum(["contain", "cover", "fill", "none"]).nullable().optional(),
})

export const linkPropsSchema = z.object({
  text: z.union([z.string(), stateExprSchema, templateExprSchema, itemExprSchema, condExprSchema]).default(""),
  href: z.union([z.string(), stateExprSchema, templateExprSchema, itemExprSchema]).default(""),
  fontSize: z.number().nullable().optional(),
  color: z.string().nullable().optional(),
})

export const tableColumnSchema = z.object({
  header: z.string(),
  width: z.string().optional(),
  align: z.enum(["left", "center", "right"]).optional(),
})

export const tablePropsSchema = z.object({
  columns: z.array(tableColumnSchema).default([]),
  rows: z.array(z.array(z.string())).default([]),
  headerBackgroundColor: z.string().nullable().optional(),
  headerTextColor: z.string().nullable().optional(),
  borderColor: z.string().nullable().optional(),
  fontSize: z.number().nullable().optional(),
  striped: z.boolean().nullable().optional(),
})

export const listPropsSchema = z.object({
  items: z.array(z.union([z.string(), stateExprSchema, templateExprSchema, itemExprSchema])).default([]),
  ordered: z.boolean().nullable().optional(),
  fontSize: z.number().nullable().optional(),
  color: z.string().nullable().optional(),
  spacing: z.number().nullable().optional(),
})

export const dividerPropsSchema = z.object({
  color: z.string().nullable().optional(),
  thickness: z.number().nullable().optional(),
  marginTop: z.number().nullable().optional(),
  marginBottom: z.number().nullable().optional(),
})

export const spacerPropsSchema = z.object({
  height: z.number().nullable().optional(),
})

export const pageNumberPropsSchema = z.object({
  format: z.string().nullable().optional(), // default: "{pageNumber} / {totalPages}"
  fontSize: z.number().nullable().optional(),
  color: z.string().nullable().optional(),
  align: z.enum(["left", "center", "right"]).nullable().optional(),
})

// ---------------------------------------------------------------------------
// Element
// ---------------------------------------------------------------------------

export const elementSchema = z.object({
  type: elementTypeSchema,
  props: z.record(z.unknown()).default({}),
  children: z.array(z.string()).default([]),
  visible: visibleSchema.optional(),
  repeat: repeatSchema.optional(),
})

// ---------------------------------------------------------------------------
// Spec (json-render compatible — this is what gets saved in DB `schema` field)
// ---------------------------------------------------------------------------

export const specSchema = z.object({
  root: z.string(),
  elements: z.record(z.string(), elementSchema),
  state: z.record(z.unknown()).default({}),
})

// ---------------------------------------------------------------------------
// Template (our wrapper: metadata + spec)
// ---------------------------------------------------------------------------

export const templateMetaSchema = z.object({
  author: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
})

export const templateSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.number().default(1),
  meta: templateMetaSchema.default({}),
  // json-render spec fields (flattened for convenience)
  root: z.string(),
  elements: z.record(z.string(), elementSchema),
  state: z.record(z.unknown()).default({}),
})

// ---------------------------------------------------------------------------
// Inferred Types
// ---------------------------------------------------------------------------

export type ElementType = z.infer<typeof elementTypeSchema>
export type Expression = z.infer<typeof expressionSchema>
export type StateExpr = z.infer<typeof stateExprSchema>
export type TemplateExpr = z.infer<typeof templateExprSchema>
export type ItemExpr = z.infer<typeof itemExprSchema>
export type IndexExpr = z.infer<typeof indexExprSchema>
export type CondExpr = z.infer<typeof condExprSchema>
export type ComputedExpr = z.infer<typeof computedExprSchema>
export type VisibleCondition = z.infer<typeof visibleSchema>
export type RepeatConfig = z.infer<typeof repeatSchema>

export type DocumentProps = z.infer<typeof documentPropsSchema>
export type PageProps = z.infer<typeof pagePropsSchema>
export type ViewProps = z.infer<typeof viewPropsSchema>
export type RowProps = z.infer<typeof rowPropsSchema>
export type ColumnProps = z.infer<typeof columnPropsSchema>
export type TextProps = z.infer<typeof textPropsSchema>
export type HeadingProps = z.infer<typeof headingPropsSchema>
export type ImageProps = z.infer<typeof imagePropsSchema>
export type LinkProps = z.infer<typeof linkPropsSchema>
export type TableColumn = z.infer<typeof tableColumnSchema>
export type TableProps = z.infer<typeof tablePropsSchema>
export type ListProps = z.infer<typeof listPropsSchema>
export type DividerProps = z.infer<typeof dividerPropsSchema>
export type SpacerProps = z.infer<typeof spacerPropsSchema>
export type PageNumberProps = z.infer<typeof pageNumberPropsSchema>

export type Element = z.infer<typeof elementSchema>
export type Spec = z.infer<typeof specSchema>
export type TemplateMeta = z.infer<typeof templateMetaSchema>
export type Template = z.infer<typeof templateSchema>

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract the json-render spec from a Template (strips our metadata) */
export function toSpec(template: Template): Spec {
  return {
    root: template.root,
    elements: template.elements,
    state: template.state,
  }
}

/** Check if a value is an expression object */
export function isExpression(value: unknown): value is Expression {
  if (typeof value !== "object" || value === null) return false
  const obj = value as Record<string, unknown>
  return (
    "$state" in obj ||
    "$template" in obj ||
    "$item" in obj ||
    "$index" in obj ||
    "$cond" in obj ||
    "$computed" in obj
  )
}

/** Check if a value is a $state expression */
export function isStateExpr(value: unknown): value is StateExpr {
  return typeof value === "object" && value !== null && "$state" in value
}

/** Check if a value is a $template expression */
export function isTemplateExpr(value: unknown): value is TemplateExpr {
  return typeof value === "object" && value !== null && "$template" in value
}

/** Check if a value is a $item expression */
export function isItemExpr(value: unknown): value is ItemExpr {
  return typeof value === "object" && value !== null && "$item" in value
}
