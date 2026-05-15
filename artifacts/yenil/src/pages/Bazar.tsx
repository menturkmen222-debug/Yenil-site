import { useState, useEffect } from "react";
import { Link } from "wouter";
import { db, ref, onValue, saveOrder } from "@/lib/firebase";
import { useBonusPul } from "@/contexts/BonusPulContext";
import { useToast } from "@/components/Toast";

const ADMIN_PHONES = ["+993 71 789091", "+993 64 629487", "+993 71 788546"];
const CATEGORIES = [
  { id: "accounts", label: "Akkauntlar" },
  { id: "digital", label: "Sanly harytlar" },
  { id: "services", label: "Hyzmatlar" },
  { id: "other", label: "Beýleki" },
];

interface MarketItem {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  sellerName: string;
  sellerPhone: string;
  status: string;
}

function PremiumSpinner() {
  return <div style={{ textAlign: "center", padding: 24 }}><div className="spinner"></div></div>;
}

function AddItemModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("other");
  const [seller, setSeller] = useState("");
  const [sellerPhone, setSellerPhone] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function submit() {
    if (!title || !desc || !price || !seller || !sellerPhone) { alert("Ähli meýdançalary dolduryň!"); return; }
    setLoading(true);
    try {
      let imageUrl = null;
      if (file) {
        const formData = new FormData();
        formData.append("screenshot", file);
        const res = await fetch("/api/upload-screenshot", { method: "POST", body: formData });
        if (res.ok) { const d = await res.json(); imageUrl = d.secure_url; }
      }
      await saveOrder("marketplace-items", { title, description: desc, price: parseFloat(price), category, sellerName: seller, sellerPhone, imageUrl, status: "pending" });
      toast("Haryt goşmak haýyşnamasy iberildi!", "success");
      onClose();
    } catch { toast("Ýalňyşlyk", "error"); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="glass-card" style={{ maxWidth: 520, width: "100%", maxHeight: "90vh", overflowY: "auto", padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ color: "var(--primary)", fontSize: "1.1rem" }}><i className="fas fa-plus-circle"></i> Haryt goşmak</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "1.4rem", cursor: "pointer", opacity: 0.6 }}>×</button>
        </div>
        {[
          { label: "Harydyň ady", value: title, set: setTitle, icon: "fa-tag", ph: "Harydyň ady" },
          { label: "Bahaňyz (TMT)", value: price, set: setPrice, icon: "fa-money-bill", ph: "0.00", type: "number" },
          { label: "Satyjynyň ady", value: seller, set: setSeller, icon: "fa-user", ph: "Adyňyz" },
          { label: "Telefon nomeriňiz", value: sellerPhone, set: setSellerPhone, icon: "fa-phone", ph: "+993 XX XXXXXX", type: "tel" },
        ].map(f => (
          <div className="form-group" key={f.label}>
            <label><i className={`fas ${f.icon}`}></i> {f.label}</label>
            <input className="form-control" type={f.type || "text"} value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.ph} />
          </div>
        ))}
        <div className="form-group">
          <label><i className="fas fa-list"></i> Kategoriýa</label>
          <select className="form-control" value={category} onChange={e => setCategory(e.target.value)}>
            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label><i className="fas fa-align-left"></i> Düşündiriş</label>
          <textarea className="form-control" rows={3} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Haryt barada jikme-jik gürrüň beriň..." />
        </div>
        <div className="form-group">
          <label><i className="fas fa-image"></i> Surat (isleseňiz)</label>
          <label htmlFor="bazar-file" style={{ cursor: "pointer", display: "block", border: "2px dashed rgba(13,148,136,0.25)", borderRadius: "var(--radius-sm)", padding: 14, textAlign: "center" }}>
            <i className="fas fa-cloud-upload-alt" style={{ color: "var(--primary)", marginRight: 8 }}></i>
            <span style={{ color: "var(--primary)", fontWeight: 600, fontSize: "0.85rem" }}>{file ? file.name : "Surat saýlaň"}</span>
          </label>
          <input type="file" id="bazar-file" accept="image/*" style={{ display: "none" }} onChange={e => setFile(e.target.files?.[0] || null)} />
        </div>
        {loading ? <PremiumSpinner /> : (
          <button className="btn-primary btn-block" onClick={submit}>
            <i className="fas fa-paper-plane"></i> Ibermek
          </button>
        )}
      </div>
    </div>
  );
}

function BuyModal({ item, onClose }: { item: MarketItem; onClose: () => void }) {
  const [payMethod, setPayMethod] = useState<"terminal" | "bonus" | null>(null);
  const [buyerPhone, setBuyerPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { balance, deviceId, deduct } = useBonusPul();
  const { toast } = useToast();

  async function handleBuy() {
    if (!payMethod) { alert("Töleg usulyny saýlaň!"); return; }
    if (payMethod === "terminal" && !buyerPhone) { alert("Nomeriňizi giriziň!"); return; }
    setLoading(true);
    try {
      if (payMethod === "bonus") {
        if (balance < item.price) {
          alert(`Ýeterlik bonus pul ýok. Balansyňyz: ${balance} BP`);
          setLoading(false); return;
        }
        await deduct(item.price);
      }
      await saveOrder("marketplace-orders", { itemId: item.id, itemTitle: item.title, price: item.price, payMethod, buyerPhone: payMethod === "terminal" ? buyerPhone : undefined, sellerPhone: item.sellerPhone, deviceId, status: "pending" });
      setDone(true);
      toast("Sargyt kabul edildi!", "success");
    } catch { toast("Ýalňyşlyk", "error"); }
    finally { setLoading(false); }
  }

  if (done) return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div className="glass-card alert-success" style={{ maxWidth: 400, width: "100%", padding: 32, textAlign: "center" }}>
        <div style={{ fontSize: "3rem", marginBottom: 12 }}>✅</div>
        <h3 style={{ color: "var(--primary)", marginBottom: 10 }}>Sargyt kabul edildi!</h3>
        <p>Satyjy siz bilen {item.sellerPhone} arkaly habarlaşar.</p>
        <button className="btn-primary" style={{ marginTop: 20 }} onClick={onClose}>Düşündim</button>
      </div>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="glass-card" style={{ maxWidth: 440, width: "100%", padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ color: "var(--primary)" }}><i className="fas fa-shopping-cart"></i> Satyn almak</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "1.4rem", cursor: "pointer", opacity: 0.6 }}>×</button>
        </div>
        <div style={{ padding: "14px 16px", background: "rgba(13,148,136,0.08)", borderRadius: "var(--radius-sm)", marginBottom: 16 }}>
          <p style={{ fontWeight: 700 }}>{item.title}</p>
          <p style={{ color: "var(--primary)", fontWeight: 800, fontSize: "1.2rem" }}>{item.price} TMT</p>
          <p style={{ fontSize: "0.85rem", opacity: 0.7 }}>Satyjy: {item.sellerName}</p>
        </div>
        <label style={{ fontWeight: 700, display: "block", marginBottom: 12, color: "var(--primary)" }}>Töleg usulyny saýlaň:</label>
        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          {(["terminal", "bonus"] as const).map(m => (
            <div key={m} onClick={() => setPayMethod(m)} style={{ flex: 1, padding: 14, border: `2px solid ${payMethod === m ? "var(--primary)" : "rgba(13,148,136,0.15)"}`, borderRadius: "var(--radius-sm)", cursor: "pointer", textAlign: "center", background: payMethod === m ? "rgba(13,148,136,0.08)" : "transparent", transition: "all 0.3s" }}>
              <i className={`fas ${m === "terminal" ? "fa-mobile-alt" : "fa-coins"}`} style={{ color: "var(--primary)", display: "block", fontSize: "1.3rem", marginBottom: 5 }}></i>
              <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>{m === "terminal" ? "TMCELL terminal" : `Bonus pul (${balance})`}</span>
            </div>
          ))}
        </div>
        {payMethod === "terminal" && (
          <>
            <div className="payment-numbers">
              <p style={{ fontWeight: 700, marginBottom: 8, color: "var(--primary)" }}><i className="fas fa-exclamation-circle"></i> <strong>{item.price} TMT</strong> geçirmeli:</p>
              {ADMIN_PHONES.map(p => <div className="payment-number" key={p}><i className="fas fa-phone-alt"></i> {p}</div>)}
            </div>
            <div className="form-group" style={{ marginTop: 12 }}>
              <label><i className="fas fa-phone"></i> Siziň nomeriňiz</label>
              <input className="form-control" type="tel" value={buyerPhone} onChange={e => setBuyerPhone(e.target.value)} placeholder="+993 XX XXXXXX" />
            </div>
          </>
        )}
        {loading ? <PremiumSpinner /> : (
          <button className="btn-primary btn-block" style={{ marginTop: 16 }} onClick={handleBuy}>
            <i className="fas fa-check"></i> Satyn aldym
          </button>
        )}
      </div>
    </div>
  );
}

export default function Bazar() {
  const [items, setItems] = useState<MarketItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [buyItem, setBuyItem] = useState<MarketItem | null>(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const itemsRef = ref(db, "marketplace-items");
    const unsub = onValue(itemsRef, snap => {
      if (snap.exists()) {
        const data = snap.val();
        const arr: MarketItem[] = Object.entries(data)
          .map(([id, val]: [string, any]) => ({ id, ...val }))
          .filter(item => item.status === "approved");
        setItems(arr.reverse());
      } else { setItems([]); }
      setLoadingItems(false);
    });
    return () => unsub();
  }, []);

  const filtered = filter === "all" ? items : items.filter(i => i.category === filter);

  return (
    <div style={{ flex: 1, paddingBottom: 40 }}>
      <div style={{ background: "var(--gradient2)", color: "white", padding: "40px 20px 30px", textAlign: "center" }}>
        <div className="container">
          <div style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: 8 }}>🛍️ Sanly bazar</div>
          <p style={{ opacity: 0.9 }}>Akkauntlar, sanly harytlar we hyzmatlar — hemmesi bir ýerde</p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 30 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
          <Link href="/" className="back-link">
            <i className="fas fa-arrow-left"></i> Baş sahypa
          </Link>
          <button className="btn-primary" onClick={() => setShowAdd(true)} style={{ padding: "10px 20px", fontSize: "0.9rem" }}>
            <i className="fas fa-plus"></i> Haryt goşmak
          </button>
        </div>

        <div className="tabs" style={{ marginBottom: 24 }}>
          <button className={`tab-btn${filter === "all" ? " active" : ""}`} onClick={() => setFilter("all")}>Hemmesi</button>
          {CATEGORIES.map(c => (
            <button key={c.id} className={`tab-btn${filter === c.id ? " active" : ""}`} onClick={() => setFilter(c.id)}>{c.label}</button>
          ))}
        </div>

        {loadingItems ? (
          <PremiumSpinner />
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", opacity: 0.5 }}>
            <i className="fas fa-store" style={{ fontSize: "3rem", display: "block", marginBottom: 16 }}></i>
            <p style={{ fontSize: "1.1rem" }}>Heniz haryt ýok. Ilkinji bolup goşuň!</p>
          </div>
        ) : (
          <div className="marketplace-grid">
            {filtered.map((item, i) => (
              <div key={item.id} className="market-card animate-in" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="market-card-img">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <i className="fas fa-box" style={{ color: "var(--primary)", opacity: 0.4 }}></i>
                  )}
                </div>
                <div style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <h4 style={{ fontSize: "0.95rem", fontWeight: 700, flex: 1 }}>{item.title}</h4>
                    <span style={{ background: "var(--gradient)", color: "white", borderRadius: 50, padding: "3px 10px", fontSize: "0.78rem", fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>{item.price} TMT</span>
                  </div>
                  <p style={{ fontSize: "0.8rem", opacity: 0.65, marginBottom: 10, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item.description}</p>
                  <p style={{ fontSize: "0.78rem", opacity: 0.55, marginBottom: 12 }}><i className="fas fa-user" style={{ marginRight: 4 }}></i>{item.sellerName}</p>
                  <button className="btn-primary" style={{ width: "100%", padding: "10px", fontSize: "0.85rem" }} onClick={() => setBuyItem(item)}>
                    <i className="fas fa-shopping-cart"></i> Satyn almak
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && <AddItemModal onClose={() => setShowAdd(false)} />}
      {buyItem && <BuyModal item={buyItem} onClose={() => setBuyItem(null)} />}
    </div>
  );
}
