// api/proxy-media.js
const https = require('https');
const url = require('url');

module.exports = (req, res) => {
  const mediaUrl = req.query.url;
  if (!mediaUrl || !mediaUrl.startsWith('https://res.cloudinary.com/daq8wfght/')) {
    return res.status(400).end('Noto‘g‘ri URL');
  }

  const parsedUrl = url.parse(mediaUrl);
  const options = {
    hostname: parsedUrl.hostname,
    port: 443,
    path: parsedUrl.path,
    method: 'GET',
    headers: {
      'User-Agent': 'Yenil-Admin/1.0',
    },
  };

  const proxy = https.request(options, (cloudRes) => {
    res.writeHead(cloudRes.statusCode, {
      'Content-Type': cloudRes.headers['content-type'],
      'Cache-Control': 'public, max-age=86400',
    });
    cloudRes.pipe(res);
  });

  proxy.on('error', (err) => {
    console.error('Proxy xatosi:', err.message);
    res.status(500).end('Media yuklanmadi');
  });

  proxy.end();
};
