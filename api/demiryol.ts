// api/demiryol.ts
import { VercelRequest, VercelResponse } from '@vercel/node';

// Konstantalar
const VALID_ID_REGEX = /^[A-Z0-9]{6}$/;
const DEVICE_ID = 'a77b5c929d9403811356e4dcf959973f';
const USER_AGENT = 'okhttp/4.9.3'; // Rasmiy Android ilovasi
const TIMEOUT_MS = 12000;
const MAX_RETRIES = 2;

async function fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRIES): Promise<Response> {
  try {
    const res = await fetch(url, options);
    if (res.status >= 500 && retries > 0) {
      // Server xatosi bo'lsa, kutib qayta urinib ko'rish
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchWithRetry(url, options, retries - 1);
    }
    return res;
  } catch (err) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw err;
  }
}

export default async (req: VercelRequest, res: VercelResponse) => {
  // CORS headerlari — brauzer uchun
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight (OPTIONS) so'rov
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Faqat GET qo'llab-quvvatlanadi
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
  }

  const { id } = req.query;

  // ID tekshiruvi
  if (!id || typeof id !== 'string' || !VALID_ID_REGEX.test(id)) {
    console.warn('Invalid ID format:', id);
    return res.status(400).json({
      error: 'Booking ID 6 ta katta harf yoki raqam bo\'lishi kerak (masalan: ABC123)',
      code: 'INVALID_ID_FORMAT'
    });
  }

  const apiUrl = `https://railway.gov.tm/railway-api/bookings/${id}`;

  try {
    const proxyRes = await fetchWithRetry(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'X-Device-Id': DEVICE_ID,
        'User-Agent': USER_AGENT,
      },
      timeout: TIMEOUT_MS,
    });

    // Logging: so'rov natijasi
    console.log(`railway.gov.tm response [${id}]:`, proxyRes.status);

    // Agar javob 404 bo'lsa — bron topilmadi
    if (proxyRes.status === 404) {
      return res.status(404).json({
        error: 'Bron topilmadi. Kodni tekshiring.',
        code: 'BOOKING_NOT_FOUND'
      });
    }

    // Agar boshqa xato bo'lsa
    if (!proxyRes.ok) {
      let errorMessage = `Status ${proxyRes.status}`;
      try {
        const errorText = await proxyRes.text();
        errorMessage += `: ${errorText}`;
        console.error(`railway.gov.tm xatosi [${id}]:`, errorMessage);
      } catch (e) {
        console.error(`railway.gov.tm xatosi [${id}]: Status ${proxyRes.status}, body o'qilmadi`);
      }

      // 403 — ehtimol IP bloklangan
      if (proxyRes.status === 403) {
        return res.status(403).json({
          error: 'So\'rov rad etildi. Server cheklovi.',
          code: 'ACCESS_DENIED'
        });
      }

      return res.status(proxyRes.status).json({
        error: 'railway.gov.tm xatosi',
        code: 'API_ERROR'
      });
    }

    // Javobni o'qish
    const contentType = proxyRes.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      console.error(`Kutilmagan content-type [${id}]:`, contentType);
      return res.status(502).json({
        error: 'Noma\'lum javob formati',
        code: 'INVALID_RESPONSE'
      });
    }

    const data = await proxyRes.json();

    // Muvaffaqiyatli javob
    return res.status(200).json(data);
  } catch (err: any) {
    const errorMsg = err.message || 'Noma\'lum xatolik';
    console.error(`Server xatosi [${id}]:`, errorMsg, err.stack || '');

    // Tarmoq xatosi (timeout, ulanish yo'q)
    if (errorMsg.includes('timeout') || errorMsg.includes('ETIMEDOUT') || errorMsg.includes('ECONNREFUSED')) {
      return res.status(504).json({
        error: 'railway.gov.tm ga ulanish vaqti tugadi',
        code: 'GATEWAY_TIMEOUT'
      });
    }

    // Boshqa xatolar
    return res.status(500).json({
      error: 'Server ichki xatosi',
      code: 'INTERNAL_ERROR'
    });
  }
};
