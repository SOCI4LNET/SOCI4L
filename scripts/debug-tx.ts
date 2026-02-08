
import { createPublicClient, http, parseAbiItem, formatEther } from 'viem'
import { avalanche } from 'viem/chains'
import { PREMIUM_PAYMENT_ADDRESS } from '../lib/contracts/PremiumPayment'

async function main() {
    const TX_HASH = '0xa6564cc81d0780eab5b241bd615bf0cb8bf206e1c827c83736b83b531d9a90b9'

    const client = createPublicClient({
        chain: avalanche,
        transport: http(),
    })

    console.log('Inspecting Transaction:', TX_HASH)

    const receipt = await client.getTransactionReceipt({ hash: TX_HASH })
    console.log('Status:', receipt.status)
    console.log('Block Number:', receipt.blockNumber.toString())
    console.log('Gas Used:', receipt.gasUsed.toString())
    console.log('Logs Found:', receipt.logs.length)

    receipt.logs.forEach((log, index) => {
        console.log(`\n--- Log ${index} ---`)
        console.log('Address:', log.address)
        console.log('Topics:', log.topics)
        console.log('Data:', log.data)

        if (log.address.toLowerCase() === PREMIUM_PAYMENT_ADDRESS.toLowerCase()) {
            console.log('>>> MATCHES PREMIUM PAYMENT CONTRACT <<<')
            try {
                const { decodeEventLog } = require('viem')
                const event = parseAbiItem('event PremiumPurchased(address indexed user, uint256 paidAt, uint256 expiresAt, uint256 amount)')
                const decoded = decodeEventLog({
                    abi: [event],
                    data: log.data,
                    topics: log.topics
                })
                console.log('DECODED EVENT:', decoded)
            } catch (e) {
                console.log('Failed to decode:', e)
            }
        }
    })
}

main().catch(console.error)
