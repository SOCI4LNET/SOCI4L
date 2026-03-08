import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const databaseUrlArg = process.argv[2]
const prisma = databaseUrlArg 
  ? new PrismaClient({
      datasources: {
        db: {
          url: databaseUrlArg
        }
      }
    })
  : new PrismaClient()

async function importDocs() {
  console.log('--- IMPORTING DOCUMENTS ---')
  
  const backupPath = path.join(process.cwd(), 'docs_backup.json')
  
  if (!fs.existsSync(backupPath)) {
    console.error('Error: docs_backup.json not found. Run "npx tsx scripts/export-docs.ts" first.')
    process.exit(1)
  }
  
  const data = JSON.parse(fs.readFileSync(backupPath, 'utf-8'))
  const { admins = [], articles = [] } = data
  
  // 1. Create/Update Admins first (important for foreign keys)
  console.log(`Processing ${admins.length} admins...`)
  for (const admin of admins) {
    const { id, address, name, role, createdAt } = admin
    await prisma.docsAdmin.upsert({
      where: { id },
      update: { address, name, role },
      create: { id, address, name, role, createdAt: new Date(createdAt) }
    })
  }

  // 2. Create/Update Articles
  console.log(`Processing ${articles.length} articles...`)
  for (const article of articles) {
    const { id, slug, title, description, content, category, published, viewCount, authorId, createdAt, updatedAt } = article
    await prisma.docsArticle.upsert({
      where: { id },
      update: { slug, title, description, content, category, published, viewCount, authorId, updatedAt: new Date(updatedAt) },
      create: { 
        id, slug, title, description, content, category, published, viewCount, authorId, 
        createdAt: new Date(createdAt), 
        updatedAt: new Date(updatedAt) 
      }
    })
  }
  
  console.log(`Successfully imported ${admins.length} admins and ${articles.length} articles.`)
  console.log('--- IMPORT COMPLETE ---')
}

importDocs()
  .catch(e => {
    console.error('Import failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
