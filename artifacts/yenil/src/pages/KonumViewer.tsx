import { useEffect, useRef, useState, useCallback } from "react";
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

function formatAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 5) return "Häzir";
  if (s < 60) return `${s}s öň`;
  return `${Math.floor(s / 60)}m öň`;
}

export default function KonumViewer() {
  const { token } = useParams<{ token: string }>();
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [stage, setStage] = useState<Stage>("loading");
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [liveAgo, setLiveAgo] = useState("Häzir");

  const updateMarker = useCallback((lat: number, lon: number) => {
    setCoords({ lat, lon });
    setLastUpdated(Date.now());
    if (leafletMap.current) {
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lon]);
      } else {
        markerRef.current = L.marker([lat, lon])
          .addTo(leafletMap.current)
          .bindPopup("📍 Siziň ýeriňiz")
          .openPopup();
      }
      leafletMap.current.panTo([lat, lon], { animate: true, duration: 0.8 });
    }
  }, []);

  const initMap = useCallback((lat: number, lon: number) => {
    if (!mapRef.current || leafletMap.current) return;
    leafletMap.current = L.map(mapRef.current, {
      center: [lat, lon],
      zoom: 16,
      zoomControl: true,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
      maxZoom: 19,
    }).addTo(leafletMap.current);
    markerRef.current = L.marker([lat, lon])
      .addTo(leafletMap.current)
      .bindPopup("📍 Siziň ýeriňiz")
      .openPopup();
    setTimeout(() => leafletMap.current?.invalidateSize(), 100);
  }, []);

  const startPolling = useCallback((tkn: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    setIsLive(true);
    pollRef.current = setInterval(async () => {
      try {
        const r = await fetch(`/api/location/share/${tkn}`);
        const d: ShareInfo = await r.json();
        if (d.status === "expired") { setIsLive(false); clearInterval(pollRef.current!); return; }
        if (d.lat && d.lon) updateMarker(d.lat, d.lon);
      } catch { /* silent */ }
    }, 4000);
  }, [updateMarker]);

  useEffect(() => {
    if (!token) { setStage("not_found"); return; }
    fetch(`/api/location/share/${token}`)
      .then(r => r.json())
      .then((data: ShareInfo) => {
        if (!data?.token) { setStage("not_found"); return; }
        if (data.status === "expired" || new Date() > new Date(data.expiresAt)) {
          setStage("expired"); return;
        }
        if (data.status === "active" && data.lat && data.lon) {
          setCoords({ lat: data.lat, lon: data.lon });
          setLastUpdated(Date.now());
          setStage("active");
          startPolling(token);
        } else {
          setStage("requesting");
        }
      })
      .catch(() => setStage("error"));
  }, [token, startPolling]);

  useEffect(() => {
    if (stage === "active" && coords && mapRef.current) {
      setTimeout(() => {
        initMap(coords.lat, coords.lon);
        if (token) startPolling(token);
      }, 50);
    }
  }, [stage]);

  useEffect(() => {
    if (!lastUpdated) return;
    const t = setInterval(() => setLiveAgo(formatAgo(lastUpdated)), 3000);
    return () => clearInterval(t);
  }, [lastUpdated]);

  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current);
    leafletMap.current?.remove();
    leafletMap.current = null;
  }, []);

  function requestLocation() {
    if (!navigator.geolocation) { setStage("error"); return; }
    setStage("submitting");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setAccuracy(pos.coords.accuracy);
        try {
          const res = await fetch(`/api/location/share/${token}/submit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lat, lon }),
          });
          if (res.status === 410) { setStage("expired"); return; }
          if (!res.ok) { setStage("error"); return; }
          setCoords({ lat, lon });
          setLastUpdated(Date.now());
          setStage("active");
          if (token) startPolling(token);
        } catch { setStage("error"); }
      },
      () => setStage("denied"),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  const yandexUrl = coords ? `https://yandex.com/maps/?rtext=~${coords.lat},${coords.lon}&rtt=auto` : "#";
  const googleUrl = coords ? `https://www.google.com/maps?q=${coords.lat},${coords.lon}` : "#";

  return (
    <div style={{
      position: "fixed", inset: 0, display: "flex", flexDirection: "column",
      background: "#f0fdfa", fontFamily: "Poppins, sans-serif",
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 1000,
        background: "linear-gradient(135deg, #0f766e, #0d9488)",
        padding: "12px 16px",
        display: "flex", alignItems: "center", gap: 12,
        boxShadow: "0 2px 20px rgba(0,0,0,0.18)",
      }}>
        <a href="/" style={{
          color: "rgba(255,255,255,0.85)", textDecoration: "none",
          display: "flex", alignItems: "center", gap: 6,
          background: "rgba(255,255,255,0.15)", borderRadius: 20,
          padding: "6px 12px", fontSize: "0.82rem", fontWeight: 600,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Yzeňil
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <LocationPinIcon size={20} color="rgba(255,255,255,0.95)" />
          <span style={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}>Ýer paýlaşma</span>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          {isLive && (
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              background: "rgba(220,38,38,0.9)", padding: "4px 10px",
              borderRadius: 20, fontSize: "0.72rem", fontWeight: 700, color: "white",
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: "50%", background: "white",
                display: "inline-block", animation: "livePulse 1s ease infinite",
              }} />
              CANLÝ
            </div>
          )}
          <span style={{
            fontFamily: "monospace", fontSize: "0.75rem",
            color: "rgba(255,255,255,0.7)", background: "rgba(0,0,0,0.2)",
            padding: "4px 10px", borderRadius: 8,
          }}>
            {token}
          </span>
        </div>
      </div>

      <div
        ref={mapRef}
        style={{
          flex: 1, marginTop: 52,
          display: stage === "active" ? "block" : "none",
        }}
      />

      {stage !== "active" && (
        <div style={{
          flex: 1, marginTop: 52,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 24, flexDirection: "column", gap: 20, textAlign: "center",
        }}>
          {stage === "loading" && (
            <>
              <div style={{
                width: 52, height: 52, border: "4px solid rgba(13,148,136,0.15)",
                borderTopColor: "#0d9488", borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }} />
              <p style={{ color: "#64748b", fontSize: "0.95rem" }}>Ýüklenýär...</p>
            </>
          )}
          {stage === "requesting" && (
            <>
              <div style={{ position: "relative", marginBottom: 8 }}>
                <div style={{
                  width: 96, height: 96, borderRadius: "50%",
                  background: "linear-gradient(135deg, #0f766e, #14b8a6)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 0 0 0 rgba(13,148,136,0.3)",
                  animation: "ripple 2s ease-out infinite",
                }}>
                  <LocationPinIcon size={44} color="white" />
                </div>
              </div>
              <div>
                <h2 style={{ fontWeight: 800, fontSize: "1.3rem", color: "#1e293b", marginBottom: 8 }}>
                  Ýeriňizi paýlaşyň
                </h2>
                <p style={{ color: "#64748b", fontSize: "0.9rem", maxWidth: 300, lineHeight: 1.65 }}>
                  Aşakdaky düwmä basyň — brauzer GPS rugsady sorar. Rugsat beriň we ýeriňiz paýlaşylar.
                </p>
              </div>
              <button
                onClick={requestLocation}
                style={{
                  padding: "15px 40px", borderRadius: 50,
                  background: "linear-gradient(135deg, #0f766e, #14b8a6)",
                  color: "white", border: "none", cursor: "pointer",
                  fontWeight: 700, fontSize: "1rem",
                  boxShadow: "0 8px 24px rgba(13,148,136,0.35)",
                  fontFamily: "Poppins, sans-serif",
                }}
              >
                📍 Ýerimi paýlaş
              </button>
            </>
          )}
          {stage === "submitting" && (
            <>
              <div style={{
                width: 52, height: 52, border: "4px solid rgba(13,148,136,0.15)",
                borderTopColor: "#0d9488", borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }} />
              <p style={{ color: "#64748b" }}>GPS alynýar...</p>
            </>
          )}
          {stage === "denied" && (
            <>
              <div style={{
                width: 80, height: 80, borderRadius: "50%", background: "#fee2e2",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </div>
              <h2 style={{ fontWeight: 800, color: "#dc2626" }}>Rugsat berilmedi</h2>
              <p style={{ color: "#64748b", fontSize: "0.88rem", maxWidth: 300, lineHeight: 1.6 }}>
                Brauzer sazlamalaryndan ýer rugsadyny açyň, soňra täzeden synanyşyň.
              </p>
              <button onClick={requestLocation} style={{
                padding: "13px 32px", borderRadius: 50,
                background: "linear-gradient(135deg, #0f766e, #14b8a6)",
                color: "white", border: "none", cursor: "pointer",
                fontWeight: 700, fontFamily: "Poppins, sans-serif",
              }}>
                Täzeden synanyş
              </button>
            </>
          )}
          {(stage === "expired" || stage === "not_found" || stage === "error") && (
            <>
              <div style={{
                width: 80, height: 80, borderRadius: "50%",
                background: stage === "expired" ? "#f3f4f6" : "#fef3c7",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={stage === "expired" ? "#9ca3af" : "#d97706"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {stage === "expired"
                    ? <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>
                    : <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>
                  }
                </svg>
              </div>
              <h2 style={{ fontWeight: 800, color: "#1e293b" }}>
                {stage === "expired" ? "Möhleti geçdi" : stage === "not_found" ? "Link tapylmady" : "Ýalňyşlyk"}
              </h2>
              <p style={{ color: "#64748b", fontSize: "0.88rem", maxWidth: 300 }}>
                {stage === "expired" ? "Bu paýlaşma linki 24 sagat soň möhleti geçdi." : "Link ýok ýa-da geçerli däl."}
              </p>
              <a href="/" style={{
                padding: "13px 32px", borderRadius: 50,
                background: "linear-gradient(135deg, #0f766e, #14b8a6)",
                color: "white", textDecoration: "none",
                fontWeight: 700, fontFamily: "Poppins, sans-serif",
              }}>
                Baş sahypa
              </a>
            </>
          )}
        </div>
      )}

      {stage === "active" && coords && (
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          background: "white",
          borderRadius: "24px 24px 0 0",
          boxShadow: "0 -4px 32px rgba(0,0,0,0.12)",
          padding: "12px 20px 28px",
          zIndex: 1000,
        }}>
          <div style={{
            width: 36, height: 4, borderRadius: 99,
            background: "#e2e8f0", margin: "0 auto 14px",
          }} />

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              background: "linear-gradient(135deg, #0f766e, #14b8a6)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <LocationPinIcon size={20} color="white" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#1e293b", display: "flex", alignItems: "center", gap: 8 }}>
                Ýer alyndy
                {isLive && <span style={{
                  fontSize: "0.65rem", fontWeight: 700, color: "#dc2626",
                  background: "#fee2e2", padding: "2px 7px", borderRadius: 20,
                }}>CANLÝ</span>}
              </div>
              <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: 2 }}>
                {coords.lat.toFixed(6)}, {coords.lon.toFixed(6)}
                {accuracy && <span> · ±{Math.round(accuracy)}m</span>}
                {lastUpdated && <span> · {liveAgo}</span>}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <a
              href={yandexUrl} target="_blank" rel="noreferrer"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                padding: "14px 20px", borderRadius: 16,
                background: "linear-gradient(135deg, #fc3f1d 0%, #ff6b47 100%)",
                color: "white", textDecoration: "none",
                fontWeight: 700, fontSize: "0.95rem",
                boxShadow: "0 4px 16px rgba(252,63,29,0.28)",
                fontFamily: "Poppins, sans-serif",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 32 32" fill="white">
                <path d="M16 2C8.27 2 2 8.27 2 16s6.27 14 14 14 14-6.27 14-14S23.73 2 16 2zm2 20.4V18h-2l-3.3 4.4H10l4-5.9-3.8-5.5H13l2 3.3 2.3-3.3H20l-3.8 5.5 4 5.9h-2.2zm3-10.8V13c2 .4 3.3 2 3.3 4 0 2.7-2 4.2-4.7 4.7V20c1.4 0 2.7-1 2.7-2.7 0-1.5-1.2-2.8-1.3-3.3v-.4z"/>
              </svg>
              Yandex Kartada aç
            </a>

            <a
              href={googleUrl} target="_blank" rel="noreferrer"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                padding: "14px 20px", borderRadius: 16,
                background: "white", border: "1.5px solid #e2e8f0",
                color: "#1e293b", textDecoration: "none",
                fontWeight: 700, fontSize: "0.95rem",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                fontFamily: "Poppins, sans-serif",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
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
        @keyframes livePulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes ripple {
          0% { box-shadow: 0 0 0 0 rgba(13,148,136,0.4); }
          70% { box-shadow: 0 0 0 30px rgba(13,148,136,0); }
          100% { box-shadow: 0 0 0 0 rgba(13,148,136,0); }
        }
        .leaflet-container { z-index: 1; font-family: Poppins, sans-serif; }
      `}</style>
    </div>
  );
}
