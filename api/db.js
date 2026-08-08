/* global process */
// api/db.js
import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL ? process.env.UPSTASH_REDIS_REST_URL.replace(/^["']+|["']+$|\s+/g, '') : '';
const token = process.env.UPSTASH_REDIS_REST_TOKEN ? process.env.UPSTASH_REDIS_REST_TOKEN.replace(/^["']+|["']+$|\s+/g, '') : '';

export const redis = new Redis({
  url,
  token,
});

