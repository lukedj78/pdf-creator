import { describe, it, expect } from "vitest"
import { PAGE_SIZES, getPageDimensions, getContentArea } from "../utils"

describe("PAGE_SIZES", () => {
  it("should have correct A4 dimensions", () => {
    expect(PAGE_SIZES.A4).toEqual({ width: 595, height: 842 })
  })

  it("should have correct A3 dimensions", () => {
    expect(PAGE_SIZES.A3).toEqual({ width: 842, height: 1191 })
  })

  it("should have correct A5 dimensions", () => {
    expect(PAGE_SIZES.A5).toEqual({ width: 420, height: 595 })
  })

  it("should have correct LETTER dimensions", () => {
    expect(PAGE_SIZES.LETTER).toEqual({ width: 612, height: 792 })
  })

  it("should have correct LEGAL dimensions", () => {
    expect(PAGE_SIZES.LEGAL).toEqual({ width: 612, height: 1008 })
  })

  it("should have correct TABLOID dimensions", () => {
    expect(PAGE_SIZES.TABLOID).toEqual({ width: 792, height: 1224 })
  })
})

describe("getPageDimensions", () => {
  it("should return A4 portrait dimensions by default", () => {
    const result = getPageDimensions({})
    expect(result).toEqual({ width: 595, height: 842 })
  })

  it("should return landscape dimensions", () => {
    const result = getPageDimensions({ orientation: "landscape" })
    expect(result).toEqual({ width: 842, height: 595 })
  })

  it("should handle LETTER size", () => {
    const result = getPageDimensions({ size: "LETTER" })
    expect(result).toEqual({ width: 612, height: 792 })
  })

  it("should handle LETTER landscape", () => {
    const result = getPageDimensions({ size: "LETTER", orientation: "landscape" })
    expect(result).toEqual({ width: 792, height: 612 })
  })

  it("should fallback to A4 for unknown size", () => {
    const result = getPageDimensions({ size: "UNKNOWN" as any })
    expect(result).toEqual({ width: 595, height: 842 })
  })

  it("should handle null size", () => {
    const result = getPageDimensions({ size: null })
    expect(result).toEqual({ width: 595, height: 842 })
  })

  it("should handle A3 landscape", () => {
    const result = getPageDimensions({ size: "A3", orientation: "landscape" })
    expect(result).toEqual({ width: 1191, height: 842 })
  })
})

describe("getContentArea", () => {
  it("should return content area with default margins", () => {
    const result = getContentArea({})
    expect(result).toEqual({
      x: 40,
      y: 40,
      width: 595 - 80, // 515
      height: 842 - 80, // 762
    })
  })

  it("should respect custom margins", () => {
    const result = getContentArea({
      marginTop: 20,
      marginRight: 30,
      marginBottom: 50,
      marginLeft: 10,
    })
    expect(result).toEqual({
      x: 10,
      y: 20,
      width: 595 - 10 - 30, // 555
      height: 842 - 20 - 50, // 772
    })
  })

  it("should work with landscape orientation", () => {
    const result = getContentArea({
      orientation: "landscape",
      marginTop: 40,
      marginRight: 40,
      marginBottom: 40,
      marginLeft: 40,
    })
    expect(result).toEqual({
      x: 40,
      y: 40,
      width: 842 - 80,
      height: 595 - 80,
    })
  })

  it("should handle null margins as default 40", () => {
    const result = getContentArea({ marginTop: null, marginLeft: null })
    expect(result.y).toBe(40)
    expect(result.x).toBe(40)
  })
})
