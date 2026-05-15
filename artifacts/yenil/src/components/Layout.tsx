import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";

function useTheme() {
  const [theme, setTheme] = useState<string>(() => {
    return localStorage.getItem("theme") || "light-mode";
  });

  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme(t => t === "dark-mode" ? "light-mode" : "dark-mode");
  }

  return { theme, toggleTheme };
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [location] = useLocation();
  const menuRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  const isDark = theme === "dark-mode";

  const navLinks = [
    { href: "/", icon: "fa-home", label: "Baş Sahypa" },
    { href: "/demiryol", icon: "fa-train", label: "Ýeňil demirýollary" },
    { href: "/pay", icon: "fa-wallet", label: "Ýeňil Pay" },
    { href: "/about", icon: "fa-info-circle", label: "Biz Barada" },
    { href: "/help", icon: "fa-headset", label: "Ýardam" },
  ];

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={{
        padding: "10px 0",
        position: "sticky",
        top: 0,
        background: isDark ? "var(--dark-bg)" : "var(--light-bg)",
        zIndex: 100,
        boxShadow: "var(--shadow)",
        transition: "background 0.4s ease",
      }}>
        <div className="container">
          <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 40 }}>
            {/* Left menu */}
            <ul style={{ display: "flex", listStyle: "none", gap: 20, margin: 0, padding: 0, alignItems: "center" }}
              className="nav-desktop-left">
              {navLinks.slice(0, 3).map(link => (
                <li key={link.href}>
                  <Link href={link.href} style={{
                    color: location === link.href ? "var(--primary)" : isDark ? "var(--dark-text)" : "var(--light-text)",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    transition: "color 0.3s ease",
                  }}>
                    <i className={`fas ${link.icon}`}></i> {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Hamburger */}
            <button
              onClick={() => setMenuOpen(o => !o)}
              style={{
                display: "none",
                width: 30,
                height: 24,
                background: "none",
                border: "none",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: 0,
              }}
              className="menu-toggle-btn"
              id="menu-toggle"
            >
              <span style={{ display: "block", height: 3, background: isDark ? "var(--dark-text)" : "var(--light-text)", borderRadius: 3, transition: "all 0.3s ease", transform: menuOpen ? "rotate(45deg) translate(6px, 6px)" : "none" }}></span>
              <span style={{ display: "block", height: 3, background: isDark ? "var(--dark-text)" : "var(--light-text)", borderRadius: 3, transition: "all 0.3s ease", opacity: menuOpen ? 0 : 1 }}></span>
              <span style={{ display: "block", height: 3, background: isDark ? "var(--dark-text)" : "var(--light-text)", borderRadius: 3, transition: "all 0.3s ease", transform: menuOpen ? "rotate(-45deg) translate(7px, -7px)" : "none" }}></span>
            </button>

            {/* Right menu */}
            <ul style={{ display: "flex", listStyle: "none", gap: 20, margin: 0, padding: 0, alignItems: "center" }}
              className="nav-desktop-right">
              {navLinks.slice(3).map(link => (
                <li key={link.href}>
                  <Link href={link.href} style={{
                    color: location === link.href ? "var(--primary)" : isDark ? "var(--dark-text)" : "var(--light-text)",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    transition: "color 0.3s ease",
                  }}>
                    <i className={`fas ${link.icon}`}></i> {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <button
                  onClick={toggleTheme}
                  style={{
                    background: "var(--primary)",
                    color: "white",
                    border: "none",
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    fontSize: 14,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.3s ease",
                  }}
                >
                  {isDark ? "☀️" : "🌙"}
                </button>
              </li>
            </ul>
          </nav>

          {/* Center logo */}
          <div style={{
            position: "absolute",
            left: "50%",
            top: -100,
            transform: "translateX(-50%)",
            zIndex: 99,
            animation: "logoFloat 3s ease-in-out infinite",
          }}>
            <Link href="/">
              <img
                src="/images/logo-header.png"
                alt="Ýeňil"
                style={{ height: 265, width: "auto", filter: isDark ? "brightness(0.9)" : "none" }}
              />
            </Link>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <ul ref={menuRef} style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "40%",
            height: "27vh",
            background: isDark
              ? "linear-gradient(135deg, var(--dark-bg) 80%, rgba(13,148,136,0.1) 100%)"
              : "linear-gradient(135deg, var(--light-bg) 80%, rgba(13,148,136,0.05) 100%)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: 0,
            padding: 0,
            zIndex: 999,
            listStyle: "none",
            borderRadius: "0 0 20px 20px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          }}>
            {navLinks.map((link, i) => (
              <li key={link.href} style={{ width: "100%" }}>
                <Link href={link.href} style={{
                  display: "block",
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: "var(--primary)",
                  padding: "10px 20px",
                  width: "100%",
                  textAlign: "center",
                  animationDelay: `${(i + 1) * 0.1}s`,
                }}>
                  <i className={`fas ${link.icon}`}></i> {link.label}
                </Link>
              </li>
            ))}
            <li style={{ width: "100%", textAlign: "center", padding: "5px" }}>
              <button
                onClick={toggleTheme}
                style={{ background: "none", border: "none", fontSize: "1.3rem", color: "var(--primary)", fontWeight: 700, cursor: "pointer" }}
              >
                {isDark ? "☀️" : "🌙"}
              </button>
            </li>
          </ul>
        )}
        {menuOpen && (
          <div
            onClick={() => setMenuOpen(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              background: "rgba(0,0,0,0.3)",
              zIndex: 998,
            }}
          />
        )}
      </header>

      <main style={{ flex: 1 }}>
        {children}
      </main>

      <footer style={{
        textAlign: "center",
        padding: "20px",
        opacity: 0.7,
        fontSize: "0.9rem",
        marginTop: "auto",
        borderTop: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)",
        background: isDark ? "var(--dark-bg)" : "var(--light-bg)",
        transition: "background 0.4s ease",
      }}>
        © 2025 Ýeňil. Hemme hukuklar goralan.
      </footer>

      <style>{`
        @keyframes logoFloat {
          0%, 100% { transform: translateX(-50%) translateY(0px); }
          50% { transform: translateX(-50%) translateY(-3px); }
        }
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
