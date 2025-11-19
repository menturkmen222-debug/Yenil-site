// api/proxy-file.js
import { createHash } from 'crypto';

// Ruxsat berilgan manbalar (faqat Cloudinary va Backendless)
const ALLOWED_ORIGINS = [
  'https://res.cloudinary.com',
  'https://api.backendless.com'
];

// Kesh muddati: 1 kun
const MAX_AGE = 86400;

// Ruxsat berilgan MIME turlari (kengaytirish mumkin)
const ALLOWED_MIME_TYPES = [
  // Rasm
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  // Video
  'video/mp4',
  'video/quicktime', // .mov
  'video/x-msvideo', // .avi
  'video/webm',
  'video/x-matroska', // .mkv
  // Hujjatlar
  'application/pdf',
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  'application/octet-stream',
  // Matn
  'text/plain',
  'text/csv'
];

// MIME turi ruxsat etilganmi?
function isMimeTypeAllowed(contentType) {
  if (!contentType) return false;
  const baseType = contentType.split(';')[0].toLowerCase().trim();
  return ALLOWED_MIME_TYPES.includes(baseType);
}

export default async function handler(req, res) {
  const { url } = req.query;

  // 1. URL talab qilinadi
  if (!url) {
    return res.status(400).json({ error: 'URL talab qilinadi' });
  }

  let decodedUrl;
  try {
    decodedUrl = decodeURIComponent(url);
  } catch (e) {
    return res.status(400).json({ error: 'Yaroqsiz URL formati' });
  }

  // 2. Manba tekshiruvi
  let origin;
  try {
    origin = new URL(decodedUrl).origin;
  } catch (e) {
    return res.status(400).json({ error: 'Yaroqsiz URL' });
  }

  if (!ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed))) {
    return res.status(403).json({ error: 'Ruxsat etilmagan manba' });
  }

  // 3. Tashqi so'rov
  let response;
  try {
    response = await fetch(decodedUrl, {
      headers: {
        'User-Agent': 'Yenil-Proxy/1.0',
        'Accept': '*/*'
      },
      next: { revalidate: MAX_AGE }
    });
  } catch (err) {
    console.error('Fetch xatosi:', err.message, decodedUrl);
    return res.status(502).json({ error: 'Tashqi manbadan fayl yuklanmadi' });
  }

  if (!response.ok) {
    console.warn(`Fayl topilmadi (${response.status}):`, decodedUrl);
    return res.status(404).end();
  }

  // 4. Hajm cheklovi
  const contentLength = response.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_FILE_SIZE) {
    return res.status(413).json({ error: 'Fayl juda katta (maksimum 10 MB)' });
  }

  // 5. MIME-type tekshiruvi
  const contentType = response.headers.get('content-type');
  if (!isMimeTypeAllowed(contentType)) {
    console.warn('Ruxsat etilmagan MIME turi:', contentType, decodedUrl);
    return res.status(400).json({ error: 'Ruxsat etilmagan fayl turi' });
  }

  // 6. Faylni olish
  let buffer;
  try {
    buffer = await response.arrayBuffer();
  } catch (err) {
    console.error('Buffer xatosi:', err.message);
    return res.status(500).end();
  }

  if (buffer.byteLength === 0) {
    return res.status(404).end();
  }

  // 7. Javob sozlamalari
  const cacheKey = createHash('sha256').update(decodedUrl).digest('hex');

  res.setHeader('Content-Type', contentType || 'application/octet-stream');
  res.setHeader('Content-Length', buffer.byteLength);
  res.setHeader('Cache-Control', `public, max-age=${MAX_AGE}, immutable`);
  res.setHeader('ETag', `"${cacheKey}"`);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // 8. Faylni yuborish
  return res.status(200).send(Buffer.from(buffer));
}
