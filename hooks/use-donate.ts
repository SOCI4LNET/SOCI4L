import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'
import { avalanche } from 'wagmi/chains'
import { DONATE_PAYMENT_ADDRESS, DONATE_PAYMENT_ABI } from '@/lib/contracts/DonatePayment'
import { getFriendlyErrorMessage } from '@/lib/utils/errors'
import { toast } from 'sonner'

export function useDonate() {
    const { writeContractAsync, data: hash, isPending, error } = useWriteContract()

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
        chainId: avalanche.id,
    })

    const donate = async (recipientAddress: string, amount: string, message: string = '') => {
        try {
            const txHash = await writeContractAsync({
                address: DONATE_PAYMENT_ADDRESS as `0x${string}`,
                abi: DONATE_PAYMENT_ABI,
                functionName: 'donate',
                args: [recipientAddress as `0x${string}`, message],
                value: parseEther(amount),
                chainId: avalanche.id,
            })

            toast.success('Donation sent!', {
                description: 'Your transaction is being confirmed...',
            })

            return txHash
        } catch (error: any) {
            console.error('Donation error:', error)
            toast.error(getFriendlyErrorMessage(error, 'Donation failed'))
            throw error
        }
    }

    return {
        donate,
        hash,
        isPending,
        isConfirming,
        isSuccess,
        error,
    }
}
