import { useState, useEffect, useCallback } from "react";

// ─── DATA ────────────────────────────────────────────────────────────────────

const GROUPS_DATA = {
  A: ["México", "África do Sul", "Coreia do Sul", "Rep. Tcheca"],
  B: ["Canadá", "Bósnia", "Catar", "Suíça"],
  C: ["Brasil", "Marrocos", "Haiti", "Escócia"],
  D: ["EUA", "Paraguai", "Austrália", "Turquia"],
  E: ["Alemanha", "Curaçao", "Costa do Marfim", "Equador"],
  F: ["Holanda", "Japão", "Suécia", "Tunísia"],
  G: ["Bélgica", "Egito", "Irã", "Nova Zelândia"],
  H: ["Espanha", "Cabo Verde", "Arábia Saudita", "Uruguai"],
  I: ["França", "Senegal", "Iraque", "Noruega"],
  J: ["Argentina", "Argélia", "Áustria", "Jordânia"],
  K: ["Portugal", "RD Congo", "Uzbequistão", "Colômbia"],
  L: ["Inglaterra", "Croácia", "Gana", "Panamá"],
};

const FLAGS = {
  "México": "🇲🇽", "África do Sul": "🇿🇦", "Coreia do Sul": "🇰🇷", "Rep. Tcheca": "🇨🇿",
  "Canadá": "🇨🇦", "Bósnia": "🇧🇦", "Catar": "🇶🇦", "Suíça": "🇨🇭",
  "Brasil": "🇧🇷", "Marrocos": "🇲🇦", "Haiti": "🇭🇹", "Escócia": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  "EUA": "🇺🇸", "Paraguai": "🇵🇾", "Austrália": "🇦🇺", "Turquia": "🇹🇷",
  "Alemanha": "🇩🇪", "Curaçao": "🇨🇼", "Costa do Marfim": "🇨🇮", "Equador": "🇪🇨",
  "Holanda": "🇳🇱", "Japão": "🇯🇵", "Suécia": "🇸🇪", "Tunísia": "🇹🇳",
  "Bélgica": "🇧🇪", "Egito": "🇪🇬", "Irã": "🇮🇷", "Nova Zelândia": "🇳🇿",
  "Espanha": "🇪🇸", "Cabo Verde": "🇨🇻", "Arábia Saudita": "🇸🇦", "Uruguai": "🇺🇾",
  "França": "🇫🇷", "Senegal": "🇸🇳", "Iraque": "🇮🇶", "Noruega": "🇳🇴",
  "Argentina": "🇦🇷", "Argélia": "🇩🇿", "Áustria": "🇦🇹", "Jordânia": "🇯🇴",
  "Portugal": "🇵🇹", "RD Congo": "🇨🇩", "Uzbequistão": "🇺🇿", "Colômbia": "🇨🇴",
  "Inglaterra": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Croácia": "🇭🇷", "Gana": "🇬🇭", "Panamá": "🇵🇦",
};

function generateGroupMatches() {
  const matches = [];
  let id = 1;
  const rounds = ["1ª Rodada", "1ª Rodada", "2ª Rodada", "2ª Rodada", "3ª Rodada", "3ª Rodada"];
  Object.entries(GROUPS_DATA).forEach(([group, teams]) => {
    const [t1, t2, t3, t4] = teams;
    const pairs = [[t1,t2],[t3,t4],[t1,t3],[t2,t4],[t1,t4],[t2,t3]];
    pairs.forEach(([home, away], i) => {
      matches.push({ id: id++, group, round: rounds[i], phase: "Grupos", home, away, scoreHome: null, scoreAway: null, locked: false });
    });
  });
  return matches;
}

const INITIAL_MATCHES = generateGroupMatches();

// ─── SCORING ─────────────────────────────────────────────────────────────────

function getMatchResult(scoreHome, scoreAway) {
  if (scoreHome === null || scoreAway === null) return null;
  if (scoreHome > scoreAway) return "home";
  if (scoreAway > scoreHome) return "away";
  return "draw";
}

function calcPoints(guess, match) {
  if (match.scoreHome === null || match.scoreAway === null) return 0;
  let pts = 0;
  const realResult = getMatchResult(match.scoreHome, match.scoreAway);
  const guessResult = getMatchResult(guess.scoreHome, guess.scoreAway);
  if (guessResult === realResult) pts += 1;
  if (match.scoreHome - match.scoreAway === guess.scoreHome - guess.scoreAway) pts += 3;
  if (match.scoreHome === guess.scoreHome && match.scoreAway === guess.scoreAway) pts += 5;
  return pts;
}

// ─── STORAGE ─────────────────────────────────────────────────────────────────

function load(key, def) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch { return def; }
}
function save(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

const inputSm = { width: 44, textAlign: "center", background: "#111111", border: "1px solid #2a2a2a", color: "#e8e8e8", borderRadius: 6, padding: "6px 4px", fontSize: 16, fontWeight: 700 };
const btnGold = { background: "#c9a227", color: "#111", border: "none", borderRadius: 6, padding: "7px 14px", fontWeight: 700, cursor: "pointer", fontSize: 13 };
const btnSmall = { background: "#1a1a1a", color: "#e8e8e8", border: "none", borderRadius: 6, padding: "7px 12px", fontWeight: 700, cursor: "pointer", fontSize: 13 };
const inputStyle = { background: "#0a0a0a", border: "1px solid #2a2a2a", color: "#e8e8e8", borderRadius: 6, padding: "10px 12px", fontSize: 14, width: "100%", boxSizing: "border-box" };

function ScoreBadge({ score, color = "#c9a227" }) {
  return (
    <span style={{ background: color, color: "#111", fontWeight: 900, fontSize: 13, borderRadius: 4, padding: "2px 7px", fontFamily: "'Courier New', monospace", letterSpacing: 1 }}>
      {score}
    </span>
  );
}

function MatchCard({ match, onSetScore, isAdmin, userGuess, showResult }) {
  const [h, setH] = useState("");
  const [a, setA] = useState("");
  const [guessH, setGuessH] = useState("");
  const [guessA, setGuessA] = useState("");

  const hasScore = match.scoreHome !== null && match.scoreAway !== null;
  const pts = showResult && userGuess ? calcPoints(userGuess, match) : null;

  return (
    <div style={{ background: "#161616", border: "1px solid #2a2a2a", borderRadius: 10, padding: "14px 16px", marginBottom: 10, position: "relative" }}>
      {pts !== null && (
        <div style={{ position: "absolute", top: 8, right: 10, background: pts > 0 ? "#c9a227" : "#333", color: pts > 0 ? "#111" : "#888", fontWeight: 900, fontSize: 12, borderRadius: 20, padding: "2px 10px" }}>
          {pts > 0 ? `+${pts} pts` : "0 pts"}
        </div>
      )}
      <div style={{ fontSize: 11, color: "#888888", marginBottom: 6, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
        Grupo {match.group} · {match.round} · {match.phase}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div style={{ flex: 1, textAlign: "right", fontWeight: 700, fontSize: 15, color: "#e8e8e8" }}>
          {FLAGS[match.home] || "🏳"} {match.home}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          {hasScore ? (
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <ScoreBadge score={match.scoreHome} color="#c9a227" />
              <span style={{ color: "#888888", fontWeight: 900 }}>×</span>
              <ScoreBadge score={match.scoreAway} color="#c9a227" />
            </div>
          ) : (
            <span style={{ color: "#555555", fontSize: 13, fontStyle: "italic" }}>Aguardando</span>
          )}
        </div>
        <div style={{ flex: 1, textAlign: "left", fontWeight: 700, fontSize: 15, color: "#e8e8e8" }}>
          {FLAGS[match.away] || "🏳"} {match.away}
        </div>
      </div>

      {isAdmin && !hasScore && (
        <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>
          <input type="number" min="0" max="20" value={h} onChange={e => setH(e.target.value)} placeholder="Casa" style={inputSm} />
          <span style={{ color: "#888888" }}>×</span>
          <input type="number" min="0" max="20" value={a} onChange={e => setA(e.target.value)} placeholder="Fora" style={inputSm} />
          <button onClick={() => { if (h !== "" && a !== "") { onSetScore(match.id, parseInt(h), parseInt(a)); setH(""); setA(""); }}} style={btnGold}>
            ✓ Confirmar Placar
          </button>
        </div>
      )}

      {!isAdmin && !hasScore && !userGuess && (
        <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>
          <span style={{ color: "#aaaaaa", fontSize: 12 }}>Seu palpite:</span>
          <input type="number" min="0" max="20" value={guessH} onChange={e => setGuessH(e.target.value)} placeholder="?" style={inputSm} />
          <span style={{ color: "#888888" }}>×</span>
          <input type="number" min="0" max="20" value={guessA} onChange={e => setGuessA(e.target.value)} placeholder="?" style={inputSm} />
          <button onClick={() => { if (guessH !== "" && guessA !== "") { onSetScore(match.id, parseInt(guessH), parseInt(guessA)); setGuessH(""); setGuessA(""); }}} style={btnSmall}>
            Enviar
          </button>
        </div>
      )}

      {!isAdmin && userGuess && (
        <div style={{ marginTop: 8, textAlign: "center", color: "#aaaaaa", fontSize: 12 }}>
          Seu palpite: <strong style={{ color: "#c9a227" }}>{userGuess.scoreHome} × {userGuess.scoreAway}</strong>
          {hasScore && <span style={{ marginLeft: 8, color: pts > 0 ? "#c9a227" : "#aa4a4a" }}>{pts > 0 ? "✓ Acertou!" : "✗ Errou"}</span>}
        </div>
      )}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

export default function App() {
  const [tab, setTab] = useState("palpites");
  const [matches, setMatches] = useState(() => load("copa26_matches", INITIAL_MATCHES));
  const [players, setPlayers] = useState(() => load("copa26_players", []));
  const [guesses, setGuesses] = useState(() => load("copa26_guesses", {}));
  const [activePlayer, setActivePlayer] = useState(null);
  const [adminMode, setAdminMode] = useState(false);
  const [adminPass, setAdminPass] = useState("");
  const [showPassInput, setShowPassInput] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerPass, setNewPlayerPass] = useState("");
  const [newPlayerPassConfirm, setNewPlayerPassConfirm] = useState("");
  const [loginName, setLoginName] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState("");
  const [registerMode, setRegisterMode] = useState(false);
  const [filterGroup, setFilterGroup] = useState("Todos");
  const [newMatchForm, setNewMatchForm] = useState({ phase: "Round of 32", home: "", away: "" });
  const ADMIN_PASSWORD = "ironjungle2026";

  useEffect(() => { save("copa26_matches", matches); }, [matches]);
  useEffect(() => { save("copa26_players", players); }, [players]);
  useEffect(() => { save("copa26_guesses", guesses); }, [guesses]);

  const registerPlayer = () => {
    const name = newPlayerName.trim();
    const pass = newPlayerPass.trim();
    if (!name || !pass) { alert("Preencha nome e senha."); return; }
    if (pass !== newPlayerPassConfirm) { alert("As senhas não coincidem!"); return; }
    if (pass.length < 4) { alert("Senha deve ter ao menos 4 caracteres."); return; }
    if (players.find(p => p.name.toLowerCase() === name.toLowerCase())) { alert("Nome já cadastrado!"); return; }
    const p = { id: Date.now(), name, password: pass, joinedAt: new Date().toLocaleDateString("pt-BR") };
    setPlayers(prev => [...prev, p]);
    setNewPlayerName(""); setNewPlayerPass(""); setNewPlayerPassConfirm("");
    setRegisterMode(false);
    alert(`Cadastro feito! Agora faça login, ${name}.`);
  };

  const loginPlayer = () => {
    setLoginError("");
    const found = players.find(p => p.name.toLowerCase() === loginName.toLowerCase());
    if (!found) { setLoginError("Nome não encontrado."); return; }
    if (found.password !== loginPass) { setLoginError("Senha incorreta."); return; }
    setActivePlayer(found.id);
    setLoginName(""); setLoginPass("");
    setTab("palpites");
  };

  const setMatchScore = (matchId, h, a) => {
    setMatches(prev => prev.map(m => m.id === matchId ? { ...m, scoreHome: h, scoreAway: a, locked: true } : m));
  };

  const setPlayerGuess = (matchId, h, a) => {
    if (!activePlayer) return;
    setGuesses(prev => {
      const pg = prev[activePlayer] || {};
      return { ...prev, [activePlayer]: { ...pg, [matchId]: { scoreHome: h, scoreAway: a } } };
    });
  };

  const calcPlayerScore = useCallback((playerId) => {
    const pg = guesses[playerId] || {};
    let total = 0, wins = 0, goals = 0, exact = 0;
    matches.forEach(m => {
      if (m.scoreHome === null || m.scoreAway === null) return;
      const g = pg[m.id];
      if (!g) return;
      const pts = calcPoints(g, m);
      total += pts;
      if (getMatchResult(m.scoreHome, m.scoreAway) === getMatchResult(g.scoreHome, g.scoreAway)) wins++;
      if (m.scoreHome - m.scoreAway === g.scoreHome - g.scoreAway) goals++;
      if (m.scoreHome === g.scoreHome && m.scoreAway === g.scoreAway) exact++;
    });
    return { total, wins, goals, exact };
  }, [guesses, matches]);

  const ranking = players.map(p => ({ ...p, ...calcPlayerScore(p.id) }))
    .sort((a, b) => b.total - a.total || b.exact - a.exact || b.goals - a.goals);

  const groups = ["Todos", ...Object.keys(GROUPS_DATA)];
  const knockoutMatches = matches.filter(m => m.phase !== "Grupos");
  const filteredMatches = filterGroup === "Todos"
    ? matches.filter(m => m.phase === "Grupos")
    : filterGroup === "Mata-mata"
    ? knockoutMatches
    : matches.filter(m => m.group === filterGroup && m.phase === "Grupos");

  // Tabs visíveis para alunos (sem ranking)
  const playerTabs = [
    { id: "palpites", label: "🎯 Palpites" },
    { id: "jogos", label: "⚽ Jogos" },
    { id: "conta", label: "👤 Conta" },
    { id: "admin", label: "🔧 Admin" },
  ];

  const GroupFilter = () => (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
      {groups.map(g => (
        <button key={g} onClick={() => setFilterGroup(g)} style={{
          background: filterGroup === g ? "#c9a227" : "#161616",
          color: filterGroup === g ? "#111" : "#aaaaaa",
          border: "1px solid #2a2a2a", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12, fontWeight: 700
        }}>{g === "Todos" ? "Todos" : `Grupo ${g}`}</button>
      ))}
      {knockoutMatches.length > 0 && (
        <button onClick={() => setFilterGroup("Mata-mata")} style={{
          background: filterGroup === "Mata-mata" ? "#c9a227" : "#161616",
          color: filterGroup === "Mata-mata" ? "#111" : "#aaaaaa",
          border: "1px solid #2a2a2a", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12, fontWeight: 700
        }}>⚔️ Mata-mata</button>
      )}
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#e8e8e8", fontFamily: "'Segoe UI', sans-serif" }}>
      {/* HEADER */}
      <div style={{ background: "linear-gradient(180deg, #111 0%, #1a1a1a 100%)", borderBottom: "3px solid #c9a227", padding: "20px 16px 0", textAlign: "center" }}>
        <img src="/logo.png" alt="Iron Jungle" style={{ height: 72, marginBottom: 8, filter: "drop-shadow(0 2px 8px rgba(201,162,39,0.4))" }} />
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#fff", letterSpacing: 1, textTransform: "uppercase" }}>
          DESAFIO DOS <span style={{ color: "#c9a227" }}>PLACARES</span>
        </h1>
        <div style={{ fontSize: 12, color: "#666", marginBottom: 12 }}>Copa do Mundo 2026 · EUA, Canadá & México</div>
        <div style={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
          {playerTabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              background: tab === t.id ? "#c9a227" : "transparent",
              color: tab === t.id ? "#111" : "#aaaaaa",
              border: "none", padding: "8px 14px", cursor: "pointer",
              fontWeight: tab === t.id ? 900 : 600, fontSize: 13, borderRadius: "6px 6px 0 0",
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: 16 }}>

        {/* ── PALPITES ── */}
        {tab === "palpites" && (
          <div>
            {!activePlayer ? (
              <div style={{ maxWidth: 360, margin: "0 auto" }}>
                {!registerMode ? (
                  <div>
                    <div style={{ textAlign: "center", padding: "30px 0 20px" }}>
                      <div style={{ fontSize: 40, marginBottom: 8 }}>🎯</div>
                      <div style={{ color: "#aaaaaa", marginBottom: 20 }}>Faça login para enviar seus palpites</div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 12, color: "#888888", marginBottom: 4 }}>Nome</div>
                        <input value={loginName} onChange={e => { setLoginName(e.target.value); setLoginError(""); }}
                          onKeyDown={e => e.key === "Enter" && loginPlayer()}
                          placeholder="Seu nome..." style={inputStyle} />
                      </div>
                      <div>
                        <div style={{ fontSize: 12, color: "#888888", marginBottom: 4 }}>Senha</div>
                        <input type="password" value={loginPass} onChange={e => { setLoginPass(e.target.value); setLoginError(""); }}
                          onKeyDown={e => e.key === "Enter" && loginPlayer()}
                          placeholder="Sua senha..." style={inputStyle} />
                      </div>
                      {loginError && <div style={{ color: "#e05555", fontSize: 13, textAlign: "center" }}>{loginError}</div>}
                      <button onClick={loginPlayer} style={{ ...btnGold, padding: "11px", fontSize: 15, borderRadius: 8, marginTop: 4 }}>
                        Entrar
                      </button>
                      <button onClick={() => setRegisterMode(true)} style={{ background: "transparent", color: "#888888", border: "1px solid #2a2a2a", borderRadius: 8, padding: "10px", cursor: "pointer", fontSize: 13 }}>
                        Ainda não tenho cadastro
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ textAlign: "center", padding: "30px 0 20px" }}>
                      <div style={{ fontSize: 40, marginBottom: 8 }}>📝</div>
                      <div style={{ color: "#aaaaaa", marginBottom: 20 }}>Criar conta</div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 12, color: "#888888", marginBottom: 4 }}>Nome</div>
                        <input value={newPlayerName} onChange={e => setNewPlayerName(e.target.value)}
                          placeholder="Seu nome completo..." style={inputStyle} />
                      </div>
                      <div>
                        <div style={{ fontSize: 12, color: "#888888", marginBottom: 4 }}>Senha</div>
                        <input type="password" value={newPlayerPass} onChange={e => setNewPlayerPass(e.target.value)}
                          placeholder="Crie uma senha..." style={inputStyle} />
                      </div>
                      <div>
                        <div style={{ fontSize: 12, color: "#888888", marginBottom: 4 }}>Confirmar senha</div>
                        <input type="password" value={newPlayerPassConfirm} onChange={e => setNewPlayerPassConfirm(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && registerPlayer()}
                          placeholder="Repita a senha..." style={inputStyle} />
                      </div>
                      <button onClick={registerPlayer} style={{ ...btnGold, padding: "11px", fontSize: 15, borderRadius: 8, marginTop: 4 }}>
                        Criar conta
                      </button>
                      <button onClick={() => { setRegisterMode(false); setNewPlayerName(""); setNewPlayerPass(""); setNewPlayerPassConfirm(""); }}
                        style={{ background: "transparent", color: "#888888", border: "1px solid #2a2a2a", borderRadius: 8, padding: "10px", cursor: "pointer", fontSize: 13 }}>
                        Voltar ao login
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                {/* Player header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, background: "#111111", borderRadius: 10, padding: "10px 14px", border: "1px solid #2a2a2a" }}>
                  <div>
                    <div style={{ fontSize: 12, color: "#888888" }}>Logado como</div>
                    <div style={{ fontWeight: 900, fontSize: 17, color: "#c9a227" }}>
                      {players.find(p => p.id === activePlayer)?.name}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 20, fontWeight: 900, color: "#e8e8e8" }}>{calcPlayerScore(activePlayer).total}</div>
                      <div style={{ fontSize: 10, color: "#888888" }}>pontos</div>
                    </div>
                    <button onClick={() => setActivePlayer(null)} style={{ background: "#2a2a2a", color: "#aaaaaa", border: "none", borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontSize: 12 }}>Sair</button>
                  </div>
                </div>
                <GroupFilter />
                {filteredMatches.map(m => (
                  <MatchCard key={m.id} match={m} isAdmin={false} onSetScore={(id, h, a) => setPlayerGuess(id, h, a)}
                    userGuess={guesses[activePlayer]?.[m.id] || null} showResult={true} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── JOGOS ── */}
        {tab === "jogos" && (
          <div>
            <GroupFilter />
            {filteredMatches.map(m => {
              const totalGuesses = players.filter(p => guesses[p.id]?.[m.id]).length;
              return (
                <div key={m.id} style={{ background: "#161616", border: "1px solid #2a2a2a", borderRadius: 10, padding: "12px 16px", marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: "#888888", marginBottom: 6, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
                    Grupo {m.group} · {m.round} · {m.phase}
                    <span style={{ marginLeft: 8, color: "#666666" }}>· {totalGuesses} palpite(s)</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, textAlign: "right", fontWeight: 700, fontSize: 15, color: "#e8e8e8" }}>{FLAGS[m.home] || "🏳"} {m.home}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {m.scoreHome !== null
                        ? <><ScoreBadge score={m.scoreHome} color="#c9a227" /><span style={{ color: "#888888" }}>×</span><ScoreBadge score={m.scoreAway} color="#c9a227" /></>
                        : <span style={{ color: "#555555", fontSize: 12, fontStyle: "italic" }}>Aguardando</span>}
                    </div>
                    <div style={{ flex: 1, fontWeight: 700, fontSize: 15, color: "#e8e8e8" }}>{FLAGS[m.away] || "🏳"} {m.away}</div>
                  </div>
                  {m.scoreHome !== null && (
                    <div style={{ marginTop: 8, fontSize: 12, color: "#888888" }}>
                      {(() => {
                        let exact = 0, goal = 0, win = 0;
                        players.forEach(p => {
                          const g = guesses[p.id]?.[m.id];
                          if (!g) return;
                          if (m.scoreHome === g.scoreHome && m.scoreAway === g.scoreAway) exact++;
                          else if (m.scoreHome - m.scoreAway === g.scoreHome - g.scoreAway) goal++;
                          else if (getMatchResult(m.scoreHome, m.scoreAway) === getMatchResult(g.scoreHome, g.scoreAway)) win++;
                        });
                        return `🎯 ${exact} exato · 〜 ${goal} saldo · ✓ ${win} resultado · ✗ ${totalGuesses - exact - goal - win} erros`;
                      })()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── CONTA ── */}
        {tab === "conta" && (
          <div>
            {!activePlayer ? (
              <div style={{ textAlign: "center", padding: 40, color: "#555555" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>👤</div>
                <div>Faça login na aba Palpites para ver sua conta.</div>
              </div>
            ) : (
              <div>
                {(() => {
                  const p = players.find(x => x.id === activePlayer);
                  const score = calcPlayerScore(activePlayer);
                  const pos = ranking.findIndex(r => r.id === activePlayer) + 1;
                  const totalFinished = matches.filter(m => m.scoreHome !== null).length;
                  const totalGuessed = Object.keys(guesses[activePlayer] || {}).length;
                  return (
                    <div>
                      <div style={{ background: "linear-gradient(135deg, #1a2a00, #0d2a1a)", border: "1px solid #c9a227", borderRadius: 12, padding: 20, marginBottom: 16, textAlign: "center" }}>
                        <div style={{ fontSize: 48, marginBottom: 4 }}>🏆</div>
                        <div style={{ fontSize: 22, fontWeight: 900, color: "#c9a227" }}>{p?.name}</div>
                        <div style={{ fontSize: 13, color: "#888888", marginTop: 2 }}>Cadastrado em {p?.joinedAt}</div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                        {[
                          { label: "Posição atual", value: `${pos}º lugar`, color: "#c9a227" },
                          { label: "Total de pontos", value: `${score.total} pts`, color: "#c9a227" },
                          { label: "Palpites enviados", value: `${totalGuessed}/${matches.length}`, color: "#c9a227" },
                          { label: "Jogos finalizados", value: `${totalFinished}`, color: "#e8e8e8" },
                          { label: "Resultados certos", value: score.wins, color: "#aaaaaa" },
                          { label: "Placares exatos", value: score.exact, color: "#c9a227" },
                        ].map(({ label, value, color }) => (
                          <div key={label} style={{ background: "#161616", border: "1px solid #2a2a2a", borderRadius: 10, padding: "12px 14px" }}>
                            <div style={{ fontSize: 11, color: "#888888", marginBottom: 4 }}>{label}</div>
                            <div style={{ fontSize: 20, fontWeight: 900, color }}>{value}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ background: "#111111", border: "1px solid #2a2a2a", borderRadius: 10, padding: 14 }}>
                        <div style={{ fontWeight: 700, marginBottom: 8, color: "#c9a227", fontSize: 13 }}>📋 Sistema de Pontuação</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, color: "#aaaaaa" }}>
                          <div>✓ Acertar <strong style={{ color: "#e8e8e8" }}>vencedor</strong> → <strong style={{ color: "#c9a227" }}>1 ponto</strong></div>
                          <div>〜 Acertar <strong style={{ color: "#e8e8e8" }}>saldo de gols</strong> → <strong style={{ color: "#c9a227" }}>3 pontos</strong></div>
                          <div>🎯 Acertar <strong style={{ color: "#e8e8e8" }}>placar exato</strong> → <strong style={{ color: "#c9a227" }}>5 pontos</strong></div>
                        </div>
                      </div>
                      <button onClick={() => setActivePlayer(null)} style={{ marginTop: 16, width: "100%", background: "#2d1a1a", color: "#aa6a6a", border: "1px solid #4a2a2a", borderRadius: 8, padding: "10px", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
                        Sair da conta
                      </button>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* ── ADMIN ── */}
        {tab === "admin" && (
          <div>
            {!adminMode ? (
              <div style={{ textAlign: "center", padding: 40 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔐</div>
                <div style={{ color: "#aaaaaa", marginBottom: 20 }}>Área exclusiva para administradores</div>
                {!showPassInput ? (
                  <button onClick={() => setShowPassInput(true)} style={btnGold}>Entrar como Admin</button>
                ) : (
                  <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                    <input type="password" value={adminPass} onChange={e => setAdminPass(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") { if (adminPass === ADMIN_PASSWORD) { setAdminMode(true); setAdminPass(""); setShowPassInput(false); } else alert("Senha incorreta!"); }}}
                      placeholder="Senha admin..." style={{ background: "#0a0a0a", border: "1px solid #2a2a2a", color: "#e8e8e8", borderRadius: 6, padding: "10px 14px", fontSize: 14 }} />
                    <button onClick={() => { if (adminPass === ADMIN_PASSWORD) { setAdminMode(true); setAdminPass(""); setShowPassInput(false); } else alert("Senha incorreta!"); }} style={btnGold}>Entrar</button>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ fontWeight: 900, color: "#c9a227", fontSize: 16 }}>🔧 Painel Admin</div>
                  <button onClick={() => setAdminMode(false)} style={{ background: "#2d1a1a", color: "#aa6a6a", border: "none", borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 12 }}>Sair</button>
                </div>

                {/* RANKING - só visível para admin */}
                <div style={{ background: "#111111", border: "1px solid #2a2a2a", borderRadius: 10, padding: 14, marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, color: "#c9a227", marginBottom: 12, fontSize: 14 }}>🏆 Ranking Atual</div>
                  {ranking.length === 0 ? (
                    <div style={{ color: "#555555", fontSize: 13 }}>Nenhum aluno cadastrado ainda.</div>
                  ) : ranking.map((p, i) => (
                    <div key={p.id} style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", marginBottom: 6,
                      background: "#161616", borderRadius: 8,
                      border: `1px solid ${i === 0 ? "#c9a227" : i === 1 ? "#888" : i === 2 ? "#cd7f32" : "#2a2a2a"}`
                    }}>
                      <div style={{ fontWeight: 900, minWidth: 28, color: i === 0 ? "#c9a227" : i === 1 ? "#ccc" : i === 2 ? "#cd7f32" : "#888888" }}>
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i+1}º`}
                      </div>
                      <div style={{ flex: 1, fontWeight: 700, fontSize: 14 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: "#888888" }}>🎯{p.exact} · ✓{p.wins}</div>
                      <div style={{ fontWeight: 900, color: i === 0 ? "#c9a227" : "#e8e8e8", fontSize: 16 }}>{p.total}pts</div>
                    </div>
                  ))}
                </div>

                {/* ALUNOS CADASTRADOS */}
                <div style={{ background: "#111111", border: "1px solid #2a2a2a", borderRadius: 10, padding: 14, marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, color: "#c9a227", marginBottom: 12, fontSize: 14 }}>👤 Alunos Cadastrados ({players.length})</div>
                  {players.length === 0 ? (
                    <div style={{ color: "#555555", fontSize: 13 }}>Nenhum aluno cadastrado ainda.</div>
                  ) : players.map(p => (
                    <div key={p.id} style={{ background: "#161616", border: "1px solid #2a2a2a", borderRadius: 8, padding: "10px 14px", marginBottom: 6, display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ flex: 1, fontWeight: 700 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: "#888888" }}>{p.joinedAt}</div>
                      <button onClick={() => { if (window.confirm(`Remover ${p.name}?`)) setPlayers(prev => prev.filter(x => x.id !== p.id)); }}
                        style={{ background: "transparent", color: "#6a4a4a", border: "none", cursor: "pointer", fontSize: 18 }}>×</button>
                    </div>
                  ))}
                </div>

                {/* Criar jogo mata-mata */}
                <div style={{ background: "#111111", border: "1px solid #2a2a2a", borderRadius: 10, padding: 16, marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, color: "#c9a227", marginBottom: 10 }}>➕ Criar Jogo (Mata-mata)</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <select value={newMatchForm.phase} onChange={e => setNewMatchForm(p => ({ ...p, phase: e.target.value }))}
                      style={{ background: "#0a0a0a", border: "1px solid #2a2a2a", color: "#e8e8e8", borderRadius: 6, padding: "8px 12px" }}>
                      {["Round of 32", "Oitavas", "Quartas", "Semifinal", "Terceiro Lugar", "Final"].map(ph => (
                        <option key={ph} value={ph}>{ph}</option>
                      ))}
                    </select>
                    <input value={newMatchForm.home} onChange={e => setNewMatchForm(p => ({ ...p, home: e.target.value }))}
                      placeholder="Time da casa..." style={{ background: "#0a0a0a", border: "1px solid #2a2a2a", color: "#e8e8e8", borderRadius: 6, padding: "8px 12px" }} />
                    <input value={newMatchForm.away} onChange={e => setNewMatchForm(p => ({ ...p, away: e.target.value }))}
                      placeholder="Time visitante..." style={{ background: "#0a0a0a", border: "1px solid #2a2a2a", color: "#e8e8e8", borderRadius: 6, padding: "8px 12px" }} />
                    <button onClick={() => {
                      if (!newMatchForm.home || !newMatchForm.away) return;
                      const newM = { id: Date.now(), group: "MM", round: newMatchForm.phase, phase: newMatchForm.phase, home: newMatchForm.home, away: newMatchForm.away, scoreHome: null, scoreAway: null, locked: false };
                      setMatches(prev => [...prev, newM]);
                      setNewMatchForm(p => ({ ...p, home: "", away: "" }));
                    }} style={btnGold}>Criar Jogo</button>
                  </div>
                </div>

                {/* Inserir placares */}
                <div style={{ fontWeight: 700, color: "#aaaaaa", fontSize: 12, marginBottom: 8, letterSpacing: 1 }}>INSERIR PLACARES</div>
                <GroupFilter />
                {filteredMatches.map(m => (
                  <MatchCard key={m.id} match={m} isAdmin={true} onSetScore={setMatchScore} userGuess={null} showResult={false} />
                ))}

                <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid #161616" }}>
                  <button onClick={() => { if (window.confirm("Resetar TUDO? Isso apaga todos os dados!")) { setMatches(INITIAL_MATCHES); setPlayers([]); setGuesses({}); setActivePlayer(null); }}}
                    style={{ background: "#2d1a1a", color: "#aa6a6a", border: "1px solid #4a2a2a", borderRadius: 6, padding: "8px 16px", cursor: "pointer", fontSize: 13 }}>
                    🗑️ Resetar todos os dados
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
