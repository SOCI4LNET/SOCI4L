import { createPublicClient, http, parseAbi } from 'viem';
import { avalanche } from 'viem/chains';

const client = createPublicClient({
    chain: avalanche,
    transport: http()
});

const ABI = parseAbi([
    'function treasury() view returns (address)',
    'function PREMIUM_PRICE() view returns (uint256)'
]);

const ADDRESS = "0x9bA02537447E6DcdeF72D0e98a4C82E6B73E3cCC";

async function main() {
    console.log("Checking contract:", ADDRESS);

    try {
        const treasury = await client.readContract({
            address: ADDRESS,
            abi: ABI,
            functionName: 'treasury'
        });
        console.log("Treasury:", treasury);

        const price = await client.readContract({
            address: ADDRESS,
            abi: ABI,
            functionName: 'PREMIUM_PRICE'
        });
        console.log("Price:", price.toString());

    } catch (e) {
        console.error("Error:", e);
    }
}

main();
