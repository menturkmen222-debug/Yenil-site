// api/demiryol.ts
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async (req: VercelRequest, res: VercelResponse) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Faqat GET' });

  const { id } = req.query;
  if (!id || typeof id !== 'string' || !/^[A-Z0-9]{6}$/.test(id)) {
    return res.status(400).json({
      error: 'ID 6 ta katta harf/raqam bo\'lishi kerak',
      code: 'INVALID_ID'
    });
  }

  try {
    // Cloudflare Worker URL’iga so'rov yuborish
    const cloudflareUrl = `https://railway-proxy.menturkmen111.workers.dev?id=${id}`;
    const proxyRes = await fetch(cloudflareUrl, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
      },
      timeout: 15000,
    });

    if (!proxyRes.ok) {
      const text = await proxyRes.text();
      console.error(`Cloudflare xatosi (${proxyRes.status}):`, text);
      return res.status(proxyRes.status).json({ error: `Cloudflare: ${text}` });
    }

    const data = await proxyRes.json();
    return res.status(200).json(data);
  } catch (err: any) {
    console.error('Xatolik:', err.message);
    return res.status(500).json({ error: 'Server xatosi' });
  }
};
