import { createServer } from "http";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

let ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
let NTFY_TOPIC = process.env.NTFY_TOPIC;

try {
  const env = readFileSync(join(__dirname, ".env"), "utf8");
  const get = (key) => env.match(new RegExp(`${key}=(.+)`))?.[1]?.trim();
  if (!ANTHROPIC_API_KEY) ANTHROPIC_API_KEY = get("ANTHROPIC_API_KEY");
  if (!NTFY_TOPIC)        NTFY_TOPIC        = get("NTFY_TOPIC");
} catch {}

const requests = new Map();

const server = createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }

  if (req.method === "POST" && req.url === "/api/bot") {
    const ip = req.socket.remoteAddress || "unknown";
    const count = requests.get(ip) || 0;
    if (count >= 50) {
      res.writeHead(429, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Zu viele Anfragen." }));
      return;
    }
    requests.set(ip, count + 1);
    setTimeout(() => requests.delete(ip), 3600000);

    let body = "";
    req.on("data", chunk => (body += chunk));
    req.on("end", async () => {
      try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
          },
          body,
        });
        const data = await response.json();
        res.writeHead(response.status, { "Content-Type": "application/json" });
        res.end(JSON.stringify(data));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Push-Benachrichtigung via ntfy.sh
  if (req.method === "POST" && req.url === "/api/notify") {
    let body = "";
    req.on("data", chunk => (body += chunk));
    req.on("end", async () => {
      try {
        const { message, title } = JSON.parse(body);
        const t = encodeURIComponent(title || "FreeBots");
        const ntfyRes = await fetch(
          `https://ntfy.sh/${NTFY_TOPIC}?title=${t}&priority=default&tags=robot`,
          { method: "POST", body: message }
        );
        res.writeHead(ntfyRes.ok ? 200 : 500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: ntfyRes.ok }));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end();
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`API server running on port ${PORT}`));
