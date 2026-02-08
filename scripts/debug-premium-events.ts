
import { createPublicClient, http, parseAbiItem, formatEther } from 'viem'
import { avalanche } from 'viem/chains'
import { PREMIUM_PAYMENT_ADDRESS } from '../lib/contracts/PremiumPayment'

async function main() {
    const client = createPublicClient({
        chain: avalanche,
        transport: http(),
    })

    console.log('Checking PremiumPayment events...')
    console.log('Contract:', PREMIUM_PAYMENT_ADDRESS)

    const currentBlock = await client.getBlockNumber()
    console.log('Current Block:', currentBlock.toString())

    // Check last 2000 blocks (RPC limit)
    const fromBlock = currentBlock - 2000n
    console.log('Scanning from:', fromBlock.toString())

    const logs = await client.getLogs({
        address: PREMIUM_PAYMENT_ADDRESS as `0x${string}`,
        event: parseAbiItem('event PremiumPurchased(address indexed user, uint256 paidAt, uint256 expiresAt, uint256 amount)'),
        fromBlock,
        toBlock: currentBlock
    })

    console.log(`Found ${logs.length} events`)

    logs.forEach(log => {
        const { user, paidAt, expiresAt, amount } = log.args
        console.log('Event:', {
            user,
            paidAt: new Date(Number(paidAt) * 1000).toISOString(),
            expiresAt: new Date(Number(expiresAt) * 1000).toISOString(),
            amount: formatEther(amount || 0n) + ' AVAX',
            tx: log.transactionHash
        })
    })
}

main().catch(console.error)
