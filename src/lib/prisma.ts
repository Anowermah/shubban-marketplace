import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

function resolveDatabaseUrl(): string {
  // If remote PostgreSQL or MySQL is specified (e.g. cPanel or Supabase), use that directly
  const customUrl = process.env.DATABASE_URL;
  if (customUrl && !customUrl.startsWith('file:')) {
    return customUrl;
  }

  // Detect paths for bundled SQLite
  const cwd = process.cwd();
  const possiblePaths = [
    path.join(cwd, 'prisma', 'dev.db'),
    path.join(cwd, 'dev.db'),
    path.resolve(cwd, '..', 'prisma', 'dev.db'),
  ];

  let sourceDbPath = '';
  for (const p of possiblePaths) {
    try {
      if (fs.existsSync(p)) {
        sourceDbPath = p;
        break;
      }
    } catch (e) {}
  }

  // On Vercel / AWS Lambda / cloud serverless environments:
  // The root filesystem /var/task is read-only. We copy dev.db into /tmp/dev.db which is writable.
  const isServerless =
    Boolean(process.env.VERCEL) ||
    Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME) ||
    Boolean(process.env.LAMBDA_TASK_ROOT) ||
    fs.existsSync('/tmp');

  if (isServerless && sourceDbPath) {
    try {
      const tmpDbPath = '/tmp/dev.db';
      if (!fs.existsSync(tmpDbPath)) {
        fs.copyFileSync(sourceDbPath, tmpDbPath);
      }
      if (fs.existsSync(tmpDbPath)) {
        return `file:${tmpDbPath}`;
      }
    } catch (e) {
      console.warn('[Prisma] Failed to copy SQLite to /tmp, using source path:', e);
    }
  }

  if (sourceDbPath) {
    return `file:${sourceDbPath}`;
  }

  return customUrl || 'file:./prisma/dev.db';
}

const resolvedDbUrl = resolveDatabaseUrl();
process.env.DATABASE_URL = resolvedDbUrl;

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: resolvedDbUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
