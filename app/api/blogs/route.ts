import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const blogs = await prisma.blog.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: blogs });
  } catch (error) {
    console.error('Error fetching published blogs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch blogs.' },
      { status: 500 },
    );
  }
}
