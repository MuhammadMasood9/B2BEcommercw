-- Add online status fields to users table
ALTER TABLE "users" ADD COLUMN "is_online" boolean DEFAULT false;
ALTER TABLE "users" ADD COLUMN "last_seen" timestamp;

