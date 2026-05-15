import { Link } from "wouter";

export default function About() {
  return (
    <div style={{ flex: 1, padding: "40px 0" }}>
      <div className="container">
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", color: "var(--primary)", margin: "0 0 20px", fontWeight: 600, gap: 8 }}>
          <i className="fas fa-arrow-left"></i> Yza
        </Link>

        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, fontSize: "2.5rem", color: "var(--primary)", margin: "20px 0 25px" }}>
          <i className="fas fa-users"></i> Biz barada
        </div>

        <div style={{ background: "var(--card-light)", borderRadius: 24, padding: 25, boxShadow: "var(--shadow)", marginBottom: 25 }}>
          <h1 style={{ color: "var(--primary)", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
            <i className="fas fa-rocket"></i> Ýeňil bilen— Hemme zat ýeňil
          </h1>
          <p style={{ marginBottom: 15 }}>
            <i className="fas fa-lightbulb" style={{ color: "var(--primary)" }}></i>{" "}
            Ýeňil — 2025-yilda döwletiň ykdysady we tehnologik ösmegi üçin işe başlan innovatsion platformadyr. Biz Türkmenistanda Daşary onlayn tölegler, poyuz biletlary satyn almak we sizi üstünliklere ýetirmek üçin ýaradylan.
          </p>

          <div style={{ background: "#f0fdfa", padding: 30, borderRadius: 20, margin: "30px 0", border: "2px solid #a7f3d0" }}>
            <h2 style={{ color: "var(--primary)", marginBottom: 15, display: "flex", alignItems: "center", gap: 10 }}>
              <i className="fas fa-bullseye"></i> Ýeňil inýektiwimiz
            </h2>
            <p>
              <strong>"Hemme zat ýeňil"</strong> — bu biziň esasy şyýarymyz. Biz her bir eden işimiziň dakazady bilen jogap berip bilýäs we biz bilen eden işleriňiz barada komentariýa goýmany ýatdan çykarmaň — bu biziň ösmegimize täze ýeňilliklere eden kömegiňiz bolar.
            </p>
          </div>

          <h2 style={{ color: "var(--primary)", margin: "25px 0 18px", display: "flex", alignItems: "center", gap: 10 }}>
            <i className="fas fa-user-friends"></i> Biz kim?
          </h2>
          <p>
            <i className="fas fa-globe-asia" style={{ color: "var(--primary)" }}></i>{" "}
            Ýeňil — Türkmenistanda ykdysatlaşan, ynamly we tiz işleýän web-platformadyr. Biz 2025-ýilda türkmen gurluşlarynyň, kiçi biznesleriň we şahslaryň onlaýn töleglerde, biletlary satyn almakda we pul göçürmelerde ýeňilleşmesine kömek etmek üçin ýaradylan.
          </p>

          <h2 style={{ color: "var(--primary)", margin: "25px 0 18px", display: "flex", alignItems: "center", gap: 10 }}>
            <i className="fas fa-history"></i> Taryhymyz
          </h2>
          <p>
            <i className="fas fa-calendar-alt" style={{ color: "var(--primary)" }}></i>{" "}
            2025-ýilda "Ýeňil" adyndaky prog 3 adamlyk komanda işini başlaýar. Birinji oranda — biletlary satyn almak we pul göçürmek. 2025-ýil oktýabr aýyna 500-den artyk ulanyjymyz bar.
          </p>

          <h2 style={{ color: "var(--primary)", margin: "25px 0 18px", display: "flex", alignItems: "center", gap: 10 }}>
            <i className="fas fa-users-cog"></i> Biziň komandamyz
          </h2>

          {[
            { icon: "fa-crown", name: "Eziz Ýowyýew", role: "CEO & Founder", desc: "Turkmenistanda ykdysadiýet we tehnologiýa ugry boýunça 4 ýyl dereje" },
            { icon: "fa-code", name: "Ýowyýew Allaşükür", role: "CTO", desc: "Web developer, 3 ýyl dereje, React & Firebase muhandis" },
            { icon: "fa-shipping-fast", name: "Atageldi Narow", role: "Head of Operations", desc: "Logistika we töleg sistemalari boýunça muhandis" },
          ].map(m => (
            <div key={m.name} style={{ display: "flex", alignItems: "center", gap: 20, padding: 20, background: "var(--card-light)", borderRadius: 16, margin: "20px 0", boxShadow: "var(--shadow)", border: "1px solid rgba(13,148,136,0.1)" }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(13,148,136,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", color: "var(--primary)", flexShrink: 0 }}>
                <i className={`fas ${m.icon}`}></i>
              </div>
              <div>
                <h4 style={{ color: "var(--primary)", fontWeight: 700, marginBottom: 5, display: "flex", alignItems: "center", gap: 8 }}>
                  <i className="fas fa-user-tie"></i> {m.name}
                </h4>
                <p style={{ fontSize: "0.95rem", display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <i className="fas fa-star" style={{ color: "var(--primary)" }}></i> {m.role}
                </p>
                <p style={{ fontSize: "0.85rem", opacity: 0.8, display: "flex", alignItems: "center", gap: 8 }}>
                  <i className="fas fa-graduation-cap" style={{ color: "var(--primary)" }}></i> {m.desc}
                </p>
              </div>
            </div>
          ))}

          <h2 style={{ color: "var(--primary)", margin: "25px 0 18px", display: "flex", alignItems: "center", gap: 10 }}>
            <i className="fas fa-heart"></i> Biziň gymmatlyklarymyz
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 25, margin: "20px 0" }}>
            {[
              { icon: "fa-lock", title: "Ynam", desc: "Biziň platformamyzyň her bir tölegi, sargydy we maglumaty howpsyz saklanýar. Biz 24/7 işleýäris." },
              { icon: "fa-bolt", title: "Tizlik", desc: "Biziň sistemamyz 1 minutdan az wagtda içinde tölegi amala aşyrýar. Size 1 sagat içinde bilet tapyp berilýär." },
              { icon: "fa-tag", title: "Arzan", desc: "Biz arzan bahadan hyzmatlarymyzyň hemme zadyny teklip ederis. Sizde kart ýokmy? Hiç gynanmaň, biz kart tölegsiz işleýäris." },
            ].map(v => (
              <div key={v.title} style={{ background: "var(--card-light)", padding: 25, borderRadius: 16, boxShadow: "var(--shadow)", textAlign: "center", border: "1px solid rgba(13,148,136,0.1)" }}>
                <div style={{ fontSize: "2.5rem", color: "var(--primary)", marginBottom: 15 }}><i className={`fas ${v.icon}`}></i></div>
                <h3 style={{ color: "var(--primary)", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <i className="fas fa-shield-alt"></i> {v.title}
                </h3>
                <p style={{ fontSize: "0.95rem", lineHeight: 1.6 }}>{v.desc}</p>
              </div>
            ))}
          </div>

          <div style={{ background: "linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%)", padding: 30, borderRadius: 20, margin: "40px 0", textAlign: "center" }}>
            <h3 style={{ color: "var(--primary)", marginBottom: 20, display: "flex", justifyContent: "center", alignItems: "center", gap: 10 }}>
              <i className="fas fa-envelope-open-text"></i> Biz bilen habarlaşmak
            </h3>
            <p style={{ marginBottom: 10 }}><i className="fas fa-comment-dots" style={{ color: "var(--primary)" }}></i> Eger mesele dörän bolsa, biz bilen e-poçta ýada telefon arkaly habarlaşyp bilersiňiz.</p>
            <p style={{ marginBottom: 8 }}><i className="fab fa-imo" style={{ color: "var(--primary)" }}></i> IMO: <a href="https://s.imoim.net/DNCXX6" style={{ color: "var(--primary)" }}>71789091</a></p>
            <p style={{ marginBottom: 8 }}><i className="fas fa-envelope" style={{ color: "var(--primary)" }}></i> Email: <a href="mailto:menturkmen111@gmail.com" style={{ color: "var(--primary)" }}>menturkmen111@gmail.com</a></p>
            <p><i className="fas fa-phone-alt" style={{ color: "var(--primary)" }}></i> Telefon: <a href="tel:+99371789091" style={{ color: "var(--primary)" }}>+993 71 789091</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}
