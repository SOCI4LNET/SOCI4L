import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function exportDocs() {
  console.log('--- EXPORTING DOCUMENTS ---')
  
  const admins = await prisma.docsAdmin.findMany()
  const articles = await prisma.docsArticle.findMany()
  
  const data = {
    admins,
    articles
  }
  
  const backupPath = path.join(process.cwd(), 'docs_backup.json')
  fs.writeFileSync(backupPath, JSON.stringify(data, null, 2))
  
  console.log(`Successfully exported ${admins.length} admins and ${articles.length} articles to docs_backup.json`)
  console.log('--- EXPORT COMPLETE ---')
}

exportDocs()
  .catch(e => {
    console.error('Export failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
