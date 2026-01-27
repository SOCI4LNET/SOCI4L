import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Get DATABASE_URL with fallback to Prisma Postgres variables
function getDatabaseUrl(): string {
  // Prioritize Prisma Postgres variables (Vercel Prisma Postgres)
  // This ensures we use connection pooling if available, which is critical for serverless

  // Try PRISMA_DATABASE_URL first (Prisma Accelerate with connection pooling)
  if (process.env.PRISMA_DATABASE_URL) {
    return process.env.PRISMA_DATABASE_URL
  }

  // Next, try POSTGRES_PRISMA_URL (Vercel Postgres with Prisma pooling)
  if (process.env.POSTGRES_PRISMA_URL) {
    return process.env.POSTGRES_PRISMA_URL
  }

  // Create a priority for POSTGRES_URL if others are missing
  if (process.env.POSTGRES_URL) {
    return process.env.POSTGRES_URL
  }

  // Fallback to standard DATABASE_URL
  return process.env.DATABASE_URL || ''
}

// Validate DATABASE_URL before creating Prisma client
function validateDatabaseUrl(): void {
  const databaseUrl = getDatabaseUrl()

  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL environment variable is not set. ' +
      'Please set DATABASE_URL in your Vercel environment variables. ' +
      'For Prisma Postgres: Copy PRISMA_DATABASE_URL or POSTGRES_URL from your Vercel Storage dashboard and set it as DATABASE_URL.'
    )
  }

  // Check for placeholder values (but allow db.prisma.io as it's valid for Prisma Postgres)
  if (databaseUrl.includes('placeholder') || databaseUrl === 'postgresql://user:password@host:5432/database') {
    throw new Error(
      'DATABASE_URL appears to be a placeholder. ' +
      'Please set a valid PostgreSQL connection string. ' +
      'For Prisma Postgres: Copy PRISMA_DATABASE_URL or POSTGRES_URL from your Vercel Storage dashboard.'
    )
  }

  // Check if it's a PostgreSQL URL (production) or SQLite (development)
  const isPostgres = databaseUrl.startsWith('postgresql://') ||
    databaseUrl.startsWith('postgres://') ||
    databaseUrl.startsWith('prisma+postgres://') // Prisma Accelerate format
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
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
  })

// Reuse Prisma client in both development and production (important for serverless)
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
} else {
  // In production (Vercel), also cache the client to avoid creating multiple instances
  globalForPrisma.prisma = prisma
}
