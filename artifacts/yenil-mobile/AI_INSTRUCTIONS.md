# 🤖 AI_INSTRUCTIONS.md — Ýeňil Mobile Loyiha Qo'llanmasi

> **Bu fayl har bir AI Agent yoki dasturchi uchun majburiy o'qish materialidir.**
> Bu faylni o'qimay turib hech qanday kod yozma, hech qanday o'zgartirish qilma.
> Loyiha haqidagi barcha haqiqat shu yerda.

---

## 1. LOYIHA NIMA?

**Ýeňil** — Türkmeniston uchun yopiq iqtisodiy ekosistemali mobil ilova (Super App).

- **Platform:** React Native + Expo, Expo Router (fayl asosli routing). Amaldagi versiyani `package.json` dan tekshir.
- **Til:** TypeScript (`strict` rejim, `"@/*"` alias bilan)
- **Backend:** Firebase Realtime Database. Hozir `deviceId` asosida; kelajakda `Telefon + SMS OTP` autentifikatsiyasiga o'tiladi (`users/{uid}/profile` tuzilmasi rejalashtirilgan).
- **State:** React Context (`BonusPulContext`) + TanStack React Query (kesh uchun)
- **Paket menejeri:** `pnpm`
- **Font:** `@expo-google-fonts/inter` (Inter_400Regular, 500Medium, 600SemiBold, 700Bold)
- **Xavfsizlik eslatmasi:** `deviceId` asosida ishlaydi. Kripto va real pul xavfsizligi uchun kelajakda PIN-kod yoki SMS OTP qo'shiladi. Foydalanuvchi telefonini yo'qotsa balans xavfi bor — recovery tizimi rejalashtirilgan.

---

## 2. PAPKA TUZILMASI (ARXITEKTURA)

```
yenil-mobile/
├── app/                     ← Expo Router ekranlari (fayl = marshrut)
│   ├── _layout.tsx          ← Root layout (barcha Provider'lar bu yerda)
│   ├── (tabs)/              ← Tab navigatsiyasi (asosiy ekranlar)
│   │   └── (demiryol)/      ← Temir yo'l nested navigator
│   ├── auth/                ← Autentifikatsiya ekranlari (register.tsx va h.k.)
│   └── [yangi-xizmat].tsx   ← Har bir yangi xizmat alohida .tsx fayl sifatida qo'shiladi
│
├── components/              ← Qayta ishlatiladigan UI komponentlar
│   ├── BPCheckoutModal.tsx  ← ASOSIY: Barcha xizmatlar uchun to'lov modali
│   └── PessimisticButton.tsx← ASOSIY: Bloklangan (pessimistic lock) tugma
│
├── contexts/
│   └── BonusPulContext.tsx  ← ASOSIY: Barcha iqtisodiy holat shu yerda
│
├── lib/                     ← Biznes logika, API va yordamchi funksiyalar
│   ├── firebase.ts          ← Firebase CRUD funksiyalari
│   ├── payments.ts          ← Komissiya konstantalari va hisob-kitob funksiyalari
│   ├── reputation.ts        ← Obro' darajalari va yordamchi funksiyalar
│   └── ebilimData.ts        ← E-bilim kategoriyalari va dars ma'lumotlari
│
├── constants/
│   └── colors.ts            ← 4 mavzu: green, dark, white, girls
│
├── hooks/
│   └── useColors.ts         ← ThemeContext dan ranglarni olish uchun hook
│
└── config/
    ├── paymentFeatures.ts   ← To'lov xizmatlari konfiguratsiyasi
    └── transportFeatures.ts ← Transport xizmatlari konfiguratsiyasi
```

**Kengaytish qoidasi:** Yangi xizmat qo'shganda faqat `app/` ichiga `.tsx` fayl yaratish va `app/_layout.tsx` da `Stack.Screen` yozish kifoya. Papka tuzilmasini bu faylda yangilash **majburiy emas**.

---

## 3. IMPORT QOIDASI

**Har doim `@/` aliasini ishlatish shart.** Nisbiy yo'llar (`../../`) ISHLATILMAYDI.

```typescript
// ✅ TO'G'RI
import { useBonusPul } from "@/contexts/BonusPulContext";
import { useColors }   from "@/hooks/useColors";
import { saveOrder }   from "@/lib/firebase";
import { COMMISSION_RATES, calcMissingBP } from "@/lib/payments";
import { SeamlessCheckout } from "@/components/SeamlessCheckout";

// ❌ NOTO'G'RI — hech qachon bunday yozma
import { useBonusPul } from "../../contexts/BonusPulContext";
```

---

## 4. MAVZU (THEME) TIZIMI

### 4 ta mavzu:
| Kalit   | Tavsif                  | `primary`  | `background` | `isDark` |
|---------|-------------------------|------------|--------------|----------|
| `green` | Asosiy (zumrad yashil)  | `#1B6B3A`  | `#f0fdf4`    | `false`  |
| `dark`  | Qorong'i rejim          | `#22c55e`  | `#0d0d0d`    | `true`   |
| `white` | Toza oq (iOS uslubi)    | `#3b82f6`  | `#ffffff`    | `false`  |
| `girls` | Pushti/binafsha         | `#ec4899`  | `#fff0f8`    | `false`  |

### `ColorPalette` interfeysi (barcha kalit so'zlar):
```typescript
colors.background        // Ekran foni
colors.foreground        // Asosiy matn
colors.card              // Karta foni
colors.cardForeground    // Karta matni
colors.primary           // Birlamchi rang (tugmalar, aktsent)
colors.primaryForeground // Birlamchi tugma ustidagi matn (doim oq)
colors.secondary         // Ikkilamchi rang
colors.secondaryForeground
colors.muted             // O'chirilgan/bo'sh joy rangi
colors.mutedForeground   // Qo'shimcha/ikkilamchi matn
colors.accent            // Aktsent rang
colors.accentForeground
colors.destructive       // Xato/o'chirish rangi (#ef4444)
colors.border            // Chegara chiziqlari
colors.input             // Input maydon foni
colors.success           // Muvaffaqiyat (#22c55e)
colors.warning           // Ogohlantirish (#d97706 / #f59e0b)
colors.tabBarBg          // Tab bar foni
colors.headerGradientStart  // Header gradient boshi
colors.headerGradientEnd    // Header gradient oxiri
colors.isDark            // boolean: qorong'i rejimmi?
colors.radius            // 16 — standart border-radius
```

### Mavzuni ishlatish:
```typescript
import { useColors } from "@/hooks/useColors";

function MyComponent() {
  const colors = useColors();
  return (
    <View style={{ backgroundColor: colors.background }}>
      <Text style={{ color: colors.foreground }}>Salam</Text>
    </View>
  );
}
```

### Gradient sarlavhalar (barcha ekranlar shu usulda):
```typescript
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const insets = useSafeAreaInsets();
const isWeb = Platform.OS === "web";

<LinearGradient
  colors={[colors.headerGradientStart, colors.headerGradientEnd]}
  style={[s.header, { paddingTop: (isWeb ? 0 : insets.top) + 14 }]}
>
  {/* ... */}
</LinearGradient>
```

---

## 5. IQTISODIY TIZIM (BP EKONOMIKASI)

### Asosiy qoidalar:

> **1 BP = 1 TMT nominal qiymatda**
> Barcha ilovadagi xizmatlar **FAQAT BP** orqali to'lanadi.
> Bank kartasiga to'g'ridan-to'g'ri BP chiqarish **ABADIY BLOKLANGAN**.

### `BonusPulContext` — yagona iqtisodiy holat:

```typescript
import { useBonusPul } from "@/contexts/BonusPulContext";

const {
  balance,           // number — BP balansi (balanceBP bilan bir xil)
  balanceBP,         // number — BP balansi (asosiy)
  reputationPoints,  // number — Obro' bali (0–100)
  deviceId,          // string — SecureStore'dan olingan qurilma ID
  paymentLocked,     // boolean — Pessimistic lock (UI tugmalarini bloklash uchun)

  payWithBP,         // (amount, serviceId, description) => Promise<PayResult>
  earnBP,            // (amount, reason, meta?) => Promise<boolean>
  sendBP,            // (toId, amount, note?) => Promise<{success, message}>
  addReputation,     // (delta, reason) => Promise<void>
  withdrawToTMCell,  // (amount, phone) => Promise<WithdrawResult>
  checkInsufficientAmount, // (price) => number (0 = yetarli)
  refreshBalance,    // () => void
} = useBonusPul();
```

### Komissiya stavkalari:

> ⚠️ Barcha foiz va limitlarni **hech qachon bu yerdan yoki kod ichida qo'lda yozma.**
> Qiymatlar faqat `@/lib/payments.ts` faylida saqlanadi — o'sha faylni import qil.

```typescript
import {
  COMMISSION_RATES,       // barcha foizlar (bank, tmcell, kripto)
  calcTopUpTotal,         // yetishmagan BP + komissiya = to'lanadigan TMT
  calcCommissionAmount,   // faqat komissiya miqdori
  calcMissingBP,          // yetishmayotgan BP
  calcTMCellCashoutNet,   // TMCell chiqarishdan keyingi sof summa
  calcCryptoDepositBP,    // kripto kiritgandan olinadigan BP
  calcCryptoWithdrawUSDT, // BP chiqarishda olinadigan USDT
  getCryptoDepositRatePct,  // foiz matni ko'rsatish uchun ("2.0%")
  getCryptoWithdrawRatePct, // foiz matni ko'rsatish uchun ("5.0%")
  BANK_CARD_CASHOUT_BLOCKED,     // doim true — bank kartaga chiqarish bloklangan
  P2P_INTERNAL_FEE,              // doim 0 — ichki P2P bepul
} from "@/lib/payments";
```

### Referral daromad & Learn & Earn (E-Bilim quiz mukofotlari):
```
Foydalanuvchi testni tugatganda @/contexts/BonusPulContext ichidagi earnBP() funksiyasini tegishli xizmat ID si bilan chaqir, qiymatni context'ning o'zi hal qiladi
```

---

## 6. TO'LOV OQIMI — SEAMLESS CHECKOUT

**Bu loyihadagi eng muhim qoida:** Har qanday xizmatni sotib olishda `SeamlessCheckout` komponenti ishlatilishi SHART.

### Ishlatish tartibi:

```typescript
import { SeamlessCheckout } from "@/components/SeamlessCheckout";
import { useBonusPul } from "@/contexts/BonusPulContext";

function MyServiceScreen() {
  const { balance, checkInsufficientAmount } = useBonusPul();
  const [checkoutVisible, setCheckoutVisible] = useState(false);

  return (
    <>
      <Pressable onPress={() => setCheckoutVisible(true)}>
        <Text>Xizmatni sotib ol — 50 BP</Text>
      </Pressable>

      <SeamlessCheckout
        visible={checkoutVisible}
        serviceName="Mening Xizmatim"
        serviceIcon="car-outline"      // Ionicons nomi
        serviceColor="#6366f1"          // Aktsent rang
        amount={50}                     // BP miqdori
        serviceId="my_service_id"
        description="Xizmat tavsifi"
        onSuccess={() => {
          setCheckoutVisible(false);
          // Muvaffaqiyatdan keyin logika
        }}
        onCancel={() => setCheckoutVisible(false)}
      />
    </>
  );
}
```

### To'lov oqimi:
1. **Balans yetarli →** Chek ko'rsatiladi → "To'lash" tugmasi → Pessimistic lock
2. **Balans yetarli emas →** Faqat yetishmayotgan miqdor ko'rsatiladi → Bank karta yoki TMCell variant (foizlar `COMMISSION_RATES` dan dinamik o'qiladi)

### Pessimistic Lock qoidasi:
```typescript
// ✅ DOIM shu qoidaga rioya qil:
<Pressable
  onPress={handlePay}
  disabled={paymentLocked}  // paymentLocked = true bo'lsa BLOKLANGAN
  style={{ opacity: paymentLocked ? 0.6 : 1 }}
>
  {paymentLocked
    ? <ActivityIndicator color="#fff" />
    : <Text>To'lash</Text>
  }
</Pressable>
// ⚠️ paymentLocked = true bo'lganda tugma DISABLED bo'lishi shart.
// Ikki marta to'lov MUTLAQO yo'l qo'yilmaydi.
```

---

## 7. OBRO' (YNAM/ABRAÝ) KONSTITUTSIYASI

> **ABADIY QOIDA:** `reputationPoints` hech qanday usulda sotib olinmaydi.
> `REPUTATION_PURCHASABLE = false as const` — bu qiymat o'zgartirilmaydi.

### Obro' darajalari va chegaralar:

> ⚠️ Daraja raqamlari, ranglar va chegaralarni **hech qachon bu yerdan yozma.**
> Barcha qiymatlar `@/lib/reputation.ts` va `@/lib/payments.ts` fayllarida saqlanadi.

```typescript
import { getLevel, getNextLevel, getProgressPercent, LEVELS } from "@/lib/reputation";
import { REP_THRESHOLDS } from "@/lib/payments";
// REP_THRESHOLDS.MIN_P2P_POST, MIN_AGENT, TRUSTED, GOLD, ELITE — shu yerdan o'qi
// LEVELS massivi — barcha daraja nomlari, rang va chegaralari shu yerda
```

### Obro' funksiyalari (`lib/reputation.ts`):
```typescript
import { getLevel, getNextLevel, getProgressPercent } from "@/lib/reputation";

const level = getLevel(reputationPoints);    // LevelInfo
const next  = getNextLevel(reputationPoints); // LevelInfo | null
const pct   = getProgressPercent(reputationPoints); // 0–100
```

---

## 8. FIREBASE TUZILMASI

### Bog'lanish:
```typescript
import { db, ref, set, get, onValue, update, push } from "@/lib/firebase";
```

### Firebase Realtime DB yo'llari (paths):
```
user-balances/{deviceId}/balance        ← BP balansi
user-balances/{deviceId}/updatedAt
reputation/{deviceId}/score             ← Obro' bali
reputation/{deviceId}/history[]         ← Obro' tarixi
transactions/{deviceId}/{txId}          ← Tranzaksiyalar (limitToLast(20) bilan o'qi!)
bp-earnings/{deviceId}/{id}             ← BP topish tarixi
referral-codes/{deviceId}/code          ← Referral kodi
referral-codes/{deviceId}/appliedBy[]   ← Kim ishlatgan
topup-requests/{id}                     ← To'ldirish so'rovlari
tmcell-cashout-orders/{id}              ← TMCell chiqarish
blocked-users/{deviceId}                ← Bloklangan foydalanuvchilar
p2p-orders/{orderId}                    ← P2P buyurtmalar
escrow/{orderId}/amount                 ← Muzlatilgan BP (escrow)
escrow/{orderId}/status                 ← locked | released | refunded
crypto-ads/{adId}                       ← Kripto birja e'lonlari
nagt-orders/{orderId}                   ← Nagt cashout buyurtmalari
road-reports/{reportId}                 ← Yo'l xabarlari
micro-tasks/{taskId}                    ← Mikro vazifalar
digital-listings/{listingId}            ← Raqamli katalog
chats/{chatId}/meta                     ← Chat statusi, kimlar, bog'liq orderId
chats/{chatId}/messages/{msgId}         ← Xabarlar (matn, vaqt, kimdan)

── Kelajakdagi Auth tuzilmasi (hozir rejalashtirilgan) ──
users/{uid}/profile/fullName            ← Ism, familiya
users/{uid}/profile/phone               ← Telefon raqami
users/{uid}/profile/region              ← Viloyat
users/{uid}/profile/district            ← Tuman
users/{uid}/profile/profession          ← Kasbi
users/{uid}/profile/bio                 ← O'zi haqida
users/{uid}/profile/abrayScore          ← Obro' bali (mirrored)
users/{uid}/profile/pushToken           ← Expo push token (bildirishnomalar uchun)
users/{uid}/auth_providers              ← phone | gmail | mailru
users/{uid}/trusted_circle/{uid2}       ← true (massiv emas! indekslash uchun)
users/{uid}/privacy/showProfile         ← "all" | "circle" | "none"
```

**Tranzaksiyalar tarixi qoidasi:** `transactions/{deviceId}` yo'lini hech qachon to'liq yuklamang. Faqat `limitToLast(20)` bilan o'qing. TanStack React Query bilan keshlang.

### Asosiy Firebase funksiyalari:
```typescript
// lib/firebase.ts dan eksport qilingan funksiyalar:
getUserBalance(deviceId)                          // number
addBalance(deviceId, amount)                      // void
deductBalance(deviceId, amount)                   // boolean (false = yetarli emas)
transferBP(fromId, toId, amount, note)            // {success, message}
saveOrder(path, data)                             // string (generatsiya qilingan ID)
getReputation(deviceId)                           // ReputationData
watchReputation(deviceId, callback)               // unsubscribe function
saveReputationEntry(deviceId, entry)              // void
getOrCreateReferralCode(deviceId)                 // string
applyReferralCode(deviceId, code)                 // {success, message}
getReferralStats(deviceId)                        // ReferralStats
createRoadReport(deviceId, type, lat, lng, text)  // string (reportId)
upvoteRoadReport(reportId, voterDeviceId)         // {rewarded: boolean}
createCryptoAd(deviceId, type, usdt, rate)        // {success, message}
initiateCryptoTrade(adId, deviceId)               // {success, message}
createNagtOrder(deviceId, bpAmt, city)            // string
acceptNagtOrder(orderId, agentId)                 // {success, message}
completeNagtOrder(orderId, agentId)               // {success, message}
```

---

## 9. EKRAN SHABLONI

Har bir yangi ekran shu shablondan boshlanishi SHART:

```typescript
import React, { useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable, Platform,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/useColors";
import { useBonusPul } from "@/contexts/BonusPulContext";
import { SeamlessCheckout } from "@/components/SeamlessCheckout";

export default function MyScreen() {
  const colors  = useColors();
  const insets  = useSafeAreaInsets();
  const isWeb   = Platform.OS === "web";
  const { balance, paymentLocked } = useBonusPul();

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>

      {/* ── Gradient Sarlavha ── */}
      <LinearGradient
        colors={[colors.headerGradientStart, colors.headerGradientEnd]}
        style={[s.header, { paddingTop: (isWeb ? 0 : insets.top) + 14 }]}
      >
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.headerTitle}>Sarlavha</Text>
          <Text style={s.headerSub}>Qisqacha tavsif</Text>
        </View>
      </LinearGradient>

      {/* ── Kontent ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* ... */}
      </ScrollView>

    </View>
  );
}

const s = StyleSheet.create({
  root:       { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingBottom: 18,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  headerSub:   { color: "rgba(255,255,255,0.72)", fontSize: 12, marginTop: 2 },
});
```

---

## 10. USLUB QOIDALARI (STYLE RULES)

### Raqamli qiymatlar:
```typescript
// Border Radius standartlari:
borderRadius: 16   // katta kartalar
borderRadius: 14   // kichik kartalar
borderRadius: 12   // input maydonlar
borderRadius: 10   // badge, chip
borderRadius: 8    // kichik elementlar

// Matn o'lchamlari:
fontSize: 22-24    // sarlavhalar
fontSize: 17-20    // katta sarlavhalar
fontSize: 15-16    // asosiy matn
fontSize: 13-14    // ikkilamchi matn
fontSize: 11-12    // yorliq, izoh
fontSize: 9-10     // juda kichik (badge ichida)

// fontWeight:
"800"   // sarlavhalar, tugma matni
"700"   // muhim matn
"600"   // semi-bold
"500"   // medium
```

### Shadow (soya) standart:
```typescript
// Karta uchun standart soya:
shadowColor: "#000",
shadowOpacity: 0.06,
shadowRadius: 8,
shadowOffset: { width: 0, height: 3 },
elevation: 2,  // Android uchun
```

### Haptics (tebranish) qoidasi:
```typescript
// Tugma bosilganda:
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

// Muvaffaqiyat:
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

// Xato:
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
```

### iOS uslubi qoidalari:
```typescript
const isIOS = Platform.OS === "ios";
const isWeb = Platform.OS === "web";

// Tab bar: iOS da BlurView, Android da oddiy fon
// Header: iOS da BlurView ishlashini tekshir
// SafeArea: har doim insets.top dan foydalanish shart
// paddingBottom: ScrollView da { paddingBottom: 100 } (tab bar uchun joy)
```

---

## 11. SMS ANTI-SPOOFING TIZIMI

**Qoida:** P2P to'lovlarda faqat rasmiy bank SMS-lari qabul qilinadi.

```typescript
import { processBankSMS, parseBankSMS, handleSpoofAttempt } from "@/lib/sms-validator";

// To'liq SMS tekshirish oqimi:
const result = await processBankSMS({
  rawText: smsText,     // kelgan SMS matni
  sender: smsSender,    // SMS yuboruvchi (masalan "HALK")
  deviceId: deviceId,   // tekshirilayotgan foydalanuvchi
  orderId: orderId,     // Firebase da kutayotgan buyurtma ID
});

if (result.approved) {
  // Balansni yangilash, buyurtmani tasdiqlash
} else if (result.isSpoofAttempt) {
  // Obro' nolga tushiriladi, foydalanuvchi BLOKLANGAN
  // handleSpoofAttempt avtomatik chaqiriladi
}

// Ishonchli bank SMS yuboruvchilar:
// "HALK", "SENAGATBANK", "RYSGAL", "TURKMENBANK",
// "DAYHANBANK", "TNGIZBANKINFO", "1000", "1001", "1002", "1003"
```

---

## 12. YANGI EKRAN QO'SHISH TARTIBI

1. `app/` papkasiga yangi `.tsx` fayl yaratish
2. `app/_layout.tsx` da `<Stack.Screen name="fayl-nomi" options={{ headerShown: false }} />` qo'shish
3. To'lov bo'lsa — **har doim** `BPCheckoutModal` ishlatish
4. Har qanday tugma uchun — **har doim** `PessimisticButton` ishlatish
5. **Hech qachon** `// TODO` yoki chala kod qoldirmaslik
6. Tez-tez o'zgarmaydigan ma'lumotlarni `onValue` emas, `get()` + TanStack Query kesh bilan yuklash

---

## 13. TAQIQLAR (NIMA QILMASLIK KERAK)

```
GADAGAN: Bank kartasiga to'g'ridan-to'g'ri BP chiqarish (BANK_CARD_CASHOUT_BLOCKED = true)
GADAGAN: reputationPoints ni pulga sotish yoki sotib olish (REPUTATION_PURCHASABLE = false)
GADAGAN: Nisbiy import yo'llari (../../) ishlatish
GADAGAN: Komissiya, limit yoki mukofot raqamlarini kod ichida qo'lda yozish
GADAGAN: Yangi rang yoki font kiritish (faqat mavjud tema ranglaridan foydalaning)
GADAGAN: Firebase ga to'g'ridan-to'g'ri yozish (lib/firebase.ts funksiyalarini ishlating)
GADAGAN: localStorage ishlatish — shaxsiy ma'lumotlar uchun expo-secure-store,
         faqat UI sozlamalari (tema) uchun AsyncStorage ishlatilishi mumkin
GADAGAN: AsyncStorage ichiga login token, session yoki kripto kalitlar saqlash —
         bu shifrsiz saqlanadi, rooted telefonlarda o'g'irlanadi
GADAGAN: UI interfeysida emoji ishlatish (faqat Ionicons/SVG)
GADAGAN: // TODO yoki chala kod qoldirish
GADAGAN: Iqtisodiy hisob uchun yangi global Context ochish (BonusPulContext yetarli).
         Faqat murakkab alohida modullar (chat, kuryer) uchun modulli context ruxsat.
GADAGAN: UI matnlarini o'zbek yoki boshqa tillarda yozish —
         barcha matnlar, tugmalar, xatolar va bildirishnomalar FAQAT sof Turkman tilida
GADAGAN: Rasm Firebase Storage ga siquvsiz yuklash —
         expo-image-manipulator bilan 800x800px, 70% sifatga tushirish SHART
GADAGAN: Tranzaksiyalar tarixini to'liq yuklash —
         faqat limitToLast(20) bilan, sahifalash (pagination) bilan yuklash
GADAGAN: Balans yoki status o'zgartirishda set()/update() to'g'ridan-to'g'ri ishlatish —
         faqat runTransaction() (atomik) ishlatish shart
GADAGAN: Chat va bildirishnomalar matnida jargon yoki norasmiy so'zlar —
         barcha tizim xabarlari hurmatli, toza Turkman tilida bo'lishi shart
```

---

## 14. KONSTANTALAR VA LIMITLAR

❌ Hech qanday limit, foiz, mukofot summasi yoki admin ma'lumotlarini kod ichida qo'lda (hardcode) yozma!
✅ Barcha raqamli qiymatlarni qat'iy ravishda tegishli fayldan import qilib ishlatish shart:

| Qiymat turi                              | Import manzili         |
|------------------------------------------|------------------------|
| Komissiya foizlari, hisob-kitob funksiyalari | `@/lib/payments.ts` |
| Obro' darajalari, chegaralar, ranglar    | `@/lib/reputation.ts`  |
| Admin karta, BP bonus, bank raqamlari    | `@/lib/firebase.ts`    |
| Xizmatlar ro'yxati, marshrutlar          | `@/config/paymentFeatures.ts` |
| Transport xizmatlari                     | `@/config/transportFeatures.ts` |

```typescript
// ✅ TO'G'RI — fayldan import qil
import { COMMISSION_RATES, REP_THRESHOLDS, QUIZ_REWARDS } from "@/lib/payments";
import { LEVELS, getLevel } from "@/lib/reputation";

// ❌ NOTO'G'RI — qiymatni qo'lda yozish
const fee = amount * 0.15;        // foizni yozma
const minCashout = 5;             // limitni yozma
const cardNum = "8600 xxxx xxxx"; // karta raqamini yozma
```

---

## 15. TEZKOR MUAMMOLARNI HAL QILISH

| Muammo | Sabab | Yechim |
|--------|-------|--------|
| `colors.xxx is undefined` | Noto'g'ri rang kaliti | `ColorPalette` interfeysini tekshir |
| `balance` yangilanmayapti | `onValue` listener yo'q | `BonusPulContext` real-time listener mavjud |
| To'lov ikki marta o'tyapti | `loading` tekshirilmagan | `PessimisticButton` ishlatish |
| Import topilmaydi | Nisbiy yo'l ishlatilgan | `@/` aliasiga o'tkazish |
| `deviceId` bo'sh | Context initialize bo'lmagan | `useEffect` da `deviceId` ni tekshirish |
| SMS tasdiqlash ishlamayapti | Noto'g'ri sender formati | `firebase.ts` dagi `TRUSTED_BANK_SENDERS` ni tekshir |
| Android da shadow ko'rinmaydi | iOS shadow Android da ishlamaydi | `elevation: 2` yoki `borderColor` ishlatish |
| Ilova sekinlashdi | Tranzaksiyalar to'liq yuklanmoqda | `limitToLast(20)` + React Query kesh |
| Rasm sekin yuklanmoqda | Siqilmagan rasm | `expo-image-manipulator` 800x800, 70% |
| P2P da pul yo'qoldi | `set()` race condition | `runTransaction()` ga o'tkazish |

---

## 16. KELAJAKDAGI TIZIMLAR (YO'L XARITASI)

Bu bo'limni o'qigan AI Agent: **hozircha bu tizimlarni kodlamang**, faqat mavjud tuzilmaga zid kelmaydigan qarorlar qabul qiling.

### Auth va Shaxsiy Kabinet (Rejalashtirilgan)
- **Multi-step Onboarding:** `app/auth/register.tsx` — 4 bosqich:
  1. Telefon + SMS OTP (asosiy) / Gmail / Mail.ru
  2. Ism, Viloyat, Tuman
  3. Kasbi, Bio
  4. Yaqinlar doirasini qo'shish taklifi
- **Biometrik himoya:** `expo-local-authentication` — FaceID/TouchID katta to'lovlarda
- **Maxfiylik sozlamalari:** `users/{uid}/privacy/showProfile` → `"all"` | `"circle"` | `"none"`
- **Profil to'ldirilganlik bonusi:** To'liq profil + 3 yaqin = +15 Abraý bali avtomatik

### Escrow (Muzlatish) Tizimi (Rejalashtirilgan)
P2P va kuryer buyurtmalarida pul ikki tomonni himoya qiladi:
```
Xaridor buyurtma beradi → BP escrow/{orderId}/amount ga muzlatiladi
Sotuvchi tasdiqlaydi    → BP xaridorning balansidan yechiladi
Topshirildi tasdiqlandi → BP sotuvchi balansiga o'tadi
Nizo yuz berdi         → Abraý bali yuqori tomon hal qiladi
```

### In-App Chat (Rejalashtirilgan)
Barcha P2P va kuryer buyurtmalariga bog'liq xavfsiz chat:
- `chats/{chatId}/meta` — status, tomonlar, `orderId`
- `chats/{chatId}/messages/{msgId}` — matn, vaqt, kimdan
- Chat ichida `sendBP` tugmasi — chiqmay turib to'lash
- Barcha tizim xabarlari: hurmatli, toza Turkman tilida, emoji yo'q

### Real-vaqt Xarita (Rejalashtirilgan)
- `react-native-maps` — iOS va Android uchun
- `road-reports` tugunidan yaqin atrofdagi yo'l xabarlarini ko'rsatish
- Upvote = Abraý bali + BP mukofoti avtomatik

### Push Bildirishnomalar (Rejalashtirilgan)
- `expo-notifications` — `users/{uid}/profile/pushToken` ga yozish
- Qachon: BP tushganda, P2P e'longa xaridor bo'lganda, yaqin yo'l xabari qo'shganda

### Expo EAS Updates — OTA Yangilanishlar (Rejalashtirilgan)
Ilova hajmi o'sib ketmasligi va App Store/Google Play tasdig'ini kutmasdan yangilanish uchun:
- `expo-updates` + Expo EAS Updates tizimini sozlash
- Har bir yangi xizmat yoki tuzatish foydalanuvchi telefoniga **sekundida** yetib boradi
- Kelajakda alohida xizmatlarni "Mini-dastur" sifatida dinamik yuklash arxitekturasiga asos

### Sentry — Markazlashgan Xato Kuzatish (Rejalashtirilgan)
Foydalanuvchi telefonida dastur qotsa yoki to'lov xatosi bo'lsa, buni real vaqtda bilish uchun:
- `@sentry/react-native` integratsiyasi
- Har bir `crash`, `unhandled promise rejection` va to'lov xatosi Sentry dashboard ga avtomatik yuboriladi
- Xato qaysi fayl, qaysi qatorda ekanligini ko'rish mumkin bo'ladi

### Deep Linking — Havola Orqali Ulanish (Rejalashtirilgan)
Foydalanuvchilar profil, yo'l xabari yoki xizmatni tashqaridan ulashishi uchun:
```
yenil://profile/user_123        → to'g'ridan-to'g'ri profil sahifasi
yenil://road-report/report_99   → yo'l xabari
yenil://service/kuryer          → kuryer ekrani
https://yenil.app/...           → universal link (ilovani ochadi)
```
- Expo Router o'zida Deep Linking ni qo'llab-quvvatlaydi — `app.json` da `scheme: "yenil"` sozlanishi shart
- Havola ilovani ochadi va to'g'ri sahifaga silliq animatsiya bilan olib kiradi

### MMKV — Tezkor Lokal Kesh (Rejalashtirilgan)
Internet yo'qolganda ilova qotib qolmasligi uchun:
- Hozirda: `AsyncStorage` (sekin, shifrlanmagan)
- Kelajakda: `react-native-mmkv` — AsyncStorage dan **10x tezroq**, synchronous API
- Foydalanuvchi balansi, xizmatlar katalogi va oxirgi tranzaksiyalar lokal saqlanadi
- Internet qaytganda Firebase bilan avtomatik sinxronizatsiya

*Eslatma: MMKV ga ham login token yoki kripto kalitlar saqlanmaydi — buning uchun faqat `expo-secure-store`.*

### SMS O'qish — iOS Chegarasi (Muhim Eslatma)
```text
Android: SMS-larni orqa fonda avtomatik o'qish MUMKIN
iOS:     SMS avtomatik o'qish MUMKIN EMAS (Apple taqiqlaydi)

iOS uchun muqobil yechimlar:
  1. Bank skrinshotini yuklash + OCR (expo-image-picker + matn aniqlash)
  2. To'lov ID sini qo'lda kiritish
  3. Bank deep link (agar mavjud bo'lsa)
```

---

*Oxirgi yangilanish: `AI_INSTRUCTIONS.md` — Ýeňil Mobile v3.0*
*Bu fayl loyiha bilan birga yangilanib borilishi shart.*
