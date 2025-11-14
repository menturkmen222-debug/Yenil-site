// api/demiryol.ts
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async (req: VercelRequest, res: VercelResponse) => {
  // CORS headerlarni qo'shish
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight so'rov (OPTIONS) uchun
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Faqat GET so'rov
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Faqat GET so\'rov qo\'llab-quvvatlanadi' });
  }

  const { id } = req.query;

  // ID ni tekshirish
  if (!id || typeof id !== 'string' || !/^[A-Z0-9]{6}$/.test(id)) {
    return res.status(400).json({
      error: 'Booking ID 6 ta katta harf yoki raqam bo\'lishi kerak (masalan: QUAPWZ)'
    });
  }

  try {
    // railway.gov.tm ga so'rov
    const proxyRes = await fetch(`https://railway.gov.tm/railway-api/bookings/${id}`, {
      headers: {
        Accept: 'application/json, text/plain, */*',
        'X-Device-Id': 'a77b5c929d9403811356e4dcf959973f',
      },
      timeout: 10000,
    });

    if (!proxyRes.ok) {
      const text = await proxyRes.text();
      return res.status(proxyRes.status).json({ error: `railway.gov.tm: ${text}` });
    }

    const data = await proxyRes.json();
    return res.status(200).json(data);
  } catch (err: any) {
    console.error('Xatolik:', err.message);
    return res.status(500).json({ error: 'Server xatosi' });
  }
};
