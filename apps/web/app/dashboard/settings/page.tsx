import { SettingsPageContent } from "./settings-page-content"

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  return <SettingsPageContent tab={tab ?? null} />
}
