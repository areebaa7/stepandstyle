import { verifyAdminRequest } from '@/lib/auth';

export async function isAdminRequest(request: Request) {
  return Boolean(await verifyAdminRequest(request));
}
