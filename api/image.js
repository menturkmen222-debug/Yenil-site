// api/proxy-image.ts
export default async (req, res) => {
  const { url } = req.query;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL talab qilinadi' });
  }
  if (!url.startsWith('https://res.cloudinary.com/')) {
    return res.status(403).json({ error: 'Faqat Cloudinary ruxsat etilgan' });
  }
  try {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.status(200).send(Buffer.from(buffer));
  } catch (e) {
    res.status(500).json({ error: 'Proxy xatosi' });
  }
};
