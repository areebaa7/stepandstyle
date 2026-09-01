import { createHash } from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';

function secret() {
  const value = process.env.JWT_SECRET;
  if (!value) throw new Error('JWT_SECRET is not defined');
  return new TextEncoder().encode(value);
}

export function purchaseEventId(orderId: string) {
  return `purchase_${createHash('sha256').update(orderId).digest('hex')}`;
}

export async function signPurchaseClaim(orderId: string) {
  return new SignJWT({ orderId, purpose: 'purchase-conversion' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(secret());
}

export async function verifyPurchaseClaim(token: string, orderId: string) {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload.purpose === 'purchase-conversion' && payload.orderId === orderId;
  } catch {
    return false;
  }
}
