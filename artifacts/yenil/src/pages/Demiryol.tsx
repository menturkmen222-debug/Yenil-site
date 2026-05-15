import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";

const BACKENDLESS_URL = `https://api.backendless.com/C3BB5032-1DCC-4DB3-888F-AEDA785F26CB/9A8CACA4-5889-4D47-903E-BF12F059E175`;

const cityNames: Record<string, string> = {
  ashgabat: "Aşgabat",
  dashoguz: "Daşoguz",
  balkanabat: "Balkanabat",
  turkmenbasy: "Türkmenbaşy",
  mary: "Mary",
  lebap: "Lebap",
};

function PremiumSpinner() {
  return (
    <div style={{ position: "relative", width: 50, height: 50, margin: "0 auto", animation: "spin 1.2s linear infinite" }}>
      <div style={{
        position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
        border: "4px solid transparent", borderTop: "4px solid var(--primary)",
        borderRadius: "50%", animation: "spin 1.2s linear infinite", zIndex: 1,
      }}></div>
    </div>
  );
}

export default function Demiryol() {
  const [section, setSection] = useState<"info" | "form" | "payment" | "confirmation" | "success">("info");
  const [fromCity, setFromCity] = useState("ashgabat");
  const [toCity, setToCity] = useState("dashoguz");
  const [travelDate, setTravelDate] = useState("");
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [passport, setPassport] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [firstClass, setFirstClass] = useState(false);
  const [secondClass, setSecondClass] = useState(false);
  const [mediaPortal, setMediaPortal] = useState(false);
  const [proofType, setProofType] = useState<"screenshot" | "sms" | null>(null);
  const [smsText, setSmsText] = useState("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Ticket modal
  const [ticketModal, setTicketModal] = useState(false);
  const [bookingCode, setBookingCode] = useState("");
  const [ticketLoading, setTicketLoading] = useState(false);
  const [ticketError, setTicketError] = useState("");
  const [ticketResult, setTicketResult] = useState<any>(null);

  const today = new Date().toISOString().split("T")[0];
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 15);
  const maxDateStr = maxDate.toISOString().split("T")[0];

  function calculatePrice() {
    if (!travelDate) return 60;
    const travel = new Date(travelDate);
    const now = new Date();
    const diffDays = Math.ceil((travel.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    let base = 60;
    if (diffDays <= 1) base = 80;
    else if (diffDays <= 3) base = 70;
    let addons = 0;
    if (secondClass) addons += (diffDays <= 4) ? 10 : 5;
    if (mediaPortal) addons += 5;
    if (firstClass) addons += (diffDays <= 4) ? 15 : 10;
    return base + addons;
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshotFile(file);
    const reader = new FileReader();
    reader.onload = ev => setScreenshotPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function validateFields() {
    if (!name || !surname || !birthdate || !passport || !travelDate || !clientPhone) {
      alert("⚠️ Ähli meýdançalary dolduryň!");
      return false;
    }
    if (fromCity === toCity) {
      alert("⚠️ Nirden we Nira bir birinden tapawutly bolmaly!");
      return false;
    }
    if (!proofType) {
      alert("⚠️ Töleg tassyklamasyny saýlaň!");
      return false;
    }
    if (proofType === "sms" && !smsText.trim()) {
      alert("⚠️ SMS habary nusgasyny giriziň!");
      return false;
    }
    if (proofType === "screenshot" && !screenshotFile) {
      alert("⚠️ Skrinshot tanlanmady!");
      return false;
    }
    return true;
  }

  async function handleSubmitConfirm() {
    if (!validateFields()) return;
    setLoading(true);
    setError("");
    try {
      let screenshotUrl: string | null = null;
      if (proofType === "screenshot" && screenshotFile) {
        const formData = new FormData();
        formData.append("screenshot", screenshotFile);
        const res = await fetch("/api/upload-screenshot", { method: "POST", body: formData });
        if (res.ok) {
          const data = await res.json();
          screenshotUrl = data.secure_url;
        }
      }

      const orderData = {
        type: "demiryol",
        name, surname, passport, birthdate,
        route: `${fromCity}-${toCity}`,
        travelDate,
        totalPrice: calculatePrice(),
        clientPhone,
        proofType,
        smsText: proofType === "sms" ? smsText : null,
        screenshotUrl,
        firstClass, secondClass, mediaPortal,
        timestamp: new Date().toISOString(),
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      };

      const response = await fetch(`${BACKENDLESS_URL}/data/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      setSection("success");
    } catch (err: any) {
      setError("Ýalňyşlyk: " + (err.message || "Bilinmeýän ýalňyşlyk"));
    } finally {
      setLoading(false);
    }
  }

  async function searchTicket() {
    const code = bookingCode.trim().toUpperCase();
    if (!code || code.length !== 6 || !/^[A-Z0-9]{6}$/.test(code)) {
      alert("⚠️ Bron kody 6 belgi bolmaly (meselem: ABC123)");
      return;
    }
    setTicketLoading(true);
    setTicketError("");
    setTicketResult(null);
    try {
      const apiUrl = `/api/demiryol?id=${encodeURIComponent(code)}`;
      const response = await fetch(apiUrl, { headers: { Accept: "application/json" } });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server xatosi: ${response.status}`);
      }
      const result = await response.json();
      if (!result.data?.booking) throw new Error("⚠️ Bron kody tapylmady");
      setTicketResult(result.data.booking);
    } catch (err: any) {
      setTicketError("❌ " + (err.message || "Nätanyş ýalňyşlyk"));
    } finally {
      setTicketLoading(false);
    }
  }

  const totalPrice = calculatePrice();

  const btnStyle: React.CSSProperties = {
    display: "block",
    width: "100%",
    padding: "18px",
    background: "var(--gradient)",
    color: "white",
    border: "none",
    borderRadius: 14,
    fontSize: "1.2rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "transform 0.3s ease, opacity 0.3s ease",
    marginTop: 25,
    fontFamily: "Poppins, sans-serif",
  };

  const contentStyle: React.CSSProperties = {
    background: "var(--card-light)",
    borderRadius: 24,
    padding: 25,
    boxShadow: "var(--shadow)",
    marginBottom: 25,
    animation: "slideUp 0.6s ease",
  };

  return (
    <div style={{ flex: 1, padding: "40px 0" }}>
      <div className="container">
        {/* Print ticket button */}
        <button
          onClick={() => setTicketModal(true)}
          style={{
            position: "fixed",
            top: 10,
            right: 10,
            background: "var(--gradient)",
            color: "white",
            border: "none",
            borderRadius: 50,
            padding: "12px 20px",
            fontSize: "1rem",
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 6px 16px rgba(13,148,136,0.3)",
            zIndex: 9999,
          }}
        >
          <i className="fas fa-print"></i> Bilet çap etmek
        </button>

        <Link href="/" style={{ display: "inline-flex", alignItems: "center", color: "var(--primary)", marginBottom: 20, fontWeight: 600, gap: 8, transition: "transform 0.3s ease" }}>
          <i className="fas fa-arrow-left"></i> Yza
        </Link>

        <div style={{ fontSize: "2.5rem", color: "var(--primary)", textAlign: "center", margin: "20px 0 25px", animation: "pulseText 2s infinite" }}>
          <i className="fas fa-train"></i> Ýeňil demirýollary
        </div>

        {section === "info" && (
          <div style={contentStyle}>
            <div style={{ background: "linear-gradient(135deg, rgba(13,148,136,0.1), rgba(13,148,136,0.05))", padding: 20, borderRadius: 16, margin: "25px 0", borderLeft: "5px solid var(--primary)", fontSize: "1.05rem" }}>
              <p><i className="fas fa-info-circle" style={{ color: "var(--primary)" }}></i> <strong>Möhüm maglumat:</strong></p>
              <p>Bu hyzmat arkaly siz Türkmenistanyň demirýol biletlerini kart tölegsiz satyn alyp bilersiňiz.</p>
              <p><i className="fas fa-money-bill-wave" style={{ color: "var(--primary)" }}></i> Töleg öňünden geçirilýär.</p>
              <p><i className="fas fa-clock" style={{ color: "var(--primary)" }}></i> Bilet 1 sagadyň içinde SMS arkaly iberilýär.</p>
            </div>
            <div style={{ background: "#fef3c7", color: "#92400e", padding: 15, borderRadius: 14, margin: "20px 0", fontSize: "0.85rem", borderLeft: "4px solid #f59e0b" }}>
              <p><i className="fas fa-exclamation-circle"></i> <strong>Ýatlatma:</strong> Töleg edeniňizden soň 15 minut içinde sms zaýawka iberilmeli.</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 15, marginBottom: 20 }}>
              <input type="checkbox" id="read-info" style={{ width: 20, height: 20, accentColor: "var(--primary)" }} />
              <label htmlFor="read-info" style={{ fontWeight: 600 }}>Maglumatlary okap çykdym we razy</label>
            </div>
            <a href="/sms" style={{ ...btnStyle, textAlign: "center", textDecoration: "none" }} id="sms-btn">
              <i className="fas fa-sms"></i> SMS arkaly sargyt etmek
            </a>
            <button
              style={btnStyle}
              onClick={() => {
                const cb = document.getElementById("read-info") as HTMLInputElement;
                if (!cb?.checked) {
                  alert("Maglumatlary okap çykdym we razy ketegine belgi goýuň!");
                  return;
                }
                setSection("form");
              }}
            >
              <i className="fas fa-arrow-right"></i> Dowam etmek
            </button>
          </div>
        )}

        {section === "form" && (
          <div style={contentStyle}>
            <h2 style={{ color: "var(--primary)", marginBottom: 20 }}><i className="fas fa-user"></i> Şahsy maglumatlar</h2>

            {/* Route selector */}
            <div style={{ display: "flex", alignItems: "center", gap: 20, margin: "20px 0", background: "rgba(13,148,136,0.08)", padding: 20, borderRadius: 20 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontWeight: 600, color: "var(--primary)", marginBottom: 10 }}>
                  <i className="fas fa-map-marker-alt"></i> Nirden
                </label>
                <select value={fromCity} onChange={e => setFromCity(e.target.value)}>
                  {Object.entries(cityNames).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div style={{ fontSize: "2rem", color: "var(--primary)" }}>→</div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontWeight: 600, color: "var(--primary)", marginBottom: 10 }}>
                  <i className="fas fa-map-marker-alt"></i> Nira
                </label>
                <select value={toCity} onChange={e => setToCity(e.target.value)}>
                  {Object.entries(cityNames).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>

            {[
              { id: "name", label: "Adyňyz", value: name, set: setName, placeholder: "Adyňyz", icon: "fa-user" },
              { id: "surname", label: "Familýaňyz", value: surname, set: setSurname, placeholder: "Familýaňyz", icon: "fa-user" },
              { id: "birthdate", label: "Doglan aýy güni", value: birthdate, set: setBirthdate, placeholder: "", icon: "fa-calendar", type: "date" },
              { id: "passport", label: "Pasport ID", value: passport, set: (v: string) => setPassport(v.toUpperCase()), placeholder: "I-DZ 123456", icon: "fa-id-card" },
              { id: "travelDate", label: "Sapar senesi", value: travelDate, set: setTravelDate, placeholder: "", icon: "fa-calendar", type: "date", min: today, max: maxDateStr },
              { id: "clientPhone", label: "Siziň nomeriňiz", value: clientPhone, set: setClientPhone, placeholder: "+993 XX XXXXXX", icon: "fa-phone", type: "tel" },
            ].map(f => (
              <div key={f.id} style={{ margin: "20px 0" }}>
                <label style={{ display: "block", marginBottom: 10, fontWeight: 600, fontSize: "1.05rem" }}>
                  <i className={`fas ${f.icon}`} style={{ color: "var(--primary)", marginRight: 8 }}></i>{f.label}
                </label>
                <input
                  type={f.type || "text"}
                  value={f.value}
                  onChange={e => f.set(e.target.value)}
                  placeholder={f.placeholder}
                  min={(f as any).min}
                  max={(f as any).max}
                />
              </div>
            ))}

            {/* Addons */}
            <h3 style={{ color: "var(--primary)", margin: "20px 0 15px" }}><i className="fas fa-plus-circle"></i> Goşmaça hyzmatlar</h3>
            {[
              { id: "firstClass", label: "1-nji gat", checked: firstClass, onChange: (v: boolean) => { setFirstClass(v); if (v) setSecondClass(false); } },
              { id: "secondClass", label: "2-nji gat", checked: secondClass, onChange: (v: boolean) => { setSecondClass(v); if (v) setFirstClass(false); } },
              { id: "media", label: "Media portal (+5 TMT)", checked: mediaPortal, onChange: setMediaPortal },
            ].map(a => (
              <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, margin: "15px 0", padding: 10, background: "rgba(13,148,136,0.05)", borderRadius: 12 }}>
                <input type="checkbox" id={a.id} checked={a.checked} onChange={e => a.onChange(e.target.checked)} style={{ width: "auto", accentColor: "var(--primary)" }} />
                <label htmlFor={a.id} style={{ fontWeight: 600 }}>{a.label}</label>
              </div>
            ))}

            <div style={{ textAlign: "center", fontSize: "2rem", fontWeight: 700, color: "var(--primary)", margin: "25px 0", padding: 20, background: "rgba(13,148,136,0.1)", borderRadius: 20 }}>
              <i className="fas fa-money-bill-wave"></i> {totalPrice} TMT
            </div>

            <button style={btnStyle} onClick={() => {
              if (!name || !surname || !travelDate) { alert("Ähli meýdançalary dolduryň!"); return; }
              setSection("payment");
            }}>
              <i className="fas fa-arrow-right"></i> Töleg mowzugyna geçmek
            </button>
          </div>
        )}

        {section === "payment" && (
          <div style={contentStyle}>
            <h2 style={{ color: "var(--primary)", marginBottom: 20 }}><i className="fas fa-credit-card"></i> Töleg maglumatlary</h2>
            <div style={{ background: "rgba(13,148,136,0.1)", padding: 20, borderRadius: 14, margin: "20px 0", borderLeft: "4px solid var(--primary)" }}>
              <p><i className="fas fa-phone" style={{ color: "var(--primary)" }}></i> <strong>+993 71 789091</strong></p>
              <p><i className="fas fa-phone" style={{ color: "var(--primary)" }}></i> <strong>+993 64 629487</strong></p>
              <p><i className="fas fa-phone" style={{ color: "var(--primary)" }}></i> <strong>+993 71 788546</strong></p>
              <p style={{ marginTop: 15 }}><strong>Jemi töleg: {totalPrice} TMT</strong></p>
            </div>

            <h3 style={{ color: "var(--primary)", margin: "20px 0 15px" }}><i className="fas fa-check-circle"></i> Tölegi tassyklaň</h3>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap", margin: "15px 0" }}>
              {(["screenshot", "sms"] as const).map(type => (
                <div
                  key={type}
                  onClick={() => setProofType(type)}
                  style={{
                    flex: 1, minWidth: 200,
                    padding: 15,
                    background: "var(--card-light)",
                    borderRadius: 14,
                    border: `2px solid ${proofType === type ? "var(--primary)" : "#e2e8f0"}`,
                    cursor: "pointer",
                    fontSize: "1.05rem",
                    transition: "border-color 0.3s ease",
                  }}
                >
                  <input type="radio" name="proof" checked={proofType === type} onChange={() => setProofType(type)} style={{ accentColor: "var(--primary)", marginRight: 12 }} />
                  <i className={`fas ${type === "screenshot" ? "fa-camera" : "fa-sms"}`} style={{ color: "var(--primary)", marginRight: 8 }}></i>
                  {type === "screenshot" ? "Skrinshot" : "SMS habary"}
                </div>
              ))}
            </div>

            {proofType === "sms" && (
              <div style={{ marginTop: 15 }}>
                <p><strong><i className="fas fa-sms" style={{ color: "var(--primary)" }}></i> SMS habary nusgalap goýuň:</strong></p>
                <textarea rows={3} value={smsText} onChange={e => setSmsText(e.target.value)} placeholder="SMS haty şu ýere ýazyň..." style={{ marginTop: 10 }} />
              </div>
            )}

            {proofType === "screenshot" && (
              <div style={{ marginTop: 15, textAlign: "center" }}>
                <label htmlFor="screenshot-upload" style={{ cursor: "pointer", display: "block", border: "2px dashed var(--primary)", borderRadius: 12, padding: 20 }}>
                  <i className="fas fa-cloud-upload-alt" style={{ fontSize: "3rem", color: "var(--primary)", display: "block", marginBottom: 10 }}></i>
                  <p style={{ fontWeight: 600, color: "var(--primary)" }}>Suraty ýüklemek üçin üstünden basyň</p>
                  <p style={{ fontSize: "0.9rem", color: "#f59e0b" }}>JPG, PNG (maksimum 5 MB)</p>
                </label>
                <input type="file" id="screenshot-upload" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
                {screenshotPreview && (
                  <div style={{ marginTop: 15 }}>
                    <img src={screenshotPreview} alt="preview" style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 12 }} />
                    <p style={{ color: "var(--primary)", fontWeight: 600 }}>Taýyn!</p>
                  </div>
                )}
              </div>
            )}

            <button style={btnStyle} onClick={() => {
              if (!proofType) { alert("Töleg tassyklamasyny saýlaň!"); return; }
              setSection("confirmation");
            }}>
              <i className="fas fa-arrow-right"></i> Tassyklamaga geçmek
            </button>
            <button style={{ ...btnStyle, background: "#94a3b8", marginTop: 10 }} onClick={() => setSection("form")}>
              <i className="fas fa-arrow-left"></i> Yza
            </button>
          </div>
        )}

        {section === "confirmation" && (
          <div style={contentStyle}>
            <h2 style={{ color: "var(--primary)", marginBottom: 20 }}><i className="fas fa-check-circle"></i> Tassyklaň</h2>
            <div style={{ background: "rgba(13,148,136,0.1)", padding: 20, borderRadius: 14, margin: "20px 0", lineHeight: 2 }}>
              <p><strong>Ad:</strong> {name}</p>
              <p><strong>Familýa:</strong> {surname}</p>
              <p><strong>Pasport:</strong> {passport}</p>
              <p><strong>Ugur:</strong> {cityNames[fromCity]} → {cityNames[toCity]}</p>
              <p><strong>Sapar senesi:</strong> {travelDate}</p>
              <p><strong>Töleg mukdary:</strong> {totalPrice} TMT</p>
              <p><strong>Nomeriňiz:</strong> {clientPhone}</p>
              <p><strong>Tassyklama:</strong> {proofType === "screenshot" ? "Skrinshot" : "SMS habary"}</p>
            </div>

            {loading && (
              <div style={{ textAlign: "center", padding: 25 }}>
                <PremiumSpinner />
                <p style={{ marginTop: 10 }}>Ýüklenýär...</p>
              </div>
            )}
            {error && <div style={{ background: "#fee", color: "#c33", padding: 15, borderRadius: 12, margin: "20px 0", textAlign: "center" }}>{error}</div>}

            <button style={btnStyle} disabled={loading} onClick={handleSubmitConfirm}>
              <i className="fas fa-check"></i> Hawa, tassyklaýyn
            </button>
            <button style={{ ...btnStyle, background: "#94a3b8", marginTop: 10 }} onClick={() => setSection("payment")}>
              <i className="fas fa-times"></i> Ýok, özgertmek gerek
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

      {/* Ticket Modal */}
      {ticketModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center",
        }} onClick={() => setTicketModal(false)}>
          <div style={{
            background: "var(--card-light)", padding: 25, borderRadius: 16, maxWidth: "90%", width: 380,
            boxShadow: "0 6px 20px rgba(0,0,0,0.3)",
          }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setTicketModal(false)} style={{ position: "relative", float: "right", background: "none", border: "none", fontSize: "1.5rem", color: "#64748b", cursor: "pointer" }}>×</button>
            <h3 style={{ textAlign: "center", marginBottom: 15, color: "var(--primary)", fontWeight: 700 }}>
              <i className="fas fa-search"></i> Bron kodyňyzy giriziň
            </h3>
            <input
              type="text"
              value={bookingCode}
              onChange={e => setBookingCode(e.target.value.toUpperCase())}
              placeholder="Meselem: ABC123"
              maxLength={6}
              onKeyDown={e => e.key === "Enter" && searchTicket()}
              style={{ fontSize: "1.1rem", textAlign: "center" }}
            />
            <button
              onClick={searchTicket}
              style={{ ...btnStyle, fontSize: "1rem", marginTop: 15 }}
            >
              <i className="fas fa-search"></i> Gözle
            </button>

            {ticketLoading && <div style={{ textAlign: "center", padding: 20 }}><PremiumSpinner /></div>}
            {ticketError && <div style={{ background: "#fee", color: "#c33", padding: 15, borderRadius: 12, marginTop: 15, textAlign: "center" }}>{ticketError}</div>}

            {ticketResult && (() => {
              const booking = ticketResult;
              const ticket = booking.tickets?.[0];
              const pnr = ticket?.pnrs?.[0];
              if (!pnr) return <p style={{ color: "#c33", textAlign: "center", marginTop: 15 }}>⚠️ Bilet maglumatlary ýeterli däl</p>;
              const now = new Date();
              const isExpired = now > new Date(booking.expire_time || "1970-01-01");
              return (
                <div style={{ marginTop: 15, padding: 20, borderRadius: 14 }}>
                  <h3 style={{ textAlign: "center", marginBottom: 12, fontWeight: 700, color: isExpired ? "#ef4444" : "var(--primary)" }}>
                    {isExpired ? <><i className="fas fa-exclamation-circle"></i> Bilediňiziň möhleti dolan</> : <><i className="fas fa-ticket-alt"></i> Bilet tapyldy!</>}
                  </h3>
                  <div style={{ lineHeight: 2, fontSize: "0.95rem" }}>
                    <p><i className="fas fa-user" style={{ color: "var(--primary)" }}></i> <strong>Müşderi:</strong> {booking.main_contact || "—"}</p>
                    <p><i className="fas fa-route" style={{ color: "var(--primary)" }}></i> <strong>Ugraýar:</strong> {pnr.source || "—"} → {pnr.destination || "—"}</p>
                    <p><i className="fas fa-calendar-day" style={{ color: "var(--primary)" }}></i> <strong>Sapar senesi:</strong> {new Date(pnr.departure_time).toLocaleDateString("tk", { month: "long", day: "numeric" })}</p>
                    <p><i className="fas fa-train" style={{ color: "var(--primary)" }}></i> <strong>Wagon:</strong> {pnr.wagon_type_title || "—"} (№{pnr.wagon_number || "?"})</p>
                    <p><i className="fas fa-chair" style={{ color: "var(--primary)" }}></i> <strong>Orun:</strong> {pnr.seat_label || "?"}</p>
                  </div>
                  {!isExpired && (
                    <div style={{ textAlign: "center", marginTop: 15 }}>
                      {ticket?.pdf_url && (
                        <a href={ticket.pdf_url} target="_blank" rel="noopener noreferrer" style={{
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                          padding: "10px 20px", background: "#10b981", color: "white", borderRadius: 10,
                          textDecoration: "none", fontWeight: 600, gap: 8,
                        }}>
                          <i className="fas fa-download"></i> PDF ýükläp al
                        </a>
                      )}
                    </div>
                  )}
                  {isExpired && (
                    <div style={{ background: "#fee", color: "#c33", padding: 16, borderRadius: 12, textAlign: "center", marginTop: 10 }}>
                      <i className="fas fa-times-circle"></i> Bilediňiziň möhleti dolan, ulanyp bilmeýäňiz
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes pulseText {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}
