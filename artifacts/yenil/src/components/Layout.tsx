import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useBonusPul } from "@/contexts/BonusPulContext";

function useTheme() {
  const [theme, setTheme] = useState<string>(() => localStorage.getItem("theme") || "light-mode");
  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);
  return { theme, toggleTheme: () => setTheme(t => t === "dark-mode" ? "light-mode" : "dark-mode") };
}

const NAV = [
  { href: "/", icon: "fa-home", label: "Baş Sahypa" },
  { href: "/demiryol", icon: "fa-train", label: "Demirýol" },
  { href: "/tmcell", icon: "fa-sim-card", label: "TMCell" },
  { href: "/ulgamlar", icon: "fa-th-large", label: "Ulgamlar" },
  { href: "/bazar", icon: "fa-store", label: "Bazar" },
  { href: "/about", icon: "fa-info-circle", label: "Biz Barada" },
  { href: "/help", icon: "fa-headset", label: "Ýardam" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [location] = useLocation();
  const { balance } = useBonusPul();
  const isDark = theme === "dark-mode";

  useEffect(() => { setMenuOpen(false); }, [location]);

  const leftNav = NAV.slice(0, 3);
  const rightNav = NAV.slice(3, 5);
  const moreNav = NAV.slice(5);

  const linkStyle = (href: string): React.CSSProperties => ({
    color: location === href ? "var(--primary)" : isDark ? "rgba(241,245,249,0.8)" : "rgba(30,41,59,0.75)",
    fontWeight: location === href ? 700 : 600,
    fontSize: "0.82rem",
    transition: "color 0.3s ease",
    display: "flex",
    alignItems: "center",
    gap: 5,
    whiteSpace: "nowrap",
  });

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* HEADER */}
      <header className="sticky-header">
        <div className="container" style={{ position: "relative" }}>
          <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
            {/* Left nav */}
            <ul className="nav-desktop-left" style={{ display: "flex", listStyle: "none", gap: 18, margin: 0, padding: 0, alignItems: "center" }}>
              {leftNav.map(l => (
                <li key={l.href}>
                  <Link href={l.href} style={linkStyle(l.href)}>
                    <i className={`fas ${l.icon}`}></i> {l.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Hamburger (mobile) */}
            <button
              className="menu-toggle-btn"
              onClick={() => setMenuOpen(o => !o)}
              style={{
                display: "none", flexDirection: "column", justifyContent: "space-between",
                width: 28, height: 22, background: "none", border: "none", padding: 0, flexShrink: 0,
              }}
            >
              {[0, 1, 2].map(i => (
                <span key={i} style={{
                  display: "block", height: 2.5, background: "var(--primary)", borderRadius: 3, transition: "all 0.3s ease",
                  transform: menuOpen ? (i === 0 ? "rotate(45deg) translate(7px, 7px)" : i === 2 ? "rotate(-45deg) translate(7px, -7px)" : "none") : "none",
                  opacity: menuOpen && i === 1 ? 0 : 1,
                }} />
              ))}
            </button>

            {/* Right nav */}
            <ul className="nav-desktop-right" style={{ display: "flex", listStyle: "none", gap: 16, margin: 0, padding: 0, alignItems: "center" }}>
              {rightNav.map(l => (
                <li key={l.href}>
                  <Link href={l.href} style={linkStyle(l.href)}>
                    <i className={`fas ${l.icon}`}></i> {l.label}
                  </Link>
                </li>
              ))}
              {moreNav.map(l => (
                <li key={l.href}>
                  <Link href={l.href} style={linkStyle(l.href)}>
                    <i className={`fas ${l.icon}`}></i> {l.label}
                  </Link>
                </li>
              ))}

              {/* Bonus Pul Badge */}
              <li>
                <Link href="/tmcell">
                  <div className="bp-badge">
                    💰 {balance.toFixed(2)} BP
                  </div>
                </Link>
              </li>

              {/* Theme toggle */}
              <li>
                <button onClick={toggleTheme} style={{ background: "var(--gradient)", color: "white", border: "none", width: 34, height: 34, borderRadius: "50%", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 12px rgba(13,148,136,0.3)" }}>
                  {isDark ? "☀️" : "🌙"}
                </button>
              </li>
            </ul>
          </nav>

          {/* Center Logo */}
          <div style={{ position: "absolute", left: "50%", top: -90, transform: "translateX(-50%)", zIndex: 99, pointerEvents: "none" }}>
            <Link href="/" style={{ pointerEvents: "all" }}>
              <img src="/images/logo-header.png" alt="Ýeňil" style={{ height: 245, width: "auto", filter: isDark ? "brightness(0.9)" : "none", transition: "filter 0.3s ease" }} />
            </Link>
          </div>
        </div>

        {/* Mobile menu overlay */}
        {menuOpen && (
          <>
            <div onClick={() => setMenuOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 997 }} />
            <div style={{
              position: "fixed", top: 0, left: 0, width: "75%", maxWidth: 300, height: "100vh",
              background: isDark ? "rgba(15,23,42,0.98)" : "rgba(240,253,250,0.98)",
              backdropFilter: "blur(20px)",
              zIndex: 998, padding: "70px 24px 24px",
              boxShadow: "4px 0 32px rgba(0,0,0,0.2)",
              display: "flex", flexDirection: "column", gap: 4,
              animation: "slideInLeft 0.3s ease",
              overflowY: "auto",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 0", borderBottom: "1px solid rgba(13,148,136,0.1)", marginBottom: 8 }}>
                <Link href="/tmcell" onClick={() => setMenuOpen(false)}>
                  <div className="bp-badge" style={{ fontSize: "0.9rem" }}>💰 {balance.toFixed(2)} BP</div>
                </Link>
              </div>
              {NAV.map(l => (
                <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "13px 14px",
                  borderRadius: "var(--radius-sm)",
                  background: location === l.href ? "rgba(13,148,136,0.12)" : "transparent",
                  color: location === l.href ? "var(--primary)" : isDark ? "var(--dark-text)" : "var(--light-text)",
                  fontWeight: location === l.href ? 700 : 600,
                  fontSize: "0.95rem", transition: "all 0.2s ease",
                }}>
                  <i className={`fas ${l.icon}`} style={{ color: "var(--primary)", width: 18, textAlign: "center" }}></i>
                  {l.label}
                </Link>
              ))}
              <div className="gradient-divider" />
              <button onClick={() => { toggleTheme(); setMenuOpen(false); }} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "13px 14px",
                borderRadius: "var(--radius-sm)", background: "none", border: "none",
                color: isDark ? "var(--dark-text)" : "var(--light-text)",
                fontWeight: 600, fontSize: "0.95rem", cursor: "pointer", fontFamily: "Poppins, sans-serif",
              }}>
                <span style={{ fontSize: "1.1rem", width: 18, textAlign: "center" }}>{isDark ? "☀️" : "🌙"}</span>
                {isDark ? "Ýagty tema" : "Garaňky tema"}
              </button>
            </div>
          </>
        )}
      </header>

      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {children}
      </main>

      {/* FOOTER */}
      <footer className="site-footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <div style={{ fontWeight: 800, fontSize: "1.2rem", color: "var(--secondary)", marginBottom: 8 }}>Ýeňil</div>
              <p style={{ opacity: 0.6, fontSize: "0.85rem", lineHeight: 1.6 }}>Türkmenistanda iň ynamly onlayn töleg we bilet platformasy.</p>
              <div className="footer-social">
                {[
                  { href: "http://tiktok.com/@yenil_", icon: "fab fa-tiktok" },
                  { href: "https://www.instagram.com/yenil_tm", icon: "fab fa-instagram" },
                  { href: "http://t.me/yenil_tm", icon: "fab fa-telegram" },
                  { href: "https://s.imoim.net/DNCXX6", icon: "fas fa-comment-dots" },
                ].map((s, i) => (
                  <a key={i} href={s.href} target="_blank" rel="noopener noreferrer">
                    <i className={s.icon}></i>
                  </a>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 12, color: "rgba(241,245,249,0.7)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: 1 }}>Hyzmatlary</div>
              {[
                { href: "/demiryol", label: "Ýeňil Demirýol" },
                { href: "/tmcell", label: "TMCell & Bonus Pul" },
                { href: "/ulgamlar", label: "Içerki ulgamlar" },
                { href: "/bazar", label: "Sanly bazar" },
              ].map(l => (
                <Link key={l.href} href={l.href} style={{ display: "block", color: "rgba(241,245,249,0.55)", fontSize: "0.85rem", marginBottom: 6, transition: "color 0.2s ease" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--secondary)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(241,245,249,0.55)"}
                >
                  {l.label}
                </Link>
              ))}
            </div>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 12, color: "rgba(241,245,249,0.7)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: 1 }}>Habarlaşmak</div>
              {[
                { icon: "fa-phone-alt", label: "+993 71 789091" },
                { icon: "fa-envelope", label: "menturkmen111@gmail.com" },
                { icon: "fa-comment-dots", label: "IMO: 71789091" },
              ].map((c, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, color: "rgba(241,245,249,0.55)", fontSize: "0.82rem" }}>
                  <i className={`fas ${c.icon}`} style={{ color: "var(--secondary)", width: 16 }}></i>
                  {c.label}
                </div>
              ))}
            </div>
          </div>
          <div className="gradient-divider" />
          <div style={{ textAlign: "center", opacity: 0.4, fontSize: "0.8rem" }}>
            © 2025 Ýeňil. Hemme hukuklar goralan.
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes slideInLeft { from { transform: translateX(-100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @media (max-width: 768px) {
          .nav-desktop-left, .nav-desktop-right { display: none !important; }
          .menu-toggle-btn { display: flex !important; }
        }
        @media (min-width: 769px) {
          .menu-toggle-btn { display: none !important; }
        }
      `}</style>
    </div>
  );
}
