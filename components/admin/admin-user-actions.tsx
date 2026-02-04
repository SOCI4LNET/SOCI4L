'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Ban, CheckCircle, Edit, ShieldAlert, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAccount } from 'wagmi'
import { banUser, unbanUser, updateUserProfile, verifyUser, unverifyUser } from '@/actions/admin'

interface AdminUserActionsProps {
    address: string
    isBanned: boolean
    isVerified: boolean
    currentBio?: string | null
    currentDisplayName?: string | null
}

export function AdminUserActions({
    address,
    isBanned,
    isVerified,
    currentBio,
    currentDisplayName,
}: AdminUserActionsProps) {
    const { address: adminAddress } = useAccount()
    const [banOpen, setBanOpen] = useState(false)
    const [editOpen, setEditOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [banReason, setBanReason] = useState('')

    // Edit form state
    const [bio, setBio] = useState(currentBio || '')
    const [displayName, setDisplayName] = useState(currentDisplayName || '')

    const handleBanToggle = async () => {
        if (!adminAddress) return

        setIsLoading(true)
        try {
            if (isBanned) {
                await unbanUser(adminAddress, address)
                toast.success('User unbanned successfully')
            } else {
                await banUser(adminAddress, address, banReason)
                toast.success('User banned successfully')
            }
            setBanOpen(false)
            setBanReason('')
        } catch (error) {
            toast.error(isBanned ? 'Failed to unban user' : 'Failed to ban user')
        } finally {
            setIsLoading(false)
        }
    }

    const handleUpdateProfile = async () => {
        if (!adminAddress) return

        setIsLoading(true)
        try {
            await updateUserProfile(adminAddress, address, {
                bio: bio.trim() || undefined,
                displayName: displayName.trim() || undefined
            })
            toast.success('Profile updated successfully')
            setEditOpen(false)
        } catch (error) {
            toast.error('Failed to update profile')
        } finally {
            setIsLoading(false)
        }
    }

    const handleVerifyToggle = async () => {
        if (!adminAddress) return

        setIsLoading(true)
        try {
            if (isVerified) {
                await unverifyUser(adminAddress, address)
                toast.success('User unverified successfully')
            } else {
                await verifyUser(adminAddress, address)
                toast.success('User verified successfully')
            }
        } catch (error) {
            toast.error(isVerified ? 'Failed to unverify user' : 'Failed to verify user')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex gap-2">
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                        <Edit className="h-4 w-4" />
                        Edit Profile
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit User Profile</DialogTitle>
                        <DialogDescription>
                            Make manual corrections to user content.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="displayName">Display Name</Label>
                            <Input
                                id="displayName"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="bio">Bio</Label>
                            <Textarea
                                id="bio"
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdateProfile} disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Button
                variant="outline"
                size="sm"
                onClick={handleVerifyToggle}
                disabled={isLoading}
                className={isVerified ? "text-blue-500 border-blue-200 hover:bg-blue-50" : ""}
            >
                <CheckCircle className={`h-4 w-4 mr-2 ${isVerified ? "fill-blue-500 text-white" : ""}`} />
                {isVerified ? 'Verified' : 'Verify'}
            </Button>

            <Dialog open={banOpen} onOpenChange={setBanOpen}>
                <DialogTrigger asChild>
                    <Button
                        variant={isBanned ? "default" : "destructive"}
                        size="sm"
                        className="gap-2"
                    >
                        {isBanned ? (
                            <>
                                <CheckCircle className="h-4 w-4" />
                                Unban User
                            </>
                        ) : (
                            <>
                                <Ban className="h-4 w-4" />
                                Ban User
                            </>
                        )}
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {isBanned ? 'Unban User' : 'Ban User'}
                        </DialogTitle>
                        <DialogDescription>
                            {isBanned
                                ? 'Are you sure you want to restore access for this user?'
                                : 'This will prevent the user from logging in or making changes.'}
                        </DialogDescription>
                    </DialogHeader>

                    {!isBanned && (
                        <div className="space-y-2 py-4">
                            <Label htmlFor="reason">Reason for ban (internal log)</Label>
                            <Input
                                id="reason"
                                placeholder="Spam, inappropriate content, etc."
                                value={banReason}
                                onChange={(e) => setBanReason(e.target.value)}
                            />
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setBanOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant={isBanned ? "default" : "destructive"}
                            onClick={handleBanToggle}
                            disabled={isLoading || (!isBanned && !banReason.trim())}
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isBanned ? 'Confirm Unban' : 'Confirm Ban'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
