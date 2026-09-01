import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import nextEnv from '@next/env';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@stepandstyle.com';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  
  const existing = await prisma.user.findUnique({ where: { email } });
  
  if (existing) {
    console.log(`Admin user ${email} already exists!`);
    return;
  }
  
  const hashedPassword = await bcrypt.hash(password, 10);
  
  await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name: 'Store Admin',
      role: 'ADMIN',
      emailVerifiedAt: new Date(),
    }
  });
  
  console.log(`✅ Admin user created successfully!`);
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
