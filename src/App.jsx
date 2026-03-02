import { useState, useRef, useEffect } from "react";

const COLORS = [
  { bg: "#FF6B6B", light: "#FFE5E5", text: "#C0392B" },
  { bg: "#4ECDC4", light: "#E0F7F6", text: "#1A9E96" },
  { bg: "#A29BFE", light: "#EBE8FF", text: "#6C5CE7" },
  { bg: "#FD79A8", light: "#FFE8F2", text: "#D63071" },
  { bg: "#FDCB6E", light: "#FFF5DD", text: "#E17055" },
  { bg: "#6C5CE7", light: "#E8E5FF", text: "#4A3DB7" },
  { bg: "#00B894", light: "#D4F5EC", text: "#007A60" },
  { bg: "#E17055", light: "#FFE8DF", text: "#C0572A" },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildText(groups) {
  const lines = [];
  const date = new Date().toLocaleString("zh-TW");
  lines.push(`隨機分組結果 — ${date}`);
  lines.push("=".repeat(30));
  groups.forEach((group, i) => {
    lines.push(`\n第 ${i + 1} 組（${group.length} 人）`);
    group.forEach((name) => lines.push(`  • ${name}`));
  });
  lines.push(`\n${"=".repeat(30)}`);
  lines.push(`總計：${groups.flat().length} 人 / ${groups.length} 組`);
  return lines.join("\n");
}

function buildCSV(groups) {
  const rows = [["組別", "成員"]];
  groups.forEach((group, i) => {
    group.forEach((name) => rows.push([`第${i + 1}組`, name]));
  });
  return rows.map((r) => r.join(",")).join("\n");
}

// ── Export Modal ───────────────────────────────────────────────
function ExportModal({ groups, onClose }) {
  const [tab, setTab] = useState("txt");
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef(null);

  const content = tab === "txt" ? buildText(groups) : buildCSV(groups);
  const label = tab === "txt" ? ".txt 文字格式" : ".csv 試算表格式";

  const handleCopy = () => {
    const doCopy = () => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.select();
        try { document.execCommand("copy"); setCopied(true); setTimeout(() => setCopied(false), 2000); return; } catch (_) {}
      }
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(content).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(doCopy);
    } else { doCopy(); }
  };

  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()} style={{
      position: "fixed", inset: 0, zIndex: 999,
      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{
        background: "#1e2a45", border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: 20, padding: 28, width: "100%", maxWidth: 560, maxHeight: "80vh",
        display: "flex", flexDirection: "column", gap: 16, boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>📤 匯出結果</h3>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, color: "#fff", width: 32, height: 32, cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["txt", "csv"].map((t) => (
            <button key={t} onClick={() => { setTab(t); setCopied(false); }} style={{
              padding: "8px 20px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.2)",
              background: tab === t ? "#e94560" : "transparent", color: "#fff",
              cursor: "pointer", fontWeight: tab === t ? 700 : 400, fontSize: 14, transition: "all 0.15s",
            }}>
              {t === "txt" ? "📄 .txt" : "📊 .csv"}
            </button>
          ))}
        </div>
        <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
          以下是 <strong style={{ color: "rgba(255,255,255,0.85)" }}>{label}</strong> 的內容。點「複製」後貼到記事本或 Excel 儲存。
        </p>
        <textarea ref={textareaRef} readOnly value={content} onClick={(e) => e.target.select()} style={{
          flex: 1, minHeight: 220, background: "rgba(0,0,0,0.3)",
          border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: 14,
          color: "rgba(255,255,255,0.85)", fontSize: 13,
          fontFamily: "'Space Mono','Courier New',monospace", lineHeight: 1.6, resize: "none", outline: "none",
        }} />
        <button onClick={handleCopy} style={{
          background: copied ? "linear-gradient(135deg,#00b894,#00cec9)" : "linear-gradient(135deg,#e94560,#f5a623)",
          border: "none", borderRadius: 12, padding: "13px 0",
          color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", transition: "background 0.3s", fontFamily: "inherit",
        }}>
          {copied ? "✅ 已複製到剪貼簿！" : "📋 一鍵複製全部內容"}
        </button>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────
export default function GroupRandomizer() {
  const [nameInput, setNameInput] = useState("");
  const [mode, setMode] = useState("groups");
  const [groupCount, setGroupCount] = useState("");
  const [perGroupCount, setPerGroupCount] = useState("");
  const [groups, setGroups] = useState(null);
  const [error, setError] = useState("");
  const [renderKey, setRenderKey] = useState(0);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [clipCopied, setClipCopied] = useState(false);

  // drag state — two modes: "member" drag within/between groups, "group" drag to reorder groups
  const dragItem = useRef(null);         // { type:"member", groupIdx, memberIdx } | { type:"group", groupIdx }
  const dragOverGroupIdx = useRef(null); // for group reorder drop target

  useEffect(() => {
    if (!showExportDropdown) return;
    const handler = () => setShowExportDropdown(false);
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [showExportDropdown]);

  const names = nameInput.split(/[\n,，、]+/).map((n) => n.trim()).filter(Boolean);

  const runGenerate = () => {
    setError("");
    if (names.length < 2) { setError("請至少輸入 2 個名字"); return null; }
    let numGroups;
    if (mode === "groups") {
      numGroups = parseInt(groupCount);
      if (!numGroups || numGroups < 1) { setError("請輸入有效的組數"); return null; }
      if (numGroups > names.length) { setError("組數不能超過人數"); return null; }
    } else {
      const perGroup = parseInt(perGroupCount);
      if (!perGroup || perGroup < 1) { setError("請輸入每組人數"); return null; }
      numGroups = Math.ceil(names.length / perGroup);
    }
    const shuffled = shuffle(names);
    const result = Array.from({ length: numGroups }, () => []);
    shuffled.forEach((name, i) => result[i % numGroups].push(name));
    return result;
  };

  const handleGenerate = () => {
    const result = runGenerate();
    if (!result) return;
    setGroups(result);
    setRenderKey((k) => k + 1);
  };

  const handleReset = () => { setGroups(null); setError(""); };

  const handleAddGroup = () => {
    setGroups((prev) => [...prev, []]);
  };

  const handleClipboardCopy = () => {
    const lines = groups.map((g, i) => `第 ${i + 1} 組：${g.join("、")}`);
    const text = lines.join("\n");
    const doCopy = () => {
      const ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.focus(); ta.select();
      try { document.execCommand("copy"); } catch (_) {}
      document.body.removeChild(ta);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(doCopy);
    } else { doCopy(); }
    setClipCopied(true);
    setTimeout(() => setClipCopied(false), 2000);
    setShowExportDropdown(false);
  };

  // ── Member drag (within / between groups) ──
  const onMemberDragStart = (e, groupIdx, memberIdx) => {
    dragItem.current = { type: "member", groupIdx, memberIdx };
    e.dataTransfer.effectAllowed = "move";
    e.stopPropagation(); // prevent triggering group drag
  };

  const onMemberDrop = (e, targetGroupIdx, targetMemberIdx = null) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragItem.current || dragItem.current.type !== "member") return;
    const { groupIdx: srcGroup, memberIdx: srcMember } = dragItem.current;
    if (srcGroup === targetGroupIdx && srcMember === targetMemberIdx) return;
    const newGroups = groups.map((g) => [...g]);
    const [movedName] = newGroups[srcGroup].splice(srcMember, 1);
    if (targetMemberIdx !== null && srcGroup === targetGroupIdx) {
      const adj = targetMemberIdx > srcMember ? targetMemberIdx - 1 : targetMemberIdx;
      newGroups[targetGroupIdx].splice(adj, 0, movedName);
    } else if (targetMemberIdx !== null) {
      newGroups[targetGroupIdx].splice(targetMemberIdx, 0, movedName);
    } else {
      newGroups[targetGroupIdx].push(movedName);
    }
    setGroups(newGroups);
    dragItem.current = null;
  };

  // ── Group drag (reorder groups) ──
  const onGroupDragStart = (e, groupIdx) => {
    // Only trigger if not dragging a member chip
    if (dragItem.current && dragItem.current.type === "member") return;
    dragItem.current = { type: "group", groupIdx };
    e.dataTransfer.effectAllowed = "move";
  };

  const onGroupDragOver = (e, groupIdx) => {
    e.preventDefault();
    dragOverGroupIdx.current = groupIdx;
  };

  const onGroupDrop = (e, targetGroupIdx) => {
    e.preventDefault();
    if (!dragItem.current || dragItem.current.type !== "group") return;
    const srcIdx = dragItem.current.groupIdx;
    if (srcIdx === targetGroupIdx) return;
    const newGroups = [...groups];
    const [moved] = newGroups.splice(srcIdx, 1);
    newGroups.splice(targetGroupIdx, 0, moved);
    setGroups(newGroups);
    dragItem.current = null;
    dragOverGroupIdx.current = null;
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
      fontFamily: "'Noto Sans TC', 'Segoe UI', sans-serif",
      padding: "40px 20px", color: "#fff",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;700;900&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; }
        .btn-primary {
          background: linear-gradient(135deg,#e94560,#f5a623);
          color:#fff; border:none; border-radius:12px;
          padding:14px 36px; font-size:16px; font-weight:700;
          cursor:pointer; transition:transform 0.15s,box-shadow 0.15s; letter-spacing:1px;
        }
        .btn-primary:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(233,69,96,0.4); }
        .btn-secondary {
          background:rgba(255,255,255,0.1); color:#fff;
          border:1px solid rgba(255,255,255,0.25); border-radius:12px;
          padding:11px 18px; font-size:14px; cursor:pointer;
          transition:background 0.15s; white-space:nowrap; font-family:inherit;
        }
        .btn-secondary:hover { background:rgba(255,255,255,0.2); }
        .btn-add-group {
          background: rgba(253,203,110,0.15);
          color: #FDCB6E; border: 1.5px dashed #FDCB6E; border-radius:12px;
          padding:11px 18px; font-size:14px; font-weight:700; cursor:pointer;
          transition:all 0.15s; white-space:nowrap; font-family:inherit;
        }
        .btn-add-group:hover { background:rgba(253,203,110,0.25); transform:translateY(-1px); }
        .btn-export {
          background:linear-gradient(135deg,#00b894,#00cec9);
          color:#fff; border:none; border-radius:12px;
          padding:11px 18px; font-size:14px; font-weight:700;
          cursor:pointer; transition:transform 0.15s,box-shadow 0.15s;
          white-space:nowrap; font-family:inherit;
        }
        .btn-export:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,184,148,0.4); }
        .input-field {
          width:100%; background:rgba(255,255,255,0.07);
          border:1px solid rgba(255,255,255,0.15); border-radius:10px;
          padding:12px 16px; color:#fff; font-size:15px;
          outline:none; transition:border-color 0.2s; font-family:inherit;
        }
        .input-field:focus { border-color:#e94560; }
        .input-field::placeholder { color:rgba(255,255,255,0.35); }
        .mode-btn {
          padding:10px 22px; border-radius:8px; border:1px solid rgba(255,255,255,0.2);
          background:transparent; color:rgba(255,255,255,0.6);
          cursor:pointer; font-size:14px; transition:all 0.2s; font-family:inherit;
        }
        .mode-btn.active { background:#e94560; border-color:#e94560; color:#fff; font-weight:700; }
        .member-chip {
          display:inline-flex; align-items:center; padding:6px 14px;
          border-radius:20px; font-size:14px; font-weight:600; cursor:grab;
          transition:transform 0.15s,box-shadow 0.15s; user-select:none; margin:4px;
        }
        .member-chip:hover { transform:scale(1.05); box-shadow:0 4px 12px rgba(0,0,0,0.3); }
        .member-chip:active { cursor:grabbing; }
        .group-card {
          border-radius:16px; padding:20px;
          background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1);
          transition:border-color 0.2s,background 0.2s,transform 0.15s,box-shadow 0.15s;
          min-height:120px; cursor:grab;
        }
        .group-card:active { cursor:grabbing; }
        .group-card.member-drag-over { border-color:#e94560; background:rgba(233,69,96,0.08); }
        .group-card.group-drag-over { border-color:#FDCB6E; background:rgba(253,203,110,0.08); transform:scale(1.02); box-shadow:0 8px 24px rgba(253,203,110,0.2); }
        .group-drag-handle {
          display:inline-flex; align-items:center; justify-content:center;
          width:22px; height:22px; border-radius:4px; cursor:grab;
          color:rgba(255,255,255,0.3); font-size:14px;
          transition:color 0.15s,background 0.15s;
          flex-shrink:0;
        }
        .group-drag-handle:hover { color:rgba(255,255,255,0.7); background:rgba(255,255,255,0.1); }
        .export-dd {
          position:absolute; top:calc(100% + 8px); right:0;
          background:#1e2a45; border:1px solid rgba(255,255,255,0.15);
          border-radius:12px; padding:6px; min-width:200px; z-index:200;
          box-shadow:0 12px 40px rgba(0,0,0,0.5); animation:fadeUp 0.15s ease both;
        }
        .export-item {
          display:flex; align-items:center; gap:10px; width:100%;
          padding:10px 14px; border-radius:8px; border:none;
          background:transparent; color:rgba(255,255,255,0.85);
          font-size:14px; cursor:pointer; text-align:left;
          transition:background 0.15s; font-family:inherit;
        }
        .export-item:hover { background:rgba(255,255,255,0.1); }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(10px); }
          to { opacity:1; transform:translateY(0); }
        }
        .fade-in { animation:fadeUp 0.35s ease both; }
      `}</style>

      {showExportModal && groups && (
        <ExportModal groups={groups} onClose={() => setShowExportModal(false)} />
      )}

      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 13, letterSpacing: 4, color: "#e94560", marginBottom: 8, fontFamily: "'Space Mono',monospace" }}>RANDOM</div>
          <h1 style={{ fontSize: "clamp(32px,6vw,52px)", fontWeight: 900, margin: 0, letterSpacing: -1 }}>隨機分組抽籤</h1>
          <p style={{ color: "rgba(255,255,255,0.45)", marginTop: 8, fontSize: 14 }}>輸入名單・設定規則・隨機分組・拖拉調整</p>
        </div>

        {/* ── INPUT ── */}
        {!groups ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }} className="fade-in">
            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 16, padding: 24, border: "1px solid rgba(255,255,255,0.1)" }}>
              <label style={{ display: "block", marginBottom: 10, fontWeight: 700, fontSize: 15 }}>
                📋 名單輸入
                {names.length > 0 && <span style={{ marginLeft: 10, fontSize: 13, color: "#e94560", fontWeight: 400 }}>已輸入 {names.length} 人</span>}
              </label>
              <textarea
                className="input-field" rows={8} value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder={"每行一個名字，或用逗號分隔\n例：\n小明\n小華\n小美\n阿志"}
              />
              {names.length > 0 && (
                <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {names.map((n, i) => (
                    <span key={i} style={{ background: "rgba(255,255,255,0.1)", borderRadius: 6, padding: "3px 10px", fontSize: 13, color: "rgba(255,255,255,0.8)" }}>{n}</span>
                  ))}
                </div>
              )}
            </div>

            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 16, padding: 24, border: "1px solid rgba(255,255,255,0.1)" }}>
              <label style={{ display: "block", marginBottom: 14, fontWeight: 700, fontSize: 15 }}>⚙️ 分組設定</label>
              <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                <button className={`mode-btn ${mode === "groups" ? "active" : ""}`} onClick={() => setMode("groups")}>指定組數</button>
                <button className={`mode-btn ${mode === "perGroup" ? "active" : ""}`} onClick={() => setMode("perGroup")}>指定每組人數</button>
              </div>
              {mode === "groups" ? (
                <div>
                  <label style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 6, display: "block" }}>分成幾組？</label>
                  <input type="number" min="1" className="input-field" style={{ maxWidth: 160 }} value={groupCount} onChange={(e) => setGroupCount(e.target.value)} placeholder="例：4" />
                </div>
              ) : (
                <div>
                  <label style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 6, display: "block" }}>每組幾人？</label>
                  <input type="number" min="1" className="input-field" style={{ maxWidth: 160 }} value={perGroupCount} onChange={(e) => setPerGroupCount(e.target.value)} placeholder="例：5" />
                  {perGroupCount && names.length > 0 && (
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 8 }}>
                      預計分為 {Math.ceil(names.length / (parseInt(perGroupCount) || 1))} 組
                    </p>
                  )}
                </div>
              )}
            </div>

            {error && (
              <div style={{ background: "rgba(233,69,96,0.15)", border: "1px solid rgba(233,69,96,0.4)", borderRadius: 10, padding: "12px 16px", color: "#ff8fa3", fontSize: 14 }}>
                ⚠️ {error}
              </div>
            )}

            <button className="btn-primary" onClick={handleGenerate} style={{ alignSelf: "center", minWidth: 180 }}>
              🎲 開始抽籤
            </button>
          </div>

        ) : (
          /* ── RESULT ── */
          <div key={renderKey} className="fade-in">
            {/* Toolbar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>🎉 分組結果</h2>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "rgba(255,255,255,0.45)" }}>
                  拖拉<span style={{ color: "#FDCB6E" }}>名字</span>調整成員・拖拉<span style={{ color: "#FDCB6E" }}>組別標題列</span>重新排序
                </p>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                {/* Add group button */}
                <button className="btn-add-group" onClick={handleAddGroup}>
                  ＋ 新增分組
                </button>
                {/* Export dropdown */}
                <div style={{ position: "relative" }}>
                  <button className="btn-export" onClick={(e) => { e.stopPropagation(); setShowExportDropdown((v) => !v); }}>
                    📤 匯出結果 ▾
                  </button>
                  {showExportDropdown && (
                    <div className="export-dd" onClick={(e) => e.stopPropagation()}>
                      <button className="export-item" onClick={() => { setShowExportModal(true); setShowExportDropdown(false); }}>
                        📄 預覽並複製 (.txt / .csv)
                      </button>
                      <button className="export-item" onClick={handleClipboardCopy}>
                        {clipCopied ? "✅ 已複製！" : "📋 快速複製到剪貼簿"}
                      </button>
                    </div>
                  )}
                </div>
                <button className="btn-secondary" onClick={handleGenerate}>🔀 重新抽籤</button>
                <button className="btn-secondary" onClick={handleReset}>← 返回</button>
              </div>
            </div>

            {/* Groups grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))", gap: 16 }}>
              {groups.map((group, gIdx) => {
                const color = COLORS[gIdx % COLORS.length];
                return (
                  <div
                    key={gIdx}
                    className="group-card"
                    draggable
                    onDragStart={(e) => onGroupDragStart(e, gIdx)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (dragItem.current?.type === "group") {
                        e.currentTarget.classList.add("group-drag-over");
                        dragOverGroupIdx.current = gIdx;
                      } else {
                        e.currentTarget.classList.add("member-drag-over");
                      }
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.classList.remove("group-drag-over");
                      e.currentTarget.classList.remove("member-drag-over");
                    }}
                    onDrop={(e) => {
                      e.currentTarget.classList.remove("group-drag-over");
                      e.currentTarget.classList.remove("member-drag-over");
                      if (dragItem.current?.type === "group") {
                        onGroupDrop(e, gIdx);
                      } else {
                        onMemberDrop(e, gIdx);
                      }
                    }}
                  >
                    {/* Group header — drag handle for group reorder */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, userSelect: "none" }}>
                      <span
                        className="group-drag-handle"
                        title="拖拉此處可重新排列組別順序"
                      >⠿</span>
                      <div style={{
                        width: 28, height: 28, borderRadius: "50%", background: color.bg,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 900, color: "#fff", fontFamily: "'Space Mono',monospace", flexShrink: 0,
                      }}>{gIdx + 1}</div>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>第 {gIdx + 1} 組</span>
                      <span style={{ marginLeft: "auto", fontSize: 12, background: "rgba(255,255,255,0.1)", borderRadius: 4, padding: "2px 8px", color: "rgba(255,255,255,0.55)" }}>
                        {group.length} 人
                      </span>
                    </div>

                    {/* Members */}
                    <div style={{ display: "flex", flexWrap: "wrap" }}>
                      {group.length === 0 ? (
                        <div style={{
                          width: "100%", padding: "12px 0", textAlign: "center", fontSize: 13,
                          color: "rgba(255,255,255,0.25)", border: "1.5px dashed rgba(255,255,255,0.12)",
                          borderRadius: 10, letterSpacing: 1,
                        }}>
                          （空組別，可拖拉名字至此）
                        </div>
                      ) : (
                        group.map((name, mIdx) => (
                          <span
                            key={mIdx}
                            className="member-chip"
                            draggable
                            onDragStart={(e) => onMemberDragStart(e, gIdx, mIdx)}
                            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            onDrop={(e) => { e.stopPropagation(); onMemberDrop(e, gIdx, mIdx); }}
                            style={{ background: color.light, color: color.text }}
                          >
                            {name}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div style={{
              marginTop: 24, background: "rgba(255,255,255,0.04)", borderRadius: 12,
              padding: "16px 20px", border: "1px solid rgba(255,255,255,0.08)",
              display: "flex", gap: 24, flexWrap: "wrap", fontSize: 14, color: "rgba(255,255,255,0.55)",
            }}>
              <span>👥 總人數：<strong style={{ color: "#fff" }}>{groups.flat().length}</strong></span>
              <span>🗂 組數：<strong style={{ color: "#fff" }}>{groups.length}</strong></span>
              <span>📊 每組約 <strong style={{ color: "#fff" }}>{Math.ceil(groups.flat().length / Math.max(groups.length, 1))}</strong> 人</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
