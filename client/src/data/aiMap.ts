/**
 * AI Enablement Baseline: content for the AI Enablement Map.
 *
 * Two axes (AI Capability, Leadership and Organisational Readiness), four
 * dimensions each, three statements per dimension. Every statement has a
 * business and an individual phrasing; the page shows only the chosen mode.
 * Scoring lives in client/src/lib/aiMap.ts and is mirrored by the Netlify
 * function, which imports this file so the server and the browser never drift.
 */
export type Axis = "capability" | "readiness";
export type DimensionCode = "C1" | "C2" | "C3" | "C4" | "R1" | "R2" | "R3" | "R4";
export type ItemId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24;
export type Answer = 0 | 1 | 2 | 3 | 4;
export type Answers = Partial<Record<ItemId, Answer>>;
export type RespondentMode = "business" | "individual";
export type Wave = "baseline" | "mid" | "post";
export type Quadrant = "starters" | "pathseekers" | "transformers" | "fuelled";

export type Dimension = {
  code: DimensionCode;
  axis: Axis;
  name: string;
  measures: string;
  sessions: string;
  items: [ItemId, ItemId, ItemId];
};

export type Item = {
  id: ItemId;
  dimension: DimensionCode;
  business: string;
  individual: string;
  why: string;
};

export const axisLabels: Record<Axis, string> = {
  capability: "AI Capability",
  readiness: "Leadership and Organisational Readiness",
};

export const axisShortLabels: Record<Axis, string> = { capability: "Capability", readiness: "Readiness" };

export const dimensions: Dimension[] = [
  { code: "C1", axis: "capability", name: "Skills and tool fluency", measures: "Can people get real work done with AI assistants, consistently", sessions: "Sessions 1 and 2", items: [1, 2, 3] },
  { code: "C2", axis: "capability", name: "Adoption in daily work", measures: "Is AI inside real, recurring processes rather than experiments", sessions: "Sessions 2 and 3", items: [4, 5, 6] },
  { code: "C3", axis: "capability", name: "Data and information readiness", measures: "Is the information AI needs organised, accurate and safely shareable", sessions: "Session 4", items: [7, 8, 9] },
  { code: "C4", axis: "capability", name: "Outcomes and value", measures: "Can results be named, measured and traced to decisions", sessions: "Sessions 4 and 6", items: [10, 11, 12] },
  { code: "R1", axis: "readiness", name: "Ambition and strategy", measures: "A clear, written view of where AI creates value in the next 12 months", sessions: "Sessions 1 and 5", items: [13, 14, 15] },
  { code: "R2", axis: "readiness", name: "Leadership and commitment", measures: "Leaders use it, someone owns it, time and money are set aside", sessions: "Sessions 1 and 6", items: [16, 17, 18] },
  { code: "R3", axis: "readiness", name: "People and change", measures: "Willingness to change ways of working, a structured way to build skills, sharing what works", sessions: "Sessions 2 and 6", items: [19, 20, 21] },
  { code: "R4", axis: "readiness", name: "Governance and responsible use", measures: "Simple rules, human review before it matters, data and privacy obligations understood", sessions: "Session 6", items: [22, 23, 24] },
];

export const dimensionCodes = dimensions.map((dimension) => dimension.code) as DimensionCode[];

export const items: Item[] = [
  { id: 1, dimension: "C1", business: "People in the business can use AI assistants (ChatGPT, Claude, Gemini, Copilot) to get real work done, not just try them.", individual: "I can use AI assistants (ChatGPT, Claude, Gemini, Copilot) to get real work done, not just try them.", why: "Trying a tool once is not a skill. Finishing real work with it is." },
  { id: 2, dimension: "C1", business: "We have shared prompts, templates or guides so results are consistent from person to person.", individual: "I keep prompts and templates I reuse, so my results are consistent.", why: "Reusable prompts turn one good result into a repeatable one." },
  { id: 3, dimension: "C1", business: "At least one person can set up a new AI tool or a simple automation without outside help.", individual: "I can set up a new AI tool or a simple automation without help.", why: "If every new tool needs outside help, adoption waits on someone else's diary." },
  { id: 4, dimension: "C2", business: "AI is part of at least one core process we run every week (quotes, proposals, reporting, customer service, scheduling).", individual: "AI is part of at least one task I do every week.", why: "Weekly use is where the time savings actually show up." },
  { id: 5, dimension: "C2", business: "We have moved past experiments: something AI-assisted is in regular use and would be missed if it stopped.", individual: "I have moved past experimenting: I would notice if my AI tools disappeared tomorrow.", why: "The test of adoption is whether you would miss it." },
  { id: 6, dimension: "C2", business: "New uses of AI are added deliberately, one process at a time, not at random.", individual: "I add new uses deliberately, one task at a time, not at random.", why: "Random experiments fragment. One process at a time compounds." },
  { id: 7, dimension: "C3", business: "The information AI would need (customer records, pricing, documents, numbers) is organised and easy to find.", individual: "My information (notes, documents, records) is organised enough for an AI tool to use.", why: "AI is only as useful as the information you can put in front of it." },
  { id: 8, dimension: "C3", business: "Our key business data is accurate and current enough to make decisions from.", individual: "The data I rely on is accurate and current.", why: "Fast answers from stale numbers are fast mistakes." },
  { id: 9, dimension: "C3", business: "We know which of our data is sensitive and keep it out of tools that should not have it.", individual: "I know which of my information is sensitive and keep it out of tools that should not have it.", why: "Knowing what must not go into a tool is the first rule of safe use." },
  { id: 10, dimension: "C4", business: "We can name specific results AI has produced (hours saved, faster quotes, more leads, better decisions).", individual: "I can name specific results AI has produced for me.", why: "A result you can name is a result you can repeat." },
  { id: 11, dimension: "C4", business: "We measure at least one of those results rather than assuming it.", individual: "I track at least one of those results rather than assuming it.", why: "Measured once, a benefit becomes a case for doing more." },
  { id: 12, dimension: "C4", business: "AI has changed a decision, a price or an offer in the last three months.", individual: "AI has changed a decision I made in the last three months.", why: "AI that never changes a decision is a faster typewriter." },
  { id: 13, dimension: "R1", business: "We have a clear view of where AI should create value in this business in the next 12 months.", individual: "I have a clear view of where AI should create value in my work in the next 12 months.", why: "Without a view of where the value is, every tool looks equally interesting." },
  { id: 14, dimension: "R1", business: "That view is written down with priorities, not just talked about.", individual: "That view is written down with priorities.", why: "A written priority survives a busy month. A spoken one does not." },
  { id: 15, dimension: "R1", business: "AI features in our business plan or strategy, not as an add-on.", individual: "AI features in my business or development plan, not as an add-on.", why: "Add-ons get cut first. Strategy gets funded." },
  { id: 16, dimension: "R2", business: "The owner or leadership actively uses AI and talks about it with the team.", individual: "I set aside regular time each week to learn and apply AI.", why: "People copy what leaders do, not what they say." },
  { id: 17, dimension: "R2", business: "There is a named person responsible for AI in the business.", individual: "I have made my progress accountable to someone: a mentor, a peer or a programme.", why: "What nobody owns, nobody moves." },
  { id: 18, dimension: "R2", business: "Time and money are set aside for AI: tools, learning and experimentation.", individual: "I have a budget, in time or money, for AI tools and learning.", why: "A budget, however small, is the difference between intent and commitment." },
  { id: 19, dimension: "R3", business: "People are willing to change how they work when AI offers a better way.", individual: "I am willing to change how I work when AI offers a better way.", why: "The tool is rarely the blocker. The habit is." },
  { id: 20, dimension: "R3", business: "We have a structured way to build skills: a programme, courses, peer learning or set practice.", individual: "I have a structured way to build my AI skills, not just trial and error.", why: "Trial and error works, slowly. Structure gets you there this quarter." },
  { id: 21, dimension: "R3", business: "When something works, it gets shared and copied across the business.", individual: "When something works, I write it down and reuse it.", why: "A win nobody hears about happens once." },
  { id: 22, dimension: "R4", business: "We have simple rules for AI use: what is allowed, what is not, and what a person must check.", individual: "I have my own rules for AI use: what I will not put into it and what I always check.", why: "Simple rules let people move fast without guessing." },
  { id: 23, dimension: "R4", business: "A person reviews AI output before it reaches a customer, a funder or a contract.", individual: "I review AI output before it goes to anyone who matters.", why: "One unchecked paragraph in a contract costs more than a year of checking." },
  { id: 24, dimension: "R4", business: "We know our obligations around customer data and privacy (POPIA) when using AI tools.", individual: "I know my obligations around other people's data and privacy when using AI tools.", why: "POPIA applies whether or not a tool was involved." },
];

export const itemIds = items.map((item) => item.id) as ItemId[];

/** The mid-programme pulse: one statement per dimension except C3, two for R4, about two minutes. */
export const pulseItems: ItemId[] = [1, 4, 10, 13, 16, 19, 22, 24];

export const scale: { value: Answer; label: string; short: string }[] = [
  { value: 0, label: "Not at all", short: "0" },
  { value: 1, label: "A little", short: "1" },
  { value: 2, label: "Partly", short: "2" },
  { value: 3, label: "Mostly", short: "3" },
  { value: 4, label: "Fully", short: "4" },
];

export const businessSizes = ["Just me", "2 to 5", "6 to 20", "21 to 50", "51 to 200", "200+"];
export const roles = ["Founder or owner", "Manager or team lead", "Professional or specialist", "Student or job seeker", "Other"];
export const sectors = ["Construction and trades", "Property and facilities services", "Professional services and consulting", "Retail and e-commerce", "Manufacturing", "Hospitality and tourism", "Logistics and transport", "Agriculture and agri-processing", "Technology and digital", "Education and training", "Health and wellness", "Creative and media", "Public sector and non-profit", "Other"];
export const programmeStatuses = ["In an ESD programme, incubator or accelerator now", "Applying or planning to", "Not currently"];
export const inProgrammeStatus = programmeStatuses[0];

/** Known cohort codes. Unknown codes still work; they are shown as the code itself. */
export const cohortNames: Record<string, string> = { PP2026: "Property Point 2026" };

export type QuadrantCopy = {
  id: Quadrant;
  name: string;
  subtitle: string;
  position: string;
  reading: string;
  route: string;
  format: string;
  tint: string;
};

export const quadrants: Record<Quadrant, QuadrantCopy> = {
  starters: {
    id: "starters",
    name: "Starters",
    subtitle: "Exploring the possibilities",
    position: "Lower capability, lower readiness",
    reading: "You have tried AI, mostly in isolation. There is no clear plan yet, skills sit with one or two people, and you cannot yet point to a result. Everything is ahead of you, which is where most businesses honestly are.",
    route: "AI Foundations: opportunity mapping plus hands-on tooling on real tasks, then a simple 90-day plan. Sessions 1, 2 and 6 as the core.",
    format: "A Focused Session to start; the six-week programme when in a cohort.",
    tint: "#F3F4F6",
  },
  pathseekers: {
    id: "pathseekers",
    name: "Pathseekers",
    subtitle: "Building momentum",
    position: "Higher capability, lower readiness",
    reading: "You can do real things with AI and have a result or two to show, but it lives in pockets. Without a plan, an owner who leads it, and simple rules, it will not spread or survive a staff change.",
    route: "From pockets to plan: keep the capability, add the strategy, ownership and rules that let it spread. Sessions 1, 5 and 6 lead; 2 to 4 reinforce.",
    format: "Mid-Tier, four to five targeted interventions.",
    tint: "#EEF4E6",
  },
  transformers: {
    id: "transformers",
    name: "Transformers",
    subtitle: "From pilots to real impact",
    position: "Lower capability, higher readiness",
    reading: "You are ready: leadership wants this, there is a plan and rules are forming. The gap is hands-on capability, which is the fastest gap to close with structured, applied training.",
    route: "Hands-on enablement: readiness is there, so run the applied curriculum end to end and measure the results. Sessions 2, 3 and 4 lead.",
    format: "The six-week programme or Mid-Tier.",
    tint: "#F1ECF7",
  },
  fuelled: {
    id: "fuelled",
    name: "AI-Fuelled",
    subtitle: "At scale and continuously learning",
    position: "Higher capability, higher readiness",
    reading: "AI is in how you work and how you decide, you measure what it produces, and you keep improving. The next step is compounding: new offers, sharper decisions, and helping others get there.",
    route: "Compound and lead: AI-augmented strategy, measurement discipline, new offers, and a case study Edmeca can tell. Sessions 4 and 5 at depth.",
    format: "Focused Sessions on demand; a partnership conversation.",
    tint: "#E9F0E4",
  },
};

export const inProgrammeRouteNote = "Edmeca delivers this as the AI capability layer inside your programme, with your baseline and post-programme movement reported to the programme.";

export type Action = { business: string; individual: string; session: string };

export const actions: Record<DimensionCode, Action> = {
  C1: { business: "Pick one AI assistant for the business, run one 90-minute hands-on session on three real tasks, and start a shared prompt library.", individual: "Spend 20 minutes a day for two weeks doing real tasks with one assistant, and keep every prompt that worked.", session: "Sessions 1 and 2" },
  C2: { business: "Choose the most repetitive weekly process (quotes, reports, follow-ups) and rebuild it with AI and a checklist.", individual: "Choose one weekly task and make AI the default way you do it for a month.", session: "Session 2" },
  C3: { business: "Put customer records, pricing and key documents in one organised place, and label what is sensitive.", individual: "Organise your working notes and documents into folders an assistant can search, and separate anything confidential.", session: "Session 4" },
  C4: { business: "Pick one result to measure (hours saved, quote turnaround, leads) and record it weekly for a month.", individual: "Track one result for a month: time saved or output produced.", session: "Sessions 4 and 6" },
  R1: { business: "Write a one-page AI opportunity map: the three to five places AI will pay off first, with an owner and a date.", individual: "Write down the three places AI will pay off for you this year and what \"done\" looks like.", session: "Sessions 1 and 5" },
  R2: { business: "Name the person who owns AI, agree a monthly review, and set a small budget for tools and learning.", individual: "Block a weekly learning slot, tell someone about it, and set a review date.", session: "Session 6" },
  R3: { business: "Run a monthly 30-minute \"what worked\" session and put every win in a shared place.", individual: "Join a peer group or programme so you learn from others' wins, and reuse what works.", session: "Session 6" },
  R4: { business: "Write a one-page AI use rule: what goes in, what does not, what a person checks before it goes out.", individual: "Write your own three rules for AI use and stick them where you work.", session: "Session 6" },
};

/** Score bands used in the profile bars and the templated report. */
export function bandFor(score: number): string {
  if (score >= 75) return "strong";
  if (score >= 50) return "established";
  if (score >= 25) return "emerging";
  return "starting";
}

export const bandMeaning: Record<string, string> = {
  strong: "this is working and can be built on",
  established: "in place, with room to make it consistent",
  emerging: "started, but not yet reliable",
  starting: "largely still ahead of you",
};

export function dimensionFor(code: DimensionCode): Dimension {
  return dimensions.find((dimension) => dimension.code === code)!;
}

export function itemFor(id: ItemId): Item {
  return items.find((item) => item.id === id)!;
}

export function statementFor(id: ItemId, mode: RespondentMode): string {
  return itemFor(id)[mode];
}
