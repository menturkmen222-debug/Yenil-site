// api/list.js
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Faqat POST so‘rov' });
  }

  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
  });

  req.on('end', async () => {
    try {
      const data = JSON.parse(body);
      if (data.password !== process.env.ADMIN_PASSWORD) {
        return res.status(403).json({ error: 'Parol noto‘g‘ri' });
      }

      // Rasmlarni asosiy papkadan olish (agar folder belgilanmagan bo'lsa)
      const result = await cloudinary.api.resources({
        type: 'upload',
        // prefix: 'mijoz_skrinshotlari',  ← agar papka yo'q bo'lsa, bu satrni olib tashlang
        max_results: 100,
        sort_by: 'created_at',
        direction: 'desc'
      });

      const images = result.resources.map(r => ({ url: r.secure_url }));
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({ images });
    } catch (err) {
      console.error('Ro‘yxat xatosi:', err);
      res.status(500).json({ error: 'Serverda xato' });
    }
  });
};
