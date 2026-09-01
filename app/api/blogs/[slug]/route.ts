import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const blog = await prisma.blog.findFirst({
      where: { slug, isPublished: true },
    });

    if (!blog) {
      return NextResponse.json(
        { success: false, error: 'Blog not found.' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: blog });
  } catch (error) {
    console.error('Error fetching published blog:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch blog.' },
      { status: 500 },
    );
  }
}
