export default async function handler(req, res) {
  const { code } = req.query;
  if (!code || code.length !== 6) {
    return res.status(400).json({ error: "Bron kodi 6 harfli bo'lishi kerak" });
  }

  try {
    const response = await fetch(`https://railway.gov.tm/railway-api/bookings/${code}`, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'X-Device-Id': 'a77b5c929d9403811356e4dcf959973f'
      }
    });

    if (!response.ok) {
      return res.status(404).json({ error: "Bron kodi topilmadi" });
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: "Server xatosi" });
  }
}
