// api/railway.js
export default async function handler(req, res) {
  // Faqat GET so'rovlariga ruxsat berish
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Faqat GET so\'rovlariga ruxsat berilgan' });
  }

  const { code } = req.query;

  // Bron kodini tekshirish
  if (!code || typeof code !== 'string' || code.trim().length !== 6) {
    return res.status(400).json({ error: 'Bron kodi 6 harfli bo\'lishi kerak' });
  }

  const BOOKING_CODE = code.trim().toUpperCase();
  const DEVICE_ID = 'a77b5c929d9403811356e4dcf959973f';
  const API_URL = `https://railway.gov.tm/railway-api/bookings/${BOOKING_CODE}`;

  const HEADERS = {
    Accept: 'application/json, text/plain, */*',
    'X-Device-Id': DEVICE_ID,
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Mobile Safari/537.36'
  };

  try {
    // 1. API so'rovini yuborish
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: HEADERS,
      timeout: 15000
    });

    if (!response.ok) {
      // Agar 404 yoki boshqa xato bo'lsa
      console.error(`API xatosi: ${response.status} ${response.statusText}`);
      return res.status(404).json({ error: 'Bron kodi topilmadi yoki amal qilish muddati tugagan' });
    }

    const data = await response.json();

    // 2. Muvaffaqiyatli javobni tekshirish
    if (!data.success) {
      return res.status(404).json({ error: data.message || 'Bron topilmadi' });
    }

    // 3. Javobni qaytarish (sizning foydalanuvchi tomoningiz buni ko'rsatadi)
    return res.status(200).json(data);

  } catch (error) {
    console.error('Server xatosi:', error);
    return res.status(500).json({ error: 'Serverda xatolik yuz berdi' });
  }
}
