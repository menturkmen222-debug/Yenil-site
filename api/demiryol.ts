// api/demiryol.ts
import { VercelRequest, VercelResponse } from '@vercel/node';

// Cloudflare Worker URL — o'zgartirishingiz shart emas
const CLOUDFLARE_WORKER_URL = 'https://railway-proxy.menturkmen111.workers.dev';

// Retry + Timeout bilan fetch
async function fetchWithRetry(
  url: string,
  retries: number = 3,
  baseDelay: number = 2000
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt < retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 18000); // 18 soniya

    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json, text/plain, */*',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        return res;
      }

      // 4xx xatoliklarni qayta urinishsiz qaytarish
      if (res.status >= 400 && res.status < 500) {
        return res;
      }

      // 5xx yoki boshqa xatolik — qayta urinish
      lastError = new Error(`HTTP ${res.status}: ${res.statusText}`);
    } catch (err) {
      clearTimeout(timeoutId);
      lastError = err;
    }

    // Oxirgi urinish bo'lmagan bo'lsa, kutib qayta urinamiz
    if (attempt < retries - 1) {
      await new Promise((resolve) => setTimeout(resolve, baseDelay * (attempt + 1)));
    }
  }

  throw lastError;
}

export default async (req: VercelRequest, res: VercelResponse) => {
  // ✅ CORS sozlamalari
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONS so'rovini darhol qaytarish
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Faqat GET ruxsat etilgan
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Faqat GET so‘rovlariga ruxsat berilgan' });
  }

  const { id } = req.query;

  // ✅ ID tekshiruvi
  if (!id || typeof id !== 'string' || !/^[A-Z0-9]{6}$/.test(id)) {
    return res.status(400).json({
      error: 'ID 6 ta katta harf/raqam bo‘lishi kerak',
      code: 'INVALID_ID',
    });
  }

  try {
    const fullUrl = `${CLOUDFLARE_WORKER_URL}?id=${encodeURIComponent(id)}`;

    // ✅ Retry bilan so'rov
    const proxyRes = await fetchWithRetry(fullUrl, 3, 2500);

    // Agar Cloudflare Worker 4xx qaytarsa — uni ham qaytarish
    if (!proxyRes.ok) {
      // Javob JSON bo'lishi ham, bo'lmasa ham ishlash kerak
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

    // ✅ Muvaffaqiyatli javob
    const data = await proxyRes.json();
    return res.status(200).json(data);
  } catch (err: any) {
    // ❌ Umumiy server xatosi
    const errorMsg = err?.message || 'Server ichki xatosi';
    console.error('API xatosi:', errorMsg, err);

    // Agar xato timeout bo'lsa, aniqroq xabar
    if (err?.name === 'AbortError') {
      return res.status(504).json({ error: 'So‘rov vaqti tugadi (railway.gov.tm javob bermadi)' });
    }

    return res.status(500).json({ error: 'Server xatosi yoki tarmoq muammosi' });
  }
};
