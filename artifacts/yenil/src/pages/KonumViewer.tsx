import { useEffect, useRef, useState } from "react";
import { useParams } from "wouter";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import markerIconUrl from "leaflet/dist/images/marker-icon.png";
import markerIcon2xUrl from "leaflet/dist/images/marker-icon-2x.png";
import markerShadowUrl from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIconUrl,
  iconRetinaUrl: markerIcon2xUrl,
  shadowUrl: markerShadowUrl,
});

type Stage =
  | "loading"
  | "requesting"
  | "submitting"
  | "active"
  | "denied"
  | "error"
  | "expired"
  | "not_found";

interface ShareInfo {
  token: string;
  status: string;
  lat: number | null;
  lon: number | null;
  expiresAt: string;
}

function LocationPinIcon({ size = 32, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21C12 21 5 13.5 5 8.5a7 7 0 0 1 14 0C19 13.5 12 21 12 21z"/>
      <circle cx="12" cy="8.5" r="2.5"/>
    </svg>
  );
}

export default function KonumViewer() {
  const { token } = useParams<{ token: string }>();
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [stage, setStage] = useState<Stage>("loading");
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [shareInfo, setShareInfo] = useState<ShareInfo | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);

  useEffect(() => {
    if (!token) { setStage("not_found"); return; }
    fetch(`/api/location/share/${token}`)
      .then(r => r.json())
      .then((data: ShareInfo) => {
        if (!data || !data.token) { setStage("not_found"); return; }
        if (data.status === "expired" || new Date() > new Date(data.expiresAt)) {
          setStage("expired"); return;
        }
        setShareInfo(data);
        if (data.status === "active" && data.lat && data.lon) {
          setCoords({ lat: data.lat, lon: data.lon });
          setStage("active");
        } else {
          setStage("requesting");
          requestLocation();
        }
      })
      .catch(() => setStage("error"));
  }, [token]);

  function requestLocation() {
    if (!navigator.geolocation) { setStage("error"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setAccuracy(pos.coords.accuracy);
        setStage("submitting");
        submitLocation(lat, lon);
      },
      () => setStage("denied"),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  async function submitLocation(lat: number, lon: number) {
    try {
      const res = await fetch(`/api/location/share/${token}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lon }),
      });
      const data = await res.json();
      if (res.status === 410) { setStage("expired"); return; }
      if (!res.ok) { setStage("error"); return; }
      setCoords({ lat: data.lat, lon: data.lon });
      setStage("active");
    } catch {
      setStage("error");
    }
  }

  useEffect(() => {
    if (stage !== "active" || !coords || !mapRef.current) return;
    if (!leafletMap.current) {
      leafletMap.current = L.map(mapRef.current, {
        center: [coords.lat, coords.lon],
        zoom: 15,
        zoomControl: true,
        attributionControl: true,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(leafletMap.current);
    }
    if (markerRef.current) markerRef.current.remove();
    markerRef.current = L.marker([coords.lat, coords.lon])
      .addTo(leafletMap.current)
      .bindPopup("📍 Siziň ýeriňiz")
      .openPopup();
    leafletMap.current.setView([coords.lat, coords.lon], 15);
    setTimeout(() => leafletMap.current?.invalidateSize(), 100);
  }, [stage, coords]);

  useEffect(() => {
    return () => { leafletMap.current?.remove(); leafletMap.current = null; };
  }, []);

  const yandexUrl = coords
    ? `https://yandex.com/maps/?rtext=~${coords.lat},${coords.lon}&rtt=auto`
    : "#";
  const googleUrl = coords
    ? `https://www.google.com/maps?q=${coords.lat},${coords.lon}`
    : "#";

  return (
    <div style={{
      position: "fixed", inset: 0, display: "flex", flexDirection: "column",
      background: "var(--bg)", fontFamily: "Poppins, sans-serif",
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 1000,
        background: "linear-gradient(135deg, #0f766e, #0d9488)",
        padding: "12px 16px",
        display: "flex", alignItems: "center", gap: 12,
        boxShadow: "0 2px 16px rgba(0,0,0,0.15)",
      }}>
        <a href="/" style={{
          color: "rgba(255,255,255,0.85)", textDecoration: "none",
          display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem",
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <LocationPinIcon size={22} color="rgba(255,255,255,0.95)" />
          <span style={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}>
            Ýer paýlaşma
          </span>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <span style={{
            fontFamily: "monospace", fontSize: "0.78rem",
            color: "rgba(255,255,255,0.7)", background: "rgba(0,0,0,0.2)",
            padding: "2px 8px", borderRadius: 8,
          }}>
            {token}
          </span>
        </div>
      </div>

      <div
        ref={mapRef}
        style={{
          flex: 1,
          marginTop: 52,
          display: stage === "active" ? "block" : "none",
        }}
      />

      {stage !== "active" && (
        <div style={{
          flex: 1, marginTop: 52, display: "flex",
          alignItems: "center", justifyContent: "center",
          padding: 24, flexDirection: "column", gap: 16, textAlign: "center",
        }}>
          {stage === "loading" && (
            <>
              <div style={{
                width: 48, height: 48, border: "4px solid rgba(13,148,136,0.2)",
                borderTopColor: "#0d9488", borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }} />
              <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>Ýüklenýär...</p>
            </>
          )}
          {stage === "requesting" && (
            <>
              <div style={{
                width: 80, height: 80, borderRadius: "50%",
                background: "linear-gradient(135deg, #0f766e, #14b8a6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 0 0 16px rgba(13,148,136,0.12)",
                animation: "pulse 2s infinite",
              }}>
                <LocationPinIcon size={36} color="white" />
              </div>
              <h2 style={{ fontWeight: 800, fontSize: "1.2rem", color: "var(--text)", marginTop: 8 }}>
                Ýeriňizi paýlaşyň
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", maxWidth: 320, lineHeight: 1.6 }}>
                Brauzer ýer rugsat soragy berer. "Rugsat et" düwmesine basyň.
              </p>
              <button
                onClick={requestLocation}
                className="btn-primary"
                style={{ padding: "13px 32px", fontSize: "0.95rem" }}
              >
                Ýerimi paýlaş
              </button>
            </>
          )}
          {stage === "submitting" && (
            <>
              <div style={{
                width: 48, height: 48, border: "4px solid rgba(13,148,136,0.2)",
                borderTopColor: "#0d9488", borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }} />
              <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>Ýer ibеrilýär...</p>
            </>
          )}
          {stage === "denied" && (
            <>
              <div style={{
                width: 72, height: 72, borderRadius: "50%",
                background: "#fee2e2", display: "flex",
                alignItems: "center", justifyContent: "center",
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </div>
              <h2 style={{ fontWeight: 800, color: "#dc2626" }}>Rugsat berilmedi</h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", maxWidth: 300, lineHeight: 1.6 }}>
                Brauzer sazlamalaryndan ýer rugsadyny açyň, soňra täzeden synanyşyň.
              </p>
              <button onClick={requestLocation} className="btn-primary" style={{ padding: "12px 28px" }}>
                Täzeden synanyş
              </button>
            </>
          )}
          {stage === "expired" && (
            <>
              <div style={{
                width: 72, height: 72, borderRadius: "50%",
                background: "#f3f4f6", display: "flex",
                alignItems: "center", justifyContent: "center",
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <h2 style={{ fontWeight: 800, color: "var(--text)" }}>Möhleti geçdi</h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", maxWidth: 300 }}>
                Bu paýlaşma linki 24 sagat soň möhleti geçdi.
              </p>
              <a href="/" style={{ padding: "12px 28px" }} className="btn-primary">
                Baş sahypa
              </a>
            </>
          )}
          {stage === "not_found" && (
            <>
              <div style={{
                width: 72, height: 72, borderRadius: "50%",
                background: "#fef3c7", display: "flex",
                alignItems: "center", justifyContent: "center",
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <h2 style={{ fontWeight: 800, color: "var(--text)" }}>Link tapylmady</h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", maxWidth: 300 }}>
                Bu paýlaşma linki ýok ýa-da möhleti geçdi.
              </p>
              <a href="/" className="btn-primary" style={{ padding: "12px 28px" }}>
                Baş sahypa
              </a>
            </>
          )}
          {stage === "error" && (
            <>
              <div style={{
                width: 72, height: 72, borderRadius: "50%",
                background: "#fee2e2", display: "flex",
                alignItems: "center", justifyContent: "center",
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <h2 style={{ fontWeight: 800, color: "var(--text)" }}>Ýalňyşlyk ýüz berdi</h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", maxWidth: 300 }}>
                Birnäçe wagtdan täzeden synanyşyň.
              </p>
              <button onClick={() => window.location.reload()} className="btn-primary" style={{ padding: "12px 28px" }}>
                Täzeden ýükle
              </button>
            </>
          )}
        </div>
      )}

      {stage === "active" && coords && (
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          background: "var(--surface)",
          borderRadius: "20px 20px 0 0",
          boxShadow: "0 -4px 24px rgba(0,0,0,0.12)",
          padding: "16px 20px 32px",
          zIndex: 1000,
        }}>
          <div style={{
            width: 36, height: 4, borderRadius: 99,
            background: "var(--border)", margin: "0 auto 16px",
          }} />

          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            marginBottom: 16,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "linear-gradient(135deg, #0f766e, #14b8a6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <LocationPinIcon size={18} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text)" }}>
                Ýer alyndy
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                {coords.lat.toFixed(5)}, {coords.lon.toFixed(5)}
                {accuracy && <span> · ±{Math.round(accuracy)}m</span>}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <a
              href={yandexUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                padding: "13px 20px", borderRadius: 14,
                background: "linear-gradient(135deg, #fc3f1d 0%, #ff6b47 100%)",
                color: "white", textDecoration: "none",
                fontWeight: 700, fontSize: "0.9rem",
                boxShadow: "0 4px 12px rgba(252,63,29,0.3)",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M12 2C7 2 3 6.5 3 12c0 5.5 4 10 9 10s9-4.5 9-10c0-5.5-4-10-9-10zm1 14.9V13h-1.5l-2.5 3.9H7l3-4.5L7.5 8H9l1.5 2.5L12 8h2l-2.5 4.4 2.5 4.5h-1zm2-9.4V9c1.5.3 2.5 1.5 2.5 3 0 2-1.5 3.2-3.5 3.5V14c1 0 2-.7 2-2 0-1.2-.9-2.1-1-2.5z"/>
              </svg>
              Yandex Kartada aç
            </a>

            <a
              href={googleUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                padding: "13px 20px", borderRadius: 14,
                background: "white", border: "2px solid #e5e7eb",
                color: "#1f2937", textDecoration: "none",
                fontWeight: 700, fontSize: "0.9rem",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#EA4335"/>
                <circle cx="12" cy="9" r="2.5" fill="white"/>
              </svg>
              Google Kartada aç
            </a>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(13,148,136,0.3); }
          50% { box-shadow: 0 0 0 20px rgba(13,148,136,0); }
        }
        .leaflet-container { z-index: 1; }
      `}</style>
    </div>
  );
}
