import type { Metadata } from "next"
import { Inter, Playfair_Display, Outfit } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import Footer15 from "@/components/blocks/footer15"
import { SpeedInsights } from "@vercel/speed-insights/next"
import Script from "next/script"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" })
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" })

export const metadata: Metadata = {
  title: "SOCI4L - Web3 Profile & Link Hub",
  description: "SOCI4L turns your wallet into a measurable, privacy-first public profile. Create your Web3 profile with link analytics.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/logos/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/logos/icon.svg",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} ${playfair.variable} ${outfit.variable} ${inter.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            <div className="flex min-h-screen flex-col bg-background text-foreground">
              {children}
              <Footer15 className="mt-auto" />
            </div>
            <Toaster />
            <SpeedInsights />
            <Script id="yandex-metrika" strategy="afterInteractive">
              {`
                (function(m,e,t,r,i,k,a){
                    m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
                    m[i].l=1*new Date();
                    for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
                    k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
                })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=106506413', 'ym');

                ym(106506413, 'init', {
                    ssr: true,
                    webvisor: true,
                    clickmap: true,
                    ecommerce: "dataLayer",
                    accurateTrackBounce: true,
                    trackLinks: true
                });
              `}
            </Script>
            <noscript>
              <div>
                <img src="https://mc.yandex.ru/watch/106506413" style={{ position: 'absolute', left: '-9999px' }} alt="" />
              </div>
            </noscript>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}
