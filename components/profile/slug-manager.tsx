"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseAbi } from "viem";
import { Loader2, Check, AlertCircle, X } from "lucide-react";
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
        <Card>
            <CardHeader>
                <CardTitle>Custom Profile Link</CardTitle>
                <CardDescription>
                    Claim a unique short URL for your profile (e.g. soci4l.com/p/{currentSlug || "your-name"}).
                </CardDescription>
            </CardHeader>
            <CardContent>
                {currentSlug ? (
                    <div className="space-y-4">
                        <div className="p-4 bg-muted rounded-lg flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Current Slug</p>
                                <p className="text-xl font-bold flex items-center gap-2">
                                    /p/{currentSlug}
                                    <Check className="w-4 h-4 text-green-500" />
                                </p>
                            </div>
                            {/* Share Button could go here */}
                        </div>

                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Warning</AlertTitle>
                            <AlertDescription>
                                Releasing your slug initiates a 7-day cooldown period. During this time, nobody (including you) can claim it.
                            </AlertDescription>
                        </Alert>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <span className="absolute left-3 top-2.5 text-muted-foreground">/p/</span>
                                <Input
                                    value={inputSlug}
                                    onChange={(e) => setInputSlug(e.target.value)}
                                    className="pl-9"
                                    placeholder="your-name"
                                    disabled={isWritePending || isConfirming}
                                />
                                {/* Status Icon */}
                                <div className="absolute right-3 top-2.5">
                                    {isChecking ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> :
                                        availability === "available" ? <Check className="w-4 h-4 text-green-500" /> :
                                            availability === "taken" ? <X className="w-4 h-4 text-red-500" /> :
                                                availability === "reserved" ? <AlertCircle className="w-4 h-4 text-yellow-500" /> : null}
                                </div>
                            </div>
                            <Button
                                onClick={() => { setPendingAction("claim"); handleClaim(); }}
                                disabled={availability !== "available" || isWritePending || isConfirming}
                            >
                                {isWritePending || isConfirming ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Claim
                            </Button>
                        </div>

                        {/* Status Messages */}
                        {availability === "taken" && <p className="text-sm text-red-500">This slug is already taken.</p>}
                        {availability === "invalid" && <p className="text-sm text-red-500">Invalid format. generic-kebab-case only.</p>}
                        {availability === "reserved" && cooldownEnd && (
                            <p className="text-sm text-yellow-500">
                                This slug is in cooldown until {cooldownEnd.toLocaleDateString()} {cooldownEnd.toLocaleTimeString()}.
                            </p>
                        )}
                        {availability === "reserved" && !cooldownEnd && (
                            <p className="text-sm text-red-500">
                                This slug is reserved for official use.
                            </p>
                        )}
                        {availability === "available" && debouncedSlug && (
                            <p className="text-sm text-green-500">Available! Cost: Gas only.</p>
                        )}
                    </div>
                )}
            </CardContent>
            <CardFooter>
                {currentSlug && (
                    <Button
                        variant="destructive"
                        onClick={() => { setPendingAction("release"); handleRelease(); }}
                        disabled={isWritePending || isConfirming}
                    >
                        {isWritePending || isConfirming ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Release Slug
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}
