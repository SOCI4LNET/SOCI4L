import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Validate DATABASE_URL before creating Prisma client
function validateDatabaseUrl(): void {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL environment variable is not set. ' +
      'Please set DATABASE_URL in your environment variables. ' +
      'For Vercel: Go to Settings > Environment Variables and add DATABASE_URL with your PostgreSQL connection string.'
    )
  }

  // Check for common invalid URLs
  if (databaseUrl.includes('db.prisma.io') || databaseUrl.includes('placeholder')) {
    throw new Error(
      'DATABASE_URL appears to be invalid or a placeholder. ' +
      'Current value: ' + databaseUrl.substring(0, 20) + '...\n' +
      'Please set a valid PostgreSQL connection string. ' +
      'For Vercel Postgres: Use POSTGRES_PRISMA_URL or POSTGRES_URL from your Vercel Storage dashboard.'
    )
  }

  // Check if it's a PostgreSQL URL (production) or SQLite (development)
  const isPostgres = databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://')
  const isSQLite = databaseUrl.startsWith('file:')

  if (process.env.NODE_ENV === 'production' && !isPostgres) {
    console.warn(
      '⚠️  WARNING: Production environment detected but DATABASE_URL is not a PostgreSQL connection string. ' +
      'This may cause database connection errors. ' +
      'Please set DATABASE_URL to a valid PostgreSQL connection string in Vercel environment variables.'
    )
  }
}

// Validate DATABASE_URL before creating client
try {
  validateDatabaseUrl()
} catch (error) {
  console.error('❌ Database configuration error:', error instanceof Error ? error.message : error)
  // In production, throw error to prevent silent failures
  if (process.env.NODE_ENV === 'production') {
    throw error
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

// Reuse Prisma client in both development and production (important for serverless)
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
} else {
  // In production (Vercel), also cache the client to avoid creating multiple instances
  globalForPrisma.prisma = prisma
}
