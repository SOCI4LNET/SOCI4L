import { prisma } from "../lib/prisma"

const ADMIN_ADDRESS = process.argv[2]

if (!ADMIN_ADDRESS) {
    console.error("Please provide a wallet address")
    process.exit(1)
}

async function main() {
    const admin = await prisma.docsAdmin.upsert({
        where: { address: ADMIN_ADDRESS.toLowerCase() },
        update: {},
        create: {
            address: ADMIN_ADDRESS.toLowerCase(),
            name: "Admin User",
            role: "SUPER_ADMIN"
        }
    })
    console.log(`Created admin user: ${admin.address}`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
