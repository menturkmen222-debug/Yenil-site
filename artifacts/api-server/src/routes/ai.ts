import { Router } from "express";
import Groq from "groq-sdk";

const router = Router();

const groq = new Groq({ apiKey: process.env["GROQ_API_KEY"] });

const SYSTEM_PROMPT = `Sen Ýeňil super-app-yň AI kömekçisisin. Seniň adyň "Ýeňil AI".
Diňe türkmen dilinde jogap ber (eger ulanyjy rus ýa-da iňlis dilinde ýazsa hem türkmen dilinde jogap ber).
Gysga, anyk we kömekçi bol. Maksimal 3-4 sözlem bilen jogap ber.

Ýeňil app barada maglumat:
- Ýeňil demirýollary: Türkmenistanda otly bilet satyn almak (60-80 TMT)
- Ýeňil Pay: Walýuta çalşygy (Payeer, Perfect Money, WebMoney). Satyn almak: 1 USD = 29 TMT, satmak: 1 USD = 19 TMT
- Bonus Pul (BP): Ilovanyň içki pul birligi. Hyzmatlar üçin ulanylýar
- TMCell: Mobil internet we jaň paketi satyn almak
- Kripto birja: USDT ↔ BP söwdasy
- Informator: Ýol hadysalary barada habar bermek (1-3 BP sylag)
- Referral: Dost çagyryp BP gazanmak
- E-Bilim: Öwrenmek we BP gazanmak
- Kömek: +993 71 789091 ýa-da +993 64 629487

Diňe Ýeňil app bilen bagly soraglara jogap ber. Başga mowzuklara "Bu barada kömek edip bilemok, Ýeňil app baradaky soraglaryňyzy beriň" diý.`;

interface Message {
  role: "user" | "assistant";
  content: string;
}

router.post("/ai/chat", async (req, res) => {
  try {
    const { messages } = req.body as { messages?: Message[] };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages array required" });
    }

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== "user" || !lastMessage.content?.trim()) {
      return res.status(400).json({ error: "last message must be user message" });
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages.slice(-10),
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content ?? "Jogap alyp bolmady.";
    return res.json({ reply });
  } catch (err) {
    console.error("AI chat error:", err);
    return res.status(500).json({ error: "AI jogap berip bilmedi" });
  }
});

export default router;
