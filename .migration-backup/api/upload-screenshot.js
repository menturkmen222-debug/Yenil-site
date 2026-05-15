// api/upload-screenshot.js
const cloudinary = require('cloudinary').v2;
const busboy = require('busboy');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).end('Faqat POST so‘rov qabul qilinadi');
  }

  const bb = busboy({ headers: req.headers });
  let buffer = [];

  bb.on('file', (name, file) => {
    file.on('data', (data) => buffer.push(data));
  });

  bb.on('close', async () => {
    try {
      const blob = Buffer.concat(buffer);
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'yenil_uploads', resource_type: 'auto' }, // auto = rasm yoki video
          (err, res) => (err ? reject(err) : resolve(res))
        );
        const Pass = require('stream').PassThrough();
        Pass.end(blob);
        Pass.pipe(stream);
      });
      res.status(200).json({ secure_url: result.secure_url });
    } catch (err) {
      console.error('Yuklash xatosi:', err.message);
      res.status(500).json({ error: 'Yuklashda xatolik' });
    }
  });

  req.pipe(bb);
};
