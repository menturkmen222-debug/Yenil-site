export default async function handler(req, res) {
  const { url } = req.query;

  // URL dogrylygyny barla
  if (!url || !url.startsWith('http://')) {
    return res.status(400).json({ error: 'Nädogry ýa-da gowy däl URL' });
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Surat tapylmady: ${response.status}`);
    }

    const buffer = await response.buffer();
    const contentType = response.headers.get('content-type') || 'image/png';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.status(200).send(buffer);
  } catch (err) {
    console.error('Proxy ýalňyşlygy:', err.message);
    res.status(500).json({ error: 'Surat çäkilip bilinmedi' });
  }
}
