
import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function backup() {
    console.log('🚀 Starting Database Backup...')
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupDir = '/Users/brokkr/Documents/SOCI4L-DB-BACKUPS'

    if (!fs.existsSync(backupDir)) {
        console.log(`⚠️ Backup directory not found at ${backupDir}. Creating it...`)
        fs.mkdirSync(backupDir, { recursive: true })
    }

    const backupPath = path.join(backupDir, `backup-${timestamp}.json`)
    const data: any = {}

    // List of models to backup (matching schema.prisma)
    const models = [
        'profile',
        'socialConnection',
        'userActivityLog',
        'showcaseItem',
        'follow',
        'block',
        'linkCategory',
        'profileLink',
        'emailSubscription',
        'analyticsEvent',
        'scoreSnapshot',
        'adminAuditLog',
        'mute',
        'userList',
        'userListMember',
        'docsAdmin',
        'docsArticle',
        'slugCooldown',
        'indexerState',
        'processedEvent',
        'billingInteraction',
        'notification'
    ]

    try {
        for (const model of models) {
            console.log(`📦 Exporting ${model}...`)
            // @ts-ignore - dynamic model access
            data[model] = await prisma[model].findMany()
        }

        fs.writeFileSync(backupPath, JSON.stringify(data, (key, value) => {
            if (typeof value === 'bigint') return value.toString()
            return value
        }, 2))

        console.log(`\n✅ Backup completed successfully!`)
        console.log(`📂 File: ${backupPath}`)
        console.log(`📊 Total records: ${Object.values(data).flat().length}`)
    } catch (error) {
        console.error('\n❌ Backup failed:', error)
    } finally {
        await prisma.$disconnect()
    }
}

backup()
