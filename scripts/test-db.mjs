import { PrismaClient } from '@prisma/client';

const srvUrl = 'mongodb+srv://stepandstyl007_db_user:XsUr6EbrbabzosGk@cluster0.twll7ul.mongodb.net/stepandstyle?retryWrites=true&w=majority';
const prisma = new PrismaClient({ datasources: { db: { url: srvUrl } } });

async function main() {
  const admin = await prisma.user.findUnique({ where: { email: 'admin@stepandstyle.com' } });
  console.log('ADMIN_IN_PRODUCTION_ATLAS:', admin ? { id: admin.id, email: admin.email, role: admin.role } : 'NOT_FOUND');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
