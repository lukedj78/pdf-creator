import type { Template } from "../schema/types"
import { invoiceTemplate } from "./invoice"
import { invoiceRepeatTemplate } from "./invoice-repeat"
import { reportTemplate } from "./report"
import { contractTemplate } from "./contract"

export { invoiceTemplate } from "./invoice"
export { invoiceRepeatTemplate } from "./invoice-repeat"
export { reportTemplate } from "./report"
export { contractTemplate } from "./contract"

export const defaultTemplates: Template[] = [
  invoiceTemplate,
  invoiceRepeatTemplate,
  reportTemplate,
  contractTemplate,
]
