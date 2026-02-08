
import { createPublicClient, http, parseAbiItem, formatEther } from 'viem'
import { avalanche } from 'viem/chains'
import { PREMIUM_PAYMENT_ADDRESS } from '../lib/contracts/PremiumPayment'

async function main() {
    // Hardcoded address with NO hidden chars
    const TARGET = "0x26d3d5d5bb4da58309f2bd71714ad2317a2f31ec4d"

    const client = createPublicClient({
        chain: avalanche,
        transport: http(),
    })

    console.log('Checking PremiumPayment events for:', TARGET)

    const currentBlock = await client.getBlockNumber()
    console.log('Current Block:', currentBlock.toString())

    // Check last 2000 blocks (RPC limit)
    const fromBlock = currentBlock - 2000n

    // Fetch ALL events (no args filter to avoid validation error)
    const logs = await client.getLogs({
        address: PREMIUM_PAYMENT_ADDRESS as `0x${string}`,
        event: parseAbiItem('event PremiumPurchased(address indexed user, uint256 paidAt, uint256 expiresAt, uint256 amount)'),
        fromBlock,
        toBlock: currentBlock
    })

    console.log(`Found ${logs.length} total events. Filtering for user...`)

    const userLogs = logs.filter(log => log.args.user && log.args.user.toLowerCase() === TARGET.toLowerCase())

    console.log(`Found ${userLogs.length} events for target user`)

    userLogs.forEach(log => {
        const { user, paidAt, expiresAt, amount } = log.args
        console.log('MATCH FOUND:', {
            user,
            paidAt: new Date(Number(paidAt) * 1000).toISOString(),
            expiresAt: new Date(Number(expiresAt) * 1000).toISOString(),
            amount: formatEther(amount || 0n) + ' AVAX',
            tx: log.transactionHash
        })
    })
}

main().catch(console.error)
