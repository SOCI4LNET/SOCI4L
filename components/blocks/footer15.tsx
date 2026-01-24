'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { X, Github } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PAGE_GUTTER, CONTENT_MAX_WIDTH } from '@/lib/layout-constants'
import { Soci4LLogo } from '@/components/logos/soci4l-logo'

interface FooterLink {
  label: string
  href: string
  external?: boolean
}

const footerLinks = {
  product: [
    { label: 'Overview', href: 'overview' },
    { label: 'Assets', href: 'assets' },
    { label: 'Activity', href: 'activity' },
    { label: 'Social', href: 'social' },
    { label: 'Settings', href: 'settings' },
  ] as FooterLink[],
  resources: [
    { label: 'Docs', href: '#', external: false },
    { label: 'Support', href: '#', external: false },
    { label: 'Privacy', href: '#', external: false },
    { label: 'Terms', href: '#', external: false },
  ] as FooterLink[],
}

// Discord icon as SVG component (lucide-react doesn't have Discord icon)
const DiscordIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C2.451 6.018 1.73 7.58 1.43 9.175a.082.082 0 0 0-.031.057 19.9 19.9 0 0 0-.006 7.662.084.084 0 0 0 .031.058c.3 1.607 1.023 3.17 2.214 4.79a.075.075 0 0 0 .076.04c1.828-.427 3.583-.98 5.23-1.65a.076.076 0 0 1 .08.028l1.125 1.65a.076.076 0 0 1-.032.105 19.803 19.803 0 0 1-5.954 1.28.078.078 0 0 0-.056.03c-.184.4-.39.785-.606 1.154a.076.076 0 0 0 .041.106c2.3.883 4.717 1.338 7.16 1.338s4.858-.455 7.16-1.338a.077.077 0 0 0 .041-.106c-.216-.37-.422-.754-.606-1.154a.076.076 0 0 0-.056-.03 19.715 19.715 0 0 1-5.954-1.28.077.077 0 0 1-.032-.105l1.125-1.65a.076.076 0 0 1 .08-.028c1.647.67 3.402 1.223 5.23 1.65a.076.076 0 0 0 .076-.04c1.19-1.617 1.913-3.18 2.214-4.79a.077.077 0 0 0 .031-.058 19.9 19.9 0 0 0-.006-7.662.077.077 0 0 0-.031-.057c-.3-1.608-1.023-3.17-2.214-4.79a.061.061 0 0 0-.032-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
)

const socialLinks = [
  { icon: X, label: 'X', href: 'https://twitter.com/soci4l', ariaLabel: 'Follow us on X' },
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
      toast.error('Please enter an email address')
      return
    }

    if (!validateEmail(email)) {
      toast.error('Please enter a valid email address')
      return
    }

    setIsSubmitting(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))
    
    toast.success('Thank you! We\'ll keep you updated.')
    setEmail('')
    setIsSubmitting(false)
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
                {footerLinks.product.map((link) => {
                  const href = address ? getDashboardLink(link.href) : '#'
                  return (
                    <li key={link.href}>
                      <Link
                        href={href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  )
                })}
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
                        rel="noopener noreferrer"
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
                const isDiscord = social.label === 'Discord'
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'text-muted-foreground hover:text-foreground transition-colors',
                      'p-2 rounded-md hover:bg-accent',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                    )}
                    aria-label={social.ariaLabel}
                  >
                    {isDiscord ? (
                      <Icon className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                    <span className="sr-only">{social.label}</span>
                  </a>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
