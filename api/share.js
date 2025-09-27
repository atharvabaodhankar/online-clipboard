// api/share.js
import { db, clipboardEntries } from "./db.js";  // import clipboardEntries from db.js

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    try {
      await db.insert(clipboardEntries).values({ code, content: text, expiresAt });
      res.status(200).json({ code });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
