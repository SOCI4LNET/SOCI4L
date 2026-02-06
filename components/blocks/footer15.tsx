'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Github } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PAGE_GUTTER, CONTENT_MAX_WIDTH } from '@/lib/layout-constants'
import { Soci4LLogo } from '@/components/logos/soci4l-logo'
import { DiscordIcon } from '@/components/icons/discord-icon'
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
    { label: 'Dashboard', href: '/dashboard' },
  ] as FooterLink[],
  resources: [
    { label: 'Docs', href: 'https://docs.soci4l.com', external: true },
    { label: 'Support', href: 'https://discord.gg/soci4l', external: true },
    { label: 'Privacy', href: '/privacy', external: false },
    { label: 'Terms', href: '/terms', external: false },
    { label: 'Brand Guidelines', href: '/brand', external: false },
  ] as FooterLink[],
}

const socialLinks = [
  { icon: XIcon, label: 'X', href: 'https://twitter.com/soci4l', ariaLabel: 'Follow us on X' },
  { icon: Github, label: 'GitHub', href: 'https://github.com/soci4l', ariaLabel: 'View our GitHub' },
  { icon: DiscordIcon, label: 'Discord', href: 'https://discord.gg/soci4l', ariaLabel: 'Join our Discord' },
]

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

interface Footer15Props {
  className?: string
}

export default function Footer15({ className }: Footer15Props = {}) {
  const params = useParams()
  const address = params?.address as string | undefined
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const currentYear = new Date().getFullYear()

  const getDashboardLink = (tab: string) => {
    if (!address) return '#'
    return `/dashboard/${address}?tab=${tab}`
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim()) {
      toast.error('Please enter your email address')
      return
    }

    if (!validateEmail(email)) {
      toast.error('Please enter a valid email address')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'An error occurred')
      }

      toast.success('Thank you! We will keep you informed.')
      setEmail('')
    } catch (error) {
      console.error('Email subscription error:', error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'An error occurred while saving email'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <footer className={cn(
      'w-full border-t border-border bg-background',
      className
    )}>
      {/* Footer content */}
      <div className={cn(
        'w-full',
        PAGE_GUTTER,
        'py-12 md:py-16'
      )}>
        <div className={cn(
          'w-full',
          CONTENT_MAX_WIDTH,
          'mx-auto'
        )}>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {/* Left: Logo & Description */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Soci4LLogo variant="combination" width={120} height={23} />
              </div>
              <p className="text-sm text-muted-foreground">
                Wallet-first identity & links.
              </p>
            </div>

            {/* Product Links */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Product</h3>
              <ul className="space-y-2">
                {footerLinks.product.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources Links */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Resources</h3>
              <ul className="space-y-2">
                {footerLinks.resources.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: Stay Updated */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Stay updated</h3>
              <form onSubmit={handleEmailSubmit} className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1"
                    aria-label="Email address"
                    disabled={isSubmitting}
                  />
                  <Button
                    type="submit"
                    size="default"
                    disabled={isSubmitting}
                    aria-label="Subscribe to updates"
                  >
                    {isSubmitting ? '...' : 'Subscribe'}
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Bottom Row: Copyright & Social Icons */}
          <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 px-4 md:px-6">
            <p className="text-sm text-muted-foreground">
              © {currentYear} SOCI4L. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => {
                const Icon = social.icon
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener"
                    className={cn(
                      'text-muted-foreground hover:text-foreground transition-colors',
                      'p-2 rounded-md hover:bg-accent',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                    )}
                    aria-label={social.ariaLabel}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="sr-only">{social.label}</span>
                  </a>
                )
              })}
              <div className="ml-2 pl-4 border-l border-border h-6 flex items-center">
                <ModeToggle />
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
