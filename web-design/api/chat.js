// Groq AI Chat Proxy — Vercel Serverless Function
// Environment: GROQ_API_KEY, TELEGRAM_BOT_TOKEN, TELEGRAM_USER_ID_1, TELEGRAM_USER_ID_2

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { message, lang, history } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });

    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) return res.status(500).json({ error: 'GROQ_API_KEY not configured' });

    // Language-specific system instructions
    const langInstructions = {
        tk: 'Türkmen dilinde jogap ber. Sen türkmen biznesleri üçin web çözgütler hödürleýän ÝEŇIL AI Asistanysyň.',
        uz: "O'zbek tilida javob ber. Sen ÝEŇIL AI Asistantisan — veb saytlar, e-tijorat va biznes yechimlari bo'yicha mutaxassis.",
        tr: 'Türkçe cevap ver. Sen ÝEŇIL AI Asistanısın — web siteler, e-ticaret ve iş çözümleri konusunda uzman.',
        en: 'Reply in English. You are ÝEŇIL AI Assistant — expert in web solutions, e-commerce, and business growth.',
        ru: 'Отвечай на русском. Ты — ÝEŇIL AI Ассистент, эксперт по веб-решениям, интернет-магазинам и развитию бизнеса.'
    };

    const systemPrompt = `${langInstructions[lang] || langInstructions['tk']}

Core facts about ÝEŇIL:
- Based in Ashgabat, Turkmenistan. Works worldwide.
- Services: Premium E-Commerce stores, Business Portals (CRM), Landing Pages, Personal Portfolios, AI/Groq chatbot integration.
- Pricing: Landing $250-500 | E-Commerce $800-1500 | Enterprise/AI Custom.
- Technologies: Next.js, React, Tailwind CSS, Groq Llama3 AI.
- Contact: +993 61 23 45 67, info@yenil.tm
- Supports 5 languages: Turkmen, Uzbek, Turkish, English, Russian.

Rules:
- Be concise, professional, and friendly. Max 3-4 sentences per answer.
- Encourage the user to fill out the contact form or call for detailed consultations.
- If asked something outside web/business, politely redirect to ÝEŇIL services.
- Use relevant emoji sparingly for warmth.`;

    // Build messages array
    const messages = [{ role: 'system', content: systemPrompt }];

    // Add recent history (max 6 messages for context)
    if (history && Array.isArray(history)) {
        const recent = history.slice(-6);
        recent.forEach(h => {
            messages.push({ role: h.role === 'bot' ? 'assistant' : 'user', content: h.text });
        });
    }
    messages.push({ role: 'user', content: message });

    try {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
                messages: messages,
                temperature: 0.7,
                max_tokens: 300,
                stream: false
            })
        });

        if (!groqRes.ok) {
            const errData = await groqRes.text();
            console.error('Groq API error:', errData);
            return res.status(502).json({ error: 'AI service error', details: errData });
        }

        const data = await groqRes.json();
        const reply = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';

        // Send chat log to Telegram (async, don't wait)
        sendChatToTelegram(message, reply, lang).catch(err => console.error('TG log err:', err));

        return res.status(200).json({ reply });
    } catch (err) {
        console.error('Groq fetch error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

async function sendChatToTelegram(userMsg, botReply, lang) {
    const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const IDS = [process.env.TELEGRAM_USER_ID_1, process.env.TELEGRAM_USER_ID_2].filter(Boolean);
    if (!TOKEN || IDS.length === 0) return;

    const text = `💬 *ÝEŇIL AI Chat Log*\n\n🌐 Lang: \`${lang}\`\n👤 User: ${userMsg}\n🤖 Bot: ${botReply}\n⏰ ${new Date().toISOString()}`;

    for (const chatId of IDS) {
        await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' })
        }).catch(() => { });
    }
}
