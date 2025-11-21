// api/proxy-qr.js
// Bu fayl Vercel-da /api/proxy-qr?url=http://... so'rovini qayta ishlaydi
// Maqsad: brauzerda "mixed content" xatosini yo'qotish uchun HTTP rasmni HTTPS orqali ko'rsatish

export default async function handler(req, res) {
  // CORS sozlamalari — barcha domenlardan so'rovga ruxsat berish
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONS so'rovini darhol qaytarish (preflight so'rovlari uchun)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Faqat GET so'rovlariga ruxsat
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Faqat GET so‘rovlariga ruxsat berilgan' });
  }

  const { url } = req.query;

  // URL mavjudligini va http:// bilan boshlanishini tekshirish
  if (!url || typeof url !== 'string' || !url.startsWith('http://')) {
    return res.status(400).json({
      error: 'Noto‘g‘ri yoki yetarli bo‘lmagan URL. Faqat http:// bilan boshlanuvchi URL ruxsat etiladi.'
    });
  }

  try {
    // Rasmni manbadan olish (http://...)
    const imageResponse = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Yenil-Demiryol-Proxy/1.0',
        'Accept': 'image/*'
      },
      // 10 soniya ichida javob qaytmasa, time-out
      signal: AbortSignal.timeout(10000)
    });

    // Agar HTTP xatosi bo'lsa (404, 500, ...)
    if (!imageResponse.ok) {
      console.error(`Rasmni yuklab bo'lmadi: ${url}, Status: ${imageResponse.status}`);
      return res.status(imageResponse.status).json({
        error: `Manbadan rasm olishda xato: ${imageResponse.statusText}`
      });
    }

    // Rasm turini aniqlash (agar berilgan bo'lsa)
    const contentType = imageResponse.headers.get('content-type') || 'image/png';

    // Faqat rasm turlariga ruxsat berish
    if (!contentType.startsWith('image/')) {
      console.warn(`Noto'g'ri kontent turi: ${contentType} — ${url}`);
      return res.status(400).json({ error: 'Faqat rasm fayllariga ruxsat beriladi' });
    }

    // Rasmni o'qish
    const arrayBuffer = await imageResponse.arrayBuffer();

    // Javobni sozlash
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 kun keshlash
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Rasmni foydalanuvchiga yuborish
    return res.status(200).send(Buffer.from(arrayBuffer));
  } catch (error) {
    // Agar tarmoq xatosi yoki time-out bo'lsa
    if (error.name === 'AbortError') {
      console.error('So‘rov muddati tugadi:', url);
      return res.status(504).json({ error: 'So‘rov muddati tugadi (rasm yuklanmadi)' });
    }

    console.error('Proxyda xatolik:', error.message, url);
    return res.status(500).json({ error: 'Server ichki xatosi yoki tarmoq muammosi' });
  }
}
