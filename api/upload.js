// api/upload.js
const cloudinary = require('cloudinary').v2;
const busboy = require('busboy');

// Cloudinary sozlamalari (Vercel Environment Variables dan olinadi)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Faqat POST so‘rov qabul qilinadi' });
  }

  const bb = busboy({ headers: req.headers });
  let fileBuffer = [];
  let mimeType = '';

  bb.on('file', (name, file, info) => {
    const { mimeType: type } = info;
    mimeType = type;

    file.on('data', (data) => {
      fileBuffer.push(data);
    });

    file.on('end', () => {
      // Fayl tugadi — hech narsa qilmaymiz, chunki close da ishlaymiz
    });
  });

  bb.on('close', async () => {
    try {
      const buffer = Buffer.concat(fileBuffer);

      // Cloudinaryga yuklash
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'mijoz_skrinshotlari',
            resource_type: 'image',
            overwrite: false,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        const stream = require('stream');
        const passThrough = new stream.PassThrough();
        passThrough.end(buffer);
        passThrough.pipe(uploadStream);
      });

      res.status(200).json({
        success: true,
        url: result.secure_url,
        id: result.public_id,
      });
    } catch (err) {
      console.error('Yuklash xatosi:', err);
      res.status(500).json({ error: 'Serverda xato yuz berdi' });
    }
  });

  bb.on('error', (err) => {
    console.error('Busboy xatosi:', err);
    res.status(500).json({ error: 'So‘rovda xato' });
  });

  req.pipe(bb);
};
