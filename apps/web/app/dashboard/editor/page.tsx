import { EditorPageContent } from "./editor-page-content"

export default async function EditorPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>
}) {
  const { id } = await searchParams
  return <EditorPageContent templateId={id ?? null} />
}
