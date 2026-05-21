CREATE TYPE "public"."cooking_note_type" AS ENUM('tip', 'substitution', 'preference', 'warning', 'joke_fact');--> statement-breakpoint
CREATE TYPE "public"."cooking_session_status" AS ENUM('gathering_prefs', 'confirmed', 'cooking', 'completed', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."ingredient_status" AS ENUM('pending', 'added', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."step_status" AS ENUM('pending', 'active', 'done', 'skipped');--> statement-breakpoint
CREATE TABLE "cooking_ingredients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"name" text NOT NULL,
	"quantity" text,
	"unit" text,
	"status" "ingredient_status" DEFAULT 'pending' NOT NULL,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cooking_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"content" text NOT NULL,
	"note_type" "cooking_note_type" DEFAULT 'tip' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cooking_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"dish_name" text NOT NULL,
	"status" "cooking_session_status" DEFAULT 'gathering_prefs' NOT NULL,
	"preferences" jsonb,
	"total_steps" integer DEFAULT 0,
	"current_step" integer DEFAULT 0,
	"started_at" timestamp with time zone DEFAULT now(),
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cooking_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"step_number" integer NOT NULL,
	"instruction" text NOT NULL,
	"duration_minutes" integer,
	"status" "step_status" DEFAULT 'pending' NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cooking_ingredients" ADD CONSTRAINT "cooking_ingredients_session_id_cooking_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."cooking_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cooking_notes" ADD CONSTRAINT "cooking_notes_session_id_cooking_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."cooking_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cooking_sessions" ADD CONSTRAINT "cooking_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cooking_steps" ADD CONSTRAINT "cooking_steps_session_id_cooking_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."cooking_sessions"("id") ON DELETE cascade ON UPDATE no action;