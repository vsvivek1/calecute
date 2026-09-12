CREATE TYPE "public"."agent_status" AS ENUM('PENDING_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED', 'WAITLISTED', 'WITHDRAWN');--> statement-breakpoint
CREATE TYPE "public"."commission_status" AS ENUM('ACCRUED', 'APPROVED', 'PAID', 'CANCELLED', 'FORFEITED');--> statement-breakpoint
CREATE TYPE "public"."computer_literacy" AS ENUM('YES', 'BASIC', 'NO');--> statement-breakpoint
CREATE TYPE "public"."customer_status" AS ENUM('LEAD', 'TRIAL', 'ACTIVE', 'LAPSED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."data_completeness" AS ENUM('COMPLETE', 'PARTIAL', 'PENDING');--> statement-breakpoint
CREATE TYPE "public"."education_level" AS ENUM('SSLC', 'PLUS_TWO', 'DEGREE', 'PG', 'DIPLOMA', 'ITI', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."hours_available" AS ENUM('ONE', 'TWO_TO_THREE', 'FOUR_PLUS', 'FULL_TIME');--> statement-breakpoint
CREATE TYPE "public"."local_body_type" AS ENUM('GRAM_PANCHAYAT', 'MUNICIPALITY', 'CORPORATION');--> statement-breakpoint
CREATE TYPE "public"."pan_status" AS ENUM('NOT_SUBMITTED', 'PENDING_VERIFICATION', 'VERIFIED', 'REJECTED', 'DUPLICATE_CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."payout_batch_status" AS ENUM('DRAFT', 'PROCESSING', 'PAID', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."review_flag_kind" AS ENUM('MULTIPLE_SIGNUPS_ONE_DEVICE', 'PANCHAYAT_SIGNUP_SPIKE', 'DUPLICATE_PAN', 'HONEYPOT_TRIPPED', 'SUBMITTED_TOO_FAST');--> statement-breakpoint
CREATE TYPE "public"."review_flag_status" AS ENUM('OPEN', 'DISMISSED', 'ACTIONED');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('AGENT', 'DISTRICT_ADMIN', 'SUPER_ADMIN');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('ACTIVE', 'SUSPENDED', 'DELETED');--> statement-breakpoint
CREATE TABLE "admin_districts" (
	"user_id" bigint NOT NULL,
	"district_id" bigint NOT NULL,
	"assigned_by" bigint,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_districts_user_id_district_id_pk" PRIMARY KEY("user_id","district_id")
);
--> statement-breakpoint
CREATE TABLE "agent_code_sequences" (
	"district_id" bigint PRIMARY KEY NOT NULL,
	"next_seq" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_message_recipients" (
	"message_id" bigint NOT NULL,
	"agent_id" bigint NOT NULL,
	"read_at" timestamp with time zone,
	CONSTRAINT "agent_message_recipients_message_id_agent_id_pk" PRIMARY KEY("message_id","agent_id")
);
--> statement-breakpoint
CREATE TABLE "agent_messages" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"sender_user_id" bigint NOT NULL,
	"subject" text NOT NULL,
	"body_ml" text,
	"body_en" text,
	"audience_filter" jsonb,
	"recipient_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_products" (
	"agent_id" bigint NOT NULL,
	"product_id" bigint NOT NULL,
	"assigned_by" bigint,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agent_products_agent_id_product_id_pk" PRIMARY KEY("agent_id","product_id")
);
--> statement-breakpoint
CREATE TABLE "agent_qualifications" (
	"agent_id" bigint PRIMARY KEY NOT NULL,
	"education" "education_level",
	"education_other" text,
	"experience" text[],
	"hours_per_day" "hours_available",
	"has_vehicle" boolean,
	"computer_literacy" "computer_literacy",
	"reach" text[],
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agents" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"agent_code" text NOT NULL,
	"district_id" bigint NOT NULL,
	"local_body_id" bigint NOT NULL,
	"ward_id" bigint,
	"mobile" text NOT NULL,
	"mobile_verified_at" timestamp with time zone,
	"occupation" text NOT NULL,
	"status" "agent_status" DEFAULT 'PENDING_REVIEW' NOT NULL,
	"reviewed_by" bigint,
	"reviewed_at" timestamp with time zone,
	"review_note" text,
	"terms_version" text NOT NULL,
	"terms_accepted_at" timestamp with time zone NOT NULL,
	"privacy_consent_at" timestamp with time zone NOT NULL,
	"first_sale_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agents_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "agents_agent_code_unique" UNIQUE("agent_code")
);
--> statement-breakpoint
CREATE TABLE "analytics_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"event" text NOT NULL,
	"properties" jsonb,
	"district_id" bigint,
	"local_body_id" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attribution_attempts" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"customer_external_ref" text NOT NULL,
	"customer_id" bigint,
	"agent_code" text NOT NULL,
	"agent_id" bigint,
	"accepted" boolean NOT NULL,
	"reason" text NOT NULL,
	"source" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attributions" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"customer_id" bigint NOT NULL,
	"agent_id" bigint NOT NULL,
	"agent_code" text NOT NULL,
	"locked_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attributions_customer_id_unique" UNIQUE("customer_id")
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"actor_user_id" bigint,
	"actor_role" "user_role",
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"before" jsonb,
	"after" jsonb,
	"ip_prefix" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "block_panchayats" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"district_id" bigint NOT NULL,
	"name_en" text NOT NULL,
	"name_ml" text NOT NULL,
	"lgd_code" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "block_panchayats_lgd_code_unique" UNIQUE("lgd_code")
);
--> statement-breakpoint
CREATE TABLE "commissions" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"payment_id" bigint NOT NULL,
	"agent_id" bigint NOT NULL,
	"district_id" bigint NOT NULL,
	"local_body_id" bigint NOT NULL,
	"base_paise" bigint NOT NULL,
	"rate_bps" integer DEFAULT 1000 NOT NULL,
	"gross_commission_paise" bigint NOT NULL,
	"tds_rate_bps" integer DEFAULT 200 NOT NULL,
	"tds_paise" bigint NOT NULL,
	"net_commission_paise" bigint NOT NULL,
	"status" "commission_status" DEFAULT 'ACCRUED' NOT NULL,
	"financial_year" text NOT NULL,
	"payout_batch_id" bigint,
	"accrued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"paid_at" timestamp with time zone,
	CONSTRAINT "commissions_payment_agent_key" UNIQUE("payment_id","agent_id")
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"external_ref" text NOT NULL,
	"display_name" text NOT NULL,
	"district_id" bigint,
	"local_body_id" bigint,
	"status" "customer_status" DEFAULT 'LEAD' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customers_external_ref_unique" UNIQUE("external_ref")
);
--> statement-breakpoint
CREATE TABLE "districts" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"state_id" bigint NOT NULL,
	"name_en" text NOT NULL,
	"name_ml" text NOT NULL,
	"code_slug" text NOT NULL,
	"lgd_code" integer,
	"ward_data" "data_completeness" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "districts_lgd_code_unique" UNIQUE("lgd_code")
);
--> statement-breakpoint
CREATE TABLE "idempotency_keys" (
	"key" text NOT NULL,
	"user_id" bigint,
	"endpoint" text NOT NULL,
	"request_hash" text NOT NULL,
	"response_status" integer,
	"response_body" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "idempotency_keys_key_endpoint_pk" PRIMARY KEY("key","endpoint")
);
--> statement-breakpoint
CREATE TABLE "local_bodies" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"district_id" bigint NOT NULL,
	"block_panchayat_id" bigint,
	"type" "local_body_type" NOT NULL,
	"name_en" text NOT NULL,
	"name_ml" text NOT NULL,
	"lgd_code" integer,
	"slot_capacity" integer DEFAULT 10 NOT NULL,
	"signups_open" boolean DEFAULT true NOT NULL,
	"ward_data" "data_completeness" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "local_bodies_lgd_code_unique" UNIQUE("lgd_code")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"external_ref" text NOT NULL,
	"customer_id" bigint NOT NULL,
	"product_id" bigint,
	"gross_paise" bigint NOT NULL,
	"gst_paise" bigint DEFAULT 0 NOT NULL,
	"gateway_fee_paise" bigint DEFAULT 0 NOT NULL,
	"net_paise" bigint NOT NULL,
	"paid_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_external_ref_unique" UNIQUE("external_ref")
);
--> statement-breakpoint
CREATE TABLE "payout_batches" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"period" text NOT NULL,
	"status" "payout_batch_status" DEFAULT 'DRAFT' NOT NULL,
	"marked_paid_by" bigint,
	"marked_paid_at" timestamp with time zone,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payout_batches_period_unique" UNIQUE("period")
);
--> statement-breakpoint
CREATE TABLE "payout_profiles" (
	"agent_id" bigint PRIMARY KEY NOT NULL,
	"pan_ciphertext" text,
	"pan_fingerprint" text,
	"pan_last4" text,
	"pan_status" "pan_status" DEFAULT 'NOT_SUBMITTED' NOT NULL,
	"pan_verified_at" timestamp with time zone,
	"pan_verified_by" bigint,
	"bank_account_ciphertext" text,
	"bank_account_last4" text,
	"bank_ifsc" text,
	"bank_holder_name" text,
	"upi_id" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_assets" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"product_id" bigint NOT NULL,
	"title" text NOT NULL,
	"kind" text NOT NULL,
	"url" text NOT NULL,
	"size_bytes" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name_en" text NOT NULL,
	"name_ml" text NOT NULL,
	"summary_en" text,
	"summary_ml" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "rate_limit_buckets" (
	"bucket_key" text NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"hits" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "rate_limit_buckets_bucket_key_window_start_pk" PRIMARY KEY("bucket_key","window_start")
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"token_hash" text NOT NULL,
	"replaced_by" bigint,
	"client_kind" text DEFAULT 'unknown' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "refresh_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "review_flags" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"kind" "review_flag_kind" NOT NULL,
	"agent_id" bigint,
	"local_body_id" bigint,
	"district_id" bigint,
	"detail" jsonb,
	"status" "review_flag_status" DEFAULT 'OPEN' NOT NULL,
	"resolved_by" bigint,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "signup_signals" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"agent_id" bigint,
	"device_hash" text,
	"ip_prefix" text,
	"fill_ms" integer,
	"honeypot_tripped" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "states" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name_en" text NOT NULL,
	"name_ml" text NOT NULL,
	"lgd_code" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "states_lgd_code_unique" UNIQUE("lgd_code")
);
--> statement-breakpoint
CREATE TABLE "terms_versions" (
	"version" text PRIMARY KEY NOT NULL,
	"effective_from" timestamp with time zone NOT NULL,
	"url" text NOT NULL,
	"body_ml" text,
	"body_en" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"google_sub" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"name" text NOT NULL,
	"picture_url" text,
	"role" "user_role" DEFAULT 'AGENT' NOT NULL,
	"status" "user_status" DEFAULT 'ACTIVE' NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_google_sub_unique" UNIQUE("google_sub")
);
--> statement-breakpoint
CREATE TABLE "waitlist_entries" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"local_body_id" bigint NOT NULL,
	"district_id" bigint NOT NULL,
	"mobile" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"cleared_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "wards" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"local_body_id" bigint NOT NULL,
	"number" smallint NOT NULL,
	"name_en" text,
	"name_ml" text,
	"lgd_code" integer,
	"status" "data_completeness" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wards_lgd_code_unique" UNIQUE("lgd_code")
);
--> statement-breakpoint
ALTER TABLE "admin_districts" ADD CONSTRAINT "admin_districts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_districts" ADD CONSTRAINT "admin_districts_district_id_districts_id_fk" FOREIGN KEY ("district_id") REFERENCES "public"."districts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_districts" ADD CONSTRAINT "admin_districts_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_code_sequences" ADD CONSTRAINT "agent_code_sequences_district_id_districts_id_fk" FOREIGN KEY ("district_id") REFERENCES "public"."districts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_message_recipients" ADD CONSTRAINT "agent_message_recipients_message_id_agent_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."agent_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_message_recipients" ADD CONSTRAINT "agent_message_recipients_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_messages" ADD CONSTRAINT "agent_messages_sender_user_id_users_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_products" ADD CONSTRAINT "agent_products_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_products" ADD CONSTRAINT "agent_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_products" ADD CONSTRAINT "agent_products_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_qualifications" ADD CONSTRAINT "agent_qualifications_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_district_id_districts_id_fk" FOREIGN KEY ("district_id") REFERENCES "public"."districts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_local_body_id_local_bodies_id_fk" FOREIGN KEY ("local_body_id") REFERENCES "public"."local_bodies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_ward_id_wards_id_fk" FOREIGN KEY ("ward_id") REFERENCES "public"."wards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_terms_version_terms_versions_version_fk" FOREIGN KEY ("terms_version") REFERENCES "public"."terms_versions"("version") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_district_id_districts_id_fk" FOREIGN KEY ("district_id") REFERENCES "public"."districts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_local_body_id_local_bodies_id_fk" FOREIGN KEY ("local_body_id") REFERENCES "public"."local_bodies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attribution_attempts" ADD CONSTRAINT "attribution_attempts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attribution_attempts" ADD CONSTRAINT "attribution_attempts_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attributions" ADD CONSTRAINT "attributions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attributions" ADD CONSTRAINT "attributions_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "block_panchayats" ADD CONSTRAINT "block_panchayats_district_id_districts_id_fk" FOREIGN KEY ("district_id") REFERENCES "public"."districts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_district_id_districts_id_fk" FOREIGN KEY ("district_id") REFERENCES "public"."districts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_local_body_id_local_bodies_id_fk" FOREIGN KEY ("local_body_id") REFERENCES "public"."local_bodies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_payout_batch_id_payout_batches_id_fk" FOREIGN KEY ("payout_batch_id") REFERENCES "public"."payout_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_district_id_districts_id_fk" FOREIGN KEY ("district_id") REFERENCES "public"."districts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_local_body_id_local_bodies_id_fk" FOREIGN KEY ("local_body_id") REFERENCES "public"."local_bodies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "districts" ADD CONSTRAINT "districts_state_id_states_id_fk" FOREIGN KEY ("state_id") REFERENCES "public"."states"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idempotency_keys" ADD CONSTRAINT "idempotency_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "local_bodies" ADD CONSTRAINT "local_bodies_district_id_districts_id_fk" FOREIGN KEY ("district_id") REFERENCES "public"."districts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "local_bodies" ADD CONSTRAINT "local_bodies_block_panchayat_id_block_panchayats_id_fk" FOREIGN KEY ("block_panchayat_id") REFERENCES "public"."block_panchayats"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_batches" ADD CONSTRAINT "payout_batches_marked_paid_by_users_id_fk" FOREIGN KEY ("marked_paid_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_profiles" ADD CONSTRAINT "payout_profiles_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_profiles" ADD CONSTRAINT "payout_profiles_pan_verified_by_users_id_fk" FOREIGN KEY ("pan_verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_assets" ADD CONSTRAINT "product_assets_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_flags" ADD CONSTRAINT "review_flags_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_flags" ADD CONSTRAINT "review_flags_local_body_id_local_bodies_id_fk" FOREIGN KEY ("local_body_id") REFERENCES "public"."local_bodies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_flags" ADD CONSTRAINT "review_flags_district_id_districts_id_fk" FOREIGN KEY ("district_id") REFERENCES "public"."districts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_flags" ADD CONSTRAINT "review_flags_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signup_signals" ADD CONSTRAINT "signup_signals_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waitlist_entries" ADD CONSTRAINT "waitlist_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waitlist_entries" ADD CONSTRAINT "waitlist_entries_local_body_id_local_bodies_id_fk" FOREIGN KEY ("local_body_id") REFERENCES "public"."local_bodies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waitlist_entries" ADD CONSTRAINT "waitlist_entries_district_id_districts_id_fk" FOREIGN KEY ("district_id") REFERENCES "public"."districts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wards" ADD CONSTRAINT "wards_local_body_id_local_bodies_id_fk" FOREIGN KEY ("local_body_id") REFERENCES "public"."local_bodies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agent_messages_created_idx" ON "agent_messages" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "agents_mobile_idx" ON "agents" USING btree ("mobile");--> statement-breakpoint
CREATE INDEX "agents_district_idx" ON "agents" USING btree ("district_id");--> statement-breakpoint
CREATE INDEX "agents_local_body_idx" ON "agents" USING btree ("local_body_id");--> statement-breakpoint
CREATE INDEX "agents_ward_idx" ON "agents" USING btree ("ward_id");--> statement-breakpoint
CREATE INDEX "agents_status_idx" ON "agents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "agents_created_at_idx" ON "agents" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "analytics_events_event_idx" ON "analytics_events" USING btree ("event");--> statement-breakpoint
CREATE INDEX "analytics_events_created_idx" ON "analytics_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "analytics_events_session_idx" ON "analytics_events" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "attribution_attempts_ref_idx" ON "attribution_attempts" USING btree ("customer_external_ref");--> statement-breakpoint
CREATE INDEX "attribution_attempts_agent_idx" ON "attribution_attempts" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "attributions_agent_idx" ON "attributions" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "audit_log_actor_idx" ON "audit_log" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "audit_log_entity_idx" ON "audit_log" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_log_created_idx" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "block_panchayats_district_idx" ON "block_panchayats" USING btree ("district_id");--> statement-breakpoint
CREATE INDEX "commissions_agent_idx" ON "commissions" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "commissions_district_idx" ON "commissions" USING btree ("district_id");--> statement-breakpoint
CREATE INDEX "commissions_status_idx" ON "commissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "commissions_fy_idx" ON "commissions" USING btree ("financial_year");--> statement-breakpoint
CREATE INDEX "customers_district_idx" ON "customers" USING btree ("district_id");--> statement-breakpoint
CREATE UNIQUE INDEX "districts_state_name_en_idx" ON "districts" USING btree ("state_id","name_en");--> statement-breakpoint
CREATE UNIQUE INDEX "districts_code_slug_idx" ON "districts" USING btree ("code_slug");--> statement-breakpoint
CREATE INDEX "local_bodies_district_idx" ON "local_bodies" USING btree ("district_id");--> statement-breakpoint
CREATE INDEX "local_bodies_block_idx" ON "local_bodies" USING btree ("block_panchayat_id");--> statement-breakpoint
CREATE INDEX "local_bodies_name_en_idx" ON "local_bodies" USING btree ("name_en");--> statement-breakpoint
CREATE INDEX "local_bodies_type_idx" ON "local_bodies" USING btree ("type");--> statement-breakpoint
CREATE INDEX "payments_customer_idx" ON "payments" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "payments_paid_at_idx" ON "payments" USING btree ("paid_at");--> statement-breakpoint
CREATE UNIQUE INDEX "payout_profiles_pan_fingerprint_idx" ON "payout_profiles" USING btree ("pan_fingerprint");--> statement-breakpoint
CREATE INDEX "product_assets_product_idx" ON "product_assets" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "refresh_tokens_user_idx" ON "refresh_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "review_flags_status_idx" ON "review_flags" USING btree ("status");--> statement-breakpoint
CREATE INDEX "review_flags_district_idx" ON "review_flags" USING btree ("district_id");--> statement-breakpoint
CREATE INDEX "signup_signals_device_idx" ON "signup_signals" USING btree ("device_hash");--> statement-breakpoint
CREATE INDEX "signup_signals_agent_idx" ON "signup_signals" USING btree ("agent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree (lower("email"));--> statement-breakpoint
CREATE UNIQUE INDEX "waitlist_user_body_idx" ON "waitlist_entries" USING btree ("user_id","local_body_id");--> statement-breakpoint
CREATE INDEX "waitlist_body_idx" ON "waitlist_entries" USING btree ("local_body_id");--> statement-breakpoint
CREATE UNIQUE INDEX "wards_body_number_idx" ON "wards" USING btree ("local_body_id","number");--> statement-breakpoint
CREATE INDEX "wards_body_idx" ON "wards" USING btree ("local_body_id");