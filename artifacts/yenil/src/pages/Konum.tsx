import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { getDeviceId } from "@/lib/deviceId";

const DAILY_LIMIT = 3;

interface ShareLink {
  id: string;
  token: string;
  status: "pending" | "active" | "expired";
  createdAt: string;
  expiresAt: string;
  lat: number | null;
  lon: number | null;
}

interface MySharesResponse {
  shares: ShareLink[];
  limit: number;
  count: number;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: "Garaşylýar", color: "#b45309", bg: "#fef3c7" },
    active:  { label: "Işjeň",      color: "#065f46", bg: "#d1fae5" },
    expired: { label: "Möhleti geçdi", color: "#6b7280", bg: "#f3f4f6" },
  };
  const s = map[status] ?? map.pending;
  return (
    <span style={{
      fontSize: "0.7rem", fontWeight: 700, padding: "2px 10px",
      borderRadius: 20, color: s.color, background: s.bg, letterSpacing: "0.03em",
    }}>{s.label}</span>
  );
}

function LocationPinIcon({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21C12 21 5 13.5 5 8.5a7 7 0 0 1 14 0C19 13.5 12 21 12 21z"/>
      <circle cx="12" cy="8.5" r="2.5"/>
    </svg>
  );
}

function CopyIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  );
}

function CheckIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function getShareUrl(token: string): string {
  const base = window.location.origin + window.location.pathname.replace(/\/konum.*$/, "");
  return `${base}/konum/${token}`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("tk-TM", { hour: "2-digit", minute: "2-digit" });
}

export default function Konum() {
  const [shares, setShares] = useState<ShareLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const deviceId = getDeviceId();

  const fetchShares = useCallback(async () => {
    try {
      const res = await fetch(`/api/location/my-shares?deviceId=${encodeURIComponent(deviceId)}`);
      const data: MySharesResponse = await res.json();
      setShares(data.shares || []);
    } catch {
      setShares([]);
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => { fetchShares(); }, [fetchShares]);

  async function createLink() {
    if (shares.length >= DAILY_LIMIT) { setShowPaywall(true); return; }
    setCreating(true);
    try {
      const res = await fetch("/api/location/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId }),
      });
      const data = await res.json();
      if (res.status === 429 || data.error === "daily_limit_reached") {
        setShowPaywall(true);
        return;
      }
      await fetchShares();
    } finally {
      setCreating(false);
    }
  }

  async function copyLink(token: string) {
    const url = getShareUrl(token);
    await navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  }

  const usedCount = shares.length;
  const limitReached = usedCount >= DAILY_LIMIT;

  return (
    <div style={{ flex: 1, paddingBottom: 60 }}>
      <div style={{
        background: "linear-gradient(135deg, #0f766e 0%, #0d9488 60%, #14b8a6 100%)",
        color: "white", padding: "48px 20px 36px", textAlign: "center",
      }}>
        <div className="container">
          <div style={{ marginBottom: 14, opacity: 0.92 }}>
            <LocationPinIcon size={48} />
          </div>
          <h1 style={{ fontSize: "clamp(1.4rem,4vw,2rem)", fontWeight: 800, marginBottom: 10 }}>
            Ýer paýlaşma
          </h1>
          <p style={{ opacity: 0.88, maxWidth: 520, margin: "0 auto", lineHeight: 1.65, fontSize: "0.97rem" }}>
            Haýsy ýerdedigиňizi paýlaşmak üçin link dörediň. Alyjy linki açanda ýeri siziň bilen paýlaşar.
          </p>
        </div>
      </div>

      <div className="container" style={{ padding: "28px 16px 0" }}>
        <div className="glass-card" style={{
          padding: "20px 22px", marginBottom: 20,
          border: "1.5px solid var(--border)",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text)" }}>
              Şu günki ulanyş
            </span>
            <span style={{
              fontWeight: 800, fontSize: "1rem",
              color: limitReached ? "#dc2626" : "var(--primary)",
            }}>
              {usedCount} / {DAILY_LIMIT}
            </span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {Array.from({ length: DAILY_LIMIT }).map((_, i) => (
              <div key={i} style={{
                flex: 1, height: 8, borderRadius: 99,
                background: i < usedCount
                  ? (limitReached ? "#dc2626" : "var(--primary)")
                  : "var(--border)",
                transition: "background 0.3s",
              }} />
            ))}
          </div>
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 8 }}>
            {limitReached
              ? "Günlik mugt çäge ýetdiňiz. Premium almak üçin aşakdaky düwmä basyň."
              : `${DAILY_LIMIT - usedCount} sany link döretmek hukugyňyz bar.`}
          </p>
        </div>

        <button
          className="btn-primary"
          style={{
            width: "100%", fontSize: "1rem", padding: "15px 24px",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            opacity: creating ? 0.7 : 1,
            background: limitReached
              ? "linear-gradient(135deg, #7c3aed, #a855f7)"
              : "var(--gradient)",
          }}
          onClick={limitReached ? () => setShowPaywall(true) : createLink}
          disabled={creating}
        >
          {creating ? (
            <>
              <div style={{
                width: 18, height: 18, border: "2px solid rgba(255,255,255,0.4)",
                borderTopColor: "white", borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }} />
              Döredilýär...
            </>
          ) : limitReached ? (
            <>⬆ Premium al — Çäksiz link</>
          ) : (
            <>
              <LocationPinIcon size={20} />
              Täze paýlaşma linki döret
            </>
          )}
        </button>

        {loading ? (
          <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)" }}>
            <div style={{
              width: 32, height: 32, border: "3px solid var(--border)",
              borderTopColor: "var(--primary)", borderRadius: "50%",
              animation: "spin 0.8s linear infinite", margin: "0 auto 12px",
            }} />
            Ýüklenýär...
          </div>
        ) : shares.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "40px 20px",
            color: "var(--text-muted)", fontSize: "0.9rem",
          }}>
            <LocationPinIcon size={36} />
            <p style={{ marginTop: 12 }}>Şu gün hiç link döretmediňiz.</p>
          </div>
        ) : (
          <div style={{ marginTop: 20 }}>
            <p style={{ fontWeight: 700, fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: 10, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Şu günki linkler
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {shares.map((share) => (
                <div key={share.token} className="glass-card" style={{
                  padding: "14px 16px",
                  border: "1.5px solid var(--border)",
                  display: "flex", flexDirection: "column", gap: 8,
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{
                        fontFamily: "monospace", fontWeight: 700,
                        fontSize: "0.9rem", color: "var(--primary)",
                        background: "rgba(13,148,136,0.08)", padding: "2px 8px", borderRadius: 6,
                      }}>
                        {share.token}
                      </span>
                      <StatusBadge status={share.status} />
                    </div>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {formatTime(share.createdAt)}
                    </span>
                  </div>

                  {share.status === "active" && share.lat && share.lon && (
                    <div style={{
                      fontSize: "0.78rem", color: "var(--text-muted)",
                      background: "rgba(13,148,136,0.06)", borderRadius: 6,
                      padding: "4px 8px",
                    }}>
                      📍 {share.lat.toFixed(5)}, {share.lon.toFixed(5)}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => copyLink(share.token)}
                      style={{
                        flex: 1, padding: "8px 12px", borderRadius: 10, border: "1.5px solid var(--border)",
                        background: copiedToken === share.token ? "#d1fae5" : "transparent",
                        color: copiedToken === share.token ? "#065f46" : "var(--text)",
                        cursor: "pointer", fontSize: "0.82rem", fontWeight: 600,
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        transition: "all 0.2s",
                      }}
                    >
                      {copiedToken === share.token ? <CheckIcon /> : <CopyIcon />}
                      {copiedToken === share.token ? "Kopyalandy!" : "Linki kopiýala"}
                    </button>
                    <a
                      href={getShareUrl(share.token)}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        padding: "8px 14px", borderRadius: 10,
                        background: "var(--gradient)", color: "white",
                        textDecoration: "none", fontSize: "0.82rem", fontWeight: 600,
                        display: "flex", alignItems: "center", gap: 5,
                        whiteSpace: "nowrap",
                      }}
                    >
                      <LocationPinIcon size={14} />
                      Aç
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showPaywall && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
            zIndex: 9000, display: "flex", alignItems: "flex-end",
            justifyContent: "center", padding: "0 0 0",
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setShowPaywall(false)}
        >
          <div
            style={{
              background: "var(--surface)", borderRadius: "24px 24px 0 0",
              padding: "28px 24px 40px", width: "100%", maxWidth: 520,
              animation: "slideInLeft 0.3s ease",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              width: 40, height: 4, borderRadius: 99,
              background: "var(--border)", margin: "0 auto 20px",
            }} />
            <h2 style={{
              textAlign: "center", fontWeight: 800, fontSize: "1.25rem",
              marginBottom: 8, color: "var(--text)",
            }}>
              Tarif saýla
            </h2>
            <p style={{
              textAlign: "center", color: "var(--text-muted)",
              fontSize: "0.88rem", marginBottom: 24,
            }}>
              Günlik mugt çäge ýetdiňiz. Dowam etmek üçin tarif saýlaň.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{
                padding: "16px 18px", borderRadius: 14,
                border: "2px solid var(--border)", background: "var(--bg)",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                opacity: 0.7,
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "1rem" }}>Free</div>
                  <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: 2 }}>
                    Günde 3 link
                  </div>
                </div>
                <div style={{
                  fontSize: "0.75rem", fontWeight: 700, color: "#dc2626",
                  background: "#fee2e2", padding: "4px 10px", borderRadius: 20,
                }}>
                  ✓ Häzirki — Çäge ýetdi
                </div>
              </div>

              <div style={{
                padding: "16px 18px", borderRadius: 14,
                border: "2px solid var(--primary)",
                background: "linear-gradient(135deg, rgba(13,148,136,0.06), rgba(20,184,166,0.08))",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--primary)" }}>Plus</div>
                  <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: 2 }}>
                    Çäksiz standart paýlaşma
                  </div>
                </div>
                <button style={{
                  padding: "8px 16px", borderRadius: 20,
                  background: "var(--gradient)", color: "white",
                  border: "none", cursor: "pointer",
                  fontWeight: 700, fontSize: "0.82rem",
                }}>
                  Premium
                </button>
              </div>

              <div style={{
                padding: "16px 18px", borderRadius: 14,
                border: "1.5px dashed var(--border)",
                background: "linear-gradient(135deg, rgba(124,58,237,0.04), rgba(168,85,247,0.06))",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <div>
                  <div style={{
                    fontWeight: 800, fontSize: "1rem",
                    background: "linear-gradient(90deg, #7c3aed, #a855f7)",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  }}>VIP</div>
                  <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: 2 }}>
                    Çäksiz + Canlı ýer yzarlama
                  </div>
                </div>
                <div style={{
                  fontSize: "0.75rem", fontWeight: 700, color: "#7c3aed",
                  background: "rgba(124,58,237,0.1)", padding: "4px 10px", borderRadius: 20,
                }}>
                  🔒 Ýakyn wagtda
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowPaywall(false)}
              style={{
                marginTop: 20, width: "100%", padding: "13px",
                borderRadius: 14, border: "1.5px solid var(--border)",
                background: "transparent", color: "var(--text-muted)",
                cursor: "pointer", fontSize: "0.9rem", fontWeight: 600,
              }}
            >
              Ýap
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
