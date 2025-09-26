// src/db/schema.js
const { pgTable, serial, varchar, text, timestamp } = require("drizzle-orm/pg-core");

const clipboardEntries = pgTable("clipboard_entries", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 4 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
});

module.exports = { clipboardEntries };
