// api/fetch.js
import { redis } from "./db.js";

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "POST") {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: "Code is required" });

    try {
      const storedVal = await redis.get(`clipboard:${code}`);

      if (!storedVal) {
        return res.status(404).json({ error: "Code not found or expired" });
      }

      let record;
      try {
        record = typeof storedVal === "string" ? JSON.parse(storedVal) : storedVal;
        // Make sure it has type, views, maxViews
        if (!record.type) {
          throw new Error("Invalid schema");
        }
      } catch {
        // Legacy fallback
        record = {
          code,
          type: "text",
          content: typeof storedVal === "string" ? storedVal : JSON.stringify(storedVal),
          views: 0,
          maxViews: 999,
          createdAt: Date.now(),
          expiresAt: Date.now() + 24 * 60 * 60 * 1000
        };
      }

      // Update views
      record.views = (record.views || 0) + 1;

      // Handle deletion if maxViews reached
      const key = `clipboard:${code}`;
      if (record.maxViews && record.views >= record.maxViews) {
        await redis.del(key);
      } else {
        const remainingTtl = Math.max(1, Math.round((record.expiresAt - Date.now()) / 1000));
        await redis.set(key, JSON.stringify(record), { ex: remainingTtl });
      }

      res.status(200).json({
        content: record.content || "",
        record
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}