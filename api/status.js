import { redis } from "./db.js";

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // Check Redis connectivity
    const redisStatus = await redis.ping();
    
    if (redisStatus === "PONG") {
      return res.status(200).json({
        status: "ok",
        database: "connected",
        timestamp: new Date().toISOString()
      });
    } else {
      throw new Error("Redis did not respond with PONG");
    }
  } catch (err) {
    console.error("Status endpoint error:", err);
    return res.status(500).json({
      status: "error",
      database: "disconnected",
      message: err.message,
      timestamp: new Date().toISOString()
    });
  }
}
