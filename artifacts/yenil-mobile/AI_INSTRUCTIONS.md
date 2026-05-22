# AI_INSTRUCTIONS.md — Ýeňil Mobile

> **Bu fayl har bir AI Agent yoki dasturchi uchun MAJBURIY o'qish materialidir.**
> Bu faylni o'qimay turib hech qanday kod yozma, hech qanday o'zgartirish qilma.
> Loyiha haqidagi yagona haqiqat manbai shu yerda.

---

## 1. LOYIHA NIMA?

**Ýeňil** — Türkmenistan üçin ýapyk ykdysady ekosistemaly mobil ulagma (Super App).

- **Platform:** React Native + Expo, Expo Router (faýl esasly routing). Amaldaky versiyany `package.json` dan tekşir.
- **Dil:** TypeScript (`strict` rejimdä, `"@/*"` alias bilen)
- **Backend:** Firebase Realtime Database (`deviceId` esasda awtomat login)
- **State:** React Context (`BonusPulContext`) + TanStack React Query
- **Paket dolandyryjy:** `pnpm`
- **Font:** `@expo-google-fonts/inter` (400, 500, 600, 700)
- **Howpsuzlyk belligi:** Häzir `deviceId` esasly ulgam ulanylýar. Kriptovalýuta we hakyky pul aýlanýan bölümlerde keljekde PIN-kod ýa-da SMS tassyklamasy goşulmagy mümkin.

---

## 2. PAPKA TUZILMASI (ARXITEKTURA)

```
yenil-mobile/
├── app/                     ← Expo Router ekranlary (faýl = marşrut)
│   ├── _layout.tsx          ← Root layout (ähli Provider-lar şu ýerde)
│   ├── (tabs)/              ← Tab nawigatsiýasy (esasy ekranlar)
│   │   └── (demiryol)/      ← Demir ýol nested nawigator
│   └── [täze-hyzmat].tsx    ← Her täze hyzmat aýratyn .tsx faýl hökmünde goşulýar
│
├── components/              ← Gaýtadan ulanylyp bilinýän UI komponentler
│   ├── BPCheckoutModal.tsx  ← ESASY: Ähli hyzmatlar üçin töleg modaly
│   └── PessimisticButton.tsx← ESASY: Goraglanan (pessimistic lock) düwme
│
├── contexts/
│   └── BonusPulContext.tsx  ← ESASY: Ähli ykdysady ýagdaý şu ýerde
│
├── lib/                     ← Biznes logika, API we kömekçi funksiýalar
│   ├── firebase.ts          ← Firebase CRUD funksiýalary (ähli DB amallary)
│   ├── payments.ts          ← Komissiýa konstantalary we hasaplama funksiýalary
│   ├── reputation.ts        ← Abraý derejesi we kömekçi funksiýalar
│   └── ebilimData.ts        ← E-bilim kategoriýalary we sapak maglumatlary
│
├── constants/
│   └── colors.ts            ← 4 tema: green, dark, white, girls
│
├── hooks/
│   └── useColors.ts         ← ThemeContext-den reňkleri almak üçin hook
│
└── config/
    ├── paymentFeatures.ts   ← Töleg hyzmatlary sanawy
    └── transportFeatures.ts ← Ulag hyzmatlary sanawy
```

**Kengaýtma düzgüni:** Täze hyzmat goşanyňda faqat `app/` içine `.tsx` faýl döret we `app/_layout.tsx` da Stack.Screen ýazgısını goş. Papka tuzilmasını bu faylda täzelemek hökman däl.

---

## 3. IMPORT DÜZGÜNI

**Hemişe `@/` aliasini ulan.** Nisbiy ýollar (`../../`) GADAGAN.

```typescript
// DOGRY
import { useBonusPul }       from "@/contexts/BonusPulContext";
import { useColors }          from "@/hooks/useColors";
import { saveOrder }          from "@/lib/firebase";
import { COMMISSION_RATES }   from "@/lib/payments";
import BPCheckoutModal        from "@/components/BPCheckoutModal";
import { PessimisticButton }  from "@/components/PessimisticButton";

// NÄDOGRY — hiç haçan beýle ýazma
import { useBonusPul } from "../../contexts/BonusPulContext";
```

---

## 4. TEMA (THEME) ULGAMY

### 4 tema:
| Açar    | Beýan                    | `isDark` |
|---------|--------------------------|----------|
| `green` | Esasy (ýaşyl, mähirli)  | `false`  |
| `dark`  | Garaňky rejim            | `true`   |
| `white` | Arassa ak (iOS stili)    | `false`  |
| `girls` | Gülgüne/binepşe         | `false`  |

### Reňkleri ulanmak (hemişe şeýle):
```typescript
import { useColors } from "@/hooks/useColors";

const colors = useColors();
// colors.background | colors.foreground | colors.card | colors.cardForeground
// colors.primary    | colors.primaryForeground (hemişe ak)
// colors.secondary  | colors.secondaryForeground
// colors.muted      | colors.mutedForeground
// colors.accent     | colors.accentForeground
// colors.destructive (xata reňki) | colors.border | colors.input
// colors.success | colors.warning
// colors.tabBarBg
// colors.headerGradientStart | colors.headerGradientEnd
// colors.isDark (boolean) | colors.radius (16 — standart)
```

### Gradient sarlavha (ähli ekranlar şu nusgadan peýdalanmaly):
```typescript
import { LinearGradient }      from "expo-linear-gradient";
import { useSafeAreaInsets }   from "react-native-safe-area-context";

const insets = useSafeAreaInsets();
const isWeb  = Platform.OS === "web";

<LinearGradient
  colors={[colors.headerGradientStart, colors.headerGradientEnd]}
  style={{ paddingTop: (isWeb ? 0 : insets.top) + 14, ... }}
>
  {/* yzyna düwme + başlyk */}
</LinearGradient>
```

---

## 5. YKDYSADY ULGAM (BP EKONOMIKASY)

### Esasy düzgünler:
> **1 BP = 1 TMT nominal bahasy**
> Ilovadaky ähli hyzmatlar **DIŇE BP** arkaly satylýar.
> BP balansyny gönüden-göni bank kartasyna çykarmak **ELMYDAMA ÝAPYK** (`BANK_CARD_CASHOUT_BLOCKED = true`).

### `BonusPulContext` — ýeke-täk ykdysady merkez:
```typescript
import { useBonusPul } from "@/contexts/BonusPulContext";

const {
  balance,          // number — BP balansy (real wagt, Firebase onValue)
  deviceId,         // string — SecureStore-dan alinýan gurluş ID-si
  reputationScore,  // number — Abraý baly (0–100)
  refreshBalance,   // () => void
  deduct,           // (amount) => Promise<boolean>
  deductAtomic,     // (amount) => Promise<{success, newBalance}> — pessimistik
  buyBonusPul,      // (amount, phone) => Promise<void>
  sellBonusPul,     // (amount, phone) => Promise<void>
  sendBP,           // (toId, amount, note?) => Promise<{success, message}>
} = useBonusPul();
```

### Komissiýa we limitlar:
> GADAGAN: Bu ýerde ýa-da kod içinde sanlary gönüden ýazma.
> Ähli komissiýa, minimal limit we admin maglumatlaryny `@/lib/payments.ts` we `@/lib/firebase.ts` fayllaryndan import et.

```typescript
import {
  COMMISSION_RATES,        // ähli komissiýa foizlary (bank, tmcell, kripto)
  calcTopUpTotal,          // ýetişmän BP + komissiýa = tölenýän TMT
  calcCommissionAmount,    // komissiýa mukdary
  calcMissingBP,           // ýetişmeýän BP
  calcTMCellCashoutNet,    // TMCell çykarandan soňky sap mukdar
  calcCryptoDepositBP,     // kripto girizgenden alynýan BP
  calcCryptoWithdrawUSDT,  // BP çykaranda alynýan USDT
  getCryptoDepositRatePct, // görkezmek üçin tekst ("2.0%")
  getCryptoWithdrawRatePct,
  BANK_CARD_CASHOUT_BLOCKED,
  P2P_INTERNAL_FEE,
  REP_THRESHOLDS,          // MIN_P2P_POST, MIN_AGENT, TRUSTED, GOLD, ELITE
  QUIZ_REWARDS,
} from "@/lib/payments";

// firebase.ts-dan:
import { ADMIN_CARD_NUMBER, ADMIN_CARD_HOLDER, BP_BONUS_PERCENT } from "@/lib/firebase";
```

### Referral we Learn & Earn:
Foydalanuvchi testni tugatganda yoki referral işleýän wagtynda komissiýa we mukdarlary `@/lib/payments.ts`-dan import et. `BonusPulContext` içindäki `deductAtomic` we Firebase-däki `submitQuizAndEarnBP` funksiýalaryny ulan.

---

## 6. TÖLEG AKIMI — BPCHECKOUTMODAL

**Bu ilovadaky iň möhüm düzgün:** Islendik hyzmaty satyn almakda `BPCheckoutModal` ulanylyş HÖKMANY.

```typescript
import BPCheckoutModal from "@/components/BPCheckoutModal";
import { useBonusPul }  from "@/contexts/BonusPulContext";

function MyServiceScreen() {
  const { balance, deviceId } = useBonusPul();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  return (
    <>
      <PessimisticButton
        label="Hyzmaty satyn al — 50 BP"
        onPress={() => setCheckoutOpen(true)}
      />

      <BPCheckoutModal
        visible={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        serviceName="Meniň Hyzmatym"
        serviceAmount={50}
        currentBalance={balance}
        deviceId={deviceId}
        onPaymentComplete={() => {
          setCheckoutOpen(false);
          // Üstünlikden soňky logika
        }}
      />
    </>
  );
}
```

### Töleg akimi:
1. **Balans ýeterli →** Töleg çeki görkezilýär → PessimisticButton → `deductAtomic`
2. **Balans ýeterli däl →** Diňe ýetişmeýän mukdar görkezilýär → Bank kartasy ýa-da TMCell (komissiýalar `COMMISSION_RATES`-dan dinamik okalýar)

### Pessimistik blokirleme düzgüni:
```typescript
// HEMIŞE şu düzgüne eýer — iki gezek töleg DÜÝBÜNDEN gadagan:
const [loading, setLoading] = useState(false);

<PessimisticButton
  label="Töle"
  loadingLabel="Işleýär..."
  loading={loading}
  disabled={loading}
  onPress={async () => {
    setLoading(true);
    try { await handlePayment(); }
    finally { setLoading(false); }
  }}
/>
```

---

## 7. PESSIMISTICBUTTON KOMPONENTI

`Pressable + ActivityIndicator` kombinasiýasyny hiç haçan el bilen ýazma. Munuň ýerine:

```typescript
import { PessimisticButton } from "@/components/PessimisticButton";

<PessimisticButton
  label="Tassykla"
  loadingLabel="Ugradylýar..."
  loading={isLoading}
  disabled={isLoading}
  onPress={handleAction}
  color={colors.primary}   // islege bagly, default = colors.primary
  size="md"                // "sm" | "md" | "lg"
  icon={<Ionicons name="checkmark" size={18} color="#fff" />}  // islege bagly
/>
```

---

## 8. ABRAÝ (YNAM/ABRAÝ) KONSTITUSIÝASY

> **EBEDI DÜZGÜN:** `reputationScore` hiç hili usul bilen satyn alnyp bilinmeýär.
> `REPUTATION_PURCHASABLE = false as const` — bu baha üýtgedilmeýär.

```typescript
import { getLevel, getNextLevel, getProgressPercent, LEVELS } from "@/lib/reputation";
import { REP_THRESHOLDS } from "@/lib/payments";

// LEVELS — ähli dereje atlary, reňkleri we serhetleri şu ýerde
// REP_THRESHOLDS — MIN_P2P_POST, MIN_AGENT, TRUSTED, GOLD, ELITE şu ýerde

const level = getLevel(reputationScore);      // LevelInfo
const next  = getNextLevel(reputationScore);  // LevelInfo | null
const pct   = getProgressPercent(reputationScore); // 0–100
```

---

## 9. FIREBASE ULGAMY

### Baglanyşyk:
```typescript
import { db, ref, set, get, onValue, update, push } from "@/lib/firebase";
```

### Firebase Realtime DB ýollary:
```
user-balances/{deviceId}/balance     ← BP balansy
reputation/{deviceId}/score          ← Abraý baly
reputation/{deviceId}/history[]      ← Abraý taryhy
transactions/{deviceId}/{txId}       ← Tranzaksiýalar
bp-earnings/{deviceId}/{id}          ← BP gazanyş taryhy
referral-codes/{deviceId}/code       ← Referral kody
topup-requests/{id}                  ← Dolduryş buýruklary
tmcell-cashout-orders/{id}           ← TMCell çykaryş
bonus-orders/{id}                    ← BP satyn alyş buýruklary
bonus-sell-orders/{id}               ← BP satyş buýruklary
blocked-users/{deviceId}             ← Bloklanan ulanyjylar
p2p-orders/{orderId}                 ← P2P buýruklary
crypto-ads/{adId}                    ← Kripto birža yglanlamalary
nagt-orders/{orderId}                ← Nagt cashout buýruklary
road-reports/{reportId}              ← Ýol habarlary
micro-tasks/{taskId}                 ← Mikro wezipeler
digital-listings/{listingId}         ← Sanly katalog
ebilim-completed/{deviceId}/{lessonId} ← Tamamlanan sapaklar
ebilim-unlocked/{deviceId}/{lessonId}  ← Açylan premium sapaklar
```

### Esasy Firebase funksiýalary:
```typescript
// Balans:
getUserBalance(deviceId)                           // number
addBalance(deviceId, amount)                       // void
deductBalance(deviceId, amount)                    // boolean
deductBalanceAtomic(deviceId, amount)              // {success, newBalance}

// Transferlar:
transferBP(fromId, toId, amount, note)             // {success, message}
saveOrder(path, data)                              // string (ID)

// Abraý:
getReputation(deviceId)                            // ReputationData
watchReputation(deviceId, callback)                // unsubscribe fn
saveReputationEntry(deviceId, entry)               // void

// Referral:
getOrCreateReferralCode(deviceId)                  // string
applyReferralCode(deviceId, code)                  // {success, message}
getReferralStats(deviceId)                         // ReferralStats
addPassiveReferralCommission(deviceId, amount)     // void

// Agent:
createAgentDeposit(deviceId, tmtAmount)            // string (orderId)
watchAgentDeposits(deviceId, callback)             // unsubscribe fn

// Ýol habarlary:
createRoadReport(deviceId, type, lat, lng, text)   // string (reportId)
upvoteRoadReport(reportId, voterDeviceId)          // {rewarded: boolean}
watchRoadReports(callback)                         // unsubscribe fn

// Kripto birža:
// (Kripto amallar üçin crypto-ads we p2p-orders ýollaryny ulan)

// Nagt cashout:
createNagtOrder(deviceId, bpAmt, city)             // string
acceptNagtOrder(orderId, agentId)                  // {success, message}
completeNagtOrder(orderId, agentId)                // {success, message}
watchNagtOrders(callback)                          // unsubscribe fn

// E-bilim:
watchCompletedLessons(deviceId, callback)          // unsubscribe fn
watchUnlockedLessons(deviceId, callback)           // unsubscribe fn
submitQuizAndEarnBP(deviceId, lessonId, bpReward)  // {success, alreadyDone}
unlockPremiumLesson(deviceId, lessonId, bpCost)    // {success, message}

// SMS tassyklamasy:
verifySmsAndConfirmDeposit(deviceId, smsText, orderId) // {success, message}
```

---

## 10. E-BILIM ULGAMY

E-bilim maglumatlaryny `@/lib/ebilimData.ts`-dan import et:

```typescript
import {
  CATEGORIES,          // EBilimCategory[] — 7 kategoriýa
  LESSONS,             // Lesson[] — ähli sapaklar
  type Lesson,
  type EBilimCategory,
  type QuizQuestion,
} from "@/lib/ebilimData";

// Sapak açmak üçin:
import {
  watchCompletedLessons,
  watchUnlockedLessons,
  submitQuizAndEarnBP,   // Test geçensoň BP berýär
  unlockPremiumLesson,   // BP bilen premium sapak açýar
} from "@/lib/firebase";
```

---

## 11. EKRAN NUSGA KODY

Her täze ekran şu nusgadan başlamalydyr:

```typescript
import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, Platform } from "react-native";
import { router }             from "expo-router";
import { Ionicons }           from "@expo/vector-icons";
import { LinearGradient }     from "expo-linear-gradient";
import { useSafeAreaInsets }  from "react-native-safe-area-context";
import * as Haptics           from "expo-haptics";
import { useColors }          from "@/hooks/useColors";
import { useBonusPul }        from "@/contexts/BonusPulContext";
import { PessimisticButton }  from "@/components/PessimisticButton";
import BPCheckoutModal        from "@/components/BPCheckoutModal";

export default function MyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb  = Platform.OS === "web";
  const { balance, deviceId } = useBonusPul();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>

      <LinearGradient
        colors={[colors.headerGradientStart, colors.headerGradientEnd]}
        style={[s.header, { paddingTop: (isWeb ? 0 : insets.top) + 14 }]}
      >
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.headerTitle}>Ekran ady</Text>
          <Text style={s.headerSub}>Gysgaça beýan</Text>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}>
        {/* kontent */}
      </ScrollView>

      <BPCheckoutModal
        visible={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        serviceName="Hyzmat ady"
        serviceAmount={50}
        currentBalance={balance}
        deviceId={deviceId}
        onPaymentComplete={() => setCheckoutOpen(false)}
      />

    </View>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1 },
  header:      { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 18 },
  backBtn:     { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  headerSub:   { color: "rgba(255,255,255,0.72)", fontSize: 12, marginTop: 2 },
});
```

---

## 12. DIZAÝN WE ANIMASIÝA KONSTITUSIÝASY

### Ikonalar we grafikalar:
```
HÖKMANY: Diňe @expo/vector-icons (Ionicons, Feather) ýa-da sof SVG grafikalar.
GADAGAN: Ilova UI interfeýsinde emoji ullanmak (😊 ❌ 💳 we ş.m.).
          Emojilar diňe ebilimData.ts içindäki mazmun maglumatlary üçin rugsat edilýär.
```

### Ölçeg standartlary:
```typescript
// Border Radius:
borderRadius: 16  // uly kartalar
borderRadius: 14  // kiçi kartalar
borderRadius: 12  // input meýdanlar
borderRadius: 10  // badge, chip
borderRadius: 8   // kiçi elementler

// Ýazgy ululyklary:
fontSize: 22–24  // ekran başlyklary
fontSize: 17–20  // uly başlyklar
fontSize: 15–16  // esasy matn
fontSize: 13–14  // ikinji derejeli matn
fontSize: 11–12  // bellik, düşündiriş
fontSize: 9–10   // badge içinde

// fontWeight: "800" başlyklar / "700" möhüm / "600" semi-bold / "500" medium
```

### Kölege (shadow) standarty:
```typescript
// iOS üçin:
shadowColor: "#000", shadowOpacity: 0.06,
shadowRadius: 8, shadowOffset: { width: 0, height: 3 },

// Android üçin (shadow ýerine):
elevation: 2,
// Ýa-da salgylyk çyzygy:
borderWidth: 1, borderColor: colors.border,
```

### Animasiýa düzgünleri:
```typescript
// DOGRY: gurluşda işleýän animasiýalar
import Animated, { useSharedValue, withSpring, withTiming } from "react-native-reanimated";

// NÄDOGRY: agyr JS animasiýalary (setTimeout bilen setStyle)
// Geçişler üçin Expo Router öz animasiýasyny ulanýar — goşmaça gerek däl
```

### iOS we Android gabat gelme:
```typescript
const isIOS = Platform.OS === "ios";
const isWeb = Platform.OS === "web";

// Tab bar: iOS-da BlurView, Android-da colors.tabBarBg
// SafeArea: hemişe insets.top ulan
// ScrollView: paddingBottom: 100 (tab bar üçin ýer)
// Android-da BlurView agyr işleýär — ähtibarly alternatiwany ulan
```

### Haptics (titreme):
```typescript
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);      // düwme basanda
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); // üstünlik
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);   // ýalňyşlyk
```

---

## 13. SMS ANTI-SPOOFING ULGAMY

P2P töleglerinde diňe resmi bank SMS-lary kabul edilýär:

```typescript
import { verifySmsAndConfirmDeposit } from "@/lib/firebase";

const result = await verifySmsAndConfirmDeposit(deviceId, smsText, orderId);

if (result.success) {
  // Balansy täzele, buýrugy tassykla
} else {
  // Abraý nola düşürülýär, ulanyjy BLOKLANÝAR
}
// Ynamdar bank iberijiler firebase.ts içinde kesgitlenýär
```

---

## 14. TÄZE EKRAN GOŞMAK TERTIBI

1. `app/` içine `.tsx` faýl döret
2. `app/_layout.tsx` da goş: `<Stack.Screen name="faýl-ady" options={{ headerShown: false }} />`
3. Töleg bar bolsa **hemişe** `BPCheckoutModal` ulan
4. Düwmeler üçin **hemişe** `PessimisticButton` ulan
5. `// TODO` ýa-da ýarym kod GOÝMA

---

## 15. GADAGANLAR (NÄMÄNI ETMELI DÄLDIGI)

```
GADAGAN: Bank kartasyna gönüden BP çykarmak (BANK_CARD_CASHOUT_BLOCKED = true)
GADAGAN: reputationScore satyn almak (REPUTATION_PURCHASABLE = false)
GADAGAN: Nisbiy import ýollary (../../)
GADAGAN: Komissiýa, limit, mukdar sanlary kod içinde gönüden ýazmak
GADAGAN: Täze reňk ýa-da font goşmak (diňe colors.ts-däki tema reňkleri)
GADAGAN: Firebase-a gönüden ýazmak (lib/firebase.ts funksiýalaryny ulan)
GADAGAN: localStorage (SecureStore ýa-da AsyncStorage ulan)
GADAGAN: UI interfeýsinde emoji ullanmak (diňe Ionicons/SVG)
GADAGAN: // TODO ýa-da ýarymlanmadyk kod goýmak
GADAGAN: Täze global Context açmak (BonusPulContext ýeterli).
         Diňe çylşyrymly modul (chat, kuryer ş.m.) üçin modullar konteksti açmak bolýar.
GADAGAN: UI-de türkmen dili däl dil ullanmak.
         Ähli matnlar, düwmeler we bildirişler DIŇE sof türkmen dilinde bolmaly.
```

---

## 16. TIZKOR MESELELERI ÇÖZMEK

| Mesele | Sebäp | Çözgüt |
|--------|-------|--------|
| `colors.xxx is undefined` | Nädogry reňk açary | `ColorPalette` interfeýsini barlا |
| `balance` täzelenmeýär | `onValue` listener ýok | `BonusPulContext` real-wagt listener bar |
| Töleg iki gezek geçýär | `loading` barlanmandyr | `PessimisticButton` ulan |
| Import tapylmaýar | Nisbiy ýol ulanyldy | `@/` aliasyna geçir |
| `deviceId` boş | Context başlanmandyr | `useEffect`-de `deviceId` barlا |
| SMS tassyklama işlemeýär | Iberiji formatydan tapawutly | `firebase.ts`-däki `TRUSTED_BANK_SENDERS` barlا |
| Android-da sölge (shadow) görünmeýär | iOS shadow Android-da işlemeýär | `elevation` ýa-da `borderColor` ulan |

---

*Soňky täzeleniş: AI_INSTRUCTIONS.md — Ýeňil Mobile v2.0*
*Bu faýl loyiha bilen birlikde täzelenip durulmaly.*

