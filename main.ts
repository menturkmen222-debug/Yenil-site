// main.ts
export default {
  async fetch(request: Request): Promise<Response> {
    // CORS ruxsati — barcha domenlarga ruxsat berish
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Accept",
    };

    // OPTIONS so'rovi — CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Faqat GET so'rovlariga ruxsat
    if (request.method !== "GET") {
      return new Response(JSON.stringify({ error: "Faqat GET so'rovlariga ruxsat berilgan" }), {
        status: 405,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const url = new URL(request.url);
    const bookingId = url.searchParams.get("id");

    // Bron kodi 6 ta katta harf/raqamdan iboratligini tekshirish
    if (!bookingId || typeof bookingId !== "string" || !/^[A-Z0-9]{6}$/.test(bookingId)) {
      return new Response(
        JSON.stringify({ error: "Bron kodi 6 ta katta harf yoki raqamdan iborat bo'lishi kerak (masalan: QUAPWZ)" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    try {
      // railway.gov.tm API manzili
      const apiUrl = `https://railway.gov.tm/railway-api/bookings/${bookingId}`;
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          Accept: "application/json, text/plain, */*",
          "X-Device-Id": "a77b5c929d9403811356e4dcf959973f",
        },
        // Qo'shimcha cheklovlar
        redirect: "follow",
        timeout: 10000, // 10 soniya
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Noma'lum xato");
        console.error(`railway.gov.tm xatosi: ${response.status} — ${errorText}`);
        return new Response(
          JSON.stringify({ error: "railway.gov.tm xatosi", details: errorText }),
          {
            status: response.status,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      // Muaffaqiyatli javob
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          ...corsHeaders,
        },
      });
    } catch (error) {
      console.error("Server xatosi:", error);
      return new Response(
        JSON.stringify({ error: "Serverda xatolik yuz berdi", message: error instanceof Error ? error.message : "Noma'lum xato" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
  },
};
