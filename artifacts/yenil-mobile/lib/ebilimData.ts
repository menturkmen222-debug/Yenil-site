export interface QuizQuestion {
  q: string;
  options: string[];
  correct: number;
}

export interface Lesson {
  id: string;
  categoryId: string;
  title: string;
  subtitle: string;
  duration: string;
  content: string;
  youtubeUrl?: string;
  isPremium: boolean;
  premiumBPCost?: number;
  premiumRepRequired?: number;
  reputationReward: number;
  emoji: string;
  quiz: QuizQuestion[];
}

export interface EBilimCategory {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  color: string;
  gradient: readonly [string, string];
}

export const CATEGORIES: EBilimCategory[] = [
  {
    id: "yenil-academy",
    title: "Ýeňil Akademiýa",
    subtitle: "Ilovadan foydalanish qo'llanmalari",
    emoji: "🎓",
    color: "#6366f1",
    gradient: ["#4338ca", "#6366f1"],
  },
  {
    id: "techno",
    title: "Techno-Hacker",
    subtitle: "Smart hardware & DIY maslahatlar",
    emoji: "🔧",
    color: "#f59e0b",
    gradient: ["#92400e", "#d97706"],
  },
  {
    id: "digital",
    title: "Digital Kasblar",
    subtitle: "Treyding, YouTube, TikTok sirlari",
    emoji: "💼",
    color: "#8b5cf6",
    gradient: ["#5b21b6", "#8b5cf6"],
  },
  {
    id: "parent",
    title: "Zukko Ota-ona",
    subtitle: "Bolalar neyrobiologiyasi",
    emoji: "👨‍👩‍👧",
    color: "#ec4899",
    gradient: ["#9d174d", "#ec4899"],
  },
  {
    id: "ai",
    title: "AI Savodxonlik",
    subtitle: "Prompt engineering & AI bilan ishlash",
    emoji: "🤖",
    color: "#06b6d4",
    gradient: ["#0e7490", "#06b6d4"],
  },
  {
    id: "freelance",
    title: "Global Freelance",
    subtitle: "Chet el bozori & masofaviy ish",
    emoji: "🌐",
    color: "#10b981",
    gradient: ["#065f46", "#059669"],
  },
  {
    id: "crypto",
    title: "Kripto Xavfsizlik",
    subtitle: "Anti-scam & moliyaviy himoya",
    emoji: "🔐",
    color: "#ef4444",
    gradient: ["#991b1b", "#ef4444"],
  },
];

export const LESSONS: Lesson[] = [
  // ── Ýeňil Akademiýa ────────────────────────────────────────────────
  {
    id: "yenil-1",
    categoryId: "yenil-academy",
    title: "Ýeňil nedir? Ilk başlama",
    subtitle: "Ilovaning asosiy imkoniyatlari",
    duration: "1 daqiqa",
    emoji: "🚀",
    isPremium: false,
    reputationReward: 1,
    content: `🚀 Ýeňil — Türkmenistanyň aqıllı onlayn hyzmat platformasy.

📱 Ilovada neler bor:
• Demirýol biletin al — bank kartasız
• BP (Bonus Pul) — ichki valyuta
• P2P Kripto birja — USDT ↔ BP
• Ýeňil Pay — valyuta almashtiruv
• Sanly bazar — raqamli mahsulotlar

💡 Başlamaq üçin:
1. Ilovani yukle va ochiq qo'y
2. Avtomatik ID olinadi (hech qanday ro'yxatdan o'tish kerak emas)
3. BP ni olish uchun "Pul Gazan" bo'limiga o't

🎯 Maqsad: Türkmenistanda bank kartasız raqamli to'lovlarni qo'lga kiritish.`,
    quiz: [
      {
        q: "Ýeňil ilovasida qanday valyuta ishlatiladi?",
        options: ["USD", "TMT", "BP (Bonus Pul)", "USDT"],
        correct: 2,
      },
      {
        q: "Ýeňil ilovasini ishlatish uchun nima kerak?",
        options: ["Bank kartasi", "Pasport", "Hech narsa (avtomatik ID)", "Telefon raqam"],
        correct: 2,
      },
    ],
  },
  {
    id: "yenil-2",
    categoryId: "yenil-academy",
    title: "BP bilan pul ishlash: to'liq yo'l xarita",
    subtitle: "Bonus Pul ekotizimini tushunish",
    duration: "1 daqiqa",
    emoji: "💰",
    isPremium: false,
    reputationReward: 1,
    content: `💰 BP (Bonus Pul) — Ýeňil ichki valyutasi. 1 BP ≈ 1 TMT.

📈 BP qanday OLINADI:
• Agent orqali qo'shish: 100 TMT → 115 BP (+15% bonus)
• Referal: har bir do'st → +0.5 BP
• Informator (yo'l xabarlari): 1 xabar → 1 BP
• E-Bilim testlari: 0.05–0.3 BP
• P2P kuryer, Sanly bazar

💳 BP qanday ISHLATILADI:
• Demirýol bileti to'lash
• Sanly bazar xaridlari
• Premium kurslarni ochish
• P2P Kripto birjada savdo

🔁 BP qanday CHIQARILADI:
• TMCell hisobiga: 0.5% komissiya bilan
• Naqt agent orqali: P2P Cashout

⚡ Muhim: Barcha P2P ichki o'tkazmalar 0% komissiya!`,
    quiz: [
      {
        q: "1 BP taxminan qancha TMT ga teng?",
        options: ["0.5 TMT", "1 TMT", "2 TMT", "5 TMT"],
        correct: 1,
      },
      {
        q: "Agent orqali 100 TMT qo'shganda qancha BP olinadi?",
        options: ["100 BP", "110 BP", "115 BP", "120 BP"],
        correct: 2,
      },
      {
        q: "BP'ni TMCell hisobiga chiqarishda qancha komissiya to'lanadi?",
        options: ["0%", "0.5%", "5%", "15%"],
        correct: 1,
      },
    ],
  },
  {
    id: "yenil-3",
    categoryId: "yenil-academy",
    title: "P2P Kripto Birja: USDT ↔ BP",
    subtitle: "Yuqori abraý bilan kripto savdosi",
    duration: "1 daqiqa",
    emoji: "⚡",
    isPremium: false,
    reputationReward: 2,
    content: `⚡ P2P Kripto Birja — Ýeňil eng kuchli funksiyasi.

🔒 Kim foydalana oladi?
• Minimum 45 Abraý bali bo'lishi SHART
• Chunki pul muomalasi katta — ishonch muhim

📊 Savdo turlari:
• sell_usdt → USDT sotish, BP olish
• buy_usdt → BP bilan USDT sotib olish

⚙️ Jarayon:
1. E'lon joylashtir (miqdor + kurs belgilanadi)
2. Xaridor topiladi — BP eskroga kiritiladi
3. Admin tassiqlagach — USDT yuboriladi
4. Savdo tugaydi

🛡️ Xavfsizlik:
• Barcha BP lar esroda saqlanadi
• Savdo bajarilmaguncha pul hech kimga o'tkazilmaydi
• Yomon savdogarning Abraý bali tushadi

💡 Maslahat: Abraý balingizni oshiring → katta savdolar qiling!`,
    quiz: [
      {
        q: "P2P Kripto Birjada savdo qilish uchun minimum qancha Abraý bali kerak?",
        options: ["0", "20", "45", "80"],
        correct: 2,
      },
      {
        q: "Savdo vaqtida BP qayerda saqlanadi?",
        options: ["Xaridorda", "Sotuvchida", "Eskroda (admin nazoratida)", "Bank hisobida"],
        correct: 2,
      },
    ],
  },
  {
    id: "yenil-4",
    categoryId: "yenil-academy",
    title: "Abraý (Reputation) Tizimi",
    subtitle: "Ishonch kapitali qanday quriladi",
    duration: "1 daqiqa",
    emoji: "⭐",
    isPremium: false,
    reputationReward: 1,
    content: `⭐ Abraý — Ýeňil tizimidagi ishonch kapitali.

📌 Abraý qanday OSHADI:
• Muvaffaqiyatli P2P bitimi: +2 bal
• Informator xabari (3 tassiq): +2 bal
• E-Bilim sabog'i: +1 bal
• Sanly bazar sotuvchi: +2 bal
• Referal do'st: +1 bal

❌ Abraý qanday TUSHADI:
• Soxta SMS yuborish: -20 bal
• SMS miqdori mos kelmasligi: -5 bal
• Yomon P2P savdo: -10 bal

⚠️ MUHIM QOIDA:
Abraý ni HECH QACHON pul yoki BP bilan sotib olib bo'lmaydi!
Bu tizimda qat'iy blokirovka mavjud.

🎯 Yuqori Abraý beradi:
• P2P Kripto birjada savdo qilish huquqi (45+)
• Ishonchli sotuvchi belgisi
• Katta miqdorli bitimlar uchun ustuvorlik`,
    quiz: [
      {
        q: "Abraý balini pulga sotib olish mumkinmi?",
        options: ["Ha, BP bilan", "Ha, TMT bilan", "Yo'q, bu mutlaqo mumkin emas", "Faqat premium tarifda"],
        correct: 2,
      },
      {
        q: "Soxta SMS yuborish Abraý baliga qanday ta'sir qiladi?",
        options: ["+5 bal", "-5 bal", "-20 bal", "Hech qanday ta'sir yo'q"],
        correct: 2,
      },
    ],
  },

  // ── Techno-Hacker ───────────────────────────────────────────────────
  {
    id: "techno-1",
    categoryId: "techno",
    title: "Wi-Fi parolini xavfsiz o'zgartirish",
    subtitle: "Router sozlamalari: beginner qo'llanma",
    duration: "1 daqiqa",
    emoji: "📶",
    isPremium: false,
    reputationReward: 1,
    content: `📶 Wi-Fi routeringizni xavfsizlashtirish — oddiy lekin muhim.

🔧 Qadamlar:
1. Brauzerni oching: 192.168.1.1 yoki 192.168.0.1
2. Login: admin / admin (yoki qurilma orqasida)
3. Wireless yoki Wi-Fi bo'limiga o'ting
4. SSID (tarmoq nomi) ni o'zgartiring — uy manzilingizni yozmang!
5. Parolni o'zgartiring: min 12 belgi, raqam+harf+belgi

🔑 Yaxshi parol misoli:
Yenil@2025#Secure ✅
12345678 ❌

⚠️ Qo'shimcha himoya:
• WPA3 yoki WPA2 shifrlashni tanlang (WEP emas!)
• SSID ni yashiring (Hide SSID)
• MAC filter qo'shing

💡 Har 6 oyda parolni almashtiring!`,
    quiz: [
      {
        q: "Router boshqaruv paneliga kirish uchun qaysi manzil ishlatiladi?",
        options: ["google.com", "192.168.1.1", "127.0.0.1", "10.0.0.1"],
        correct: 1,
      },
      {
        q: "Qaysi Wi-Fi shifrlash usuli ENG XAVFSIZ?",
        options: ["WEP", "WPA", "WPA2", "WPA3"],
        correct: 3,
      },
    ],
  },
  {
    id: "techno-2",
    categoryId: "techno",
    title: "Eski kompyuterni tezlashtirish",
    subtitle: "Pulsiz optimizatsiya: 10 ta usul",
    duration: "1 daqiqa",
    emoji: "💻",
    isPremium: false,
    reputationReward: 1,
    content: `💻 Eski kompyuter sekin ishlaydi? Muammo emas!

⚡ TOP-5 BEPUL usul:

1. 🗑️ Disk tozalash
   Windows: Win+R → cleanmgr → OK
   O'chirish: Temp fayllar, Recycle Bin

2. 🚀 Autorun dasturlarni o'chirish
   Ctrl+Shift+Esc → Startup tab
   Keraksizlarni Disable qiling

3. 🔧 SSD o'rnatish
   HDD → SSD almashtirish = 5x tezlik
   120GB SSD ≈ juda arzon, katta ta'sir

4. 🧹 RAM tozalash
   Chrome ko'p xotira yeydi, Firefox ishlatib ko'ring

5. ❄️ Processor termal pasta
   Kompyuter qiziyaptimi? Termal pasta almashtiring
   Harorat 20-30°C tushadi

💡 Bonus: Windows o'rniga Linux Mint o'rnating — bepul, tez, qulay!`,
    quiz: [
      {
        q: "Eski kompyuterni eng ko'p tezlashtiradigan yangilanish nima?",
        options: ["Ko'proq RAM", "SSD o'rnatish", "Yangi protsessor", "Yangi vidyokarta"],
        correct: 1,
      },
      {
        q: "Autorun dasturlarni qayerdan o'chirib qo'yish mumkin?",
        options: ["Control Panel", "Task Manager → Startup", "Settings → Apps", "Regedit"],
        correct: 1,
      },
    ],
  },
  {
    id: "techno-3",
    categoryId: "techno",
    title: "DIY Wi-Fi Antennasi yasash",
    subtitle: "Oddiy materiallardan signal kuchaytiruvchi",
    duration: "1 daqiqa",
    emoji: "📡",
    isPremium: false,
    reputationReward: 2,
    content: `📡 DIY Wi-Fi antennasi yasash — 15 daqiqa, pulsiz!

🛠️ Kerak bo'ladiganlar:
• Alyuminiy lavash qog'ozi (folga)
• Router antennasi
• Qaychi va kleý

📐 Parabola antennasi (eng samarali):
1. Karton yoki plastikdan 30×30 sm qisim kesing
2. Folga bilan o'rang (tekis, burishmasdan)
3. Markaz nuqtani aniqlang — parabolik egilish bering
4. Routerning antennasi orqali o'tkazing

📊 Natija:
• Diapazon: +20–40% oshadi
• Signal kuchi: −75 dBm → −65 dBm
• Masofa: 10m → 15m

⚠️ Muhim: Antennani signal zarur bo'lgan tomonga yo'naltiring!

🔬 Ilmiy sababi: Parabola ko'zgusi signallarni bir nuqtaga jamlab kuchaytirad.`,
    quiz: [
      {
        q: "DIY antenna uchun qaysi material eng mos?",
        options: ["Plastik", "Yog'och", "Alyuminiy folga", "Qog'oz"],
        correct: 2,
      },
      {
        q: "DIY parabola antenna signalni taxminan qancha kuchaytiradi?",
        options: ["5–10%", "20–40%", "100%", "2x"],
        correct: 1,
      },
    ],
  },
  {
    id: "techno-4",
    categoryId: "techno",
    title: "Telefonni hacker dan himoya",
    subtitle: "Mobil xavfsizlikning 7 qoidasi",
    duration: "1 daqiqa",
    emoji: "🛡️",
    isPremium: true,
    premiumBPCost: 2,
    reputationReward: 2,
    content: `🛡️ Telefoningizni 7 oddiy qadam bilan xavfsizlashtiring.

🔒 1. Ekran qulfi
✅ Biometrik + PIN kod (6 raqam)
❌ Sana yoki 1234 ishlatmang

📲 2. Ilovalar manbai
✅ Faqat Play Store / App Store
❌ APK fayllarini yuklamang

🔐 3. Ikki faktorli autentifikatsiya
✅ Google Authenticator ishlatish
Telegram, Instagram, email uchun yoqing

📡 4. VPN ishlatish
Ommaviy Wi-Fi da VPN yoqib qo'ying
Bepul: Proton VPN ✅

🔍 5. Ilovalar ruxsatlarini tekshiring
Settings → Apps → Permissions
Kamera/Mikrofon kerak bo'lmasa — o'ching!

💾 6. Zaxira nusxa (Backup)
Haftada 1 marta bulutga backup

🔄 7. Tizim yangilanishlarini o'rnating
Security patch = himoya devori`,
    quiz: [
      {
        q: "Ikki faktorli autentifikatsiya uchun qaysi ilova tavsiya etiladi?",
        options: ["WhatsApp", "Google Authenticator", "Telegram", "Instagram"],
        correct: 1,
      },
      {
        q: "Ommaviy Wi-Fi da xavfsizlik uchun nima ishlatish kerak?",
        options: ["VPN", "Hotspot", "Bluetooth", "Hech narsa kerak emas"],
        correct: 0,
      },
    ],
  },

  // ── Digital Kasblar ─────────────────────────────────────────────────
  {
    id: "digital-1",
    categoryId: "digital",
    title: "YouTube'da evergreen kontent",
    subtitle: "Yillar davomida ko'riluvchi videolar sirri",
    duration: "1 daqiqa",
    emoji: "▶️",
    isPremium: false,
    reputationReward: 2,
    content: `▶️ Evergreen kontent = yillar davomida ko'riluvchi video.

🎯 Trend kontent vs Evergreen:
❌ Trend: "2025-yil iyun yangiliklari" (1 hafta keyin o'ladi)
✅ Evergreen: "Wi-Fi parolini qanday o'zgartirish" (har doim kerak)

📋 Evergreen g'oyalar (Türkmeniston uchun):
• "TMCell da internet sozlash"
• "Arzon telefon qanday tanlash"
• "Uy taomlar retsepti" (bazaviy)
• "Ingliz tili: 100 ta muhim so'z"
• "Pul tejash usullari"

🔍 SEO sirlari:
1. Sarlavhada kalit so'z birinchi bo'lishi
2. Tavsifda 200+ so'z
3. Teglar: tor mavzu + keng mavzu
4. Thumbnail: yirik matn + qiziqarli yuz

📈 Katta kanal emas, TO'G'RI kanal:
• 100 ta sifatli video > 1000 ta zaif video
• Algoritm doimiy ko'rilishni sevadi`,
    quiz: [
      {
        q: "Qaysi video 'evergreen' hisoblanadi?",
        options: ["Bugungi yangiliklar", "Wi-Fi sozlash qo'llanma", "Oyning eng mashhur musiqasi", "Yangi telefon sharhi"],
        correct: 1,
      },
      {
        q: "YouTube SEO uchun sarlavhada nima birinchi bo'lishi kerak?",
        options: ["Kanal nomi", "Kalit so'z", "Sana", "Hissiyot so'z"],
        correct: 1,
      },
    ],
  },
  {
    id: "digital-2",
    categoryId: "digital",
    title: "Treyding asoslari: Risk boshqaruvi",
    subtitle: "Yangi boshlovchilar uchun muhim qoidalar",
    duration: "1 daqiqa",
    emoji: "📊",
    isPremium: false,
    reputationReward: 2,
    content: `📊 Treyding — pul ishlash emas, avvalo risk boshqaruvi.

⚠️ ASOSIY QOIDA:
Hech qachon yo'qotishga tayyor bo'lmagan pulni investitsiya qilmang!

📐 1% qoidasi:
Bir savdoda kapitalingizning 1% dan ko'p risk qilmang.
Misol: 100 USDT kapital → 1 savdoda max 1 USDT risk

📉 Stop-Loss — eng muhim instrument:
✅ Har savdoda SL o'rnating
❌ "Qaytib keladi" deb o'tirmaslik

📈 Terminlar:
• Spot — haqiqiy kriptoni sotib olish
• Futures — kelajak narxiga qo'yish (XAVFLI)
• Long — narx oshishiga qo'yish
• Short — narx tushishiga qo'yish

🎯 Yangi boshlovchi strategiya:
1. Faqat top-5 kriptolarni o'rganing
2. Futures dan uzoq turing (leverage)
3. DCA strategiyasi: har oyda belgilangan miqdor`,
    quiz: [
      {
        q: "1% qoidasiga ko'ra 200 USDT kapital bilan bir savdoda necha USDT risk qilish mumkin?",
        options: ["1 USDT", "2 USDT", "10 USDT", "20 USDT"],
        correct: 1,
      },
      {
        q: "Stop-Loss nima uchun ishlatiladi?",
        options: ["Ko'proq foyda olish", "Yo'qotishlarni cheklash", "Savdoni tezlashtirish", "Soliq to'lash"],
        correct: 1,
      },
    ],
  },
  {
    id: "digital-3",
    categoryId: "digital",
    title: "TikTok algoritmi sirlari",
    subtitle: "0 dan 10K followergacha tezkor yo'l",
    duration: "1 daqiqa",
    emoji: "🎵",
    isPremium: false,
    reputationReward: 1,
    content: `🎵 TikTok algoritmi siri: FYP (For You Page) ga kirish.

🧠 TikTok nimani ko'radi:
1. Watch time (qaralish vaqti) — ENG MUHIM
2. Repeat views (qayta ko'rish)
3. Comments (izohlar)
4. Shares (ulashishlar)
5. Likes oxirgi o'rinda

📱 FYP ga kirish formulasi:
• Birinchi 3 soniyada e'tiborni torting!
• Video 15–30 soniya — optimal
• Oxir tomoshabin savolga javob kutishi kerak

🎨 Vizual sirlar:
• Yirik, o'qilishi oson matn overlay
• Subtitles (yozuvlar) — ko'pchilik ovoz o'chirib ko'radi
• Rang kontrasti: qora fon + sariq matn

🎤 Niche tanlash (Türkmeniston uchun):
• Mahalliy taomlar ✅
• Texnologiya maslahatlari turkman tilida ✅
• Kundalik hayot ko'rinishlari ✅`,
    quiz: [
      {
        q: "TikTok algoritmida eng muhim ko'rsatkich nima?",
        options: ["Likes", "Followers", "Watch time", "Comments"],
        correct: 2,
      },
      {
        q: "TikTok uchun optimal video uzunligi qancha?",
        options: ["1–5 soniya", "15–30 soniya", "5 daqiqa", "10 daqiqa"],
        correct: 1,
      },
    ],
  },
  {
    id: "digital-4",
    categoryId: "digital",
    title: "SMM kasbini boshlash: 0 tajriba bilan",
    subtitle: "Ijtimoiy tarmoqlar menejeri bo'lish yo'li",
    duration: "1 daqiqa",
    emoji: "📱",
    isPremium: true,
    premiumBPCost: 3,
    reputationReward: 3,
    content: `📱 SMM (Social Media Manager) — uydan ishlash mumkin.

💼 Klient qayerda topiladi:
• Mahalliy bizneslar (kafé, do'kon, klinika)
• Telegram kanallari
• Fiverr va Upwork (xalqaro)

📋 Asosiy xizmatlar:
• Post va story yaratish: 30–50 USDT/oy
• Kontent kalendariga rejalash: +10 USDT
• Reklama konfiguratsiyasi: +20–50 USDT

🎨 Zarur ko'nikmalar:
• Canva — dizayn (bepul, oson)
• CapCut — video montaj (bepul)
• ChatGPT — matn yozish (bepul)

📈 Daromad yo'li:
Oy 1: 1 klient → 30 USDT
Oy 3: 3 klient → 90–150 USDT
Oy 6: 5–7 klient → 200–350 USDT

🚀 Portfolio yaratish:
Birinchi klientga bepul yoki arzon ishlang
Screenshotlarni saqlang → portfolio yarating`,
    quiz: [
      {
        q: "SMM portfolio uchun qaysi dastur BEPUL va oson dizayn uchun ishlatiladi?",
        options: ["Photoshop", "Canva", "Illustrator", "CorelDraw"],
        correct: 1,
      },
      {
        q: "SMM mutaxassisi odatda qaysi xizmatni taqdim etadi?",
        options: ["Veb-sayt yaratish", "Ijtimoiy tarmoq kontent boshqaruvi", "Video o'yinlar", "Mobil ilova yaratish"],
        correct: 1,
      },
    ],
  },

  // ── Zukko Ota-ona ───────────────────────────────────────────────────
  {
    id: "parent-1",
    categoryId: "parent",
    title: "Bolalar miyasi qanday o'rganadi?",
    subtitle: "Neyrobiologiya — ota-onalar uchun",
    duration: "1 daqiqa",
    emoji: "🧠",
    isPremium: false,
    reputationReward: 1,
    content: `🧠 Bolalar miyasi katta odamlar miyasidan farq qiladi.

📚 3 ta asosiy fakt:

1. Prefrontal korteks (qaror qabul qilish markazi)
25 yoshgacha to'liq rivojlanmaydi!
Shuning uchun bolalar impulsiv harakat qiladi — bu normal.

2. Miya plastikligi
0–7 yosh — eng tez o'rganish davri
Bu davrda til, musiqa, sport o'rgatish eng samarali

3. Uyqu va o'rganish
Uyqu vaqtida miya ma'lumotlarni qayta ishlaydi
Maktabgacha bolalar: 10–13 soat uyqu kerak

💡 Amaliy maslahatlar:
• "Nima uchun?" savollariga sabr bilan javob bering
• O'yin orqali o'rgatish — eng yaxshi metod
• Salbiy tajriba ham (munosib miqdorda) o'stiradi
• Ekran vaqtini 3 yoshgacha minimal saqlang`,
    quiz: [
      {
        q: "Prefrontal korteks qachon to'liq rivojlanadi?",
        options: ["7 yoshga qadar", "12 yoshga qadar", "18 yoshga qadar", "25 yoshga qadar"],
        correct: 3,
      },
      {
        q: "Bolaning eng tez o'rganish davri qaysi?",
        options: ["0–7 yosh", "7–14 yosh", "14–18 yosh", "18–25 yosh"],
        correct: 0,
      },
    ],
  },
  {
    id: "parent-2",
    categoryId: "parent",
    title: "Raqamli gigiyena: ekran vaqti qoidalari",
    subtitle: "Bolalarda sog'lom texnologiya munosabati",
    duration: "1 daqiqa",
    emoji: "📵",
    isPremium: false,
    reputationReward: 1,
    content: `📵 Raqamli gigiyena — texnologiya bilan sog'lom munosabat.

⏱️ Ekran vaqti tavsiyalari (JSSST):
• 0–2 yosh: minimal yoki yo'q
• 2–5 yosh: kun 1 soat (katta kishi bilan)
• 6–12 yosh: 1–2 soat/kun (mazmunli kontent)
• 13+: o'rnatilgan qoidalar kerak

📺 Yomon kontent belgilari:
• Ovoz va yorug'lik birdaniga o'zgaradigan videolar
• Passiv tomosha (hech narsa o'rgatmaydigan)
• To'xtatish qiyin bo'lgan infinite scroll

✅ Yaxshi kontent belgilari:
• Bolani savol berishga undaydi
• Harakatga da'vat etadi (qo'l bilan qilish)
• Kutilmagan narsalar yo'q

🎮 O'yinlarda:
• Yosh chegarasini tekshiring (PEGI reyting)
• Online multiplayer — ehtiyotkorlik bilan
• Vaqt limiti qo'ying`,
    quiz: [
      {
        q: "2–5 yoshli bola uchun kunlik ekran vaqti qancha tavsiya etiladi?",
        options: ["30 daqiqa", "1 soat", "2 soat", "Cheksiz"],
        correct: 1,
      },
      {
        q: "Qaysi ko'rsatkich yaxshi raqamli kontent ekanini bildiradi?",
        options: ["Bolani soatlab band qiladi", "Bolani savol berishga undaydi", "Ovoz juda baland", "Ko'p reklamalar"],
        correct: 1,
      },
    ],
  },
  {
    id: "parent-3",
    categoryId: "parent",
    title: "Bolaga to'g'ri o'yin tanlash",
    subtitle: "PEGI reytingi va rivojlantiruvchi o'yinlar",
    duration: "1 daqiqa",
    emoji: "🎮",
    isPremium: false,
    reputationReward: 1,
    content: `🎮 Barcha o'yinlar bir xil emas — to'g'ri tanlash muhim.

📋 PEGI Reytingi tizimi:
• PEGI 3 — Barcha yoshlar uchun
• PEGI 7 — Hafif qo'rqinchli yoki zo'ravonlik
• PEGI 12 — O'smirlar uchun
• PEGI 16 — 16+
• PEGI 18 — Faqat kattalar

✅ Rivojlantiruvchi o'yinlar (6–12 yosh):
• Minecraft — ijodkorlik, muhandislik
• Chess.com — mantiqiy fikrlash
• Scratch — dasturlashga kirish
• Duolingo — til o'rganish

❌ Ehtiyot bo'ling:
• Loot box mexanikasi (tasodifiy sovg'alar) → qimor odatlari
• "Pay to win" — pul sarflashga undash
• Chat funksiyasi — notanish odamlar

💡 "Birga o'ynash" qoidasi:
Yangi o'yin bola bilan birga 1 soat o'ynab ko'ring
Keyin qaror qabul qiling`,
    quiz: [
      {
        q: "PEGI 12 reytingi qaysi yoshdagi bolalar uchun?",
        options: ["6+ yosh", "12+ yosh", "Barcha yoshlar", "18+ yosh"],
        correct: 1,
      },
      {
        q: "Qaysi o'yin bolada ijodkorlik va muhandislikni rivojlantiradi?",
        options: ["PUBG", "Minecraft", "Fortnite", "GTA"],
        correct: 1,
      },
    ],
  },

  // ── AI Savodxonlik ──────────────────────────────────────────────────
  {
    id: "ai-1",
    categoryId: "ai",
    title: "Prompt Engineering asoslari",
    subtitle: "AI ga to'g'ri topshiriq berish sanati",
    duration: "1 daqiqa",
    emoji: "💬",
    isPremium: false,
    reputationReward: 2,
    content: `💬 Prompt Engineering — AI dan yaxshi javob olish san'ati.

🎯 YAXSHI PROMPT = KONTEKST + VAZIFA + FORMAT

❌ Yomon prompt:
"Menga matn yoz"

✅ Yaxshi prompt:
"Sen professional marketing mutaxassisisan. Kichik do'kon uchun Instagram postiga 150 so'zli reklama matni yoz. Tone: do'stona, qisqa jumlalar, 3 ta emoji ishlat. Mahsulot: arzon narxdagi meva."

🧩 Prompt qismlari:
• VAZIFA: "...yoz", "...tarjima qil", "...tushuntir"
• ROL: "Sen...san" → AI tushunadi kim kabi fikrlash kerak
• FORMAT: "ro'yxat", "jadval", "qisqa", "batafsil"
• MISOLLAR: few-shot prompting

🔄 Natija yaxshi bo'lmasa:
"Yanada soddaroq qilib yoz"
"Qisqaroq bo'lsin"
"Misol bilan tushuntir"`,
    quiz: [
      {
        q: "Yaxshi prompt qanday elementlardan iborat?",
        options: ["Faqat savol", "Kontekst + Vazifa + Format", "Uzun matn", "Qisqa so'z"],
        correct: 1,
      },
      {
        q: "Promptda 'rol' berish nimaga yordam beradi?",
        options: ["AI tezroq ishlaydi", "AI tegishli uslubda javob beradi", "Hech qanday farq yo'q", "Xatolar kamayadi"],
        correct: 1,
      },
    ],
  },
  {
    id: "ai-2",
    categoryId: "ai",
    title: "AI bilan pul ishlash: 5 ta real yo'l",
    subtitle: "Neyrotarmoqlardan daromad chiqarish",
    duration: "1 daqiqa",
    emoji: "🤖",
    isPremium: false,
    reputationReward: 2,
    content: `🤖 AI yordamida 2025-yilda pul ishlashning 5 yo'li.

1. 🎨 AI dizayn (Midjourney, DALL-E)
Logotip, banner, poster yaratish
Fiverr'da: 5–50 USDT/buyurtma
Bepul boshlash: Bing Image Creator

2. ✍️ AI kontent yozish
ChatGPT + Sizning tahriringiz
Blog postlar, mahsulot tavsiflari
Narx: 3–10 USDT/1000 so'z

3. 📹 AI video (Synthesia, HeyGen)
Avatar videolar, reklama kliplari
Korporativ xizmatlar uchun yuqori narx

4. 🔊 AI ovoz (ElevenLabs)
Podkast uchun ovoz, reklama
Turkman/O'zbek tilida kanal

5. 🌐 AI tarjima + lokal
DeepL + tahrirlash
Texnik hujjatlar → katta bozor

💡 Eng oddiy yo'l:
ChatGPT bilan SMM matnlar yozing → mahalliy bizneslarga soting`,
    quiz: [
      {
        q: "AI rasm generatsiyasi uchun qaysi bepul vosita ishlatish mumkin?",
        options: ["Photoshop", "Bing Image Creator", "Canva Pro", "Adobe Firefly"],
        correct: 1,
      },
      {
        q: "AI yordamida eng oson boshlash mumkin bo'lgan xizmat qaysi?",
        options: ["AI video yaratish", "SMM kontent yozish", "Ovoz sintezi", "Kod yozish"],
        correct: 1,
      },
    ],
  },
  {
    id: "ai-3",
    categoryId: "ai",
    title: "AI Agent nedir? 2028 kelajagi",
    subtitle: "Emeliňň Aň — ertangi dunyo",
    duration: "1 daqiqa",
    emoji: "🌐",
    isPremium: false,
    reputationReward: 2,
    content: `🌐 AI Agent — oddiy chatbot emas, mustaqil ishlashga qodir tizim.

🔄 ChatGPT vs AI Agent farqi:
ChatGPT: Savol → Javob (1 qadam)
AI Agent: Maqsad → Reja → Vazifalar → Bajarilish (ko'p qadam)

🤖 Misol: Sayohat agenti AI:
"Sentyabrda Stambulga uch kunlik sayohat reja tuz"
→ Avia chipta narxlarini tekshiradi
→ Mehmonxonalarni solishtirir
→ Ekskursiyalarni tanlaydi
→ Umumiy xarajatni hisoblaydi
→ Barchasi avtomatik!

📈 2028 bashorat:
Google qidiruvidan ko'ra AI agentlar bilan ishlash muhimroq bo'ladi.
Hozir bunday biladigan odam = kelajakka tayyorlanmoqda.

🎓 O'rganish yo'li:
1. ChatGPT → Claude → Gemini
2. Cursor yoki Copilot (kod yordamchisi)
3. AutoGPT, CrewAI (agent framework)`,
    quiz: [
      {
        q: "ChatGPT va AI Agent orasidagi asosiy farq nima?",
        options: [
          "AI agent bepul, ChatGPT pullik",
          "AI agent mustaqil ko'p qadam bajaradi",
          "ChatGPT rasm yarata oladi",
          "Hech qanday farq yo'q",
        ],
        correct: 1,
      },
      {
        q: "2028-yilda eng muhim bo'lgan ko'nikma qaysi?",
        options: ["Google qidiruvi", "AI agentlar bilan ishlash", "Excel", "Word"],
        correct: 1,
      },
    ],
  },

  // ── Global Freelance ────────────────────────────────────────────────
  {
    id: "freelance-1",
    categoryId: "freelance",
    title: "Fiverr'da hisob ochish: to'liq qo'llanma",
    subtitle: "Birinchi buyurtmani olishgacha",
    duration: "1 daqiqa",
    emoji: "💼",
    isPremium: false,
    reputationReward: 2,
    content: `💼 Fiverr — xalqaro freelance bozori. Hozir boshlang!

📝 Hisob yaratish (bepul):
1. fiverr.com → Join → Gmail bilan
2. Professional rasm (yuz ko'rinib tursin!)
3. Skills: 5 ta ko'nikma tanlang
4. Bio: 150–200 so'z, ingliz tilida

🎯 Birinchi GIG (xizmat) qoidalari:
• Sarlavha: "I will [aniq xizmat] for [kim uchun]"
  Misol: "I will write engaging Instagram captions for your business"
• Narx: $5–15 (birinchi oyda arzon = tez buyurtma)
• 3 ta paket: Basic / Standard / Premium
• 5–7 ta GIG rasm (Canva bilan)

🔑 Tez buyurtma olish sirlari:
• Har kuni 10–15 buyer request ga javob yuboring
• Javobda: ularning muammosi → siz qanday yeching
• Response time = muhim signal

💳 To'lov olish:
Payoneer karta (Fiverr'dan bepul) → bank o'tkazmasi`,
    quiz: [
      {
        q: "Fiverr'da 'GIG' nima?",
        options: ["Musiqa ijrosi", "Taklif etilayotgan xizmat", "Mijoz so'rovi", "To'lov tizimi"],
        correct: 1,
      },
      {
        q: "Yangi freelancer Fiverr'da birinchi oyda qanday narx qo'yishi kerak?",
        options: ["Yuqori narx (sifat ko'rsatish uchun)", "Past narx ($5–15) tez buyurtma uchun", "Bepul (portfolio uchun)", "Bozor o'rtacha narxi"],
        correct: 1,
      },
    ],
  },
  {
    id: "freelance-2",
    categoryId: "freelance",
    title: "Portfolio yaratish: IT va Dizayn",
    subtitle: "0 dan tajribali ko'rinadigan portfolio",
    duration: "1 daqiqa",
    emoji: "🗂️",
    isPremium: false,
    reputationReward: 2,
    content: `🗂️ Portfolio — sizning onlayn vizit kartangiz.

🎯 Portfolio nima bo'lishi kerak:
• Sizning ENG YAXSHI ishlaringiz (hammasi emas)
• Muammo → Yechim → Natija formati
• Mijoz uchun oson tushunish

🛠️ Bepul portfolio platformalari:
IT/Kod: GitHub, GitLab
Dizayn: Behance, Dribbble
Umumiy: Notion, Canva portfolio

📋 Ishlaringiz yo'q bo'lsa:
1. Mavjud kompaniya saytlarini qayta dizayn qiling
   ("Konseptual qayta dizayn: Tesla.com uchun")
2. Open-source loyihalarga kiring
3. Do'stlar biznesi uchun bepul ishlang

✍️ Har bir ish uchun qisqa case study:
• Muammo: "Mijoz Instagram'da kam ko'ruv olardi"
• Yechim: "Kontent strategiya va posting jadval"
• Natija: "3 oyda 2x engagement"

💡 Linktree orqali hamma linklarni birlashtiring!`,
    quiz: [
      {
        q: "Dizayner uchun portfolio joylashtirishga qaysi platforma eng mos?",
        options: ["GitHub", "Behance", "LinkedIn", "Twitter"],
        correct: 1,
      },
      {
        q: "Portfolio uchun ishlaringiz yo'q bo'lsa nima qilish mumkin?",
        options: ["Portfolio yaratishni kechiktirish", "Mavjud saytlarning konseptual qayta dizaynini qilish", "Boshqa kasb tanlash", "Faqat o'qish"],
        correct: 1,
      },
    ],
  },
  {
    id: "freelance-3",
    categoryId: "freelance",
    title: "USDT bilan xalqaro to'lov olish",
    subtitle: "Türkmenistandan Fiverr/Upwork daromadi",
    duration: "1 daqiqa",
    emoji: "💸",
    isPremium: true,
    premiumBPCost: 3,
    reputationReward: 3,
    content: `💸 Türkmenistandan xalqaro to'lov olishning haqiqiy usuli.

🌍 Muammo:
Türkmenistanlik freelancerlar PayPal, Stripe dan foydalana olmaydi.

✅ YECHIM — USDT (TRC-20):
1. TronLink yoki Trust Wallet yaratish (bepul)
2. Mijozga USDT manzilini bering
3. To'lov 1–3 daqiqa ichida keladi
4. Ýeňil P2P orqali → TMT yoki BP ga almashtirish

📋 Qo'shimcha usullar:
• Payoneer karta (Fiverr, Upwork rasmiy partner)
  → Bank o'tkazmasi orqali olish
• Wise transferlar (ba'zi mamlakatlarga)

🔐 Xavfsiz USDT qabul qilish:
• Har safar yangi manzil yarating (ehtiyotkorlik)
• Katta miqdorlar uchun hardware wallet
• TRC-20 va ERC-20 farqini bilib oling (to'lov tarmoqi muhim!)

💡 Amaliy maslahat:
100 USDT = ~100 USD ≈ 350 TMT
Ýeňil P2P birjada to'g'ridan-to'g'ri almashtirish`,
    quiz: [
      {
        q: "USDT qabul qilish uchun qaysi hamyon ishlatish mumkin?",
        options: ["PayPal", "Stripe", "Trust Wallet", "Western Union"],
        correct: 2,
      },
      {
        q: "Fiverr uchun rasmiy to'lov tizimi qaysi?",
        options: ["USDT", "Bitcoin", "Payoneer", "Wise"],
        correct: 2,
      },
    ],
  },

  // ── Kripto Xavfsizlik ───────────────────────────────────────────────
  {
    id: "crypto-1",
    categoryId: "crypto",
    title: "Scam'dan himoya: 7 asosiy qoida",
    subtitle: "Telegram va P2P savdoda aldanmaslik",
    duration: "1 daqiqa",
    emoji: "🚨",
    isPremium: false,
    reputationReward: 2,
    content: `🚨 Scam (firibgarlik) belgilari — bilsangiz qutulasiz!

🔴 7 ta xavf belgisi:

1. "Yuqori daromad, hech qanday risk yo'q"
→ REAL INVESTITSIYA da risk bor. Har doim.

2. "Tezda qaror qabul qiling, taklif tugaydi"
→ Bosim qilish = manipulyatsiya

3. "Avval pul o'tkaz, keyin mahsulot"
→ P2P da ESCROW ishlatmaslik

4. "Men sizni taniman" (Telegram'da notanish)
→ Ijtimoiy muhandislik hujumi

5. "Hamyon seeding kerak" (seed phrase so'rash)
→ Hech qachon! Hech kimga!

6. Rasmiy ko'rinishli bot/kanal
→ @binance va @Binance — farqli!

7. "Mening muvaffaqiyatimni ko'ring"
→ Soxta screenshot + Pump and dump

🛡️ Himoya:
• Shoshilmang
• Ikkinchi fikr so'rang
• Google'da tekshiring + "scam" qo'shing`,
    quiz: [
      {
        q: "Qaysi ibora scam belgisi hisoblanadi?",
        options: [
          "Investitsiya riski bor",
          "Tezda qaror qabul qiling, taklif tugaydi",
          "Escrow orqali to'laymiz",
          "Hujjatlarimni tekshiring",
        ],
        correct: 1,
      },
      {
        q: "Seed phrase (kalit so'z) ni kimga berish mumkin?",
        options: ["Birja texnik yordamiga", "Do'stingizga", "Hech kimga bermaslik kerak", "Bankiringizga"],
        correct: 2,
      },
    ],
  },
  {
    id: "crypto-2",
    categoryId: "crypto",
    title: "Seed Phrase xavfsizligi",
    subtitle: "Kripto hamyonni yo'qotmaslik texnikasi",
    duration: "1 daqiqa",
    emoji: "🔑",
    isPremium: false,
    reputationReward: 2,
    content: `🔑 Seed Phrase (kalit ibora) — kripto hamyoningiz kaliti.

📌 Seed phrase nima?
12–24 ta ingliz so'zidan iborat ibora.
Bu ibora = sizning pullaringiz.

⚠️ ASOSIY QOIDA:
Seed phrase ni HECH KIMGA bermaslik!
Hatto "birja xodimlari", "texnik yordam" ham so'rab kelsa → bu SCAM.

💾 To'g'ri saqlash usullari:

✅ YAXSHI:
• Qog'ozga yozing (2–3 nusxa)
• Har xil joyda saqlang (uy, ota-ona uyi)
• Metalga yoki laminat qilib saqlash

❌ YOMON:
• Telefon galereya (iCloud/Google sync)
• Telegram, WhatsApp ga yuborish
• Email ga saqlash
• Ekran suratga olish

🔄 Hamyon yo'qolsa:
Seed phrase bilan yangi qurilmada tiklash mumkin.
Seed phrase yo'qolsa → PULSIZ.

💡 Hardware wallet (Ledger, Trezor) — eng xavfsiz usul.`,
    quiz: [
      {
        q: "Seed phrase ni qaerda saqlash ENG XAVFLI?",
        options: ["Qog'ozda", "Telefon galereya/cloud", "Metalda", "Seyf"],
        correct: 1,
      },
      {
        q: "Kimga Seed phrase berish mumkin?",
        options: ["Birja texnik yordamiga", "Ishonchli do'stingizga", "Hech kimga", "Bankiringizga"],
        correct: 2,
      },
    ],
  },
  {
    id: "crypto-3",
    categoryId: "crypto",
    title: "P2P savdoda xavfsiz qolish",
    subtitle: "USDT savdosida scam'dan himoya",
    duration: "1 daqiqa",
    emoji: "🤝",
    isPremium: true,
    premiumBPCost: 2,
    reputationReward: 3,
    content: `🤝 P2P savdo xavfsizligi — pul yo'qotmaslik uchun.

🔒 Escrow tizimi nima?
Escrow = uchinchi tomon (Ýeňil tizimi)
Savdo vaqtida pul escrow'da saqlanadi.
Ikki tomon ham tasdiqlagunicha hech kimga o'tkazilmaydi.

📋 Xavfsiz P2P savdo qadamlari:
1. ✅ Faqat tasdiqlangan sotuvchilar bilan ishlang
2. ✅ Abraý bali 45+ ekanini tekshiring
3. ✅ Escrow'ni talab qiling
4. ✅ To'lov tasdiqlangandan SO'NG kriptoni qo'yib bering
5. ✅ Barcha suhbatni screenshottlang

🚨 XAVF belgilari:
• "Escrow kerak emas, ishoning" → YO'Q
• "Admin roliga o'taman" → Scammer
• "Tez o'tkazing, boshqa xaridor bor" → Bosim

💡 Savdo bajarilmasa nima qilish kerak?
Ýeňil admin bilan bog'laning.
Escrow orqali pul qaytariladi.`,
    quiz: [
      {
        q: "Escrow tizimi nima uchun ishlatiladi?",
        options: [
          "Savdoni tezlashtirish",
          "Ikki tomon ishonchini ta'minlash",
          "Komissiya tejash",
          "Anonimlikni saqlash",
        ],
        correct: 1,
      },
      {
        q: "P2P savdoda qancha Abraý bali bo'lgan sotuvchilar bilan ishlash tavsiya etiladi?",
        options: ["Har qanday", "10+", "45+", "80+"],
        correct: 2,
      },
    ],
  },
];
