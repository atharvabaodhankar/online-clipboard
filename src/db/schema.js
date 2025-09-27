// src/db/schema.js
import { pgTable, serial, varchar, text, timestamp } from "drizzle-orm/pg-core";

export const clipboardEntries = pgTable("clipboard_entries", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 4 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
});
