// api/test.js
export default async function handler(req, res) {
  const TEST_CODE = "QUAPWZ"; // Siz bergan bron kodi
  const url = `https://railway.gov.tm/railway-api/bookings/${TEST_CODE}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'X-Device-Id': 'a77b5c929d9403811356e4dcf959973f'
      }
    });

    const text = await response.text();
    console.log("Status:", response.status);
    console.log("Headers:", [...response.headers.entries()]);
    console.log("Body:", text);

    if (response.status === 200) {
      return res.status(200).json({ success: true, message: "So'rov ishladi!", data: JSON.parse(text) });
    } else {
      return res.status(response.status).json({ success: false, message: `Server javobi: ${response.status}`, body: text });
    }
  } catch (error) {
    console.error("Xatolik:", error.message);
    return res.status(500).json({ success: false, message: "Xatolik yuz berdi", error: error.message });
  }
}
