import { useState } from "react";
import { Link } from "wouter";
import { TRANSPORT_CATEGORIES, type TransportService, type ServiceStatus } from "@/config/transportFeatures";

function StatusBadge({ status }: { status: ServiceStatus }) {
  if (status === "active") return null;
  if (status === "coming_soon") {
    return (
      <span style={{
        position: "absolute", top: 8, right: 8,
        fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.04em",
        padding: "2px 7px", borderRadius: 20,
        background: "rgba(245,158,11,0.12)",
        color: "#d97706",
        border: "1px solid rgba(245,158,11,0.25)",
        textTransform: "uppercase",
      }}>
        Yakında
      </span>
    );
  }
  return (
    <span style={{
      position: "absolute", top: 8, right: 8,
      fontSize: "0.6rem", fontWeight: 700,
      padding: "2px 7px", borderRadius: 20,
      background: "rgba(100,116,139,0.12)",
      color: "#64748b",
      border: "1px solid rgba(100,116,139,0.2)",
    }}>
      Off
    </span>
  );
}

function ServiceItem({ service }: { service: TransportService }) {
  const isActive = service.status === "active";
  const inner = (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        padding: "16px 10px 14px",
        borderRadius: 16,
        background: isActive
          ? `linear-gradient(145deg, ${service.color}12, ${service.color}06)`
          : "rgba(100,116,139,0.04)",
        border: `1.5px solid ${isActive ? service.color + "28" : "rgba(100,116,139,0.1)"}`,
        cursor: isActive ? "pointer" : "default",
        transition: "all 0.28s cubic-bezier(0.4,0,0.2,1)",
        opacity: service.status === "disabled" ? 0.45 : 1,
        textAlign: "center",
        minHeight: 110,
        justifyContent: "center",
      }}
      className={isActive ? "gatnaw-service-active" : ""}
    >
      <StatusBadge status={service.status} />
      <div style={{
        width: 46, height: 46, borderRadius: 14,
        background: isActive
          ? `linear-gradient(135deg, ${service.color}, ${service.color}bb)`
          : "rgba(100,116,139,0.12)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: isActive ? `0 6px 18px ${service.color}30` : "none",
        color: isActive ? "white" : "#94a3b8",
        flexShrink: 0,
        transition: "all 0.28s ease",
        fontSize: "1.1rem",
      }}>
        <i className={service.icon} />
      </div>
      <div>
        <div style={{
          fontWeight: 700, fontSize: "0.78rem",
          color: isActive ? "var(--primary)" : "#64748b",
          lineHeight: 1.3, marginBottom: 2,
        }}>
          {service.title}
        </div>
        <div style={{
          fontSize: "0.67rem", opacity: 0.55,
          lineHeight: 1.4,
        }}>
          {service.description}
        </div>
      </div>
    </div>
  );

  if (isActive && service.href) {
    return <Link href={service.href}>{inner}</Link>;
  }
  return inner;
}

function CategoryBlock({
  category,
  index,
}: {
  category: typeof TRANSPORT_CATEGORIES[0];
  index: number;
}) {
  const [expanded, setExpanded] = useState(true);

  if (!category.enabled) return null;

  return (
    <div
      className="animate-in"
      style={{
        animationDelay: `${index * 0.06}s`,
        borderRadius: 20,
        overflow: "hidden",
        border: "1.5px solid rgba(13,148,136,0.1)",
        background: "var(--glass-light)",
        backdropFilter: "blur(14px)",
        boxShadow: "0 4px 24px rgba(13,148,136,0.07)",
        marginBottom: 16,
      }}
    >
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: "100%", display: "flex", alignItems: "center",
          gap: 12, padding: "16px 18px",
          background: "none", border: "none", cursor: "pointer",
          fontFamily: "Poppins, sans-serif",
          borderBottom: expanded ? "1px solid rgba(13,148,136,0.08)" : "none",
          transition: "background 0.2s ease",
          textAlign: "left",
        }}
      >
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: category.gradient,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "white", fontSize: "1rem", flexShrink: 0,
          boxShadow: `0 4px 14px ${category.color}30`,
        }}>
          <i className={category.icon} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontWeight: 800, fontSize: "0.93rem",
            color: "var(--primary)", lineHeight: 1.2,
          }}>
            {category.title}
          </div>
          <div style={{ fontSize: "0.7rem", opacity: 0.5, marginTop: 2 }}>
            {category.services.length} hyzmat
          </div>
        </div>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: `${category.color}12`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: category.color,
          transition: "transform 0.25s ease",
          transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
          flexShrink: 0,
        }}>
          <i className="fas fa-chevron-down" style={{ fontSize: "0.75rem" }} />
        </div>
      </button>

      {expanded && (
        <div style={{
          padding: "14px 14px 16px",
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 10,
        }}>
          {category.services.map(service => (
            <ServiceItem key={service.id} service={service} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Gatnaw() {
  const totalServices = TRANSPORT_CATEGORIES.reduce(
    (sum, cat) => sum + cat.services.length, 0
  );
  const activeServices = TRANSPORT_CATEGORIES.reduce(
    (sum, cat) => sum + cat.services.filter(s => s.status === "active").length, 0
  );

  return (
    <div style={{ flex: 1 }}>
      {/* ── HERO ── */}
      <section style={{
        background: "linear-gradient(135deg, #0d9488 0%, #059669 50%, #14b8a6 100%)",
        color: "white",
        padding: "52px 20px 44px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          background: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4z'/%3E%3C/g%3E%3C/svg%3E\")",
        }} />
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <div className="animate-in" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(255,255,255,0.15)",
            border: "1px solid rgba(255,255,255,0.25)",
            borderRadius: 50, padding: "6px 16px",
            fontSize: "0.78rem", fontWeight: 600, marginBottom: 16,
            backdropFilter: "blur(8px)",
          }}>
            <i className="fas fa-route" />
            Transport Merkezi
          </div>
          <h1 className="animate-in animate-delay-1" style={{
            fontSize: "clamp(1.6rem, 4vw, 2.3rem)",
            fontWeight: 900, marginBottom: 12,
            textShadow: "0 2px 12px rgba(0,0,0,0.15)",
          }}>
            Gatnaw we Ulag
          </h1>
          <p className="animate-in animate-delay-2" style={{
            fontSize: "0.95rem", opacity: 0.9,
            maxWidth: 480, margin: "0 auto 24px",
            lineHeight: 1.65,
          }}>
            Türkmenistanyň ähli transport hyzmatlary bir ýerde — döwlet, hususy we logistika
          </p>
          <div className="animate-in animate-delay-3" style={{
            display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap",
          }}>
            <div style={{
              background: "rgba(255,255,255,0.18)",
              border: "1px solid rgba(255,255,255,0.28)",
              borderRadius: 14, padding: "10px 20px",
              backdropFilter: "blur(8px)",
              textAlign: "center",
            }}>
              <div style={{ fontSize: "1.4rem", fontWeight: 900 }}>{TRANSPORT_CATEGORIES.length}</div>
              <div style={{ fontSize: "0.7rem", opacity: 0.8 }}>Kategoriýa</div>
            </div>
            <div style={{
              background: "rgba(255,255,255,0.18)",
              border: "1px solid rgba(255,255,255,0.28)",
              borderRadius: 14, padding: "10px 20px",
              backdropFilter: "blur(8px)",
              textAlign: "center",
            }}>
              <div style={{ fontSize: "1.4rem", fontWeight: 900 }}>{totalServices}</div>
              <div style={{ fontSize: "0.7rem", opacity: 0.8 }}>Hyzmat</div>
            </div>
            <div style={{
              background: "rgba(255,255,255,0.18)",
              border: "1px solid rgba(255,255,255,0.28)",
              borderRadius: 14, padding: "10px 20px",
              backdropFilter: "blur(8px)",
              textAlign: "center",
            }}>
              <div style={{ fontSize: "1.4rem", fontWeight: 900 }}>{activeServices}</div>
              <div style={{ fontSize: "0.7rem", opacity: 0.8 }}>Işleýär</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── LEGEND ── */}
      <section style={{ padding: "16px 20px 4px" }}>
        <div className="container">
          <div style={{
            display: "flex", gap: 16, flexWrap: "wrap",
            fontSize: "0.73rem", opacity: 0.65, fontWeight: 600,
          }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{
                width: 8, height: 8, borderRadius: "50%",
                background: "var(--primary)", display: "inline-block",
              }} />
              Işleýär
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{
                width: 8, height: 8, borderRadius: "50%",
                background: "#f59e0b", display: "inline-block",
              }} />
              Ýakynda
            </span>
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <section style={{ padding: "16px 20px 48px" }}>
        <div className="container">
          {TRANSPORT_CATEGORIES.map((cat, i) => (
            <CategoryBlock key={cat.id} category={cat} index={i} />
          ))}
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section style={{ padding: "0 20px 40px" }}>
        <div className="container">
          <div style={{
            borderRadius: 20,
            background: "linear-gradient(135deg, rgba(13,148,136,0.08), rgba(20,184,166,0.05))",
            border: "1.5px solid rgba(13,148,136,0.15)",
            padding: "24px 22px",
            textAlign: "center",
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16,
              background: "var(--gradient)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 14px", color: "white", fontSize: "1.3rem",
              boxShadow: "0 6px 20px rgba(13,148,136,0.3)",
            }}>
              <i className="fas fa-headset" />
            </div>
            <div style={{ fontWeight: 800, fontSize: "1rem", marginBottom: 6, color: "var(--primary)" }}>
              Hyzmat teklip etmek isleýärsiňizmi?
            </div>
            <p style={{ fontSize: "0.82rem", opacity: 0.65, lineHeight: 1.6, marginBottom: 16 }}>
              Transport ulgamyna öz hyzmatyňyzy goşmak üçin bize ýazyň
            </p>
            <Link href="/teklip">
              <button className="btn-primary" style={{ padding: "11px 26px", fontSize: "0.88rem" }}>
                <i className="fas fa-plus" /> Teklip ugrat
              </button>
            </Link>
          </div>
        </div>
      </section>

      <style>{`
        body.dark-mode .gatnaw-service-active:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.25);
        }
        .gatnaw-service-active:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(13,148,136,0.15);
        }
        body.dark-mode [style*="glass-light"] {
          background: var(--glass-dark) !important;
          border-color: var(--border-dark) !important;
        }
      `}</style>
    </div>
  );
}
