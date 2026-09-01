function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[character] || character);
}

function safeActionUrl(value) {
  try {
    const url = new URL(value, process.env.NEXT_PUBLIC_APP_URL || 'https://www.stepandstyl.com');
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

export function buildPromoEmail(title, message, callToActionUrl, callToActionText) {
  const safeTitle = escapeHtml(title);
  const safeMessage = escapeHtml(message);
  const safeUrl = callToActionUrl ? safeActionUrl(callToActionUrl) : null;
  const safeActionText = callToActionText ? escapeHtml(callToActionText) : null;
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; max-w-2xl mx-auto p-4">
      <h2 style="color: #6B21A8; text-transform: uppercase;">${safeTitle}</h2>
      <p style="font-size: 16px; color: #333;">${safeMessage}</p>
      ${safeUrl && safeActionText ? `
        <div style="margin-top: 30px;">
          <a href="${escapeHtml(safeUrl)}" style="background-color: #9333EA; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">
            ${safeActionText}
          </a>
        </div>
      ` : ''}
      <hr style="margin-top: 40px; border: none; border-top: 1px solid #eee;" />
      <p style="font-size: 12px; color: #999;">
        You are receiving this email because you are a registered user of Step & Style.
      </p>
    </div>
  `;
}

