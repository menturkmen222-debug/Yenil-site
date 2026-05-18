import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useBonusPul } from "@/contexts/BonusPulContext";
import { saveOrder } from "@/lib/firebase";
import { useToast } from "@/components/Toast";
import { SparkleIcon, CheckCircleIcon, TrophyIcon, SmartphoneIcon, WalletIcon } from "@/components/Icons";

const ADMIN_PHONES = ["+993 71 789091", "+993 64 629487", "+993 71 788546"];
const BP_AMOUNTS = [50, 100, 200, 500];
const UZS_AMOUNTS = [10000, 25000, 50000, 100000];
const UZS_RATE = 0.028; // 1 UZS ≈ 0.028 TMT (configurable)

const UZ_OPERATORS = [
  { id: "ucell", name: "Ucell", icon: "fa-signal", color: "#e63946" },
  { id: "beeline", name: "Beeline UZ", icon: "fa-signal", color: "#f5a623" },
  { id: "mobiuz", name: "Mobiuz", icon: "fa-signal", color: "#2563eb" },
  { id: "uztelecom", name: "Uztelecom", icon: "fa-phone", color: "#059669" },
];

type Tab = "bp-buy" | "bp-sell" | "currency" | "sim";

function PremiumSpinner() {
  return <div style={{ textAlign: "center", padding: 24 }}><div className="spinner"></div><p style={{ marginTop: 10, color: "#64748b", fontSize: "0.9rem" }}>Ýüklenýär...</p></div>;
}

function PaymentNumbers({ total, unit = "TMT" }: { total: number; unit?: string }) {
  return (
    <div className="payment-numbers">
      <p style={{ fontWeight: 700, marginBottom: 10, color: "var(--primary)" }}>
        <i className="fas fa-exclamation-circle"></i> Şu nomerleriň birine <strong>{total} {unit}</strong> geçirmeli:
      </p>
      {ADMIN_PHONES.map(p => (
        <div className="payment-number" key={p}>
          <i className="fas fa-phone-alt"></i> {p}
        </div>
      ))}
    </div>
  );
}

function BonusBuySection() {
  const { deviceId, toast } = { ...useBonusPul(), toast: useToast().toast };
  const [selected, setSelected] = useState<number | null>(null);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  async function handlePay() {
    if (!phone.trim()) { alert("Telefon belgiňizi giriziň!"); return; }
    setLoading(true);
    try {
      await saveOrder("bonus-orders", { deviceId, amount: selected, userPhone: phone, status: "pending" });
      setDone(true);
      toast("Bonus pul haýyşnamaňyz kabul edildi!", "success");
    } catch { toast("Ýalňyşlyk ýüz berdi", "error"); }
    finally { setLoading(false); }
  }

  if (done) return (
    <div className="alert-success animate-in">
      <div className="success-icon-wrap"><SparkleIcon size={30} strokeWidth={1.6} /></div>
      <h3 style={{ color: "var(--primary)", marginBottom: 10 }}>Üstünlikli!</h3>
      <p>Siziň bonus pul haýyşnamaňyz kabul edildi. Iň gysga wagtda barlanar we hasabyňyza goşular.</p>
      <button className="btn-primary" style={{ marginTop: 20 }} onClick={() => { setDone(false); setSelected(null); setPhone(""); setShowPayment(false); }}>
        <i className="fas fa-redo"></i> Täzeden
      </button>
    </div>
  );

  return (
    <div className="animate-in">
      <h3 style={{ color: "var(--primary)", marginBottom: 6, fontSize: "1.1rem" }}>
        <i className="fas fa-coins"></i> Bonus pul satyn almak
      </h3>
      <p style={{ marginBottom: 20, opacity: 0.75, fontSize: "0.9rem" }}>Mukdary saýlap, görkezilen nomerlere pul geçiriň. Tassyklama soňra hasabyňyza goşular.</p>

      {!showPayment ? (
        <>
          <div className="price-cards">
            {BP_AMOUNTS.map(a => (
              <div key={a} className={`price-card${selected === a ? " selected" : ""}`} onClick={() => setSelected(a)}>
                <div className="price-card-amount">{a}</div>
                <div className="price-card-label">BP = {a} TMT</div>
              </div>
            ))}
          </div>
          <button className="btn-primary btn-block" style={{ marginTop: 20 }}
            disabled={!selected}
            onClick={() => setShowPayment(true)}>
            <i className="fas fa-arrow-right"></i> Dowam etmek
          </button>
        </>
      ) : (
        <>
          <PaymentNumbers total={selected!} />
          <div className="form-group" style={{ marginTop: 16 }}>
            <label><i className="fas fa-phone"></i> Siziň nomeriňiz (tassyklama üçin)</label>
            <input className="form-control" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+993 XX XXXXXX" />
          </div>
          {loading ? <PremiumSpinner /> : (
            <button className="btn-primary btn-block" onClick={handlePay}>
              <i className="fas fa-check"></i> Töleg geçirdim
            </button>
          )}
          <button className="btn-secondary btn-block" style={{ marginTop: 10 }} onClick={() => setShowPayment(false)}>
            <i className="fas fa-arrow-left"></i> Yza
          </button>
        </>
      )}
    </div>
  );
}

function BonusSellSection() {
  const { balance, deviceId } = useBonusPul();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSell() {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { alert("Mukdary giriziň!"); return; }
    if (amt > balance) { alert(`Ýeterlik bonus pul ýok. Balansyňyz: ${balance} BP`); return; }
    if (!phone.trim()) { alert("Nomeriňizi giriziň!"); return; }
    setLoading(true);
    try {
      await saveOrder("bonus-sell-orders", { deviceId, amount: amt, userPhone: phone, status: "pending" });
      setDone(true);
      toast("Satmak haýyşnamasy iberildi!", "success");
    } catch { toast("Ýalňyşlyk", "error"); }
    finally { setLoading(false); }
  }

  if (done) return (
    <div className="alert-success animate-in">
      <div className="success-icon-wrap"><CheckCircleIcon size={30} strokeWidth={1.6} /></div>
      <h3 style={{ color: "var(--primary)", marginBottom: 10 }}>Haýyşnama kabul edildi!</h3>
      <p>Siziň bonus pul satmak haýyşnamaňyz kabul edildi. Iň gysga wagtda işleniler.</p>
    </div>
  );

  return (
    <div className="animate-in">
      <h3 style={{ color: "var(--primary)", marginBottom: 6, fontSize: "1.1rem" }}>
        <i className="fas fa-exchange-alt"></i> Bonus pul satmak
      </h3>
      <p style={{ marginBottom: 20, opacity: 0.75, fontSize: "0.9rem" }}>Bonus puluňyzy TMT'a öwrüp bilersiňiz.</p>
      <div className="alert-info">
        <p><i className="fas fa-wallet" style={{ color: "var(--primary)" }}></i> Häzirki balansyňyz: <strong style={{ color: "var(--primary)" }}>{balance} BP</strong></p>
      </div>
      <div className="form-group" style={{ marginTop: 16 }}>
        <label><i className="fas fa-coins"></i> Satmak üçin mukdar (BP)</label>
        <input className="form-control" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Meseläň: 100" min="1" max={balance} />
      </div>
      <div className="form-group">
        <label><i className="fas fa-phone"></i> TMT alynjak nomer</label>
        <input className="form-control" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+993 XX XXXXXX" />
      </div>
      {loading ? <PremiumSpinner /> : (
        <button className="btn-primary btn-block" onClick={handleSell}>
          <i className="fas fa-paper-plane"></i> Haýyşnama ibermek
        </button>
      )}
    </div>
  );
}

function CurrencySection() {
  const [mode, setMode] = useState<"buy" | "sell">("buy");
  const [crypto, setCrypto] = useState("payeer");
  const [currency, setCurrency] = useState("usd");
  const [amount, setAmount] = useState("");
  const [walletId, setWalletId] = useState("");
  const [phone, setPhone] = useState("");
  const [secretCode, setSecretCode] = useState("");
  const [proofType, setProofType] = useState<"screenshot" | "sms" | null>(null);
  const [smsText, setSmsText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { toast } = useToast();

  function calcTotal() {
    const amt = parseFloat(amount) || 0;
    if (mode === "buy") {
      if (crypto === "payeer") return currency === "usd" ? amt * 29 : (amt / 90) * 29;
      return amt * 29;
    } else {
      if (crypto === "payeer") return currency === "usd" ? amt * 19 : (amt / 50) * 10;
      return amt * 19;
    }
  }

  async function handleSubmit() {
    if (!amount || !phone) { alert("Ähli meýdançalary dolduryň!"); return; }
    setLoading(true);
    try {
      let screenshotUrl = null;
      if (file) {
        const formData = new FormData();
        formData.append("screenshot", file);
        const res = await fetch("/api/upload-screenshot", { method: "POST", body: formData });
        if (res.ok) { const d = await res.json(); screenshotUrl = d.secure_url; }
      }
      await saveOrder("orders", { type: mode === "buy" ? "pay-buy" : "pay-sell", crypto, currency, amount: parseFloat(amount), totalPrice: calcTotal(), phone, walletId, secretCode, proofType, smsText, screenshotUrl });
      setDone(true);
      toast("Haýyşnama iberildi!", "success");
    } catch { toast("Ýalňyşlyk", "error"); }
    finally { setLoading(false); }
  }

  if (done) return (
    <div className="alert-success animate-in">
      <div className="success-icon-wrap"><TrophyIcon size={30} strokeWidth={1.6} /></div>
      <h3 style={{ color: "var(--primary)", marginBottom: 10 }}>Üstünlikli!</h3>
      <p>Iň tiz wagtda Ýeňil siz bilen baglanar.</p>
      <button className="btn-secondary" style={{ marginTop: 16 }} onClick={() => setDone(false)}>Täzeden</button>
    </div>
  );

  return (
    <div className="animate-in">
      <div className="tabs">
        <button className={`tab-btn${mode === "buy" ? " active" : ""}`} onClick={() => setMode("buy")}>
          <i className="fas fa-arrow-down"></i> Satyn almak
        </button>
        <button className={`tab-btn${mode === "sell" ? " active" : ""}`} onClick={() => setMode("sell")}>
          <i className="fas fa-arrow-up"></i> Satmak
        </button>
      </div>

      <div className="alert-info">
        <p><strong>1 USD = {mode === "buy" ? "29" : "19"} TMT</strong> · Payeer, Perfect Money, WebMoney</p>
      </div>

      <div className="form-group" style={{ marginTop: 16 }}>
        <label><i className="fas fa-coins"></i> Töleg görnüşi</label>
        <select className="form-control" value={crypto} onChange={e => setCrypto(e.target.value)}>
          <option value="payeer">Payeer</option>
          <option value="perfect">Perfect Money</option>
          <option value="webmoney">WebMoney</option>
        </select>
      </div>
      {crypto === "payeer" && (
        <div className="form-group">
          <label><i className="fas fa-money-bill"></i> Walýuta</label>
          <select className="form-control" value={currency} onChange={e => setCurrency(e.target.value)}>
            <option value="usd">USD ($)</option>
            <option value="rub">RUB (₽)</option>
          </select>
        </div>
      )}
      <div className="form-group">
        <label><i className="fas fa-calculator"></i> Mukdar</label>
        <input className="form-control" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
      </div>
      <div className="form-group">
        <label><i className="fas fa-wallet"></i> Wallet ID</label>
        <input className="form-control" type="text" value={walletId} onChange={e => setWalletId(e.target.value)} placeholder={crypto === "payeer" ? "P1234567890" : crypto === "perfect" ? "U1234567890" : "Z123456789012"} />
      </div>
      <div className="form-group">
        <label><i className="fas fa-phone"></i> Telefon nomeriňiz</label>
        <input className="form-control" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+993 XX XXXXXX" />
      </div>
      {mode === "sell" && (
        <div className="form-group">
          <label><i className="fas fa-key"></i> Gizlin kod (biz ibereris)</label>
          <input className="form-control" type="text" value={secretCode} onChange={e => setSecretCode(e.target.value)} placeholder="Gizlin kod" />
        </div>
      )}

      <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--primary)", textAlign: "center", background: "rgba(13,148,136,0.08)", borderRadius: "var(--radius-sm)", padding: "16px", marginBottom: 16 }}>
        {calcTotal().toFixed(2)} TMT
      </div>

      {mode === "buy" && <PaymentNumbers total={calcTotal()} />}
      {mode === "sell" && (
        <div className="payment-numbers">
          <p style={{ fontWeight: 700, color: "var(--primary)" }}><i className="fas fa-info-circle"></i> Siz şu ID-a pul ibermeli:</p>
          <div className="payment-number"><i className="fas fa-wallet"></i> P1115509057</div>
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <label style={{ fontWeight: 600, display: "block", marginBottom: 10, color: "var(--primary)" }}>
          <i className="fas fa-check-circle"></i> Tölegi tassyklaň
        </label>
        <div style={{ display: "flex", gap: 12 }}>
          {(["screenshot", "sms"] as const).map(t => (
            <div key={t} onClick={() => setProofType(t)} style={{ flex: 1, padding: 14, border: `2px solid ${proofType === t ? "var(--primary)" : "rgba(13,148,136,0.15)"}`, borderRadius: "var(--radius-sm)", cursor: "pointer", textAlign: "center", background: proofType === t ? "rgba(13,148,136,0.08)" : "transparent", transition: "all 0.3s" }}>
              <i className={`fas ${t === "screenshot" ? "fa-camera" : "fa-sms"}`} style={{ color: "var(--primary)", display: "block", marginBottom: 4, fontSize: "1.3rem" }}></i>
              <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{t === "screenshot" ? "Skrinshot" : "SMS"}</span>
            </div>
          ))}
        </div>
        {proofType === "sms" && (
          <textarea className="form-control" style={{ marginTop: 12 }} rows={3} value={smsText} onChange={e => setSmsText(e.target.value)} placeholder="SMS haty ýazyň..." />
        )}
        {proofType === "screenshot" && (
          <div style={{ marginTop: 12 }}>
            <label htmlFor="currency-file" style={{ cursor: "pointer", display: "block", border: "2px dashed rgba(13,148,136,0.3)", borderRadius: "var(--radius-sm)", padding: 16, textAlign: "center" }}>
              <i className="fas fa-cloud-upload-alt" style={{ fontSize: "2rem", color: "var(--primary)", display: "block", marginBottom: 8 }}></i>
              <span style={{ color: "var(--primary)", fontWeight: 600 }}>Skrinshot saýlaň</span>
            </label>
            <input type="file" id="currency-file" accept="image/*" style={{ display: "none" }} onChange={e => {
              const f = e.target.files?.[0];
              if (!f) return;
              setFile(f);
              const r = new FileReader();
              r.onload = ev => setPreview(ev.target?.result as string);
              r.readAsDataURL(f);
            }} />
            {preview && <img src={preview} alt="prev" style={{ maxWidth: "100%", maxHeight: 180, borderRadius: 10, marginTop: 10 }} />}
          </div>
        )}
      </div>

      {loading ? <PremiumSpinner /> : (
        <button className="btn-primary btn-block" style={{ marginTop: 20 }} onClick={handleSubmit}>
          <i className="fas fa-paper-plane"></i> Göýbermek
        </button>
      )}
    </div>
  );
}

function SimSection() {
  const [operator, setOperator] = useState<string | null>(null);
  const [simPhone, setSimPhone] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const [payPhone, setPayPhone] = useState("");
  const [payMethod, setPayMethod] = useState<"terminal" | "bonus" | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { balance, deviceId, deduct } = useBonusPul();
  const { toast } = useToast();

  const tmt = selected ? (selected * UZS_RATE).toFixed(1) : "—";

  async function handlePay() {
    if (!simPhone || !selected || !operator || !payMethod) { alert("Ähli meýdançalary dolduryň!"); return; }
    setLoading(true);
    try {
      const tmtAmount = parseFloat(tmt);
      if (payMethod === "bonus") {
        if (balance < tmtAmount) {
          alert(`Ýeterlik bonus pul ýok. Balansyňyz: ${balance} BP. Gerekli: ${tmtAmount} BP`);
          setLoading(false);
          return;
        }
        const ok = await deduct(tmtAmount);
        if (!ok) { alert("Bonus pul aýyrmak başartmady!"); setLoading(false); return; }
      }
      await saveOrder("sim-topup-orders", { operator, simPhone, amount: selected, tmtAmount, payMethod, payPhone: payMethod === "terminal" ? payPhone : undefined, deviceId, status: "pending" });
      setDone(true);
      toast("SIM kart töleg haýyşnamasy iberildi!", "success");
    } catch { toast("Ýalňyşlyk", "error"); }
    finally { setLoading(false); }
  }

  if (done) return (
    <div className="alert-success animate-in">
      <div className="success-icon-wrap"><SmartphoneIcon size={30} strokeWidth={1.6} /></div>
      <h3 style={{ color: "var(--primary)", marginBottom: 10 }}>Üstünlikli!</h3>
      <p>SIM kart töleg haýyşnamaňyz kabul edildi. Iň gysga wagtda işleniler.</p>
      <button className="btn-secondary" style={{ marginTop: 16 }} onClick={() => { setDone(false); setOperator(null); setSelected(null); setShowPayment(false); }}>Täzeden</button>
    </div>
  );

  return (
    <div className="animate-in">
      <h3 style={{ color: "var(--primary)", marginBottom: 6, fontSize: "1.1rem" }}>
        <i className="fas fa-sim-card"></i> Özbegistan SIM kartlaryna pul goýmak
      </h3>
      <p style={{ marginBottom: 20, opacity: 0.75, fontSize: "0.9rem" }}>Özbegistanyň ähli operatorlarynyň SIM kartalaryna pul geçirip bilýärsiňiz.</p>

      {!operator ? (
        <>
          <p style={{ fontWeight: 600, marginBottom: 12, color: "var(--primary)" }}>Operatoryňyzy saýlaň:</p>
          <div className="operator-cards">
            {UZ_OPERATORS.map(op => (
              <div key={op.id} className="operator-card" onClick={() => setOperator(op.id)}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: op.color, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", boxShadow: `0 6px 16px ${op.color}40` }}>
                  <i className={`fas ${op.icon}`} style={{ color: "white", fontSize: "1.3rem" }}></i>
                </div>
                <p style={{ fontWeight: 700, fontSize: "0.85rem" }}>{op.name}</p>
              </div>
            ))}
          </div>
        </>
      ) : !showPayment ? (
        <>
          <button className="back-link" onClick={() => setOperator(null)}>
            <i className="fas fa-arrow-left"></i> Operator saýlamak
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "rgba(13,148,136,0.08)", borderRadius: "var(--radius-sm)", marginBottom: 20 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: UZ_OPERATORS.find(o => o.id === operator)?.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <i className="fas fa-signal" style={{ color: "white" }}></i>
            </div>
            <span style={{ fontWeight: 700 }}>{UZ_OPERATORS.find(o => o.id === operator)?.name}</span>
          </div>
          <div className="form-group">
            <label><i className="fas fa-mobile-alt"></i> Özbegistan telefon nomeri</label>
            <input className="form-control" type="tel" value={simPhone} onChange={e => setSimPhone(e.target.value)} placeholder="+998 XX XXX XX XX" />
          </div>
          <div className="form-group">
            <label><i className="fas fa-coins"></i> Mukdary saýlaň (UZS)</label>
            <div className="price-cards">
              {UZS_AMOUNTS.map(a => (
                <div key={a} className={`price-card${selected === a ? " selected" : ""}`} onClick={() => setSelected(a)}>
                  <div className="price-card-amount">{a >= 1000 ? (a / 1000) + "K" : a}</div>
                  <div className="price-card-label">UZS ≈ {(a * UZS_RATE).toFixed(1)} TMT</div>
                </div>
              ))}
            </div>
          </div>
          {selected && <div className="alert-info"><p>Tölenjek mukdar: <strong style={{ color: "var(--primary)" }}>{tmt} TMT</strong></p></div>}
          <button className="btn-primary btn-block" style={{ marginTop: 16 }} disabled={!simPhone || !selected} onClick={() => setShowPayment(true)}>
            <i className="fas fa-arrow-right"></i> Töleg usulyny saýlaň
          </button>
        </>
      ) : (
        <>
          <button className="back-link" onClick={() => setShowPayment(false)}>
            <i className="fas fa-arrow-left"></i> Yza
          </button>
          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            {(["terminal", "bonus"] as const).map(m => (
              <div key={m} onClick={() => setPayMethod(m)} style={{ flex: 1, padding: 16, border: `2px solid ${payMethod === m ? "var(--primary)" : "rgba(13,148,136,0.15)"}`, borderRadius: "var(--radius-sm)", cursor: "pointer", textAlign: "center", background: payMethod === m ? "rgba(13,148,136,0.08)" : "transparent", transition: "all 0.3s" }}>
                <i className={`fas ${m === "terminal" ? "fa-mobile-alt" : "fa-coins"}`} style={{ color: "var(--primary)", display: "block", fontSize: "1.5rem", marginBottom: 6 }}></i>
                <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>{m === "terminal" ? "TMCELL terminal" : `Bonus pul (${balance} BP)`}</span>
              </div>
            ))}
          </div>
          {payMethod === "terminal" && (
            <>
              <PaymentNumbers total={parseFloat(tmt)} />
              <div className="form-group">
                <label><i className="fas fa-phone"></i> Töleg geçirýän nomeriňiz</label>
                <input className="form-control" type="tel" value={payPhone} onChange={e => setPayPhone(e.target.value)} placeholder="+993 XX XXXXXX" />
              </div>
            </>
          )}
          {payMethod === "bonus" && (
            <div className="alert-info">
              <p>Bonus puluňyzdan <strong>{tmt} BP</strong> aýrylar.</p>
              {balance < parseFloat(tmt) && <p style={{ color: "#dc2626", marginTop: 6 }}>Ýeterlik bonus pul ýok!</p>}
            </div>
          )}
          {loading ? <PremiumSpinner /> : (
            <button className="btn-primary btn-block" style={{ marginTop: 16 }} disabled={!payMethod} onClick={handlePay}>
              <i className="fas fa-check"></i> Töleg geçirdim
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default function Tmcell() {
  const [tab, setTab] = useState<Tab>("bp-buy");
  const { balance } = useBonusPul();

  const tabs: Array<{ id: Tab; label: string; icon: string }> = [
    { id: "bp-buy", label: "BP Almak", icon: "fa-plus-circle" },
    { id: "bp-sell", label: "BP Satmak", icon: "fa-minus-circle" },
    { id: "currency", label: "Walýuta", icon: "fa-exchange-alt" },
    { id: "sim", label: "SIM Kart", icon: "fa-sim-card" },
  ];

  return (
    <div style={{ flex: 1, paddingBottom: 40 }}>
      <div style={{ background: "var(--gradient2)", color: "white", padding: "40px 20px 30px", textAlign: "center" }}>
        <div className="container">
          <div style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: 8 }}>
            <i className="fas fa-sim-card"></i> TMCell
          </div>
          <p style={{ opacity: 0.9, fontSize: "0.95rem" }}>
            Bonus pul satyn almak, satmak we daşary ýurt hyzmatlary
          </p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", borderRadius: 50, padding: "8px 18px", marginTop: 16 }}>
            <WalletIcon size={16} strokeWidth={2} />
            <span style={{ fontWeight: 700 }}>{balance.toFixed(2)} BP</span>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 30 }}>
        <Link href="/" className="back-link">
          <i className="fas fa-arrow-left"></i> Baş sahypa
        </Link>

        <div className="glass-card" style={{ padding: 24 }}>
          <div className="tabs">
            {tabs.map(t => (
              <button key={t.id} className={`tab-btn${tab === t.id ? " active" : ""}`} onClick={() => setTab(t.id)}>
                <i className={`fas ${t.icon}`} style={{ marginRight: 6 }}></i>{t.label}
              </button>
            ))}
          </div>

          {tab === "bp-buy" && <BonusBuySection />}
          {tab === "bp-sell" && <BonusSellSection />}
          {tab === "currency" && <CurrencySection />}
          {tab === "sim" && <SimSection />}
        </div>
      </div>
    </div>
  );
}
