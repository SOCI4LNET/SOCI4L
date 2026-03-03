'use client'

import * as React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
    LinkIcon,
    BarChart,
    Settings,
    Wallet,
    Activity,
    Shield,
    Image as ImageIcon,
    User,
    CreditCard,
    PenTool
} from 'lucide-react'

import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

export function DashboardCommandMenu() {
    const [open, setOpen] = React.useState(false)
    const router = useRouter()
    const pathname = usePathname()

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
        }

        document.addEventListener('keydown', down)
        return () => document.removeEventListener('keydown', down)
    }, [])

    const runCommand = React.useCallback((command: () => unknown) => {
        setOpen(false)
        command()
    }, [])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="overflow-hidden p-0 shadow-2xl rounded-xl border border-white/10 bg-background/30 backdrop-blur-xl supports-[backdrop-filter]:bg-background/20 dark:bg-black/30 dark:supports-[backdrop-filter]:bg-black/20">
                <DialogTitle className="sr-only">Command Menu</DialogTitle>
                <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5 bg-transparent">
                    <CommandInput placeholder="Bir komut yazın veya arama yapın..." className="bg-transparent border-none focus:ring-0" />
                    <CommandList className="bg-transparent">
                        <CommandEmpty>Sonuç bulunamadı.</CommandEmpty>

                        <CommandGroup heading="Kısayollar">
                            <CommandItem onSelect={() => runCommand(() => router.push(`${pathname}?tab=links&action=add-link`))}>
                                <LinkIcon className="mr-2 h-4 w-4" />
                                <span>Link Ekle</span>
                            </CommandItem>
                            <CommandItem onSelect={() => runCommand(() => router.push(`${pathname}?tab=settings`))}>
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Set Slug</span>
                            </CommandItem>
                            <CommandItem onSelect={() => runCommand(() => router.push(`${pathname}?tab=builder`))}>
                                <PenTool className="mr-2 h-4 w-4" />
                                <span>Builder</span>
                            </CommandItem>
                        </CommandGroup>

                        <CommandSeparator className="bg-white/10 dark:bg-white/10" />

                        <CommandGroup heading="Paneller">
                            <CommandItem onSelect={() => runCommand(() => router.push(`${pathname}?tab=overview`))}>
                                <User className="mr-2 h-4 w-4" />
                                <span>Overview</span>
                            </CommandItem>
                            <CommandItem onSelect={() => runCommand(() => router.push(`${pathname}?tab=insights`))}>
                                <BarChart className="mr-2 h-4 w-4" />
                                <span>Insights</span>
                            </CommandItem>
                            <CommandItem onSelect={() => runCommand(() => router.push(`${pathname}?tab=assets`))}>
                                <Wallet className="mr-2 h-4 w-4" />
                                <span>Assets</span>
                            </CommandItem>
                            <CommandItem onSelect={() => runCommand(() => router.push(`${pathname}?tab=activity`))}>
                                <Activity className="mr-2 h-4 w-4" />
                                <span>Activity</span>
                            </CommandItem>
                            <CommandItem onSelect={() => runCommand(() => router.push(`${pathname}?tab=nfts`))}>
                                <ImageIcon className="mr-2 h-4 w-4" />
                                <span>NFTs</span>
                            </CommandItem>
                            <CommandItem onSelect={() => runCommand(() => router.push(`${pathname}?tab=safety`))}>
                                <Shield className="mr-2 h-4 w-4" />
                                <span>Safety</span>
                            </CommandItem>
                            <CommandItem onSelect={() => runCommand(() => router.push(`${pathname}?tab=billing`))}>
                                <CreditCard className="mr-2 h-4 w-4" />
                                <span>Billing</span>
                            </CommandItem>
                        </CommandGroup>

                    </CommandList>
                </Command>
            </DialogContent>
        </Dialog>
    )
}
