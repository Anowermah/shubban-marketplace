import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  let dbStatus = 'UNKNOWN';
  let dbLatencyMs = -1;

  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - dbStart;
    dbStatus = 'CONNECTED';
  } catch (error: any) {
    dbStatus = 'ERROR';
    console.error('Health check database error:', error.message);
  }

  const memoryUsage = process.memoryUsage();
  const uptimeSeconds = Math.floor(process.uptime());

  const isHealthy = dbStatus === 'CONNECTED';
  const totalResponseTimeMs = Date.now() - startTime;

  return NextResponse.json(
    {
      status: isHealthy ? 'HEALTHY' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      uptime: `${uptimeSeconds}s`,
      services: {
        database: {
          status: dbStatus,
          latency: `${dbLatencyMs}ms`,
        },
        memory: {
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
        },
      },
      responseTime: `${totalResponseTimeMs}ms`,
      version: '2.0.0-production',
    },
    {
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  );
}

