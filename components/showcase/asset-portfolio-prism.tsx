'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

import { Box } from 'lucide-react'

// Mock Data with high-quality placeholder images
const CARDS = [
    {
        title: 'Bored Ape #1234',
        price: '64.2 AVAX',
        color: 'from-purple-500 to-blue-500',
        image: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1974&auto=format&fit=crop' // Abstract Purple
    },
    {
        title: 'Azuki #8888',
        price: '12.5 AVAX',
        color: 'from-red-500 to-orange-500',
        image: 'https://images.unsplash.com/photo-1621574539436-4a692d95c73d?q=80&w=1978&auto=format&fit=crop' // Abstract Red
    },
    {
        title: 'Doodle #333',
        price: '4.8 AVAX',
        color: 'from-green-400 to-teal-500',
        image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1964&auto=format&fit=crop' // Abstract Liquid
    },
]

export function AssetPortfolioPrism() {
    const [activeCard, setActiveCard] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveCard(prev => (prev + 1) % CARDS.length)
        }, 3000)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="w-full max-w-[400px] h-[400px] rounded-[32px] bg-black border border-white/10 relative overflow-hidden flex flex-col items-center justify-center p-6 perspective-[1000px] group">

            <div className="absolute inset-0 bg-neutral-950/80" />

            {/* Ambient Light */}
            <div className="absolute top-0 w-full h-32 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />

            {/* Header */}
            <div className="absolute top-6 left-6 z-10 flex items-center gap-2">
                <Box className="w-4 h-4 text-white/40" />
                <span className="text-[10px] font-medium tracking-widest text-neutral-500 uppercase font-sans">Asset Prism</span>
            </div>

            {/* 3D Carousel Container */}
            <div className="relative w-48 h-64 transform-style-preserve-3d">
                {CARDS.map((card, index) => {
                    const offset = (index - activeCard + CARDS.length) % CARDS.length
                    const isActive = offset === 0

                    let rotateY = 0
                    let translateZ = 0
                    let opacity = 1
                    let zIndex = 1
                    let xOffset = 0
                    let scale = 1

                    if (offset === 0) { // Center
                        rotateY = 0
                        translateZ = 100 // Slightly reduced to prevent clipping
                        zIndex = 50 // HIGH Z-Index for Active Card
                        opacity = 1
                        xOffset = 0
                        scale = 1.1
                    } else if (offset === 1) { // Right (Next)
                        rotateY = 15 // Less rotation
                        translateZ = -20
                        opacity = 0.4
                        zIndex = 10 // Low Z-Index
                        xOffset = 90
                        scale = 0.9
                    } else { // Left (Prev)
                        rotateY = -15 // Less rotation
                        translateZ = -20
                        opacity = 0.4
                        zIndex = 10 // Low Z-Index
                        xOffset = -90
                        scale = 0.9
                    }

                    return (
                        <motion.div
                            key={index}
                            initial={false}
                            animate={{
                                rotateY,
                                z: translateZ,
                                opacity,
                                x: xOffset,
                                scale,
                                zIndex
                            }}
                            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                            className="absolute inset-0 rounded-2xl border border-white/10 bg-neutral-900 overflow-hidden shadow-2xl origin-center"
                            style={{ backfaceVisibility: 'hidden' }}
                        >
                            {/* Card Image */}
                            <div className={`h-full w-full relative bg-gradient-to-br ${card.color}`}>
                                <img
                                    src={card.image}
                                    alt={card.title}
                                    className="w-full h-full object-cover grayscale-[0.2] transition-opacity duration-300"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                    }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent opacity-80" />
                            </div>

                            {/* Metadata - Only visible if active to prevent overlap issues */}
                            <motion.div
                                className="absolute bottom-0 inset-x-0 bg-neutral-900/90 backdrop-blur-md border-t border-white/10 p-4 flex flex-col justify-center"
                                animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 20 }}
                                transition={{ duration: 0.2 }}
                            >
                                <h3 className="text-white font-bold text-sm truncate font-sans tracking-tight mb-1">{card.title}</h3>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-neutral-500 font-sans uppercase tracking-wider font-medium">Floor</span>
                                    <span className="text-xs text-white font-mono font-bold">{card.price}</span>
                                </div>
                            </motion.div>

                            {/* Shine Effect */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-transparent pointer-events-none" />
                        </motion.div>
                    )
                })}
            </div>

            {/* Controls Indicator */}
            <div className={`absolute bottom-6 flex gap-1.5 transition-opacity duration-300 z-10 ${activeCard !== null ? 'opacity-100' : 'opacity-0'}`}>
                {CARDS.map((_, i) => (
                    <div
                        key={i}
                        className={`w-1 h-1 rounded-full transition-all duration-300 ${i === activeCard ? 'bg-white w-3' : 'bg-white/20'}`}
                    />
                ))}
            </div>
        </div>
    )
}
