import type { Template } from "../schema/types"
import { invoiceTemplate } from "./invoice"
import { reportTemplate } from "./report"
import { contractTemplate } from "./contract"

export { invoiceTemplate } from "./invoice"
export { reportTemplate } from "./report"
export { contractTemplate } from "./contract"

export const defaultTemplates: Template[] = [
  invoiceTemplate,
  reportTemplate,
  contractTemplate,
]
