"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Sparkles, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface SlugCelebrationProps {
    slug: string;
    onClose: () => void;
}

export function SlugCelebration({ slug, onClose }: SlugCelebrationProps) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Fire confetti immediately with multiple bursts
        const fire = (particleRatio: number, opts: any) => {
            confetti({
                ...opts,
                particleCount: Math.floor(200 * particleRatio),
                zIndex: 10000,
            });
        };

        fire(0.25, { spread: 26, startVelocity: 55 });
        fire(0.2, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
        fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
        fire(0.1, { spread: 120, startVelocity: 45 });
    }, []);

    const shareUrl = `https://soci4l.net/p/${slug}`;
    const shareText = `Just claimed my custom profile handle on SOCI4L!\n\nSay hi at ${shareUrl} 🚀 @soci4lnet #soci4l`;
    const xShareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;

    const handleShare = () => {
        window.open(xShareLink, "_blank", "noopener,noreferrer");
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: "spring", damping: 20, stiffness: 300 }}
                        className="w-full max-w-md"
                    >
                        <Card className="relative overflow-hidden border-2 border-primary/20 shadow-2xl bg-gradient-to-b from-card to-card/95">
                            {/* Close Button */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 z-10 text-muted-foreground hover:text-foreground rounded-full h-8 w-8"
                                onClick={() => {
                                    setIsVisible(false);
                                    setTimeout(onClose, 200);
                                }}
                            >
                                <X className="w-4 h-4" />
                            </Button>

                            <CardHeader className="text-center pb-2 pt-8">
                                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                    <Check className="w-8 h-8 text-primary" />
                                </div>
                                <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                                    Congratulations!
                                </CardTitle>
                                <p className="text-muted-foreground">
                                    You've claimed your custom URL
                                </p>
                            </CardHeader>

                            <CardContent className="text-center py-6">
                                <div className="p-4 bg-muted/50 rounded-xl border border-primary/10 relative group">
                                    <p className="text-sm text-primary font-medium mb-1 uppercase tracking-wider">Your Unique Handle</p>
                                    <p className="text-xl font-mono font-bold text-foreground">
                                        /p/{slug}
                                    </p>
                                    <div className="mt-2 text-xs text-muted-foreground">
                                        soci4l.net/p/{slug}
                                    </div>
                                </div>
                                <p className="mt-6 text-sm text-muted-foreground leading-relaxed px-4">
                                    Your profile is now verified and reachable through your custom short link. Share it with the world!
                                </p>
                            </CardContent>

                            <CardFooter className="flex flex-col gap-3 pb-8">
                                <Button
                                    onClick={handleShare}
                                    className="w-full bg-white hover:bg-white/90 text-black border border-white/20 gap-2 h-12 text-base font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md"
                                >
                                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                    </svg>
                                    Share on X
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setIsVisible(false);
                                        setTimeout(onClose, 200);
                                    }}
                                    className="w-full text-muted-foreground hover:text-foreground"
                                >
                                    Continue to Dashboard
                                </Button>
                            </CardFooter>
                        </Card>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
