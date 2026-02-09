
const { PrismaClient } = require('@prisma/client')
const fs = require('fs');

const prisma = new PrismaClient()

async function main() {
    console.log('Attempting to release advisory locks...')

    try {
        const locks = await prisma.$queryRaw`
      SELECT
        l.pid,
        l.locktype,
        l.mode,
        l.granted,
        l.objid,
        a.usename,
        a.application_name,
        a.client_addr,
        a.state,
        a.query
      FROM pg_locks l
      JOIN pg_stat_activity a ON l.pid = a.pid
      WHERE l.locktype = 'advisory'
    `

        // Handle BigInt serialization
        const safeLocks = JSON.parse(JSON.stringify(locks, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        fs.writeFileSync('lock_details.json', JSON.stringify(safeLocks, null, 2));
        console.log('Lock details written to lock_details.json');

        if (locks.length > 0) {
            console.log(`Found ${locks.length} locks! Terminating sessions...`)

            for (const lock of locks) {
                if (lock.pid) {
                    console.log(`Terminating session ${lock.pid}...`)
                    try {
                        await prisma.$executeRawUnsafe(`SELECT pg_terminate_backend(${lock.pid})`)
                        console.log(`Terminated session ${lock.pid}`)
                    } catch (err) {
                        console.error(`Failed to terminate session ${lock.pid}:`, err)
                    }
                }
            }

        } else {
            console.log('No advisory locks found. Clean.')
        }

    } catch (e) {
        console.error('Error:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
