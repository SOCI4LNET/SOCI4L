import { createPublicClient, http, parseAbiItem } from 'viem'
import { avalancheFuji } from 'viem/chains'

async function main() {
    const client = createPublicClient({
        chain: avalancheFuji,
        transport: http('https://api.avax-test.network/ext/bc/C/rpc'),
    })

    // get current block
    const currentBlock = await client.getBlockNumber()
    const fromBlock = currentBlock > 2000n ? currentBlock - 2000n : 0n;

    console.log("Searching from block", fromBlock, "to", currentBlock)

    const EVENT = parseAbiItem('event PremiumPurchased(address indexed user, uint256 paidAt, uint256 expiresAt, uint256 amount)')

    const logs = await client.getLogs({
        address: "0x63c4cBe555aFae0DA3C86f868F0BA496d74c988E", // FUJI_PREMIUM_PAYMENT_ADDRESS
        event: EVENT,
        fromBlock,
        toBlock: currentBlock
    })

    console.log("Found Logs:", logs.length)

    for (const log of logs) {
        console.log("TxHash:", log.transactionHash, "User:", log.args.user)
    }
}

main().catch(console.error)
