import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"
import { SiteHeader } from "@/components/site-header"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Avalanche Wallet Profile Hub",
  description: "Search and view Avalanche wallet profiles",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Providers>
          <SiteHeader />
          <main className="container mx-auto max-w-6xl px-4 md:px-6 py-8">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}
