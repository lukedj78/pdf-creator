import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import { Badge } from "@workspace/ui/components/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { cn } from "@workspace/ui/lib/utils";

const FAQ_DATA = [
  {
    question: "What is Pdf Creator?",
    answer:
      "Pdf Creator is a SaaS platform for designing JSON specs compatible with @json-render/react-pdf. Design templates visually, generate them with AI, or integrate via REST API and TypeScript SDK.",
  },
  {
    question: "How does the API work?",
    answer:
      "Send a POST request with your template ID and data object. The API merges your data into the template and returns a json-render compatible JSON spec. Response times are typically under 100ms.",
  },
  {
    question: "Do I need to know HTML/CSS?",
    answer:
      "No. The visual editor lets you design templates without code. You can also describe what you want in natural language and our AI agent will build the template for you.",
  },
  {
    question: "What template elements are supported?",
    answer:
      "Pdf Creator supports 12 element types: Text, Heading, Image, Link, Table, List, View, Row, Column, Spacer, Divider, and PageNumber. All elements support props-based styling and data binding.",
  },
  {
    question: "Is there a free tier?",
    answer:
      "Yes. The free plan includes 100 spec exports per month, 3 templates, and full API access. No credit card required to get started.",
  },
  {
    question: "Can I use it with my existing stack?",
    answer:
      "Absolutely. The REST API works with any language or framework. For JavaScript and TypeScript projects, our npm SDK provides a typed, zero-config experience with autocompletion.",
  },
];

const STAGGER_DELAYS = [
  "delay-100",
  "delay-200",
  "delay-300",
  "delay-400",
  "delay-500",
  "delay-500",
] as const;

export default function Faq() {
  return (
    <section>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:py-24 py-8 flex flex-col gap-16">
        <div className="flex flex-col gap-4 items-center animate-in fade-in slide-in-from-top-10 duration-1000 delay-100 ease-in-out fill-mode-both">
          <Badge
            variant="outline"
            className="text-sm h-auto py-1 px-3 border-0 outline outline-border"
          >
            FAQs
          </Badge>
          <h2 className="text-5xl font-medium text-center max-w-lg">
            Got questions? We&apos;ve got answers
          </h2>
          <p className="text-base text-muted-foreground text-center max-w-md">
            Everything you need to know about Pdf Creator
          </p>
        </div>
        <div>
          <Accordion className="w-full flex flex-col gap-6">
            {FAQ_DATA.map((faq, index) => (
              <AccordionItem
                key={`item-${index}`}
                value={`item-${index}`}
                className={cn(
                  "p-6 border border-border rounded-2xl flex flex-col gap-3 group/item data-[open]:bg-accent hover:bg-accent/50 transition-colors animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both",
                  STAGGER_DELAYS[index]
                )}
              >
                <AccordionTrigger className="p-0 text-xl font-medium hover:no-underline **:data-[slot=accordion-trigger-icon]:hidden cursor-pointer">
                  {faq.question}
                  <HugeiconsIcon
                    icon={PlusSignIcon}
                    size={24}
                    className="shrink-0 transition-transform duration-300 group-data-[open]/item:rotate-45"
                  />
                </AccordionTrigger>
                <AccordionContent className="p-0 text-muted-foreground text-base">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}

export { Faq };
