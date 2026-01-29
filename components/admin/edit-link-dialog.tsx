'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

interface EditLinkDialogProps {
    linkId: string
    linkTitle: string
    linkUrl: string
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EditLinkDialog({
    linkId,
    linkTitle,
    linkUrl,
    open,
    onOpenChange,
}: EditLinkDialogProps) {
    const router = useRouter()
    const [title, setTitle] = useState(linkTitle)
    const [url, setUrl] = useState(linkUrl)
    const [isSaving, setIsSaving] = useState(false)

    // Reset form when dialog opens with new data
    useEffect(() => {
        if (open) {
            setTitle(linkTitle)
            setUrl(linkUrl)
        }
    }, [open, linkTitle, linkUrl])

    async function handleSave() {
        setIsSaving(true)
        try {
            const response = await fetch(`/api/admin/links/${linkId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title.trim(),
                    url: url.trim(),
                }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to update link')
            }

            toast.success('Link updated successfully')
            onOpenChange(false)
            router.refresh()
        } catch (error: any) {
            toast.error(error.message || 'Failed to update link')
            console.error('[EditLinkDialog] Save error:', error)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit Link</DialogTitle>
                    <DialogDescription>
                        Update the link title and URL. Changes will be saved immediately.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Link title"
                            maxLength={100}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="url">URL</Label>
                        <Input
                            id="url"
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://example.com"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isSaving}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving || !url.trim()}
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            'Save Changes'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
