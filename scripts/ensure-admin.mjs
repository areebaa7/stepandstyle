import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import nextEnv from '@next/env';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const srvUrl = process.env.DATABASE_URL || 'mongodb+srv://stepandstyl007_db_user:XsUr6EbrbabzosGk@cluster0.twll7ul.mongodb.net/stepandstyle?retryWrites=true&w=majority';
const prisma = new PrismaClient({ datasources: { db: { url: srvUrl } } });

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@stepandstyle.com';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      role: 'ADMIN',
      password: hashedPassword,
    },
    create: {
      email,
      password: hashedPassword,
      role: 'ADMIN',
      name: 'Admin User',
    },
  });

  console.log('SUCCESS: Admin user is ready in database!');
  console.log('Email:', user.email);
  console.log('Role:', user.role);
}

main()
  .catch((e) => {
    console.error('Error creating admin user:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
