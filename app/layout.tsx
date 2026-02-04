import type { Metadata } from "next"
import { Playfair_Display, Outfit } from "next/font/google"
import { GeistSans } from "geist/font/sans"
import "./globals.css"
import { Providers } from "./providers"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { SpeedInsights } from "@vercel/speed-insights/next"
import Script from "next/script"

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" })
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" })

export const metadata: Metadata = {
  metadataBase: new URL('https://soci4l.com'),
  title: {
    default: "SOCI4L - Web3 Profile & Link Hub",
    template: "%s | SOCI4L"
  },
  description: "SOCI4L turns your wallet into a measurable, privacy-first public profile. Create your Web3 profile with link analytics.",
  keywords: ["Web3", "Profile", "Link Hub", "Crypto", "Blockchain", "Avalanche", "NFT", "DeFi"],
  authors: [{ name: "SOCI4L" }],
  creator: "SOCI4L",
  publisher: "SOCI4L",
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://soci4l.com',
    siteName: 'SOCI4L',
    title: 'SOCI4L - Web3 Profile & Link Hub',
    description: 'Turn your wallet into a measurable, privacy-first public profile',
    images: [
      {
        url: '/api/og?displayName=SOCI4L&bio=Web3 Profile & Link Hub',
        width: 1200,
        height: 630,
        alt: 'SOCI4L - Web3 Profile & Link Hub',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SOCI4L - Web3 Profile & Link Hub',
    description: 'Turn your wallet into a measurable, privacy-first public profile',
    images: ['/api/og?displayName=SOCI4L&bio=Web3 Profile & Link Hub'],
  },
  icons: {
    icon: [
      { url: "/logos/icon.png", type: "image/png" },
    ],
    apple: "/logos/icon.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${GeistSans.className} ${playfair.variable} ${outfit.variable} ${GeistSans.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            <div className="flex min-h-screen flex-col bg-background text-foreground">
              {children}
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
