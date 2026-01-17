import {
  organizations,
  cohorts,
  userProfiles,
  artifacts,
  progressEntries,
  contactSubmissions,
  type Organization,
  type InsertOrganization,
  type Cohort,
  type InsertCohort,
  type UserProfile,
  type InsertUserProfile,
  type Artifact,
  type InsertArtifact,
  type ProgressEntry,
  type InsertProgressEntry,
  type ContactSubmission,
  type InsertContactSubmission,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // Organizations
  getOrganization(id: string): Promise<Organization | undefined>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  
  // Cohorts
  getCohort(id: string): Promise<Cohort | undefined>;
  getCohortByInviteCode(inviteCode: string): Promise<Cohort | undefined>;
  getCohortsByOrganization(organizationId: string): Promise<Cohort[]>;
  createCohort(cohort: InsertCohort): Promise<Cohort>;
  
  // User Profiles
  getUserProfile(userId: string): Promise<UserProfile | undefined>;
  createUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  updateUserProfile(userId: string, profile: Partial<InsertUserProfile>): Promise<UserProfile | undefined>;
  
  // Artifacts
  getArtifact(id: string): Promise<Artifact | undefined>;
  getArtifactsByUser(userId: string): Promise<Artifact[]>;
  getLatestArtifactByTypeAndUser(userId: string, toolType: string): Promise<Artifact | undefined>;
  createArtifact(artifact: InsertArtifact): Promise<Artifact>;
  updateArtifact(id: string, artifact: Partial<InsertArtifact>): Promise<Artifact | undefined>;
  deleteArtifact(id: string): Promise<void>;
  
  // Progress Entries
  getProgressEntriesByUser(userId: string): Promise<ProgressEntry[]>;
  createProgressEntry(entry: InsertProgressEntry): Promise<ProgressEntry>;
  updateProgressEntry(id: string, entry: Partial<InsertProgressEntry>): Promise<ProgressEntry | undefined>;
  
  // Contact Submissions
  createContactSubmission(submission: InsertContactSubmission): Promise<ContactSubmission>;
}

export class DatabaseStorage implements IStorage {
  // Organizations
  async getOrganization(id: string): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
    return org;
  }

  async createOrganization(org: InsertOrganization): Promise<Organization> {
    const [created] = await db.insert(organizations).values(org).returning();
    return created;
  }

  // Cohorts
  async getCohort(id: string): Promise<Cohort | undefined> {
    const [cohort] = await db.select().from(cohorts).where(eq(cohorts.id, id));
    return cohort;
  }

  async getCohortByInviteCode(inviteCode: string): Promise<Cohort | undefined> {
    const [cohort] = await db.select().from(cohorts).where(eq(cohorts.inviteCode, inviteCode));
    return cohort;
  }

  async getCohortsByOrganization(organizationId: string): Promise<Cohort[]> {
    return db.select().from(cohorts).where(eq(cohorts.organizationId, organizationId));
  }

  async createCohort(cohort: InsertCohort): Promise<Cohort> {
    const [created] = await db.insert(cohorts).values(cohort).returning();
    return created;
  }

  // User Profiles
  async getUserProfile(userId: string): Promise<UserProfile | undefined> {
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
    return profile;
  }

  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const [created] = await db.insert(userProfiles).values(profile).returning();
    return created;
  }

  async updateUserProfile(userId: string, profile: Partial<InsertUserProfile>): Promise<UserProfile | undefined> {
    const [updated] = await db
      .update(userProfiles)
      .set({ ...profile, updatedAt: new Date() })
      .where(eq(userProfiles.userId, userId))
      .returning();
    return updated;
  }

  // Artifacts
  async getArtifact(id: string): Promise<Artifact | undefined> {
    const [artifact] = await db.select().from(artifacts).where(eq(artifacts.id, id));
    return artifact;
  }

  async getArtifactsByUser(userId: string): Promise<Artifact[]> {
    return db
      .select()
      .from(artifacts)
      .where(eq(artifacts.userId, userId))
      .orderBy(desc(artifacts.updatedAt));
  }

  async getLatestArtifactByTypeAndUser(userId: string, toolType: string): Promise<Artifact | undefined> {
    const [artifact] = await db
      .select()
      .from(artifacts)
      .where(and(eq(artifacts.userId, userId), eq(artifacts.toolType, toolType as any)))
      .orderBy(desc(artifacts.updatedAt))
      .limit(1);
    return artifact;
  }

  async createArtifact(artifact: InsertArtifact): Promise<Artifact> {
    const [created] = await db.insert(artifacts).values(artifact).returning();
    return created;
  }

  async updateArtifact(id: string, artifact: Partial<InsertArtifact>): Promise<Artifact | undefined> {
    const [updated] = await db
      .update(artifacts)
      .set({ ...artifact, updatedAt: new Date() })
      .where(eq(artifacts.id, id))
      .returning();
    return updated;
  }

  async deleteArtifact(id: string): Promise<void> {
    await db.delete(artifacts).where(eq(artifacts.id, id));
  }

  // Progress Entries
  async getProgressEntriesByUser(userId: string): Promise<ProgressEntry[]> {
    return db
      .select()
      .from(progressEntries)
      .where(eq(progressEntries.userId, userId))
      .orderBy(desc(progressEntries.createdAt));
  }

  async createProgressEntry(entry: InsertProgressEntry): Promise<ProgressEntry> {
    const [created] = await db.insert(progressEntries).values(entry).returning();
    return created;
  }

  async updateProgressEntry(id: string, entry: Partial<InsertProgressEntry>): Promise<ProgressEntry | undefined> {
    const [updated] = await db
      .update(progressEntries)
      .set(entry)
      .where(eq(progressEntries.id, id))
      .returning();
    return updated;
  }

  // Contact Submissions
  async createContactSubmission(submission: InsertContactSubmission): Promise<ContactSubmission> {
    const [created] = await db.insert(contactSubmissions).values(submission).returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
