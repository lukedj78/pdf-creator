import type { PageProps } from "../schema/types"

/** Page dimensions in points (72 DPI) */
export const PAGE_SIZES = {
  A3: { width: 842, height: 1191 },
  A4: { width: 595, height: 842 },
  A5: { width: 420, height: 595 },
  LETTER: { width: 612, height: 792 },
  LEGAL: { width: 612, height: 1008 },
  TABLOID: { width: 792, height: 1224 },
} as const

export function getPageDimensions(pageProps: PageProps): {
  width: number
  height: number
} {
  const size = (pageProps.size ?? "A4") as keyof typeof PAGE_SIZES
  const base = PAGE_SIZES[size] ?? PAGE_SIZES.A4

  if (pageProps.orientation === "landscape") {
    return { width: base.height, height: base.width }
  }

  return { ...base }
}

export function getContentArea(pageProps: PageProps): {
  width: number
  height: number
  x: number
  y: number
} {
  const { width, height } = getPageDimensions(pageProps)
  const mt = pageProps.marginTop ?? 40
  const mr = pageProps.marginRight ?? 40
  const mb = pageProps.marginBottom ?? 40
  const ml = pageProps.marginLeft ?? 40

  return {
    x: ml,
    y: mt,
    width: width - ml - mr,
    height: height - mt - mb,
  }
}
