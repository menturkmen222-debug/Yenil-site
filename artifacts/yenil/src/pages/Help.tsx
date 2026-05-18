import { useState } from "react";
import { Link } from "wouter";

const BACKENDLESS_URL = `https://api.backendless.com/C3BB5032-1DCC-4DB3-888F-AEDA785F26CB/9A8CACA4-5889-4D47-903E-BF12F059E175`;

const faqs = [
  {
    q: "1. Siz tölegi öňünden alýaňyzmy ýa-da tölegi soň etsem hem bolýamy ?",
    icon: "fa-question-circle",
    a: "Howa biz tölegi öňünden alýas iş ýerine ýetirilenden soň däl. Biz töleg edilenden soň işe başlaýarys.",
  },
  {
    q: "2. Ýeňil demirýollaryna ýa-da Ýeňil pay-a ýüz tutsam ol näçe wagt içinde ýerine ýetirilýär?",
    icon: "fa-clock",
    a: "Siz bize ýüz tutsaňyz biz 24 sagadyň içinde siziň işiňiz barada maglymat berilýär we biz 7/24 işleýäs.",
  },
  {
    q: "3. Eger näsazlyk bolan ýagdaýynda tölän pulymy yzyna alyp bilerinmi?",
    icon: "fa-hand-holding-usd",
    a: "Howa eger biz tarapda näsazlyk bolsa töleg edilen pul doly yzyna geçirilýär...",
  },
  {
    q: "4. Men bilet almak üçin soragnamany dolduryp töleg etsem bolanymy?",
    icon: "fa-clock",
    a: "Howa, size degişli soragnamany öz maglumatlaryňyz bilen doluryp we size görkezilen jemi töleg mukdaryny TMCELL nomeriňizden SMS bölimine girip 0804-belgisine biziň size görkezen 3 nomerimiziň haýsy bolsada birine töleg edilse bolany we biz özimiz siz üçin bilet alyp SMS arkaly size maglumatlary iberýäs.",
  },
  {
    q: "5. Ýeňil Demirýollary bölümindäki SMS tasyklama ýerine näme ýüklemeli?",
    icon: "fa-clock",
    a: "Ol ýere siziň bize töleg edeniňizden soň 0801-den gelen töleg geçendigi baradaky habaryň ekran skrinshoty ýa-da şol habaryň nusgasy bu bize tölegi tasyklamak üçin gerek.",
  },
  {
    q: "6. Bilet ýagny petek baradaky doly maglumaty nirden alsam bolýa we biledi kagyza çap etmek şertmi?",
    icon: "fa-clock",
    a: "Bilediňiz baradaky doly maglumaty biziň web sahypamyzyň depe sag tarapynda ýerleşen {Bilet çap etmek} diýen ýeriň üstünden basýaňyz we size berlen Bron kody gizirýäňiz we Gözle diýenine basyp biraz garaşanyňyzdan soň, Maglumatlaryňyzy görersiňiz, eger stansia görkezilýän biledi almak üçin bolsa Ýüklemek diýen ýerini bapyp ýükläp alyp saparyňyz güni ulanyp bilýärsiňiz.",
  },
  {
    q: "7. Maňa bilet alynandygy barada habar geldi indi men näme etmeli?",
    icon: "fa-clock",
    a: "Siziň etmeli işiňiz şu ýagny bilet alynandygy barada habar baran bolsa ol habarda elbetde bron kod diýilýän 6 belgiden ybarat bolan belgileri ulanyp biziň wep sahypamyzda ýerleşen \"Bilet çap etmek\" diýen ýerinden PDF suraty alyb sapar güni doly ulanyb bilýärsiňiz.",
  },
];

export default function Help() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [userName, setUserName] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [userQuestion, setUserQuestion] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = ev => setFilePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  }

  async function submitQuestion() {
    if (!userName || !userPhone || !userQuestion) {
      setError("Ähli meýdançary dolduryň!");
      return;
    }
    setLoading(true);
    setError("");
    let fileUrl = null;
    if (selectedFile) {
      const formData = new FormData();
      formData.append("file", selectedFile);
      try {
        const res = await fetch("/api/upload-screenshot", { method: "POST", body: formData });
        if (res.ok) {
          const data = await res.json();
          fileUrl = data.secure_url;
        }
      } catch { /* ignore upload errors */ }
    }
    try {
      const response = await fetch(`${BACKENDLESS_URL}/data/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: userName, phone: userPhone, question: userQuestion,
          proofType: selectedFile ? "file" : null, fileUrl,
          created: Date.now(),
        }),
      });
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      alert("Soragyňyz üstünlikli göýberildi! Tez wagtda jogap beriler.");
      setUserName(""); setUserPhone(""); setUserQuestion("");
      setSelectedFile(null); setFilePreview(null);
    } catch (err: any) {
      setError("Ýalňyşlyk ýüz berdi: " + (err.message || "Nätanyş ýalňyşlyk"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ flex: 1, padding: "40px 0" }}>
      <div className="container">
        <h1 style={{ textAlign: "center", marginBottom: 40, fontSize: 28, fontWeight: 700 }}>
          <i className="fas fa-headset" style={{ color: "var(--primary)" }}></i> Ýeňil barada sorag joagap
        </h1>

        {/* FAQ */}
        {faqs.map((faq, i) => (
          <div key={i} style={{ marginBottom: 25, borderRadius: 16, overflow: "hidden", boxShadow: "0 6px 20px rgba(0,0,0,0.08)" }}>
            <button
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              style={{
                width: "100%", padding: "22px 25px", fontSize: 18, background: "var(--card-light)",
                border: "none", textAlign: "left", fontWeight: 700, color: "var(--primary)",
                cursor: "pointer", display: "flex", alignItems: "center", gap: 14,
                fontFamily: "Poppins, sans-serif",
              }}
            >
              <i className={`fas ${faq.icon}`}></i>
              {faq.q}
            </button>
            {openFaq === i && (
              <div style={{
                fontSize: 18, padding: "25px 30px", background: "var(--card-light)",
                borderTop: "4px solid var(--accent)", lineHeight: 1.8,
              }}>
                <p><i className="fas fa-check-circle" style={{ color: "var(--primary)", marginRight: 10 }}></i>{faq.a}</p>
              </div>
            )}
          </div>
        ))}

        {/* Contact form */}
        <div style={{ marginTop: 50, padding: 35, background: "var(--card-light)", borderRadius: 20, boxShadow: "0 10px 32px rgba(0,0,0,0.09)" }}>
          <h2 style={{ color: "var(--primary)", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
            <i className="fas fa-comment-dots"></i> Sözüňiz barmy?
          </h2>
          <p><i className="fas fa-lightbulb" style={{ color: "var(--primary)" }}></i> Eger ýokardaky soraglardan jogap tapmasaňyz, öz soragyňyzy ýazyp bilersiňiz:</p>

          {[
            { id: "user-name", label: "Adyňyz", value: userName, set: setUserName, placeholder: "Adyňyz", icon: "fa-user" },
            { id: "user-phone", label: "Nomeriňiz (Siz bilen baglanmak üçin)", value: userPhone, set: setUserPhone, placeholder: "+993 XX XXXXXXX", icon: "fa-phone", type: "tel" },
          ].map(f => (
            <div key={f.id} style={{ margin: "28px 0" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10, fontWeight: 600, fontSize: 18 }}>
                <i className={`fas ${f.icon}`} style={{ color: "var(--primary)" }}></i> {f.label}
              </label>
              <input type={f.type || "text"} value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} style={{ fontSize: "1rem", padding: "15px 20px" }} />
            </div>
          ))}

          <div style={{ margin: "28px 0" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10, fontWeight: 600, fontSize: 18 }}>
              <i className="fas fa-comment" style={{ color: "var(--primary)" }}></i> Soragyňyz
            </label>
            <textarea rows={4} value={userQuestion} onChange={e => setUserQuestion(e.target.value)} placeholder="Soragyňyzy bu ýere ýazyň..." style={{ fontSize: "1rem", padding: "15px 20px" }} />
          </div>

          {/* File upload */}
          <div style={{ marginTop: 25 }}>
            <label htmlFor="help-file" style={{ cursor: "pointer", display: "block", border: "2px dashed var(--primary)", borderRadius: 12, padding: 20, textAlign: "center" }}>
              <i className="fas fa-cloud-upload-alt" style={{ fontSize: "3rem", color: "var(--primary)", display: "block", marginBottom: 10 }}></i>
              <p style={{ fontWeight: 600, color: "var(--primary)" }}>Faýl goşmak (isleseňiz)</p>
              <p style={{ fontSize: "0.9rem", color: "#64748b" }}>JPG, PNG, GIF, MP4 (maksimum 20 MB)</p>
            </label>
            <input type="file" id="help-file" accept="image/*,video/*" style={{ display: "none" }} onChange={handleFileChange} />
            {filePreview && <img src={filePreview} alt="preview" style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 12, marginTop: 15 }} />}
          </div>

          {loading && (
            <div style={{ textAlign: "center", padding: 25 }}>
              <div style={{ position: "relative", width: 50, height: 50, margin: "0 auto", animation: "spin 1.2s linear infinite" }}>
                <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "4px solid transparent", borderTop: "4px solid var(--primary)", borderRadius: "50%", animation: "spin 1.2s linear infinite" }}></div>
              </div>
              <p style={{ marginTop: 10 }}>Ýüklenýär...</p>
            </div>
          )}
          {error && <div style={{ background: "#fee", color: "#c33", padding: 15, borderRadius: 12, marginTop: 15, textAlign: "center" }}>{error}</div>}

          <button
            onClick={submitQuestion}
            disabled={loading}
            style={{
              width: "100%", padding: "18px", background: "var(--gradient)", color: "white",
              border: "none", borderRadius: 14, fontSize: "1.2rem", fontWeight: 600, cursor: "pointer",
              marginTop: 25, fontFamily: "Poppins, sans-serif",
            }}
          >
            <i className="fas fa-paper-plane"></i> Soragy göýber
          </button>
        </div>

        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
