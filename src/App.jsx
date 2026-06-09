import { useState, useEffect, useCallback } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, onSnapshot, collection, getDocs } from "firebase/firestore";

// ─── FIREBASE ────────────────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey: "AIzaSyCTZwBYIYmNTYTNJNX3tk8yqvipN3mEq44",
  authDomain: "copa-desafio.firebaseapp.com",
  projectId: "copa-desafio",
  storageBucket: "copa-desafio.firebasestorage.app",
  messagingSenderId: "434541744853",
  appId: "1:434541744853:web:db934f4da5ae01a04a885c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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
  "México": "mx", "África do Sul": "za", "Coreia do Sul": "kr", "Rep. Tcheca": "cz",
  "Canadá": "ca", "Bósnia": "ba", "Catar": "qa", "Suíça": "ch",
  "Brasil": "br", "Marrocos": "ma", "Haiti": "ht", "Escócia": "gb-sct",
  "EUA": "us", "Paraguai": "py", "Austrália": "au", "Turquia": "tr",
  "Alemanha": "de", "Curaçao": "cw", "Costa do Marfim": "ci", "Equador": "ec",
  "Holanda": "nl", "Japão": "jp", "Suécia": "se", "Tunísia": "tn",
  "Bélgica": "be", "Egito": "eg", "Irã": "ir", "Nova Zelândia": "nz",
  "Espanha": "es", "Cabo Verde": "cv", "Arábia Saudita": "sa", "Uruguai": "uy",
  "França": "fr", "Senegal": "sn", "Iraque": "iq", "Noruega": "no",
  "Argentina": "ar", "Argélia": "dz", "Áustria": "at", "Jordânia": "jo",
  "Portugal": "pt", "RD Congo": "cd", "Uzbequistão": "uz", "Colômbia": "co",
  "Inglaterra": "gb-eng", "Croácia": "hr", "Gana": "gh", "Panamá": "pa",
};

function Flag({ country }) {
  const code = FLAGS[country];
  if (!code) return null;
  return <img src={`https://flagcdn.com/24x18/${code}.png`} alt={country} style={{ width: 24, height: 18, borderRadius: 2, objectFit: "cover", flexShrink: 0 }} />;
}

function generateGroupMatches() {
  const matches = [];
  let id = 1;
  const rounds = ["1ª Rodada", "1ª Rodada", "2ª Rodada", "2ª Rodada", "3ª Rodada", "3ª Rodada"];
  Object.entries(GROUPS_DATA).forEach(([group, teams]) => {
    const [t1, t2, t3, t4] = teams;
    const pairs = [[t1,t2],[t3,t4],[t1,t3],[t2,t4],[t1,t4],[t2,t3]];
    pairs.forEach(([home, away], i) => {
      matches.push({ id: id++, group, round: rounds[i], phase: "Grupos", home, away, scoreHome: null, scoreAway: null });
    });
  });
  return matches;
}

const INITIAL_MATCHES = generateGroupMatches();

// ─── SCORING ─────────────────────────────────────────────────────────────────

function getMatchResult(h, a) {
  if (h === null || a === null) return null;
  if (h > a) return "home";
  if (a > h) return "away";
  return "draw";
}

function calcPoints(guess, match) {
  if (match.scoreHome === null || match.scoreAway === null) return 0;
  let pts = 0;
  if (getMatchResult(guess.scoreHome, guess.scoreAway) === getMatchResult(match.scoreHome, match.scoreAway)) pts += 1;
  if (match.scoreHome + match.scoreAway === guess.scoreHome + guess.scoreAway) pts += 3;
  if (match.scoreHome === guess.scoreHome && match.scoreAway === guess.scoreAway) pts += 5;
  return pts;
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const inputSm = { width: 44, textAlign: "center", background: "#111", border: "1px solid #2a2a2a", color: "#e8e8e8", borderRadius: 6, padding: "6px 4px", fontSize: 16, fontWeight: 700 };
const btnGold = { background: "#c9a227", color: "#111", border: "none", borderRadius: 6, padding: "7px 14px", fontWeight: 700, cursor: "pointer", fontSize: 13 };
const btnSmall = { background: "#1a1a1a", color: "#e8e8e8", border: "1px solid #2a2a2a", borderRadius: 6, padding: "7px 12px", fontWeight: 700, cursor: "pointer", fontSize: 13 };
const inputStyle = { background: "#0a0a0a", border: "1px solid #2a2a2a", color: "#e8e8e8", borderRadius: 6, padding: "10px 12px", fontSize: 14, width: "100%", boxSizing: "border-box" };

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

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
        <div style={{ position: "absolute", top: 8, right: 10, background: pts > 0 ? "#c9a227" : "#222", color: pts > 0 ? "#111" : "#666", fontWeight: 900, fontSize: 12, borderRadius: 20, padding: "2px 10px" }}>
          {pts > 0 ? `+${pts} pts` : "0 pts"}
        </div>
      )}
      <div style={{ fontSize: 11, color: "#555", marginBottom: 6, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
        {match.phase === "Grupos" ? `Grupo ${match.group} · ${match.round}` : match.phase}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div style={{ flex: 1, textAlign: "right", fontWeight: 700, fontSize: 15, color: "#e8e8e8" }}><Flag country={match.home} /> {match.home}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          {hasScore
            ? <><ScoreBadge score={match.scoreHome} color="#c9a227" /><span style={{ color: "#444" }}>×</span><ScoreBadge score={match.scoreAway} color="#c9a227" /></>
            : <span style={{ color: "#444", fontSize: 13, fontStyle: "italic" }}>Aguardando</span>}
        </div>
        <div style={{ flex: 1, textAlign: "left", fontWeight: 700, fontSize: 15, color: "#e8e8e8" }}><Flag country={match.away} /> {match.away}</div>
      </div>

      {isAdmin && !hasScore && (
        <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>
          <input type="number" min="0" max="20" value={h} onChange={e => setH(e.target.value)} placeholder="Casa" style={inputSm} />
          <span style={{ color: "#555" }}>×</span>
          <input type="number" min="0" max="20" value={a} onChange={e => setA(e.target.value)} placeholder="Fora" style={inputSm} />
          <button onClick={() => { if (h !== "" && a !== "") { onSetScore(match.id, parseInt(h), parseInt(a)); setH(""); setA(""); }}} style={btnGold}>✓ Confirmar</button>
        </div>
      )}

      {!isAdmin && !hasScore && !userGuess && (
        <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>
          <span style={{ color: "#888", fontSize: 12 }}>Seu palpite:</span>
          <input type="number" min="0" max="20" value={guessH} onChange={e => setGuessH(e.target.value)} placeholder="?" style={inputSm} />
          <span style={{ color: "#555" }}>×</span>
          <input type="number" min="0" max="20" value={guessA} onChange={e => setGuessA(e.target.value)} placeholder="?" style={inputSm} />
          <button onClick={() => { if (guessH !== "" && guessA !== "") { onSetScore(match.id, parseInt(guessH), parseInt(guessA)); setGuessH(""); setGuessA(""); }}} style={btnSmall}>Enviar</button>
        </div>
      )}

      {!isAdmin && userGuess && (
        <div style={{ marginTop: 8, textAlign: "center", color: "#888", fontSize: 12 }}>
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
  const [matches, setMatches] = useState(INITIAL_MATCHES);
  const [players, setPlayers] = useState([]);
  const [guesses, setGuesses] = useState({});
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
  const [loading, setLoading] = useState(true);
  const ADMIN_PASSWORD = "ironjungle2026";

  // ── Firebase listeners ──
  useEffect(() => {
    // Listen to matches
    const unsubMatches = onSnapshot(doc(db, "data", "matches"), snap => {
      if (snap.exists()) setMatches(snap.data().list || INITIAL_MATCHES);
      else setMatches(INITIAL_MATCHES);
      setLoading(false);
    });
    // Listen to players
    const unsubPlayers = onSnapshot(doc(db, "data", "players"), snap => {
      if (snap.exists()) setPlayers(snap.data().list || []);
    });
    // Listen to guesses
    const unsubGuesses = onSnapshot(doc(db, "data", "guesses"), snap => {
      if (snap.exists()) setGuesses(snap.data().map || {});
    });
    return () => { unsubMatches(); unsubPlayers(); unsubGuesses(); };
  }, []);

  const saveMatches = async (list) => {
    setMatches(list);
    await setDoc(doc(db, "data", "matches"), { list });
  };
  const savePlayers = async (list) => {
    setPlayers(list);
    await setDoc(doc(db, "data", "players"), { list });
  };
  const saveGuesses = async (map) => {
    setGuesses(map);
    await setDoc(doc(db, "data", "guesses"), { map });
  };

  const registerPlayer = async () => {
    const name = newPlayerName.trim();
    const pass = newPlayerPass.trim();
    if (!name || !pass) { alert("Preencha nome e senha."); return; }
    if (pass !== newPlayerPassConfirm) { alert("As senhas não coincidem!"); return; }
    if (pass.length < 4) { alert("Senha deve ter ao menos 4 caracteres."); return; }
    if (players.find(p => p.name.toLowerCase() === name.toLowerCase())) { alert("Nome já cadastrado!"); return; }
    const p = { id: Date.now(), name, password: pass, joinedAt: new Date().toLocaleDateString("pt-BR") };
    await savePlayers([...players, p]);
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

  const setMatchScore = async (matchId, h, a) => {
    const updated = matches.map(m => m.id === matchId ? { ...m, scoreHome: h, scoreAway: a } : m);
    await saveMatches(updated);
  };

  const setPlayerGuess = async (matchId, h, a) => {
    if (!activePlayer) return;
    const updated = { ...guesses, [activePlayer]: { ...(guesses[activePlayer] || {}), [matchId]: { scoreHome: h, scoreAway: a } } };
    await saveGuesses(updated);
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
  const filteredMatches = filterGroup === "Todos" ? matches.filter(m => m.phase === "Grupos")
    : filterGroup === "Mata-mata" ? knockoutMatches
    : matches.filter(m => m.group === filterGroup && m.phase === "Grupos");

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
          color: filterGroup === g ? "#111" : "#888",
          border: "1px solid #2a2a2a", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12, fontWeight: 700
        }}>{g === "Todos" ? "Todos" : `Grupo ${g}`}</button>
      ))}
      {knockoutMatches.length > 0 && (
        <button onClick={() => setFilterGroup("Mata-mata")} style={{
          background: filterGroup === "Mata-mata" ? "#c9a227" : "#161616",
          color: filterGroup === "Mata-mata" ? "#111" : "#888",
          border: "1px solid #2a2a2a", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12, fontWeight: 700
        }}>⚔️ Mata-mata</button>
      )}
    </div>
  );

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
      <img src="/logo.png" alt="Iron Jungle" style={{ height: 80, opacity: 0.8 }} />
      <div style={{ color: "#c9a227", fontWeight: 700, letterSpacing: 2 }}>CARREGANDO...</div>
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
        <div style={{ fontSize: 12, color: "#555", marginBottom: 12 }}>Copa do Mundo 2026 · EUA, Canadá & México</div>
        <div style={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
          {playerTabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              background: tab === t.id ? "#c9a227" : "transparent",
              color: tab === t.id ? "#111" : "#666",
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
                      <div style={{ color: "#888", marginBottom: 20 }}>Faça login para enviar seus palpites</div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <div><div style={{ fontSize: 12, color: "#555", marginBottom: 4 }}>Nome</div>
                        <input value={loginName} onChange={e => { setLoginName(e.target.value); setLoginError(""); }} onKeyDown={e => e.key === "Enter" && loginPlayer()} placeholder="Seu nome..." style={inputStyle} /></div>
                      <div><div style={{ fontSize: 12, color: "#555", marginBottom: 4 }}>Senha</div>
                        <input type="password" value={loginPass} onChange={e => { setLoginPass(e.target.value); setLoginError(""); }} onKeyDown={e => e.key === "Enter" && loginPlayer()} placeholder="Sua senha..." style={inputStyle} /></div>
                      {loginError && <div style={{ color: "#e05555", fontSize: 13, textAlign: "center" }}>{loginError}</div>}
                      <button onClick={loginPlayer} style={{ ...btnGold, padding: "11px", fontSize: 15, borderRadius: 8, marginTop: 4 }}>Entrar</button>
                      <button onClick={() => setRegisterMode(true)} style={{ background: "transparent", color: "#555", border: "1px solid #2a2a2a", borderRadius: 8, padding: "10px", cursor: "pointer", fontSize: 13 }}>Ainda não tenho cadastro</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ textAlign: "center", padding: "30px 0 20px" }}>
                      <div style={{ fontSize: 40, marginBottom: 8 }}>📝</div>
                      <div style={{ color: "#888", marginBottom: 20 }}>Criar conta</div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <div><div style={{ fontSize: 12, color: "#555", marginBottom: 4 }}>Nome</div>
                        <input value={newPlayerName} onChange={e => setNewPlayerName(e.target.value)} placeholder="Seu nome completo..." style={inputStyle} /></div>
                      <div><div style={{ fontSize: 12, color: "#555", marginBottom: 4 }}>Senha</div>
                        <input type="password" value={newPlayerPass} onChange={e => setNewPlayerPass(e.target.value)} placeholder="Crie uma senha..." style={inputStyle} /></div>
                      <div><div style={{ fontSize: 12, color: "#555", marginBottom: 4 }}>Confirmar senha</div>
                        <input type="password" value={newPlayerPassConfirm} onChange={e => setNewPlayerPassConfirm(e.target.value)} onKeyDown={e => e.key === "Enter" && registerPlayer()} placeholder="Repita a senha..." style={inputStyle} /></div>
                      <button onClick={registerPlayer} style={{ ...btnGold, padding: "11px", fontSize: 15, borderRadius: 8, marginTop: 4 }}>Criar conta</button>
                      <button onClick={() => { setRegisterMode(false); setNewPlayerName(""); setNewPlayerPass(""); setNewPlayerPassConfirm(""); }}
                        style={{ background: "transparent", color: "#555", border: "1px solid #2a2a2a", borderRadius: 8, padding: "10px", cursor: "pointer", fontSize: 13 }}>Voltar ao login</button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, background: "#111", borderRadius: 10, padding: "10px 14px", border: "1px solid #2a2a2a" }}>
                  <div>
                    <div style={{ fontSize: 12, color: "#555" }}>Logado como</div>
                    <div style={{ fontWeight: 900, fontSize: 17, color: "#c9a227" }}>{players.find(p => p.id === activePlayer)?.name}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 20, fontWeight: 900 }}>{calcPlayerScore(activePlayer).total}</div>
                      <div style={{ fontSize: 10, color: "#555" }}>pontos</div>
                    </div>
                    <button onClick={() => setActivePlayer(null)} style={{ background: "#222", color: "#888", border: "none", borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontSize: 12 }}>Sair</button>
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
                  <div style={{ fontSize: 11, color: "#555", marginBottom: 6, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
                    {m.phase === "Grupos" ? `Grupo ${m.group} · ${m.round}` : m.phase}
                    <span style={{ marginLeft: 8 }}>· {totalGuesses} palpite(s)</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, textAlign: "right", fontWeight: 700, fontSize: 15 }}><Flag country={m.home} /> {m.home}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {m.scoreHome !== null
                        ? <><ScoreBadge score={m.scoreHome} color="#c9a227" /><span style={{ color: "#444" }}>×</span><ScoreBadge score={m.scoreAway} color="#c9a227" /></>
                        : <span style={{ color: "#444", fontSize: 12, fontStyle: "italic" }}>Aguardando</span>}
                    </div>
                    <div style={{ flex: 1, fontWeight: 700, fontSize: 15 }}><Flag country={m.away} /> {m.away}</div>
                  </div>
                  {m.scoreHome !== null && (() => {
                    let exact = 0, goal = 0, win = 0;
                    players.forEach(p => {
                      const g = guesses[p.id]?.[m.id];
                      if (!g) return;
                      if (m.scoreHome === g.scoreHome && m.scoreAway === g.scoreAway) exact++;
                      else if (m.scoreHome - m.scoreAway === g.scoreHome - g.scoreAway) goal++;
                      else if (getMatchResult(m.scoreHome, m.scoreAway) === getMatchResult(g.scoreHome, g.scoreAway)) win++;
                    });
                    return <div style={{ marginTop: 8, fontSize: 12, color: "#555" }}>🎯 {exact} exato · 〜 {goal} saldo · ✓ {win} resultado · ✗ {totalGuesses - exact - goal - win} erros</div>;
                  })()}
                </div>
              );
            })}
          </div>
        )}

        {/* ── CONTA ── */}
        {tab === "conta" && (
          <div>
            {!activePlayer ? (
              <div style={{ textAlign: "center", padding: 40, color: "#444" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>👤</div>
                <div>Faça login na aba Palpites para ver sua conta.</div>
              </div>
            ) : (() => {
              const p = players.find(x => x.id === activePlayer);
              const score = calcPlayerScore(activePlayer);
              const pos = ranking.findIndex(r => r.id === activePlayer) + 1;
              return (
                <div>
                  <div style={{ background: "linear-gradient(135deg, #1a1000, #0a0a0a)", border: "1px solid #c9a227", borderRadius: 12, padding: 20, marginBottom: 16, textAlign: "center" }}>
                    <img src="/logo.png" alt="Iron Jungle" style={{ height: 56, marginBottom: 8, opacity: 0.9 }} />
                    <div style={{ fontSize: 22, fontWeight: 900, color: "#c9a227" }}>{p?.name}</div>
                    <div style={{ fontSize: 13, color: "#555", marginTop: 2 }}>Cadastrado em {p?.joinedAt}</div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                    {[
                      { label: "Posição atual", value: `${pos}º lugar`, color: "#c9a227" },
                      { label: "Total de pontos", value: `${score.total} pts`, color: "#e8e8e8" },
                      { label: "Palpites enviados", value: `${Object.keys(guesses[activePlayer] || {}).length}/${matches.length}`, color: "#888" },
                      { label: "Jogos finalizados", value: matches.filter(m => m.scoreHome !== null).length, color: "#888" },
                      { label: "Resultados certos", value: score.wins, color: "#888" },
                      { label: "Placares exatos", value: score.exact, color: "#c9a227" },
                    ].map(({ label, value, color }) => (
                      <div key={label} style={{ background: "#161616", border: "1px solid #2a2a2a", borderRadius: 10, padding: "12px 14px" }}>
                        <div style={{ fontSize: 11, color: "#555", marginBottom: 4 }}>{label}</div>
                        <div style={{ fontSize: 20, fontWeight: 900, color }}>{value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: "#111", border: "1px solid #2a2a2a", borderRadius: 10, padding: 14, marginBottom: 12 }}>
                    <div style={{ fontWeight: 700, marginBottom: 8, color: "#c9a227", fontSize: 13 }}>📋 Sistema de Pontuação</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, color: "#888" }}>
                      <div>✓ Acertar <strong style={{ color: "#e8e8e8" }}>vencedor</strong> → <strong style={{ color: "#c9a227" }}>1 ponto</strong></div>
                      <div>〜 Acertar <strong style={{ color: "#e8e8e8" }}>total de gols</strong> → <strong style={{ color: "#c9a227" }}>3 pontos</strong></div>
                      <div>🎯 Acertar <strong style={{ color: "#e8e8e8" }}>placar exato</strong> → <strong style={{ color: "#c9a227" }}>5 pontos</strong></div>
                    </div>
                  </div>
                  <button onClick={() => setActivePlayer(null)} style={{ width: "100%", background: "#1a0a0a", color: "#aa6a6a", border: "1px solid #3a1a1a", borderRadius: 8, padding: "10px", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
                    Sair da conta
                  </button>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── ADMIN ── */}
        {tab === "admin" && (
          <div>
            {!adminMode ? (
              <div style={{ textAlign: "center", padding: 40 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔐</div>
                <div style={{ color: "#888", marginBottom: 20 }}>Área exclusiva para administradores</div>
                {!showPassInput
                  ? <button onClick={() => setShowPassInput(true)} style={btnGold}>Entrar como Admin</button>
                  : <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                      <input type="password" value={adminPass} onChange={e => setAdminPass(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") { if (adminPass === ADMIN_PASSWORD) { setAdminMode(true); setAdminPass(""); setShowPassInput(false); } else alert("Senha incorreta!"); }}}
                        placeholder="Senha admin..." style={{ background: "#0a0a0a", border: "1px solid #2a2a2a", color: "#e8e8e8", borderRadius: 6, padding: "10px 14px", fontSize: 14 }} />
                      <button onClick={() => { if (adminPass === ADMIN_PASSWORD) { setAdminMode(true); setAdminPass(""); setShowPassInput(false); } else alert("Senha incorreta!"); }} style={btnGold}>Entrar</button>
                    </div>}
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ fontWeight: 900, color: "#c9a227", fontSize: 16 }}>🔧 Painel Admin</div>
                  <button onClick={() => setAdminMode(false)} style={{ background: "#1a0a0a", color: "#aa6a6a", border: "none", borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 12 }}>Sair</button>
                </div>

                {/* Ranking */}
                <div style={{ background: "#111", border: "1px solid #2a2a2a", borderRadius: 10, padding: 14, marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, color: "#c9a227", marginBottom: 12, fontSize: 14 }}>🏆 Ranking Atual</div>
                  {ranking.length === 0
                    ? <div style={{ color: "#444", fontSize: 13 }}>Nenhum aluno cadastrado ainda.</div>
                    : ranking.map((p, i) => (
                      <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", marginBottom: 6, background: "#161616", borderRadius: 8, border: `1px solid ${i === 0 ? "#c9a227" : i === 1 ? "#888" : i === 2 ? "#cd7f32" : "#2a2a2a"}` }}>
                        <div style={{ fontWeight: 900, minWidth: 28, color: i === 0 ? "#c9a227" : i === 1 ? "#ccc" : i === 2 ? "#cd7f32" : "#555" }}>
                          {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i+1}º`}
                        </div>
                        <div style={{ flex: 1, fontWeight: 700, fontSize: 14 }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: "#555" }}>🎯{p.exact} · ✓{p.wins}</div>
                        <div style={{ fontWeight: 900, color: i === 0 ? "#c9a227" : "#e8e8e8", fontSize: 16 }}>{p.total}pts</div>
                      </div>
                    ))}
                </div>

                {/* Alunos */}
                <div style={{ background: "#111", border: "1px solid #2a2a2a", borderRadius: 10, padding: 14, marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, color: "#c9a227", marginBottom: 12, fontSize: 14 }}>👤 Alunos Cadastrados ({players.length})</div>
                  {players.length === 0
                    ? <div style={{ color: "#444", fontSize: 13 }}>Nenhum aluno cadastrado ainda.</div>
                    : players.map(p => (
                      <div key={p.id} style={{ background: "#161616", border: "1px solid #2a2a2a", borderRadius: 8, padding: "10px 14px", marginBottom: 6, display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ flex: 1, fontWeight: 700 }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: "#555" }}>{p.joinedAt}</div>
                        <button onClick={() => { if (window.confirm(`Remover ${p.name}?`)) savePlayers(players.filter(x => x.id !== p.id)); }}
                          style={{ background: "transparent", color: "#6a2a2a", border: "none", cursor: "pointer", fontSize: 18 }}>×</button>
                      </div>
                    ))}
                </div>

                {/* Criar jogo mata-mata */}
                <div style={{ background: "#111", border: "1px solid #2a2a2a", borderRadius: 10, padding: 16, marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, color: "#c9a227", marginBottom: 10 }}>➕ Criar Jogo (Mata-mata)</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <select value={newMatchForm.phase} onChange={e => setNewMatchForm(p => ({ ...p, phase: e.target.value }))}
                      style={{ background: "#0a0a0a", border: "1px solid #2a2a2a", color: "#e8e8e8", borderRadius: 6, padding: "8px 12px" }}>
                      {["Round of 32", "Oitavas", "Quartas", "Semifinal", "Terceiro Lugar", "Final"].map(ph => <option key={ph} value={ph}>{ph}</option>)}
                    </select>
                    <input value={newMatchForm.home} onChange={e => setNewMatchForm(p => ({ ...p, home: e.target.value }))} placeholder="Time da casa..." style={{ background: "#0a0a0a", border: "1px solid #2a2a2a", color: "#e8e8e8", borderRadius: 6, padding: "8px 12px" }} />
                    <input value={newMatchForm.away} onChange={e => setNewMatchForm(p => ({ ...p, away: e.target.value }))} placeholder="Time visitante..." style={{ background: "#0a0a0a", border: "1px solid #2a2a2a", color: "#e8e8e8", borderRadius: 6, padding: "8px 12px" }} />
                    <button onClick={async () => {
                      if (!newMatchForm.home || !newMatchForm.away) return;
                      const newM = { id: Date.now(), group: "MM", round: newMatchForm.phase, phase: newMatchForm.phase, home: newMatchForm.home, away: newMatchForm.away, scoreHome: null, scoreAway: null };
                      await saveMatches([...matches, newM]);
                      setNewMatchForm(p => ({ ...p, home: "", away: "" }));
                    }} style={btnGold}>Criar Jogo</button>
                  </div>
                </div>

                {/* Inserir placares */}
                <div style={{ fontWeight: 700, color: "#555", fontSize: 12, marginBottom: 8, letterSpacing: 1 }}>INSERIR PLACARES</div>
                <GroupFilter />
                {filteredMatches.map(m => (
                  <MatchCard key={m.id} match={m} isAdmin={true} onSetScore={setMatchScore} userGuess={null} showResult={false} />
                ))}

                <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid #1a1a1a" }}>
                  <button onClick={async () => { if (window.confirm("Resetar TUDO? Isso apaga todos os dados!")) { await saveMatches(INITIAL_MATCHES); await savePlayers([]); await saveGuesses({}); setActivePlayer(null); }}}
                    style={{ background: "#1a0a0a", color: "#aa6a6a", border: "1px solid #3a1a1a", borderRadius: 6, padding: "8px 16px", cursor: "pointer", fontSize: 13 }}>
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
