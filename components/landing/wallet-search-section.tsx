'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Loader2, Wallet, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"

interface SearchResult {
    address: string
    slug: string | null
    displayName: string | null
    primaryRole: string | null
}

export function WalletSearchSection() {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<SearchResult[]>([])
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)
    const router = useRouter()

    // Simple debounce
    const [debouncedQuery, setDebouncedQuery] = useState(query)
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(query), 300)
        return () => clearTimeout(timer)
    }, [query])

    useEffect(() => {
        if (!debouncedQuery || debouncedQuery.length < 2) {
            setResults([])
            setOpen(false) // Close results if query is too short
            return
        }

        const fetchResults = async () => {
            setLoading(true)
            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
                const data = await res.json()
                setResults(data.results || [])
                setOpen(true)
            } catch (error) {
                console.error(error)
            } finally {
                setLoading(false)
            }
        }

        fetchResults()
    }, [debouncedQuery])

    const handleSelect = (result: SearchResult) => {
        const target = result.slug ? `/p/${result.slug}` : `/p/${result.address}`
        router.push(target)
    }

    // Direct navigation for generic Enter press if address is typed
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !results.length && query.startsWith('0x')) {
            router.push(`/p/${query}`)
        }
    }

    return (
        <section className="w-full py-24 relative">
            <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="max-w-3xl space-y-10 w-full"
                >
                    <div className="space-y-2">
                        <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground">
                            The Social Layer of Avalanche
                        </h2>
                        <p className="max-w-xl mx-auto text-sm text-muted-foreground">
                            Search by wallet address or username.
                        </p>
                    </div>

                    <div className="relative max-w-xl mx-auto w-full group z-20">
                        {/* Premium Gradient Border Wrapper */}
                        <div className="relative p-[1px] rounded-xl bg-gradient-to-b from-border/50 to-border/10 shadow-2xl overflow-visible transition-all duration-300 hover:from-primary/50 hover:to-primary/10">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />

                            <Command
                                shouldFilter={false}
                                className="rounded-xl border-none bg-background/80 backdrop-blur-xl shadow-none overflow-visible"
                            >
                                <div className="flex items-center px-2" cmdk-input-wrapper="">
                                    <Search className="mr-2 h-5 w-5 shrink-0 opacity-50" />
                                    <input
                                        value={query}
                                        onChange={(e) => {
                                            setQuery(e.target.value)
                                            setOpen(!!e.target.value)
                                        }}
                                        onKeyDown={handleKeyDown}
                                        className="flex h-14 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
                                        placeholder="Search address or username..."
                                    />
                                    {loading && <Loader2 className="h-4 w-4 animate-spin opacity-50 ml-2" />}
                                </div>

                                <div className="relative">
                                    {open && results.length > 0 && (
                                        <div className="absolute top-2 left-0 right-0 bg-popover border border-border rounded-xl overflow-hidden shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200 text-popover-foreground">
                                            <CommandList>
                                                <CommandGroup heading="Results">
                                                    {results.map((result) => (
                                                        <CommandItem
                                                            key={result.address}
                                                            onSelect={() => handleSelect(result)}
                                                            className="flex items-center gap-4 p-3 cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground"
                                                        >
                                                            <div className="h-9 w-9 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground shrink-0">
                                                                <Wallet className="w-4 h-4" />
                                                            </div>
                                                            <div className="flex-1 min-w-0 flex flex-col">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-medium text-foreground truncate">
                                                                        {result.displayName || 'Anonymous'}
                                                                    </span>
                                                                    {result.slug && (
                                                                        <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded-full text-muted-foreground font-mono border border-border">
                                                                            @{result.slug}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs text-muted-foreground/60 font-mono truncate">
                                                                        {result.address}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <ArrowRight className="w-4 h-4 opacity-50 ml-auto" />
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </div>
                                    )}
                                </div>
                            </Command>
                        </div>
                    </div>

                    <div className="flex flex-wrap justify-center items-center gap-4 text-sm text-muted-foreground pt-2 relative z-10">
                        <span className="opacity-60 text-xs font-medium uppercase tracking-wider">Try:</span>
                        <div className="flex gap-2">
                            {['0x8ab...', 'pixel-art'].map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => setQuery(tag)}
                                    className="px-4 py-1.5 rounded-full bg-muted/50 border border-border/50 hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-all font-mono text-xs shadow-sm text-muted-foreground"
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>

                </motion.div>
            </div>
        </section>
    )
}
