// api/proxy-qr.ts
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async (req: VercelRequest, res: VercelResponse) => {
  const { url } = req.query;
  if (!url || typeof url !== 'string' || !url.startsWith('http://')) {
    return res.status(400).json({ error: 'Notoʻgʻri URL' });
  }

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Resurs topilmadi');

    const buffer = await response.buffer();
    const contentType = response.headers.get('content-type') || 'image/png';
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.status(200).send(buffer);
  } catch (e) {
    console.error('Proxy xato:', e);
    res.status(500).json({ error: 'Suratni yuklab bo‘lmadi' });
  }
};
