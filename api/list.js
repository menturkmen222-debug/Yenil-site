// api/list.js
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Faqat POST so‘rov qabul qilinadi' });
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

      // Faqat "mijoz_skrinshotlari" papkasidagi rasmlarni olish
      const result = await cloudinary.api.resources({
        type: 'upload',
        prefix: 'mijoz_skrinshotlari', // ← faqat shu papkani olib keladi
        max_results: 100,
        sort_by: 'created_at',
        direction: 'desc'
      });

      // Agar hech narsa topilmasa
      if (!result.resources || result.resources.length === 0) {
        return res.status(200).json({ images: [] });
      }

      // Rasmlarning URL larini tayyorlash
      const images = result.resources.map(r => ({
        url: r.secure_url, // HTTPS orqali ochiladi
        public_id: r.public_id,
        created_at: r.created_at
      }));

      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({ images });

    } catch (err) {
      console.error('Cloudinary ro‘yxat xatosi:', err);
      res.status(500).json({ error: 'Serverda xato yuz berdi' });
    }
  });
};
