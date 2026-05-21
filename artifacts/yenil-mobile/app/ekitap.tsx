import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  TextInput, Alert, Platform, Modal, Animated,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColors } from "@/hooks/useColors";

// ─── Types ────────────────────────────────────────────────────────────────────
type Category = "all" | "railway" | "finance" | "tech" | "language" | "math" | "health";
type MainTab = "home" | "courses" | "articles" | "quizzes";

interface Lesson {
  id: number;
  title: string;
  duration: string;
  content: string;
}
interface Course {
  id: number;
  category: Category;
  title: string;
  instructor: string;
  duration: string;
  lessons: Lesson[];
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  free: boolean;
  tags: string[];
  rating: number;
  students: number;
  desc: string;
}
interface Article {
  id: number;
  category: Category;
  title: string;
  author: string;
  readTime: number;
  content: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  free: boolean;
  tags: string[];
}
interface QuizQuestion {
  q: string;
  opts: string[];
  correct: number;
}
interface Quiz {
  id: number;
  category: Category;
  title: string;
  desc: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  questions: QuizQuestion[];
  free: boolean;
}
interface Progress {
  lessonsDone: Record<string, boolean>;
  quizBest: Record<number, number>;
  bookmarks: { courses: number[]; articles: number[]; quizzes: number[] };
  readArticles: number[];
  streak: number;
  lastDate: string;
  totalMinutes: number;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const CATEGORIES: { id: Category; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { id: "all",      label: "Ählisi",      icon: "apps-outline",     color: "#6366f1" },
  { id: "railway",  label: "Demirýol",    icon: "train-outline",    color: "#10b981" },
  { id: "finance",  label: "Maliýe",      icon: "cash-outline",     color: "#f59e0b" },
  { id: "tech",     label: "Tehnol.",     icon: "laptop-outline",   color: "#0ea5e9" },
  { id: "language", label: "Dil",         icon: "language-outline", color: "#8b5cf6" },
  { id: "math",     label: "Matematika",  icon: "calculator-outline", color: "#ef4444" },
  { id: "health",   label: "Saglyk",      icon: "heart-outline",    color: "#ec4899" },
];

const COURSES: Course[] = [
  {
    id: 1, category: "railway", free: true,
    title: "Demirýol bilet almak — doly kurs",
    instructor: "Ýeňil Akademiýa", duration: "45 min",
    icon: "train-outline", color: "#10b981",
    rating: 4.9, students: 1240,
    tags: ["Bilet", "Demirýol", "Sargyt"],
    desc: "Demirýol bilet almagyň ähli usullaryny, möhüm maglumatlary we ädim-ädim gollanmany öwren.",
    lessons: [
      { id: 1, title: "Demirýol ulgamyna giriş", duration: "8 min",
        content: "# Demirýol Ulgamyna Giriş\n\n## Türkmenistanda demirýol\nTürkmenistanyň demirýol ulgamy ýurduň iň möhüm ulag ulgamlarynyň biridir. Ýyllyk 10 milliondan gowrak ýolagçy gatnaýar.\n\n## Esasy ugurlar\n- **Aşgabat → Daşoguz** — 520 km\n- **Aşgabat → Mary** — 360 km\n- **Aşgabat → Balkanabat** — 560 km\n- **Aşgabat → Türkmenabat** — 580 km\n\n## Gatnaw tertibi\nGündelik gatnawlar esasy ugurlarda hereket edýär. Bilet bahalary wagona we şertlere görä üýtgeýär.\n\n## Möhüm bellik\nBilet almazyndan öň pasportyňyzy taýýarlap goýuň. Hemme bilet alyşlar üçin resmi tanamak hökman." },
      { id: 2, title: "Onlayn bilet almak (Ýeňil)", duration: "10 min",
        content: "# Onlayn Bilet Almak\n\n## Ýeňil programmasy arkaly\nYeňil programmasy bilet satyn almak üçin iň aňsat ýol.\n\n## Ädim-ädim\n1. Programmaňy açyň\n2. **Demirýol** bölimine giriň\n3. Ugurňyzy saýlaň (Başlangyç → Barmaly)\n4. Senäňizi saýlaň\n5. Ýolagçy maglumatyny dolduryň\n6. Töleg usulyny saýlaň (BP ýa-da kart)\n7. Tassykla düwmesine basyň\n8. SMS 1–4 sagat içinde geler\n\n## Töleg usullary\n- **Bonus Pul (BP)** — arzanladyşly\n- **Bank kart** — adaty nyrh\n\n## Maslahatlary\n- Bilet iň az 2 sagat öňünden alynmaly\n- Möhleti — saparyňyzdan 90 gün öň" },
      { id: 3, title: "Kassadan bilet almak", duration: "7 min",
        content: "# Kassadan Bilet Almak\n\n## Demirýol menziliniň kassasy\nKassalar adatça 06:00 – 22:00 arasynda açykdyr.\n\n## Gerekli resminamalar\n- Pasport (hökmany)\n- Pul (nagt ýa-da kart)\n\n## Kassada bilet almak ädimi\n1. Kassanyň öňündäki nobata duruň\n2. Ugurňyzy we senäňizi aýdyň\n3. Wagonyny we oturgyç görnüşini saýlaň\n4. Pasportyňyzy beriň\n5. Tölegi geçiriň\n6. Bilet alnanda gözden geçiriň\n\n## Oturgyç görnüşleri\n- **Platskart** — arzan, açyk wagon\n- **Kupe** — 4 adam, ýapyk bölüm\n- **SWE (LUX)** — 2 adam, iň rahat" },
      { id: 4, title: "Bilet üýtgetmek we yzyna gaýtarmak", duration: "10 min",
        content: "# Bilet Üýtgetmek we Gaýtarmak\n\n## Bilet üýtgetmek\nSapar senesini üýtgetmek kasda ýa-da merkezi biletçi arkaly amala aşyrylýar.\n\n## Gaýtarmak düzgünleri\n- Sapardan **48 sagat öň** — doly pul yzyna\n- Sapardan **24 sagat öň** — 85% pul yzyna\n- Sapardan **12 sagat öň** — 50% pul yzyna\n- Sapardan **az** — pul gaýtarylmaýar\n\n## Yzyna gaýtarmak ädimi\n1. Bilet alan kassanyňyza gidiň\n2. Biletňizi we pasportyňyzy beriň\n3. Sebäbi aýdyň\n4. Pul 3–5 iş gününde yzyna geçer\n\n## Maslahat\nHer wagt bilet almazyndan öň saparyňyzy tassyklaň!" },
      { id: 5, title: "Soraglar we jogaplar", duration: "10 min",
        content: "# Ýygy Soraglar (FAQ)\n\n## Bilet almak barada\n**S: Bilet näçe öňünden alynmaly?**\nJ: Iň az 2 sagat, iň köp 90 gün öňünden alyp bolýar.\n\n**S: Çaga üçin bilet gerekmi?**\nJ: 5 ýaşa çenli çagalar bilet almaz (oturgysyz). 5–12 ýaş aralagy – arzan bilet.\n\n**S: Bagaž üçin töleg barmy?**\nJ: 36 kg çenli mugt. Artyk bagaž üçin töleg bar.\n\n**S: Bilet ýitirse näme etmeli?**\nJ: Derrew kassany ýa-da 24/7 telefon liniýasyny jaňlaň.\n\n**S: Ýeňil arkaly alnan bilet kassy bilete deňmi?**\nJ: Hawa, doly deňdir. SMS bilen gatnawyňyza ugraň." },
    ],
  },
  {
    id: 2, category: "finance", free: true,
    title: "Maliýe sowatlylygy",
    instructor: "Ýeňil Finance", duration: "60 min",
    icon: "cash-outline", color: "#f59e0b",
    rating: 4.8, students: 890,
    tags: ["Pul", "Tygşytlylyk", "Maliýe"],
    desc: "Şahsy maliýäňizi dolandyrmak, tygşytlylyk we Bonus Pul ulgamynyň ähli syrlary.",
    lessons: [
      { id: 1, title: "Şahsy býujet düzmek", duration: "12 min",
        content: "# Şahsy Býujet Düzmek\n\n## Býujet näme?\nBýujet — girdejiňizi we çykdajylaryňyzy meýilleşdirmek ulgamy.\n\n## 50/30/20 düzgüni\n- **50%** — Hökmany çykdajylar (iýmit, jaý, ulag)\n- **30%** — Isleg çykdajylary (güýmenje, eşik)\n- **20%** — Tygşytlylyk we maýa goýum\n\n## Ädim-ädim\n1. Aýlyk girdejini ýaz\n2. Ähli çykdajylary sanap çyk\n3. Kategoriýalara bölüp goý\n4. Artyk çykdajylary kes\n5. Tygşytlylyk maksadyny bel\n\n## Peýdaly maslahatlar\n- Her gün çykdajylaryňy ýaz\n- Ownuk çykdajylara üns ber\n- Bir aýlyk ätiýaç goruny dol" },
      { id: 2, title: "Bonus Pul ulgamy", duration: "15 min",
        content: "# Bonus Pul Ulgamy\n\n## BP näme?\nBonus Pul (BP) — Ýeňil platformasynda ulanylýan ýörite balans. 1 BP = 1 TMT bahasy bar.\n\n## Nähili gazanylýar?\n- Her demirýol bilet sargydy → **2% BP yzyna**\n- Walýuta çalyşmak → **1% BP yzyna**\n- Dostlaryňy çagyr → **50 BP bonus**\n- Ýörite teklipler → **goşmaça BP**\n\n## Nähili ulanylýar?\n- Bilet tölegleri\n- Walýuta çalyşmak\n- Ähli Ýeňil hyzmatlary\n\n## Möhleti\nBP gazanylan gününden 12 aý geçerli.\n\n## BP Geçirmek\nBasga ulanyjylara BP iberip bolýar. TMCell > BP Geçir." },
      { id: 3, title: "Walýuta we kurs hakda", duration: "18 min",
        content: "# Walýuta we Kurs Hakda\n\n## Esasy walýutalar\n- **USD** — ABD dollary\n- **EUR** — Ýewro\n- **RUB** — Rus rublesi\n\n## Elektron walýutalar\n- **Payeer (P)** — köp ýurtda kabul edilýär\n- **Perfect Money (PM)** — howpsuz we çalt\n- **WebMoney (WMZ)** — Garaşsyz döwletlerde meşhur\n\n## Walýuta çalyşmak endikleri\n- Kurs üýtgäp durýar — her gün barlap tur\n- Uly mukdarlary bölüşdirip çalyş\n- Ygtybarly platformalardan peýdalan\n\n## Ýeňil üsti bilen çalyşmak\nTMCell bölüminden Walýuta bölimine giriň." },
      { id: 4, title: "Tygşytlylyk strategiýasy", duration: "15 min",
        content: "# Tygşytlylyk Strategiýasy\n\n## Tygşytlylyk üçin ilkinji ädimler\n1. **Maksady bel** — näme üçin tygşytlaýaryn?\n2. **Tölegi awtomatlaşdyr** — girdeji gelen dessine goy\n3. **Ownuk tygşytlyk** — köpelýär!\n\n## 5 aýlyk ätiýaç pul\nBirhili wakalar üçin aýlyk çykdajyňyň 5 essesi ýygnaly.\n\n## Maýa goýum başlangyçlary\n- Bankdaky goýum hasaby\n- Altyn we gymmat bahaly metallary\n- Bilimiňize goýum — iň gowy goýum!\n\n## Çykdajylary azaltmak\n- Naharhanadan az, öýde köp iý\n- Elektrik we suw tygşytla\n- Gerek däl abuna alyşlary bes et" },
    ],
  },
  {
    id: 3, category: "language", free: false,
    title: "Iňlis dili — Başlangyç (A1–A2)",
    instructor: "English for TM", duration: "120 min",
    icon: "language-outline", color: "#8b5cf6",
    rating: 4.7, students: 2100,
    tags: ["Iňlisçe", "A1", "A2", "Dil"],
    desc: "Noldan iňlis dilini öwren. Gündelik sözler, esasy grammatika, gepleşik endikleri.",
    lessons: [
      { id: 1, title: "Salam we tanyşmak", duration: "20 min",
        content: "# Salam we Tanyşmak\n\n## Esasy salamlaşmak\n- Hello / Hi — Salam\n- Good morning — Hoş günler\n- Good evening — Agşam hoş\n- Goodbye / Bye — Hoş gal\n\n## Tanyşmak\n- My name is ... — Meniň adym ...\n- What is your name? — Adyňyz näme?\n- Nice to meet you — Tanyşandygymyza şat\n\n## Ýurt we şäher\n- Where are you from? — Nirädensiňiz?\n- I am from Turkmenistan — Men Türkmenistandan" },
      { id: 2, title: "Sanlar (1–100)", duration: "25 min",
        content: "# Iňlis dilinde Sanlar\n\n## 1–10\nOne, Two, Three, Four, Five\nSix, Seven, Eight, Nine, Ten\n\n## 11–20\nEleven, Twelve, Thirteen, Fourteen, Fifteen\nSixteen, Seventeen, Eighteen, Nineteen, Twenty\n\n## Onluklar\nThirty (30), Forty (40), Fifty (50)\nSixty (60), Seventy (70), Eighty (80)\nNinety (90), One hundred (100)\n\n## Mysal\n- 25 = Twenty-five\n- 47 = Forty-seven\n- 99 = Ninety-nine" },
      { id: 3, title: "Reňkler we şekiller", duration: "20 min",
        content: "# Reňkler we Şekiller\n\n## Esasy reňkler\n- Gyzyl — Red\n- Gök — Blue\n- Ýaşyl — Green\n- Sary — Yellow\n- Ak — White\n- Gara — Black\n- Mämişi — Orange\n- Gyrmyzy — Pink\n\n## Şekiller\n- Tegelek — Circle\n- Dört burçluk — Square\n- Üçburçluk — Triangle\n- Gönüburçluk — Rectangle\n\n## Mysal sözlemler\n- The sky is blue — Asman gök\n- The apple is red — Alma gyzyl" },
    ],
  },
  {
    id: 4, category: "tech", free: true,
    title: "Internet howpsuzlygy",
    instructor: "TM Cyber", duration: "40 min",
    icon: "shield-checkmark-outline", color: "#0ea5e9",
    rating: 4.6, students: 650,
    tags: ["Internet", "Howpsuzlyk", "Kiberhowpsuzlyk"],
    desc: "Onlayn howpsuzlygyňy goramagy öwren — parol, aldaw, şahsy maglumatlary goramak.",
    lessons: [
      { id: 1, title: "Güýçli parol döretmek", duration: "10 min",
        content: "# Güýçli Parol Döretmek\n\n## Gowşak parol mysallary (ulanmaň!)\n- 123456\n- password\n- doglan_senem\n- at at\n\n## Güýçli parol döretmek düzgünleri\n1. Azyndan **12 harp**\n2. Uly we kiçi harplar garyş\n3. Sanlar goş (1–9)\n4. Ýörite nyşanlar: @ # $ % !\n5. Sözlem ulan: 'M@ry2024$Gitdim!'\n\n## Parol dolandyryjy\nHer platforma üçin dürli parol ulan.\nLastPass ýa-da Bitwarden ulan.\n\n## 2FA (Iki tapgyrly tassyklaýyş)\nHemme möhüm hasaplarda 2FA açyk bolsun!" },
      { id: 2, title: "Aldaw we fişing", duration: "15 min",
        content: "# Aldaw we Fişing\n\n## Fişing näme?\nFişing — ýalňyş saýt ýa-da hat arkaly maglumatyňy ogurlamak synanyşygy.\n\n## Nädip tanamalı?\n- URL dogry ýazylanmy? (yenil.tm ≠ yen1l.tm)\n- Ynanylmadyk paket ýa-da mukdar wada edýärmi?\n- Hasaby ýa-da paroly soraýarmy?\n- Howatyrlandyryjy dil ulanýarmy?\n\n## Meniň edýän işlerim\n- Tanalmaýan ýerden gelýän hatlary açmaň\n- Baglantylara basyň, URL barlanyň\n- Hiç haçan parol ýa-da OTP paýlaşmaň\n\n## Sosial inženerlik\nYnanylýan adam bolup tanyşan, soňra maglumat sorayan aldawçylardan seresap boluň." },
      { id: 3, title: "WiFi we VPN howpsuzlygy", duration: "15 min",
        content: "# WiFi we VPN Howpsuzlygy\n\n## Açyk WiFi howplary\nKafedäki ýa-da myhmanhanadaky açyk WiFi howply!\n- Başga adamlar traffigiňizi görüp biler\n- Adam-ortasyndaky hüjümler mümkin\n\n## Açyk WiFide näme etmeli däl?\n- Bankda girmek\n- Parollary girmek\n- Şahsy maglumatlary ibermek\n\n## VPN näme?\nVPN (Virtual Private Network) — internet traffigiňizi şifrläp, gizlin saklaýar.\n\n## Maslahat berilýän VPN-ler\n- ProtonVPN (mugt, ygtybarly)\n- Mullvad\n- ExpressVPN\n\n## Öý WiFi howpsuzlygy\n- WPA3 şifrlemäni açyň\n- Routeryň adyny üýtgediň\n- Güýçli parol goýuň" },
    ],
  },
  {
    id: 5, category: "math", free: true,
    title: "Gündelik matematika",
    instructor: "Ylym Merkezi", duration: "55 min",
    icon: "calculator-outline", color: "#ef4444",
    rating: 4.5, students: 430,
    tags: ["Matematika", "Hasaplama", "Gündelik"],
    desc: "Durmuşda her gün gerekli matematika — göterim, baha, möçber, wagtlaýyn hasaplama.",
    lessons: [
      { id: 1, title: "Göterimleri hasaplamak", duration: "15 min",
        content: "# Göterimleri Hasaplamak\n\n## Göterim näme?\nGöterim — bir sanyň 100 bölege nisbati.\n\n## Esasy formula\n**Göterim = (Bölek ÷ Jemi) × 100**\n\n## Mysallar\n- 200-iň 20%-i = 200 × 0.20 = **40**\n- 500-iň 15%-i = 500 × 0.15 = **75**\n- 1000-iň 7.5%-i = 1000 × 0.075 = **75**\n\n## Arzanladyş hasabı\n1000 TMT bolan haryt 25% arzanladyşda:\n1000 × (1 - 0.25) = **750 TMT**\n\n## Artdyryş hasabı\n500 TMT bolan zat 10% gymmatlasa:\n500 × (1 + 0.10) = **550 TMT**" },
      { id: 2, title: "Wagtlaýyn we tizlik", duration: "20 min",
        content: "# Wagtlaýyn we Tizlik\n\n## Esasy formula\n**Aralyk = Tizlik × Wagt**\n\n## Mysallar\n- 60 km/s tizlikde 3 sagat gitsek: 60 × 3 = **180 km**\n- 120 km aralygy 80 km/s tizlikde: 120 ÷ 80 = **1.5 sagat**\n\n## Orta tizlik\n- Baryş: 60 km/s, Gaýdyş: 40 km/s\n- Orta tizlik = (2 × 60 × 40) ÷ (60 + 40) = **48 km/s**\n\n## Demirýolda ulanmak\nAşgabat → Mary = 360 km\n120 km/s orta tizlik → 3 sagat gatnaw" },
      { id: 3, title: "Möçber we birlikler", duration: "20 min",
        content: "# Möçber we Birlikler\n\n## Uzynlyk\n- 1 m = 100 sm = 1000 mm\n- 1 km = 1000 m\n\n## Agramy\n- 1 kg = 1000 g\n- 1 tonna = 1000 kg\n\n## Göwrüm\n- 1 litr = 1000 ml\n- 1 m³ = 1000 litr\n\n## Meýdan\n- 1 m² = 10 000 sm²\n- 1 ga = 10 000 m²\n- 1 km² = 1 000 000 m²\n\n## Gündelik ulanmak\n- Dükanda: 1.5 kg = 1500 g\n- Benzin: 40 litr = 40 000 ml\n- Jaý: 75 m² howly" },
    ],
  },
  {
    id: 6, category: "health", free: true,
    title: "Sagdyn durmuş ýörelgeleri",
    instructor: "Saglyk Merkezi", duration: "50 min",
    icon: "heart-outline", color: "#ec4899",
    rating: 4.7, students: 780,
    tags: ["Saglyk", "Sport", "Iýmit"],
    desc: "Güýçli beden, sagdyn akyl. Gündelik endikler, iýmitlenme, bedenterbiýe.",
    lessons: [
      { id: 1, title: "Sagdyn iýmitlenme", duration: "18 min",
        content: "# Sagdyn Iýmitlenme\n\n## Gündelik iýmit päsleri\n1. Ir säher (07:00–09:00)\n2. Günortan (12:00–14:00)\n3. Agşam (18:00–20:00)\n4. Kiçi ara nahar (islege görä)\n\n## Gün üçin zerur maddalar\n- **Belok** — et, balyk, ýumurtga, pülüň\n- **Uglewod** — çörek, tüwi, ýar\n- **Ýag** — zeýtun ýagy, hoz\n- **Witaminler** — miweler, gök önümler\n\n## Içgi\n- Günde 8–10 bulgur suw iç\n- Gyzgyn çaý we kофе — günde 2–3 bulgur\n- Süýjüli gazly içgileri azalt\n\n## Zyýanly endikler\n- Agşam giç naharlanmak\n- Çalt iýmek\n- Nahar üstünde ekran görmek" },
      { id: 2, title: "Gündelik maşk endigi", duration: "15 min",
        content: "# Gündelik Maşk Endigi\n\n## Näme üçin maşk gerek?\n- Ýürek we gan damarlaryny güýçlendirýär\n- Derman almak zerurlygyny azaldýar\n- Ruhy saglyk üçin peýdaly\n- Energiýa berýär\n\n## 30 günlük başlangyç meýilnama\n**1–7-nji günler:** 15 minutlyk ýöriş\n**8–14-nji günler:** 20 min ýöriş + 10 min ýeňil maşk\n**15–30-nji günler:** 30 min sport + güýçlendirme\n\n## Öýde edip bolýan maşklar\n- Oturma-turma (20 gezek)\n- Güýç maşky (10 gezek)\n- Germe-maşklary (5 min)\n- Bökmek (100 gezek)\n\n## Möhüm bellik\nHer gün deň wagt sport et. Endige öwrülýär!" },
      { id: 3, title: "Ukuň we dynç almak", duration: "17 min",
        content: "# Ukuň we Dynç Almak\n\n## Sagdyn uky näçe sagat?\n- Uly adamlar: **7–9 sagat**\n- Ýetginjekler: 8–10 sagat\n- Çagalar: 9–12 sagat\n\n## Gowy uky üçin endikler\n- Her gün deň wagtda ýat we oýan\n- Ýatmazdan 1 sagat öň ekrany ýap\n- Otagyň temperatura 18–20°C bolsun\n- Garaňky we sessiz gurşaw dör\n- Alkogol we kofe agşam alma\n\n## Dynç almak\n- Gysga arakesme (Pomodoro — 25 min iş, 5 min dynç)\n- Meditasiýa — 10 min\n- Tebigatda wagtlaýyn ýöriş\n- Suw içmegi unutma\n\n## Stres dolandyrmak\nÝakynlaryňyz bilen gürleşiň. Hünär kömek almakdan çekinmäň!" },
    ],
  },
];

const ARTICLES: Article[] = [
  { id: 1, category: "railway", free: true, icon: "train-outline", color: "#10b981",
    title: "Demirýol bilet gollanmasy",
    author: "Ýeňil Team", readTime: 5, tags: ["Bilet", "Gollanma"],
    content: "# Demirýol Bilet Gollanmasy\n\n## Bilet almagyň usullary\n**1. Onlayn (Ýeňil):** Programma arkaly, 24/7, ýerden turmak hökman däl.\n\n**2. Kassadan:** Menzil kassasynda, 08:00–20:00.\n\n## Esasy maglumatlar\n- Pasport hökmany\n- Sapar senesi 1–90 gün öňünden\n- Baha: 60–80 TMT\n\n## Ýeňil arkaly ädimler\n1. Programma → Demirýol\n2. Maglumatlary doldur\n3. Töleg et\n4. SMS garaş" },
  { id: 2, category: "finance", free: true, icon: "wallet-outline", color: "#f59e0b",
    title: "Bonus Pul nähili işleýär?",
    author: "Ýeňil Maliýe", readTime: 4, tags: ["Bonus", "BP"],
    content: "# Bonus Pul Gollanmasy\n\n## BP näme?\nBonus pul — Ýeňil platformasynda ulanylýan ýörite balans.\n\n## Nähili gazanylýar?\n- Sargytda 2% yzyna gelýär\n- Dost çagyr → 50 BP\n- Ýörite teklipler\n\n## Nirde ulanyp bolýar?\n- Bilet tölegleri\n- Walýuta çalyşmak\n\n## Bellik\n- BP nagtlaşdyrylmaýar\n- Möhleti 12 aý" },
  { id: 3, category: "finance", free: false, icon: "swap-horizontal-outline", color: "#6366f1",
    title: "Walýuta çalyşmak gollanmasy",
    author: "Ýeňil Finance", readTime: 7, tags: ["Walýuta", "Payeer"],
    content: "# Walýuta Çalyşmak Gollanmasy\n\n## Elýeterli walýutalar\n- Payeer (P)\n- Perfect Money (PM)\n- WebMoney (WMZ)\n\n## Alyş nyrhy\n1 USD = 29 TMT\n\n## Çalyşmak ädimi\n1. TMCell → Walýuta\n2. Mukdary gir\n3. Hasabyňy görket\n4. Tölegi geçir" },
  { id: 4, category: "tech", free: true, icon: "wifi-outline", color: "#0ea5e9",
    title: "Türkmenistanda Internet",
    author: "TM Tech", readTime: 8, tags: ["Internet", "TMCell"],
    content: "# Türkmenistanda Internet\n\n## Esasy operatorlar\n- TMCell — ýurt içi baş operator\n- Altyn Asyr — internet hyzmatlar\n\n## Internet paketleri\n- 5 GB — 25 TMT/aý\n- 10 GB — 45 TMT/aý\n- Çäksiz — 80 TMT/aý\n\n## Maslahatlar\n- WiFi-dan köp peýdalan\n- VPN ulanmak maslahat berilýär" },
  { id: 5, category: "language", free: false, icon: "language-outline", color: "#8b5cf6",
    title: "Iňlis dili esaslary",
    author: "English for TM", readTime: 10, tags: ["Iňlisçe", "Dil"],
    content: "# Iňlis Dili Esaslary\n\n## Gündelik sözler\n- Salam — Hello\n- Hoş gal — Goodbye\n- Sagbol — Thank you\n\n## Sanlar\n1 — One, 2 — Two, 3 — Three\n\n## Esasy soraglar\n- What is your name? — Adyňyz näme?\n- How are you? — Nähili ýagdaý?" },
  { id: 6, category: "railway", free: true, icon: "map-outline", color: "#ef4444",
    title: "Aşgabat demirýol menzili",
    author: "DY Info", readTime: 3, tags: ["Menzil", "Aşgabat"],
    content: "# Aşgabat Demirýol Menzili\n\n## Ýerleşişi\nAşgabat, Garaşsyzlyk şaýoly\n\n## Işleýiş wagty\n- Kassa: 08:00–20:00\n- Zal: 24 sagat açyk\n\n## Hyzmatlar\n- Bagaž saklamak\n- Kafe\n\n## Ugurlar\n- Aşgabat → Daşoguz\n- Aşgabat → Mary\n- Aşgabat → Balkanabat" },
  { id: 7, category: "health", free: true, icon: "heart-outline", color: "#ec4899",
    title: "Sagdyn iýmitlenme gollanmasy",
    author: "Saglyk Merkezi", readTime: 6, tags: ["Saglyk", "Iýmit"],
    content: "# Sagdyn Iýmitlenme\n\n## Gündelik nahar\n1. Ir säher — agyr nahar\n2. Günortan — orta nahar\n3. Agşam — ýeňil nahar\n\n## Zerur maddalar\n- Belok: et, balyk, ýumurtga\n- Uglewod: çörek, tüwi\n- Witamin: miweler, gök önümler\n\n## Suw\nGünde 8–10 bulgur suw iç" },
  { id: 8, category: "math", free: true, icon: "calculator-outline", color: "#ef4444",
    title: "Göterim hasaplamalary",
    author: "Ylym Merkezi", readTime: 5, tags: ["Matematika", "Göterim"],
    content: "# Göterim Hasaplamalary\n\n## Formula\nGöterim = (Bölek ÷ Jemi) × 100\n\n## Mysallar\n- 200-iň 20% = 40\n- 1000-iň 15% = 150\n\n## Arzanladyş\n1000 TMT haryt 25% arzanladyşda = 750 TMT\n\n## Artdyryş\n500 TMT zat 10% gymmatlasa = 550 TMT" },
];

const QUIZZES: Quiz[] = [
  { id: 1, category: "railway", free: true, icon: "train-outline", color: "#10b981",
    title: "Demirýol bilimleri", desc: "Bilet, gatnaw we menzil baradaky soraglar",
    questions: [
      { q: "Demirýol biletini iň az näçe öňünden almaly?", opts: ["30 min", "2 sagat", "1 gün", "3 gün"], correct: 1 },
      { q: "Aşgabat → Mary aralygy näçe km?", opts: ["200 km", "280 km", "360 km", "450 km"], correct: 2 },
      { q: "Ýeňil arkaly bilet alanyňda töleg nähili?", opts: ["Diňe nagt", "Diňe kart", "BP ýa-da kart", "Mugt"], correct: 2 },
      { q: "Sapardan 48 sagat öň bilet gaýtarylanda näçe % pul yzyna?", opts: ["50%", "75%", "85%", "100%"], correct: 3 },
      { q: "Çagalar üçin mugt bilet — näçe ýaşa çenli?", opts: ["3 ýaş", "5 ýaş", "7 ýaş", "10 ýaş"], correct: 1 },
    ],
  },
  { id: 2, category: "finance", free: true, icon: "cash-outline", color: "#f59e0b",
    title: "Maliýe sapaklary", desc: "Pul dolandyryş, BP we tygşytlylyk",
    questions: [
      { q: "50/30/20 düzgüninde 20% nämä gidýär?", opts: ["Iýmite", "Güýmenjä", "Tygşytlylyga", "Eşige"], correct: 2 },
      { q: "1 BP näçe TMT bahasy bar?", opts: ["0.1 TMT", "0.5 TMT", "1 TMT", "2 TMT"], correct: 2 },
      { q: "Dost çagyrsaň BP bonusy näçe?", opts: ["10 BP", "25 BP", "50 BP", "100 BP"], correct: 2 },
      { q: "BP-niň möhleti näçe aý?", opts: ["3 aý", "6 aý", "12 aý", "24 aý"], correct: 2 },
      { q: "Demirýol sargydy üçin BP yzyna näçe göterim?", opts: ["1%", "2%", "5%", "10%"], correct: 1 },
    ],
  },
  { id: 3, category: "tech", free: true, icon: "shield-checkmark-outline", color: "#0ea5e9",
    title: "Internet howpsuzlygy", desc: "Kiber howplar, parol, VPN",
    questions: [
      { q: "Güýçli parol iň az näçe harp bolmaly?", opts: ["6", "8", "10", "12"], correct: 3 },
      { q: "Fişing näme?", opts: ["Internet çaltlygy", "Aldawly maglumat ogurlamak", "Wirus programmasy", "Sosial ulgam"], correct: 1 },
      { q: "2FA näme üçin gerek?", opts: ["Tizligi artdyrmak", "Ikili tassyklaýyş goragy", "Pul tygşytlamak", "Paroly ýadyňda saklamak"], correct: 1 },
      { q: "Açyk WiFi-da näme etmeli däl?", opts: ["Wideo görmek", "Habar okamak", "Bank hasabyna girmek", "Karta seredmek"], correct: 2 },
      { q: "WPA3 näme bilen baglanyşykly?", opts: ["Internet tizligi", "WiFi şifrlemesi", "Antiwirusy", "VPN"], correct: 1 },
    ],
  },
  { id: 4, category: "math", free: true, icon: "calculator-outline", color: "#ef4444",
    title: "Matematika synag", desc: "Göterim, tizlik we möçber",
    questions: [
      { q: "200-iň 25%-i näçe?", opts: ["25", "40", "50", "75"], correct: 2 },
      { q: "60 km/s tizlikde 2.5 sagat gitsek näçe km?", opts: ["120 km", "140 km", "150 km", "180 km"], correct: 2 },
      { q: "1 kg näçe gram?", opts: ["100 g", "500 g", "1000 g", "10 000 g"], correct: 2 },
      { q: "1000 TMT 30% arzanladyşda näçe?", opts: ["600 TMT", "700 TMT", "750 TMT", "800 TMT"], correct: 1 },
      { q: "Aralyk = Tizlik × ?", opts: ["Uzaklyk", "Wagt", "Agramy", "Tizlenme"], correct: 1 },
    ],
  },
  { id: 5, category: "language", free: false, icon: "language-outline", color: "#8b5cf6",
    title: "Iňlis dili testi", desc: "Esasy sözler we grammatika",
    questions: [
      { q: "\"Salam\" iňlisçe näme?", opts: ["Goodbye", "Thank you", "Hello", "Please"], correct: 2 },
      { q: "\"Thank you\" türkmençe näme?", opts: ["Salam", "Sagbol", "Hoş gal", "Bagyşla"], correct: 1 },
      { q: "\"Red\" türkmençe?", opts: ["Gök", "Sary", "Gyzyl", "Ýaşyl"], correct: 2 },
      { q: "\"What is your name?\" näme diýmek?", opts: ["Nähili ýagdaý?", "Adyňyz näme?", "Nirädensiňiz?", "Näçe ýaşyňyz?"], correct: 1 },
      { q: "\"Twenty-five\" san hökmünde?", opts: ["15", "20", "25", "52"], correct: 2 },
    ],
  },
  { id: 6, category: "health", free: true, icon: "heart-outline", color: "#ec4899",
    title: "Saglyk bilimleri", desc: "Iýmit, sport we uky",
    questions: [
      { q: "Uly adamlar üçin günde näçe sagat uky maslahat berilýär?", opts: ["5–6", "6–7", "7–9", "10–12"], correct: 2 },
      { q: "Günde näçe bulgur suw içmeli?", opts: ["3–4", "5–6", "8–10", "12–15"], correct: 2 },
      { q: "Belok çeşmesi haýsy?", opts: ["Şeker", "Ýag", "Ýumurtga", "Çörek"], correct: 2 },
      { q: "Pomodoro usuly näçe minutlyk iş göz öňünde tutýar?", opts: ["10 min", "25 min", "45 min", "60 min"], correct: 1 },
      { q: "WiFi-da howpsuz temperatura näçe°C?", opts: ["10–15°C", "18–20°C", "22–25°C", "26–30°C"], correct: 1 },
    ],
  },
];

const PROG_KEY = "ebilim_progress_v2";
const DEFAULT_PROG: Progress = {
  lessonsDone: {}, quizBest: {},
  bookmarks: { courses: [], articles: [], quizzes: [] },
  readArticles: [], streak: 0, lastDate: "", totalMinutes: 0,
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function EbilimScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  const [tab, setTab] = useState<MainTab>("home");
  const [catFilter, setCatFilter] = useState<Category>("all");
  const [search, setSearch] = useState("");
  const [prog, setProg] = useState<Progress>(DEFAULT_PROG);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<(number | null)[]>([]);
  const [quizDone, setQuizDone] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(PROG_KEY).then(v => {
      if (v) { try { setProg(JSON.parse(v)); } catch {} }
      setLoading(false);
    });
  }, []);

  const saveProg = useCallback((next: Progress) => {
    setProg(next);
    AsyncStorage.setItem(PROG_KEY, JSON.stringify(next));
  }, []);

  const toggleBookmark = useCallback((type: "courses" | "articles" | "quizzes", id: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const list = prog.bookmarks[type];
    const next = { ...prog, bookmarks: { ...prog.bookmarks, [type]: list.includes(id) ? list.filter(x => x !== id) : [...list, id] } };
    saveProg(next);
  }, [prog, saveProg]);

  const markLessonDone = useCallback((courseId: number, lessonId: number, mins: number) => {
    const key = `${courseId}_${lessonId}`;
    if (prog.lessonsDone[key]) return;
    const next: Progress = { ...prog, lessonsDone: { ...prog.lessonsDone, [key]: true }, totalMinutes: prog.totalMinutes + mins };
    // streak
    const today = new Date().toDateString();
    if (next.lastDate !== today) { next.streak = (next.lastDate === new Date(Date.now() - 86400000).toDateString() ? prog.streak + 1 : 1); next.lastDate = today; }
    saveProg(next);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [prog, saveProg]);

  const markArticleRead = useCallback((id: number) => {
    if (prog.readArticles.includes(id)) return;
    const today = new Date().toDateString();
    const next: Progress = { ...prog, readArticles: [...prog.readArticles, id], totalMinutes: prog.totalMinutes + 4 };
    if (next.lastDate !== today) { next.streak = (next.lastDate === new Date(Date.now() - 86400000).toDateString() ? prog.streak + 1 : 1); next.lastDate = today; }
    saveProg(next);
  }, [prog, saveProg]);

  const getCourseProgress = (c: Course) => {
    const done = c.lessons.filter(l => prog.lessonsDone[`${c.id}_${l.id}`]).length;
    return { done, total: c.lessons.length, pct: Math.round((done / c.lessons.length) * 100) };
  };

  const totalLessons = Object.keys(prog.lessonsDone).length;
  const totalQuizzes = Object.keys(prog.quizBest).length;
  const completedCourses = COURSES.filter(c => getCourseProgress(c).pct === 100).length;

  // ── Filter helpers
  const filterCourse = (c: Course) => {
    const matchCat = catFilter === "all" || c.category === catFilter;
    const s = search.toLowerCase();
    const matchS = !s || c.title.toLowerCase().includes(s) || c.instructor.toLowerCase().includes(s) || c.tags.some(t => t.toLowerCase().includes(s));
    return matchCat && matchS;
  };
  const filterArt = (a: Article) => {
    const matchCat = catFilter === "all" || a.category === catFilter;
    const s = search.toLowerCase();
    const matchS = !s || a.title.toLowerCase().includes(s) || a.author.toLowerCase().includes(s) || a.tags.some(t => t.toLowerCase().includes(s));
    return matchCat && matchS;
  };
  const filterQuiz = (q: Quiz) => {
    const matchCat = catFilter === "all" || q.category === catFilter;
    const s = search.toLowerCase();
    const matchS = !s || q.title.toLowerCase().includes(s) || q.desc.toLowerCase().includes(s);
    return matchCat && matchS;
  };

  // ── In-progress courses
  const inProgress = COURSES.filter(c => {
    const p = getCourseProgress(c);
    return p.done > 0 && p.pct < 100;
  });

  const startQuiz = (quiz: Quiz) => {
    if (!quiz.free) { Alert.alert("Premium Test", "Bu test premium. Abuna alyň.", [{ text: "Ýap" }, { text: "Abuna al", onPress: () => router.push("/(tabs)/more" as any) }]); return; }
    setActiveQuiz(quiz);
    setQuizStep(0);
    setQuizAnswers(new Array(quiz.questions.length).fill(null));
    setQuizDone(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const answerQuiz = (optIdx: number) => {
    const next = [...quizAnswers];
    next[quizStep] = optIdx;
    setQuizAnswers(next);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => {
      if (quizStep < activeQuiz!.questions.length - 1) {
        setQuizStep(s => s + 1);
      } else {
        const correct = next.filter((a, i) => a === activeQuiz!.questions[i].correct).length;
        const score = Math.round((correct / activeQuiz!.questions.length) * 100);
        const prev = prog.quizBest[activeQuiz!.id] ?? 0;
        const updProg = { ...prog, quizBest: { ...prog.quizBest, [activeQuiz!.id]: Math.max(prev, score) } };
        const today = new Date().toDateString();
        if (updProg.lastDate !== today) { updProg.streak = (prog.lastDate === new Date(Date.now() - 86400000).toDateString() ? prog.streak + 1 : 1); updProg.lastDate = today; }
        saveProg(updProg);
        setQuizDone(true);
        Haptics.notificationAsync(score >= 80 ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning);
      }
    }, 350);
  };

  if (loading) return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );

  const quizScore = activeQuiz && quizDone ? Math.round((quizAnswers.filter((a, i) => a === activeQuiz.questions[i].correct).length / activeQuiz.questions.length) * 100) : 0;

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <LinearGradient
        colors={["#6366f1", "#8b5cf6"]}
        style={[s.header, { paddingTop: (isWeb ? 0 : insets.top) + 10 }]}
      >
        <View style={s.headerTop}>
          <Pressable onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back-outline" size={22} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle}>E-Bilim</Text>
            <Text style={s.headerSub}>Öwren · Synag et · Ös</Text>
          </View>
          <View style={s.streakBadge}>
            <Text style={{ fontSize: 14 }}>🔥</Text>
            <Text style={s.streakText}>{prog.streak}</Text>
          </View>
        </View>
        {/* Stats row */}
        <View style={s.statsRow}>
          <View style={s.statItem}>
            <Text style={s.statNum}>{totalLessons}</Text>
            <Text style={s.statLabel}>Sapaklaryň</Text>
          </View>
          <View style={s.statDiv} />
          <View style={s.statItem}>
            <Text style={s.statNum}>{completedCourses}</Text>
            <Text style={s.statLabel}>Kurs tamamlanan</Text>
          </View>
          <View style={s.statDiv} />
          <View style={s.statItem}>
            <Text style={s.statNum}>{totalQuizzes}</Text>
            <Text style={s.statLabel}>Test çözülen</Text>
          </View>
          <View style={s.statDiv} />
          <View style={s.statItem}>
            <Text style={s.statNum}>{prog.totalMinutes}</Text>
            <Text style={s.statLabel}>Min öwrenildi</Text>
          </View>
        </View>
        {/* Tab bar */}
        <View style={s.tabBar}>
          {(["home", "courses", "articles", "quizzes"] as MainTab[]).map(t => {
            const labels: Record<MainTab, string> = { home: "Baş", courses: "Kurslar", articles: "Makala", quizzes: "Testler" };
            const icons: Record<MainTab, keyof typeof Ionicons.glyphMap> = { home: "home-outline", courses: "school-outline", articles: "book-outline", quizzes: "help-circle-outline" };
            const active = tab === t;
            return (
              <Pressable key={t} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setTab(t); setCatFilter("all"); setSearch(""); }}
                style={[s.tabBtn, active && s.tabBtnActive]}>
                <Ionicons name={icons[t]} size={16} color={active ? "#6366f1" : "rgba(255,255,255,0.75)"} />
                <Text style={[s.tabBtnText, { color: active ? "#6366f1" : "rgba(255,255,255,0.75)" }]}>{labels[t]}</Text>
              </Pressable>
            );
          })}
        </View>
      </LinearGradient>

      {/* ── Search (not on home) ── */}
      {tab !== "home" && (
        <View style={[s.searchRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={17} color={colors.mutedForeground} />
          <TextInput value={search} onChangeText={setSearch}
            placeholder={tab === "courses" ? "Kurs gözle..." : tab === "articles" ? "Makala gözle..." : "Test gözle..."}
            placeholderTextColor={colors.mutedForeground}
            style={[s.searchInput, { color: colors.foreground }]} />
          {search ? <Pressable onPress={() => setSearch("")}><Ionicons name="close-circle" size={17} color={colors.mutedForeground} /></Pressable> : null}
        </View>
      )}

      {/* ── Category filter ── */}
      {tab !== "home" && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 48 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, alignItems: "center" }}>
          {CATEGORIES.map(cat => (
            <Pressable key={cat.id}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCatFilter(cat.id); }}
              style={[s.chip, { backgroundColor: catFilter === cat.id ? cat.color : colors.card, borderColor: catFilter === cat.id ? cat.color : colors.border }]}>
              <Ionicons name={cat.icon} size={13} color={catFilter === cat.id ? "#fff" : colors.mutedForeground} />
              <Text style={[s.chipText, { color: catFilter === cat.id ? "#fff" : colors.mutedForeground }]}>{cat.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* ── Content ── */}
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

        {/* ══ HOME TAB ══ */}
        {tab === "home" && (
          <>
            {/* Continue learning */}
            {inProgress.length > 0 && (
              <>
                <Text style={[s.sectionTitle, { color: colors.foreground }]}>Dowam et</Text>
                {inProgress.map(c => {
                  const p = getCourseProgress(c);
                  return (
                    <Pressable key={c.id} onPress={() => { setActiveCourse(c); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
                      style={({ pressed }) => [s.continueCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.88 : 1 }]}>
                      <View style={[s.continueIcon, { backgroundColor: c.color + "22" }]}>
                        <Ionicons name={c.icon} size={26} color={c.color} />
                      </View>
                      <View style={{ flex: 1, gap: 6 }}>
                        <Text style={[s.continueTitle, { color: colors.foreground }]} numberOfLines={1}>{c.title}</Text>
                        <View style={[s.progressBar, { backgroundColor: colors.muted }]}>
                          <View style={[s.progressFill, { width: `${p.pct}%` as any, backgroundColor: c.color }]} />
                        </View>
                        <Text style={[s.continueSubText, { color: colors.mutedForeground }]}>{p.done}/{p.total} sapak · {p.pct}%</Text>
                      </View>
                      <Ionicons name="chevron-forward-outline" size={18} color={colors.mutedForeground} />
                    </Pressable>
                  );
                })}
              </>
            )}

            {/* Featured courses */}
            <Text style={[s.sectionTitle, { color: colors.foreground, marginTop: inProgress.length > 0 ? 20 : 0 }]}>Öňe çykan kurslar</Text>
            {COURSES.slice(0, 4).map(c => <CourseCard key={c.id} course={c} prog={getCourseProgress(c)} bookmarked={prog.bookmarks.courses.includes(c.id)} onPress={() => { setActiveCourse(c); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }} onBookmark={() => toggleBookmark("courses", c.id)} colors={colors} />)}

            {/* Quick quizzes */}
            <Text style={[s.sectionTitle, { color: colors.foreground, marginTop: 20 }]}>Tiz testler</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              {QUIZZES.slice(0, 4).map(q => (
                <Pressable key={q.id} onPress={() => startQuiz(q)}
                  style={({ pressed }) => [s.quizMini, { backgroundColor: q.color + "18", borderColor: q.color + "44", opacity: pressed ? 0.85 : 1 }]}>
                  <Ionicons name={q.icon} size={22} color={q.color} />
                  <Text style={[s.quizMiniTitle, { color: colors.foreground }]} numberOfLines={2}>{q.title}</Text>
                  <Text style={[s.quizMiniSub, { color: colors.mutedForeground }]}>{q.questions.length} sual</Text>
                  {prog.quizBest[q.id] !== undefined && (
                    <View style={[s.quizScoreBadge, { backgroundColor: prog.quizBest[q.id] >= 80 ? "#10b98122" : "#f59e0b22" }]}>
                      <Text style={[s.quizScoreText, { color: prog.quizBest[q.id] >= 80 ? "#10b981" : "#f59e0b" }]}>{prog.quizBest[q.id]}%</Text>
                    </View>
                  )}
                </Pressable>
              ))}
            </ScrollView>

            {/* Recent articles */}
            <Text style={[s.sectionTitle, { color: colors.foreground, marginTop: 20 }]}>Makala &amp; gollanmalar</Text>
            {ARTICLES.slice(0, 4).map(a => <ArticleCard key={a.id} article={a} read={prog.readArticles.includes(a.id)} bookmarked={prog.bookmarks.articles.includes(a.id)} onPress={() => { if (!a.free) { Alert.alert("Premium Makala", "Bu premium makalasy.", [{ text: "Ýap" }, { text: "Abuna al", onPress: () => router.push("/(tabs)/more" as any) }]); return; } markArticleRead(a.id); setActiveArticle(a); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }} onBookmark={() => toggleBookmark("articles", a.id)} colors={colors} />)}
          </>
        )}

        {/* ══ COURSES TAB ══ */}
        {tab === "courses" && (
          <>
            {COURSES.filter(filterCourse).length === 0 && <EmptyState label="Kurs tapylmady" colors={colors} />}
            {COURSES.filter(filterCourse).map(c => <CourseCard key={c.id} course={c} prog={getCourseProgress(c)} bookmarked={prog.bookmarks.courses.includes(c.id)} onPress={() => { setActiveCourse(c); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }} onBookmark={() => toggleBookmark("courses", c.id)} colors={colors} />)}
          </>
        )}

        {/* ══ ARTICLES TAB ══ */}
        {tab === "articles" && (
          <>
            {ARTICLES.filter(filterArt).length === 0 && <EmptyState label="Makala tapylmady" colors={colors} />}
            {ARTICLES.filter(filterArt).map(a => <ArticleCard key={a.id} article={a} read={prog.readArticles.includes(a.id)} bookmarked={prog.bookmarks.articles.includes(a.id)} onPress={() => { if (!a.free) { Alert.alert("Premium Makala", "Bu premium.", [{ text: "Ýap" }, { text: "Abuna al", onPress: () => router.push("/(tabs)/more" as any) }]); return; } markArticleRead(a.id); setActiveArticle(a); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }} onBookmark={() => toggleBookmark("articles", a.id)} colors={colors} />)}
          </>
        )}

        {/* ══ QUIZZES TAB ══ */}
        {tab === "quizzes" && (
          <>
            {QUIZZES.filter(filterQuiz).length === 0 && <EmptyState label="Test tapylmady" colors={colors} />}
            {QUIZZES.filter(filterQuiz).map(qz => (
              <Pressable key={qz.id} onPress={() => startQuiz(qz)}
                style={({ pressed }) => [s.quizCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.88 : 1 }]}>
                <View style={[s.quizCardIcon, { backgroundColor: qz.color + "20" }]}>
                  <Ionicons name={qz.icon} size={28} color={qz.color} />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text style={[s.quizCardTitle, { color: colors.foreground }]}>{qz.title}</Text>
                    {!qz.free && <View style={s.proBadge}><Text style={s.proBadgeText}>PRO</Text></View>}
                  </View>
                  <Text style={[s.quizCardDesc, { color: colors.mutedForeground }]}>{qz.desc}</Text>
                  <View style={{ flexDirection: "row", gap: 10, marginTop: 2 }}>
                    <View style={s.metaChip}>
                      <Ionicons name="help-circle-outline" size={12} color={colors.mutedForeground} />
                      <Text style={[s.metaChipText, { color: colors.mutedForeground }]}>{qz.questions.length} sual</Text>
                    </View>
                    {prog.quizBest[qz.id] !== undefined && (
                      <View style={[s.metaChip, { backgroundColor: prog.quizBest[qz.id] >= 80 ? "#10b98120" : "#f59e0b20" }]}>
                        <Ionicons name="trophy-outline" size={12} color={prog.quizBest[qz.id] >= 80 ? "#10b981" : "#f59e0b"} />
                        <Text style={{ fontSize: 11, fontWeight: "700", color: prog.quizBest[qz.id] >= 80 ? "#10b981" : "#f59e0b" }}>Iň gowy: {prog.quizBest[qz.id]}%</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Ionicons name="chevron-forward-outline" size={18} color={colors.mutedForeground} />
              </Pressable>
            ))}
          </>
        )}
      </ScrollView>

      {/* ══ COURSE DETAIL MODAL ══ */}
      <Modal visible={!!activeCourse && !activeLesson} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setActiveCourse(null)}>
        {activeCourse && (() => {
          const p = getCourseProgress(activeCourse);
          return (
            <View style={[s.modalWrap, { backgroundColor: colors.background }]}>
              <LinearGradient colors={[activeCourse.color, activeCourse.color + "88"]} style={s.courseModalHero}>
                <Pressable onPress={() => setActiveCourse(null)} style={s.modalCloseBtn}>
                  <Ionicons name="close" size={20} color="#fff" />
                </Pressable>
                <Pressable onPress={() => toggleBookmark("courses", activeCourse.id)} style={[s.modalCloseBtn, { marginLeft: "auto" }]}>
                  <Ionicons name={prog.bookmarks.courses.includes(activeCourse.id) ? "bookmark" : "bookmark-outline"} size={20} color="#fff" />
                </Pressable>
              </LinearGradient>
              <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <View style={[s.courseHeroIcon, { backgroundColor: activeCourse.color + "22" }]}>
                    <Ionicons name={activeCourse.icon} size={36} color={activeCourse.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.courseModalTitle, { color: colors.foreground }]}>{activeCourse.title}</Text>
                    <Text style={[s.courseModalInst, { color: colors.mutedForeground }]}>{activeCourse.instructor}</Text>
                    <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
                      <View style={s.metaChip}><Ionicons name="star" size={12} color="#f59e0b" /><Text style={[s.metaChipText, { color: "#f59e0b" }]}>{activeCourse.rating}</Text></View>
                      <View style={s.metaChip}><Ionicons name="people-outline" size={12} color={colors.mutedForeground} /><Text style={[s.metaChipText, { color: colors.mutedForeground }]}>{activeCourse.students.toLocaleString()}</Text></View>
                      <View style={s.metaChip}><Ionicons name="time-outline" size={12} color={colors.mutedForeground} /><Text style={[s.metaChipText, { color: colors.mutedForeground }]}>{activeCourse.duration}</Text></View>
                      {!activeCourse.free && <View style={s.proBadge}><Text style={s.proBadgeText}>PRO</Text></View>}
                    </View>
                  </View>
                </View>
                <Text style={[s.bodyText, { color: colors.mutedForeground, marginBottom: 16 }]}>{activeCourse.desc}</Text>

                {/* Progress */}
                {p.done > 0 && (
                  <View style={[s.progRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[s.progLabel, { color: colors.foreground }]}>{p.pct === 100 ? "✅ Tamamlandy!" : `Ösüş: ${p.done}/${p.total} sapak`}</Text>
                    <View style={[s.progressBar, { backgroundColor: colors.muted, marginTop: 8 }]}>
                      <View style={[s.progressFill, { width: `${p.pct}%` as any, backgroundColor: activeCourse.color }]} />
                    </View>
                  </View>
                )}

                {/* Lessons */}
                <Text style={[s.sectionTitle, { color: colors.foreground, marginTop: 16, marginBottom: 8 }]}>Sapaklary ({activeCourse.lessons.length})</Text>
                {activeCourse.lessons.map((lesson, idx) => {
                  const done = !!prog.lessonsDone[`${activeCourse.id}_${lesson.id}`];
                  const locked = !activeCourse.free && idx > 0;
                  return (
                    <Pressable key={lesson.id}
                      onPress={() => {
                        if (locked) { Alert.alert("Premium kurs", "Bu sapak premium.", [{ text: "Ýap" }, { text: "Abuna al", onPress: () => router.push("/(tabs)/more" as any) }]); return; }
                        setActiveLesson(lesson);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      style={({ pressed }) => [s.lessonRow, { backgroundColor: colors.card, borderColor: done ? activeCourse.color + "66" : colors.border, opacity: pressed ? 0.85 : 1 }]}>
                      <View style={[s.lessonNum, { backgroundColor: done ? activeCourse.color : colors.muted }]}>
                        {done ? <Ionicons name="checkmark" size={14} color="#fff" /> : <Text style={[s.lessonNumText, { color: done ? "#fff" : colors.mutedForeground }]}>{idx + 1}</Text>}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.lessonTitle, { color: locked ? colors.mutedForeground : colors.foreground }]}>{lesson.title}</Text>
                        <Text style={[s.lessonDur, { color: colors.mutedForeground }]}>{lesson.duration}</Text>
                      </View>
                      <Ionicons name={locked ? "lock-closed-outline" : done ? "checkmark-circle" : "chevron-forward-outline"} size={18} color={done ? activeCourse.color : locked ? colors.mutedForeground : colors.mutedForeground} />
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          );
        })()}
      </Modal>

      {/* ══ LESSON READER MODAL ══ */}
      <Modal visible={!!activeLesson} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setActiveLesson(null)}>
        {activeLesson && activeCourse && (
          <View style={[s.modalWrap, { backgroundColor: colors.background }]}>
            <View style={[s.readerHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
              <Pressable onPress={() => setActiveLesson(null)} style={s.readerBackBtn}>
                <Ionicons name="arrow-back-outline" size={20} color={colors.foreground} />
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={[s.readerTitle, { color: colors.foreground }]} numberOfLines={1}>{activeLesson.title}</Text>
                <Text style={[s.readerSub, { color: colors.mutedForeground }]}>{activeCourse.title}</Text>
              </View>
              <View style={[s.durChip, { backgroundColor: activeCourse.color + "20" }]}>
                <Ionicons name="time-outline" size={12} color={activeCourse.color} />
                <Text style={{ color: activeCourse.color, fontWeight: "700", fontSize: 11 }}>{activeLesson.duration}</Text>
              </View>
            </View>
            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
              <MarkdownContent content={activeLesson.content} colors={colors} />
            </ScrollView>
            {!prog.lessonsDone[`${activeCourse.id}_${activeLesson.id}`] && (
              <View style={[s.readerFooter, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
                <Pressable
                  onPress={() => {
                    const durMins = parseInt(activeLesson.duration) || 10;
                    markLessonDone(activeCourse.id, activeLesson.id, durMins);
                    Alert.alert("✅ Tamamlandy!", "Sapak belgilendi!", [{ text: "Ýap" }]);
                  }}
                  style={({ pressed }) => [s.doneBtn, { backgroundColor: activeCourse.color, opacity: pressed ? 0.85 : 1 }]}>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                  <Text style={s.doneBtnText}>Sapak tamamlandy</Text>
                </Pressable>
              </View>
            )}
            {prog.lessonsDone[`${activeCourse.id}_${activeLesson.id}`] && (
              <View style={[s.readerFooter, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
                <View style={[s.doneChip, { backgroundColor: "#10b98120" }]}>
                  <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                  <Text style={{ color: "#10b981", fontWeight: "700" }}>Sapak tamamlandy!</Text>
                </View>
              </View>
            )}
          </View>
        )}
      </Modal>

      {/* ══ ARTICLE READER MODAL ══ */}
      <Modal visible={!!activeArticle} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setActiveArticle(null)}>
        {activeArticle && (
          <View style={[s.modalWrap, { backgroundColor: colors.background }]}>
            <View style={[s.readerHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
              <Pressable onPress={() => setActiveArticle(null)} style={s.readerBackBtn}>
                <Ionicons name="arrow-back-outline" size={20} color={colors.foreground} />
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={[s.readerTitle, { color: colors.foreground }]} numberOfLines={1}>{activeArticle.title}</Text>
                <Text style={[s.readerSub, { color: colors.mutedForeground }]}>{activeArticle.author} · {activeArticle.readTime} min okamak</Text>
              </View>
              <Pressable onPress={() => toggleBookmark("articles", activeArticle.id)}>
                <Ionicons name={prog.bookmarks.articles.includes(activeArticle.id) ? "bookmark" : "bookmark-outline"} size={22} color={activeArticle.color} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
              <View style={[s.articleHeroBanner, { backgroundColor: activeArticle.color + "18" }]}>
                <Ionicons name={activeArticle.icon} size={44} color={activeArticle.color} />
                <Text style={[s.articleHeroTitle, { color: activeArticle.color }]}>{activeArticle.title}</Text>
                {prog.readArticles.includes(activeArticle.id) && (
                  <View style={s.readBadge}><Ionicons name="checkmark-circle" size={14} color="#10b981" /><Text style={{ color: "#10b981", fontSize: 12, fontWeight: "600" }}>Okaldy</Text></View>
                )}
              </View>
              <MarkdownContent content={activeArticle.content} colors={colors} />
            </ScrollView>
          </View>
        )}
      </Modal>

      {/* ══ QUIZ MODAL ══ */}
      <Modal visible={!!activeQuiz} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => { setActiveQuiz(null); }}>
        {activeQuiz && (
          <View style={[s.modalWrap, { backgroundColor: colors.background }]}>
            <View style={[s.readerHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
              <Pressable onPress={() => setActiveQuiz(null)} style={s.readerBackBtn}>
                <Ionicons name="close" size={20} color={colors.foreground} />
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={[s.readerTitle, { color: colors.foreground }]} numberOfLines={1}>{activeQuiz.title}</Text>
                {!quizDone && <Text style={[s.readerSub, { color: colors.mutedForeground }]}>Sorag {quizStep + 1} / {activeQuiz.questions.length}</Text>}
              </View>
            </View>

            {!quizDone ? (
              <View style={{ flex: 1, padding: 24 }}>
                {/* Progress bar */}
                <View style={[s.progressBar, { backgroundColor: colors.muted, marginBottom: 24 }]}>
                  <View style={[s.progressFill, { width: `${((quizStep) / activeQuiz.questions.length) * 100}%` as any, backgroundColor: activeQuiz.color }]} />
                </View>
                <Text style={[s.quizQuestion, { color: colors.foreground }]}>{activeQuiz.questions[quizStep].q}</Text>
                <View style={{ gap: 12, marginTop: 24 }}>
                  {activeQuiz.questions[quizStep].opts.map((opt, i) => {
                    const chosen = quizAnswers[quizStep] === i;
                    return (
                      <Pressable key={i} onPress={() => answerQuiz(i)}
                        style={({ pressed }) => [s.quizOpt, { backgroundColor: chosen ? activeQuiz.color : colors.card, borderColor: chosen ? activeQuiz.color : colors.border, opacity: pressed ? 0.85 : 1 }]}>
                        <View style={[s.quizOptCircle, { borderColor: chosen ? "#fff" : colors.border, backgroundColor: chosen ? "rgba(255,255,255,0.3)" : "transparent" }]}>
                          <Text style={{ color: chosen ? "#fff" : colors.mutedForeground, fontWeight: "700", fontSize: 13 }}>{String.fromCharCode(65 + i)}</Text>
                        </View>
                        <Text style={[s.quizOptText, { color: chosen ? "#fff" : colors.foreground }]}>{opt}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : (
              <ScrollView contentContainerStyle={{ padding: 24, alignItems: "center" }}>
                <View style={[s.quizResultCircle, { borderColor: quizScore >= 80 ? "#10b981" : quizScore >= 50 ? "#f59e0b" : "#ef4444" }]}>
                  <Text style={[s.quizResultPct, { color: quizScore >= 80 ? "#10b981" : quizScore >= 50 ? "#f59e0b" : "#ef4444" }]}>{quizScore}%</Text>
                  <Text style={[s.quizResultLabel, { color: colors.mutedForeground }]}>Netije</Text>
                </View>
                <Text style={[s.quizResultMsg, { color: colors.foreground }]}>
                  {quizScore === 100 ? "🏆 Ajaýyp! 100%!" : quizScore >= 80 ? "🎉 Gowy netije!" : quizScore >= 50 ? "📚 Kän öwrenmeli!" : "💪 Täzeden synanyş!"}
                </Text>
                <Text style={[s.quizResultSub, { color: colors.mutedForeground }]}>
                  {quizAnswers.filter((a, i) => a === activeQuiz.questions[i].correct).length} / {activeQuiz.questions.length} dogry jogap
                </Text>

                {/* Review answers */}
                <View style={{ width: "100%", marginTop: 24, gap: 10 }}>
                  {activeQuiz.questions.map((q, i) => {
                    const userAns = quizAnswers[i];
                    const correct = userAns === q.correct;
                    return (
                      <View key={i} style={[s.reviewRow, { backgroundColor: correct ? "#10b98110" : "#ef444410", borderColor: correct ? "#10b98130" : "#ef444430" }]}>
                        <Ionicons name={correct ? "checkmark-circle" : "close-circle"} size={18} color={correct ? "#10b981" : "#ef4444"} />
                        <View style={{ flex: 1 }}>
                          <Text style={[s.reviewQ, { color: colors.foreground }]}>{q.q}</Text>
                          {!correct && userAns !== null && <Text style={{ color: "#ef4444", fontSize: 12, marginTop: 2 }}>Siziň: {q.opts[userAns]}</Text>}
                          <Text style={{ color: "#10b981", fontSize: 12, marginTop: 1 }}>Dogry: {q.opts[q.correct]}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>

                <View style={{ flexDirection: "row", gap: 12, marginTop: 24, width: "100%" }}>
                  <Pressable onPress={() => { setQuizStep(0); setQuizAnswers(new Array(activeQuiz.questions.length).fill(null)); setQuizDone(false); }}
                    style={({ pressed }) => [s.retryBtn, { backgroundColor: colors.muted, opacity: pressed ? 0.85 : 1 }]}>
                    <Ionicons name="refresh-outline" size={18} color={colors.foreground} />
                    <Text style={[s.retryBtnText, { color: colors.foreground }]}>Gaýtala</Text>
                  </Pressable>
                  <Pressable onPress={() => setActiveQuiz(null)}
                    style={({ pressed }) => [s.retryBtn, { flex: 1, backgroundColor: activeQuiz.color, opacity: pressed ? 0.85 : 1 }]}>
                    <Ionicons name="checkmark-outline" size={18} color="#fff" />
                    <Text style={[s.retryBtnText, { color: "#fff" }]}>Ýap</Text>
                  </Pressable>
                </View>
              </ScrollView>
            )}
          </View>
        )}
      </Modal>
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function CourseCard({ course, prog, bookmarked, onPress, onBookmark, colors }: {
  course: Course; prog: { done: number; total: number; pct: number };
  bookmarked: boolean; onPress: () => void; onBookmark: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.courseCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.88 : 1 }]}>
      <View style={s.courseCardLeft}>
        <View style={[s.courseCardIcon, { backgroundColor: course.color + "20" }]}>
          <Ionicons name={course.icon} size={28} color={course.color} />
          {!course.free && <View style={s.proBadgeAbs}><Text style={s.proBadgeText}>PRO</Text></View>}
        </View>
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={[s.courseCardTitle, { color: colors.foreground }]} numberOfLines={2}>{course.title}</Text>
        <Text style={[s.courseCardInst, { color: colors.mutedForeground }]}>{course.instructor}</Text>
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          <View style={s.metaChip}><Ionicons name="star" size={11} color="#f59e0b" /><Text style={[s.metaChipText, { color: "#f59e0b" }]}>{course.rating}</Text></View>
          <View style={s.metaChip}><Ionicons name="book-outline" size={11} color={colors.mutedForeground} /><Text style={[s.metaChipText, { color: colors.mutedForeground }]}>{course.lessons.length} sapak</Text></View>
          <View style={s.metaChip}><Ionicons name="time-outline" size={11} color={colors.mutedForeground} /><Text style={[s.metaChipText, { color: colors.mutedForeground }]}>{course.duration}</Text></View>
        </View>
        {prog.done > 0 && (
          <View style={{ marginTop: 4, gap: 4 }}>
            <View style={[s.progressBar, { backgroundColor: colors.muted }]}>
              <View style={[s.progressFill, { width: `${prog.pct}%` as any, backgroundColor: course.color }]} />
            </View>
            <Text style={[s.metaChipText, { color: colors.mutedForeground }]}>{prog.pct}% tamamlandy</Text>
          </View>
        )}
      </View>
      <Pressable onPress={onBookmark} style={{ padding: 4 }}>
        <Ionicons name={bookmarked ? "bookmark" : "bookmark-outline"} size={20} color={bookmarked ? course.color : colors.mutedForeground} />
      </Pressable>
    </Pressable>
  );
}

function ArticleCard({ article, read, bookmarked, onPress, onBookmark, colors }: {
  article: Article; read: boolean; bookmarked: boolean;
  onPress: () => void; onBookmark: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.articleCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.88 : 1 }]}>
      <View style={[s.articleIcon, { backgroundColor: article.color + "20" }]}>
        <Ionicons name={article.icon} size={24} color={article.color} />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={[s.articleTitle, { color: colors.foreground }]} numberOfLines={2}>{article.title}</Text>
        <Text style={[s.articleAuthor, { color: colors.mutedForeground }]}>{article.author}</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <View style={s.metaChip}><Ionicons name="time-outline" size={11} color={colors.mutedForeground} /><Text style={[s.metaChipText, { color: colors.mutedForeground }]}>{article.readTime} min</Text></View>
          {read && <View style={[s.metaChip, { backgroundColor: "#10b98120" }]}><Ionicons name="checkmark-circle" size={11} color="#10b981" /><Text style={[s.metaChipText, { color: "#10b981" }]}>Okaldy</Text></View>}
          {!article.free && <View style={s.proBadge}><Text style={s.proBadgeText}>PRO</Text></View>}
        </View>
      </View>
      <Pressable onPress={onBookmark} style={{ padding: 4 }}>
        <Ionicons name={bookmarked ? "bookmark" : "bookmark-outline"} size={20} color={bookmarked ? article.color : colors.mutedForeground} />
      </Pressable>
    </Pressable>
  );
}

function MarkdownContent({ content, colors }: { content: string; colors: ReturnType<typeof useColors> }) {
  return (
    <>
      {content.split("\n").map((line, i) => {
        if (line.startsWith("# ")) return <Text key={i} style={[s.h1, { color: colors.foreground }]}>{line.slice(2)}</Text>;
        if (line.startsWith("## ")) return <Text key={i} style={[s.h2, { color: colors.foreground }]}>{line.slice(3)}</Text>;
        if (line.startsWith("### ")) return <Text key={i} style={[s.h3, { color: colors.foreground }]}>{line.slice(4)}</Text>;
        if (line.match(/^\*\*.*\*\*$/)) return <Text key={i} style={[s.bold, { color: colors.foreground }]}>{line.slice(2, -2)}</Text>;
        if (line.startsWith("- ")) return (
          <View key={i} style={s.listItem}>
            <Text style={[s.bullet, { color: colors.primary }]}>•</Text>
            <Text style={[s.listText, { color: colors.mutedForeground }]}>{line.slice(2)}</Text>
          </View>
        );
        if (line.match(/^\d+\./)) return (
          <View key={i} style={s.listItem}>
            <Text style={[s.bullet, { color: colors.primary }]}>{line.match(/^\d+/)![0]}.</Text>
            <Text style={[s.listText, { color: colors.mutedForeground }]}>{line.replace(/^\d+\.\s*/, "")}</Text>
          </View>
        );
        if (line.trim() === "") return <View key={i} style={{ height: 8 }} />;
        return <Text key={i} style={[s.bodyText, { color: colors.mutedForeground }]}>{line}</Text>;
      })}
    </>
  );
}

function EmptyState({ label, colors }: { label: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={{ alignItems: "center", padding: 48, gap: 12 }}>
      <Ionicons name="search-outline" size={48} color={colors.mutedForeground} />
      <Text style={{ fontSize: 15, fontWeight: "600", color: colors.mutedForeground }}>{label}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 0 },
  headerTop: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  headerSub: { color: "rgba(255,255,255,0.75)", fontSize: 12 },
  streakBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  streakText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  statsRow: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(0,0,0,0.15)", borderRadius: 14, padding: 12, marginBottom: 14 },
  statItem: { flex: 1, alignItems: "center" },
  statNum: { color: "#fff", fontSize: 18, fontWeight: "800" },
  statLabel: { color: "rgba(255,255,255,0.7)", fontSize: 9, fontWeight: "600", textAlign: "center" },
  statDiv: { width: 1, height: 30, backgroundColor: "rgba(255,255,255,0.2)" },
  tabBar: { flexDirection: "row", backgroundColor: "rgba(0,0,0,0.18)", borderRadius: 14, padding: 4, marginBottom: 14 },
  tabBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 8, borderRadius: 10 },
  tabBtnActive: { backgroundColor: "#fff" },
  tabBtnText: { fontSize: 12, fontWeight: "700" },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 16, marginTop: 10, marginBottom: 4, padding: 12, borderRadius: 14, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 14 },
  chip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 12, fontWeight: "600" },
  sectionTitle: { fontSize: 16, fontWeight: "800", marginBottom: 10 },
  // Course card
  courseCard: { flexDirection: "row", gap: 12, padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 10 },
  courseCardLeft: { position: "relative" },
  courseCardIcon: { width: 56, height: 56, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  courseCardTitle: { fontSize: 14, fontWeight: "700", lineHeight: 19 },
  courseCardInst: { fontSize: 12 },
  // Article card
  articleCard: { flexDirection: "row", gap: 12, padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 10 },
  articleIcon: { width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  articleTitle: { fontSize: 14, fontWeight: "700", lineHeight: 18 },
  articleAuthor: { fontSize: 12 },
  // Quiz card
  quizCard: { flexDirection: "row", gap: 12, padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 10, alignItems: "center" },
  quizCardIcon: { width: 52, height: 52, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  quizCardTitle: { fontSize: 14, fontWeight: "700" },
  quizCardDesc: { fontSize: 12 },
  // Quiz mini (horizontal scroll)
  quizMini: { width: 130, padding: 14, borderRadius: 16, borderWidth: 1, gap: 8 },
  quizMiniTitle: { fontSize: 13, fontWeight: "700", lineHeight: 17 },
  quizMiniSub: { fontSize: 11 },
  quizScoreBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: "flex-start" },
  quizScoreText: { fontSize: 11, fontWeight: "800" },
  // Continue card
  continueCard: { flexDirection: "row", gap: 12, padding: 14, borderRadius: 16, borderWidth: 1, alignItems: "center", marginBottom: 10 },
  continueIcon: { width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  continueTitle: { fontSize: 14, fontWeight: "700" },
  continueSubText: { fontSize: 11 },
  // Progress
  progressBar: { height: 6, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: 6, borderRadius: 4 },
  progRow: { padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 4 },
  progLabel: { fontWeight: "700", fontSize: 14 },
  // Meta chip
  metaChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(0,0,0,0.05)", paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  metaChipText: { fontSize: 11, fontWeight: "600" },
  // PRO badge
  proBadge: { backgroundColor: "#f59e0b", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  proBadgeText: { color: "#fff", fontSize: 9, fontWeight: "800" },
  proBadgeAbs: { position: "absolute", top: -2, right: -2, backgroundColor: "#f59e0b", paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6 },
  // Modal
  modalWrap: { flex: 1 },
  courseModalHero: { height: 90, flexDirection: "row", alignItems: "center", paddingHorizontal: 16 },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.25)", alignItems: "center", justifyContent: "center" },
  courseHeroIcon: { width: 64, height: 64, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  courseModalTitle: { fontSize: 17, fontWeight: "800", lineHeight: 22 },
  courseModalInst: { fontSize: 13 },
  // Lesson row
  lessonRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 8 },
  lessonNum: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  lessonNumText: { fontSize: 13, fontWeight: "700" },
  lessonTitle: { fontSize: 14, fontWeight: "600" },
  lessonDur: { fontSize: 12, marginTop: 2 },
  // Reader
  readerHeader: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderBottomWidth: 1 },
  readerBackBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  readerTitle: { fontSize: 15, fontWeight: "700" },
  readerSub: { fontSize: 12, marginTop: 1 },
  durChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10 },
  readerFooter: { padding: 16, borderTopWidth: 1 },
  doneBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 14 },
  doneBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  doneChip: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 14 },
  // Article hero
  articleHeroBanner: { borderRadius: 18, padding: 28, alignItems: "center", gap: 10, marginBottom: 24 },
  articleHeroTitle: { fontSize: 17, fontWeight: "800", textAlign: "center" },
  readBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#10b98120", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  // Quiz
  quizQuestion: { fontSize: 18, fontWeight: "700", lineHeight: 26, textAlign: "center" },
  quizOpt: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 14, borderWidth: 1.5 },
  quizOptCircle: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  quizOptText: { flex: 1, fontSize: 15, fontWeight: "600" },
  quizResultCircle: { width: 130, height: 130, borderRadius: 65, borderWidth: 6, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  quizResultPct: { fontSize: 32, fontWeight: "900" },
  quizResultLabel: { fontSize: 12 },
  quizResultMsg: { fontSize: 20, fontWeight: "800", textAlign: "center", marginBottom: 6 },
  quizResultSub: { fontSize: 14, textAlign: "center", marginBottom: 4 },
  reviewRow: { flexDirection: "row", gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, alignItems: "flex-start" },
  reviewQ: { fontSize: 13, fontWeight: "600", lineHeight: 18 },
  retryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 14 },
  retryBtnText: { fontWeight: "700", fontSize: 14 },
  // Markdown
  h1: { fontSize: 22, fontWeight: "800", marginBottom: 12, marginTop: 8 },
  h2: { fontSize: 17, fontWeight: "700", marginBottom: 8, marginTop: 16 },
  h3: { fontSize: 15, fontWeight: "700", marginBottom: 6, marginTop: 12 },
  bold: { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  listItem: { flexDirection: "row", gap: 8, marginBottom: 4 },
  bullet: { fontSize: 16, lineHeight: 22, minWidth: 16 },
  listText: { flex: 1, fontSize: 14, lineHeight: 22 },
  bodyText: { fontSize: 14, lineHeight: 22, marginBottom: 2 },
});
