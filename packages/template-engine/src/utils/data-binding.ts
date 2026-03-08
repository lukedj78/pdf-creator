import { isExpression, isStateExpr, isTemplateExpr, isItemExpr } from "../schema/types"
import type { StateExpr, TemplateExpr, ItemExpr, CondExpr } from "../schema/types"

// ---------------------------------------------------------------------------
// JSON Pointer resolution (RFC 6901)
// ---------------------------------------------------------------------------

/**
 * Resolves a JSON Pointer path (e.g. "/user/name") against a state object.
 * Returns undefined if the path doesn't exist.
 */
export function resolvePointer(
  state: Record<string, unknown>,
  pointer: string
): unknown {
  if (!pointer.startsWith("/")) return undefined
  const parts = pointer.slice(1).split("/")
  let current: unknown = state
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined
    // Handle array indices
    if (Array.isArray(current)) {
      const idx = Number(part)
      if (Number.isNaN(idx)) return undefined
      current = current[idx]
    } else {
      current = (current as Record<string, unknown>)[part]
    }
  }
  return current
}

// ---------------------------------------------------------------------------
// Expression resolution
// ---------------------------------------------------------------------------

export type ResolveContext = {
  state: Record<string, unknown>
  item?: Record<string, unknown>
  index?: number
}

/**
 * Resolves a single expression to its value.
 */
export function resolveExpression(
  expr: unknown,
  ctx: ResolveContext
): unknown {
  if (!isExpression(expr)) return expr

  const obj = expr as Record<string, unknown>

  // $state
  if ("$state" in obj) {
    return resolvePointer(ctx.state, (obj as StateExpr).$state)
  }

  // $template
  if ("$template" in obj) {
    const tmpl = (obj as TemplateExpr).$template
    return tmpl.replace(/\$\{([^}]+)\}/g, (_, pointer: string) => {
      const value = resolvePointer(ctx.state, pointer)
      return value !== undefined ? String(value) : ""
    })
  }

  // $item
  if ("$item" in obj) {
    if (!ctx.item) return undefined
    const field = (obj as ItemExpr).$item
    if (field === "") return ctx.item
    return ctx.item[field]
  }

  // $index
  if ("$index" in obj) {
    return ctx.index ?? 0
  }

  // $cond
  if ("$cond" in obj) {
    const cond = obj as CondExpr
    const condValue = resolveExpression(cond.$cond, ctx)
    return condValue ? resolveExpression(cond.$then, ctx) : resolveExpression(cond.$else, ctx)
  }

  // $computed — not resolved client-side, return as-is
  if ("$computed" in obj) {
    return expr
  }

  return expr
}

/**
 * Resolves all expression values in a props object.
 * Returns a new object with expressions replaced by their resolved values.
 */
export function resolveProps(
  props: Record<string, unknown>,
  ctx: ResolveContext
): Record<string, unknown> {
  const resolved: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(props)) {
    if (isExpression(value)) {
      resolved[key] = resolveExpression(value, ctx)
    } else if (Array.isArray(value)) {
      resolved[key] = value.map((item) => {
        if (isExpression(item)) return resolveExpression(item, ctx)
        if (typeof item === "object" && item !== null && !Array.isArray(item)) {
          return resolveProps(item as Record<string, unknown>, ctx)
        }
        return item
      })
    } else {
      resolved[key] = value
    }
  }
  return resolved
}

/**
 * Evaluates a visibility condition against state.
 */
export function evaluateVisible(
  visible: { $state: string; eq: unknown },
  ctx: ResolveContext
): boolean {
  const value = resolvePointer(ctx.state, visible.$state)
  return value === visible.eq
}
