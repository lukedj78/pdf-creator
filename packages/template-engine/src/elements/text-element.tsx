import type { TextProps } from "../schema/types"

export function TextElement({ props }: { props: TextProps }) {
  const text = typeof props.text === "string" ? props.text : ""

  const style: React.CSSProperties = {
    fontSize: props.fontSize ?? undefined,
    color: props.color ?? undefined,
    textAlign: props.align ?? undefined,
    fontWeight: props.fontWeight ?? undefined,
    fontStyle: props.fontStyle ?? undefined,
    lineHeight: props.lineHeight ?? undefined,
    whiteSpace: "pre-wrap",
    margin: 0,
  }

  return <p style={style}>{text}</p>
}
