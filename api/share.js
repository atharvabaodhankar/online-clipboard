// api/share.js
import { db, clipboardEntries } from "./db.js";  // import clipboardEntries from db.js

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "POST") {
    const { content, expiresAt } = req.body;
    if (!content) return res.status(400).json({ error: "Content is required" });

    const code = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Handle expiry time based on the expiresAt parameter
    let calculatedExpiresAt;
    if (expiresAt === "never") {
      calculatedExpiresAt = null;
    } else {
      const timeMap = {
        "1h": 60 * 60 * 1000,
        "1d": 24 * 60 * 60 * 1000,
        "7d": 7 * 24 * 60 * 60 * 1000
      };
      const timeOffset = timeMap[expiresAt] || timeMap["1d"];
      calculatedExpiresAt = new Date(Date.now() + timeOffset);
    }

    try {
      await db.insert(clipboardEntries).values({ 
        code, 
        content, 
        expiresAt: calculatedExpiresAt 
      });
      res.status(200).json({ code });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
