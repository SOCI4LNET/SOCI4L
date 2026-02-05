'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, Link2, Eye, EyeOff, LayoutTemplate, Activity, ArrowUpRight, MousePointer2, Youtube, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

export function MockProfileVisual() {
    const [step, setStep] = useState(0)
    const [isPrivate, setIsPrivate] = useState(true)
    const [clicks, setClicks] = useState({ portfolio: 0, twitter: 0, youtube: 0, linkedin: 0 })
    const [links, setLinks] = useState([
        { id: 'portfolio', title: 'Portfolio Website', subtitle: 'My personal work', icon: ArrowUpRight, color: 'text-muted-foreground', bg: 'bg-background' },
        { id: 'twitter', title: 'X', subtitle: '@soci4lnet', icon: Link2, color: 'text-muted-foreground', bg: 'bg-background' },
        { id: 'linkedin', title: 'LinkedIn', subtitle: 'Professional network', icon: Link2, color: 'text-muted-foreground', bg: 'bg-background' }
    ])

    // Cursor position state
    const [cursorPos, setCursorPos] = useState({ x: 200, y: 400, opacity: 0 })
    const [isGrabbing, setIsGrabbing] = useState(false)

    useEffect(() => {
        let mounted = true

        const sequence = async () => {
            // --- RESET ---
            if (!mounted) return
            setStep(0)
            setIsPrivate(true)
            setClicks({ portfolio: 0, twitter: 0, youtube: 0, linkedin: 0 })
            setLinks([
                { id: 'portfolio', title: 'Portfolio Website', subtitle: 'My personal work', icon: ArrowUpRight, color: 'text-muted-foreground', bg: 'bg-background' },
                { id: 'twitter', title: 'X', subtitle: '@avax', icon: Link2, color: 'text-muted-foreground', bg: 'bg-background' },
                { id: 'linkedin', title: 'LinkedIn', subtitle: 'Professional network', icon: Link2, color: 'text-muted-foreground', bg: 'bg-background' }
            ])
            setCursorPos({ x: 400, y: 400, opacity: 0 })
            setIsGrabbing(false)

            await new Promise(r => setTimeout(r, 1000))
            if (!mounted) return

            // --- STEP 1: LOAD ASSETS ---
            setStep(1) // Assets appear
            await new Promise(r => setTimeout(r, 1000))
            if (!mounted) return

            setStep(2) // Initial links appear
            await new Promise(r => setTimeout(r, 1000))
            if (!mounted) return

            // --- STEP 3: DRAG IN NEW LINK (YouTube) ---
            // Cursor appears bottom right (outside)
            setCursorPos({ x: 500, y: 350, opacity: 1 })
            await new Promise(r => setTimeout(r, 500))
            if (!mounted) return

            // Cursor moves to "drag source" (imaginary sidebar logic)
            setCursorPos({ x: 580, y: 250, opacity: 1 })
            await new Promise(r => setTimeout(r, 800))
            if (!mounted) return

            // "Grab" item
            setIsGrabbing(true)
            setStep(3) // YouTube link appears attached to cursor
            await new Promise(r => setTimeout(r, 200))
            if (!mounted) return

            // Drag to list (Bottom position)
            // Header(~80) + Assets(~100) + 3 Links(~60*3=180) = ~360y
            // Target align with left padding (p-6) + card padding (p-3) + grip width (~10) ≈ 55px
            setCursorPos({ x: 55, y: 380, opacity: 1 })
            await new Promise(r => setTimeout(r, 800))
            if (!mounted) return

            // Drop item into list (Update state)
            setStep(4) // Link snaps into list
            setIsGrabbing(false)
            setLinks(prev => {
                // Prevention check: if already exists, don't add
                if (prev.find(l => l.id === 'youtube')) return prev
                return [
                    ...prev,
                    { id: 'youtube', title: 'YouTube Channel', subtitle: 'Latest tutorials', icon: Youtube, color: 'text-red-500', bg: 'bg-red-500/10' }
                ]
            })
            await new Promise(r => setTimeout(r, 500))
            if (!mounted) return


            // --- STEP 4: REORDER LINKS ---
            // Move cursor to the new link (now at bottom, index 3)
            // Align with grip handle (left side)
            setCursorPos({ x: 55, y: 420, opacity: 1 })
            await new Promise(r => setTimeout(r, 600))
            if (!mounted) return

            // Grab
            setIsGrabbing(true)
            await new Promise(r => setTimeout(r, 200))
            if (!mounted) return

            // Drag up to top (index 0 position)
            // Header(~80) + Assets(~100) = ~180y
            setCursorPos({ x: 55, y: 200, opacity: 1 })
            await new Promise(r => setTimeout(r, 800))
            if (!mounted) return

            // Permute list (YouTube to top)
            setLinks(prev => {
                const newLinks = [...prev]
                const ytIndex = newLinks.findIndex(l => l.id === 'youtube')
                if (ytIndex > -1) {
                    const yt = newLinks[ytIndex]
                    newLinks.splice(ytIndex, 1) // remove from wherever it is
                    newLinks.unshift(yt) // add to front
                }
                return newLinks
            })
            await new Promise(r => setTimeout(r, 400)) // settle
            if (!mounted) return

            // Release
            setIsGrabbing(false)
            await new Promise(r => setTimeout(r, 500))
            if (!mounted) return


            // --- STEP 5: PUBLISH ---
            // Move to toggle (Top Right)
            // Toggle is loosely at top right of container padding
            setCursorPos({ x: 510, y: 45, opacity: 1 })
            await new Promise(r => setTimeout(r, 1000))
            if (!mounted) return

            // Click
            setIsPrivate(false)
            await new Promise(r => setTimeout(r, 1000))
            if (!mounted) return


            // --- STEP 6: ACTIVITY ---
            // Cursor moves away
            setCursorPos({ x: 550, y: 450, opacity: 0 })

            // Stats boost
            setStep(6)
            setClicks({ portfolio: 12, twitter: 8, youtube: 45, linkedin: 5 })
            await new Promise(r => setTimeout(r, 800))
            if (!mounted) return
            setClicks({ portfolio: 128, twitter: 94, youtube: 842, linkedin: 67 })

            await new Promise(r => setTimeout(r, 8000))
            if (mounted) sequence()
        }

        sequence()
        return () => { mounted = false }
    }, [])

    return (
        <div className="w-full max-w-[600px] bg-card/95 backdrop-blur-sm rounded-xl border border-border/60 shadow-xl dark:shadow-none p-6 relative overflow-hidden font-sans select-none">

            {/* Custom Cursor Overlay */}
            <motion.div
                className="absolute z-50 pointer-events-none"
                animate={{
                    x: cursorPos.x,
                    y: cursorPos.y,
                    opacity: cursorPos.opacity
                }}
                transition={{
                    duration: 0.8,
                    ease: "easeInOut",
                    opacity: { duration: 0.3 }
                }}
            >
                <div className="relative">
                    <MousePointer2
                        className={cn(
                            "w-6 h-6 text-foreground fill-foreground drop-shadow-md dark:drop-shadow-none transition-transform duration-200",
                            isGrabbing && "scale-90 -rotate-12"
                        )}
                    />

                    {/* Dragged Item Ghost */}
                    <AnimatePresence>
                        {step === 3 && isGrabbing && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                className="absolute -top-2 -left-2 w-64 p-3 rounded-lg bg-card border border-border/60 shadow-xl dark:shadow-none flex items-center gap-3"
                            >
                                <GripVertical className="w-4 h-4 text-muted-foreground/30" />
                                <div className="w-9 h-9 rounded-md bg-red-500/10 flex items-center justify-center shrink-0">
                                    <Youtube className="w-4 h-4 text-red-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-foreground">YouTube Channel</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>


            {/* HEADER */}
            <div className="flex items-start justify-between mb-8 relative z-10">
                <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14 border-2 border-background shadow-sm dark:shadow-none">
                        <AvatarImage src={`https://effigy.im/a/0x8ab0cf264df99d83525e9e11c7e4db01558ae1b1.svg`} />
                        <AvatarFallback>0x</AvatarFallback>
                    </Avatar>

                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-heading font-semibold text-foreground">0x8ab...1b1</h2>
                            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 pointer-events-none">Whale</Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground w-full">
                            <div className="flex items-center gap-1.5">
                                <span className="text-foreground font-semibold font-mono">1.2k</span> <span>Followers</span>
                            </div>
                            <div className="w-0.5 h-0.5 rounded-full bg-border" />
                            <div className="flex items-center gap-1.5">
                                <span className="text-foreground font-semibold font-mono">342</span> <span>Following</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-500",
                    isPrivate
                        ? "bg-muted/30 border-border/50 text-muted-foreground"
                        : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                )}>
                    <AnimatePresence mode="wait">
                        {isPrivate ? (
                            <motion.div
                                key="private"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="flex items-center gap-1.5"
                            >
                                <EyeOff className="w-3.5 h-3.5" />
                                <span className="text-xs font-medium">Private</span>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="public"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="flex items-center gap-1.5 text-emerald-500"
                            >
                                <Eye className="w-3.5 h-3.5" />
                                <span className="text-xs font-medium">Public</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* CONTENT */}
            <motion.div
                className="space-y-4 relative z-10 transition-all duration-700"
                animate={{ filter: isPrivate ? 'blur(4px)' : 'blur(0px)', opacity: isPrivate ? 0.85 : 1 }}
            >
                {/* Assets */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: step >= 1 ? 1 : 0, y: step >= 1 ? 0 : 10 }}
                    transition={{ duration: 0.5 }}
                    className="p-4 rounded-xl bg-card border border-border/40 shadow-sm dark:shadow-none flex items-center"
                >
                    <div className="flex-1 flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                            <Wallet className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs font-medium">Net Worth</p>
                            <span className="text-foreground font-bold text-lg font-heading tracking-tight">$1,240.52</span>
                        </div>
                    </div>
                    <div className="w-px h-8 bg-border/50 shrink-0" />
                    <div className="flex-1 flex items-center gap-3 pl-6">
                        <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-500">
                            <LayoutTemplate className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs font-medium">Collectibles</p>
                            <span className="text-foreground font-bold text-lg font-heading tracking-tight">32</span>
                        </div>
                    </div>
                </motion.div>

                {/* Draggable Links List */}
                <div className="space-y-2.5 min-h-[200px]">
                    <AnimatePresence>
                        {step >= 2 && links.map((link) => (
                            <motion.div
                                key={link.id}
                                layoutId={link.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className={cn(
                                    "group flex items-center justify-between p-3 rounded-lg border border-border/40 transition-colors",
                                    link.id === 'youtube' && isGrabbing && step === 3 ? "opacity-0" : "opacity-100", // Hide during drag-in phase
                                    "bg-muted/10 hover:bg-muted/30"
                                )}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <GripVertical className="w-4 h-4 text-muted-foreground/30" />
                                    <div className={cn("w-9 h-9 rounded-md flex items-center justify-center shrink-0 border border-border/60", link.bg)}>
                                        <link.icon className={cn("w-4 h-4", link.color)} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">{link.title}</p>
                                        <p className="text-xs text-muted-foreground truncate">{link.subtitle}</p>
                                    </div>
                                </div>

                                {/* Stats Badge */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: !isPrivate && step >= 6 ? 1 : 0, scale: !isPrivate && step >= 6 ? 1 : 0.9 }}
                                    className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-background border border-border/50 shadow-sm dark:shadow-none"
                                >
                                    <Activity className="w-3 h-3 text-muted-foreground" />
                                    <span className="text-xs font-mono font-medium text-foreground">
                                        {clicks[link.id as keyof typeof clicks] || 0}
                                    </span>
                                </motion.div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* Footer */}
            <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: !isPrivate && step >= 6 ? 1 : 0, height: !isPrivate && step >= 6 ? 'auto' : 0 }}
                className="mt-4 pt-4 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground font-mono overflow-hidden"
            >
                <div className="flex items-center gap-4">
                    <span>1.2k Views</span>
                    <span>•</span>
                    <span>{(clicks.portfolio + clicks.twitter + clicks.youtube + clicks.linkedin)} Clicks</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live System
                </div>
            </motion.div>
        </div>
    )
}
