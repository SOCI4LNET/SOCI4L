import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"
import { Toaster } from "@/components/ui/sonner"
import Footer15 from "@/components/blocks/footer15"
import { SpeedInsights } from "@vercel/speed-insights/next"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Soci4l - Web3 Profile & Link Hub",
  description: "Soci4l turns your wallet into a measurable, privacy-first public profile. Create your Web3 profile with link analytics.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <div className="flex min-h-screen flex-col">
            {children}
            <Footer15 className="mt-auto" />
          </div>
          <Toaster />
          <SpeedInsights />
        </Providers>
      </body>
    </html>
  )
}
