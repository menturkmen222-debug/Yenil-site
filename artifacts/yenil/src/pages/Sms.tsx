import { Link } from "wouter";

export default function Sms() {
  return (
    <div style={{ flex: 1, padding: "40px 0" }}>
      <div className="container">
        <Link href="/demiryol" style={{ display: "inline-flex", alignItems: "center", color: "var(--primary)", marginBottom: 20, fontWeight: 600, gap: 8 }}>
          <i className="fas fa-arrow-left"></i> Yza
        </Link>

        <div style={{ fontSize: "2rem", color: "var(--primary)", textAlign: "center", margin: "20px 0 25px" }}>
          <i className="fas fa-sms"></i> Ýeňil demirýollary — SMS zaýawka
        </div>

        <div style={{ background: "var(--card-light)", borderRadius: 24, padding: 25, boxShadow: "var(--shadow)", marginBottom: 25 }}>
          <h1 style={{ color: "var(--primary)", marginBottom: 20 }}>
            <i className="fas fa-ticket-alt"></i> Ýeňil demirýollary — SMS zaýawka
          </h1>

          <div style={{ background: "linear-gradient(135deg, rgba(13,148,136,0.1), rgba(13,148,136,0.05))", padding: 20, borderRadius: 16, margin: "25px 0", borderLeft: "5px solid var(--primary)" }}>
            <p><i className="fas fa-comment-dots" style={{ color: "var(--primary)" }}></i> <strong>Biz size ýeňillik bolar ýaly SMS zaýawka hem goşdyk.</strong></p>
            <p>Siz online sargyt etip bilmedik ýagdaýyňyzda paýdalanyp bilersiňiz.</p>
            <p><strong><i className="fas fa-money-check" style={{ color: "var(--primary)" }}></i> Pul öňünden geçirilýär</strong> we şol geçirilen nomerdan zaýawka ibermeli.</p>
          </div>

          <h2 style={{ color: "var(--primary)", margin: "20px 0 15px" }}><i className="fas fa-tags"></i> Bahalary</h2>
          <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
            <li><strong><i className="fas fa-clock"></i> 4-15 gün galandaky baha:</strong> 60 TMT</li>
            <li><strong><i className="fas fa-clock"></i> 2-3 gün galandaky baha:</strong> 70 TMT</li>
            <li><strong><i className="fas fa-clock"></i> 1 gün galandaky baha:</strong> 80 TMT</li>
          </ul>

          <h2 style={{ color: "var(--primary)", margin: "20px 0 15px" }}><i className="fas fa-file-alt"></i> SMS Zaýawka formaty (mysaly)</h2>
          <pre style={{ background: "#AEBFA1", padding: 15, borderRadius: 10, fontFamily: "monospace", fontSize: "1.0rem", whiteSpace: "pre-wrap" }}>
{`Dädebaý Dädebaýew 01.01.2001 I-DZ 123456
Aşgabat-Daşoguz 05.05.2025`}
          </pre>
          <p style={{ marginTop: 15 }}>
            <strong><i className="fas fa-id-card" style={{ color: "var(--primary)" }}></i> Eger sizde dogluş hakyndaky şahadatnama ýada harby bilet bolsa</strong>, Pasport ID ornyna şony ýazmaly.
          </p>

          <h2 style={{ color: "var(--primary)", margin: "20px 0 15px" }}><i className="fas fa-mobile-alt"></i> Bizniň töleg nomerlerimiz:</h2>
          <div style={{ background: "#f0fdfa", padding: 15, borderRadius: 14, margin: "20px 0", border: "1px dashed var(--primary)", lineHeight: 2 }}>
            <p><i className="fas fa-phone" style={{ color: "var(--primary)" }}></i> +993 71 789091</p>
            <p><i className="fas fa-phone" style={{ color: "var(--primary)" }}></i> +993 64 629487</p>
          </div>
          <p><i className="fas fa-arrow-down" style={{ color: "var(--primary)" }}></i> Ýokarydaky nomerlerden birine jemi töleg miqdaryny otgazyň.</p>

          <div style={{ background: "#fef3c7", color: "#92400e", padding: 15, borderRadius: 14, margin: "20px 0", fontSize: "0.85rem", borderLeft: "4px solid #f59e0b" }}>
            <p><i className="fas fa-exclamation-circle"></i> <strong>Ýatlatma:</strong> Töleg edeniňizden soň 15 minut içinde SMS zaýawka iberilmeli.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
