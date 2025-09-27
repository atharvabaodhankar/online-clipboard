import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  schema: "./src/db/schema.js",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // ❌ not "connectionString"
    url: process.env.DATABASE_URL, // ✅ correct key
  },
});
