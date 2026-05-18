import { useState } from "react";
import { Link } from "wouter";
import { useBonusPul } from "@/contexts/BonusPulContext";
import { useToast } from "@/components/Toast";

const BACKENDLESS_URL = `https://api.backendless.com/C3BB5032-1DCC-4DB3-888F-AEDA785F26CB/9A8CACA4-5889-4D47-903E-BF12F059E175`;
const PAYMENT_NUMBERS = ["+993 71 789091", "+993 64 629487", "+993 71 788546"];

function PremiumSpinner() {
  return (
    <div style={{ position: "relative", width: 50, height: 50, margin: "0 auto", animation: "spin 1.2s linear infinite" }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "4px solid transparent", borderTop: "4px solid var(--primary)", borderRadius: "50%", animation: "spin 1.2s linear infinite" }}></div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

type PaySection = "main" | "buy-form" | "buy-payment" | "sell-form" | "sell-payment" | "success";
type CryptoType = "payeer" | "perfect" | "webmoney" | "";

export default function Pay() {
  const { balance, deduct, deviceId } = useBonusPul();
  const { toast } = useToast();
  const [section, setSection] = useState<PaySection>("main");
  const [mode, setMode] = useState<"buy" | "sell">("buy");

  // Buy state
  const [buyCrypto, setBuyCrypto] = useState<CryptoType>("payeer");
  const [buyCurrency, setBuyCurrency] = useState("usd");
  const [buyAmount, setBuyAmount] = useState("");
  const [buyPayeerId, setBuyPayeerId] = useState("");
  const [buyPerfectId, setBuyPerfectId] = useState("");
  const [buyWebmoneyId, setBuyWebmoneyId] = useState("");
  const [buyPhone, setBuyPhone] = useState("");
  const [buyProof, setBuyProof] = useState<"screenshot" | "sms" | null>(null);
  const [buySmsText, setBuySmsText] = useState("");
  const [buyFile, setBuyFile] = useState<File | null>(null);
  const [buyPreview, setBuyPreview] = useState<string | null>(null);
  const [buyLoading, setBuyLoading] = useState(false);
  const [buyError, setBuyError] = useState("");

  // Sell state
  const [sellCrypto, setSellCrypto] = useState<CryptoType>("payeer");
  const [sellCurrency, setSellCurrency] = useState("usd");
  const [sellAmount, setSellAmount] = useState("");
  const [sellPayeerId, setSellPayeerId] = useState("");
  const [sellPerfectId, setSellPerfectId] = useState("");
  const [sellWebmoneyId, setSellWebmoneyId] = useState("");
  const [sellPhone, setSellPhone] = useState("");
  const [secretCode, setSecretCode] = useState("");
  const [sellProof, setSellProof] = useState<"screenshot" | "sms" | null>(null);
  const [sellSmsText, setSellSmsText] = useState("");
  const [sellFile, setSellFile] = useState<File | null>(null);
  const [sellPreview, setSellPreview] = useState<string | null>(null);
  const [sellLoading, setSellLoading] = useState(false);
  const [sellError, setSellError] = useState("");

  function calcBuyTotal() {
    const amt = parseFloat(buyAmount) || 0;
    if (buyCrypto === "payeer") {
      if (buyCurrency === "usd") return amt * 29;
      if (buyCurrency === "rub") return (amt / 90) * 29;
    }
    if (buyCrypto === "perfect" || buyCrypto === "webmoney") return amt * 29;
    return 0;
  }

  function calcSellTotal() {
    const amt = parseFloat(sellAmount) || 0;
    if (sellCrypto === "payeer") {
      if (sellCurrency === "usd") return amt * 19;
      if (sellCurrency === "rub") return (amt / 50) * 10;
    }
    if (sellCrypto === "perfect" || sellCrypto === "webmoney") return amt * 19;
    return 0;
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>, isSell: boolean) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (isSell) setSellFile(file); else setBuyFile(file);
    const reader = new FileReader();
    reader.onload = ev => {
      if (isSell) setSellPreview(ev.target?.result as string);
      else setBuyPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function uploadFile(file: File): Promise<string | null> {
    const formData = new FormData();
    formData.append("screenshot", file);
    const res = await fetch("/api/upload-screenshot", { method: "POST", body: formData });
    if (!res.ok) return null;
    const data = await res.json();
    return data.secure_url;
  }

  async function submitBuy() {
    if (!buyCrypto || !buyPhone || !buyProof) { alert("Ähli meýdançallary dolduryň!"); return; }
    if (buyProof === "screenshot" && !buyFile) { alert("Skrinshot ýüklemediňiz!"); return; }
    setBuyLoading(true);
    setBuyError("");
    try {
      let screenshotUrl = null;
      if (buyProof === "screenshot" && buyFile) screenshotUrl = await uploadFile(buyFile);
      const response = await fetch(`${BACKENDLESS_URL}/data/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "pay-buy", crypto: buyCrypto, currency: buyCurrency,
          amount: parseFloat(buyAmount) || 0, totalPrice: calcBuyTotal(), phone: buyPhone,
          payeerId: buyPayeerId, perfectId: buyPerfectId, webmoneyId: buyWebmoneyId,
          proofType: buyProof, smsText: buyProof === "sms" ? buySmsText : "", screenshotUrl,
          timestamp: new Date().toISOString(),
        }),
      });
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      setSection("success");
    } catch (err: any) {
      setBuyError("Ýalňyşlyk: " + (err.message || "Ýalňyşlyk"));
    } finally {
      setBuyLoading(false);
    }
  }

  async function submitSell() {
    if (!sellCrypto || !sellPhone || !secretCode || !sellProof) { alert("Ähli meýdançallary dolduryň!"); return; }
    if (sellProof === "screenshot" && !sellFile) { alert("Skrinshot saýlanmady!"); return; }
    setSellLoading(true);
    setSellError("");
    try {
      let screenshotUrl = null;
      if (sellProof === "screenshot" && sellFile) screenshotUrl = await uploadFile(sellFile);
      const response = await fetch(`${BACKENDLESS_URL}/data/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "pay-sell", crypto: sellCrypto, currency: sellCurrency,
          amount: parseFloat(sellAmount) || 0, totalPrice: calcSellTotal(), phone: sellPhone,
          secretCode, payeerId: sellPayeerId, perfectId: sellPerfectId, webmoneyId: sellWebmoneyId,
          proofType: sellProof, smsText: sellProof === "sms" ? sellSmsText : "", screenshotUrl,
          timestamp: new Date().toISOString(),
        }),
      });
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      setSection("success");
    } catch (err: any) {
      setSellError("Ýalňyşlyk: " + (err.message || "Bilinmeýýän ýalňyşlyk"));
    } finally {
      setSellLoading(false);
    }
  }

  const btnStyle: React.CSSProperties = {
    display: "block", width: "100%", padding: 18, background: "var(--gradient)",
    color: "white", border: "none", borderRadius: 14, fontSize: "1.2rem",
    fontWeight: 600, cursor: "pointer", marginTop: 25, fontFamily: "Poppins, sans-serif",
  };

  const contentStyle: React.CSSProperties = {
    background: "var(--card-light)", borderRadius: 24, padding: 25,
    boxShadow: "var(--shadow)", marginBottom: 25,
  };

  function FileUpload({ isSell }: { isSell: boolean }) {
    const preview = isSell ? sellPreview : buyPreview;
    return (
      <div style={{ marginTop: 15, textAlign: "center" }}>
        <label htmlFor={isSell ? "sell-file" : "buy-file"} style={{ cursor: "pointer", display: "block", border: "2px dashed var(--primary)", borderRadius: 12, padding: 20 }}>
          <i className="fas fa-image" style={{ fontSize: "3rem", color: "var(--primary)", display: "block", marginBottom: 10 }}></i>
          <p style={{ fontWeight: 600, color: "var(--primary)" }}>Suraty ýüklemek üçin üstünden basyň</p>
          <p style={{ fontSize: "0.9rem", color: "#f59e0b" }}>JPG, PNG, GIF (maksimum 5 MB)</p>
        </label>
        <input type="file" id={isSell ? "sell-file" : "buy-file"} accept="image/*" style={{ display: "none" }} onChange={e => handleFileChange(e, isSell)} />
        {preview && <img src={preview} alt="preview" style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 12, marginTop: 15 }} />}
      </div>
    );
  }

  function ProofSection({ isSell }: { isSell: boolean }) {
    const proof = isSell ? sellProof : buyProof;
    const setProof = isSell ? setSellProof : setBuyProof;
    const smsText = isSell ? sellSmsText : buySmsText;
    const setSms = isSell ? setSellSmsText : setBuySmsText;
    return (
      <>
        <h3 style={{ color: "var(--primary)", margin: "20px 0 15px" }}><i className="fas fa-check-circle"></i> Tölegi tassyklaň</h3>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", margin: "15px 0" }}>
          {(["screenshot", "sms"] as const).map(type => (
            <div key={type} onClick={() => setProof(type)} style={{ flex: 1, minWidth: 180, padding: 15, background: "var(--card-light)", borderRadius: 14, border: `2px solid ${proof === type ? "var(--primary)" : "#e2e8f0"}`, cursor: "pointer" }}>
              <input type="radio" checked={proof === type} onChange={() => setProof(type)} style={{ accentColor: "var(--primary)", marginRight: 10 }} />
              <i className={`fas ${type === "screenshot" ? "fa-camera" : "fa-sms"}`} style={{ color: "var(--primary)", marginRight: 8 }}></i>
              {type === "screenshot" ? "Skrinshot" : "SMS habary"}
            </div>
          ))}
        </div>
        {proof === "sms" && (
          <textarea rows={3} value={smsText} onChange={e => setSms(e.target.value)} placeholder="SMS haty şu ýere ýazyň..." style={{ marginTop: 10 }} />
        )}
        {proof === "screenshot" && <FileUpload isSell={isSell} />}
      </>
    );
  }

  function CryptoFields({ isSell }: { isSell: boolean }) {
    const crypto = isSell ? sellCrypto : buyCrypto;
    const setCrypto = isSell ? setSellCrypto : setBuyCrypto;
    const currency = isSell ? sellCurrency : buyCurrency;
    const setCurrency = isSell ? setSellCurrency : setBuyCurrency;
    const amount = isSell ? sellAmount : buyAmount;
    const setAmount = isSell ? setSellAmount : setBuyAmount;
    const payeerId = isSell ? sellPayeerId : buyPayeerId;
    const setPayeerId = isSell ? setSellPayeerId : setBuyPayeerId;
    const perfectId = isSell ? sellPerfectId : buyPerfectId;
    const setPerfectId = isSell ? setSellPerfectId : setBuyPerfectId;
    const webmoneyId = isSell ? sellWebmoneyId : buyWebmoneyId;
    const setWebmoneyId = isSell ? setSellWebmoneyId : setBuyWebmoneyId;
    const total = isSell ? calcSellTotal() : calcBuyTotal();

    return (
      <>
        <div style={{ margin: "20px 0" }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 10 }}>
            <i className="fas fa-coins" style={{ color: "var(--primary)", marginRight: 8 }}></i>
            Töleg görnüşi
          </label>
          <select value={crypto} onChange={e => setCrypto(e.target.value as CryptoType)}>
            <option value="payeer">Payeer</option>
            <option value="perfect">Perfect Money</option>
            <option value="webmoney">WebMoney</option>
          </select>
        </div>

        {crypto === "payeer" && (
          <>
            <div style={{ margin: "20px 0" }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 10 }}>
                <i className="fas fa-money-bill" style={{ color: "var(--primary)", marginRight: 8 }}></i>
                Walýuta
              </label>
              <select value={currency} onChange={e => setCurrency(e.target.value)}>
                <option value="usd">USD ($)</option>
                <option value="rub">RUB (₽)</option>
              </select>
            </div>
            <div style={{ margin: "20px 0" }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 10 }}>
                <i className="fas fa-calculator" style={{ color: "var(--primary)", marginRight: 8 }}></i>
                Näçe {currency === "usd" ? "USD" : "RUBL"} {isSell ? "satmakçysyňyz" : "almakçysyňyz"}?
              </label>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="1.00" min="1" step="0.01" />
            </div>
            <div style={{ margin: "20px 0" }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 10 }}>
                <i className="fas fa-wallet" style={{ color: "var(--primary)", marginRight: 8 }}></i>
                Payeer ID
              </label>
              <input type="text" value={payeerId} onChange={e => setPayeerId(e.target.value)} placeholder="P1234567890" />
            </div>
          </>
        )}

        {crypto === "perfect" && (
          <>
            <div style={{ margin: "20px 0" }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 10 }}>
                <i className="fas fa-calculator" style={{ color: "var(--primary)", marginRight: 8 }}></i>
                Näçe USD {isSell ? "satmakçysyňyz" : "almakçysyňyz"}?
              </label>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="1.00" min="1" step="0.01" />
            </div>
            <div style={{ margin: "20px 0" }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 10 }}>
                <i className="fas fa-wallet" style={{ color: "var(--primary)", marginRight: 8 }}></i>
                Perfect Money Account
              </label>
              <input type="text" value={perfectId} onChange={e => setPerfectId(e.target.value)} placeholder="U1234567890" />
            </div>
          </>
        )}

        {crypto === "webmoney" && (
          <>
            <div style={{ margin: "20px 0" }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 10 }}>
                <i className="fas fa-calculator" style={{ color: "var(--primary)", marginRight: 8 }}></i>
                Näçe USD {isSell ? "satmakçysyňyz" : "almakçysyňyz"}?
              </label>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="1.00" min="1" step="0.01" />
            </div>
            <div style={{ margin: "20px 0" }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 10 }}>
                <i className="fas fa-wallet" style={{ color: "var(--primary)", marginRight: 8 }}></i>
                WebMoney Wallet (WMZ)
              </label>
              <input type="text" value={webmoneyId} onChange={e => setWebmoneyId(e.target.value)} placeholder="Z123456789012" />
            </div>
          </>
        )}

        <div style={{ textAlign: "center", fontSize: "2rem", fontWeight: 700, color: "var(--primary)", margin: "25px 0", padding: 20, background: "rgba(13,148,136,0.1)", borderRadius: 20 }}>
          <i className="fas fa-money-bill-wave"></i> {total.toFixed(2)} TMT
        </div>
      </>
    );
  }

  return (
    <div style={{ flex: 1, padding: "40px 0" }}>
      <div className="container">
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", color: "var(--primary)", marginBottom: 20, fontWeight: 600, gap: 8 }}>
          <i className="fas fa-arrow-left"></i> Yza
        </Link>

        <div style={{ fontSize: "2.5rem", color: "var(--primary)", textAlign: "center", margin: "20px 0 25px" }}>
          <i className="fas fa-wallet"></i> Ýeňil Pay
        </div>

        {section === "main" && (
          <div style={contentStyle}>
            <h1 style={{ color: "var(--primary)", marginBottom: 20 }}>
              <i className="fas fa-exchange-alt"></i> Daşary ýurt walýutasy
            </h1>
            <div style={{ background: "linear-gradient(135deg, rgba(13,148,136,0.1), rgba(13,148,136,0.05))", padding: 20, borderRadius: 16, margin: "25px 0", borderLeft: "5px solid var(--primary)" }}>
              <p><i className="fas fa-info-circle" style={{ color: "var(--primary)" }}></i> Payeer, Perfect Money, WebMoney arkaly dollar, rubl alyş çalyş ediň.</p>
              <p><strong>1 USD = 29 TMT</strong> (satyn almak)</p>
              <p><strong>1 USD = 19 TMT</strong> (satmak)</p>
            </div>

            <div style={{ display: "flex", gap: 20, flexWrap: "wrap", margin: "25px 0" }}>
              <button
                style={{ ...btnStyle, flex: 1, marginTop: 0 }}
                onClick={() => { setMode("buy"); setSection("buy-form"); }}
              >
                <i className="fas fa-arrow-down"></i> Satyn almak (Almak)
              </button>
              <button
                style={{ ...btnStyle, flex: 1, marginTop: 0, background: "linear-gradient(135deg, #059669, #10b981)" }}
                onClick={() => { setMode("sell"); setSection("sell-form"); }}
              >
                <i className="fas fa-arrow-up"></i> Satmak (Bermek)
              </button>
            </div>
          </div>
        )}

        {section === "buy-form" && (
          <div style={contentStyle}>
            <h2 style={{ color: "var(--primary)", marginBottom: 20 }}>
              <i className="fas fa-arrow-down"></i> Satyn almak
            </h2>
            <CryptoFields isSell={false} />
            <div style={{ margin: "20px 0" }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 10 }}>
                <i className="fas fa-phone" style={{ color: "var(--primary)", marginRight: 8 }}></i>
                Siziň TMCELL nomeriňiz
              </label>
              <input type="tel" value={buyPhone} onChange={e => setBuyPhone(e.target.value)} placeholder="+993 XX XXXXXX" />
            </div>
            <div style={{ background: "rgba(13,148,136,0.1)", padding: 20, borderRadius: 14, margin: "20px 0", borderLeft: "4px solid var(--primary)" }}>
              <p><strong>Töleg nomerlerimiz:</strong></p>
              {PAYMENT_NUMBERS.map(n => <p key={n}><i className="fas fa-phone" style={{ color: "var(--primary)" }}></i> {n}</p>)}
              <p style={{ marginTop: 10 }}><strong>Jemi töleg: {calcBuyTotal().toFixed(2)} TMT</strong></p>
            </div>
            <ProofSection isSell={false} />
            {buyLoading && <div style={{ textAlign: "center", padding: 25 }}><PremiumSpinner /></div>}
            {buyError && <div style={{ background: "#fee", color: "#c33", padding: 15, borderRadius: 12, marginTop: 15, textAlign: "center" }}>{buyError}</div>}
            <button style={btnStyle} disabled={buyLoading} onClick={submitBuy}>
              <i className="fas fa-paper-plane"></i> Göýbermek we tassyklamak
            </button>
            <button style={{ ...btnStyle, background: "#94a3b8", marginTop: 10 }} onClick={() => setSection("main")}>
              <i className="fas fa-arrow-left"></i> Yza
            </button>
          </div>
        )}

        {section === "sell-form" && (
          <div style={contentStyle}>
            <h2 style={{ color: "var(--primary)", marginBottom: 20 }}>
              <i className="fas fa-arrow-up"></i> Satmak
            </h2>
            <CryptoFields isSell={true} />
            <div style={{ margin: "20px 0" }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 10 }}>
                <i className="fas fa-phone" style={{ color: "var(--primary)", marginRight: 8 }}></i>
                Siziň TMCELL nomeriňiz
              </label>
              <input type="tel" value={sellPhone} onChange={e => setSellPhone(e.target.value)} placeholder="+993 XX XXXXXX" />
            </div>
            <div style={{ margin: "20px 0" }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 10 }}>
                <i className="fas fa-key" style={{ color: "var(--primary)", marginRight: 8 }}></i>
                Gizlin kod (biz size ibereris)
              </label>
              <input type="text" value={secretCode} onChange={e => setSecretCode(e.target.value)} placeholder="Gizlin kod" />
            </div>
            <div style={{ background: "rgba(13,148,136,0.1)", padding: 20, borderRadius: 14, margin: "20px 0", borderLeft: "4px solid var(--primary)" }}>
              <p><strong>Size iberilýän walýuta ID:</strong></p>
              <p>P1115509057</p>
              <p style={{ marginTop: 10 }}><strong>Size iberiljek: {calcSellTotal().toFixed(2)} TMT</strong></p>
            </div>
            <ProofSection isSell={true} />
            {sellLoading && <div style={{ textAlign: "center", padding: 25 }}><PremiumSpinner /></div>}
            {sellError && <div style={{ background: "#fee", color: "#c33", padding: 15, borderRadius: 12, marginTop: 15, textAlign: "center" }}>{sellError}</div>}
            <button style={btnStyle} disabled={sellLoading} onClick={submitSell}>
              <i className="fas fa-check"></i> Tassyklamak we ibermek
            </button>
            <button style={{ ...btnStyle, background: "#94a3b8", marginTop: 10 }} onClick={() => setSection("main")}>
              <i className="fas fa-arrow-left"></i> Yza
            </button>
          </div>
        )}

        {section === "success" && (
          <div style={contentStyle}>
            <div style={{ textAlign: "center", padding: 25, background: "#f0fdf4", borderRadius: 24, margin: "25px 0", color: "#065f46" }}>
              <h2><i className="fas fa-trophy"></i> Üstünlikli!</h2>
              <p><i className="fas fa-clock"></i> Iň tiz wagtda Ýakyn siz bilen baglanar we size bron kody we bilet nusgasy berer.</p>
              <p><i className="fas fa-home"></i> Baş sahypa gaýtmagyňyz mümkin.</p>
            </div>
            <Link href="/" style={{ ...btnStyle, textAlign: "center", textDecoration: "none", display: "block" }}>
              <i className="fas fa-home"></i> Baş sahypa
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
