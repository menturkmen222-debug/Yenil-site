---
name: BP Payment Architecture
description: How all service payments use BP atomically with inline top-up modal for insufficient balance
---

## Rule
All service purchases (ulgamlar, etc.) use only BP. No terminal or direct card payment option at checkout.

## How it works
1. User taps pay → `deductBalanceAtomic(deviceId, amount)` using Firebase `runTransaction`
2. If balance sufficient → atomic deduction → success
3. If balance insufficient → show `BPCheckoutModal` (components/BPCheckoutModal.tsx)
   - Card option: missing BP × 1.15 (15% commission) → saves inline-topup-orders
   - TMCell option: missing BP × 1.30 (30% commission) → saves inline-topup-orders
   - On confirm: addBalance(missing) → saveOrder → deductBalanceAtomic(serviceAmount)

## Anti-double-spend
- `deductBalanceAtomic` uses Firebase `runTransaction` — aborts if balance insufficient
- UI: button disabled + ActivityIndicator spinner while loading state is true

**Why:** Business requirement to centralize all value in BP, prevent race conditions on balance.
**How to apply:** Any new service screen should import `deductBalanceAtomic` from firebase.ts and show BPCheckoutModal when balance is insufficient.
