import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useBonusPul } from "@/contexts/BonusPulContext";

const reviews = [
  { author: "Amangül", text: "Bilet almak aňsat eken maňa 2 sagadyň içinde bilet alyp berdiler we ulanmak hem aňsat" },
  { author: "Didar", text: "Demiryyolla hem tmcell goşaýmala her geze bilet aljak bolsaň ir bilen wagzalda dikilmeli ýöne Ýeňil sag bol men indi otran yerimden hem ala bilýän kösenmän" },
  { author: "Jeren", text: "Başda ynanmandym ýöne men ylaçym galmansoň ahyry Ýeňil den peýdalanmaga karar berdim sag bolsun ynamymy ödediler aňyrsy 4 sagadyň içinde sms ugratdylar bron kody ýazylan" },
  { author: "Aýgül", text: "Meniň daşary ýurtda okap ýören oglumuň kartyndaky puly çekip bolýamy?" },
  { author: "Serik", text: "Shundan bilet alyp wagzalda gymmat satýalar — maslahat berýän!" },
  { author: "Gözel", text: "Örän gowy ýakynda bilet tapylman 150m berip gitdim ondada mesda hem yok yene bular gowy" },
  { author: "Myrat", text: "Ýeňil bilen isleýän zadyňyzy tapyp bilersiňiz. Meniň işim çyn hem ýeňilleşdi!" },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function ServiceCard({
  href,
  img,
  title,
  desc,
  onClick,
  delay = 0,
  color = "var(--primary)",
}: {
  href?: string;
  img?: string;
  title: string;
  desc: string;
  onClick?: () => void;
  delay?: number;
  color?: string;
}) {
  const content = (
    <div
      className="service-card-premium animate-in"
      style={{ animationDelay: `${delay}s`, cursor: "pointer" }}
      onClick={onClick}
    >
      <div style={{ height: 90, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
        {img ? (
          <img src={img} alt={title} style={{ height: 80, width: "auto", objectFit: "contain" }} />
        ) : (
          <div style={{ width: 72, height: 72, borderRadius: 20, background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", color: "white", boxShadow: `0 8px 20px ${color}40` }}>
            <i className="fas fa-th-large"></i>
          </div>
        )}
      </div>
      <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--primary)", marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: "0.8rem", opacity: 0.65, lineHeight: 1.5 }}>{desc}</div>
    </div>
  );
  if (href) return <Link href={href}>{content}</Link>;
  return content;
}

export default function Home() {
  const [shuffled] = useState(() => shuffle(reviews));
  const [showModal, setShowModal] = useState(false);
  const { balance } = useBonusPul();
  const [counted, setCounted] = useState(false);
  const [nums, setNums] = useState({ users: 0, orders: 0, rating: 0 });

  useEffect(() => {
    if (counted) return;
    const targets = { users: 500, orders: 1200, rating: 98 };
    const dur = 1800;
    const start = Date.now();
    const timer = setInterval(() => {
      const progress = Math.min((Date.now() - start) / dur, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setNums({
        users: Math.round(targets.users * ease),
        orders: Math.round(targets.orders * ease),
        rating: Math.round(targets.rating * ease),
      });
      if (progress >= 1) { clearInterval(timer); setCounted(true); }
    }, 16);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ flex: 1 }}>
      {/* HERO */}
      <section className="hero">
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <h1 className="animate-in">Ýeňil — Türkmenistanda iň ynamly onlayn hyzmatlar platformasy</h1>
          <p className="animate-in animate-delay-1" style={{ marginBottom: 28 }}>
            Demirýol biletleri, daşary ýurt walýutasy, TMCell hyzmatlary we has köp zat — hemmesi bir ýerde, 7/24 elýeterli.
          </p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", borderRadius: 50, padding: "10px 22px", fontSize: "0.9rem", fontWeight: 600 }}>
            💰 Bonus pul balansynyz: <strong>{balance.toFixed(2)} BP</strong>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section style={{ padding: "30px 20px" }}>
        <div className="container">
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            {[
              { num: `${nums.users}+`, label: "Müşderi" },
              { num: `${nums.orders}+`, label: "Tamamlanan sargyt" },
              { num: `${nums.rating}%`, label: "Kanagatlanma" },
            ].map((s, i) => (
              <div key={i} style={{ flex: "1 1 140px", textAlign: "center", padding: "20px 16px", background: "rgba(13,148,136,0.06)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(13,148,136,0.12)" }}>
                <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--primary)", lineHeight: 1 }}>{s.num}</div>
                <div style={{ fontSize: "0.8rem", opacity: 0.65, marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MAIN SERVICES */}
      <section style={{ padding: "10px 20px 30px" }}>
        <div className="container">
          <div className="service-grid">
            <ServiceCard
              img="/images/logo-demiryol.png"
              title="Ýeňil demirýollary"
              desc="Kart tölegsiz demirýol biletlerini tiz we ynamly satyn alyň"
              onClick={() => setShowModal(true)}
              delay={0.1}
            />
            <ServiceCard
              href="/tmcell"
              img="/images/logo-pay.png"
              title="Ýeňil Pay"
              desc="Daşary ýurt walýutasyny alyň ýa-da satyň"
              delay={0.15}
            />
            <ServiceCard
              href="/tmcell"
              title="TMCell & Bonus Pul"
              desc="Bonus pul alyň, Özbegistan SIM goýuň, walýuta çalyşyň"
              delay={0.2}
              color="#0d9488"
              img="/images/logo-header.png"
            />
            <ServiceCard
              href="/ulgamlar"
              title="Içerki ulgamlar"
              desc="Aydym, Hiňlen, Belet film, Belet music premium tölegleri"
              delay={0.25}
              color="#7c3aed"
            />
          </div>
        </div>
      </section>

      {/* TEKLIP BANNER */}
      <section style={{ padding: "0 20px 30px" }}>
        <div className="container">
          <Link href="/teklip">
            <div style={{
              background: "linear-gradient(135deg, #059669 0%, #0d9488 50%, #14b8a6 100%)",
              borderRadius: "var(--radius)",
              padding: "28px 30px",
              display: "flex", alignItems: "center", gap: 20,
              cursor: "pointer", position: "relative", overflow: "hidden",
              boxShadow: "0 12px 32px rgba(13,148,136,0.25)",
            }}>
              <div style={{ fontSize: "2.5rem", flexShrink: 0 }}>💡</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "white", marginBottom: 6 }}>
                  Öz hyzmatyňyzy teklip ediň
                </div>
                <div style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.85rem", lineHeight: 1.5 }}>
                  Siziň hem hödürläp biljek hyzmatyňyz barmy? Bize ýazyň — biz siziň teklipleriňize garaşýarys!
                </div>
              </div>
              <div style={{ marginLeft: "auto", color: "white", fontSize: "1.3rem", flexShrink: 0 }}>
                <i className="fas fa-arrow-right"></i>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* BAZAR BANNER */}
      <section style={{ padding: "0 20px 30px" }}>
        <div className="container">
          <Link href="/bazar">
            <div style={{
              background: "var(--glass-light)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(13,148,136,0.15)",
              borderRadius: "var(--radius)",
              padding: "28px 30px",
              display: "flex", alignItems: "center", gap: 20,
              cursor: "pointer",
              boxShadow: "var(--shadow)",
            }}>
              <div style={{ fontSize: "2.5rem", flexShrink: 0 }}>🛍️</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--primary)", marginBottom: 6 }}>
                  Sanly bazar
                </div>
                <div style={{ fontSize: "0.85rem", opacity: 0.65, lineHeight: 1.5 }}>
                  Akkauntlar, sanly harytlar we hyzmatlar — hemmesi bir ýerde. Öz harydyňyzy satmak hem mümkin!
                </div>
              </div>
              <div style={{ marginLeft: "auto", color: "var(--primary)", fontSize: "1.3rem", flexShrink: 0 }}>
                <i className="fas fa-arrow-right"></i>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* SOCIAL */}
      <section style={{ padding: "0 20px 30px" }}>
        <div className="container" style={{ textAlign: "center" }}>
          <h3 style={{ marginBottom: 18, fontWeight: 700, fontSize: "1rem", opacity: 0.65 }}>Biziň sahypalarymyz:</h3>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            {[
              { href: "http://tiktok.com/@yenil_", icon: "fab fa-tiktok", color: "#000" },
              { href: "https://www.instagram.com/yenil_tm", icon: "fab fa-instagram", color: "#e1306c" },
              { href: "http://t.me/yenil_tm", icon: "fab fa-telegram", color: "#0088cc" },
              { href: "https://s.imoim.net/DNCXX6", icon: "fas fa-comment-dots", color: "#25d366" },
            ].map((s, i) => (
              <a key={i} href={s.href} target="_blank" rel="noopener noreferrer"
                style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--gradient)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", transition: "transform 0.3s ease, box-shadow 0.3s ease" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px) scale(1.1)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 20px rgba(13,148,136,0.4)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "none"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
              >
                <i className={s.icon}></i>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section style={{ padding: "0 20px 40px" }}>
        <div className="container">
          <h3 style={{ marginBottom: 18, fontWeight: 700, fontSize: "1.1rem" }}>
            <i className="fas fa-star" style={{ color: "#f59e0b", marginRight: 8 }}></i>
            Müşderilerimiziň pikirleri
          </h3>
          <div className="reviews-track">
            {shuffled.map((r, i) => (
              <div key={i} className="review-card">
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--gradient)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "0.85rem", flexShrink: 0 }}>
                    {r.author[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--primary)" }}>{r.author}</div>
                    <div style={{ fontSize: "0.7rem", opacity: 0.5 }}>
                      {"★".repeat(5)}
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: "0.82rem", lineHeight: 1.5, opacity: 0.75 }}>{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEMIRYOL MODAL */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center", padding: 20 }} onClick={() => setShowModal(false)}>
          <div className="glass-card" style={{ maxWidth: 380, width: "100%", padding: 28, textAlign: "center", animation: "fadeInUp 0.4s ease" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>🚂</div>
            <h3 style={{ color: "var(--primary)", marginBottom: 10, fontSize: "1.2rem" }}>Ulgam häzirki wagtda işlämeýär</h3>
            <p style={{ lineHeight: 1.6, opacity: 0.75, marginBottom: 20, fontSize: "0.9rem" }}>Bu bölümde düzeltme işleri dowam edýär. Siziň üçin ýene hem işläp başlaýar!</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/demiryol">
                <button className="btn-primary" style={{ padding: "10px 20px", fontSize: "0.9rem" }}>
                  <i className="fas fa-arrow-right"></i> Bilet buýurmak
                </button>
              </Link>
              <button className="btn-secondary" style={{ padding: "10px 20px", fontSize: "0.9rem" }} onClick={() => setShowModal(false)}>
                Ýap
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
