export default async function handler(req, res) {
  const bookingNumber = req.query.booking || "QUAPWZ"; // default booking
  try {
    const response = await fetch(`https://railway.gov.tm/railway-api/bookings/${bookingNumber}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'X-Device-Id': 'a77b5c929d9403811356e4dcf959973f'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ success: false, message: "API error" });
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
