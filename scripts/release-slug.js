// Script to release all slugs from contract
const { createPublicClient, createWalletClient, http, custom } = require('viem');
const { avalanche } = require('viem/chains');

const CONTRACT_ADDRESS = '0xC894a2677C7E619E9692E3bF4AFF58bE53173aA1';
const ABI = [
    {
        type: 'function',
        name: 'release',
        inputs: [],
        outputs: [],
        stateMutability: 'nonpayable'
    },
    {
        type: 'function',
        name: 'getActiveSlug',
        inputs: [{ name: 'user', type: 'address' }],
        outputs: [{ type: 'bytes32' }],
        stateMutability: 'view'
    }
];

async function releaseSlug() {
    // Connect to Truffle Dashboard
    const client = createWalletClient({
        chain: avalanche,
        transport: http('http://localhost:24012/rpc')
    });

    const publicClient = createPublicClient({
        chain: avalanche,
        transport: http('https://api.avax.network/ext/bc/C/rpc')
    });

    const [address] = await client.getAddresses();
    console.log('Connected address:', address);

    // Check if user has active slug
    const activeSlug = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: 'getActiveSlug',
        args: [address]
    });

    console.log('Active slug hash:', activeSlug);

    if (activeSlug === '0x0000000000000000000000000000000000000000000000000000000000000000') {
        console.log('No active slug to release');
        return;
    }

    // Release slug
    console.log('Releasing slug...');
    const hash = await client.writeContract({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: 'release',
        account: address
    });

    console.log('Transaction hash:', hash);
    console.log('Waiting for confirmation...');

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log('Slug released! Block:', receipt.blockNumber);
}

releaseSlug().catch(console.error);
