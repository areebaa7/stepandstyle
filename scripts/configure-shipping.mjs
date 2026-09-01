import nextEnv from '@next/env';
import { PrismaClient } from '@prisma/client';
import { readFile } from 'node:fs/promises';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const prisma = new PrismaClient();
const configuration = JSON.parse(
  await readFile(new URL('../lib/pakistan-shipping.json', import.meta.url), 'utf8'),
);

try {
  let cityCount = 0;
  for (const entry of configuration) {
    const region = await prisma.shippingRegion.upsert({
      where: { name: entry.region },
      update: { shippingCost: entry.shippingCost },
      create: { name: entry.region, shippingCost: entry.shippingCost },
    });

    for (const cityName of entry.cities) {
      await prisma.shippingCity.upsert({
        where: { name_regionId: { name: cityName, regionId: region.id } },
        update: {},
        create: { name: cityName, regionId: region.id },
      });
      cityCount += 1;
    }
  }

  console.log(`[PASS] Configured ${configuration.length} Pakistan shipping regions and ${cityCount} cities.`);
} finally {
  await prisma.$disconnect();
}
