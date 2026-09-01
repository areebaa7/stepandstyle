import { NextRequest, NextResponse } from 'next/server';
import type { UploadApiResponse } from 'cloudinary';
import cloudinary from '@/lib/cloudinary';
import { authRateLimitHeaders, consumeAuthRateLimit, getAuthClientAddress } from '@/lib/authRateLimit';
import { assertRequestSize, MAX_RECEIPT_BYTES, uploadSecurityResponse, validateUploadFile } from '@/lib/uploadSecurity';

export async function POST(request: NextRequest) {
  try {
    assertRequestSize(request, MAX_RECEIPT_BYTES + 256 * 1024);
    const address = getAuthClientAddress(request);
    const rateLimit = await consumeAuthRateLimit({ scope: 'upload-receipt', identifier: address, limit: 10, windowMs: 60 * 60 * 1000 });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, code: 'UPLOAD_RATE_LIMITED', error: 'Too many receipt uploads. Please try again later.' },
        { status: 429, headers: authRateLimitHeaders(rateLimit) },
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) return NextResponse.json({ success: false, error: 'Receipt image is required.' }, { status: 400 });
    const validated = await validateUploadFile(file, { allowImages: true, allowVideos: false, imageMaxBytes: MAX_RECEIPT_BYTES, receipt: true });
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'step-and-style/receipts', resource_type: 'image', use_filename: false, unique_filename: true, overwrite: false },
        (error, upload) => error || !upload ? reject(error || new Error('Cloudinary returned no result.')) : resolve(upload),
      );
      stream.end(validated.buffer);
    });
    if (!result.secure_url?.startsWith('https://')) throw new Error('Cloudinary returned an insecure URL.');
    return NextResponse.json({ success: true, url: result.secure_url }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const securityResponse = uploadSecurityResponse(error);
    if (securityResponse) return securityResponse;
    console.error('Receipt upload failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to upload receipt.' }, { status: 500 });
  }
}
