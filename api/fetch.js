// api/fetch.js
import { db, clipboardEntries } from "./db.js";
import { eq, and, gt } from "drizzle-orm";

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
      const result = await db
        .select()
        .from(clipboardEntries)
        .where(
          and(
            eq(clipboardEntries.code, code),
            // Only check expiry if expiresAt is not null
            clipboardEntries.expiresAt === null ? undefined : gt(clipboardEntries.expiresAt, new Date())
          )
        )
        .limit(1);

      if (result.length === 0) {
        return res.status(404).json({ error: "Code not found or expired" });
      }

      res.status(200).json({ content: result[0].content });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}