'use client'

import { ReactNode, useEffect, useRef } from 'react'
import 'lenis/dist/lenis.css'
import Lenis from 'lenis'

interface SmoothScrollLayoutProps {
    children: ReactNode
}

/**
 * Wraps content with Lenis smooth scroll.
 * Optimized for a "subtle" feel as requested.
 */
export function SmoothScrollLayout({ children }: SmoothScrollLayoutProps) {
    useEffect(() => {
        const lenis = new Lenis({
            duration: 1.2, // Slightly longer than default for "smooth" feel but not too heavy
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Default exponential easing
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 1, // Standard speed
            touchMultiplier: 2, // More responsive on touch
            infinite: false,
        })

        function raf(time: number) {
            lenis.raf(time)
            requestAnimationFrame(raf)
        }

        requestAnimationFrame(raf)

        return () => {
            lenis.destroy()
        }
    }, [])

    return (
        <div className="relative">
            {children}
        </div>
    )
}
