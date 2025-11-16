// api/image.js
const cloudinary = require('cloudinary').v2;
const https = require('https');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = async (req, res) => {
  const { public_id } = req.query;

  if (!public_id) {
    return res.status(400).json({ error: 'public_id kerak' });
  }

  // Parol bilan himoyalash (ixtiyoriy, lekin tavsiya etiladi)
  if (req.headers['x-admin-pass'] !== process.env.ADMIN_PASSWORD) {
    return res.status(403).end();
  }

  try {
    // Cloudinarydan rasmni olish
    const url = cloudinary.url(public_id, {
      secure: true,
      raw: true // to'g'ri URL
    });

    // Rasmni proxy qilish
    const imgRes = await new Promise((resolve, reject) => {
      https.get(url, (response) => {
        resolve(response);
      }).on('error', reject);
    });

    // MIME turini olish
    const contentType = imgRes.headers['content-type'] || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 kun kesh

    imgRes.pipe(res);
  } catch (err) {
    console.error('Rasm proxy xatosi:', err);
    res.status(500).end();
  }
};
