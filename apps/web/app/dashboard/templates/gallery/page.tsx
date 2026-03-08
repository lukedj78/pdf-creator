"use client"

import { motion } from "framer-motion"
import { staggerContainer, staggerItem, hover, tap } from "@workspace/ui/lib/animation"
import { PageShell } from "@workspace/ui/components/shared/page-shell"
import { PageTitle } from "@workspace/ui/components/shared/page-title"
import { Button } from "@workspace/ui/components/button"
import { defaultTemplates } from "@workspace/template-engine/defaults"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, Add01Icon, File01Icon } from "@hugeicons/core-free-icons"
import { trpc } from "@/lib/trpc"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function GalleryPage() {
  const router = useRouter()
  const { data: presets, isLoading } = trpc.templates.gallery.useQuery()
  const utils = trpc.useUtils()

  const createMutation = trpc.templates.create.useMutation({
    onSuccess: () => {
      utils.templates.list.invalidate()
      router.push("/dashboard/templates")
    },
  })

  function handleUsePreset(preset: NonNullable<typeof presets>[number]) {
    // Find the matching default template to get the full spec
    const fullTemplate = defaultTemplates.find((t) => t.id === preset.id)
    const schema = fullTemplate
      ? { root: fullTemplate.root, elements: fullTemplate.elements, state: fullTemplate.state, version: fullTemplate.version, meta: fullTemplate.meta }
      : { root: "", elements: {}, state: {} }

    createMutation.mutate({
      name: preset.name,
      description: preset.description,
      schema: schema as Record<string, unknown>,
    })
  }

  return (
    <PageShell>
      <motion.div variants={staggerItem}>
        <Link href="/dashboard/templates">
          <Button variant="ghost" size="sm">
            <HugeiconsIcon icon={ArrowLeft01Icon} data-icon="inline-start" />
            Back to Templates
          </Button>
        </Link>
      </motion.div>

      <PageTitle
        title="Template Gallery"
        subtitle="Start from a preset template and customize it to your needs."
      />

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        variants={staggerContainer(0.05)}
        initial="hidden"
        animate="visible"
      >
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-52 rounded-xl bg-muted animate-pulse" />
            ))
          : presets?.map((preset) => (
              <motion.div
                key={preset.id}
                variants={staggerItem}
                whileHover={hover.lift}
                whileTap={tap.press}
              >
                <Card size="sm">
                  <CardHeader>
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-1">
                      <HugeiconsIcon
                        icon={File01Icon}
                        size={20}
                        className="text-primary"
                      />
                    </div>
                    <CardTitle>{preset.name}</CardTitle>
                    <CardDescription>{preset.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {preset.pageSize}
                      </Badge>
                      <Badge variant="secondary">
                        {preset.elementCount} elements
                      </Badge>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => handleUsePreset(preset)}
                      disabled={createMutation.isPending}
                    >
                      <HugeiconsIcon icon={Add01Icon} data-icon="inline-start" />
                      Use Template
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
      </motion.div>
    </PageShell>
  )
}
