"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseAbi } from "viem";
import { Loader2, Check, AlertCircle, X, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CUSTOM_SLUG_REGISTRY_ADDRESS, CUSTOM_SLUG_REGISTRY_ABI } from "@/lib/contracts/CustomSlugRegistry";
import { normalizeSlug, validateSlugFormat, hashSlug } from "@/lib/utils/slug";

const ABI = parseAbi(CUSTOM_SLUG_REGISTRY_ABI);

interface SlugManagerProps {
    currentSlug?: string | null;
    slugClaimedAt?: Date | null;
}

export function SlugManager({ currentSlug, slugClaimedAt }: SlugManagerProps) {
    const { address, isConnected } = useAccount();
    const [inputSlug, setInputSlug] = useState("");
    const [debouncedSlug, setDebouncedSlug] = useState("");
    const [isChecking, setIsChecking] = useState(false);
    const [availability, setAvailability] = useState<"idle" | "available" | "taken" | "reserved" | "invalid">("idle");
    const [cooldownEnd, setCooldownEnd] = useState<Date | null>(null);

    // Debounce input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSlug(inputSlug);
        }, 500);
        return () => clearTimeout(timer);
    }, [inputSlug]);

    // Check Availability
    const { data: slugOwner, refetch: refetchOwner } = useReadContract({
        address: CUSTOM_SLUG_REGISTRY_ADDRESS as `0x${string}`,
        abi: ABI,
        functionName: "resolveSlug",
        args: debouncedSlug ? [hashSlug(debouncedSlug) as `0x${string}`] : undefined,
        query: {
            enabled: !!debouncedSlug && validateSlugFormat(debouncedSlug),
        }
    });

    const { data: slugStatus, refetch: refetchStatus } = useReadContract({
        address: CUSTOM_SLUG_REGISTRY_ADDRESS as `0x${string}`,
        abi: ABI,
        functionName: "getSlugStatus",
        args: debouncedSlug ? [hashSlug(debouncedSlug) as `0x${string}`] : undefined,
        query: {
            enabled: !!debouncedSlug && validateSlugFormat(debouncedSlug),
        }
    });

    const { data: isReserved, refetch: refetchReserved } = useReadContract({
        address: CUSTOM_SLUG_REGISTRY_ADDRESS as `0x${string}`,
        abi: ABI,
        functionName: "isReserved",
        args: debouncedSlug ? [debouncedSlug] : undefined,
        query: {
            enabled: !!debouncedSlug && validateSlugFormat(debouncedSlug),
        }
    });

    useEffect(() => {
        if (!debouncedSlug) {
            setAvailability("idle");
            return;
        }

        if (!validateSlugFormat(debouncedSlug)) {
            setAvailability("invalid");
            return;
        }

        // Determine status based on contract reads
        const checkStatus = async () => {
            setIsChecking(true);
            try {
                await refetchOwner();
                await refetchStatus();
                await refetchReserved();
            } finally {
                setIsChecking(false);
            }
        };
        checkStatus();
    }, [debouncedSlug, refetchOwner, refetchStatus, refetchReserved]);

    useEffect(() => {
        if (!debouncedSlug || !validateSlugFormat(debouncedSlug)) return;

        // Logic to determine availability from contract data
        if (isReserved) {
            setAvailability("reserved");
            setCooldownEnd(null); // Permanent reservation
        } else if (slugStatus && Array.isArray(slugStatus)) {
            const [owner, releasedAt, cooldownEndsAt] = slugStatus as [string, bigint, bigint];
            const now = BigInt(Math.floor(Date.now() / 1000));

            if (owner !== "0x0000000000000000000000000000000000000000") {
                setAvailability("taken");
                setCooldownEnd(null);
            } else if (cooldownEndsAt > now) {
                setAvailability("reserved");
                setCooldownEnd(new Date(Number(cooldownEndsAt) * 1000));
            } else {
                setAvailability("available");
                setCooldownEnd(null);
            }
        } else if (slugOwner && slugOwner !== "0x0000000000000000000000000000000000000000") {
            setAvailability("taken");
        } else {
            setAvailability("available");
        }
    }, [slugOwner, slugStatus, isReserved, debouncedSlug]);


    // Transaction Handling
    const { writeContract, data: hash, isPending: isWritePending, error: writeError } = useWriteContract();
    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash,
    });

    // Effect to trigger backend update on success
    useEffect(() => {
        if (isConfirmed && hash) {
            const updateBackend = async () => {
                try {
                    const action = currentSlug ? "release" : "claim";
                    // Wait, this component handles both. 
                    // We need to know WHICH action triggered the success.
                    // We can track it via a ref or state, but user likely didn't change intent mid-flight.

                    // If inputSlug is set and we just claimed, it's claim.
                    // If we clicked release, we should have cleared inputSlug or tracked it.
                    // Using a "pendingAction" state would be better.

                    // For now, trusting the optimistic update call:
                    // If we have an active `currentSlug` prop (from parent DB data) AND we executed `release`...
                    // Only `claim` uses `debouncedSlug`. 

                    // Let's implement optimistic update more explicitly in the handlers.
                } catch (e) {
                    console.error(e);
                }
            };
            // updateBackend(); // Moving to separate handler
        }
    }, [isConfirmed, hash, currentSlug]);


    const handleClaim = async () => {
        if (!debouncedSlug || availability !== "available") return;

        try {
            writeContract({
                address: CUSTOM_SLUG_REGISTRY_ADDRESS as `0x${string}`,
                abi: ABI,
                functionName: "claim",
                args: [debouncedSlug]
            }, {
                onSuccess: async (txHash) => {
                    toast.loading("Claiming slug...", { id: "claim-toast" });
                    // We wait for receipt in the UI via hook, 
                    // But we can ALSO start watching for it or just wait for `isConfirmed`.
                }
            });
        } catch (e) {
            toast.error("Failed to initiate claim");
        }
    };

    const handleRelease = async () => {
        if (!currentSlug) return;
        try {
            writeContract({
                address: CUSTOM_SLUG_REGISTRY_ADDRESS as `0x${string}`,
                abi: ABI,
                functionName: "release",
            }, {
                onSuccess: (txHash) => {
                    toast.loading("Releasing slug...", { id: "release-toast" });
                }
            });
        } catch (e) {
            toast.error("Failed to initiate release");
        }
    };

    // Watch for confirmation to trigger API
    useEffect(() => {
        if (isConfirmed && hash) {
            const performApiUpdate = async () => {
                // Determine action based on context. 
                // If we have `currentSlug` locally (from props) but we called release...
                // It's safer to check the transaction data or just use a state for `lastAction`.
            };

            // Actually, let's just trigger the API with the logic:
            // If we claimed, we send "claim" and slug.
            // If we released, we send "release".
            // We need state to track what we just did.
        }
    }, [isConfirmed, hash]);

    // Better approach: separate state for "pending action type"
    const [pendingAction, setPendingAction] = useState<"claim" | "release" | null>(null);

    useEffect(() => {
        if (isConfirmed && hash && pendingAction) {
            const update = async () => {
                try {
                    const res = await fetch("/api/slug/update", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            action: pendingAction,
                            slug: pendingAction === "claim" ? debouncedSlug : undefined,
                            txHash: hash
                        })
                    });

                    if (!res.ok) throw new Error("API update failed");

                    toast.dismiss(pendingAction === "claim" ? "claim-toast" : "release-toast");
                    toast.success(pendingAction === "claim" ? "Slug claimed!" : "Slug released!");

                    // Force reload or callback to update parent state
                    window.location.reload(); // Simple MVP refresh
                } catch (e) {
                    toast.error("Slug updated on-chain but failed to sync locally. Please refresh.");
                } finally {
                    setPendingAction(null);
                }
            };
            update();
        }
    }, [isConfirmed, hash, pendingAction, debouncedSlug]);

    if (!isConnected) {
        return <Alert><AlertTitle>Wallet not connected</AlertTitle><AlertDescription>Please connect your wallet to manage slugs.</AlertDescription></Alert>;
    }

    return (
        <Card className="rounded-3xl border-white/5 bg-black/20 backdrop-blur-sm overflow-hidden">
            <CardHeader className="pb-4">
                <CardTitle className="text-xl font-medium tracking-tight">Custom Profile Link</CardTitle>
                <CardDescription className="text-base text-muted-foreground/80">
                    Claim a unique identity for your profile.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {currentSlug ? (
                    <div className="space-y-4">
                        <div className="p-6 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between group hover:border-white/10 transition-colors">
                            <div>
                                <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">Current Handle</p>
                                <p className="text-2xl font-bold flex items-center gap-2 font-mono text-white">
                                    /p/{currentSlug}
                                    <div className="h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center">
                                        <Check className="w-3 h-3 text-green-500" />
                                    </div>
                                </p>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-red-500/10 bg-red-500/5 p-4 flex gap-3 items-start">
                            <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <h4 className="text-sm font-medium text-red-500">Cooldown Warning</h4>
                                <p className="text-xs text-red-500/80 leading-relaxed">
                                    Releasing your slug initiates a 7-day cooldown period. During this time, nobody (including you) can claim it.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-lg pointer-events-none select-none">
                                soci4l.com/p/
                            </div>
                            <Input
                                value={inputSlug}
                                onChange={(e) => setInputSlug(e.target.value)}
                                className="pl-[140px] h-14 rounded-2xl border-white/10 bg-black/20 text-lg font-mono focus-visible:ring-brand-500/50 focus-visible:border-brand-500"
                                placeholder="name"
                                disabled={isWritePending || isConfirming}
                            />
                            {/* Status Icon */}
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                {isChecking ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /> :
                                    availability === "available" ? <div className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center"><Check className="w-3.5 h-3.5 text-green-500" /></div> :
                                        availability === "taken" ? <div className="h-6 w-6 rounded-full bg-red-500/20 flex items-center justify-center"><X className="w-3.5 h-3.5 text-red-500" /></div> :
                                            availability === "reserved" ? <div className="h-6 w-6 rounded-full bg-yellow-500/20 flex items-center justify-center"><AlertCircle className="w-3.5 h-3.5 text-yellow-500" /></div> : null}
                            </div>
                        </div>

                        <div className="h-6 min-h-[24px]">
                            {availability === "taken" && (
                                <p className="text-sm text-red-500 flex items-center gap-2">
                                    <X className="w-4 h-4" /> This handle is already taken.
                                </p>
                            )}
                            {availability === "invalid" && debouncedSlug && (
                                <p className="text-sm text-red-500 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" /> Use only lowercase letters, numbers, and hyphens.
                                </p>
                            )}
                            {availability === "reserved" && cooldownEnd && (
                                <p className="text-sm text-yellow-500 flex items-center gap-2">
                                    <Loader2 className="w-4 h-4" /> Cooldown until {cooldownEnd.toLocaleDateString()}.
                                </p>
                            )}
                            {availability === "reserved" && !cooldownEnd && (
                                <p className="text-sm text-red-500 flex items-center gap-2">
                                    <ShieldAlert className="w-4 h-4" /> Reserved for official use.
                                </p>
                            )}
                            {availability === "available" && debouncedSlug && (
                                <p className="text-sm text-green-500 flex items-center gap-2">
                                    <Check className="w-4 h-4" /> Available! Cost: Gas only.
                                </p>
                            )}
                        </div>

                        <Button
                            onClick={() => { setPendingAction("claim"); handleClaim(); }}
                            disabled={availability !== "available" || isWritePending || isConfirming}
                            className="w-full h-12 rounded-xl text-base font-medium bg-white text-black hover:bg-white/90 transition-all shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] disabled:opacity-50 disabled:shadow-none"
                        >
                            {isWritePending && pendingAction === "claim" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Claim Handle
                        </Button>
                    </div>
                )}
            </CardContent>
            {currentSlug && (
                <CardFooter className="pt-2 pb-6">
                    <Button
                        variant="ghost"
                        onClick={() => { setPendingAction("release"); handleRelease(); }}
                        disabled={isWritePending || isConfirming}
                        className="w-full h-12 rounded-xl text-red-500 hover:text-red-400 hover:bg-red-500/10 border border-red-500/10"
                    >
                        {isWritePending && pendingAction === "release" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Release Handle
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}
