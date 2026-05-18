import { useState } from "react";
import { Link } from "wouter";
import { saveOrder } from "@/lib/firebase";
import { useToast } from "@/components/Toast";
import { SparkleIcon, LightbulbIcon } from "@/components/Icons";

export default function Teklip() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [desc, setDesc] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { toast } = useToast();

  async function handleSubmit() {
    if (!name.trim() || !phone.trim() || !serviceName.trim() || !desc.trim()) {
      alert("Ähli hökmanly meýdançalary dolduryň!");
      return;
    }
    setLoading(true);
    try {
      let fileUrl = null;
      if (file) {
        const formData = new FormData();
        formData.append("screenshot", file);
        const res = await fetch("/api/upload-screenshot", { method: "POST", body: formData });
        if (res.ok) { const d = await res.json(); fileUrl = d.secure_url; }
      }
      await saveOrder("service-proposals", { name, phone, serviceName, description: desc, fileUrl, status: "pending" });
      setDone(true);
      toast("Teklip üstünlikli iberildi!", "success");
    } catch { toast("Ýalňyşlyk ýüz berdi", "error"); }
    finally { setLoading(false); }
  }

  if (done) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
      <div className="glass-card alert-success" style={{ maxWidth: 500, width: "100%", padding: 40, textAlign: "center", animation: "fadeInUp 0.6s ease" }}>
        <div className="success-icon-wrap" style={{ width: 80, height: 80, marginBottom: 20 }}><SparkleIcon size={36} strokeWidth={1.5} /></div>
        <h2 style={{ color: "var(--primary)", marginBottom: 12, fontSize: "1.5rem" }}>Teklip üstünlikli iberildi!</h2>
        <p style={{ lineHeight: 1.7, marginBottom: 24 }}>
          Toparymyz gysga wagtda siziň teklibiňizi gözden geçirer we size habarlaşarlar.
        </p>
        <Link href="/"><button className="btn-primary"><i className="fas fa-home"></i> Baş sahypa</button></Link>
      </div>
    </div>
  );

  return (
    <div style={{ flex: 1, paddingBottom: 40 }}>
      <div style={{ background: "var(--gradient2)", color: "white", padding: "50px 20px 40px", textAlign: "center" }}>
        <div className="container">
          <div style={{ marginBottom: 14, color: "rgba(255,255,255,0.92)" }}><LightbulbIcon size={44} strokeWidth={1.5} /></div>
          <h1 style={{ fontSize: "clamp(1.5rem,4vw,2.2rem)", fontWeight: 800, marginBottom: 10 }}>Öz hyzmatyňyzy teklip ediň</h1>
          <p style={{ opacity: 0.9, maxWidth: 600, margin: "0 auto", lineHeight: 1.7 }}>
            Siziň hem hödürläp biljek hyzmatyňyz barmy? Bize ýazyň — biz siziň teklipleriňize garaşýarys!
          </p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 30, maxWidth: 640 }}>
        <Link href="/" className="back-link">
          <i className="fas fa-arrow-left"></i> Baş sahypa
        </Link>

        <div className="glass-card" style={{ padding: 28 }}>
          <h2 style={{ color: "var(--primary)", marginBottom: 20, fontSize: "1.2rem" }}>
            <i className="fas fa-rocket"></i> Teklip formasy
          </h2>

          {[
            { label: "Adyňyz", value: name, set: setName, icon: "fa-user", ph: "Adyňyz" },
            { label: "Telefon belgiňiz", value: phone, set: setPhone, icon: "fa-phone", ph: "+993 XX XXXXXX", type: "tel" },
            { label: "Hyzmatyňyzyň ady", value: serviceName, set: setServiceName, icon: "fa-tag", ph: "Meseläň: Web dizaýn, Terjime..." },
          ].map(f => (
            <div className="form-group" key={f.label}>
              <label><i className={`fas ${f.icon}`}></i> {f.label}</label>
              <input className="form-control" type={f.type || "text"} value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.ph} />
            </div>
          ))}

          <div className="form-group">
            <label><i className="fas fa-align-left"></i> Doly düşündiriş</label>
            <textarea className="form-control" rows={5} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Hyzmatyňyz barada jikme-jik gürrüň beriň: nämeler edip bilýäňiz, tejribäňiz, bahasy..." />
          </div>

          <div className="form-group">
            <label><i className="fas fa-image"></i> Surat goşuň (isleseňiz)</label>
            <label htmlFor="teklip-file" style={{ cursor: "pointer", display: "block", border: "2px dashed rgba(13,148,136,0.25)", borderRadius: "var(--radius-sm)", padding: 18, textAlign: "center", background: "rgba(13,148,136,0.03)" }}>
              <i className="fas fa-cloud-upload-alt" style={{ fontSize: "2rem", color: "var(--primary)", display: "block", marginBottom: 8 }}></i>
              <span style={{ color: "var(--primary)", fontWeight: 600, fontSize: "0.9rem" }}>
                {file ? file.name : "Surat ýüklemek üçin basyň"}
              </span>
            </label>
            <input type="file" id="teklip-file" accept="image/*,video/*" style={{ display: "none" }} onChange={e => {
              const f = e.target.files?.[0];
              if (!f) return;
              setFile(f);
              if (f.type.startsWith("image/")) {
                const r = new FileReader();
                r.onload = ev => setPreview(ev.target?.result as string);
                r.readAsDataURL(f);
              }
            }} />
            {preview && <img src={preview} alt="prev" style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 10, marginTop: 10 }} />}
          </div>

          {loading ? (
            <div className="spinner" style={{ margin: "20px auto" }}></div>
          ) : (
            <button className="btn-primary btn-block" onClick={handleSubmit}>
              <i className="fas fa-paper-plane"></i> Teklip ibermek
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
