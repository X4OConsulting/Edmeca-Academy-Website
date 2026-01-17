import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, registerAuthRoutes } from "./replit_integrations/auth";
import { insertArtifactSchema, insertContactSubmissionSchema, insertProgressEntrySchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Set up authentication first
  await setupAuth(app);
  registerAuthRoutes(app);

  // Contact form submission (public)
  app.post("/api/contact", async (req, res) => {
    try {
      const validated = insertContactSubmissionSchema.parse(req.body);
      const submission = await storage.createContactSubmission(validated);
      res.status(201).json(submission);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Contact submission error:", error);
      res.status(500).json({ message: "Failed to submit contact form" });
    }
  });

  // Artifacts API (protected)
  app.get("/api/artifacts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const artifacts = await storage.getArtifactsByUser(userId);
      res.json(artifacts);
    } catch (error) {
      console.error("Get artifacts error:", error);
      res.status(500).json({ message: "Failed to fetch artifacts" });
    }
  });

  app.get("/api/artifacts/:toolType/latest", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { toolType } = req.params;
      const artifact = await storage.getLatestArtifactByTypeAndUser(userId, toolType);
      res.json(artifact || null);
    } catch (error) {
      console.error("Get latest artifact error:", error);
      res.status(500).json({ message: "Failed to fetch artifact" });
    }
  });

  app.post("/api/artifacts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validated = insertArtifactSchema.parse({
        ...req.body,
        userId,
      });
      const artifact = await storage.createArtifact(validated);
      res.status(201).json(artifact);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Create artifact error:", error);
      res.status(500).json({ message: "Failed to create artifact" });
    }
  });

  app.patch("/api/artifacts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      // Verify ownership
      const existing = await storage.getArtifact(id);
      if (!existing || existing.userId !== userId) {
        return res.status(404).json({ message: "Artifact not found" });
      }
      
      const artifact = await storage.updateArtifact(id, req.body);
      res.json(artifact);
    } catch (error) {
      console.error("Update artifact error:", error);
      res.status(500).json({ message: "Failed to update artifact" });
    }
  });

  app.delete("/api/artifacts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      // Verify ownership
      const existing = await storage.getArtifact(id);
      if (!existing || existing.userId !== userId) {
        return res.status(404).json({ message: "Artifact not found" });
      }
      
      await storage.deleteArtifact(id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete artifact error:", error);
      res.status(500).json({ message: "Failed to delete artifact" });
    }
  });

  // Progress entries API (protected)
  app.get("/api/progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const entries = await storage.getProgressEntriesByUser(userId);
      res.json(entries);
    } catch (error) {
      console.error("Get progress entries error:", error);
      res.status(500).json({ message: "Failed to fetch progress entries" });
    }
  });

  app.post("/api/progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validated = insertProgressEntrySchema.parse({
        ...req.body,
        userId,
      });
      const entry = await storage.createProgressEntry(validated);
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Create progress entry error:", error);
      res.status(500).json({ message: "Failed to create progress entry" });
    }
  });

  // User profile API (protected)
  app.get("/api/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getUserProfile(userId);
      res.json(profile || null);
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.post("/api/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Check if profile exists
      const existing = await storage.getUserProfile(userId);
      if (existing) {
        const updated = await storage.updateUserProfile(userId, req.body);
        return res.json(updated);
      }
      
      const profile = await storage.createUserProfile({
        ...req.body,
        userId,
      });
      res.status(201).json(profile);
    } catch (error) {
      console.error("Create/update profile error:", error);
      res.status(500).json({ message: "Failed to save profile" });
    }
  });

  return httpServer;
}
