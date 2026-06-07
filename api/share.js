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
    const { type = "text", content, fileName, fileUrl, rawUrl, fileId, provider, size, expiresAt, maxViews = 999 } = req.body;

    // Validation
    if (type === "text" && !content) {
      return res.status(400).json({ error: "Content is required for text sharing" });
    }
    if (type === "file" && (!fileName || !fileUrl)) {
      return res.status(400).json({ error: "fileName and fileUrl are required for file sharing" });
    }

    try {
      // 1. Generate Unique 4-digit Code (Collision Check in Redis)
      let code;
      let isUnique = false;
      let attempts = 0;
      
      while (!isUnique && attempts < 10) {
        code = Math.floor(1000 + Math.random() * 9000).toString();
        const key = `clipboard:${code}`;
        const exists = await redis.exists(key);
        
        if (exists === 0) {
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique) {
        return res.status(500).json({ error: "System busy. Please try again later." });
      }
      
      // 2. Calculate expiry
      const timeMap = {
        "1h": 60 * 60,
        "1d": 24 * 60 * 60,
        "7d": 7 * 24 * 60 * 60
      };
      const ttlSeconds = timeMap[expiresAt] || timeMap["1d"];
      const key = `clipboard:${code}`;

      // 3. Construct the record
      const record = {
        code,
        type,
        createdAt: Date.now(),
        expiresAt: Date.now() + (ttlSeconds * 1000),
        views: 0,
        maxViews: Number(maxViews) || 999,
      };

      if (type === "text") {
        record.content = content;
      } else {
        record.provider = provider || "storage.to";
        record.fileId = fileId;
        record.fileName = fileName;
        record.fileUrl = fileUrl;
        record.rawUrl = rawUrl || fileUrl;
        record.size = size || "Unknown size";
      }

      // 4. Insert new entry in Redis with TTL
      await redis.set(key, JSON.stringify(record), { ex: ttlSeconds });
      
      res.status(200).json({ code });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}


