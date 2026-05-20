import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useBonusPul } from "@/contexts/BonusPulContext";
import {
  WalletIcon, SunIcon, MoonIcon,
  HomeIcon, NavTrainIcon, SimCardIcon, GridIcon, StoreIcon, InfoIcon, HeadphonesIcon,
  ChevronRightIcon, UserIcon,
} from "@/components/Icons";

function useTheme() {
  const [theme, setTheme] = useState<string>(() => localStorage.getItem("theme") || "light-mode");
  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);
  return { theme, toggleTheme: () => setTheme(t => t === "dark-mode" ? "light-mode" : "dark-mode") };
}

const NAV = [
  { href: "/", Icon: HomeIcon, label: "Baş Sahypa" },
  { href: "/demiryol", Icon: NavTrainIcon, label: "Demirýol" },
  { href: "/tmcell", Icon: SimCardIcon, label: "TMCell" },
  { href: "/ulgamlar", Icon: GridIcon, label: "Ulgamlar" },
  { href: "/bazar", Icon: StoreIcon, label: "Bazar" },
  { href: "/about", Icon: InfoIcon, label: "Biz Barada" },
  { href: "/help", Icon: HeadphonesIcon, label: "Ýardam" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [location] = useLocation();
  const { balance } = useBonusPul();
  const isDark = theme === "dark-mode";

  useEffect(() => { setMenuOpen(false); }, [location]);

  const leftNav = NAV.slice(0, 3);
  const rightNav = NAV.slice(3);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* ── HEADER ── */}
      <header className="sticky-header">
        <div className="container" style={{ position: "relative" }}>
          <nav className="main-nav">

            {/* Left nav */}
            <ul className="nav-desktop-left">
              {leftNav.map(({ href, Icon, label }) => (
                <li key={href} className="nav-item">
                  <Link href={href} className={`nav-link-item${location === href ? " active" : ""}`}>
                    <Icon size={15} strokeWidth={location === href ? 2.1 : 1.8} />
                    <span>{label}</span>
                    {location === href && <span className="nav-active-dot" />}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Hamburger */}
            <button
              className="menu-toggle-btn"
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Menýu"
            >
              <span className={`burger-bar${menuOpen ? " open-top" : ""}`} />
              <span className={`burger-bar${menuOpen ? " open-mid" : ""}`} />
              <span className={`burger-bar${menuOpen ? " open-bot" : ""}`} />
            </button>

            {/* Right nav */}
            <ul className="nav-desktop-right">
              {rightNav.map(({ href, Icon, label }) => (
                <li key={href} className="nav-item">
                  <Link href={href} className={`nav-link-item${location === href ? " active" : ""}`}>
                    <Icon size={15} strokeWidth={location === href ? 2.1 : 1.8} />
                    <span>{label}</span>
                    {location === href && <span className="nav-active-dot" />}
                  </Link>
                </li>
              ))}

              {/* Vertical divider */}
              <li className="nav-divider" aria-hidden="true" />

              {/* BP Badge */}
              <li>
                <Link href="/tmcell">
                  <div className="bp-badge">
                    <WalletIcon size={13} strokeWidth={2} />
                    <span>{balance.toFixed(2)}</span>
                    <span className="bp-unit">BP</span>
                  </div>
                </Link>
              </li>

              {/* Profile link */}
              <li>
                <Link href="/profil">
                  <div className={`profile-nav-btn${location === "/profil" ? " active" : ""}`}>
                    <UserIcon size={15} strokeWidth={location === "/profil" ? 2.2 : 1.8} />
                  </div>
                </Link>
              </li>

              {/* Theme toggle */}
              <li>
                <button
                  onClick={toggleTheme}
                  className="theme-toggle-btn"
                  aria-label={isDark ? "Ýagty tema" : "Garaňky tema"}
                >
                  {isDark
                    ? <SunIcon size={15} strokeWidth={2} />
                    : <MoonIcon size={15} strokeWidth={2} />
                  }
                </button>
              </li>
            </ul>
          </nav>

          {/* Center logo */}
          <div className="header-logo-wrap">
            <Link href="/">
              <img
                src="/images/logo-header.png"
                alt="Ýeňil"
                className="header-logo-img"
                style={{ filter: isDark ? "brightness(0.92)" : "none" }}
              />
            </Link>
          </div>
        </div>

        {/* ── Mobile menu ── */}
        {menuOpen && (
          <>
            <div className="mobile-overlay" onClick={() => setMenuOpen(false)} />
            <aside className="mobile-panel">
              {/* Panel header */}
              <div className="mobile-panel-head">
                <div className="mobile-brand-row">
                  <div className="mobile-brand-mark">Ý</div>
                  <div>
                    <div className="mobile-brand-name">Ýeňil</div>
                    <div className="mobile-brand-sub">Türkmenistanda iň ynamly hyzmatlar</div>
                  </div>
                </div>
                <Link href="/tmcell" onClick={() => setMenuOpen(false)}>
                  <div className="mobile-bp-badge">
                    <WalletIcon size={13} strokeWidth={2} />
                    <span>{balance.toFixed(2)} BP</span>
                  </div>
                </Link>
              </div>

              {/* Nav items */}
              <nav className="mobile-nav">
                {NAV.map(({ href, Icon, label }) => {
                  const isActive = location === href;
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMenuOpen(false)}
                      className={`mobile-nav-item${isActive ? " active" : ""}`}
                    >
                      <div className={`mobile-nav-icon-wrap${isActive ? " active" : ""}`}>
                        <Icon size={16} strokeWidth={isActive ? 2.2 : 1.8} />
                      </div>
                      <span className="mobile-nav-label">{label}</span>
                      <ChevronRightIcon size={13} strokeWidth={2} className="mobile-nav-arrow" />
                    </Link>
                  );
                })}

                {/* Profile link in mobile */}
                <Link
                  href="/profil"
                  onClick={() => setMenuOpen(false)}
                  className={`mobile-nav-item${location === "/profil" ? " active" : ""}`}
                >
                  <div className={`mobile-nav-icon-wrap${location === "/profil" ? " active" : ""}`}>
                    <UserIcon size={16} strokeWidth={location === "/profil" ? 2.2 : 1.8} />
                  </div>
                  <span className="mobile-nav-label">Profilim</span>
                  <ChevronRightIcon size={13} strokeWidth={2} className="mobile-nav-arrow" />
                </Link>
              </nav>

              <div className="mobile-divider" />

              {/* Theme toggle */}
              <button
                className="mobile-theme-btn"
                onClick={() => { toggleTheme(); setMenuOpen(false); }}
              >
                <div className="mobile-nav-icon-wrap">
                  {isDark
                    ? <SunIcon size={16} strokeWidth={1.9} />
                    : <MoonIcon size={16} strokeWidth={1.9} />
                  }
                </div>
                <span className="mobile-nav-label">{isDark ? "Ýagty tema" : "Garaňky tema"}</span>
              </button>

              {/* Decorative bottom pattern */}
              <div className="mobile-panel-deco" aria-hidden="true">
                {Array.from({ length: 25 }).map((_, i) => (
                  <div key={i} className="deco-dot" />
                ))}
              </div>
            </aside>
          </>
        )}
      </header>

      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {children}
      </main>

      {/* ── FOOTER ── */}
      <footer className="site-footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <div className="footer-brand">Ýeňil</div>
              <p style={{ opacity: 0.55, fontSize: "0.83rem", lineHeight: 1.65, marginBottom: 16 }}>
                Türkmenistanda iň ynamly onlayn töleg we bilet platformasy.
              </p>
              <div className="footer-social">
                {[
                  { href: "http://tiktok.com/@yenil_", icon: "fab fa-tiktok" },
                  { href: "https://www.instagram.com/yenil_tm", icon: "fab fa-instagram" },
                  { href: "http://t.me/yenil_tm", icon: "fab fa-telegram" },
                  { href: "https://s.imoim.net/DNCXX6", icon: "fas fa-comment-dots" },
                ].map((s, i) => (
                  <a key={i} href={s.href} target="_blank" rel="noopener noreferrer" className="footer-social-link">
                    <i className={s.icon} />
                  </a>
                ))}
              </div>
            </div>
            <div>
              <div className="footer-section-title">Hyzmatlary</div>
              {[
                { href: "/demiryol", label: "Ýeňil Demirýol" },
                { href: "/tmcell", label: "TMCell & Bonus Pul" },
                { href: "/ulgamlar", label: "Içerki ulgamlar" },
                { href: "/bazar", label: "Sanly bazar" },
              ].map(l => (
                <Link key={l.href} href={l.href} className="footer-link">{l.label}</Link>
              ))}
            </div>
            <div>
              <div className="footer-section-title">Habarlaşmak</div>
              {[
                { icon: "fa-phone-alt", label: "+993 71 789091" },
                { icon: "fa-envelope", label: "menturkmen111@gmail.com" },
                { icon: "fa-comment-dots", label: "IMO: 71789091" },
              ].map((c, i) => (
                <div key={i} className="footer-contact-row">
                  <i className={`fas ${c.icon}`} style={{ color: "var(--secondary)", width: 16, flexShrink: 0 }} />
                  <span>{c.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="gradient-divider" />
          <div style={{ textAlign: "center", opacity: 0.35, fontSize: "0.78rem", letterSpacing: "0.03em" }}>
            © 2025 Ýeňil. Hemme hukuklar goralan.
          </div>
        </div>
      </footer>
    </div>
  );
}
