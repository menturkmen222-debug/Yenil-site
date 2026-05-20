import { useState, useEffect, useCallback, useRef } from "react";
import { useBonusPul } from "@/contexts/BonusPulContext";
import { useToast } from "@/components/Toast";
import {
  ShieldIcon, UsersIcon, SendIcon, SearchIcon, SettingsGearIcon,
  CopyIcon, FlagIcon, PlusCircleIcon, XIcon, ArrowUpIcon, ArrowDownIcon,
  WalletIcon, UserIcon, CheckIcon, EditIcon,
} from "@/components/Icons";
import {
  getReputation, watchReputation, getReputation as fetchReputation,
  saveDispute, getFriends, watchFriends, addFriend, removeFriend,
  getBPTransferHistory, setUserNickname, getUserNickname,
  type ReputationData, type FriendEntry, type BPTransfer,
} from "@/lib/firebase";
import {
  getLevel, getNextLevel, getProgressToNextLevel,
  getImprovementTips, getWhyDescription, formatRelativeTime,
  LEVELS,
} from "@/lib/reputation";

// ─── helpers ─────────────────────────────────────────────────────────────────

function useCopyFlash() {
  const [msg, setMsg] = useState("");
  const copy = useCallback((text: string, label = "Kopyalandy!") => {
    navigator.clipboard.writeText(text).catch(() => {});
    setMsg(label);
    setTimeout(() => setMsg(""), 2000);
  }, []);
  return { msg, copy };
}

function ScoreMeter({ score }: { score: number }) {
  const level = getLevel(score);
  const next = getNextLevel(score);
  const pct = getProgressToNextLevel(score);
  return (
    <div>
      <div className="rep-score-row">
        <div>
          <div className="rep-score-num">{score}</div>
          <div className="rep-score-label">/ 100 bal</div>
        </div>
        <div
          className="rep-level-badge"
          style={{ color: level.color, background: level.bg, borderColor: level.border }}
        >
          <span style={{ fontSize: "1.1rem" }}>{level.emoji}</span>
          <span>{level.labelTm}</span>
        </div>
      </div>
      <div className="rep-progress-wrap">
        <div className="rep-progress-bar" style={{ width: `${score}%` }} />
      </div>
      {next && (
        <div style={{ fontSize: "0.72rem", opacity: 0.52, textAlign: "right", marginTop: -8, marginBottom: 10 }}>
          {next.label} derejesine {next.minScore - score} bal galdy
        </div>
      )}
    </div>
  );
}

function LevelsStrip({ currentScore }: { currentScore: number }) {
  const currentLevel = getLevel(currentScore);
  return (
    <div className="rep-levels-strip">
      {LEVELS.map(l => (
        <div
          key={l.id}
          className={`rep-level-dot${l.id === currentLevel.id ? " current" : ""}${currentScore >= l.minScore ? " reached" : ""}`}
        >
          <span style={{ fontSize: "1rem" }}>{l.emoji}</span>
          <span>{l.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Modal: Reputation Details ───────────────────────────────────────────────

function RepDetailModal({
  onClose,
  repData,
  deviceId,
}: {
  onClose: () => void;
  repData: ReputationData;
  deviceId: string;
}) {
  const [tab, setTab] = useState<"info" | "dispute">("info");
  const [dispDesc, setDispDesc] = useState("");
  const [dispEv, setDispEv] = useState("");
  const [dispSending, setDispSending] = useState(false);
  const [dispDone, setDispDone] = useState(false);
  const { toast } = useToast();

  const level = getLevel(repData.score);
  const tips = getImprovementTips(repData.score);
  const why = getWhyDescription(repData.score);

  async function handleDispute() {
    if (!dispDesc.trim()) { toast("Beýany ýazyň", "error"); return; }
    setDispSending(true);
    try {
      await saveDispute({
        reporterDeviceId: deviceId,
        targetDeviceId: deviceId,
        description: dispDesc.trim(),
        evidence: dispEv.trim(),
        status: "pending",
      });
      setDispDone(true);
      toast("Ýüz tutmanyz iberildi!", "success");
    } catch {
      toast("Ýalňyşlyk ýüz berdi", "error");
    } finally {
      setDispSending(false);
    }
  }

  return (
    <div className="rep-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="rep-modal" style={{ position: "relative" }}>
        <button className="rep-modal-close" onClick={onClose} style={{ position: "static", marginLeft: "auto", marginBottom: 12, display: "flex" }}>
          <XIcon size={15} strokeWidth={2.2} />
        </button>

        <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--primary)", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <ShieldIcon size={20} strokeWidth={2} />
          Abraý / Ynam ulgamy
        </h2>

        {/* Level badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div
            className="rep-level-badge"
            style={{ color: level.color, background: level.bg, borderColor: level.border, padding: "8px 16px" }}
          >
            <span style={{ fontSize: "1.2rem" }}>{level.emoji}</span>
            <span style={{ fontSize: "1rem" }}>{level.labelTm}</span>
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "var(--primary)" }}>{repData.score}<span style={{ fontSize: "0.8rem", opacity: 0.5, fontWeight: 600 }}>/100</span></div>
        </div>

        <LevelsStrip currentScore={repData.score} />

        {/* Tabs */}
        <div className="profil-tabs" style={{ marginTop: 14 }}>
          <button className={`profil-tab-btn${tab === "info" ? " active" : ""}`} onClick={() => setTab("info")}>
            Maglumat
          </button>
          <button className={`profil-tab-btn${tab === "dispute" ? " active" : ""}`} onClick={() => setTab("dispute")}>
            <FlagIcon size={12} strokeWidth={2} style={{ display: "inline", marginRight: 4 }} />
            Ýüz tut
          </button>
        </div>

        {tab === "info" && (
          <div className="animate-in">
            <div className="alert-info" style={{ marginTop: 0, marginBottom: 14 }}>
              <p style={{ fontSize: "0.85rem", lineHeight: 1.65 }}>{why}</p>
            </div>

            <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--primary)", marginBottom: 8 }}>
              Abraýy nädip ýokarlatmaly?
            </p>
            <div className="rep-tips-list">
              {tips.map((t, i) => (
                <div key={i} className="rep-tip-item">
                  <span style={{ fontSize: "1rem" }}>{t.icon}</span>
                  <span style={{ fontSize: "0.82rem", lineHeight: 1.5 }}>{t.text}</span>
                </div>
              ))}
            </div>

            <div className="alert-warning" style={{ marginTop: 16, fontSize: "0.8rem" }}>
              <strong>Ýatlatma:</strong> Abraýyňyz siziň platformadaky hereketleriňize görä awtomatik hasaplanýar. Dogrylyk we jogapkärçilik esasynda ýokary bal gazanyp bilersiňiz.
            </div>
          </div>
        )}

        {tab === "dispute" && (
          <div className="animate-in">
            {dispDone ? (
              <div className="alert-success" style={{ marginTop: 0 }}>
                <div className="success-icon-wrap"><CheckIcon size={28} strokeWidth={2.5} /></div>
                <h3 style={{ color: "var(--primary)", marginBottom: 8 }}>Iberildi!</h3>
                <p style={{ fontSize: "0.88rem" }}>Siziň ýüz tutmanyňyz alyndy. Toparymyz iň gysga wagtda seredip jogap berer.</p>
                <button className="btn-secondary" style={{ marginTop: 16, padding: "10px 20px", fontSize: "0.88rem" }} onClick={() => setDispDone(false)}>
                  Täzeden ýaz
                </button>
              </div>
            ) : (
              <div className="dispute-form">
                <p style={{ fontSize: "0.82rem", opacity: 0.7, lineHeight: 1.6, marginBottom: 4 }}>
                  Siziň abraý balynyz ýalňyş hasaplandy öýdýäňizmi? Delilleriňiz bilen bize ýüz tutuň, toparymyz seredip jogap berer.
                </p>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label><FlagIcon size={14} /> Ýagdaýy düşündiriň</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={dispDesc}
                    onChange={e => setDispDesc(e.target.value)}
                    placeholder="Ýagdaýy jikme-jik beýan ediň..."
                    style={{ resize: "vertical", minHeight: 80 }}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Delilleriniz (islege görä)</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    value={dispEv}
                    onChange={e => setDispEv(e.target.value)}
                    placeholder="Sargyt ID-leri, sene we wagt, ş.m..."
                    style={{ resize: "vertical", minHeight: 60 }}
                  />
                </div>
                <button
                  className="btn-primary btn-block"
                  onClick={handleDispute}
                  disabled={dispSending || !dispDesc.trim()}
                >
                  {dispSending ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Iberilýär...</> : <><SendIcon size={14} /> Iberip iberiň</>}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Section 1: Reputation ────────────────────────────────────────────────────

function ReputationSection({ deviceId }: { deviceId: string }) {
  const [repData, setRepData] = useState<ReputationData>({ score: 20, entries: [] });
  const [showModal, setShowModal] = useState(false);
  const [searchId, setSearchId] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<{ rep: ReputationData; nickname: string } | null>(null);
  const [searchError, setSearchError] = useState("");

  useEffect(() => {
    const unsub = watchReputation(deviceId, setRepData);
    return () => unsub();
  }, [deviceId]);

  const level = getLevel(repData.score);

  async function handleSearch() {
    const id = searchId.trim();
    if (!id) return;
    setSearching(true);
    setSearchResult(null);
    setSearchError("");
    try {
      const [rep, nickname] = await Promise.all([
        fetchReputation(id),
        getUserNickname(id).catch(() => ""),
      ]);
      setSearchResult({ rep, nickname });
    } catch {
      setSearchError("Gözleg wagtynda ýalňyşlyk ýüz berdi");
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="profil-section animate-in">
      <div className="profil-section-header">
        <div className="profil-section-title">
          <ShieldIcon size={18} strokeWidth={2} />
          Abraý / Ynam ulgamy
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            background: "rgba(13,148,136,0.09)", border: "1.5px solid rgba(13,148,136,0.2)",
            borderRadius: 8, padding: "5px 10px", cursor: "pointer",
            color: "var(--primary)", fontSize: "0.75rem", fontWeight: 700,
            fontFamily: "Poppins, sans-serif", transition: "var(--transition)",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(13,148,136,0.16)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(13,148,136,0.09)")}
        >
          <SettingsGearIcon size={13} strokeWidth={2} />
          Jikme-jik
        </button>
      </div>

      <ScoreMeter score={repData.score} />

      {/* Brief description */}
      <p style={{ fontSize: "0.82rem", opacity: 0.68, lineHeight: 1.6, marginBottom: 14 }}>
        {getWhyDescription(repData.score)}
      </p>

      {/* Transparent history */}
      {repData.entries.length > 0 && (
        <div>
          <p style={{ fontSize: "0.75rem", fontWeight: 700, opacity: 0.55, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
            Açyk taryh
          </p>
          <div className="rep-history-list">
            {repData.entries.slice(0, 5).map((e, i) => (
              <div key={i} className="rep-history-item">
                <div className={`rep-history-delta ${e.type}`}>
                  {e.delta > 0 ? `+${e.delta}` : e.delta}
                </div>
                <span style={{ flex: 1, fontSize: "0.82rem" }}>{e.reason}</span>
                <span className="rep-history-time">{formatRelativeTime(e.timestamp)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {repData.entries.length === 0 && (
        <div style={{ textAlign: "center", padding: "12px 0", opacity: 0.4, fontSize: "0.8rem" }}>
          Heniz taryh ýok
        </div>
      )}

      {/* Search other users */}
      <div style={{ marginTop: 20 }}>
        <div className="gradient-divider" style={{ margin: "0 0 16px" }} />
        <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--primary)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
          <SearchIcon size={14} strokeWidth={2} />
          Başga ulanyjyny gözle
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            className="form-control"
            style={{ fontSize: "0.82rem", padding: "10px 14px", flex: 1 }}
            placeholder="Ulanyjy ID-ni giriziň (dev_...)"
            value={searchId}
            onChange={e => setSearchId(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
          />
          <button
            className="btn-primary"
            style={{ padding: "10px 16px", fontSize: "0.82rem", flexShrink: 0 }}
            onClick={handleSearch}
            disabled={searching || !searchId.trim()}
          >
            {searching ? <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : <SearchIcon size={14} />}
          </button>
        </div>

        {searchError && <div className="alert-error" style={{ marginTop: 10 }}>{searchError}</div>}

        {searchResult && (
          <div className="rep-search-result">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: getLevel(searchResult.rep.score).bg,
                  border: `2px solid ${getLevel(searchResult.rep.score).border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1rem",
                }}>
                  {getLevel(searchResult.rep.score).emoji}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.88rem" }}>
                    {searchResult.nickname || searchId.slice(0, 14) + "..."}
                  </div>
                  <div style={{ fontSize: "0.67rem", opacity: 0.5 }}>{searchId.slice(0, 20)}...</div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 900, fontSize: "1.3rem", color: "var(--primary)" }}>{searchResult.rep.score}</div>
                <div style={{ fontSize: "0.65rem", opacity: 0.45 }}>/ 100 bal</div>
              </div>
            </div>
            <div
              className="rep-level-badge"
              style={{
                color: getLevel(searchResult.rep.score).color,
                background: getLevel(searchResult.rep.score).bg,
                borderColor: getLevel(searchResult.rep.score).border,
                fontSize: "0.78rem", padding: "6px 12px", marginBottom: 10,
              }}
            >
              <span>{getLevel(searchResult.rep.score).emoji}</span>
              <span>{getLevel(searchResult.rep.score).labelTm}</span>
            </div>
            <p style={{ fontSize: "0.78rem", opacity: 0.65, lineHeight: 1.55 }}>
              {getWhyDescription(searchResult.rep.score)}
            </p>
            {searchResult.rep.entries.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <p style={{ fontSize: "0.7rem", fontWeight: 700, opacity: 0.45, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Açyk taryh</p>
                <div className="rep-history-list">
                  {searchResult.rep.entries.slice(0, 3).map((e, i) => (
                    e.isPublic && (
                      <div key={i} className="rep-history-item" style={{ padding: "8px 12px" }}>
                        <div className={`rep-history-delta ${e.type}`} style={{ fontSize: "0.72rem" }}>
                          {e.delta > 0 ? `+${e.delta}` : e.delta}
                        </div>
                        <span style={{ flex: 1, fontSize: "0.75rem" }}>{e.reason}</span>
                        <span className="rep-history-time">{formatRelativeTime(e.timestamp)}</span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <RepDetailModal
          onClose={() => setShowModal(false)}
          repData={repData}
          deviceId={deviceId}
        />
      )}
    </div>
  );
}

// ─── Section 2: Tanyşlar ─────────────────────────────────────────────────────

function TanyslarSection({ deviceId }: { deviceId: string }) {
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [addId, setAddId] = useState("");
  const [addNick, setAddNick] = useState("");
  const [adding, setAdding] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [friendReps, setFriendReps] = useState<Record<string, number>>({});
  const { toast } = useToast();

  useEffect(() => {
    const unsub = watchFriends(deviceId, setFriends);
    return () => unsub();
  }, [deviceId]);

  useEffect(() => {
    friends.forEach(f => {
      getReputation(f.deviceId).then(r => {
        setFriendReps(prev => ({ ...prev, [f.deviceId]: r.score }));
      });
    });
  }, [friends]);

  async function handleAdd() {
    const id = addId.trim();
    if (!id) { toast("ID giriziň", "error"); return; }
    if (id === deviceId) { toast("Özüňizi goşup bilmersiňiz", "error"); return; }
    setAdding(true);
    try {
      await addFriend(deviceId, id, addNick || undefined);
      toast("Tanyş üstünlikli goşuldy!", "success");
      setAddId("");
      setAddNick("");
      setShowAdd(false);
    } catch {
      toast("Ýalňyş ID ýa-da ýalňyşlyk ýüz berdi", "error");
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(friendId: string, name: string) {
    if (!confirm(`"${name}" tanyşlar sanawyndan aýyrylsyn my?`)) return;
    try {
      await removeFriend(deviceId, friendId);
      toast("Aýyryldy", "success");
    } catch {
      toast("Ýalňyşlyk ýüz berdi", "error");
    }
  }

  return (
    <div className="profil-section animate-in animate-delay-1">
      <div className="profil-section-header">
        <div className="profil-section-title">
          <UsersIcon size={18} strokeWidth={2} />
          Tanyşlar
        </div>
        <button
          onClick={() => setShowAdd(s => !s)}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            background: showAdd ? "rgba(220,38,38,0.08)" : "rgba(13,148,136,0.09)",
            border: `1.5px solid ${showAdd ? "rgba(220,38,38,0.2)" : "rgba(13,148,136,0.2)"}`,
            borderRadius: 8, padding: "5px 10px", cursor: "pointer",
            color: showAdd ? "#dc2626" : "var(--primary)",
            fontSize: "0.75rem", fontWeight: 700,
            fontFamily: "Poppins, sans-serif", transition: "var(--transition)",
          }}
        >
          {showAdd ? <><XIcon size={12} strokeWidth={2.5} /> Ýap</> : <><PlusCircleIcon size={13} strokeWidth={2} /> Goş</>}
        </button>
      </div>

      {showAdd && (
        <div className="animate-in" style={{ marginBottom: 16, padding: 16, background: "rgba(13,148,136,0.05)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(13,148,136,0.1)" }}>
          <div className="form-group" style={{ marginBottom: 10 }}>
            <label><UserIcon size={13} /> Tanyşyňyzyň ID-si</label>
            <input
              className="form-control"
              style={{ fontSize: "0.85rem" }}
              placeholder="dev_... ID giriz"
              value={addId}
              onChange={e => setAddId(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAdd()}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label>At (islege görä)</label>
            <input
              className="form-control"
              style={{ fontSize: "0.85rem" }}
              placeholder="Tanyşyňyzyň adyny ýazyň..."
              value={addNick}
              onChange={e => setAddNick(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAdd()}
            />
          </div>
          <button
            className="btn-primary btn-block"
            style={{ padding: "11px 20px", fontSize: "0.88rem" }}
            onClick={handleAdd}
            disabled={adding || !addId.trim()}
          >
            {adding ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Goşulýar...</> : <><PlusCircleIcon size={14} /> Tanyş goş</>}
          </button>
        </div>
      )}

      {friends.length === 0 ? (
        <div style={{ textAlign: "center", padding: "20px 0", opacity: 0.38 }}>
          <UsersIcon size={36} strokeWidth={1.2} style={{ margin: "0 auto 8px", display: "block" }} />
          <p style={{ fontSize: "0.82rem" }}>Heniz tanyşlaryňyz ýok</p>
          <p style={{ fontSize: "0.74rem", marginTop: 4 }}>«Goş» düwmesini basyp, ID bilen tanyş goşuň</p>
        </div>
      ) : (
        <div className="friends-list">
          {friends.map(f => {
            const repScore = friendReps[f.deviceId] ?? 20;
            const level = getLevel(repScore);
            return (
              <div key={f.deviceId} className="friend-card">
                <div className="friend-avatar">
                  {(f.nickname || f.deviceId).slice(0, 1).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="friend-name">{f.nickname}</div>
                  <div className="friend-id" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {f.deviceId.slice(0, 18)}...
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <span
                      className="friend-rep-mini"
                      style={{ color: level.color, background: level.bg, borderColor: level.border }}
                    >
                      {level.emoji} {level.label} · {repScore}
                    </span>
                  </div>
                </div>
                <button
                  className="friend-remove-btn"
                  onClick={() => handleRemove(f.deviceId, f.nickname)}
                  title="Aýyr"
                >
                  <XIcon size={12} strokeWidth={2.5} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Section 3: BP Transfer ──────────────────────────────────────────────────

function BPTransferSection({ deviceId }: { deviceId: string }) {
  const { balance, sendBP } = useBonusPul();
  const { toast } = useToast();
  const [toId, setToId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<BPTransfer[]>([]);
  const [loadingHist, setLoadingHist] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    getBPTransferHistory(deviceId).then(h => {
      setHistory(h);
      setLoadingHist(false);
    });
  }, [deviceId]);

  async function handleSend() {
    const id = toId.trim();
    const amt = parseFloat(amount);
    if (!id) { toast("Alyjynyň ID-ni giriziň", "error"); return; }
    if (!amt || amt <= 0) { toast("Nädogry mukdar", "error"); return; }
    if (amt > balance) { toast(`Ýeterlik BP ýok (${balance.toFixed(2)} BP)`, "error"); return; }
    if (!confirm(`${amt} BP ${id.slice(0, 14)}... ID-li ulanyjya iberilsin my?`)) return;

    setSending(true);
    try {
      const result = await sendBP(id, amt, note);
      if (result.success) {
        toast(result.message, "success");
        setToId("");
        setAmount("");
        setNote("");
        const h = await getBPTransferHistory(deviceId);
        setHistory(h);
      } else {
        toast(result.message, "error");
      }
    } catch {
      toast("Geçirme ýerine ýetirilmedi", "error");
    } finally {
      setSending(false);
    }
  }

  const QUICK = [10, 25, 50, 100];

  return (
    <div className="profil-section animate-in animate-delay-2">
      <div className="profil-section-header">
        <div className="profil-section-title">
          <SendIcon size={18} strokeWidth={2} />
          BP Geçirmek
        </div>
        <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--primary)", opacity: 0.7 }}>
          <WalletIcon size={13} strokeWidth={2} style={{ verticalAlign: "middle", marginRight: 4 }} />
          {balance.toFixed(2)} BP
        </div>
      </div>

      <div className="transfer-form">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label><UserIcon size={13} /> Alyjynyň ID-si</label>
          <input
            className="form-control"
            placeholder="dev_... ID giriz"
            value={toId}
            onChange={e => setToId(e.target.value)}
            style={{ fontSize: "0.88rem" }}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label><WalletIcon size={13} /> Mukdar (BP)</label>
          <input
            className="form-control"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Geçirjek BP mukdaryňyz"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            style={{ fontSize: "0.88rem" }}
          />
          <div className="price-cards" style={{ marginTop: 8 }}>
            {QUICK.map(q => (
              <button
                key={q}
                className={`price-card${amount === String(q) ? " selected" : ""}`}
                style={{ minWidth: 56, padding: "10px 6px" }}
                onClick={() => setAmount(String(q))}
              >
                <div className="price-card-amount" style={{ fontSize: "1rem" }}>{q}</div>
                <div className="price-card-label">BP</div>
              </button>
            ))}
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Bellik (islege görä)</label>
          <input
            className="form-control"
            placeholder="Meselem: sagbol, ş.m..."
            value={note}
            onChange={e => setNote(e.target.value)}
            style={{ fontSize: "0.88rem" }}
            maxLength={80}
          />
        </div>

        <button
          className="btn-primary btn-block"
          style={{ padding: "13px 20px" }}
          onClick={handleSend}
          disabled={sending || !toId.trim() || !amount || parseFloat(amount) <= 0}
        >
          {sending
            ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Iberilýär...</>
            : <><SendIcon size={15} /> {amount ? `${amount} BP Geçir` : "Geçir"}</>
          }
        </button>
      </div>

      {/* History */}
      <div style={{ marginTop: 16 }}>
        <button
          onClick={() => setShowHistory(s => !s)}
          style={{
            width: "100%", padding: "10px 14px", borderRadius: "var(--radius-sm)",
            background: "rgba(13,148,136,0.05)", border: "1px solid rgba(13,148,136,0.1)",
            cursor: "pointer", fontFamily: "Poppins, sans-serif", fontSize: "0.8rem",
            fontWeight: 700, color: "var(--primary)", display: "flex",
            alignItems: "center", justifyContent: "space-between",
            transition: "var(--transition)",
          }}
        >
          <span>Geçirme taryhy</span>
          <span style={{ opacity: 0.55 }}>{showHistory ? "▲" : "▼"} {history.length} amal</span>
        </button>

        {showHistory && (
          <div className="animate-in">
            {loadingHist ? (
              <div style={{ textAlign: "center", padding: 16 }}><div className="spinner" style={{ width: 24, height: 24, borderWidth: 3 }} /></div>
            ) : history.length === 0 ? (
              <div style={{ textAlign: "center", padding: "16px 0", opacity: 0.38, fontSize: "0.8rem" }}>
                Heniz geçirme ýok
              </div>
            ) : (
              <div className="transfer-history-list">
                {history.map(t => {
                  const isOut = t.from === deviceId;
                  return (
                    <div key={t.id} className="transfer-item">
                      <div className={`transfer-arrow-icon ${isOut ? "out" : "in"}`}>
                        {isOut
                          ? <ArrowUpIcon size={13} strokeWidth={2.5} />
                          : <ArrowDownIcon size={13} strokeWidth={2.5} />
                        }
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: "0.8rem" }}>
                          {isOut ? `→ ${t.toNickname || (t.to.slice(0, 12) + "...")}` : `← ${t.fromNickname || (t.from.slice(0, 12) + "...")}`}
                        </div>
                        {t.note && <div style={{ fontSize: "0.7rem", opacity: 0.5, marginTop: 2 }}>{t.note}</div>}
                        <div style={{ fontSize: "0.67rem", opacity: 0.38, marginTop: 1 }}>{formatRelativeTime(t.timestamp)}</div>
                      </div>
                      <div className={isOut ? "transfer-amount-out" : "transfer-amount-in"}>
                        {isOut ? "-" : "+"}{t.amount} BP
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Profil() {
  const { deviceId, balance } = useBonusPul();
  const { toast } = useToast();
  const { msg: copyMsg, copy } = useCopyFlash();

  const [nickname, setNickname] = useState("");
  const [editingNick, setEditingNick] = useState(false);
  const [nickInput, setNickInput] = useState("");
  const [savingNick, setSavingNick] = useState(false);
  const nickInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getUserNickname(deviceId).then(n => {
      if (n) setNickname(n);
    });
  }, [deviceId]);

  useEffect(() => {
    if (editingNick) {
      setNickInput(nickname);
      setTimeout(() => nickInputRef.current?.focus(), 80);
    }
  }, [editingNick, nickname]);

  async function saveNickname() {
    const trimmed = nickInput.trim();
    if (!trimmed) { setEditingNick(false); return; }
    setSavingNick(true);
    try {
      await setUserNickname(deviceId, trimmed);
      setNickname(trimmed);
      toast("At üýtgedildi!", "success");
    } catch {
      toast("Ýalňyşlyk ýüz berdi", "error");
    } finally {
      setSavingNick(false);
      setEditingNick(false);
    }
  }

  const displayName = nickname || deviceId.slice(0, 10) + "...";
  const avatarLetter = (nickname || "Y").slice(0, 1).toUpperCase();

  return (
    <div className="page-section">
      <div className="container" style={{ maxWidth: 600 }}>
        {/* ── ID Card ── */}
        <div className="profil-id-card animate-in">
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14, position: "relative", zIndex: 1 }}>
            <div className="profil-id-avatar">{avatarLetter}</div>
            <div className="profil-id-info" style={{ flex: 1, minWidth: 0 }}>
              {!editingNick ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div className="profil-id-name">{displayName}</div>
                  <button
                    onClick={() => setEditingNick(true)}
                    style={{
                      background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.28)",
                      borderRadius: 6, padding: "3px 7px", cursor: "pointer", color: "rgba(255,255,255,0.8)",
                      display: "flex", alignItems: "center", transition: "all 0.2s",
                    }}
                    title="Ady üýtget"
                  >
                    <EditIcon size={12} strokeWidth={2} />
                  </button>
                </div>
              ) : (
                <div className="profil-nickname-edit">
                  <input
                    ref={nickInputRef}
                    className="profil-nickname-input"
                    value={nickInput}
                    onChange={e => setNickInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") saveNickname(); if (e.key === "Escape") setEditingNick(false); }}
                    maxLength={32}
                    placeholder="Adyňyz..."
                  />
                  <button
                    onClick={saveNickname}
                    disabled={savingNick}
                    style={{
                      background: "rgba(255,255,255,0.25)", border: "none", borderRadius: 6,
                      padding: "6px 8px", cursor: "pointer", color: "white", flexShrink: 0,
                    }}
                  >
                    {savingNick ? <div className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} /> : <CheckIcon size={14} strokeWidth={2.5} />}
                  </button>
                  <button
                    onClick={() => setEditingNick(false)}
                    style={{
                      background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 6,
                      padding: "6px 8px", cursor: "pointer", color: "rgba(255,255,255,0.7)", flexShrink: 0,
                    }}
                  >
                    <XIcon size={14} strokeWidth={2.5} />
                  </button>
                </div>
              )}

              <div className="profil-id-sub">Ýeňil agzasy</div>

              <div
                className="profil-id-code"
                onClick={() => copy(deviceId, "ID kopyalandy!")}
                title="ID kopyala"
              >
                <CopyIcon size={11} strokeWidth={2} />
                <span style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {deviceId}
                </span>
              </div>

              <div className="profil-balance-chip" style={{ marginTop: 10 }}>
                <WalletIcon size={13} strokeWidth={2} />
                <strong>{balance.toFixed(2)}</strong>
                <span style={{ opacity: 0.7, fontSize: "0.72rem" }}>BP</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Sections ── */}
        <ReputationSection deviceId={deviceId} />
        <TanyslarSection deviceId={deviceId} />
        <BPTransferSection deviceId={deviceId} />

        {/* Copy flash */}
        {copyMsg && <div className="copy-flash">{copyMsg}</div>}
      </div>
    </div>
  );
}
