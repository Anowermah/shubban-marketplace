import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import os from 'os';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';

export async function GET() {
  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    cwd: process.cwd(),
    __dirname: typeof __dirname !== 'undefined' ? __dirname : null,
    env: {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL,
      PORT: process.env.PORT,
    },
    files: {},
    database: {
      status: 'testing',
      error: null,
      bookCount: 0,
      userCount: 0,
    },
  };

  // Check expected database file locations
  const dbPaths = [
    path.join(process.cwd(), 'prisma', 'dev.db'),
    path.join(process.cwd(), 'dev.db'),
  ];
  for (const p of dbPaths) {
    diagnostics.files[p] = fs.existsSync(p) ? `${(fs.statSync(p).size / 1024 / 1024).toFixed(2)} MB` : 'not_found';
  }

  // Check query engine files in .prisma/client
  const possibleEngineDirs = [
    path.join(process.cwd(), 'node_modules', '.prisma', 'client'),
    path.join(process.cwd(), '.next', 'standalone', 'node_modules', '.prisma', 'client'),
  ];
  for (const d of possibleEngineDirs) {
    if (fs.existsSync(d)) {
      try {
        diagnostics.files[d] = fs.readdirSync(d).filter(f => f.includes('engine'));
      } catch (e: any) {
        diagnostics.files[d] = `error: ${e.message}`;
      }
    } else {
      diagnostics.files[d] = 'not_found';
    }
  }

  // Attempt database queries
  try {
    const [bookCount, userCount] = await Promise.all([
      prisma.book.count(),
      prisma.user.count(),
    ]);
    diagnostics.database.status = 'connected';
    diagnostics.database.bookCount = bookCount;
    diagnostics.database.userCount = userCount;
  } catch (err: any) {
    diagnostics.database.status = 'failed';
    diagnostics.database.error = {
      message: err?.message,
      code: err?.code,
      clientVersion: err?.clientVersion,
      stack: err?.stack?.split('\n').slice(0, 5),
    };
  }

  return NextResponse.json(diagnostics, {
    status: diagnostics.database.status === 'connected' ? 200 : 500,
  });
}
