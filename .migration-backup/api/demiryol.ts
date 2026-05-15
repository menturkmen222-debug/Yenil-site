// api/demiryol.ts
import { VercelRequest, VercelResponse } from '@vercel/node';

const CLOUDFLARE_WORKER_URL = 'https://railway-proxy.menturkmen111.workers.dev';

// Retry + timeout bilan fetch
async function fetchWithRetry(
  url: string,
  retries: number = 3,
  baseDelay: number = 2500
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt < retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 18000); // 18 soniya

    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) return res;

      if (res.status >= 400 && res.status < 500) return res;

      lastError = new Error(`HTTP ${res.status}`);
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

// QR rasmini Base64 sifatida olish
async function fetchQrAsBase64(qrUrl: string): Promise<string | null> {
  if (!qrUrl.startsWith('http://')) return null;

  try {
    const res = await fetch(qrUrl);
    if (!res.ok) return null;

    const contentType = res.headers.get('content-type') || 'image/png';
    if (!contentType.startsWith('image/')) return null;

    const arrayBuffer = await res.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    return `${contentType};base64,${base64}`;
  } catch (e) {
    console.warn('QR rasm yuklanmadi:', qrUrl);
    return null;
  }
}

export default async (req: VercelRequest, res: VercelResponse) => {
  // ✅ CORS
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

    // QR kodni Base64 qilish
    if (
      data?.data?.booking?.tickets?.[0]?.qr_code &&
      typeof data.data.booking.tickets[0].qr_code === 'string' &&
      data.data.booking.tickets[0].qr_code.startsWith('http://')
    ) {
      const qrBase64 = await fetchQrAsBase64(data.data.booking.tickets[0].qr_code);
      if (qrBase64) {
        data.data.booking.tickets[0].qr_image = qrBase64;
        delete data.data.booking.tickets[0].qr_code;
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
