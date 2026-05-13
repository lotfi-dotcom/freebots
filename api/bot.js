const requests = new Map();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ip = req.headers["x-forwarded-for"]?.split(",")[0].trim()
    || req.socket?.remoteAddress
    || "unknown";

  const count = requests.get(ip) || 0;
  if (count >= 20) {
    return res.status(429).json({ error: "Zu viele Anfragen. Bitte warte eine Stunde." });
  }
  requests.set(ip, count + 1);
  setTimeout(() => requests.delete(ip), 3600000);

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
