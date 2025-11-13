// api/railway-proxy.js
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Faqat GET so\'rovlariga ruxsat berilgan' });
  }

  const { id } = req.query;

  // Bron kodi 6 ta katta harf/raqamdan iboratligini tekshirish
  if (!id || typeof id !== 'string' || !/^[A-Z0-9]{6}$/.test(id)) {
    return res.status(400).json({ error: 'Bron kodi 6 ta katta harf yoki raqamdan iborat bo\'lishi kerak' });
  }

  try {
    // Sizning Deno Deploy manzilingiz
    const denoUrl = `https://yenil-0y9xkv3q2vpq.menturkmen222-debug.deno.net/?id=${id}`;
    
    const denoResponse = await fetch(denoUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Yenil-Railway-Proxy/1.0',
      },
      timeout: 10000,
    });

    if (!denoResponse.ok) {
      const errorText = await denoResponse.text().catch(() => 'Noma\'lum xato');
      console.error('Deno Deploy xatosi:', denoResponse.status, errorText);
      return res.status(denoResponse.status).json({ error: 'Deno Deploy xatosi', details: errorText });
    }

    const data = await denoResponse.json();

    // CORS ruxsati qo'shish
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Natija qaytarish
    return res.status(200).json(data);
  } catch (error) {
    console.error('Server xatosi:', error);
    return res.status(500).json({ error: 'Serverda xatolik yuz berdi' });
  }
}

// OPTIONS so'rovi uchun CORS qo'llab-quvvatlash
export const config = {
  api: {
    externalResolver: true,
  },
};
