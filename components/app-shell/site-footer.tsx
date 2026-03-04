'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Github } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Soci4LLogo } from '@/components/logos/soci4l-logo'
import { XIcon } from '@/components/icons/x-icon'
import { ModeToggle } from '@/components/mode-toggle'

interface FooterLink {
    label: string
    href: string
    external?: boolean
}

const footerLinks = {
    product: [
        { label: 'Overview', href: '/' },
        { label: 'Try Demo', href: '/demo' },
        { label: 'Premium', href: '/premium' },
        { label: 'Dashboard', href: '/dashboard' },
    ] as FooterLink[],
    resources: [
        { label: 'Docs', href: 'https://docs.soci4l.net', external: true },
        { label: 'Support', href: '#', external: false },
        { label: 'Privacy', href: '/privacy', external: false },
        { label: 'Terms', href: '/terms', external: false },
        { label: 'Brand Guidelines', href: '/brand', external: false },
    ] as FooterLink[],
}

function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

interface SiteFooterProps {
    className?: string
}

// Wordmark SVG — paths from /public/logos/wordmark.svg
function FooterWordmark() {
    return (
        <svg
            viewBox="0 0 203 52"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto"
            preserveAspectRatio="xMidYMid meet"
            aria-hidden
        >
            <path d="M18.49 51.56C14.92 51.56 11.81 50.84 9.14 49.41C6.48 47.97 4.36 45.97 2.78 43.4C1.2 40.83 0.28 37.83 0 34.4L7.5 33.91C7.82 36.27 8.47 38.26 9.45 39.89C10.42 41.51 11.7 42.73 13.27 43.54C14.84 44.35 16.67 44.76 18.76 44.76C20.85 44.76 22.51 44.49 23.9 43.96C25.29 43.43 26.35 42.65 27.1 41.63C27.84 40.61 28.21 39.38 28.21 37.95C28.21 36.52 27.86 35.17 27.17 34.06C26.48 32.95 25.22 31.93 23.42 31C21.61 30.07 18.97 29.12 15.5 28.15C12.12 27.22 9.36 26.18 7.23 25.02C5.1 23.86 3.55 22.43 2.57 20.71C1.6 19 1.11 16.87 1.11 14.32C1.11 11.5 1.77 9 3.09 6.85C4.41 4.7 6.31 3.02 8.79 1.81C11.27 0.609999 14.24 0 17.72 0C21.2 0 24.08 0.67 26.51 2.01C28.94 3.35 30.86 5.22 32.28 7.6C33.69 9.99 34.56 12.78 34.89 15.97L27.39 16.39C27.16 14.49 26.64 12.82 25.83 11.39C25.02 9.95 23.92 8.83 22.53 8.02C21.14 7.21 19.47 6.8 17.53 6.8C14.8 6.8 12.63 7.46 11.03 8.78C9.43 10.1 8.63 11.83 8.63 13.96C8.63 15.4 8.95 16.58 9.6 17.5C10.25 18.43 11.38 19.26 13 20C14.62 20.74 16.89 21.51 19.81 22.29C23.75 23.36 26.87 24.58 29.19 25.97C31.51 27.36 33.17 29.03 34.19 30.97C35.21 32.92 35.72 35.23 35.72 37.92C35.72 40.61 35 42.98 33.57 45.04C32.13 47.1 30.13 48.7 27.56 49.83C24.99 50.96 21.97 51.53 18.49 51.53V51.56Z" fill="currentColor" />
            <path d="M57.7101 51.5598C53.7701 51.5598 50.4501 50.5598 47.7401 48.5698C45.0301 46.5798 42.9601 43.6598 41.5201 39.8198C40.0801 35.9798 39.3701 31.3198 39.3701 25.8498C39.3701 20.3798 40.0901 15.5898 41.5201 11.7498C42.9601 7.90977 45.0301 4.98977 47.7401 2.99977C50.4501 1.00977 53.7701 0.00976562 57.7101 0.00976562C61.6501 0.00976562 64.9801 1.00977 67.7201 2.99977C70.4501 4.98977 72.5301 7.90977 73.9401 11.7498C75.3501 15.5998 76.0601 20.2998 76.0601 25.8498C76.0601 31.3998 75.3501 35.9698 73.9401 39.8198C72.5301 43.6698 70.4501 46.5798 67.7201 48.5698C64.9901 50.5598 61.6501 51.5598 57.7101 51.5598ZM57.7101 44.7498C60.0301 44.7498 61.9801 44.0598 63.5801 42.6698C65.1801 41.2798 66.3901 39.1698 67.2301 36.3498C68.0601 33.5298 68.4801 30.0298 68.4801 25.8598C68.4801 21.6898 68.0601 18.1798 67.2301 15.3298C66.4001 12.4798 65.1801 10.3498 63.5801 8.93977C61.9801 7.52977 60.0201 6.81977 57.7101 6.81977C55.4001 6.81977 53.4401 7.52977 51.8401 8.93977C50.2401 10.3498 49.0301 12.4798 48.1901 15.3298C47.3601 18.1798 46.9401 21.6898 46.9401 25.8598C46.9401 30.0298 47.3601 33.5298 48.1901 36.3498C49.0201 39.1798 50.2401 41.2798 51.8401 42.6698C53.4401 44.0598 55.3901 44.7498 57.7101 44.7498Z" fill="currentColor" />
            <path d="M98.4104 51.56C94.4304 51.56 91.0604 50.52 88.3004 48.43C85.5404 46.35 83.4504 43.38 82.0104 39.54C80.5704 35.7 79.8604 31.13 79.8604 25.85C79.8604 20.57 80.5804 15.94 82.0104 12.09C83.4504 8.25 85.5404 5.27 88.3004 3.16C91.0604 1.05 94.4304 0 98.4104 0C102.9 0 106.69 1.48 109.77 4.45C112.85 7.41 114.88 11.56 115.85 16.89L108.21 17.31C107.52 13.88 106.3 11.28 104.56 9.49C102.82 7.71 100.77 6.81 98.4104 6.81C96.0504 6.81 93.9904 7.55 92.3704 9.03C90.7504 10.51 89.5204 12.67 88.6904 15.49C87.8604 18.32 87.4404 21.77 87.4404 25.84C87.4404 29.91 87.8604 33.29 88.6904 36.09C89.5204 38.89 90.7504 41.04 92.3704 42.52C93.9904 44 96.0104 44.74 98.4104 44.74C100.96 44.74 103.13 43.77 104.94 41.82C106.75 39.87 107.95 37.03 108.55 33.27L116.12 33.62C115.29 39.27 113.32 43.67 110.21 46.82C107.11 49.97 103.17 51.54 98.4004 51.54L98.4104 51.56Z" fill="currentColor" />
            <path d="M157.09 50.4501V40.0301H133.6V33.7101L156.32 1.12012H164.38V33.2901H167.44L169.03 36.3601C169.17 36.5201 169.17 36.7601 169.03 36.9201L167.4 40.0301H164.38V50.4501H157.08H157.09ZM140.76 33.2801H157.09V10.8401L140.76 33.2801Z" fill="currentColor" />
            <path d="M202.01 47.0899V50.4499H173.87V1.10986H181.17V43.5699H202.01V47.0899Z" fill="currentColor" />
            <path d="M128.88 0V50.44H121.88V0H128.88Z" fill="currentColor" />
        </svg>
    )
}

export default function SiteFooter({ className }: SiteFooterProps = {}) {
    const [email, setEmail] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const currentYear = new Date().getFullYear()

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email.trim()) { toast.error('Please enter your email address'); return }
        if (!validateEmail(email)) { toast.error('Please enter a valid email address'); return }
        setIsSubmitting(true)
        try {
            const response = await fetch('/api/newsletter/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            })
            const data = await response.json()
            if (!response.ok) throw new Error(data.error || 'An error occurred')
            toast.success('Thank you! We will keep you informed.')
            setEmail('')
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'An error occurred while saving email')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        // Always dark — fixed very dark black regardless of theme
        <footer className={cn('w-full bg-[#0A0A0A] text-white relative overflow-hidden', className)}>

            {/* Main grid content */}
            <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-8 pt-16 pb-0">

                {/* 4-col top section */}
                <div className="grid grid-cols-1 gap-10 md:grid-cols-4 mb-16">

                    {/* Logo + tagline */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            {/* Force white combination logo ignoring theme invert */}
                            <img src="/logos/combination.svg" alt="SOCI4L" className="h-6 w-auto brightness-0 invert" aria-hidden />
                        </div>
                        <p className="text-sm text-white/40 leading-relaxed max-w-[200px]">
                            Turn your Avalanche wallet into a measurable public identity.
                        </p>
                    </div>

                    {/* Product */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-white">Product</h3>
                        <ul className="space-y-2.5">
                            {footerLinks.product.map((link) => (
                                <li key={link.href}>
                                    <Link href={link.href} className="text-sm text-white/40 hover:text-white transition-colors">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Resources */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-white">Resources</h3>
                        <ul className="space-y-2.5">
                            {footerLinks.resources.map((link) => (
                                <li key={link.label}>
                                    {link.external ? (
                                        <a href={link.href} target="_blank" rel="noopener" className="text-sm text-white/40 hover:text-white transition-colors">
                                            {link.label}
                                        </a>
                                    ) : (
                                        <Link href={link.href} className="text-sm text-white/40 hover:text-white transition-colors">
                                            {link.label}
                                        </Link>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Stay updated */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-white">Stay updated</h3>
                        <form onSubmit={handleEmailSubmit} className="flex gap-2">
                            <Input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-white/20 h-9 text-sm rounded-md"
                                aria-label="Email address"
                                disabled={isSubmitting}
                            />
                            <Button
                                type="submit"
                                size="sm"
                                disabled={isSubmitting}
                                className="bg-white text-black hover:bg-white/90 font-medium h-9 px-4 shrink-0 rounded-md"
                                aria-label="Subscribe to updates"
                            >
                                {isSubmitting ? '...' : 'Subscribe'}
                            </Button>
                        </form>
                    </div>
                </div>

                {/* Bottom bar: copyright + socials */}
                <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-8">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6 border-t border-white/10">
                        <p className="text-sm text-white/40">
                            © {currentYear} SOCI4L. All rights reserved.
                        </p>
                        <div className="flex items-center gap-1">
                            <a href="https://x.com/soci4lnet" target="_blank" rel="noopener"
                                className="p-2 rounded-md text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                                aria-label="Follow us on X">
                                <XIcon className="h-4 w-4" />
                            </a>
                            <a href="https://github.com/SOCI4LNET" target="_blank" rel="noopener"
                                className="p-2 rounded-md text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                                aria-label="View our GitHub">
                                <Github className="h-4 w-4" />
                            </a>
                            <div className="ml-1 pl-3 border-l border-white/10 h-6 flex items-center">
                                <ModeToggle />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Empty space (padding) as requested before the watermark */}
            <div className="h-4 md:h-10" />

            {/* SOCI4L watermark — max-width matching footer content exactly */}
            <div className="relative w-full flex justify-center items-end">
                {/* 
                  By using the exact same constraints as the content (max-w-7xl px-6 md:px-8),
                  the text aligns exactly with the content above it (the S and L edges).
                  The height scales automatically to the width without being cut.
                */}
                <div className="w-full max-w-7xl mx-auto px-6 md:px-8 text-white/[0.08]">
                    <FooterWordmark />
                </div>
            </div>
        </footer>
    )
}
