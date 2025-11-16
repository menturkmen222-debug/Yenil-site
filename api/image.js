// api/image.js
const cloudinary = require('cloudinary').v2;
const https = require('https');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = (req, res) => {
  const { public_id } = req.query;

  if (!public_id) {
    return res.status(400).json({ error: 'public_id talab qilinadi' });
  }

  // Parol bilan himoyalash (ixtiyoriy, lekin tavsiya etiladi)
  // Agar parol kerak bo'lsa, keyingi qismda izoh berilgan
  try {
    // Cloudinarydan to'g'ri URL olish
    const url = cloudinary.url(public_id, {
      secure: true,
      raw: true // to'g'ri CDN URL
    });

    // Rasmni Vercel orqali to'g'ridan-to'g'ri yuborish (proxy)
    const imgReq = https.request(url, (imgRes) => {
      // MIME turini o'tkazish
      res.setHeader('Content-Type', imgRes.headers['content-type']);
      res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 kun kesh
      imgRes.pipe(res);
    });

    imgReq.on('error', (err) => {
      console.error('Proxy xatosi:', err.message);
      res.status(500).end('Rasmni yuklab bo‘lmadi');
    });

    imgReq.end();
  } catch (err) {
    console.error('Cloudinary URL xatosi:', err);
    res.status(500).end('URL yaratishda xato');
  }
};
