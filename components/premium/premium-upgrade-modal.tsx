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
    const { isConnected, chainId } = useAccount();
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
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-yellow-500" />
                        Unlock Premium Insights
                    </DialogTitle>
                    <DialogDescription>
                        Get advanced analytics and insights for 1 year.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6 space-y-6">
                    {/* Benefits List */}
                    <ul className="space-y-3">
                        <li className="flex items-start gap-2 text-sm">
                            <Check className="w-4 h-4 text-green-500 mt-0.5" />
                            <span>Detailed Visitor Analytics (Country, Device, Referrer)</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                            <Check className="w-4 h-4 text-green-500 mt-0.5" />
                            <span>30-Day History Retention</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                            <Check className="w-4 h-4 text-green-500 mt-0.5" />
                            <span>Advanced Graph Breakdowns</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                            <ShieldCheck className="w-4 h-4 text-green-500 mt-0.5" />
                            <span>Immutable License (On-Chain Proof)</span>
                        </li>
                    </ul>

                    {/* Price Tag */}
                    <div className="bg-muted/50 p-4 rounded-lg flex items-center justify-between border">
                        <div className="text-sm font-medium">1 Year Access</div>
                        <div className="text-xl font-bold font-mono">0.5 AVAX</div>
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isWritePending || isConfirming}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleUpgrade}
                        disabled={isWritePending || isConfirming || isOptimisticSuccess}
                        className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white border-0"
                    >
                        {isWritePending ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                Confirm in Wallet...
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
