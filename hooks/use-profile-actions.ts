import { toast } from 'sonner'

export function useProfileActions() {
    const handleCopyHash = async (hash: string) => {
        try {
            await navigator.clipboard.writeText(hash)
            toast.success('Hash copied')
        } catch {
            toast.error('Failed to copy')
        }
    }

    return { handleCopyHash }
}
