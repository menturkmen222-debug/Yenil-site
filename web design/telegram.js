// Telegram Notification Handler — Vercel Serverless Function
// Handles: orders, analytics, chat logs
// Environment: TELEGRAM_BOT_TOKEN, TELEGRAM_USER_ID_1, TELEGRAM_USER_ID_2

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const IDS = [process.env.TELEGRAM_USER_ID_1, process.env.TELEGRAM_USER_ID_2].filter(Boolean);

    if (!TOKEN || IDS.length === 0) {
        return res.status(500).json({ error: 'Telegram not configured' });
    }

    const { type, data } = req.body;
    if (!type || !data) return res.status(400).json({ error: 'type and data required' });

    let text = '';

    switch (type) {
        case 'order':
            text = formatOrder(data);
            break;
        case 'analytics':
            text = formatAnalytics(data);
            break;
        case 'chat_log':
            text = formatChatLog(data);
            break;
        default:
            return res.status(400).json({ error: 'Unknown type: ' + type });
    }

    try {
        const results = await Promise.allSettled(
            IDS.map(chatId =>
                fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: text,
                        parse_mode: 'HTML'
                    })
                })
            )
        );

        const allOk = results.every(r => r.status === 'fulfilled');
        return res.status(allOk ? 200 : 207).json({ success: true, sent: IDS.length });
    } catch (err) {
        console.error('Telegram send error:', err);
        return res.status(500).json({ error: 'Failed to send' });
    }
}

function formatOrder(d) {
    return `🛒 <b>ÝEŇIL — Täze Sargyt!</b>

👤 <b>Ady:</b> ${esc(d.name)}
📧 <b>Email/Tel:</b> ${esc(d.email)}
📋 <b>Taslama görnüşi:</b> ${esc(d.projectType)}
💬 <b>Hat:</b> ${esc(d.message)}
🌐 <b>Dil:</b> ${esc(d.lang)}
⏰ <b>Wagt:</b> ${new Date().toLocaleString('en-GB', { timeZone: 'Asia/Ashgabat' })}

📍 <b>Sahypa:</b> ${esc(d.pageUrl || 'N/A')}
📱 <b>Enjam:</b> ${esc(d.userAgent || 'N/A')}`;
}

function formatAnalytics(d) {
    const actions = (d.actions || []).map(a => `  • ${esc(a)}`).join('\n');
    return `📊 <b>ÝEŇIL — Saýt Analitikasy</b>

🆔 <b>Sessiýa:</b> ${esc(d.sessionId || 'N/A')}
⏱ <b>Saýtda bolan wagt:</b> ${esc(d.timeOnSite || '?')}
📜 <b>Scroll çuňlugy:</b> ${esc(d.scrollDepth || '?')}%
🌐 <b>Dil:</b> ${esc(d.lang || '?')}
📱 <b>Enjam:</b> ${esc(d.device || '?')}
🖥 <b>Ekran:</b> ${esc(d.screen || '?')}
📍 <b>Referrer:</b> ${esc(d.referrer || 'Direct')}

🔘 <b>Hereketler (${(d.actions || []).length}):</b>
${actions || '  Ýok'}

💬 <b>AI Chat açyldymy:</b> ${d.chatOpened ? '✅ Hawa' : '❌ Ýok'}
📝 <b>Forma iberildimi:</b> ${d.formSubmitted ? '✅ Hawa' : '❌ Ýok'}
⏰ <b>Wagt:</b> ${new Date().toLocaleString('en-GB', { timeZone: 'Asia/Ashgabat' })}`;
}

function formatChatLog(d) {
    const msgs = (d.messages || []).map(m =>
        m.role === 'user' ? `👤 ${esc(m.text)}` : `🤖 ${esc(m.text)}`
    ).join('\n');
    return `💬 <b>ÝEŇIL — Chat Ýazgy</b>

🌐 <b>Dil:</b> ${esc(d.lang || '?')}
📝 <b>Habarlar (${(d.messages || []).length}):</b>
${msgs}
⏰ ${new Date().toLocaleString('en-GB', { timeZone: 'Asia/Ashgabat' })}`;
}

function esc(s) {
    if (!s) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
