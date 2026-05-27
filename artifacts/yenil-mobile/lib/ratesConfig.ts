/**
 * ratesConfig.ts — Merkezi kurs we komissiýa sazlamalary.
 *
 * Häzir: DEFAULT_RATES koddaky ätiýaçlyk gymmatlary.
 * Admin paneli işe girensoň: Firebase admin-config/rates ýoly bilen dolandyrylýar.
 * Kurs üýtgände diňe şu ýer ÝETERLIK — başga faýllara degmek hökman däl.
 */

import { db, ref, onValue } from "./firebase";

export interface AppRates {
  usd_buy_tmt: number;      // Ulanyjy USD satyn alanda: 1 USD = X TMT
  usd_sell_tmt: number;     // Ulanyjy USD satanda: 1 USD = X TMT
  bank_topup: number;       // Bank kartasy arkaly BP satyn almak komissiýasy (0–1 aralygy)
  tmcell_topup: number;     // TMCell arkaly BP satyn almak komissiýasy (0–1)
  tmcell_cashout: number;   // BP → TMCell çykaryş komissiýasy (0–1)
  crypto_bp_per_usdt: number; // 1 USDT = X BP
  crypto_usdt_per_bp: number; // 1 BP  = X USDT
}

export const DEFAULT_RATES: AppRates = {
  usd_buy_tmt:          29,
  usd_sell_tmt:         19,
  bank_topup:           0.15,
  tmcell_topup:         0.30,
  tmcell_cashout:       0.005,
  crypto_bp_per_usdt:   34.5,
  crypto_usdt_per_bp:   0.028,
};

/**
 * Firebase admin-config/rates ýoluna diňlär.
 * Maglumatlary ýok bolsa DEFAULT_RATES gaýtarýar.
 * Admin panel goşulanda bu ýol arkaly kurslar dolandyrylýar.
 */
export function watchRates(cb: (rates: AppRates) => void): () => void {
  const r = ref(db, "admin-config/rates");
  return onValue(
    r,
    (snap) => {
      if (!snap.exists()) { cb(DEFAULT_RATES); return; }
      cb({ ...DEFAULT_RATES, ...(snap.val() as Partial<AppRates>) });
    },
    () => cb(DEFAULT_RATES)
  );
}
