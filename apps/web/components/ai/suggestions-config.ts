/**
 * Shared suggestion prompts for AI chat interfaces.
 *
 * DOCUMENT_SUGGESTIONS — shown when starting from scratch (empty template).
 * Each contains a detailed prompt that guides the AI to produce a complete,
 * professional document with proper structure and sample data.
 *
 * EDIT_SUGGESTIONS — shown when the template already has content.
 * Quick modification prompts for refining an existing template.
 */

export type DocumentSuggestion = {
  label: string
  description: string
  prompt: string
}

export const DOCUMENT_SUGGESTIONS: DocumentSuggestion[] = [
  {
    label: "Invoice",
    description: "Professional with line items & totals",
    prompt: `Create a complete professional invoice template. Structure:
- Header: company name, address, contact info (phone, email, website)
- Invoice title with number and date fields
- Billing section: two columns "From" and "To" with full company/client details
- Items table: columns Description, Quantity, Unit Price, Amount (numbers right-aligned)
- Totals section: right-aligned subtotal, tax rate + amount, total in bold larger font
- Footer: payment terms, bank details (IBAN, BIC), thank you note
- Page number at bottom center
Use $state data binding for ALL dynamic fields and populate with realistic sample data.`,
  },
  {
    label: "Report",
    description: "Structured with sections & data",
    prompt: `Create a complete professional report template. Structure:
- Cover section: report title (large heading), subtitle, author name, date, organization
- Executive summary section with a brief paragraph
- Table of contents with section names
- Multiple content sections with headings (h2), subheadings (h3), body paragraphs
- A data table with relevant metrics (5+ rows)
- A key findings list (bulleted)
- Conclusions section
- Footer with page numbers and document reference
Use $state data binding for all dynamic content and populate with realistic business data.`,
  },
  {
    label: "Contract",
    description: "Legal agreement with clauses",
    prompt: `Create a complete professional contract template. Structure:
- Header: document title "SERVICE AGREEMENT" or similar
- Parties section: two-column layout with Party A and Party B details
- Date and reference number
- Multiple numbered clauses: Scope of Work, Duration, Compensation, Confidentiality, Termination, Liability, Governing Law
- Each clause as a heading + body text with proper legal formatting
- Signature block: two columns with signature line, printed name, title, date for each party
- Footer with page numbers
Use $state data binding for party names, dates, amounts and populate with realistic sample data.`,
  },
  {
    label: "Resume / CV",
    description: "Clean layout with sections",
    prompt: `Create a complete professional resume/CV template. Structure:
- Header: full name (large heading), job title, contact row (email, phone, location, linkedin)
- Professional summary paragraph
- Work experience section: 2-3 positions, each with company, role, dates, bullet points of achievements
- Education section: degree, institution, year
- Skills section: organized list or tags
- Languages section if relevant
Use $state data binding for all personal data and populate with realistic sample data. Keep typography clean and scannable.`,
  },
  {
    label: "Letter",
    description: "Formal business correspondence",
    prompt: `Create a complete professional business letter template. Structure:
- Sender info: company name, address, contact details at top
- Date
- Recipient: name, title, company, address
- Subject line in bold
- Salutation
- Body: 3-4 paragraphs of letter content
- Closing and signature block (name, title, company)
- Footer with company registration info
Use $state data binding for all dynamic fields and populate with realistic sample data.`,
  },
  {
    label: "Certificate",
    description: "Achievement or completion award",
    prompt: `Create a complete professional certificate template. Structure:
- Centered layout with generous margins
- Organization name/logo placeholder at top
- "Certificate of Achievement" or similar as large centered title
- "This certifies that" text
- Recipient name in large, prominent font
- Description of achievement/completion
- Date of issue
- Two-column signature block: authority name + title on each side
- Certificate number/ID at bottom
- Subtle decorative dividers between sections
Use $state data binding and populate with realistic sample data. Use elegant, centered typography.`,
  },
]

export type EditSuggestion = {
  label: string
  prompt: string
}

export const EDIT_SUGGESTIONS: EditSuggestion[] = [
  { label: "Improve layout", prompt: "Analyze the current template and improve the layout: better spacing, alignment, typography hierarchy, and visual balance." },
  { label: "Add header", prompt: "Add a professional header section to the template with company name and contact info." },
  { label: "Add footer", prompt: "Add a footer with page numbers and relevant footer content." },
  { label: "Add a table", prompt: "Add a well-formatted data table with sample data relevant to this template." },
  { label: "Make it prettier", prompt: "Improve the visual design: refine typography, spacing, colors, and overall polish. Make it look premium and print-ready." },
  { label: "Add sample data", prompt: "Add realistic sample data using $state bindings for all dynamic content in the template." },
]
