import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ExternalLink, Github, Globe, Instagram, Link2, Linkedin, Send, Youtube } from 'lucide-react'
import { XIcon } from '@/components/icons/x-icon'
import { ProfileData } from './overview-panel-content'

interface OverviewLinksProps {
    links: NonNullable<ProfileData['socialLinks']>
}

export function OverviewLinks({ links }: OverviewLinksProps) {
    if (!links || links.length === 0) return null

    return (
        <Card className="bg-card border border-border/60 shadow-sm">
            <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Links</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {['Social', 'Portfolio', 'Contact', 'Other'].map(category => {
                        const categoryLinks = links.filter(l => (l.category || 'Other') === category)
                        if (!categoryLinks || categoryLinks.length === 0) return null

                        return (
                            <div key={category} className="space-y-3">
                                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">{category}</h4>
                                <div className="grid gap-2">
                                    {categoryLinks.map((link, i) => {
                                        const getIcon = (platform?: string) => {
                                            const p = platform?.toLowerCase() || ''
                                            if (p.includes('twitter') || p === 'x') return <XIcon className="h-4 w-4" />
                                            if (p.includes('github')) return <Github className="h-4 w-4" />
                                            if (p.includes('linkedin')) return <Linkedin className="h-4 w-4" />
                                            if (p.includes('instagram')) return <Instagram className="h-4 w-4" />
                                            if (p.includes('youtube')) return <Youtube className="h-4 w-4" />
                                            if (p.includes('telegram')) return <Send className="h-4 w-4" />
                                            if (p.includes('website') || p.includes('globe')) return <Globe className="h-4 w-4" />
                                            return <Link2 className="h-4 w-4" />
                                        }

                                        return (
                                            <a
                                                key={i}
                                                href={link.url}
                                                target="_blank"
                                                rel="noopener"
                                                className="group flex items-center justify-between p-3 rounded-xl bg-background/50 hover:bg-muted/50 transition-all border border-border/50 hover:border-primary/30 hover:shadow-sm"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/80 text-muted-foreground group-hover:text-primary transition-colors">
                                                        {getIcon(link.platform || link.type)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold truncate text-foreground">
                                                            {link.label || link.platform}
                                                        </p>
                                                        <p className="text-[11px] text-muted-foreground truncate opacity-70">
                                                            {link.url.replace(/^https?:\/\/(www\.)?/, '')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                                            </a>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
