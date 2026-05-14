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

async function callApiBot(systemPrompt, userContent, maxTokens = 4000) {
  const res = await fetch("/api/bot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: `${systemPrompt}\n\n${userContent}` }],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${res.status}`);
  }
  const data = await res.json();
  const text = data.content?.map(b => b.text || "").join("") || "";
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}

async function callAnalyseBot(ideas) {
  const ideasText = ideas.map((idea, i) =>
    `Idee ${i + 1}: "${idea.title}"\nBeschreibung: ${idea.description}\nWarum jetzt: ${idea.why_now || "—"}`
  ).join("\n\n");

  return callApiBot(`Du bist ein erfahrener Startup-Analyst. Analysiere jede App-Idee anhand einer 10-Punkte Checkliste.
Für jeden Punkt: kurze ehrliche Bewertung (2-3 Sätze) + Emoji-Verdict (✅ gut / ⚠️ mittel / ❌ schwach).
Bonus am Ende: was erfüllt ist, was fehlt.

Antworte NUR mit diesem JSON (keine Backticks):
{
  "analyses": [
    {
      "title": "exakter Titel",
      "checklist": [
        { "nr": 1, "name": "Problemdefinition", "verdict": "✅", "text": "..." },
        { "nr": 2, "name": "Zielgruppe", "verdict": "⚠️", "text": "..." },
        { "nr": 3, "name": "Nutzen / Value Proposition", "verdict": "✅", "text": "..." },
        { "nr": 4, "name": "Wettbewerb", "verdict": "⚠️", "text": "..." },
        { "nr": 5, "name": "MVP Machbarkeit", "verdict": "✅", "text": "..." },
        { "nr": 6, "name": "Monetarisierung", "verdict": "✅", "text": "..." },
        { "nr": 7, "name": "Validierung", "verdict": "❌", "text": "..." },
        { "nr": 8, "name": "Marketing / Nutzergewinnung", "verdict": "⚠️", "text": "..." },
        { "nr": 9, "name": "Technik / Umsetzung", "verdict": "✅", "text": "..." },
        { "nr": 10, "name": "Launch-Plan", "verdict": "⚠️", "text": "..." }
      ],
      "bonus": {
        "erfuellt": ["Punkt 1", "Punkt 3"],
        "fehlt": ["Punkt 7"]
      }
    }
  ]
}`, ideasText, 5000);
}

async function callScoringBot(ideas, analyses) {
  const ideasText = ideas.map((idea, i) => {
    const analyse = analyses.find(a => a.title === idea.title);
    const checklistSummary = analyse?.checklist.map(c => `${c.nr}. ${c.name}: ${c.verdict}`).join(", ") || "";
    return `Idee ${i + 1}: "${idea.title}"\n${idea.description}\nCheckliste: ${checklistSummary}`;
  }).join("\n\n");

  return callApiBot(`Du bist ein objektiver Startup-Bewerter. Bewerte jede Idee mit dem Go/No-Go Modell.
Bewertungsskala pro Kategorie: 0=schlecht, 1=mittel, 2=gut, 3=sehr stark.
Max 24 Punkte. Entscheidung: 18-24=BAUEN🔥, 12-17=VERBESSERN⚠️, 0-11=NICHT BAUEN❌.

Antworte NUR mit diesem JSON (keine Backticks):
{
  "scores": [
    {
      "title": "exakter Titel",
      "kategorien": [
        { "name": "Problem", "punkte": 2, "max": 3, "kommentar": "..." },
        { "name": "Zielgruppe", "punkte": 2, "max": 3, "kommentar": "..." },
        { "name": "Nutzen / Value", "punkte": 2, "max": 3, "kommentar": "..." },
        { "name": "Wettbewerb", "punkte": 1, "max": 3, "kommentar": "..." },
        { "name": "MVP Machbarkeit", "punkte": 3, "max": 3, "kommentar": "..." },
        { "name": "Monetarisierung", "punkte": 2, "max": 3, "kommentar": "..." },
        { "name": "Validierung", "punkte": 1, "max": 3, "kommentar": "..." },
        { "name": "Marketing / Wachstum", "punkte": 1, "max": 3, "kommentar": "..." }
      ],
      "gesamt": 14,
      "entscheidung": "VERBESSERN",
      "emoji": "⚠️",
      "realityCheck": {
        "wuerdejemandZahlen": true,
        "wuerdejemandSuchen": false,
        "kannInMVP": true,
        "riskant": true
      },
      "profi": {
        "problemStark": true,
        "geldMoeglich": true,
        "nutzerErreichbar": false,
        "fazit": "2 von 3 Profi-Kriterien erfüllt"
      }
    }
  ]
}`, ideasText, 4000);
}

async function callBerichtBot(ideas, analyses, scores) {
  const ideasText = ideas.map((idea, i) => {
    const score = scores.find(s => s.title === idea.title);
    return `Idee ${i + 1}: "${idea.title}"
Beschreibung: ${idea.description}
Score: ${score?.gesamt}/24 — ${score?.entscheidung} ${score?.emoji}
Reality Check: zahlen=${score?.realityCheck?.wuerdejemandZahlen}, suchen=${score?.realityCheck?.wuerdejemandSuchen}, MVP=${score?.realityCheck?.kannInMVP}`;
  }).join("\n\n");

  return callApiBot(`Du bist ein erfahrener Produkt-Stratege. Schreibe für jede Idee einen klaren Entscheidungsbericht.
Der Bericht soll präzise, ehrlich und direkt sein. Er wird anschließend an einen Prompt-Generator übergeben.

Antworte NUR mit diesem JSON (keine Backticks):
{
  "berichte": [
    {
      "title": "exakter Titel",
      "name": "App-Name (kann kreativ sein)",
      "kurzbeschreibung": "Was die App macht, für wen, und warum jetzt (3-4 Sätze)",
      "staerken": ["Stärke 1", "Stärke 2", "Stärke 3"],
      "risiken": ["Risiko 1", "Risiko 2"],
      "empfehlung": "Konkrete Handlungsempfehlung (2-3 Sätze)",
      "weitermachen": true
    }
  ]
}`, ideasText, 3000);
}

async function callPromptBot(berichte, allIdeas) {
  const ideasText = berichte.map((b, i) => {
    const original = allIdeas.find(a => a.title === b.title);
    return `${i + 1}. "${b.name || b.title}"
   Beschreibung: ${b.kurzbeschreibung || original?.description || ""}
   Stärken: ${(b.staerken || []).join(", ")}
   Risiken: ${(b.risiken || []).join(", ")}
   Empfehlung: ${b.empfehlung || ""}`;
  }).join("\n\n");

  const prompt = `Du bist ein Weltklasse Product Architect, Senior Prompt Engineer für KI-Coding-Agenten, und UI/UX-Experte mit 15 Jahren Erfahrung.

Hier sind validierte App-Ideen:

${ideasText}

══ TECH-STACK ENTSCHEIDUNG ══
Überlege sehr genau welcher Stack wirklich passt:

📱 MOBILE APP (wenn Zielgruppe hauptsächlich Smartphone nutzt, Kamera/GPS/Push-Notifications braucht):
→ React Native + Expo (iOS & Android gleichzeitig)
→ Navigation: @react-navigation/native + bottom-tabs + stack
→ State: Zustand
→ Styling: NativeWind (Tailwind für RN) + react-native-reanimated
→ Backend: Supabase (auth + db + storage)

🌐 WEB APP / SAAS / DASHBOARD (Browser, Desktop):
→ React + Vite + TailwindCSS v3 + shadcn/ui
→ State: Zustand + React Query (TanStack)
→ Backend: Node.js + Express + Prisma + PostgreSQL ODER Supabase
→ Auth: Supabase Auth

🔧 CLI / AUTOMATISIERUNG:
→ Node.js + Commander.js + Chalk + Ora

🖥️ DESKTOP:
→ Tauri + React + TailwindCSS

══ UI-QUALITÄTSSTANDARDS (IMMER PFLICHT — KEINE AUSNAHMEN) ══
Jeder Prompt MUSS diese UI-Anforderungen enthalten:
- Professionelles Design-System: Farbpalette mit exakten Hex-Codes definieren, Typografie-Skala, Spacing-System
- Dark Mode als Standard + Light Mode Toggle
- Micro-Animationen: Framer Motion (Web) oder react-native-reanimated (Mobile)
- Loading States: Skeleton Screens statt einfacher Spinner
- Error States: Toast Notifications (react-hot-toast oder Sonner)
- Empty States: mit Icon/Illustration und Call-to-Action
- Glassmorphism-Akzente, subtile Gradienten, professionelle Schatten
- Custom Scrollbars, Hover-Effekte, Focus-Ring-Styles
- Icons: Lucide React (Web) oder @expo/vector-icons (Mobile)
- Schrift: Inter oder Geist (Google Fonts / Expo Google Fonts)
- Responsive: Mobile-first für Web (Breakpoints: sm/md/lg/xl)
- Accessibility: ARIA-Labels, Keyboard Navigation, ausreichende Kontraste

══ VOLLSTÄNDIGER PROMPT-AUFBAU (12 PFLICHT-SEKTIONEN) ══
Jeder Build-Prompt muss ALLE diese Punkte detailliert abdecken:
1. App-Name + Tagline (wie ein Startup-Pitch, prägnant)
2. Problem + Zielgruppe (wer leidet, wie stark, warum jetzt)
3. Monetarisierungsmodell (konkret: Preise, Stripe-Integration, Freemium-Grenze)
4. Tech-Stack (ALLE Pakete + Versionen, Begründung warum dieser Stack)
5. Datenbankschema (Tabellen, Felder, Beziehungen)
6. Vollständige Dateistruktur (alle Ordner und Dateien die erstellt werden)
7. MVP Feature-Liste (Must-Have priorisiert, Nice-to-Have separat)
8. UI/UX-Beschreibung (ALLE Screens, Layouts, Farbpalette mit Hex-Codes, Stimmung, Animationen)
9. Authentifizierung (Google OAuth / Email / Magic Link — konkretes Setup)
10. API-Endpunkte (alle Routes mit Method + Payload beschreiben)
11. Deployment-Plan (Vercel / Railway / Expo EAS / App Store — konkreter Befehl)
12. Abschluss: "Wenn fertig: git add . && git commit -m '[app-name]: initial build by FreeBots' && git push"

══ FÜR MOBILE APPS ZUSÄTZLICH PFLICHT ══
- Expo-Setup: npx create-expo-app@latest [name] --template blank-typescript
- Navigation-Baum (Bottom Tabs, Stack Navigator, Modal-Screens)
- Push Notifications Setup (Expo Notifications + Supabase Edge Functions)
- App-Icon + Splash Screen Spezifikation (Farben, Icon-Design)
- WICHTIGER HINWEIS: "Dies ist eine MOBILE APP. Baue mit React Native + Expo. Kein Web-Browser-Build."
- App Store / Play Store Beschreibung (kurz, für Submission)

Antworte NUR mit diesem JSON (keine Backticks):
{
  "selected": [
    {
      "title": "exakter Titel der Idee",
      "category": "top oder anpassung",
      "stack": "z.B. React Native + Expo oder React + Vite + TailwindCSS + shadcn/ui",
      "isMobile": false,
      "stackReason": "Warum genau dieser Stack (2-3 Sätze)",
      "prompt": "Der vollständige Build-Prompt — alle 12 Sektionen, professionell, detailliert, 500-700 Wörter"
    }
  ]
}`;

  const res = await fetch("/api/bot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 14000,
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

async function sendNtfyNotification(message, title) {
  const res = await fetch("/api/notify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, title }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "Fehler");
  return data;
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
  const [pipelineState, setPipelineState] = useState("idle");
  const [analyseItems, setAnalyseItems] = useState([]);
  const [scoringItems, setScoringItems] = useState([]);
  const [berichtItems, setBerichtItems] = useState([]);
  const [pipelineItems, setPipelineItems] = useState([]);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [ntfyStatus, setNtfyStatus] = useState("idle");
  const [buildStatus, setBuildStatus] = useState({});

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
      if (ideasRef.current.length >= 2) {
        runningRef.current = false;
        setRunning(false);
        setActiveBot(null);
        return;
      }
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
    setPipelineState("idle"); setAnalyseItems([]); setScoringItems([]); setBerichtItems([]); setPipelineItems([]);
    setBuildStatus({}); setNtfyStatus("idle");
    setActiveTab("chat");
  };

  const handleStartPipeline = async () => {
    if (ideasRef.current.length === 0) return;
    const ideas = ideasRef.current;
    setActiveTab("pipeline");
    setAnalyseItems([]); setScoringItems([]); setBerichtItems([]); setPipelineItems([]);

    setPipelineState("analysing");
    let analyses = [];
    try {
      const r = await callAnalyseBot(ideas);
      analyses = r.analyses || [];
      setAnalyseItems(analyses);
    } catch (e) { setError(`Analyse: ${e.message}`); setPipelineState("idle"); return; }

    setPipelineState("scoring");
    let scores = [];
    try {
      const r = await callScoringBot(ideas, analyses);
      scores = r.scores || [];
      setScoringItems(scores);
    } catch (e) { setError(`Scoring: ${e.message}`); setPipelineState("idle"); return; }

    setPipelineState("reporting");
    let berichte = [];
    try {
      const r = await callBerichtBot(ideas, analyses, scores);
      berichte = r.berichte || [];
      setBerichtItems(berichte);
    } catch (e) { setError(`Bericht: ${e.message}`); setPipelineState("idle"); return; }

    setPipelineState("generating");
    try {
      const r = await callPromptBot(berichte, ideas);
      const items = r.selected || [];
      setPipelineItems(items);
      setPipelineState("done");
      fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "FreeBots — Pipeline fertig!",
          message: `${items.length} Build-Prompt${items.length !== 1 ? "s" : ""} bereit:\n${items.map((it, i) => `${i + 1}. ${it.title}`).join("\n")}`,
        }),
      }).catch(() => {});
    } catch (e) { setError(`Prompt Generator: ${e.message}`); setPipelineState("idle"); }
  };

  const handleSendNtfy = async () => {
    const topIdeas = pipelineItems.slice(0, 3).map((p, i) => `${i + 1}. ${p.title}`).join("\n");
    try {
      await sendNtfyNotification(`Build-Prompts fertig!\n\n${topIdeas}`, "FreeBots — Prompts bereit");
      setNtfyStatus("sent");
      setTimeout(() => setNtfyStatus("idle"), 4000);
    } catch (e) {
      setError(`Notify: ${e.message}`);
      setNtfyStatus("error");
      setTimeout(() => setNtfyStatus("idle"), 3000);
    }
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleDownload = (item, idx) => {
    const content = `# ${item.title}\n\n**Stack:** ${item.stack}\n**Typ:** ${item.isMobile ? "📱 Mobile App (React Native + Expo)" : "🌐 Web App"}\n**Begründung:** ${item.stackReason}\n\n---\n\n## Build-Prompt für Claude Code\n\n${item.prompt}`;
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `build-prompt-${idx + 1}-${item.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 30)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBuildN8n = async (item, idx) => {
    setBuildStatus(s => ({ ...s, [idx]: "sending" }));
    try {
      const res = await fetch("http://localhost:5678/webhook/freebots-build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: item.title, prompt: item.prompt, stack: item.stack || "" }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setBuildStatus(s => ({ ...s, [idx]: "sent" }));
      setTimeout(() => setBuildStatus(s => ({ ...s, [idx]: "idle" })), 5000);
    } catch (e) {
      setError(`Build: ${e.message}`);
      setBuildStatus(s => ({ ...s, [idx]: "error" }));
      setTimeout(() => setBuildStatus(s => ({ ...s, [idx]: "idle" })), 4000);
    }
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
              { id: "pipeline", label: "🚀 Pipeline", count: pipelineItems.length },
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
              ) : (
                <>
                  {ideas.map((idea, i) => <IdeaCard key={idea.id} idea={idea} index={i} />)}
                  <button
                    onClick={handleStartPipeline}
                    disabled={["analysing","scoring","reporting","generating"].includes(pipelineState)}
                    style={{
                      width: "100%", marginTop: 8, marginBottom: 12, padding: "10px 0",
                      background: ["analysing","scoring","reporting","generating"].includes(pipelineState) ? "transparent" : "linear-gradient(135deg, #7c3aed, #ea580c)",
                      border: ["analysing","scoring","reporting","generating"].includes(pipelineState) ? "1px solid #7c3aed44" : "none",
                      borderRadius: 8, color: ["analysing","scoring","reporting","generating"].includes(pipelineState) ? "#7c3aed66" : "#fff",
                      fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", letterSpacing: 1,
                    }}
                  >
                    {["analysing","scoring","reporting","generating"].includes(pipelineState) ? "⏳ Pipeline läuft..." : pipelineState === "done" ? "↺ Neu starten" : "🚀 PIPELINE STARTEN"}
                  </button>
                </>
              )}
              <div ref={ideasEndRef} />
            </div>
          )}

          {activeTab === "pipeline" && (
            <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px" }}>

              {/* Phase stepper */}
              {pipelineState !== "idle" && (() => {
                const phases = [
                  { id: "analysing",  done: ["scoring","reporting","generating","done"], label: "1. Analyse",  icon: "🔍" },
                  { id: "scoring",    done: ["reporting","generating","done"],            label: "2. Go/No-Go", icon: "🎯" },
                  { id: "reporting",  done: ["generating","done"],                        label: "3. Bericht",  icon: "📋" },
                  { id: "generating", done: ["done"],                                     label: "4. Prompts",  icon: "✍️" },
                ];
                return (
                  <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
                    {phases.map(p => {
                      const isActive = pipelineState === p.id;
                      const isDone = p.done.includes(pipelineState);
                      return (
                        <div key={p.id} style={{
                          flex: 1, padding: "6px 4px", borderRadius: 8, textAlign: "center",
                          background: isDone ? "#3dba7e12" : isActive ? "#7c3aed12" : "var(--c-card)",
                          border: `1px solid ${isDone ? "#3dba7e33" : isActive ? "#7c3aed33" : "var(--c-border)"}`,
                        }}>
                          <div style={{ fontSize: 12, marginBottom: 2 }}>{p.icon}</div>
                          <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5, color: isDone ? "#3dba7e" : isActive ? "#7c3aed" : "var(--c-tf)" }}>{p.label}</div>
                          {isDone && <div style={{ fontSize: 7, color: "#3dba7e88" }}>✓</div>}
                          {isActive && <div style={{ fontSize: 7, color: "#7c3aed88", animation: "pulse 1.5s infinite" }}>●</div>}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* IDLE */}
              {pipelineState === "idle" && (
                <div style={{ color: "var(--c-tf)", fontSize: 10, textAlign: "center", marginTop: 30 }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>🚀</div>
                  Geh zum Ideen-Tab und starte die Pipeline.
                </div>
              )}

              {/* PHASE 1 loading */}
              {pipelineState === "analysing" && analyseItems.length === 0 && (
                <div style={{ textAlign: "center", marginTop: 30 }}>
                  <div style={{ fontSize: 28, marginBottom: 10, animation: "pulse 1.5s infinite" }}>🔍</div>
                  <div style={{ color: "#7c3aed", fontWeight: 700, fontSize: 11, marginBottom: 4 }}>10-Punkte Analyse läuft...</div>
                  <div style={{ color: "var(--c-tf)", fontSize: 10 }}>Bewertet Problemdefinition, Markt, MVP & mehr.</div>
                </div>
              )}

              {/* PHASE 1 — Analyse */}
              {analyseItems.length > 0 && (() => {
                const dlAnalyse = () => {
                  const content = analyseItems.map(item => {
                    const checks = (item.checklist || []).map(c => `${c.verdict} **${c.name}**: ${c.text}`).join("\n");
                    const erfuellt = (item.bonus?.erfuellt || []).join(", ");
                    const fehlt = (item.bonus?.fehlt || []).join(", ");
                    return `## ${item.title}\n\n${checks}\n\n**Erfüllt:** ${erfuellt}\n**Fehlt:** ${fehlt}`;
                  }).join("\n\n---\n\n");
                  const blob = new Blob([`# Analyse-Bericht\n\n${content}`], { type: "text/markdown" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a"); a.href = url; a.download = "analyse-bericht.md"; a.click(); URL.revokeObjectURL(url);
                };
                return (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <div style={{ color: "#7c3aed", fontSize: 9, fontWeight: 700, letterSpacing: 1 }}>🔍 PHASE 1 — ANALYSE</div>
                      <button onClick={dlAnalyse} style={{ padding: "3px 10px", background: "#7c3aed18", border: "1px solid #7c3aed33", borderRadius: 5, color: "#7c3aed", fontSize: 9, cursor: "pointer", fontFamily: "inherit" }}>⬇ Alle downloaden</button>
                    </div>
                    {analyseItems.map((item, idx) => (
                      <div key={idx} style={{ background: "var(--c-card)", border: "1px solid #7c3aed22", borderRadius: 10, padding: "10px 12px", marginBottom: 8 }}>
                        <div style={{ color: "#7c3aed", fontSize: 10, fontWeight: 700, marginBottom: 8 }}>{item.title}</div>
                        {(item.checklist || []).map((c, i) => (
                          <div key={i} style={{ display: "flex", gap: 6, padding: "4px 0", borderBottom: i < 9 ? "1px solid var(--c-border)" : "none" }}>
                            <span style={{ flexShrink: 0, width: 16, textAlign: "center", fontSize: 11 }}>{c.verdict}</span>
                            <div style={{ flex: 1 }}>
                              <span style={{ color: "var(--c-ts)", fontSize: 9, fontWeight: 700 }}>{c.nr}. {c.name}</span>
                              <div style={{ color: "var(--c-td)", fontSize: 9, lineHeight: 1.4, marginTop: 1 }}>{c.text}</div>
                            </div>
                          </div>
                        ))}
                        {item.bonus && (
                          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                            <div style={{ flex: 1, background: "#3dba7e0a", border: "1px solid #3dba7e22", borderRadius: 6, padding: "6px 8px" }}>
                              <div style={{ color: "#3dba7e", fontSize: 8, fontWeight: 700, marginBottom: 3 }}>✅ ERFÜLLT</div>
                              {(item.bonus.erfuellt || []).map((e, i) => <div key={i} style={{ color: "var(--c-td)", fontSize: 8 }}>• {e}</div>)}
                            </div>
                            <div style={{ flex: 1, background: "#ff4d6d0a", border: "1px solid #ff4d6d22", borderRadius: 6, padding: "6px 8px" }}>
                              <div style={{ color: "#ff4d6d", fontSize: 8, fontWeight: 700, marginBottom: 3 }}>❌ FEHLT</div>
                              {(item.bonus.fehlt || []).map((e, i) => <div key={i} style={{ color: "var(--c-td)", fontSize: 8 }}>• {e}</div>)}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* PHASE 2 loading */}
              {pipelineState === "scoring" && scoringItems.length === 0 && (
                <div style={{ textAlign: "center", marginTop: 10, marginBottom: 20 }}>
                  <div style={{ fontSize: 24, marginBottom: 8, animation: "pulse 1.5s infinite" }}>🎯</div>
                  <div style={{ color: "#e8a838", fontWeight: 700, fontSize: 11, marginBottom: 4 }}>Go/No-Go Scoring läuft...</div>
                  <div style={{ color: "var(--c-tf)", fontSize: 10 }}>8 Kategorien × 3 Punkte = max. 24 Punkte.</div>
                </div>
              )}

              {/* PHASE 2 — Go/No-Go */}
              {scoringItems.length > 0 && (() => {
                const dlScoring = () => {
                  const content = scoringItems.map(item => {
                    const kats = (item.kategorien || []).map(k => `- ${k.name}: ${k.punkte}/${k.max} — ${k.kommentar}`).join("\n");
                    const rc = item.realityCheck || {};
                    return `## ${item.title}\n\n${kats}\n\n**Gesamt: ${item.gesamt}/24** — ${item.entscheidung} ${item.emoji}\n\nReality Check:\n- Würde jemand zahlen: ${rc.wuerdejemandZahlen ? "Ja" : "Nein"}\n- Würde jemand suchen: ${rc.wuerdejemandSuchen ? "Ja" : "Nein"}\n- Kann MVP: ${rc.kannInMVP ? "Ja" : "Nein"}\n\nProfi: ${item.profi?.fazit || ""}`;
                  }).join("\n\n---\n\n");
                  const blob = new Blob([`# Go/No-Go Bewertung\n\n${content}`], { type: "text/markdown" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a"); a.href = url; a.download = "go-nogo-bewertung.md"; a.click(); URL.revokeObjectURL(url);
                };
                return (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <div style={{ color: "#e8a838", fontSize: 9, fontWeight: 700, letterSpacing: 1 }}>🎯 PHASE 2 — GO/NO-GO SCORING</div>
                      <button onClick={dlScoring} style={{ padding: "3px 10px", background: "#e8a83818", border: "1px solid #e8a83833", borderRadius: 5, color: "#e8a838", fontSize: 9, cursor: "pointer", fontFamily: "inherit" }}>⬇ Alle downloaden</button>
                    </div>
                    {scoringItems.map((item, idx) => {
                      const dec = item.entscheidung || "";
                      const decColor = (dec.includes("BAUEN") && !dec.includes("NICHT")) ? "#3dba7e" : dec.includes("VERBESSERN") ? "#e8a838" : "#ff4d6d";
                      return (
                        <div key={idx} style={{ background: "var(--c-card)", border: `1px solid ${decColor}22`, borderRadius: 10, padding: "10px 12px", marginBottom: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                            <span style={{ color: "var(--c-ts)", fontSize: 10, fontWeight: 700 }}>{item.title}</span>
                            <span style={{ marginLeft: "auto", background: `${decColor}18`, border: `1px solid ${decColor}44`, color: decColor, borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>{item.emoji} {item.entscheidung} — {item.gesamt}/24</span>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginBottom: 8 }}>
                            {(item.kategorien || []).map((k, i) => (
                              <div key={i} style={{ background: "var(--c-overlay)", borderRadius: 5, padding: "5px 7px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                                  <span style={{ color: "var(--c-ts)", fontSize: 8 }}>{k.name}</span>
                                  <span style={{ color: k.punkte >= 2 ? "#3dba7e" : k.punkte === 1 ? "#e8a838" : "#ff4d6d", fontSize: 9, fontWeight: 700 }}>{k.punkte}/{k.max}</span>
                                </div>
                                <div style={{ color: "var(--c-td)", fontSize: 8, lineHeight: 1.3 }}>{k.kommentar}</div>
                              </div>
                            ))}
                          </div>
                          {item.realityCheck && (
                            <div style={{ display: "flex", gap: 5, marginBottom: 6 }}>
                              {[
                                ["💸 zahlen?", item.realityCheck.wuerdejemandZahlen],
                                ["🔍 suchen?", item.realityCheck.wuerdejemandSuchen],
                                ["⚡ MVP?", item.realityCheck.kannInMVP],
                              ].map(([label, val], i) => (
                                <div key={i} style={{ flex: 1, background: val ? "#3dba7e0a" : "#ff4d6d0a", border: `1px solid ${val ? "#3dba7e33" : "#ff4d6d33"}`, borderRadius: 5, padding: "4px 6px", textAlign: "center" }}>
                                  <div style={{ fontSize: 8, color: "var(--c-td)", marginBottom: 1 }}>{label}</div>
                                  <div style={{ fontSize: 11 }}>{val ? "✅" : "❌"}</div>
                                </div>
                              ))}
                            </div>
                          )}
                          {item.profi?.fazit && (
                            <div style={{ color: "var(--c-tf)", fontSize: 8, fontStyle: "italic", borderTop: "1px solid var(--c-border)", paddingTop: 5 }}>
                              Profi-Check: {item.profi.fazit}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* PHASE 3 loading */}
              {pipelineState === "reporting" && berichtItems.length === 0 && (
                <div style={{ textAlign: "center", marginTop: 10, marginBottom: 20 }}>
                  <div style={{ fontSize: 24, marginBottom: 8, animation: "pulse 1.5s infinite" }}>📋</div>
                  <div style={{ color: "#3dba7e", fontWeight: 700, fontSize: 11, marginBottom: 4 }}>Entscheidungsbericht wird geschrieben...</div>
                  <div style={{ color: "var(--c-tf)", fontSize: 10 }}>Stärken, Risiken, Empfehlung.</div>
                </div>
              )}

              {/* PHASE 3 — Bericht */}
              {berichtItems.length > 0 && (() => {
                const dlBericht = () => {
                  const content = berichtItems.map(item => {
                    const staerken = (item.staerken || []).map(s => `- ✅ ${s}`).join("\n");
                    const risiken = (item.risiken || []).map(r => `- ⚠️ ${r}`).join("\n");
                    return `## ${item.name || item.title}\n\n${item.kurzbeschreibung}\n\n**Stärken:**\n${staerken}\n\n**Risiken:**\n${risiken}\n\n**Empfehlung:** ${item.empfehlung}`;
                  }).join("\n\n---\n\n");
                  const blob = new Blob([`# Entscheidungsbericht\n\n${content}`], { type: "text/markdown" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a"); a.href = url; a.download = "entscheidungsbericht.md"; a.click(); URL.revokeObjectURL(url);
                };
                return (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <div style={{ color: "#3dba7e", fontSize: 9, fontWeight: 700, letterSpacing: 1 }}>📋 PHASE 3 — ENTSCHEIDUNGSBERICHT</div>
                      <button onClick={dlBericht} style={{ padding: "3px 10px", background: "#3dba7e18", border: "1px solid #3dba7e33", borderRadius: 5, color: "#3dba7e", fontSize: 9, cursor: "pointer", fontFamily: "inherit" }}>⬇ Alle downloaden</button>
                    </div>
                    {berichtItems.map((item, idx) => (
                      <div key={idx} style={{ background: "var(--c-card)", border: "1px solid #3dba7e22", borderRadius: 10, padding: "10px 12px", marginBottom: 8 }}>
                        <div style={{ marginBottom: 6 }}>
                          <span style={{ color: "#3dba7e", fontSize: 11, fontWeight: 700 }}>{item.name || item.title}</span>
                          {item.name && item.name !== item.title && <span style={{ color: "var(--c-tf)", fontSize: 9, marginLeft: 6 }}>({item.title})</span>}
                        </div>
                        <div style={{ color: "var(--c-td)", fontSize: 10, lineHeight: 1.5, marginBottom: 8 }}>{item.kurzbeschreibung}</div>
                        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ color: "#3dba7e", fontSize: 8, fontWeight: 700, marginBottom: 4 }}>✅ STÄRKEN</div>
                            {(item.staerken || []).map((s, i) => (
                              <div key={i} style={{ display: "flex", gap: 4, marginBottom: 3 }}>
                                <span style={{ color: "#3dba7e44", fontSize: 8, flexShrink: 0 }}>▸</span>
                                <span style={{ color: "var(--c-td)", fontSize: 9, lineHeight: 1.4 }}>{s}</span>
                              </div>
                            ))}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ color: "#ff4d6d", fontSize: 8, fontWeight: 700, marginBottom: 4 }}>⚠️ RISIKEN</div>
                            {(item.risiken || []).map((r, i) => (
                              <div key={i} style={{ display: "flex", gap: 4, marginBottom: 3 }}>
                                <span style={{ color: "#ff4d6d44", fontSize: 8, flexShrink: 0 }}>▸</span>
                                <span style={{ color: "var(--c-td)", fontSize: 9, lineHeight: 1.4 }}>{r}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div style={{ background: "#3dba7e0a", border: "1px solid #3dba7e22", borderRadius: 7, padding: "7px 9px" }}>
                          <div style={{ color: "#3dba7e88", fontSize: 8, fontWeight: 700, marginBottom: 3 }}>EMPFEHLUNG</div>
                          <div style={{ color: "var(--c-ts)", fontSize: 10, lineHeight: 1.5 }}>{item.empfehlung}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* PHASE 4 loading */}
              {pipelineState === "generating" && pipelineItems.length === 0 && (
                <div style={{ textAlign: "center", marginTop: 10, marginBottom: 20 }}>
                  <div style={{ fontSize: 24, marginBottom: 8, animation: "pulse 1.5s infinite" }}>✍️</div>
                  <div style={{ color: "#ea580c", fontWeight: 700, fontSize: 11, marginBottom: 4 }}>Prompt Generator schreibt...</div>
                  <div style={{ color: "var(--c-tf)", fontSize: 10 }}>Wählt Stack, UI-Design, baut Build-Prompts.</div>
                </div>
              )}

              {/* PHASE 4 — Build Prompts */}
              {pipelineState === "done" && (
                <>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ color: "#ea580c", fontSize: 9, fontWeight: 700, letterSpacing: 1 }}>✍️ PHASE 4 — BUILD PROMPTS</div>
                    <div style={{ display: "flex", gap: 5 }}>
                      <button onClick={handleSendNtfy} style={{
                        padding: "3px 10px", borderRadius: 5, fontSize: 9, cursor: "pointer", fontFamily: "inherit",
                        background: ntfyStatus === "sent" ? "#3dba7e18" : ntfyStatus === "error" ? "#ff4d6d18" : "#7c3aed18",
                        color: ntfyStatus === "sent" ? "#3dba7e" : ntfyStatus === "error" ? "#ff4d6d" : "#7c3aed",
                        border: `1px solid ${ntfyStatus === "sent" ? "#3dba7e44" : ntfyStatus === "error" ? "#ff4d6d44" : "#7c3aed44"}`,
                      }}>{ntfyStatus === "sent" ? "✓ Gesendet" : ntfyStatus === "error" ? "✗ Fehler" : "🔔 Push"}</button>
                      <button onClick={() => {
                        const content = pipelineItems.map((item, i) => `# ${i + 1}. ${item.title}\n\n**Stack:** ${item.stack}\n**Typ:** ${item.isMobile ? "📱 Mobile App" : "🌐 Web App"}\n**Begründung:** ${item.stackReason}\n\n## Build-Prompt\n\n${item.prompt}`).join("\n\n---\n\n");
                        const blob = new Blob([content], { type: "text/markdown" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a"); a.href = url; a.download = "build-prompts.md"; a.click(); URL.revokeObjectURL(url);
                      }} style={{ padding: "3px 10px", background: "#ea580c18", border: "1px solid #ea580c33", borderRadius: 5, color: "#ea580c", fontSize: 9, cursor: "pointer", fontFamily: "inherit" }}>⬇ Alle downloaden</button>
                    </div>
                  </div>
                  {pipelineItems.map((item, idx) => (
                    <div key={idx} style={{ background: "var(--c-card)", border: "1px solid #ea580c22", borderRadius: 12, padding: "12px 14px", marginBottom: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <span style={{ color: "#ea580c", fontSize: 11, fontWeight: 700 }}>#{idx + 1} — {item.title}</span>
                        <span style={{ marginLeft: "auto", background: item.isMobile ? "#7c3aed18" : "#3dba7e18", border: `1px solid ${item.isMobile ? "#7c3aed33" : "#3dba7e33"}`, color: item.isMobile ? "#7c3aed88" : "#3dba7e88", fontSize: 8, padding: "1px 6px", borderRadius: 3 }}>{item.isMobile ? "📱 Mobile" : "🌐 Web"}</span>
                        <span style={{ background: "#ea580c18", border: "1px solid #ea580c33", color: "#ea580c88", fontSize: 8, padding: "1px 6px", borderRadius: 3 }}>{item.stack}</span>
                      </div>
                      {item.stackReason && (
                        <div style={{ color: "var(--c-tf)", fontSize: 9, fontStyle: "italic", marginBottom: 6 }}>{item.stackReason}</div>
                      )}
                      <div style={{ background: "var(--c-overlay)", border: "1px solid var(--c-border)", borderRadius: 7, padding: "8px 10px", maxHeight: 150, overflowY: "auto", marginBottom: 8 }}>
                        <pre style={{ color: "var(--c-ts)", fontSize: 9.5, margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.65, fontFamily: "inherit" }}>{item.prompt}</pre>
                      </div>
                      <div style={{ display: "flex", gap: 5 }}>
                        <button onClick={() => handleCopy(item.prompt, idx)} style={{
                          flex: 1, padding: "5px 0", background: copiedIdx === idx ? "#3dba7e18" : "var(--c-btn)",
                          border: `1px solid ${copiedIdx === idx ? "#3dba7e44" : "var(--c-border)"}`,
                          borderRadius: 5, color: copiedIdx === idx ? "#3dba7e" : "var(--c-ts)", fontSize: 9, cursor: "pointer", fontFamily: "inherit",
                        }}>{copiedIdx === idx ? "✓ Kopiert!" : "📋 Kopieren"}</button>
                        <button onClick={() => handleDownload(item, idx)} style={{
                          flex: 1, padding: "5px 0", background: "var(--c-btn)", border: "1px solid var(--c-border)",
                          borderRadius: 5, color: "var(--c-ts)", fontSize: 9, cursor: "pointer", fontFamily: "inherit",
                        }}>⬇ .md</button>
                        <button onClick={() => handleBuildN8n(item, idx)} disabled={buildStatus[idx] === "sending"} style={{
                          flex: 2, padding: "5px 0", borderRadius: 5, fontSize: 9, fontWeight: 700,
                          cursor: buildStatus[idx] === "sending" ? "not-allowed" : "pointer", fontFamily: "inherit",
                          background: buildStatus[idx] === "sent" ? "#3dba7e18" : buildStatus[idx] === "error" ? "#ff4d6d18" : "linear-gradient(135deg,#7c3aed,#ea580c)",
                          border: buildStatus[idx] === "sent" ? "1px solid #3dba7e44" : buildStatus[idx] === "error" ? "1px solid #ff4d6d44" : "none",
                          color: buildStatus[idx] === "sent" ? "#3dba7e" : buildStatus[idx] === "error" ? "#ff4d6d" : "#fff",
                        }}>
                          {buildStatus[idx] === "sending" ? "⏳ Wird gesendet..." : buildStatus[idx] === "sent" ? "✓ n8n gestartet!" : buildStatus[idx] === "error" ? "✗ Fehler" : "▶ Build starten"}
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
