import type { SpacerProps, DividerProps, ListProps, PageNumberProps } from "../schema/types"

export function SpacerElement({ props }: { props: SpacerProps }) {
  return <div style={{ height: props.height ?? 20 }} />
}

export function DividerElement({ props }: { props: DividerProps }) {
  return (
    <hr
      style={{
        border: "none",
        borderTop: `${props.thickness ?? 1}px solid ${props.color ?? "#e5e5e5"}`,
        marginTop: props.marginTop ?? 0,
        marginBottom: props.marginBottom ?? 0,
      }}
    />
  )
}

export function ListElement({ props }: { props: ListProps }) {
  const Tag = props.ordered ? "ol" : "ul"
  const items = (props.items ?? []).map((item) =>
    typeof item === "string" ? item : ""
  )

  return (
    <Tag
      style={{
        paddingLeft: 24,
        fontSize: props.fontSize ?? undefined,
        color: props.color ?? undefined,
      }}
    >
      {items.map((item, i) => (
        <li key={i} style={{ marginBottom: props.spacing ?? 4 }}>
          {item}
        </li>
      ))}
    </Tag>
  )
}

export function PageNumberElement({ props }: { props: PageNumberProps }) {
  const format = props.format ?? "{pageNumber} / {totalPages}"

  return (
    <div
      style={{
        fontSize: props.fontSize ?? 10,
        color: props.color ?? "#666666",
        textAlign: props.align ?? "center",
      }}
    >
      {format}
    </div>
  )
}
