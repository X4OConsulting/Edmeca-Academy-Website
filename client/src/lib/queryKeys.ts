/**
 * Centralized React Query key factory.
 * All query keys in the app should be defined here to ensure
 * consistent cache invalidation and avoid key typos.
 *
 * Naming convention: coarse → fine
 *   ['artifacts']               — all artifacts (broad invalidation)
 *   ['artifact', toolType]      — single type (e.g. 'bmc')
 *   ['artifact', 'id', id]      — single record by ID
 *   ['progress_entries']        — all progress entries
 *   ['profile']                 — current user profile
 */

export const queryKeys = {
  artifacts: {
    /** All artifacts for the current user */
    all: ['artifacts'] as const,
    /** Latest artifact of a specific tool type */
    byType: (toolType: string) => ['artifact', toolType] as const,
    /** Single artifact by ID */
    byId: (id: string) => ['artifact', 'id', id] as const,
  },
  progress: {
    /** All progress entries for the current user */
    all: ['progress_entries'] as const,
  },
  profile: {
    /** Current user's profile row */
    current: ['profile'] as const,
  },
} as const;
