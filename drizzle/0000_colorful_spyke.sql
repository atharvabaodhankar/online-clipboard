CREATE TABLE "clipboard_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(4) NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp
);
