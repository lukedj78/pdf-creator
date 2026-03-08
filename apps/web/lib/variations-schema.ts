import { z } from "zod"

export const variationSchema = z.object({
  label: z.string().describe("Short label for this variation, e.g. 'Bold & Dark' or 'Compact Layout'"),
  props: z.record(z.unknown()).describe("Updated element props for this variation"),
})

export const variationsResultSchema = z.object({
  variations: z.array(variationSchema).min(1).max(4),
})
