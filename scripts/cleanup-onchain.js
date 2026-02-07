// On-chain cleanup script - Release all test slugs
// Run this with: node scripts/cleanup-onchain.js

const { createPublicClient, createWalletClient, http, keccak256, toBytes } = require('viem');
const { avalanche } = require('viem/chains');
const { privateKeyToAccount } = require('viem/accounts');

const CONTRACT_ADDRESS = '0xC894a2677C7E619E9692E3bF4AFF58bE53173aA1';
const RPC_URL = 'https://api.avax.network/ext/bc/C/rpc';

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
    },
    {
        type: 'function',
        name: 'resolveSlug',
        inputs: [{ name: 'slugHash', type: 'bytes32' }],
        outputs: [{ type: 'address' }],
        stateMutability: 'view'
    }
];

async function checkAndRelease(privateKey) {
    const account = privateKeyToAccount(privateKey);

    const publicClient = createPublicClient({
        chain: avalanche,
        transport: http(RPC_URL)
    });

    const walletClient = createWalletClient({
        account,
        chain: avalanche,
        transport: http(RPC_URL)
    });

    console.log(`\n🔍 Checking address: ${account.address}`);

    // Check active slug
    const activeSlug = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: 'getActiveSlug',
        args: [account.address]
    });

    if (activeSlug === '0x0000000000000000000000000000000000000000000000000000000000000000') {
        console.log('✅ No active slug - already clean');
        return;
    }

    console.log(`⚠️  Active slug hash: ${activeSlug}`);
    console.log('🧹 Releasing slug...');

    try {
        const hash = await walletClient.writeContract({
            address: CONTRACT_ADDRESS,
            abi: ABI,
            functionName: 'release'
        });

        console.log(`📝 Transaction: ${hash}`);

        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        console.log(`✅ Released! Block: ${receipt.blockNumber}`);
    } catch (error) {
        console.error('❌ Failed to release:', error.message);
    }
}

async function checkSlugOwner(slug) {
    const publicClient = createPublicClient({
        chain: avalanche,
        transport: http(RPC_URL)
    });

    const slugHash = keccak256(toBytes(slug));
    console.log(`\n🔍 Checking slug "${slug}" (${slugHash})`);

    const owner = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: 'resolveSlug',
        args: [slugHash]
    });

    if (owner === '0x0000000000000000000000000000000000000000') {
        console.log('✅ Slug is unclaimed');
    } else {
        console.log(`⚠️  Owned by: ${owner}`);
    }

    return owner;
}

async function main() {
    console.log('🧹 On-Chain Cleanup Script');
    console.log('==========================\n');

    // Check test slugs
    await checkSlugOwner('brokkr');
    await checkSlugOwner('xbrokkr');

    console.log('\n📋 To release a slug:');
    console.log('1. Export your private key: export PRIVATE_KEY=0x...');
    console.log('2. Run: node scripts/cleanup-onchain.js release');
    console.log('\nOr use Snowtrace Write Contract:');
    console.log(`https://snowtrace.io/address/${CONTRACT_ADDRESS}#writeContract`);
}

// If "release" argument provided and PRIVATE_KEY env var set
if (process.argv[2] === 'release' && process.env.PRIVATE_KEY) {
    checkAndRelease(process.env.PRIVATE_KEY)
        .then(() => process.exit(0))
        .catch(err => {
            console.error(err);
            process.exit(1);
        });
} else {
    main()
        .then(() => process.exit(0))
        .catch(err => {
            console.error(err);
            process.exit(1);
        });
}
