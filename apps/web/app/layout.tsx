import { Geist, Geist_Mono, Roboto } from "next/font/google"

import "@workspace/ui/globals.css"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { ThemeProvider } from "@/components/theme-provider"
import { MotionProvider } from "@/providers/motion-provider"
import { TRPCProvider } from "@/components/trpc-provider"
import { cn } from "@workspace/ui/lib/utils";

const roboto = Roboto({subsets:['latin'],variable:'--font-sans'})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", roboto.variable)}
    >
      <body>
        <ThemeProvider>
          <NuqsAdapter>
            <TRPCProvider>
              <MotionProvider>{children}</MotionProvider>
            </TRPCProvider>
          </NuqsAdapter>
        </ThemeProvider>
      </body>
    </html>
  )
}
