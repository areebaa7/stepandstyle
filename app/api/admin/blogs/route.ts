import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    if (!await verifyAdminRequest(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const blogs = await prisma.blog.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: blogs,
    });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blogs' },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!await verifyAdminRequest(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, content, image, images, videoUrl, author, category, tags, isPublished } = body;

    if (!title || !description || !content) {
      return NextResponse.json(
        { error: 'Title, description, and content are required' },
        { status: 400 },
      );
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    const blog = await prisma.blog.create({
      data: {
        slug,
        title,
        description,
        content,
        image: image || null,
        images: images || [],
        videoUrl: videoUrl || null,
        author: author || null,
        category: category || null,
        tags: tags || [],
        isPublished: isPublished || false,
      },
    });

    return NextResponse.json({
      success: true,
      data: blog,
    });
  } catch (error) {
    console.error('Error creating blog:', error);
    return NextResponse.json(
      { error: 'Failed to create blog' },
      { status: 500 },
    );
  }
}
