-- Create conversations table
CREATE TABLE IF NOT EXISTS "conversations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
	"buyer_id" varchar NOT NULL,
	"admin_id" varchar NOT NULL,
	"subject" text,
	"status" text DEFAULT 'active',
	"last_message_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS "messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
	"conversation_id" varchar NOT NULL,
	"sender_id" varchar NOT NULL,
	"sender_type" text NOT NULL,
	"content" text,
	"message_type" text DEFAULT 'text',
	"attachments" json,
	"is_read" boolean DEFAULT false,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now()
);

-- Add foreign key constraints
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "conversations_buyer_id_idx" ON "conversations" ("buyer_id");
CREATE INDEX IF NOT EXISTS "conversations_admin_id_idx" ON "conversations" ("admin_id");
CREATE INDEX IF NOT EXISTS "conversations_status_idx" ON "conversations" ("status");
CREATE INDEX IF NOT EXISTS "conversations_last_message_at_idx" ON "conversations" ("last_message_at");
CREATE INDEX IF NOT EXISTS "messages_conversation_id_idx" ON "messages" ("conversation_id");
CREATE INDEX IF NOT EXISTS "messages_sender_id_idx" ON "messages" ("sender_id");
CREATE INDEX IF NOT EXISTS "messages_created_at_idx" ON "messages" ("created_at");
CREATE INDEX IF NOT EXISTS "messages_is_read_idx" ON "messages" ("is_read");
