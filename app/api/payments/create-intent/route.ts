import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: 'Card payments are not enabled. Payment intents will be available after secure server-side pricing is connected.',
    },
    { status: 501 },
  );
}

