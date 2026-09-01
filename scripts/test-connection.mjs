import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasourceUrl: "postgresql://neondb_owner:npg_rzVq6MeTs0gA@ep-wild-unit-b1b63j4d-pooler.c-5.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require&pgbouncer=true"
});

async function main() {
  try {
    const count = await prisma.user.count();
    console.log("Successfully connected! User count:", count);
  } catch (err) {
    console.error("Connection failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
