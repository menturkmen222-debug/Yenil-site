export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Faqat GET so\'rovlariga ruxsat berilgan' });
  }

  const { code } = req.query;
  if (!code || code.length !== 6) {
    return res.status(400).json({ error: 'Bron kodi 6 harfli bo\'lishi kerak' });
  }

  const DEVICE_ID = 'a77b5c929d9403811356e4dcf959973f';
  const API_URL = `https://railway.gov.tm/railway-api/bookings/${code}`;

  try {
    const response = await fetch(API_URL, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'X-Device-Id': DEVICE_ID,
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Mobile Safari/537.36'
      }
    });

    if (!response.ok) {
      return res.status(404).json({ error: 'Bron topilmadi yoki amal qilish muddati tugagan' });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error('Xatolik:', err.message);
    return res.status(500).json({ error: 'Serverda xatolik', details: err.message });
  }
}
