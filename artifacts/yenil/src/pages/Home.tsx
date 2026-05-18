import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useBonusPul } from "@/contexts/BonusPulContext";
import {
  WalletIcon, LightbulbIcon, ShoppingBagIcon, TrainIcon,
  StarIcon, ArrowRightIcon, SparkleIcon, GridIcon,
} from "@/components/Icons";

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
  const [showModal, setShowModal] = useState(false);
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
            <ServiceCard
              img="/images/logo-demiryol.png"
              title="Ýeňil demirýollary"
              desc="Kart tölegsiz demirýol biletlerini tiz we ynamly satyn alyň"
              onClick={() => setShowModal(true)}
              delay={0.05}
            />
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

      {/* ── DEMIRYOL MODAL ── */}
      {showModal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center", padding: 20 }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="glass-card"
            style={{ maxWidth: 380, width: "100%", padding: 32, textAlign: "center", animation: "fadeInUp 0.4s ease" }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ width: 68, height: 68, borderRadius: 20, background: "var(--gradient)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: "0 8px 24px rgba(13,148,136,0.3)", color: "white" }}>
              <TrainIcon size={30} strokeWidth={1.6} />
            </div>
            <h3 style={{ color: "var(--primary)", marginBottom: 10, fontSize: "1.15rem" }}>Ulgam häzirki wagtda işlämeýär</h3>
            <p style={{ lineHeight: 1.65, opacity: 0.72, marginBottom: 22, fontSize: "0.88rem" }}>
              Bu bölümde düzeltme işleri dowam edýär. Siziň üçin ýene hem işläp başlaýar!
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/demiryol">
                <button className="btn-primary" style={{ padding: "10px 20px", fontSize: "0.88rem" }}>
                  <i className="fas fa-arrow-right" /> Bilet buýurmak
                </button>
              </Link>
              <button className="btn-secondary" style={{ padding: "10px 20px", fontSize: "0.88rem" }} onClick={() => setShowModal(false)}>
                Ýap
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
