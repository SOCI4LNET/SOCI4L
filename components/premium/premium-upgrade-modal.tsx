"use client";

import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useBalance, useSwitchChain } from "wagmi";
import { parseEther } from "viem";
import { activeChainId } from "@/lib/chain-config";
import { toast } from "sonner";
import { PREMIUM_PAYMENT_ADDRESS } from "@/lib/contracts/PremiumPayment";
import confetti from "canvas-confetti";

import { Loader2, Check, ShieldCheck, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Minimal ABI for the payPremium function
const PAY_ABI = [
    {
        "inputs": [],
        "name": "payPremium",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    }
] as const;

interface PremiumUpgradeModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function PremiumUpgradeModal({ open, onOpenChange, onSuccess }: PremiumUpgradeModalProps) {
    const { address, isConnected, chainId } = useAccount();
    const { data: balance } = useBalance({ address });
    const { switchChainAsync } = useSwitchChain();
    const [isOptimisticSuccess, setIsOptimisticSuccess] = useState(false);
    const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);

    const { writeContractAsync, data: hash, isPending: isWritePending, error: writeError } = useWriteContract();

    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash,
    });

    // Handle initial write error
    useEffect(() => {
        if (writeError) {
            console.error("Write Error:", writeError);
            if (writeError.message.includes("User rejected")) {
                toast.error("Transaction rejected by user");
            } else {
                toast.error("Transaction failed. Check console for details.");
            }
        }
    }, [writeError]);

    // Handle confirmation (Optimistic UI)
    useEffect(() => {
        if (isConfirmed) {
            setIsOptimisticSuccess(true);
            toast.success("Premium Unlocked! (Indexing in background...)");

            // Fire premium celebration confetti
            const duration = 3 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10001 };

            const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

            const interval: any = setInterval(function () {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
            }, 250);

            if (onSuccess) onSuccess();

            // Close after a delay to show success state
            setTimeout(() => {
                onOpenChange(false);
            }, 2000);
        }
    }, [isConfirmed, onSuccess, onOpenChange]);

    const handleUpgrade = async () => {
        if (!isConnected) {
            toast.error("Please connect your wallet first");
            return;
        }

        // Ensure we are on the Active Chain
        if (chainId !== activeChainId) {
            try {
                setIsSwitchingNetwork(true);
                await switchChainAsync({ chainId: activeChainId });
                toast.success("Switched to the correct network");
            } catch (error: any) {
                console.error("Failed to switch network:", error);
                toast.error("Please switch to Avalanche C-Chain to continue");
                return;
            } finally {
                setIsSwitchingNetwork(false);
            }
        }

        const price = parseEther("0.5");

        if (balance && balance.value < price) {
            toast.error("Insufficient Balance. You need at least 0.5 AVAX.");
            return;
        }

        try {
            await writeContractAsync({
                address: PREMIUM_PAYMENT_ADDRESS as `0x${string}`,
                abi: PAY_ABI,
                functionName: "payPremium",
                value: price,
                chainId: activeChainId,
            });
        } catch (e) {
            console.error("Transaction Error:", e);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-background border border-border/20 text-foreground shadow-2xl">
                <DialogHeader className="pt-2">
                    <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
                        <Sparkles className="w-5 h-5 text-foreground fill-foreground animate-pulse" />
                        Unlock Premium Insights
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground text-sm">
                        0.5 AVAX / year — on-chain license
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6 space-y-6">
                    {/* Benefits List */}
                    <ul className="space-y-4">
                        <li className="flex items-start gap-3 text-sm">
                            <Check className="w-4 h-4 text-green-500 mt-0.5" />
                            <span className="text-foreground/90">Detailed Visitor Analytics (Device, Referrer)</span>
                        </li>
                        <li className="flex items-start gap-3 text-sm">
                            <Check className="w-4 h-4 text-green-500 mt-0.5" />
                            <span className="text-foreground/90">Full History Access</span>
                        </li>
                        <li className="flex items-start gap-3 text-sm">
                            <Check className="w-4 h-4 text-green-500 mt-0.5" />
                            <span className="text-foreground/90">Advanced Graph Breakdowns</span>
                        </li>
                        <li className="flex items-start gap-3 text-sm">
                            <ShieldCheck className="w-4 h-4 text-green-500 mt-0.5" />
                            <span className="text-foreground/90">Immutable License (365 Days Access)</span>
                        </li>
                    </ul>

                    {/* Price Tag */}
                    <div className="bg-muted/50 p-5 rounded-xl flex items-center justify-between border border-border/10">
                        <div className="text-sm font-medium text-foreground">365 Days Access</div>
                        <div className="text-xl font-bold font-mono text-foreground tracking-tight">0.5 AVAX</div>
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2 pb-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isWritePending || isConfirming}
                        className="border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleUpgrade}
                        disabled={isWritePending || isConfirming || isOptimisticSuccess || isSwitchingNetwork}
                        className="bg-foreground hover:bg-foreground/90 text-background font-semibold border-0 transition-all active:scale-95"
                    >
                        {isSwitchingNetwork ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                Switching Network...
                            </>
                        ) : isWritePending ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                Confirming...
                            </>
                        ) : isConfirming ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                Processing...
                            </>
                        ) : isOptimisticSuccess ? (
                            <>
                                <Check className="w-4 h-4 mr-2" />
                                Unlocked!
                            </>
                        ) : (
                            "Pay 0.5 AVAX"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
