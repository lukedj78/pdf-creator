import type { ElementType } from "../schema/types"
import type { ComponentType } from "react"

type ElementComponent = ComponentType<{
  props: Record<string, unknown>
  styles?: Record<string, unknown>
  children?: React.ReactNode
}>

const registry = new Map<string, ElementComponent>()

export function registerElement(type: string, component: ElementComponent) {
  registry.set(type, component)
}

export function getElementComponent(
  type: ElementType
): ElementComponent | undefined {
  return registry.get(type)
}

export function getRegistry(): ReadonlyMap<string, ElementComponent> {
  return registry
}
