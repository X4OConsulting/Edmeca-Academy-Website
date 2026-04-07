import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, integer, pgEnum } from "drizzle-orm/pg-core";
import { z } from "zod";

// Re-export auth models
export * from "./models/auth";

// Enums
export const roleEnum = pgEnum("role", ["entrepreneur", "participant", "programme_manager", "admin"]);
export const toolTypeEnum = pgEnum("tool_type", ["bmc", "swot_pestle", "value_proposition", "pitch_builder"]);
export const artifactStatusEnum = pgEnum("artifact_status", ["draft", "in_progress", "complete"]);

// Organizations table
export const organizations = pgTable("organizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Cohorts table
export const cohorts = pgTable("cohorts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  organizationId: varchar("organization_id").references(() => organizations.id),
  inviteCode: varchar("invite_code").unique().default(sql`gen_random_uuid()`),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User profiles (extends auth users)
export const userProfiles = pgTable("user_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  role: roleEnum("role").default("entrepreneur"),
  organizationId: varchar("organization_id").references(() => organizations.id),
  cohortId: varchar("cohort_id").references(() => cohorts.id),
  businessName: text("business_name"),
  businessDescription: text("business_description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Artifacts table (saved tool outputs)
export const artifacts = pgTable("artifacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  toolType: toolTypeEnum("tool_type").notNull(),
  title: text("title").notNull(),
  content: jsonb("content").notNull(),
  version: integer("version").default(1),
  status: artifactStatusEnum("status").default("draft"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Progress entries table
export const progressEntries = pgTable("progress_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  milestone: text("milestone").notNull(),
  evidence: text("evidence"),
  attachmentUrl: text("attachment_url"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Contact form submissions
export const contactSubmissions = pgTable("contact_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company"),
  message: text("message").notNull(),
  audienceType: text("audience_type"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const organizationsRelations = relations(organizations, ({ many }) => ({
  cohorts: many(cohorts),
  userProfiles: many(userProfiles),
}));

export const cohortsRelations = relations(cohorts, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [cohorts.organizationId],
    references: [organizations.id],
  }),
  userProfiles: many(userProfiles),
}));

export const userProfilesRelations = relations(userProfiles, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [userProfiles.organizationId],
    references: [organizations.id],
  }),
  cohort: one(cohorts, {
    fields: [userProfiles.cohortId],
    references: [cohorts.id],
  }),
  artifacts: many(artifacts),
  progressEntries: many(progressEntries),
}));

export const artifactsRelations = relations(artifacts, ({ one }) => ({
  userProfile: one(userProfiles, {
    fields: [artifacts.userId],
    references: [userProfiles.userId],
  }),
}));

export const progressEntriesRelations = relations(progressEntries, ({ one }) => ({
  userProfile: one(userProfiles, {
    fields: [progressEntries.userId],
    references: [userProfiles.userId],
  }),
}));

// Types - using drizzle inference
export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = typeof organizations.$inferInsert;

export type Cohort = typeof cohorts.$inferSelect;
export type InsertCohort = typeof cohorts.$inferInsert;

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;

export type Artifact = typeof artifacts.$inferSelect;
export type InsertArtifact = typeof artifacts.$inferInsert;

export type ProgressEntry = typeof progressEntries.$inferSelect;
export type InsertProgressEntry = typeof progressEntries.$inferInsert;

export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type InsertContactSubmission = typeof contactSubmissions.$inferInsert;

// BMC Canvas content type
export const bmcCanvasSchema = z.object({
  keyPartners: z.string().default(""),
  keyActivities: z.string().default(""),
  keyResources: z.string().default(""),
  valuePropositions: z.string().default(""),
  customerRelationships: z.string().default(""),
  channels: z.string().default(""),
  customerSegments: z.string().default(""),
  costStructure: z.string().default(""),
  revenueStreams: z.string().default(""),
});

export type BMCCanvas = z.infer<typeof bmcCanvasSchema>;
