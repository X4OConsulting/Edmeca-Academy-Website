/**
 * The contact form's "I am" options and the nine offerings for "Offering of interest".
 * Shared by the Contact page and api/contact.ts, so it must stay plain data with no imports.
 */

export const AUDIENCES = [
  { value: "corporate", label: "A corporate or skills development foundation" },
  { value: "esd", label: "An ESD or supplier development programme" },
  { value: "institution", label: "A learning institution, TVET college or SETA" },
  { value: "funder", label: "A funder or foundation" },
  { value: "participant", label: "An entrepreneur or young person on a programme" },
  { value: "other", label: "Other" },
] as const;

export type AudienceValue = (typeof AUDIENCES)[number]["value"];

// Slugs match the "Ask about this offering" links on /solutions and /engagement.
export const OFFERINGS = [
  { slug: "digital-leader-module", title: "Digital Leader Module" },
  { slug: "ai-for-leaders", title: "AI for Leaders and the AI Catalyst Journey" },
  { slug: "smme-cohort-module", title: "AI and digital module inside an SMME cohort" },
  { slug: "youthpreneur", title: "Youthpreneur" },
  { slug: "impact-reporting", title: "Impact Reporting" },
  { slug: "research", title: "Research offering" },
  { slug: "accredited-skills-programmes", title: "Accredited skills programmes" },
  { slug: "staff-capacitation", title: "Staff capacitation" },
  { slug: "ai-business-studio", title: "AI Business Studio" },
] as const;

export type OfferingSlug = (typeof OFFERINGS)[number]["slug"];
