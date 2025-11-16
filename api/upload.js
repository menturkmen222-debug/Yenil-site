// api/upload.js (tuzatilgan versiya)
const cloudinary = require('cloudinary').v2;
const busboy = require('busboy');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Faqat POST so‘rov qabul qilinadi' });
  }

  // Cloudinary sozlamalari to'g'ri kiritilganligini tekshirish
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error('Xatolik: Cloudinary muhit o‘zgaruvchilari yetarli emas');
    return res.status(500).json({ error: 'Server sozlamalari noto‘g‘ri' });
  }

  const bb = busboy({ headers: req.headers });
  let fileBuffer = [];

  bb.on('file', (name, file) => {
    file.on('data', (data) => {
      fileBuffer.push(data);
    });
  });

  bb.on('close', async () => {
    try {
      const buffer = Buffer.concat(fileBuffer);
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'mijoz_skrinshotlari', resource_type: 'image' },
          (error, result) => {
            if (error) {
              console.error('Cloudinary xatosi:', error.message);
              reject(error);
            } else {
              resolve(result);
            }
          }
        );
        const stream = require('stream');
        const pass = new stream.PassThrough();
        pass.end(buffer);
        pass.pipe(uploadStream);
      });

      res.status(200).json({ url: result.secure_url });
    } catch (err) {
      console.error('Server xatosi:', err);
      res.status(500).json({ error: 'Cloudinaryga yuklashda xatolik' });
    }
  });

  bb.on('error', (err) => {
    console.error('Busboy xatosi:', err);
    res.status(500).json({ error: 'Fayl qabul qilishda xatolik' });
  });

  req.pipe(bb);
};
