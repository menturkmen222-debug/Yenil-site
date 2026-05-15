import { useState } from "react";
import { Link } from "wouter";
import { saveOrder } from "@/lib/firebase";
import { useBonusPul } from "@/contexts/BonusPulContext";
import { useToast } from "@/components/Toast";

const ADMIN_PHONES = ["+993 71 789091", "+993 64 629487", "+993 71 788546"];

interface AppService {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  planType: "subscription" | "topup";
  plans: Array<{ label: string; amount: number }>;
  inputLabel: string;
  firebaseKey: string;
}

const APPS: AppService[] = [
  {
    id: "aydym",
    name: "Aydym.com",
    icon: "fa-music",
    color: "#7c3aed",
    description: "Aydym.com-da Premium hasap açmak isleseňiz, 3-den 12 aýa çenli açdyryp bilýäňiz. Premium artykmaçlyklary: reklamasyz diňlemek, internetsiz diňlemek, pleýlist internetsiz diňlemek, premium şekilli aýdymlar.",
    planType: "subscription",
    plans: [
      { label: "3 aýlyk", amount: 40 },
      { label: "6 aýlyk", amount: 60 },
      { label: "12 aýlyk", amount: 100 },
    ],
    inputLabel: "Aýdym.com-da ulanýan telefon nomeriňiz",
    firebaseKey: "aydym",
  },
  {
    id: "hinlen",
    name: "Hiňlen",
    icon: "fa-headphones",
    color: "#db2777",
    description: "Hiňlen-de Premium hasap açmak isleseňiz, 1-den 12 aýa çenli açdyryp bilýäňiz. Premium bilen aýdymlary reklamasyz we internetsiz diňläp bilersiňiz.",
    planType: "subscription",
    plans: [
      { label: "1 aýlyk", amount: 25 },
      { label: "3 aýlyk", amount: 45 },
      { label: "6 aýlyk", amount: 65 },
      { label: "12 aýlyk", amount: 100 },
    ],
    inputLabel: "Hiňlen-de ulanýan telefon nomeriňiz",
    firebaseKey: "hinlen",
  },
  {
    id: "belet-film",
    name: "Belet film",
    icon: "fa-film",
    color: "#dc2626",
    description: "Belet film-de hasabyňyza pul salyp bilýäňiz. Islän filmlerinizi we seriallaryňyzy rahatlyk bilen tomaşa ediň.",
    planType: "topup",
    plans: [
      { label: "30 TMT", amount: 30 },
      { label: "100 TMT", amount: 100 },
      { label: "200 TMT", amount: 200 },
    ],
    inputLabel: "Belet film hasabyňyzdaky telefon nomeriňiz",
    firebaseKey: "belet-film",
  },
  {
    id: "belet-music",
    name: "Belet music",
    icon: "fa-compact-disc",
    color: "#0284c7",
    description: "Belet music-de hasabyňyza pul salyp bilýäňiz. Iň köp diňlenilýän aýdymlary premium hil bilen diňläň.",
    planType: "topup",
    plans: [
      { label: "30 TMT", amount: 30 },
      { label: "100 TMT", amount: 100 },
      { label: "200 TMT", amount: 200 },
    ],
    inputLabel: "Belet music hasabyňyzdaky telefon nomeriňiz",
    firebaseKey: "belet-music",
  },
];

function PremiumSpinner() {
  return <div style={{ textAlign: "center", padding: 24 }}><div className="spinner"></div></div>;
}

function AppPaymentFlow({ app, onBack }: { app: AppService; onBack: () => void }) {
  const [plan, setPlan] = useState<{ label: string; amount: number } | null>(null);
  const [userPhone, setUserPhone] = useState("");
  const [payPhone, setPayPhone] = useState("");
  const [payMethod, setPayMethod] = useState<"terminal" | "bonus" | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { balance, deviceId, deduct } = useBonusPul();
  const { toast } = useToast();

  async function handleSubmit() {
    if (!plan || !userPhone.trim()) { alert("Ähli meýdançalary dolduryň!"); return; }
    if (!payMethod) { alert("Töleg usulyny saýlaň!"); return; }
    if (payMethod === "terminal" && !payPhone.trim()) { alert("Töleg nomeriňizi giriziň!"); return; }
    setLoading(true);
    try {
      if (payMethod === "bonus") {
        if (balance < plan.amount) {
          alert(`Ýeterlik bonus pul ýok. Balansyňyz: ${balance} BP. Gerekli: ${plan.amount} BP`);
          setLoading(false); return;
        }
        const ok = await deduct(plan.amount);
        if (!ok) { alert("Bonus pul aýyrmak başartmady!"); setLoading(false); return; }
      }
      await saveOrder("app-payments", { app: app.firebaseKey, plan: plan.label, amount: plan.amount, userPhone, paymentPhone: payMethod === "terminal" ? payPhone : undefined, paymentMethod: payMethod, deviceId, status: "pending" });
      setDone(true);
      toast("🎉 Üstünlikli ýerine ýetdiňiz!", "success");
    } catch { toast("Ýalňyşlyk", "error"); }
    finally { setLoading(false); }
  }

  if (done) return (
    <div className="alert-success animate-in">
      <div style={{ fontSize: "3rem", marginBottom: 12 }}>🎉</div>
      <h3 style={{ color: "var(--primary)", marginBottom: 10 }}>Üstünlikli ýerine ýetdiňiz!</h3>
      <p>Iň tiz wagtda barlanar we size habar berler.</p>
      <div style={{ display: "flex", gap: 12, marginTop: 20, justifyContent: "center", flexWrap: "wrap" }}>
        <button className="btn-secondary" onClick={() => { setDone(false); setPlan(null); setShowPayment(false); }}>
          <i className="fas fa-redo"></i> Täzeden
        </button>
        <Link href="/">
          <button className="btn-primary"><i className="fas fa-home"></i> Baş sahypa</button>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="animate-in">
      <button className="back-link" onClick={onBack} style={{ marginBottom: 16, background: "none", border: "none" }}>
        <i className="fas fa-arrow-left"></i> Yza
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <div style={{ width: 52, height: 52, borderRadius: 16, background: app.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 6px 16px ${app.color}40` }}>
          <i className={`fas ${app.icon}`} style={{ color: "white", fontSize: "1.4rem" }}></i>
        </div>
        <div>
          <h3 style={{ color: "var(--primary)", fontSize: "1.1rem" }}>{app.name} töleg</h3>
        </div>
      </div>

      <div className="alert-info" style={{ marginBottom: 20 }}>
        <p style={{ fontSize: "0.9rem", lineHeight: 1.6 }}>{app.description}</p>
      </div>

      {!showPayment ? (
        <>
          <label style={{ fontWeight: 700, display: "block", marginBottom: 12, color: "var(--primary)" }}>
            <i className="fas fa-tags"></i> Möçberi saýlaň:
          </label>
          <div className="price-cards">
            {app.plans.map(p => (
              <div key={p.label} className={`price-card${plan?.label === p.label ? " selected" : ""}`} onClick={() => setPlan(p)}>
                <div className="price-card-amount">{p.amount}<span style={{ fontSize: "0.8rem" }}> TMT</span></div>
                <div className="price-card-label">{p.label}</div>
              </div>
            ))}
          </div>

          <div className="form-group" style={{ marginTop: 20 }}>
            <label><i className="fas fa-phone"></i> {app.inputLabel}</label>
            <input className="form-control" type="tel" value={userPhone} onChange={e => setUserPhone(e.target.value)} placeholder="+993 XX XXXXXX" />
          </div>

          <button className="btn-primary btn-block" style={{ marginTop: 16 }} disabled={!plan || !userPhone} onClick={() => setShowPayment(true)}>
            <i className="fas fa-arrow-right"></i> Töleg usulyna geçmek
          </button>
        </>
      ) : (
        <>
          <div className="alert-info" style={{ marginBottom: 16 }}>
            <p><strong>{plan?.label}</strong> — <strong style={{ color: "var(--primary)" }}>{plan?.amount} TMT</strong></p>
            <p style={{ fontSize: "0.85rem", marginTop: 4, opacity: 0.75 }}>Nomer: {userPhone}</p>
          </div>

          <label style={{ fontWeight: 700, display: "block", marginBottom: 12, color: "var(--primary)" }}>
            <i className="fas fa-credit-card"></i> Töleg usulyny saýlaň:
          </label>
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
              <div className="payment-numbers">
                <p style={{ fontWeight: 700, marginBottom: 10, color: "var(--primary)" }}>
                  <i className="fas fa-exclamation-circle"></i> Şu nomerleriň birine <strong>{plan?.amount} TMT</strong> geçirmeli:
                </p>
                {ADMIN_PHONES.map(p => (
                  <div className="payment-number" key={p}><i className="fas fa-phone-alt"></i> {p}</div>
                ))}
              </div>
              <div className="form-group" style={{ marginTop: 12 }}>
                <label><i className="fas fa-phone"></i> Bize töleg geçirjek nomeriňiz</label>
                <input className="form-control" type="tel" value={payPhone} onChange={e => setPayPhone(e.target.value)} placeholder="+993 XX XXXXXX" />
              </div>
            </>
          )}

          {payMethod === "bonus" && balance < (plan?.amount || 0) && (
            <div className="alert-error">
              <p><i className="fas fa-exclamation-triangle"></i> Ýeterlik bonus puluňyz ýok. Balansyňyz: <strong>{balance} BP</strong>. Gerekli: <strong>{plan?.amount} BP</strong></p>
              <Link href="/tmcell"><button className="btn-primary" style={{ marginTop: 10, padding: "10px 20px", fontSize: "0.85rem" }}>Bonus pul almak</button></Link>
            </div>
          )}

          {loading ? <PremiumSpinner /> : (
            <button className="btn-primary btn-block" style={{ marginTop: 16 }} onClick={handleSubmit}>
              <i className="fas fa-check"></i> Töleg geçirdim — Tassyklamak
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

export default function Ulgamlar() {
  const [activeApp, setActiveApp] = useState<AppService | null>(null);

  return (
    <div style={{ flex: 1, paddingBottom: 40 }}>
      <div style={{ background: "var(--gradient2)", color: "white", padding: "40px 20px 30px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-opacity='0.04'%3E%3Cpath d='M20 20c0-11 9-20 20-20v40C29 40 20 31 20 20z'/%3E%3C/g%3E%3C/svg%3E\")" }}></div>
        <div className="container" style={{ position: "relative" }}>
          <div style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: 8 }}>
            <i className="fas fa-th-large"></i> Içerki ulgamlar
          </div>
          <p style={{ opacity: 0.9, maxWidth: 600, margin: "0 auto" }}>
            Türkmenistanyň sosial ulgamlaryna TMCELL üsti bilen töleg
          </p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 30 }}>
        <Link href="/" className="back-link">
          <i className="fas fa-arrow-left"></i> Baş sahypa
        </Link>

        {!activeApp ? (
          <>
            <div className="alert-info" style={{ marginBottom: 24 }}>
              <p style={{ fontSize: "0.9rem", lineHeight: 1.6 }}>
                <i className="fas fa-info-circle" style={{ color: "var(--primary)", marginRight: 8 }}></i>
                Häzirki ösüp barýan döwürde siziň gündelik durmuşda ulanýan sosial ulgamlaryňyz sizden doly funksialary işletmek we reklamalary ýatyrmak üçin sizden pul soraýamy? Onda bu ýer size gerekli ýer! Biziň goldaýan ulgamlarymyz:
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
              {APPS.map((app, i) => (
                <div key={app.id} className="app-card animate-in" style={{ animationDelay: `${i * 0.1}s` }} onClick={() => setActiveApp(app)}>
                  <div className="app-card-icon" style={{ background: app.color }}>
                    <i className={`fas ${app.icon}`}></i>
                  </div>
                  <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 6 }}>{app.name}</h3>
                  <p style={{ fontSize: "0.8rem", opacity: 0.65, lineHeight: 1.5 }}>
                    {app.planType === "subscription" ? "Premium abonement" : "Hasaby doldurmak"}
                  </p>
                  <div style={{ marginTop: 12, display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
                    {app.plans.slice(0, 3).map(p => (
                      <span key={p.label} style={{ background: "rgba(13,148,136,0.1)", color: "var(--primary)", borderRadius: 50, padding: "2px 10px", fontSize: "0.75rem", fontWeight: 600 }}>{p.amount} TMT</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="glass-card" style={{ padding: 24 }}>
            <AppPaymentFlow app={activeApp} onBack={() => setActiveApp(null)} />
          </div>
        )}
      </div>
    </div>
  );
}
