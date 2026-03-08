import type { ImageProps } from "../schema/types"

export function ImageElement({ props }: { props: ImageProps }) {
  const src = typeof props.src === "string" ? props.src : ""

  if (!src) {
    return (
      <div
        style={{
          backgroundColor: "#f3f4f6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#9ca3af",
          fontSize: 12,
          width: props.width ?? "100%",
          height: props.height ?? 120,
        }}
      >
        Image placeholder
      </div>
    )
  }

  return (
    <img
      src={src}
      style={{
        maxWidth: "100%",
        width: props.width ?? undefined,
        height: props.height ?? undefined,
        objectFit: props.objectFit ?? undefined,
      }}
    />
  )
}
