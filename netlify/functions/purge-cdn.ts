/**
 * Netlify Function to purge ALL CDN cache for the site
 * 
 * This function invalidates all cached assets across all deploys for the site.
 * 
 * Usage:
 * 1. Deploy this function
 * 2. Trigger it by visiting: https://edmeca.co.za/.netlify/functions/purge-cdn
 * 3. Or via curl: curl https://edmeca.co.za/.netlify/functions/purge-cdn
 * 
 * Expected response: HTTP 202 "CDN cache purged successfully"
 */

import { purgeCache } from "@netlify/functions";
import type { Context } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  try {
    console.log("🔥 Starting CDN cache purge for all site content...");
    console.log("Site ID:", context.site?.id || "(auto-detected)");
    console.log("Request URL:", req.url);
    console.log("Request method:", req.method);
    
    // Purge ALL cached content for the entire site
    // No parameters = purges everything across all deploys
    await purgeCache();
    
    console.log("✅ CDN cache purge successful");
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "CDN cache purged successfully",
        timestamp: new Date().toISOString(),
        note: "All cached content has been invalidated. Next requests will fetch fresh content.",
      }),
      {
        status: 202, // 202 Accepted (purge is async)
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("❌ CDN cache purge failed:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
