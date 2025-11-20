// .vercel/api/proxy.ts
import { VercelRequest, VercelResponse } from '@vercel/node';

// Ruxsat etilgan domenlar ro'yxati (xavfsizlik uchun)
const ALLOWED_HOSTS = [
  'res.cloudinary.com',
  'api.backendless.com',
  'www.yenil.ru', // agar backend Vercel orqali bo'lsa
  // Agar boshqa domenlarni ham qo'shish kerak bo'lsa, shu yerga qo'shing
];

function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return ALLOWED_HOSTS.includes(u.hostname);
  } catch {
    return false;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS sozlamalari
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONS so'rovi
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Faqat GET so'rovlari ruxsat etiladi
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Faqat GET so‘rovlari ruxsat etilgan' });
  }

  const { url } = req.query;

  // URL tekshiruvi
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL manzili talab qilinadi' });
  }

  // Xavfsizlik: faqat ruxsat etilgan domenlarga ruxsat berish
  if (!isValidUrl(url)) {
    return res.status(403).json({ error: 'Bu manzilga ruxsat berilmagan' });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Yenil/1.0; +https://www.yenil.ru)',
        'Accept': 'image/*,video/*,application/json,*/*',
      },
      next: {
        // Vercel Edge Cache: 1 kun
        revalidate: 86400,
      },
    });

    if (!response.ok) {
      console.error(`Tashqi manbadan yuklanmadi: ${url} → Status ${response.status}`);
      return res.status(response.status).json({
        error: `Tashqi manbadan yuklanmadi: ${response.statusText}`,
      });
    }

    // Tashqi javob turini olish
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    // Keşlash uchun max-age
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 soat

    // Binary ma'lumotni to'g'ridan-to'g'ri uzatish
    const buffer = Buffer.from(await response.arrayBuffer());
    return res.status(200).send(buffer);
  } catch (err: any) {
    console.error('Proxy xatolik:', err.message || err);
    return res.status(500).json({ error: 'Server xatosi' });
  }
}
