"use client"

import Blog from "@workspace/ui/components/landing/blog"
import Newsletter from "@workspace/ui/components/landing/newsletter"

const blogPosts = [
  {
    title: "Introducing AI-powered template generation",
    date: "March 5, 2026",
    href: "#",
  },
  {
    title: "How to generate 10,000 invoices per hour",
    date: "February 28, 2026",
    href: "#",
  },
  {
    title: "Template schema v2: charts, lists, and more",
    date: "February 15, 2026",
    href: "#",
  },
  {
    title: "Getting started with the TypeScript SDK",
    date: "February 1, 2026",
    href: "#",
  },
]

export default function BlogPage() {
  return (
    <div>
      <Blog
        posts={blogPosts}
        badge="Blog"
        heading="Latest articles"
        description="Updates, tutorials, and insights about document creation for developers."
      />
      <Newsletter />
    </div>
  )
}
