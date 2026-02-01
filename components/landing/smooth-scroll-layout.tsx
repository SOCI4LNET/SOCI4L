'use client'

import { ReactLenis } from 'lenis/react'

interface SmoothScrollLayoutProps {
    children: React.ReactNode
}

export function SmoothScrollLayout({ children }: SmoothScrollLayoutProps) {
    // "Not too intense" configuration
    // lerp: 0.1 is standard. Lower = smoother/heavier. Higher = snappier.
    // duration: 1.2 is standard. 
    // We'll stick to defaults or slightly snappier to avoid "heavy" feel.
    const lenisOptions = {
        lerp: 0.1,
        duration: 1.5,
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 2,
    }

    return (
        <ReactLenis root options={lenisOptions}>
            {children}
        </ReactLenis>
    )
}
