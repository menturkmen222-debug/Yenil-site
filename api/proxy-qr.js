// Vercel API: /api/proxy-qr.js
export default async function handler(req, res) {
  const { url } = req.query;
  if (!url || !url.startsWith('http://')) {
    return res.status(400).json({ error: 'Invalid URL' });
  }
  try {
    const response = await fetch(url);
    const buffer = await response.buffer();
    res.setHeader('Content-Type', response.headers.get('content-type') || 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.status(200).send(buffer);
  } catch (err) {
    res.status(500).json({ error: 'Failed to proxy image' });
  }
}
