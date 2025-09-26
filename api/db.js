// api/db.js
import { Client } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/node-postgres";
import { clipboardEntries } from "../src/db/schema.js";

// Connect to NeonDB
const client = new Client({
  connectionString: process.env.DATABASE_URL, // stored in .env
});

await client.connect();

// Drizzle ORM instance
export const db = drizzle(client);
