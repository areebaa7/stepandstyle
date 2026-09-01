import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startedAt = Date.now();
  try {
    await Promise.race([
      prisma.product.findFirst({ select: { id: true } }),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Database health check timed out.')), 3_000);
      }),
    ]);

    return NextResponse.json({
      status: 'ok',
      checks: { database: 'up' },
      responseTimeMs: Date.now() - startedAt,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    logError('health.check_failed', { component: 'database', error });
    return NextResponse.json({
      status: 'degraded',
      checks: { database: 'down' },
      responseTimeMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}

