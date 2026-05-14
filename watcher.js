import { readdirSync, readFileSync, renameSync, mkdirSync, writeFileSync } from "fs";
import { spawn, execSync } from "child_process";
import { join, basename } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const QUEUE_DIR  = join(__dirname, "build-queue");
const DONE_DIR   = join(__dirname, "build-queue", "done");
const APPS_DIR   = join(__dirname, "built-apps");
const NTFY_TOPIC = "freebots-lotfi";

[QUEUE_DIR, DONE_DIR, APPS_DIR].forEach(d => mkdirSync(d, { recursive: true }));

const processing = new Set();

console.log("👀 Watcher läuft — wartet auf Build-Prompts in ./build-queue/");
console.log("📁 Fertige Apps landen in ./built-apps/\n");

async function notify(message, title = "FreeBots Watcher") {
  try {
    await fetch(`https://ntfy.sh/${NTFY_TOPIC}?title=${encodeURIComponent(title)}`, {
      method: "POST", body: message,
    });
  } catch {}
}

function processFile(filename) {
  if (processing.has(filename)) return;
  processing.add(filename);

  const filePath = join(QUEUE_DIR, filename);
  const appName  = basename(filename, ".md");
  const appDir   = join(APPS_DIR, appName);

  mkdirSync(appDir, { recursive: true });

  let promptText;
  try {
    promptText = readFileSync(filePath, "utf8").trim();
  } catch {
    processing.delete(filename);
    return;
  }

  // Write prompt as PROMPT.md inside the app dir so Claude Code sees it
  writeFileSync(join(appDir, "PROMPT.md"), promptText);

  console.log(`\n🚀 BUILD START: ${appName}`);
  console.log(`📂 ${appDir}\n`);
  notify(`Build gestartet: ${appName}`, "🚀 FreeBots Build");

  // Run Claude Code in print mode — liest PROMPT.md und baut die App
  const claude = spawn(
    "claude",
    ["-p", promptText, "--dangerously-skip-permissions"],
    { cwd: appDir, stdio: "inherit", shell: true }
  );

  claude.on("error", (err) => {
    console.error(`❌ Claude Code nicht gefunden: ${err.message}`);
    console.error("   Stelle sicher dass 'claude' im PATH ist (npm install -g @anthropic-ai/claude-code)");
    processing.delete(filename);
  });

  claude.on("close", (code) => {
    if (code === 0) {
      console.log(`\n✅ BUILD FERTIG: ${appName}`);

      // Git commit
      try {
        try { execSync("git init", { cwd: appDir, stdio: "pipe" }); } catch {}
        execSync("git add .", { cwd: appDir, stdio: "pipe" });
        execSync(`git commit -m "${appName}: initial build by FreeBots"`, {
          cwd: appDir, stdio: "pipe",
        });
        console.log("📦 Git commit erstellt");

        // Push falls remote existiert
        try {
          execSync("git push", { cwd: appDir, stdio: "pipe" });
          console.log("⬆️  Git push erfolgreich");
          notify(`${appName} gebaut & gepusht!`, "✅ FreeBots Done");
        } catch {
          console.log("ℹ️  Kein Remote konfiguriert — nur lokal committed");
          notify(`${appName} fertig gebaut (lokal)`, "✅ FreeBots Done");
        }
      } catch (e) {
        console.log("⚠️  Git:", e.message);
        notify(`${appName} fertig (Git-Fehler)`, "⚠️ FreeBots");
      }

      // Prompt archivieren
      try {
        renameSync(filePath, join(DONE_DIR, filename));
        console.log("📌 Prompt → build-queue/done/");
      } catch {}

    } else {
      console.log(`\n❌ BUILD FEHLGESCHLAGEN: ${appName} (exit ${code})`);
      notify(`Build fehlgeschlagen: ${appName}`, "❌ FreeBots");
    }

    processing.delete(filename);
  });
}

// Alle 3 Sekunden auf neue .md Dateien prüfen
setInterval(() => {
  try {
    readdirSync(QUEUE_DIR)
      .filter(f => f.endsWith(".md") && !f.startsWith("."))
      .forEach(f => processFile(f));
  } catch {}
}, 3000);
