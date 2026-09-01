import Stripe from 'stripe';

const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
  console.warn('Stripe secret key is not configured. Card payments will be disabled.');
}

export const stripe = secretKey
  ? new Stripe(secretKey, {
      apiVersion: '2025-11-17.clover' as any,
    })
  : null;


