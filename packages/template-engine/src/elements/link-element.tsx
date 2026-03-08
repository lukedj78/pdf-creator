import type { LinkProps } from "../schema/types"

export function LinkElement({ props }: { props: LinkProps }) {
  const text = typeof props.text === "string" ? props.text : ""
  const href = typeof props.href === "string" ? props.href : "#"

  return (
    <a
      href={href}
      style={{
        fontSize: props.fontSize ?? undefined,
        color: props.color ?? "#0066cc",
        textDecoration: "underline",
      }}
    >
      {text}
    </a>
  )
}
