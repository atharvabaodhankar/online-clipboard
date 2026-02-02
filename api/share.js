import { db, clipboardEntries } from "./db.js";
import { and, eq, gt, lt } from "drizzle-orm";

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

    try {
      // 1. Lazy Cleanup: Remove expired entries to free up codes
      await db.delete(clipboardEntries).where(lt(clipboardEntries.expiresAt, new Date()));

      // 2. Generate Unique 4-digit Code (Collision Check)
      let code;
      let isUnique = false;
      let attempts = 0;
      
      while (!isUnique && attempts < 10) {
        code = Math.floor(1000 + Math.random() * 9000).toString();
        const existing = await db
          .select()
          .from(clipboardEntries)
          .where(and(eq(clipboardEntries.code, code), gt(clipboardEntries.expiresAt, new Date())))
          .limit(1);
        
        if (existing.length === 0) {
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique) {
        return res.status(500).json({ error: "System busy. Please try again later." });
      }
      
      // 3. Calculate expiry
      const timeMap = {
        "1h": 60 * 60 * 1000,
        "1d": 24 * 60 * 60 * 1000,
        "7d": 7 * 24 * 60 * 60 * 1000
      };
      const timeOffset = timeMap[expiresAt] || timeMap["1d"];
      const calculatedExpiresAt = new Date(Date.now() + timeOffset);

      // 4. Insert new entry
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
