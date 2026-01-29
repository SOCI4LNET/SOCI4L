'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Edit, Trash2, Power } from 'lucide-react'
import { toast } from 'sonner'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useRouter } from 'next/navigation'
import { EditLinkDialog } from '@/components/admin/edit-link-dialog'

interface LinkActionsProps {
    linkId: string
    linkTitle: string
    linkUrl: string
    enabled: boolean
    profileAddress: string
}

export function LinkActions({
    linkId,
    linkTitle,
    linkUrl,
    enabled,
    profileAddress,
}: LinkActionsProps) {
    const router = useRouter()
    const [isToggling, setIsToggling] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [showEditDialog, setShowEditDialog] = useState(false)

    async function handleToggleEnabled() {
        setIsToggling(true)
        try {
            const response = await fetch(`/api/admin/links/${linkId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled: !enabled }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to toggle link')
            }

            toast.success(enabled ? 'Link disabled' : 'Link enabled')
            router.refresh()
        } catch (error: any) {
            toast.error(error.message || 'Failed to toggle link')
            console.error('[LinkActions] Toggle error:', error)
        } finally {
            setIsToggling(false)
        }
    }

    async function handleDelete() {
        setIsDeleting(true)
        try {
            const response = await fetch(`/api/admin/links/${linkId}`, {
                method: 'DELETE',
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to delete link')
            }

            toast.success('Link deleted successfully')
            router.refresh()
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete link')
            console.error('[LinkActions] Delete error:', error)
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <div className="flex justify-end gap-2">
            {/* Toggle Enable/Disable */}
            <Button
                variant={enabled ? 'outline' : 'default'}
                size="sm"
                onClick={handleToggleEnabled}
                disabled={isToggling}
                className="h-7 text-xs gap-1.5"
            >
                <Power className="h-3 w-3" />
                {isToggling ? '...' : enabled ? 'Disable' : 'Enable'}
            </Button>

            {/* Edit - Open dialog */}
            <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1.5"
                onClick={() => setShowEditDialog(true)}
            >
                <Edit className="h-3 w-3" />
                Edit
            </Button>

            {/* Edit Dialog */}
            <EditLinkDialog
                linkId={linkId}
                linkTitle={linkTitle}
                linkUrl={linkUrl}
                open={showEditDialog}
                onOpenChange={setShowEditDialog}
            />

            {/* Delete with confirmation */}
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                        disabled={isDeleting}
                    >
                        <Trash2 className="h-3 w-3" />
                        Delete
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Link?</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                            <p>
                                Are you sure you want to delete{' '}
                                <strong>&quot;{linkTitle || 'Untitled'}&quot;</strong>?
                            </p>
                            <p className="text-xs font-mono bg-muted p-2 rounded break-all">
                                {linkUrl}
                            </p>
                            <p className="text-destructive font-semibold">
                                This action cannot be undone.
                            </p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? 'Deleting...' : 'Delete Link'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
