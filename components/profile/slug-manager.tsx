"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useSignMessage, usePublicClient } from "wagmi";
import { parseAbi, decodeFunctionData, parseAbiItem } from "viem";
import { Loader2, Check, AlertCircle, X, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { CUSTOM_SLUG_REGISTRY_ADDRESS, CUSTOM_SLUG_REGISTRY_ABI } from "@/lib/contracts/CustomSlugRegistry";
import { normalizeSlug, validateSlugFormat, hashSlug } from "@/lib/utils/slug";

const ABI = parseAbi(CUSTOM_SLUG_REGISTRY_ABI);

interface SlugManagerProps {
    currentSlug?: string | null;
    slugClaimedAt?: Date | null;
}

export function SlugManager({ currentSlug, slugClaimedAt }: SlugManagerProps) {
    const { address, isConnected } = useAccount();
    const { signMessageAsync } = useSignMessage();
    const publicClient = usePublicClient();
    const [inputSlug, setInputSlug] = useState("");
    const [debouncedSlug, setDebouncedSlug] = useState("");
    const [isChecking, setIsChecking] = useState(false);
    const [availability, setAvailability] = useState<"idle" | "available" | "taken" | "reserved" | "invalid">("idle");
    const [cooldownEnd, setCooldownEnd] = useState<Date | null>(null);
    const [pendingAction, setPendingAction] = useState<"claim" | "release" | null>(null);
    const [recoveredSlug, setRecoveredSlug] = useState<string | null>(null);
    const [isRecovering, setIsRecovering] = useState(false);
    const [isAutoRepairing, setIsAutoRepairing] = useState(false);
    const [hasAttemptedRecovery, setHasAttemptedRecovery] = useState(false);

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

    const { data: userActiveSlug, refetch: refetchUserActiveSlug } = useReadContract({
        address: CUSTOM_SLUG_REGISTRY_ADDRESS as `0x${string}`,
        abi: ABI,
        functionName: "getActiveSlug",
        args: address ? [address] : undefined,
        query: {
            enabled: !!address,
        }
    });

    // Cast to string to avoid TS errors
    const activeSlugHash = userActiveSlug as string;

    const { data: isReserved, refetch: refetchReserved } = useReadContract({
        address: CUSTOM_SLUG_REGISTRY_ADDRESS as `0x${string}`,
        abi: ABI,
        functionName: "isReserved",
        args: debouncedSlug ? [debouncedSlug] : undefined,
        query: {
            enabled: !!debouncedSlug && validateSlugFormat(debouncedSlug),
        }
    });

    const ZERO_HASH = "0x0000000000000000000000000000000000000000000000000000000000000000";
    const isStale = !!(currentSlug && activeSlugHash && activeSlugHash === ZERO_HASH);

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



    // Reset recovery state when account/slug changes
    useEffect(() => {
        setHasAttemptedRecovery(false);
        setRecoveredSlug(null);
        setIsAutoRepairing(false);
    }, [activeSlugHash, address]);

    // Auto-Repair Effect: If DB has slug but Chain has none, clear DB automatically
    useEffect(() => {
        if (isStale && address && !isAutoRepairing) {
            const autoRepair = async () => {
                setIsAutoRepairing(true);
                try {
                    await fetch("/api/slug/sync", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            mode: "repair",
                            address: address
                        })
                    });
                    // Instead of full reload, we just wait for the parent to re-fetch if possible, 
                    // or reload if we have to. For now, reload is safest to reset all state.
                    window.location.reload();
                } catch (e) {
                    console.error("Auto-repair failed:", e);
                    setIsAutoRepairing(false);
                }
            };
            autoRepair();
        }
    }, [isStale, address, isAutoRepairing]);

    // Transaction Handling
    const { writeContractAsync, data: hash, isPending: isWritePending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash,
    });

    const handleSync = async (slugToSync: string) => {
        if (!address) return;
        setPendingAction("claim");
        try {
            const message = `Sync slug "${slugToSync}" for SOCI4L profile`;
            const signature = await signMessageAsync({ message });

            const res = await fetch("/api/slug/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    slug: slugToSync,
                    signature,
                    message
                })
            });

            if (res.ok) {
                toast.success("Synced & Fixed!");
                window.location.reload();
            } else {
                toast.error("Sync failed");
            }
        } catch (e: any) {
            console.error(e);
            if (e?.message?.includes("User rejected")) {
                toast.error("Signature rejected");
            } else {
                toast.error("Sync error");
            }
        } finally {
            setPendingAction(null);
        }
    };

    // Proactive Sync Trigger: If we found a zombie slug, automatically prompt for sync
    useEffect(() => {
        if (recoveredSlug && !currentSlug && !isWritePending && !isConfirming && !pendingAction && hasAttemptedRecovery) {
            // Optional: Add a delay or check if another toast is already showing
            const timer = setTimeout(() => {
                toast.info(`Found your handle: /p/${recoveredSlug}. Syncing now...`, { id: "auto-sync-info" });
                handleSync(recoveredSlug);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [recoveredSlug, currentSlug, isWritePending, isConfirming, pendingAction, hasAttemptedRecovery]);

    // Watch for confirmation to trigger API
    useEffect(() => {
        if (isConfirmed && hash && pendingAction) {
            const updateBackend = async () => {
                try {
                    const res = await fetch("/api/slug/update", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            action: pendingAction,
                            slug: pendingAction === "claim" ? debouncedSlug : undefined,
                            txHash: hash,
                            address: address
                        })
                    });

                    if (!res.ok) throw new Error("API update failed");

                    toast.dismiss(pendingAction === "claim" ? "claim-toast" : "release-toast");
                    toast.success(pendingAction === "claim" ? "Slug claimed!" : "Slug released!");

                    // Force reload or callback to update parent state
                    window.location.reload();
                } catch (e) {
                    toast.error("Slug updated on-chain but failed to sync locally. Please refresh.");
                } finally {
                    setPendingAction(null);
                }
            };
            updateBackend();
        }
    }, [isConfirmed, hash, pendingAction, debouncedSlug]);


    if (!isConnected) {
        return <Alert><AlertTitle>Wallet not connected</AlertTitle><AlertDescription>Please connect your wallet to manage slugs.</AlertDescription></Alert>;
    }

    if (isAutoRepairing) {
        return (
            <Card className="bg-card border-yellow-500/20 shadow-sm">
                <CardContent className="py-10 flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
                    <div className="text-center">
                        <p className="font-medium text-yellow-500">Reconciling Profile State...</p>
                        <p className="text-sm text-muted-foreground mt-1">Cleaning up local data after on-chain changes.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-card border border-border/60 shadow-sm">
            <CardHeader>
                <CardTitle className="text-base">Custom Profile Link</CardTitle>
                <CardDescription>
                    Claim a unique short URL for your profile (e.g. soci4l.com/p/{currentSlug || "your-name"}).
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {currentSlug ? (
                    isStale ? (
                        <div className="space-y-4">
                            <Alert className="border-yellow-500/30 bg-yellow-500/5">
                                <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
                                <AlertTitle className="text-yellow-500">Auto-Detecting State...</AlertTitle>
                                <AlertDescription className="text-yellow-500/80">
                                    Your profile appears out of sync. Fixing automatically...
                                </AlertDescription>
                            </Alert>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="p-4 bg-muted/50 rounded-lg flex items-center justify-between border">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">Current Handle</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-lg font-mono font-semibold">
                                            /p/{currentSlug}
                                        </p>
                                        <Badge variant="secondary" className="text-green-600 bg-green-500/10 hover:bg-green-500/20 border-green-500/20">
                                            <Check className="w-3 h-3 mr-1" /> Verified
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Warning</AlertTitle>
                                <AlertDescription>
                                    Releasing your slug initiates a 7-day cooldown period. During this time, nobody (including you) can claim it.
                                </AlertDescription>
                            </Alert>

                            <div className="flex justify-end">
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={async () => {
                                        if (!currentSlug) return;
                                        setPendingAction("release");
                                        try {
                                            await writeContractAsync({
                                                address: CUSTOM_SLUG_REGISTRY_ADDRESS as `0x${string}`,
                                                abi: ABI,
                                                functionName: "release",
                                            });
                                            toast.loading("Releasing slug...", { id: "release-toast" });
                                        } catch (e: any) {
                                            console.error("Release error:", e);
                                            if (e?.message?.includes('User rejected')) {
                                                toast.error("Transaction rejected");
                                            } else {
                                                toast.error("Failed to initiate release");
                                            }
                                            setPendingAction(null);
                                        }
                                    }}
                                    disabled={isWritePending || isConfirming}
                                >
                                    {isWritePending && pendingAction === "release" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    Release Handle
                                </Button>
                            </div>
                        </div>
                    )
                ) : (
                    <div className="space-y-4">
                        {/* Unified Zombie Slug Detection */}
                        {!currentSlug && activeSlugHash && activeSlugHash !== ZERO_HASH && (
                            <Alert className="border-yellow-500/50 bg-yellow-500/10 mb-4">
                                <AlertCircle className="h-4 w-4 text-yellow-500" />
                                <AlertTitle className="text-yellow-500">Sync Required</AlertTitle>
                                <AlertDescription className="text-yellow-500/90">
                                    {isRecovering ? (
                                        "Resolving your handle from chain history..."
                                    ) : (
                                        <>
                                            {recoveredSlug ? (
                                                <span>
                                                    You own the handle <strong>{recoveredSlug}</strong> on-chain, but it's not synced.
                                                    {inputSlug !== recoveredSlug && (
                                                        <Button
                                                            variant="link"
                                                            className="text-yellow-600 underline px-1 h-auto font-bold"
                                                            onClick={() => setInputSlug(recoveredSlug)}
                                                        >
                                                            Click here to sync it
                                                        </Button>
                                                    )}
                                                </span>
                                            ) : (
                                                "You have an active handle on-chain, but it's not synced locally. Please enter your handle below to sync it."
                                            )}
                                        </>
                                    )}
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label>Desired Handle</Label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <span className="absolute left-3 top-2.5 text-muted-foreground font-mono text-sm">soci4l.com/p/</span>
                                    <Input
                                        value={inputSlug}
                                        onChange={(e) => setInputSlug(e.target.value)}
                                        className="pl-[110px] font-mono"
                                        placeholder="username"
                                        disabled={isWritePending || isConfirming}
                                    />
                                    {/* Status Icon */}
                                    <div className="absolute right-3 top-2.5">
                                        {isChecking ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> :
                                            availability === "available" ? <Check className="w-4 h-4 text-green-500" /> :
                                                availability === "taken" ? <div className="text-red-500 text-xs font-medium flex items-center gap-1"><X className="w-3 h-3" /> Taken</div> :
                                                    availability === "reserved" ? <div className="text-yellow-500 text-xs font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Reserved</div> : null}
                                    </div>
                                </div>
                                {slugOwner && address && (slugOwner as string).toLowerCase() === address.toLowerCase() && !currentSlug ? (
                                    <Button
                                        onClick={() => handleSync(debouncedSlug)}
                                        disabled={!debouncedSlug || isWritePending}
                                        variant="secondary"
                                    >
                                        {isWritePending && pendingAction === "claim" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                        Sync
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={async () => {
                                            if (!debouncedSlug || availability !== "available") return;
                                            setPendingAction("claim");
                                            try {
                                                await writeContractAsync({
                                                    address: CUSTOM_SLUG_REGISTRY_ADDRESS as `0x${string}`,
                                                    abi: ABI,
                                                    functionName: "claim",
                                                    args: [debouncedSlug]
                                                });
                                                toast.loading("Claiming slug...", { id: "claim-toast" });
                                            } catch (e: any) {
                                                console.error("Claim error:", e);
                                                toast.error(e.message || "Failed to initiate claim");
                                                setPendingAction(null);
                                            }
                                        }}
                                        disabled={availability !== "available" || isWritePending || isConfirming}
                                    >
                                        {isWritePending && pendingAction === "claim" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                        Claim
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Status Messages */}
                        <div className="min-h-[20px]">
                            {availability === "invalid" && debouncedSlug && (
                                <p className="text-xs text-red-500 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> Use only lowercase letters, numbers, and hyphens.
                                </p>
                            )}
                            {availability === "reserved" && cooldownEnd && (
                                <p className="text-xs text-yellow-500 flex items-center gap-1">
                                    <Loader2 className="w-3 h-3" /> In cooldown until {cooldownEnd.toLocaleDateString()}.
                                </p>
                            )}
                            {availability === "reserved" && !cooldownEnd && (
                                <p className="text-xs text-red-500 flex items-center gap-1">
                                    <ShieldAlert className="w-3 h-3" /> Reserved for official use.
                                </p>
                            )}
                            {availability === "available" && debouncedSlug && (
                                <p className="text-xs text-green-500 flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Available! Gas fees apply.
                                </p>
                            )}
                        </div>
                    </div>
                )
                }
            </CardContent >
        </Card >
    );
}
