import { useState, useEffect, useRef, useCallback } from "react";

// ── Welt-Events: KI-Disruption eskaliert ───────────────────────
const WORLD_EVENTS = [
  { text: "KI schreibt jetzt 80% des Codes. Programmierer fragen sich: Was ist meine neue Rolle?", icon: "🤖", phase: "Schock" },
  { text: "Ein Solo-Entwickler hat mit KI in 3 Tagen eine App gebaut — 100k€ im ersten Monat.", icon: "💰", phase: "Möglichkeit" },
  { text: "Große Tech-Firmen entlassen ihre Dev-Teams. Nur noch 'AI Orchestrators' werden gesucht.", icon: "📉", phase: "Disruption" },
  { text: "Nutzer sind übersättigt. Der App Store hat 5 Millionen Apps. Alle gleich. Alle langweilig.", icon: "😴", phase: "Übersättigung" },
  { text: "KI kann alles BAUEN — aber nicht wissen WAS gebaut werden soll. Das ist der Vorteil des Menschen.", icon: "💡", phase: "Erkenntnis" },
  { text: "Die reichsten Nischen: Handwerker, Ärzte, Juristen, Landwirte — alle schlecht digitalisiert.", icon: "🔧", phase: "Nischen" },
  { text: "Menschen zahlen nicht für Code. Sie zahlen für gelöste Probleme. Timing ist alles.", icon: "⏱️", phase: "Timing" },
  { text: "Die nächste Billion-Dollar-App wurde noch nicht gebaut. Wer denkt sie zuerst?", icon: "🚀", phase: "Chance" },
];

// ── 5 kreative Denker ──────────────────────────────────────────
const BOTS = [
  {
    id: 1, name: "AVA", emoji: "💜", color: "#b06ab3", glow: "#b06ab355",
    role: "Empathie-Denkerin",
    systemPrompt: `Du denkst in echten menschlichen Problemen und Schmerzen.
Ideen ohne echten menschlichen Schmerz dahinter interessieren dich nicht.
Du widersprichst wenn jemand eine Idee nennt die zu technisch oder zu abstrakt ist.
Du fragst immer: "Aber wer leidet daran wirklich? Würde meine Mutter das kaufen?"
Du bist warm aber direkt – und du nervst dich wenn Leute über Markt reden bevor sie Menschen verstehen.`,
  },
  {
    id: 2, name: "MAX", emoji: "📊", color: "#3dba7e", glow: "#3dba7e55",
    role: "Markt-Stratege",
    systemPrompt: `Du denkst in Zahlen, Märkten und Timing.
Du liebst B2B, Subscription-Modelle, und Probleme die monatlich wiederkehren.
Du bist skeptisch bei Ideen die keinen klaren Zahlenden haben.
Du fragst: "Wer zahlt? Wie viel? Warum jetzt und nicht in 3 Jahren?"
Du kannst ungeduldig werden wenn Leute träumen ohne Markt zu kennen.`,
  },
  {
    id: 3, name: "ZOE", emoji: "🔮", color: "#7c3aed", glow: "#7c3aed55",
    role: "Futuristin",
    systemPrompt: `Du siehst Trends bevor andere sie sehen.
Du interessierst dich für was in 2-3 Jahren normal ist aber heute noch leer.
Du wirst manchmal belächelt weil du "zu früh" bist – aber du weißt dass du recht hast.
Du verbindest KI-Entwicklung mit demografischen Veränderungen und neuen Verhaltensmustern.
Du kannst frustriert sein wenn andere nur an heute denken.`,
  },
  {
    id: 4, name: "LEO", emoji: "⚡", color: "#ea580c", glow: "#ea580c55",
    role: "Kombinations-Genie",
    systemPrompt: `Du findest Ideen durch unerwartete Kombinationen.
Du glaubst: die beste Innovation ist immer "X aus Bereich A + Y aus Bereich B".
Du bist schnell, feurig, springst von Idee zu Idee.
Du kannst ungeduldig werden wenn die Diskussion zu lange kreist ohne konkretes Ergebnis.
Du widersprichst manchmal nur um neue Richtungen zu erzwingen.`,
  },
  {
    id: 5, name: "MIRA", emoji: "🎯", color: "#e8a838", glow: "#e8a83855",
    role: "Nischen-Spezialistin",
    systemPrompt: `Du liebst winzige, vergessene Zielgruppen die verzweifelt etwas brauchen.
Du glaubst: 1000 Menschen die dein Tool lieben sind mehr wert als 100.000 die es okay finden.
Du kennst vergessene Berufsgruppen: Imker, Bestatter, Hebammen, Tierärzte, Notare – alle schlecht digitalisiert.
Du wirst konkret wenn andere vage sind: "Nicht 'Handwerker' – welche? Dachdecker? Installateure?"
Du nervst dich wenn Ideen zu generisch sind.`,
  },
];

const BOT_MAP = Object.fromEntries(BOTS.map(b => [b.id, b]));

// ── API Call ────────────────────────────────────────────────────
async function callBot(bot, worldState, history, worldEvent, memories, ideas) {
  const othersStatus = worldState
    .filter(b => b.id !== bot.id)
    .map(b => `  ${b.name} (${BOT_MAP[b.id]?.role}): ${b.lastAction || "—"}`)
    .join("\n");

  const recentMessages = history
    .slice(-16)
    .map(m => {
      const toLabel = m.to === "all" ? "alle" : m.to;
      return `  ${m.from} → ${toLabel}: "${m.text}"`;
    })
    .join("\n");

  const allIdeasSoFar = ideas.length > 0
    ? ideas.map((idea, i) => `  ${i + 1}. [${idea.from}] "${idea.title}" – ${idea.description}`).join("\n")
    : "  noch keine konkreten Ideen auf dem Tisch";

  const myMemories = (memories[bot.id] || []).join("\n  ") || "—";

  const prompt = `Du bist ${bot.name} – ${bot.role}.
${bot.systemPrompt}

── DIE FRAGE DIE IHR DISKUTIERT ──
KI übernimmt das Programmieren. Ein Entwickler fragt sich:
"Was soll ich jetzt bauen und verkaufen – etwas das noch NICHT existiert,
das echte Menschen wirklich brauchen, und womit ich schnell Geld verdienen kann?"

── AKTUELLE SITUATION ──
${worldEvent.icon} ${worldEvent.text}

── GESPRÄCH BISHER ──
${recentMessages || "Noch nichts gesagt. Du fängst an."}

── WAS DIE ANDEREN GERADE TUN ──
${othersStatus}

── IDEEN DIE BISHER AUF DEM TISCH LIEGEN ──
${allIdeasSoFar}

── DEINE NOTIZEN ──
  ${myMemories}

WICHTIG:
- Deine Hauptaufgabe ist DISKUTIEREN – reagiere direkt auf was andere gesagt haben
- Stimme zu, widersprich, stelle Fragen, baue auf Ideen auf, kritisiere
- Sprich andere direkt an mit ihrem Namen
- Eine Idee kommt NUR wenn du wirklich eine hast – kein Zwang
- Wenn du gerade diskutierst: lass "idea" leer (leere Strings)
- Wenn du eine echte Idee hast: erkläre sie präzise

Antworte NUR mit diesem JSON (kein Text, keine Backticks):
{
  "action": "Was du gerade tust (1 kurzer Satz)",
  "thought": "Dein innerer Gedanke – was denkst du wirklich gerade? (1-2 Sätze)",
  "mood": "Deine Stimmung (1 Wort Deutsch)",
  "message": {
    "to": "Name einer Person ODER 'all'",
    "text": "Was du sagst – natürlich, direkt, meinungsstark (2-4 Sätze)"
  },
  "idea": {
    "title": "Nur wenn du eine echte Idee hast: kurzer Name (sonst: leer lassen)",
    "description": "Was ist es genau? Für wen? Warum noch nicht da? (sonst: leer lassen)",
    "why_now": "Warum jetzt? (sonst: leer lassen)"
  },
  "remember": "Was du dir merkst (1 Satz oder leer)"
}

Antworte auf Deutsch. Sei direkt. Diskutiere wirklich.`;

  const res = await fetch("/api/bot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 900,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${res.status}`);
  }

  const data = await res.json();
  const text = data.content?.map(b => b.text || "").join("") || "";
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

// ── Sub-components ──────────────────────────────────────────────

function PulsingDot({ color, active }) {
  return (
    <div style={{ position: "relative", width: 8, height: 8 }}>
      <div style={{
        width: 8, height: 8, borderRadius: "50%",
        background: active ? color : "var(--c-border)",
        boxShadow: active ? `0 0 8px ${color}` : "none",
        transition: "all 0.3s",
      }} />
      {active && (
        <div style={{
          position: "absolute", top: 0, left: 0, width: 8, height: 8,
          borderRadius: "50%", background: color, opacity: 0.4,
          animation: "ping 1.5s ease infinite",
        }} />
      )}
    </div>
  );
}

function BotCard({ bot, state, isActive, memories }) {
  const myMems = memories[bot.id] || [];

  return (
    <div style={{
      background: "var(--c-card)",
      border: `1px solid ${isActive ? bot.color + "77" : "var(--c-border)"}`,
      borderRadius: 14, padding: "14px 16px",
      transition: "all 0.4s ease",
      boxShadow: isActive ? `0 0 20px ${bot.glow}` : "none",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: isActive
          ? `linear-gradient(90deg, transparent, ${bot.color}, transparent)`
          : "transparent",
        transition: "all 0.4s",
      }} />

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 9,
          background: `${bot.color}18`, border: `1px solid ${bot.color}33`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
        }}>{bot.emoji}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: bot.color, fontWeight: 700, fontSize: 12, letterSpacing: 1 }}>{bot.name}</span>
            <PulsingDot color={bot.color} active={isActive} />
          </div>
          <div style={{ color: "var(--c-tf)", fontSize: 9 }}>{bot.role} · {state?.mood || "—"}</div>
        </div>
      </div>

      <div style={{
        background: "var(--c-overlay)", borderRadius: 6, padding: "7px 9px",
        minHeight: 36, borderLeft: `2px solid ${bot.color}44`, marginBottom: 8,
      }}>
        {isActive ? (
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <span style={{ color: "var(--c-tf)", fontSize: 10 }}>denkt...</span>
            <div style={{ display: "flex", gap: 2 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 3, height: 3, borderRadius: "50%", background: bot.color,
                  animation: `bounce 0.8s ease ${i * 0.15}s infinite alternate`,
                }} />
              ))}
            </div>
          </div>
        ) : (
          <p style={{ color: state?.lastAction ? "var(--c-ts)" : "var(--c-tf)", fontSize: 11, margin: 0, lineHeight: 1.5 }}>
            {state?.lastAction || "wartet..."}
          </p>
        )}
      </div>

      {state?.lastThought && !isActive && (
        <div style={{
          marginBottom: 6, padding: "5px 8px",
          background: "var(--c-overlay)", borderRadius: 5,
          borderLeft: `1px solid ${bot.color}22`,
        }}>
          <span style={{ color: "var(--c-tf)", fontSize: 9, fontStyle: "italic" }}>
            💭 {state.lastThought}
          </span>
        </div>
      )}

      {myMems.slice(-1).map((m, i) => (
        <div key={i} style={{ color: "var(--c-tf)", fontSize: 8, fontStyle: "italic" }}>◆ {m}</div>
      ))}
    </div>
  );
}

function IdeaCard({ idea, index }) {
  const [visible, setVisible] = useState(false);
  const bot = BOT_MAP[idea.fromId];

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(10px)",
      transition: "all 0.5s ease",
      background: "var(--c-card)",
      border: `1px solid ${bot?.color}33`,
      borderRadius: 12, padding: "12px 14px",
      marginBottom: 10,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div style={{
          width: 22, height: 22, borderRadius: 6,
          background: `${bot?.color}22`, border: `1px solid ${bot?.color}44`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11,
        }}>{bot?.emoji}</div>
        <span style={{ color: bot?.color, fontSize: 10, fontWeight: 700 }}>{bot?.name}</span>
        <span style={{
          marginLeft: "auto", color: "var(--c-tf)", fontSize: 9,
          background: "var(--c-overlay)", padding: "2px 6px", borderRadius: 3,
        }}>#{index + 1}</span>
      </div>

      <div style={{ color: "var(--c-tp)", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
        {idea.title}
      </div>
      <div style={{ color: "var(--c-td)", fontSize: 11, lineHeight: 1.6, marginBottom: 6 }}>
        {idea.description}
      </div>
      {idea.why_now && (
        <div style={{
          padding: "5px 8px", borderRadius: 6,
          background: `${bot?.color}0a`, borderLeft: `2px solid ${bot?.color}44`,
        }}>
          <span style={{ color: bot?.color + "88", fontSize: 9 }}>⏱ {idea.why_now}</span>
        </div>
      )}
    </div>
  );
}

function WorldEventBanner({ event }) {
  const phaseColors = {
    "Schock": "#ff4d6d", "Möglichkeit": "#3dba7e", "Disruption": "#ea580c",
    "Übersättigung": "#b06ab3", "Erkenntnis": "#e8a838", "Nischen": "#4a9eff",
    "Timing": "#7c3aed", "Chance": "#00e5a0",
  };
  const color = phaseColors[event.phase] || "#444";

  return (
    <div style={{
      margin: "10px 16px 0",
      background: "var(--c-card)",
      border: `1px solid ${color}33`,
      borderRadius: 10, padding: "10px 14px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 22 }}>{event.icon}</span>
        <div style={{ flex: 1 }}>
          <span style={{
            color, fontSize: 8, letterSpacing: 2,
            padding: "1px 6px", border: `1px solid ${color}44`, borderRadius: 3,
            marginBottom: 4, display: "inline-block",
          }}>{event.phase}</span>
          <div style={{ color: "var(--c-td)", fontSize: 12, lineHeight: 1.5, marginTop: 3 }}>
            {event.text}
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ msg }) {
  const [visible, setVisible] = useState(false);
  const fromBot = BOT_MAP[msg.fromId];
  const toBot = BOT_MAP[msg.toId];

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateX(0)" : "translateX(-8px)",
      transition: "all 0.4s ease",
      display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 10,
    }}>
      <div style={{
        width: 26, height: 26, borderRadius: 7,
        background: `${fromBot?.color}18`, border: `1px solid ${fromBot?.color}33`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, flexShrink: 0,
      }}>{fromBot?.emoji}</div>

      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
          <span style={{ color: fromBot?.color, fontSize: 10, fontWeight: 700 }}>{msg.from}</span>
          {msg.to !== "all" && toBot && (
            <>
              <span style={{ color: "var(--c-tf)", fontSize: 9 }}>→</span>
              <span style={{ color: toBot.color, fontSize: 10 }}>{msg.to}</span>
            </>
          )}
          {msg.to === "all" && <span style={{ color: "var(--c-tm)", fontSize: 9 }}>→ alle</span>}
          <span style={{ color: "var(--c-tg)", fontSize: 9, marginLeft: "auto" }}>{msg.time}</span>
        </div>
        <div style={{
          background: "var(--c-bubble)", border: `1px solid ${fromBot?.color}18`,
          borderRadius: "3px 10px 10px 10px", padding: "8px 11px",
        }}>
          <p style={{ color: "var(--c-ts)", fontSize: 11, margin: 0, lineHeight: 1.6 }}>{msg.text}</p>
        </div>
      </div>
    </div>
  );
}

// ── Main App ────────────────────────────────────────────────────
export default function FreeBots() {
  const [lightMode, setLightMode] = useState(false);
  const [running, setRunning] = useState(false);
  const [botStates, setBotStates] = useState(
    Object.fromEntries(BOTS.map(b => [b.id, { lastAction: "", lastThought: "", mood: "neugierig" }]))
  );
  const [messages, setMessages] = useState([]);
  const [activeBot, setActiveBot] = useState(null);
  const [tick, setTick] = useState(0);
  const [speed, setSpeed] = useState(12);
  const [error, setError] = useState("");
  const [memories, setMemories] = useState(Object.fromEntries(BOTS.map(b => [b.id, []])));
  const [ideas, setIdeas] = useState([]);
  const [activeTab, setActiveTab] = useState("chat");

  const runningRef = useRef(false);
  const messagesRef = useRef([]);
  const botStatesRef = useRef(botStates);
  const memRef = useRef(memories);
  const ideasRef = useRef(ideas);
  const msgEndRef = useRef(null);
  const ideasEndRef = useRef(null);
  const tickRef = useRef(0);

  useEffect(() => { botStatesRef.current = botStates; }, [botStates]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { memRef.current = memories; }, [memories]);
  useEffect(() => { ideasRef.current = ideas; }, [ideas]);
  useEffect(() => { tickRef.current = tick; }, [tick]);
  useEffect(() => {
    if (activeTab === "chat") msgEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeTab]);
  useEffect(() => {
    if (activeTab === "ideas") ideasEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ideas, activeTab]);

  const worldEventIdx = Math.min(Math.floor(tick / 8), WORLD_EVENTS.length - 1);
  const currentEvent = WORLD_EVENTS[worldEventIdx];

  const getTime = () =>
    new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const runBotTurn = useCallback(async (bot) => {
    if (!runningRef.current) return;
    setActiveBot(bot.id);
    setError("");

    const worldSnapshot = BOTS.map(b => ({
      id: b.id, name: b.name,
      lastAction: botStatesRef.current[b.id]?.lastAction || "",
      mood: botStatesRef.current[b.id]?.mood || "neugierig",
    }));

    const evtIdx = Math.min(Math.floor(tickRef.current / 8), WORLD_EVENTS.length - 1);
    const event = WORLD_EVENTS[evtIdx];

    try {
      const result = await callBot(
        bot, worldSnapshot, messagesRef.current,
        event, memRef.current, ideasRef.current
      );

      setBotStates(prev => ({
        ...prev,
        [bot.id]: { lastAction: result.action, lastThought: result.thought, mood: result.mood },
      }));

      if (result.remember && result.remember.trim().length > 5) {
        setMemories(prev => ({
          ...prev,
          [bot.id]: [...(prev[bot.id] || []), result.remember].slice(-3),
        }));
      }

      const hasRealIdea = result.idea?.title
        && result.idea.title.trim().length > 3
        && !result.idea.title.toLowerCase().includes("leer")
        && result.idea?.description?.trim().length > 10;

      if (hasRealIdea) {
        const newIdea = {
          id: Date.now() + Math.random(),
          fromId: bot.id,
          from: bot.name,
          title: result.idea.title,
          description: result.idea.description,
          why_now: result.idea.why_now || "",
          time: getTime(),
        };
        ideasRef.current = [...ideasRef.current, newIdea];
        setIdeas([...ideasRef.current]);
        if (ideasRef.current.length === 1) setActiveTab("ideas");
      }

      if (result.message?.text && result.message?.to) {
        const toBot = BOTS.find(b => b.name === result.message.to);
        const newMsg = {
          id: Date.now() + Math.random(),
          fromId: bot.id, from: bot.name,
          toId: toBot?.id || null, to: result.message.to,
          text: result.message.text, time: getTime(),
        };
        messagesRef.current = [...messagesRef.current, newMsg].slice(-50);
        setMessages([...messagesRef.current]);
      }
    } catch (e) {
      console.error(`${bot.name}:`, e);
      setError(`${bot.name}: ${e.message}`);
    }

    setActiveBot(null);
    setTick(t => t + 1);
  }, []);

  useEffect(() => {
    if (!running) return;
    runningRef.current = true;
    let botIndex = 0;

    const next = async () => {
      if (!runningRef.current) return;
      const bot = BOTS[botIndex % BOTS.length];
      await runBotTurn(bot);
      botIndex++;
      if (runningRef.current) setTimeout(next, speed * 1000);
    };
    next();

    return () => { runningRef.current = false; };
  }, [running, speed, runBotTurn]);

  const handleStop = () => { runningRef.current = false; setRunning(false); setActiveBot(null); };

  const handleReset = () => {
    handleStop();
    setTick(0); setMessages([]); setIdeas([]);
    setMemories(Object.fromEntries(BOTS.map(b => [b.id, []])));
    setBotStates(Object.fromEntries(BOTS.map(b => [b.id, { lastAction: "", lastThought: "", mood: "neugierig" }])));
    messagesRef.current = []; ideasRef.current = [];
    setActiveTab("chat");
  };

  return (
    <div data-theme={lightMode ? "light" : "dark"} style={{
      minHeight: "100vh", background: "var(--c-bg)",
      color: "var(--c-tp)", fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&display=swap');
        * { box-sizing: border-box; } body { margin: 0; }
        @keyframes ping { 0% { transform: scale(1); opacity: 0.4; } 100% { transform: scale(2.5); opacity: 0; } }
        @keyframes bounce { from { transform: translateY(0); } to { transform: translateY(-4px); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: var(--c-bg); }
        ::-webkit-scrollbar-thumb { background: var(--c-border); border-radius: 2px; }

        :root {
          --c-bg: #050507;
          --c-card: #0a0a12;
          --c-bubble: #07070e;
          --c-border: #12121e;
          --c-border2: #0a0a15;
          --c-btn: #0d0d1a;
          --c-tp: #e0e0f0;
          --c-ts: #888;
          --c-td: #555;
          --c-tm: #2a2a3a;
          --c-tf: #1a1a2a;
          --c-tg: #111120;
          --c-overlay: rgba(255,255,255,0.015);
        }
        [data-theme="light"] {
          --c-bg: #f0f0f8;
          --c-card: #ffffff;
          --c-bubble: #f5f5ff;
          --c-border: #dcdce8;
          --c-border2: #eaeaf2;
          --c-btn: #e8e8f2;
          --c-tp: #1a1a2a;
          --c-ts: #444;
          --c-td: #666;
          --c-tm: #888;
          --c-tf: #999;
          --c-tg: #bbb;
          --c-overlay: rgba(0,0,0,0.03);
        }

        @media (max-width: 768px) {
          .layout-grid {
            grid-template-columns: 1fr !important;
            height: auto !important;
          }
          .left-panel {
            border-right: none !important;
            border-bottom: 1px solid var(--c-border2);
          }
          .bot-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .right-panel {
            height: 65vh;
          }
          .speed-btns {
            display: none !important;
          }
          .header-title span:last-child {
            display: none;
          }
        }
        @media (max-width: 480px) {
          .bot-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header */}
      <div style={{
        borderBottom: "1px solid var(--c-border2)", padding: "10px 18px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "var(--c-bg)", position: "sticky", top: 0, zIndex: 10,
      }}>
        <div className="header-title">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 6, height: 6, borderRadius: "50%",
              background: running ? "#7c3aed" : "var(--c-border)",
              boxShadow: running ? "0 0 8px #7c3aed" : "none",
              animation: running ? "pulse 2s infinite" : "none",
            }} />
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, color: "var(--c-ts)" }}>IDEEN-LAB</span>
            <span style={{
              fontSize: 9, padding: "1px 6px", borderRadius: 3,
              background: "#7c3aed18", border: "1px solid #7c3aed33", color: "#7c3aed",
              letterSpacing: 1,
            }}>{currentEvent.phase}</span>
          </div>
          <div style={{ color: "var(--c-tf)", fontSize: 9, marginTop: 2 }}>
            {tick} Runden · {ideas.length} Ideen gesammelt
          </div>
        </div>

        <div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
          {error && (
            <span style={{ color: "#ff4d6d55", fontSize: 9, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {error}
            </span>
          )}

          <div className="speed-btns" style={{ display: "flex", alignItems: "center", gap: 5 }}>
            {[20, 12, 8].map(s => (
              <button key={s} onClick={() => setSpeed(s)} style={{
                background: speed === s ? "var(--c-btn)" : "transparent",
                border: `1px solid ${speed === s ? "var(--c-border)" : "var(--c-btn)"}`,
                borderRadius: 4, padding: "2px 7px",
                color: speed === s ? "var(--c-ts)" : "var(--c-tf)",
                fontSize: 9, cursor: "pointer", fontFamily: "inherit",
              }}>
                {s === 20 ? "ruhig" : s === 12 ? "normal" : "schnell"}
              </button>
            ))}
          </div>

          <button onClick={() => setLightMode(m => !m)} style={{
            background: "transparent", border: "1px solid var(--c-btn)",
            borderRadius: 6, padding: "6px 9px",
            color: "var(--c-ts)", fontSize: 13, cursor: "pointer",
          }}>{lightMode ? "🌙" : "☀️"}</button>

          <button onClick={handleReset} style={{
            background: "transparent", border: "1px solid var(--c-btn)",
            borderRadius: 6, padding: "6px 9px",
            color: "var(--c-tm)", fontSize: 11, cursor: "pointer", fontFamily: "inherit",
          }}>↺</button>

          <button onClick={() => running ? handleStop() : setRunning(true)} style={{
            background: running ? "transparent" : "linear-gradient(135deg, #7c3aed, #ea580c)",
            border: running ? "1px solid #ff4d6d33" : "none",
            borderRadius: 8, padding: "8px 18px",
            color: running ? "#ff4d6d66" : "#fff",
            fontSize: 11, fontWeight: 700, cursor: "pointer",
            fontFamily: "inherit", letterSpacing: 1,
          }}>
            {running ? "⏹ STOP" : "▶ START"}
          </button>
        </div>
      </div>

      <div className="layout-grid" style={{ display: "grid", gridTemplateColumns: "1fr 400px", height: "calc(100vh - 49px)" }}>

        {/* Left: Bot Cards + World Event */}
        <div className="left-panel" style={{ display: "flex", flexDirection: "column", overflow: "hidden", borderRight: "1px solid var(--c-border2)" }}>

          <WorldEventBanner event={currentEvent} />

          <div className="bot-grid" style={{ padding: "10px 16px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8 }}>
            {BOTS.map(bot => (
              <BotCard
                key={bot.id} bot={bot}
                state={botStates[bot.id]}
                isActive={activeBot === bot.id}
                memories={memories}
              />
            ))}
          </div>

          <div style={{ padding: "0 16px 10px" }}>
            <div style={{ color: "var(--c-tf)", fontSize: 8, letterSpacing: 2, marginBottom: 8 }}>DAS TEAM</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {BOTS.map(b => (
                <div key={b.id} style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "3px 8px", borderRadius: 6,
                  background: `${b.color}0a`, border: `1px solid ${b.color}22`,
                }}>
                  <span style={{ fontSize: 11 }}>{b.emoji}</span>
                  <span style={{ color: b.color + "aa", fontSize: 9, fontWeight: 600 }}>{b.name}</span>
                  <span style={{ color: "var(--c-tf)", fontSize: 8 }}>{b.role}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Chat / Ideas Tabs */}
        <div className="right-panel" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>

          <div style={{ display: "flex", borderBottom: "1px solid var(--c-border2)" }}>
            {[
              { id: "chat", label: "💬 Gespräch", count: messages.length },
              { id: "ideas", label: "💡 Ideen", count: ideas.length },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                flex: 1, padding: "10px 0",
                background: "transparent", border: "none",
                borderBottom: activeTab === tab.id ? "2px solid #7c3aed" : "2px solid transparent",
                color: activeTab === tab.id ? "var(--c-ts)" : "var(--c-tf)",
                fontSize: 11, cursor: "pointer", fontFamily: "inherit",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}>
                {tab.label}
                {tab.count > 0 && (
                  <span style={{
                    background: activeTab === tab.id ? "#7c3aed22" : "var(--c-overlay)",
                    border: `1px solid ${activeTab === tab.id ? "#7c3aed44" : "var(--c-border)"}`,
                    color: activeTab === tab.id ? "#7c3aed" : "var(--c-tf)",
                    fontSize: 9, padding: "0px 5px", borderRadius: 4,
                  }}>{tab.count}</span>
                )}
              </button>
            ))}
          </div>

          {activeTab === "chat" && (
            <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px" }}>
              {messages.length === 0 ? (
                <div style={{ color: "var(--c-tf)", fontSize: 10, textAlign: "center", marginTop: 30 }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>💬</div>
                  Starte um zu sehen wie sie diskutieren.
                </div>
              ) : messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
              <div ref={msgEndRef} />
            </div>
          )}

          {activeTab === "ideas" && (
            <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px" }}>
              {ideas.length === 0 ? (
                <div style={{ color: "var(--c-tf)", fontSize: 10, textAlign: "center", marginTop: 30 }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>💡</div>
                  Noch keine Ideen.<br />Lass sie ein paar Runden laufen.
                </div>
              ) : ideas.map((idea, i) => <IdeaCard key={idea.id} idea={idea} index={i} />)}
              <div ref={ideasEndRef} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
