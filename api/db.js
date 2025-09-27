// api/db.js
import { Client } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/node-postgres";
import { clipboardEntries } from "../src/db/schema.js";  // ✅ correct path

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

await client.connect();

export const db = drizzle(client);
export { clipboardEntries };  // <-- make sure to export it here too
