"use client";

import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { Loader2, Check, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PREMIUM_PAYMENT_ADDRESS } from "@/lib/contracts/PremiumPayment";

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
    const { isConnected } = useAccount();
    const [isOptimisticSuccess, setIsOptimisticSuccess] = useState(false);

    const { writeContractAsync, data: hash, isPending: isWritePending, error: writeError } = useWriteContract();

    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash,
    });

    // Handle initial write error
    useEffect(() => {
        if (writeError) {
            toast.error("Transaction failed or rejected");
        }
    }, [writeError]);

    // Handle confirmation (Optimistic UI)
    useEffect(() => {
        if (isConfirmed) {
            setIsOptimisticSuccess(true);
            toast.success("Premium Unlocked! (Indexing in background...)");
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

        try {
            await writeContractAsync({
                address: PREMIUM_PAYMENT_ADDRESS as `0x${string}`,
                abi: PAY_ABI,
                functionName: "payPremium",
                value: parseEther("0.5"),
            });
        } catch (e) {
            console.error(e);
            // Toast handled by effect
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-[#09090b] border border-border/20 text-white shadow-2xl">
                <DialogHeader className="pt-2">
                    <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
                        <Sparkles className="w-5 h-5 text-yellow-400 fill-yellow-400 animate-pulse" />
                        Unlock Premium Insights
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400 text-sm">
                        Get advanced analytics and insights for 1 year.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6 space-y-6">
                    {/* Benefits List */}
                    <ul className="space-y-4">
                        <li className="flex items-start gap-3 text-sm">
                            <Check className="w-4 h-4 text-green-500 mt-0.5" />
                            <span className="text-zinc-200">Detailed Visitor Analytics (Country, Device, Referrer)</span>
                        </li>
                        <li className="flex items-start gap-3 text-sm">
                            <Check className="w-4 h-4 text-green-500 mt-0.5" />
                            <span className="text-zinc-200">30-Day History Retention</span>
                        </li>
                        <li className="flex items-start gap-3 text-sm">
                            <Check className="w-4 h-4 text-green-500 mt-0.5" />
                            <span className="text-zinc-200">Advanced Graph Breakdowns</span>
                        </li>
                        <li className="flex items-start gap-3 text-sm">
                            <ShieldCheck className="w-4 h-4 text-green-500 mt-0.5" />
                            <span className="text-zinc-200">Immutable License (On-Chain Proof)</span>
                        </li>
                    </ul>

                    {/* Price Tag */}
                    <div className="bg-zinc-900/50 p-5 rounded-xl flex items-center justify-between border border-white/5">
                        <div className="text-sm font-medium text-white">1 Year Access</div>
                        <div className="text-xl font-bold font-mono text-white tracking-tight">0.5 AVAX</div>
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2 pb-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isWritePending || isConfirming}
                        className="border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleUpgrade}
                        disabled={isWritePending || isConfirming || isOptimisticSuccess}
                        className="bg-[#D9A51F] hover:bg-[#C29218] text-black font-semibold border-0 transition-all active:scale-95"
                    >
                        {isWritePending ? (
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
