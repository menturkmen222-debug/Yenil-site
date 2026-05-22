/**
 * payments.ts — Ähli komissiýa, limit we hasaplama konstanta we funksiýalary.
 *
 * GADAGAN: Bu faýldan başga ýerde komissiýa ýa-da çäk sanlary gönüden ýazma.
 * Ähli töleg skrinleri we modallar şu ýerden import etmeli.
 */

// ─── Komissiýa nyrhlary ───────────────────────────────────────────────────────

export const COMMISSION_RATES = {
  bank_topup:       0.15,   // 15%  — bank kartasy arkaly BP satyn almak
  tmcell_topup:     0.30,   // 30%  — TMCell balansdan BP satyn almak
  tmcell_cashout:   0.005,  // 0.5% — BP → TMCell balansa çykaryş
  crypto_bp_per_usdt: 34.5, // 1 USDT = 34.5 BP (depozit kursy)
  crypto_usdt_per_bp: 0.028,// 1 BP  = 0.028 USDT (çykaryş kursy)
} as const;

// ─── Blokirleme bellikleri ────────────────────────────────────────────────────

/** Bank kartasyna gönüden BP çykarmak hemişe ýapyk */
export const BANK_CARD_CASHOUT_BLOCKED = true as const;

/** Abraý satyn almak elmydama gadagan */
export const REPUTATION_PURCHASABLE = false as const;

/** P2P amal içki geçiriş komissiýasy */
export const P2P_INTERNAL_FEE = 0.01; // 1%

// ─── Minimum limitler ─────────────────────────────────────────────────────────

export const MIN_CASHOUT_BP    = 10;   // Iň az çykaryş mukdary (TMCell)
export const MIN_TOPUP_BP      = 1;    // Iň az satyn alyş mukdary
export const MIN_TRANSFER_BP   = 1;    // Iň az geçiriş mukdary

// ─── Abraý basgançak serhetleri ───────────────────────────────────────────────

export const REP_THRESHOLDS = {
  MIN_P2P_POST: 45, // Kripto birjada yglan goýmak üçin iň az abraý
  MIN_AGENT:    30, // Nagt agent bolmak üçin iň az abraý
  TRUSTED:      45, // "Abraýly" derejesi başlanýan ýer
  GOLD:         70, // "Altyn" derejesi başlanýan ýer
  ELITE:        85, // "Elita" derejesi başlanýan ýer
} as const;

// ─── E-bilim sylag nyrhlar ────────────────────────────────────────────────────

export const QUIZ_REWARDS = {
  DEFAULT:        5,  // Adaty sapak üçin BP sylag
  PREMIUM:       10,  // Premium sapak üçin BP sylag
  CATEGORY_BONUS: 20, // Ähli kategorýany tamamlaň bonusy
} as const;

// ─── Hasaplama funksiýalary ───────────────────────────────────────────────────

/**
 * Balans ýetmezliginde ýetişmeýän BP mukdaryny hasapla.
 */
export function calcMissingBP(serviceAmount: number, currentBalance: number): number {
  return Math.max(0, parseFloat((serviceAmount - currentBalance).toFixed(2)));
}

/**
 * Ýetişmeýän BP + komissiýa → tölenýän TMT mukdary.
 */
export function calcTopUpTotal(missingBP: number, method: "bank" | "tmcell"): number {
  const rate = method === "bank"
    ? COMMISSION_RATES.bank_topup
    : COMMISSION_RATES.tmcell_topup;
  return parseFloat((missingBP * (1 + rate)).toFixed(2));
}

/**
 * Diňe komissiýa mukdaryny hasapla (TMT).
 */
export function calcCommissionAmount(missingBP: number, method: "bank" | "tmcell"): number {
  const rate = method === "bank"
    ? COMMISSION_RATES.bank_topup
    : COMMISSION_RATES.tmcell_topup;
  return parseFloat((missingBP * rate).toFixed(2));
}

/**
 * TMCell çykaranyňdan soň alynýan sap BP mukdary.
 */
export function calcTMCellCashoutNet(bpAmount: number): number {
  const commission = parseFloat((bpAmount * COMMISSION_RATES.tmcell_cashout).toFixed(2));
  return parseFloat((bpAmount - commission).toFixed(2));
}

/**
 * Kripto depozit: girizen USDT mukdaryna görä alynýan BP.
 */
export function calcCryptoDepositBP(usdtAmount: number): number {
  return parseFloat((usdtAmount * COMMISSION_RATES.crypto_bp_per_usdt).toFixed(2));
}

/**
 * Kripto çykaryş: BP mukdaryna we torlama komissiyasyna görä alynýan USDT.
 */
export function calcCryptoWithdrawUSDT(bpAmount: number, networkFeeUSDT = 0): number {
  const usdt = parseFloat((bpAmount * COMMISSION_RATES.crypto_usdt_per_bp).toFixed(4));
  return Math.max(0, parseFloat((usdt - networkFeeUSDT).toFixed(4)));
}

/**
 * Kripto depozit kursy — görkezme üçin tekst görnüşi.
 * Mysal: "34.5 BP/USDT"
 */
export function getCryptoDepositRatePct(): string {
  return `${COMMISSION_RATES.crypto_bp_per_usdt} BP/USDT`;
}

/**
 * Kripto çykaryş kursy — görkezme üçin tekst görnüşi.
 * Mysal: "2.8%"
 */
export function getCryptoWithdrawRatePct(): string {
  return `${(COMMISSION_RATES.crypto_usdt_per_bp * 100).toFixed(1)}%`;
}
