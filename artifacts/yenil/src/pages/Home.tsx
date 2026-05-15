import { useState, useEffect } from "react";
import { Link } from "wouter";

const reviews = [
  { author: "Amangül", text: "Bilet almak aňsat eken maňa 2 sagadyň içinde bilet alyp berdiler we ulanmak hem aňsat" },
  { author: "Didar", text: "Demiryyolla hem tmcell goşaýmala her geze bilet aljak bolsaň ir bilen wagzalda dikilmeli ýöne Ýeňil sag bol men indi otran yerimden hem ala bilýän kösenmän" },
  { author: "Jeren", text: "Başda ynanmandym ýöne men ylaçym galmansoň ahyry Ýeňil den peýdalanmaga karar berdim sag bolsun ynamymy ödediler aňyrsy 4 sagadyň içinde sms ugratdylar bron kody ýazylan" },
  { author: "Aýgül", text: "Meniň daşary ýurtda okap ýören oglumuň kartyndaky puly çekip bolýamy" },
  { author: "Serik", text: "Shundan bilet alyp wagzalda gymmat satýalar" },
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

export default function Home() {
  const [shuffled] = useState(() => shuffle(reviews));
  const [showModal, setShowModal] = useState(false);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Hero */}
      <section style={{
        background: "var(--gradient)",
        color: "white",
        padding: "80px 20px",
        textAlign: "center",
      }}>
        <div className="container">
          <h1 style={{ fontSize: "clamp(1.5rem, 4vw, 2.5rem)", fontWeight: 700, marginBottom: 20 }}>
            Ýeňil — Türkmenistanda onlayn töleg we biletlar platformasy
          </h1>
          <p style={{ fontSize: "1.1rem", maxWidth: 700, margin: "0 auto", opacity: 0.95, lineHeight: 1.7 }}>
            Biz siz üçin Ýeňil platformasyny işläp çykdyk bu bilen siz biletler arzan we tiz sargyt edip bilýäňiz we biz öz komandamyz bilen siziň işizi ýokary tizlikde görüp çykyp siz bilen maglumat alyşýas we biz barada eden işiňiz barada komentariýa goýmany ýatdan çykarmaň — bu biziň ösmegimize taze ýeňilliklere eden kömegiňiz bolar.
          </p>
        </div>
      </section>

      {/* Services */}
      <section style={{ padding: "50px 20px" }}>
        <div className="container" style={{ display: "flex", gap: 30, flexWrap: "wrap", justifyContent: "center" }}>
          {/* Demiryol Card */}
          <div
            onClick={() => setShowModal(true)}
            style={{
              background: "var(--card-light)",
              borderRadius: 24,
              padding: 30,
              boxShadow: "var(--shadow)",
              cursor: "pointer",
              flex: "1 1 280px",
              maxWidth: 340,
              textAlign: "center",
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 15,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-8px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 16px 32px rgba(13,148,136,0.2)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow)"; }}
          >
            <img src="/images/logo-demiryol.png" alt="Ýeňil demirýollary" style={{ height: 100, width: "auto" }} />
            <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--primary)" }}>Ýeňil demirýollary</div>
            <div style={{ fontSize: "0.95rem", opacity: 0.8 }}>Biletlary tiz we ynamly satyn almak, TMCELL üsti bilen</div>
          </div>

          {/* Pay Card */}
          <Link href="/pay">
            <div
              style={{
                background: "var(--card-light)",
                borderRadius: 24,
                padding: 30,
                boxShadow: "var(--shadow)",
                cursor: "pointer",
                flex: "1 1 280px",
                maxWidth: 340,
                textAlign: "center",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 15,
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-8px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 16px 32px rgba(13,148,136,0.2)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow)"; }}
            >
              <img src="/images/logo-pay.png" alt="Ýeňil Pay" style={{ height: 100, width: "auto" }} />
              <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--primary)" }}>Ýeňil Pay</div>
              <div style={{ fontSize: "0.95rem", opacity: 0.8 }}>Pul göçürmek, töleg amala aşyrmak</div>
            </div>
          </Link>
        </div>
      </section>

      {/* Social */}
      <section style={{ padding: "20px", textAlign: "center" }}>
        <div className="container">
          <h3 style={{ marginBottom: 20, fontSize: "1.2rem", fontWeight: 600 }}>Biziň sahypalarymyz:</h3>
          <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
            {[
              { href: "http://tiktok.com/@yenil_", icon: "fab fa-tiktok" },
              { href: "https://www.instagram.com/yenil_tm?igsh=MXA5OWtmbnp0Mzg4aw==", icon: "fab fa-instagram" },
              { href: "http://t.me/yenil_tm", icon: "fab fa-telegram" },
              { href: "https://s.imoim.net/DNCXX6", icon: "fas fa-comment-dots" },
            ].map((s, i) => (
              <a key={i} href={s.href} target="_blank" rel="noopener noreferrer" style={{
                width: 50,
                height: 50,
                borderRadius: "50%",
                background: "var(--gradient)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.3rem",
                transition: "transform 0.3s ease",
              }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = "scale(1.1)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = "scale(1)"}
              >
                <i className={s.icon}></i>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section style={{ padding: "40px 20px" }}>
        <div className="container">
          <h3 style={{ marginBottom: 20, fontSize: "1.3rem", fontWeight: 700 }}>Müşderilerimiziň pikirleri</h3>
          <div style={{
            display: "flex",
            overflowX: "auto",
            gap: 20,
            paddingBottom: 20,
            scrollBehavior: "smooth",
          }}>
            {shuffled.map((r, i) => (
              <div key={i} style={{
                flex: "0 0 250px",
                minHeight: 150,
                background: "var(--card-light)",
                borderRadius: 10,
                padding: 15,
                boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}>
                <div style={{ fontWeight: 600, fontSize: "1.1em", marginBottom: 10, color: "var(--primary)" }}>{r.author}</div>
                <p style={{ fontSize: "0.9em", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 6, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modal */}
      {showModal && (
        <div style={{
          display: "flex",
          position: "fixed",
          top: 0, left: 0,
          width: "100%", height: "100%",
          background: "rgba(0,0,0,0.6)",
          zIndex: 9999,
          justifyContent: "center",
          alignItems: "center",
        }} onClick={() => setShowModal(false)}>
          <div style={{
            background: "#ffffff",
            color: "#000000",
            padding: 25,
            borderRadius: 12,
            maxWidth: "90%",
            width: 350,
            textAlign: "center",
            boxShadow: "0 6px 20px rgba(0,0,0,0.3)",
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 12px", fontSize: "1.3em" }}>Ulgam hozirki wagtda işlämeýär</h3>
            <p style={{ marginBottom: 18, fontSize: "0.95em", lineHeight: 1.5 }}>Bu bölümde düzeltme işleri dowam edýär. Ýatda saklaň: bu hyzmat ýene hem işläp başlaýar!</p>
            <button
              onClick={() => setShowModal(false)}
              style={{
                background: "#0d9488",
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: 6,
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Düşündim
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
