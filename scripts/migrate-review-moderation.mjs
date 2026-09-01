import nextEnv from '@next/env';
import { PrismaClient } from '@prisma/client';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

try {
  const statusResult = await prisma.$runCommandRaw({
    update: 'Review',
    updates: [{
      q: { status: { $exists: false } },
      u: [{
        $set: {
          status: 'APPROVED',
          isVerifiedPurchase: false,
          moderatedAt: '$createdAt',
          moderationNote: 'Approved during moderation-system backfill.',
        },
      }],
      multi: true,
    }],
  });
  await prisma.$runCommandRaw({
    update: 'Review',
    updates: [{
      q: { isVerifiedPurchase: { $exists: false } },
      u: { $set: { isVerifiedPurchase: false } },
      multi: true,
    }],
  });
  console.log(`[PASS] Review moderation backfill completed: ${JSON.stringify(statusResult)}.`);
} finally {
  await prisma.$disconnect();
}
