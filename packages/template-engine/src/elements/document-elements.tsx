import type { DocumentProps, PageProps } from "../schema/types"
import type { ReactNode } from "react"

/**
 * Document element — transparent wrapper for preview.
 * In json-render/react-pdf this becomes the PDF Document component.
 * For our preview renderer it just passes children through.
 */
export function DocumentElement({
  children,
}: {
  props: DocumentProps
  children?: ReactNode
}) {
  return <>{children}</>
}

/** Page size dimensions in points (72 DPI) */
const PAGE_SIZES: Record<string, { width: number; height: number }> = {
  A3: { width: 842, height: 1191 },
  A4: { width: 595, height: 842 },
  A5: { width: 420, height: 595 },
  LETTER: { width: 612, height: 792 },
  LEGAL: { width: 612, height: 1008 },
  TABLOID: { width: 792, height: 1224 },
}

/**
 * Page element — renders as a white page with dimensions and margins.
 */
export function PageElement({
  props,
  children,
  scale = 1,
}: {
  props: PageProps
  children?: ReactNode
  scale?: number
}) {
  const size = PAGE_SIZES[props.size ?? "A4"] ?? PAGE_SIZES.A4!
  const isLandscape = props.orientation === "landscape"
  const width = isLandscape ? size.height : size.width
  const height = isLandscape ? size.width : size.height

  return (
    <div
      style={{
        width: width * scale,
        minHeight: height * scale,
        backgroundColor: props.backgroundColor ?? "#ffffff",
        color: "#000000",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: 12,
        lineHeight: 1.5,
        boxSizing: "border-box",
        paddingTop: (props.marginTop ?? 40) * scale,
        paddingRight: (props.marginRight ?? 40) * scale,
        paddingBottom: (props.marginBottom ?? 40) * scale,
        paddingLeft: (props.marginLeft ?? 40) * scale,
        overflow: "hidden",
        position: "relative",
      }}
    >
      {children}
    </div>
  )
}
