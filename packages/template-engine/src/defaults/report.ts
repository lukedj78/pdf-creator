import type { Template } from "../schema/types"

export const reportTemplate: Template = {
  id: "default-report",
  name: "Monthly Report",
  version: 1,
  meta: {
    description: "Monthly report template with title, summary, data table, and key metrics",
    category: "business",
    tags: ["report", "monthly", "analytics"],
  },
  root: "doc",
  elements: {
    doc: {
      type: "Document",
      props: { title: "Monthly Report" },
      children: ["page-1"],
    },
    "page-1": {
      type: "Page",
      props: {
        size: "A4",
        orientation: "portrait",
        marginTop: 50,
        marginRight: 50,
        marginBottom: 50,
        marginLeft: 50,
      },
      children: [
        "title",
        "subtitle",
        "divider-1",
        "summary-title",
        "summary-text",
        "spacer-1",
        "metrics-title",
        "metrics-table",
        "spacer-2",
        "notes-title",
        "notes-text",
      ],
    },

    title: {
      type: "Heading",
      props: { text: { $state: "/report/title" }, level: "h1", align: "center" },
      children: [],
    },
    subtitle: {
      type: "Text",
      props: {
        text: { $state: "/report/period" },
        fontSize: 12,
        color: "#666666",
        align: "center",
      },
      children: [],
    },
    "divider-1": {
      type: "Divider",
      props: { thickness: 1, color: "#dddddd", marginTop: 16, marginBottom: 20 },
      children: [],
    },
    "summary-title": {
      type: "Heading",
      props: { text: "Executive Summary", level: "h2" },
      children: [],
    },
    "summary-text": {
      type: "Text",
      props: {
        text: { $state: "/report/summary" },
        fontSize: 11,
        lineHeight: 1.6,
      },
      children: [],
    },
    "spacer-1": {
      type: "Spacer",
      props: { height: 24 },
      children: [],
    },
    "metrics-title": {
      type: "Heading",
      props: { text: "Key Metrics", level: "h2" },
      children: [],
    },
    "metrics-table": {
      type: "Table",
      props: {
        columns: [
          { header: "Metric", width: "40%", align: "left" },
          { header: "Current", width: "20%", align: "right" },
          { header: "Previous", width: "20%", align: "right" },
          { header: "Change", width: "20%", align: "right" },
        ],
        rows: [
          ["Revenue", "$48,200", "$42,100", "+14.5%"],
          ["New Customers", "156", "132", "+18.2%"],
          ["Churn Rate", "2.1%", "2.8%", "-25.0%"],
          ["NPS Score", "72", "68", "+5.9%"],
        ],
        striped: true,
        borderColor: "#e5e5e5",
        headerBackgroundColor: "#f9fafb",
      },
      children: [],
    },
    "spacer-2": {
      type: "Spacer",
      props: { height: 24 },
      children: [],
    },
    "notes-title": {
      type: "Heading",
      props: { text: "Notes", level: "h2" },
      children: [],
    },
    "notes-text": {
      type: "Text",
      props: {
        text: { $state: "/report/notes" },
        fontSize: 11,
        lineHeight: 1.6,
        color: "#444444",
      },
      children: [],
    },
  },
  state: {
    report: {
      title: "Monthly Performance Report",
      period: "January 2024",
      summary: "This month saw significant growth across all key metrics. Revenue increased by 14.5% compared to the previous month, driven primarily by new enterprise accounts. Customer acquisition improved with 156 new customers, while churn decreased to 2.1%.",
      notes: "Data sourced from internal analytics platform. Revenue figures are preliminary and subject to final reconciliation.",
    },
  },
}
