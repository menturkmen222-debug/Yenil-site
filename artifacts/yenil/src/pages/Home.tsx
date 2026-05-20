import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useBonusPul } from "@/contexts/BonusPulContext";
import {
  WalletIcon, LightbulbIcon, ShoppingBagIcon,
  StarIcon, ArrowRightIcon, GridIcon,
} from "@/components/Icons";

function MapPinIcon({ size = 26, strokeWidth = 1.7 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21C12 21 5 13.5 5 8.5a7 7 0 0 1 14 0C19 13.5 12 21 12 21z"/>
      <circle cx="12" cy="8.5" r="2.5"/>
    </svg>
  );
}

const reviews = [
  { author: "Amangül", text: "Bilet almak aňsat eken maňa 2 sagadyň içinde bilet alyp berdiler we ulanmak hem aňsat" },
  { author: "Didar", text: "Demiryyolla hem tmcell goşaýmala — indi otran ýerimden kösenmän bilet alýan. Ýeňil sag bol!" },
  { author: "Jeren", text: "Başda ynanmandym ýöne ynamymy ödediler, aňyrsy 4 sagadyň içinde sms ugratdylar." },
  { author: "Serik", text: "Shundan bilet alyp wagzalda gymmat satýalar — maslahat berýän!" },
  { author: "Gözel", text: "Örän gowy ýakynda bilet tapylman 150m berip gitdim, ondada mesda hem ýok, ýene bular gowy" },
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

/* ── Premium icon badge for service cards without a logo image ── */
function IconBadge({ children, color = "var(--primary)" }: { children: React.ReactNode; color?: string }) {
  return (
    <div style={{
      width: 76, height: 76, borderRadius: 22,
      background: `linear-gradient(140deg, ${color}, ${color}cc)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: `0 10px 28px ${color}35`,
      color: "white", flexShrink: 0,
    }}>
      {children}
    </div>
  );
}

function ServiceCard({
  href, img, title, desc, onClick, delay = 0, color = "var(--primary)", iconEl,
}: {
  href?: string; img?: string; title: string; desc: string;
  onClick?: () => void; delay?: number; color?: string; iconEl?: React.ReactNode;
}) {
  const content = (
    <div className="service-card-premium animate-in" style={{ animationDelay: `${delay}s`, cursor: "pointer" }} onClick={onClick}>
      <div style={{ height: 90, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
        {img ? (
          <img src={img} alt={title} style={{ height: 76, width: "auto", objectFit: "contain", borderRadius: 12 }} />
        ) : iconEl ? (
          <IconBadge color={color}>{iconEl}</IconBadge>
        ) : (
          <IconBadge color={color}><i className="fas fa-th-large" style={{ fontSize: "1.6rem" }} /></IconBadge>
        )}
      </div>
      <div style={{ fontWeight: 800, fontSize: "0.97rem", color: "var(--primary)", marginBottom: 5, letterSpacing: "0.01em" }}>{title}</div>
      <div style={{ fontSize: "0.78rem", opacity: 0.62, lineHeight: 1.55 }}>{desc}</div>
    </div>
  );
  if (href) return <Link href={href}>{content}</Link>;
  return content;
}

export default function Home() {
  const [shuffled] = useState(() => shuffle(reviews));
  const { balance } = useBonusPul();
  const [nums, setNums] = useState({ users: 0, orders: 0, rating: 0 });

  useEffect(() => {
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
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ flex: 1 }}>

      {/* ── HERO ── */}
      <section className="hero">
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <h1 className="animate-in">
            Ýeňil — Türkmenistanda iň ynamly onlayn hyzmatlar platformasy
          </h1>
          <p className="animate-in animate-delay-1" style={{ marginBottom: 28 }}>
            Demirýol biletleri, daşary ýurt walýutasy, TMCell hyzmatlary we has köp zat — hemmesi bir ýerde, 7/24 elýeterli.
          </p>
          <div className="hero-balance-chip animate-in animate-delay-2">
            <WalletIcon size={16} strokeWidth={2} />
            <span>Bonus pul balansyňyz:</span>
            <strong>{balance.toFixed(2)} BP</strong>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ padding: "28px 20px" }}>
        <div className="container">
          <div className="stats-row">
            {[
              { num: `${nums.users}+`, label: "Müşderi" },
              { num: `${nums.orders}+`, label: "Tamamlanan sargyt" },
              { num: `${nums.rating}%`, label: "Kanagatlanma" },
            ].map((s, i) => (
              <div key={i} className="stat-card">
                <div className="stat-num">{s.num}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MAIN SERVICES ── */}
      <section style={{ padding: "0 20px 28px" }}>
        <div className="container">
          <div className="service-grid">
            <Link href="/gatnaw">
              <div className="service-card-premium animate-in" style={{ animationDelay: "0.05s", cursor: "pointer", gridColumn: "span 2", display: "flex", flexDirection: "row", alignItems: "center", gap: 20, padding: "22px 24px", textAlign: "left" }}>
                <div style={{
                  width: 72, height: 72, borderRadius: 20, flexShrink: 0,
                  background: "linear-gradient(135deg, #0d9488, #14b8a6)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 10px 28px rgba(13,148,136,0.35)", color: "white",
                }}>
                  <i className="fas fa-route" style={{ fontSize: "1.7rem" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 900, fontSize: "1.05rem", color: "var(--primary)", marginBottom: 4, letterSpacing: "0.01em" }}>
                    Gatnaw we Ulag
                  </div>
                  <div style={{ fontSize: "0.8rem", opacity: 0.62, lineHeight: 1.55 }}>
                    Demirýol, howa, taksi, logistika — 10 kategoriýa, 26 hyzmat
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 10 }}>
                    <span style={{
                      fontSize: "0.7rem", fontWeight: 700,
                      background: "rgba(13,148,136,0.1)",
                      border: "1px solid rgba(13,148,136,0.2)",
                      borderRadius: 50, padding: "3px 10px", color: "var(--primary)",
                    }}>
                      <i className="fas fa-train" style={{ marginRight: 4 }} />
                      Demirýol işleýär
                    </span>
                    <ArrowRightIcon size={16} strokeWidth={2.5} style={{ color: "var(--primary)" }} />
                  </div>
                </div>
              </div>
            </Link>
            <ServiceCard
              href="/tmcell"
              img="/images/logo-pay.png"
              title="Ýeňil Pay"
              desc="Daşary ýurt walýutasyny alyň ýa-da satyň"
              delay={0.1}
            />
            <ServiceCard
              href="/tmcell"
              img="/images/logo-header.png"
              title="TMCell & Bonus Pul"
              desc="Bonus pul alyň, Özbegistan SIM goýuň, walýuta çalyşyň"
              delay={0.15}
            />
            <ServiceCard
              href="/ulgamlar"
              title="Içerki ulgamlar"
              desc="Aydym, Hiňlen, Belet film, Belet music premium tölegleri"
              delay={0.2}
              color="#7c3aed"
              iconEl={<GridIcon size={32} strokeWidth={1.6} />}
            />
          </div>
        </div>
      </section>

      {/* ── TEKLIP BANNER ── */}
      <section style={{ padding: "0 20px 22px" }}>
        <div className="container">
          <Link href="/teklip">
            <div className="banner-card banner-gradient">
              <div className="banner-icon-wrap banner-icon-teklip">
                <LightbulbIcon size={26} strokeWidth={1.7} />
              </div>
              <div className="banner-body">
                <div className="banner-title">Öz hyzmatyňyzy teklip ediň</div>
                <div className="banner-desc">
                  Siziň hem hödürläp biljek hyzmatyňyz barmy? Bize ýazyň — biz siziň teklipleriňize garaşýarys!
                </div>
              </div>
              <div className="banner-arrow">
                <ArrowRightIcon size={18} strokeWidth={2} />
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* ── BAZAR BANNER ── */}
      <section style={{ padding: "0 20px 28px" }}>
        <div className="container">
          <Link href="/bazar">
            <div className="banner-card banner-glass">
              <div className="banner-icon-wrap banner-icon-bazar">
                <ShoppingBagIcon size={26} strokeWidth={1.7} />
              </div>
              <div className="banner-body">
                <div className="banner-title" style={{ color: "var(--primary)" }}>Sanly bazar</div>
                <div className="banner-desc">
                  Akkauntlar, sanly harytlar we hyzmatlar — hemmesi bir ýerde. Öz harydyňyzy satmak hem mümkin!
                </div>
              </div>
              <div className="banner-arrow" style={{ color: "var(--primary)" }}>
                <ArrowRightIcon size={18} strokeWidth={2} />
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* ── KONUM BANNER ── */}
      <section style={{ padding: "0 20px 22px" }}>
        <div className="container">
          <Link href="/konum">
            <div className="banner-card" style={{
              background: "linear-gradient(135deg, rgba(79,70,229,0.07), rgba(124,58,237,0.09))",
              border: "1.5px solid rgba(124,58,237,0.18)",
            }}>
              <div className="banner-icon-wrap" style={{
                background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                color: "white",
              }}>
                <MapPinIcon size={26} strokeWidth={1.7} />
              </div>
              <div className="banner-body">
                <div className="banner-title" style={{ color: "#4f46e5" }}>Ýer paýlaşma</div>
                <div className="banner-desc">
                  Haýsy ýerdedigiňizi aňsatlyk bilen paýlaşyň — Yandex we Google Karta bilen.
                </div>
              </div>
              <div className="banner-arrow" style={{ color: "#7c3aed" }}>
                <ArrowRightIcon size={18} strokeWidth={2} />
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* ── SOCIAL ── */}
      <section style={{ padding: "0 20px 28px" }}>
        <div className="container" style={{ textAlign: "center" }}>
          <p style={{ marginBottom: 16, fontWeight: 600, fontSize: "0.85rem", opacity: 0.55, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Biziň sahypalarymyz
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            {[
              { href: "http://tiktok.com/@yenil_", icon: "fab fa-tiktok" },
              { href: "https://www.instagram.com/yenil_tm", icon: "fab fa-instagram" },
              { href: "http://t.me/yenil_tm", icon: "fab fa-telegram" },
              { href: "https://s.imoim.net/DNCXX6", icon: "fas fa-comment-dots" },
            ].map((s, i) => (
              <a key={i} href={s.href} target="_blank" rel="noopener noreferrer" className="social-orb">
                <i className={s.icon} />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── REVIEWS ── */}
      <section style={{ padding: "0 20px 48px" }}>
        <div className="container">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <StarIcon size={16} filled strokeWidth={1.5} style={{ color: "#f59e0b" }} />
            <h3 style={{ fontWeight: 700, fontSize: "1rem" }}>Müşderilerimiziň pikirleri</h3>
          </div>
          <div className="reviews-track">
            {shuffled.map((r, i) => (
              <div key={i} className="review-card">
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div className="review-avatar">
                    {r.author[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--primary)" }}>{r.author}</div>
                    <div style={{ display: "flex", gap: 2, marginTop: 2 }}>
                      {[1, 2, 3, 4, 5].map(n => (
                        <StarIcon key={n} size={10} filled strokeWidth={1.5} style={{ color: "#f59e0b" }} />
                      ))}
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: "0.81rem", lineHeight: 1.55, opacity: 0.72 }}>{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
