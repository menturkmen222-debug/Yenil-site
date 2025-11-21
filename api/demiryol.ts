// api/demiryol.ts
import { VercelRequest, VercelResponse } from '@vercel/node';

const CLOUDFLARE_WORKER_URL = 'https://railway-proxy.menturkmen111.workers.dev';
const SELF_ORIGIN = 'https://www.yenil.ru'; // Sizning domen

async function fetchWithRetry(
  url: string,
  retries: number = 3,
  baseDelay: number = 2000
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt < retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 18000);

    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) return res;

      if (res.status >= 400 && res.status < 500) return res;

      lastError = new Error(`HTTP ${res.status}: ${res.statusText}`);
    } catch (err) {
      clearTimeout(timeoutId);
      lastError = err;
    }

    if (attempt < retries - 1) {
      await new Promise((resolve) => setTimeout(resolve, baseDelay * (attempt + 1)));
    }
  }

  throw lastError;
}

// QR URL-ni proxy orqali qayta ishlash
function processQrCode(ticket: any) {
  if (!ticket?.qr_code || typeof ticket.qr_code !== 'string') return;
  
  if (ticket.qr_code.startsWith('http://')) {
    try {
      const encodedUrl = encodeURIComponent(ticket.qr_code);
      ticket.qr_code = `${SELF_ORIGIN}/api/proxy-qr?url=${encodedUrl}`;
    } catch (e) {
      // Encoding muvaffaqiyatsiz bo'lsa, QR-ni o'chirib tashlaymiz
      ticket.qr_code = null;
    }
  }
  // `https://` URL-lar o'zgarishsiz qoladi
}

export default async (req: VercelRequest, res: VercelResponse) => {
  // ✅ CORS sozlamalari
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Faqat GET so‘rovlariga ruxsat berilgan' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string' || !/^[A-Z0-9]{6}$/.test(id)) {
    return res.status(400).json({
      error: 'ID 6 ta katta harf/raqam bo‘lishi kerak',
      code: 'INVALID_ID',
    });
  }

  try {
    const fullUrl = `${CLOUDFLARE_WORKER_URL}?id=${encodeURIComponent(id)}`;
    const proxyRes = await fetchWithRetry(fullUrl, 3, 2500);

    if (!proxyRes.ok) {
      let errorMessage = '';
      try {
        const errJson = await proxyRes.json();
        errorMessage = errJson.error || `Cloudflare xato: ${proxyRes.status}`;
      } catch {
        const errText = await proxyRes.text();
        errorMessage = `Cloudflare xatosi (${proxyRes.status}): ${errText.substring(0, 200)}`;
      }
      console.error(`Cloudflare dan xato:`, errorMessage);
      return res.status(proxyRes.status).json({ error: errorMessage });
    }

    const data = await proxyRes.json();

    // ✅ QR kodni xavfsiz HTTPS URL-ga aylantirish
    if (data?.data?.booking?.tickets?.length) {
      for (const ticket of data.data.booking.tickets) {
        processQrCode(ticket);
      }
    }

    return res.status(200).json(data);
  } catch (err: any) {
    const errorMsg = err?.message || 'Server ichki xatosi';
    console.error('API xatosi:', errorMsg, err);

    if (err?.name === 'AbortError') {
      return res.status(504).json({ error: 'So‘rov vaqti tugadi (railway.gov.tm javob bermadi)' });
    }

    return res.status(500).json({ error: 'Server xatosi yoki tarmoq muammosi' });
  }
};
