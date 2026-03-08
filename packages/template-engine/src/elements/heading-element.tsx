import type { HeadingProps } from "../schema/types"

const defaultSizes: Record<string, number> = {
  h1: 32,
  h2: 24,
  h3: 20,
  h4: 16,
}

export function HeadingElement({ props }: { props: HeadingProps }) {
  const text = typeof props.text === "string" ? props.text : ""
  const level = props.level ?? "h1"

  const style: React.CSSProperties = {
    fontSize: defaultSizes[level] ?? 16,
    color: props.color ?? undefined,
    textAlign: props.align ?? undefined,
    margin: 0,
  }

  const Tag = level as "h1" | "h2" | "h3" | "h4"
  return <Tag style={style}>{text}</Tag>
}
