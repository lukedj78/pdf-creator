import type { ViewProps, RowProps, ColumnProps } from "../schema/types"
import type { ReactNode } from "react"

export function ViewElement({
  props,
  children,
}: {
  props: ViewProps
  children?: ReactNode
}) {
  return (
    <div
      style={{
        padding: props.padding ?? undefined,
        paddingTop: props.paddingTop ?? undefined,
        paddingBottom: props.paddingBottom ?? undefined,
        paddingLeft: props.paddingLeft ?? undefined,
        paddingRight: props.paddingRight ?? undefined,
        margin: props.margin ?? undefined,
        backgroundColor: props.backgroundColor ?? undefined,
        borderWidth: props.borderWidth ?? undefined,
        borderColor: props.borderColor ?? undefined,
        borderStyle: props.borderWidth ? "solid" : undefined,
        borderRadius: props.borderRadius ?? undefined,
        flex: props.flex ?? undefined,
        alignItems: props.alignItems ?? undefined,
        justifyContent: props.justifyContent ?? undefined,
        display: props.alignItems || props.justifyContent ? "flex" : undefined,
        flexDirection: props.alignItems || props.justifyContent ? "column" : undefined,
      }}
    >
      {children}
    </div>
  )
}

export function RowElement({
  props,
  children,
}: {
  props: RowProps
  children?: ReactNode
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        gap: props.gap ?? undefined,
        alignItems: props.alignItems ?? undefined,
        justifyContent: props.justifyContent ?? undefined,
        padding: props.padding ?? undefined,
        flex: props.flex ?? undefined,
        flexWrap: props.wrap ? "wrap" : undefined,
      }}
    >
      {children}
    </div>
  )
}

export function ColumnElement({
  props,
  children,
}: {
  props: ColumnProps
  children?: ReactNode
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: props.gap ?? undefined,
        alignItems: props.alignItems ?? undefined,
        justifyContent: props.justifyContent ?? undefined,
        padding: props.padding ?? undefined,
        flex: props.flex ?? undefined,
      }}
    >
      {children}
    </div>
  )
}
