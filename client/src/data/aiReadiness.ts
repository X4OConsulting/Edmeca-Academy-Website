export type ReadinessDimension = "foundations" | "operations" | "sales" | "finance" | "innovation";

export type ReadinessAnswers = Partial<Record<ReadinessDimension, number>>;

export type ReadinessProfile = {
  sector: string;
  size: string;
};

export type ReadinessStage = {
  name: "Intent" | "Focus" | "Activation" | "Measurement" | "Evidence";
  descriptor: string;
};

export type ReadinessQuestion = {
  dimension: ReadinessDimension;
  label: string;
  question: string;
  options: string[];
  session: string;
};

export const stages: ReadinessStage[] = [
  { name: "Intent", descriptor: "You can see the need for change, but the link between ambition and action is still forming." },
  { name: "Focus", descriptor: "You have identified promising opportunities and are choosing where effort will matter most." },
  { name: "Activation", descriptor: "Priority work is moving, with people testing practical changes in the business." },
  { name: "Measurement", descriptor: "Execution is becoming repeatable, with owners, measures and learning loops in place." },
  { name: "Evidence", descriptor: "Your strategy is producing measurable outcomes that strengthen decisions and create new advantage." },
];

export const questions: ReadinessQuestion[] = [
  {
    dimension: "foundations",
    label: "STRATEGIC INTENT",
    question: "How clearly does your business connect its strategy to the opportunities AI can create?",
    session: "Session 1",
    options: [
      "We are focused on keeping the business going; strategy and AI opportunities are not connected yet.",
      "We can see that AI may matter, but the conversation is still separate from our business priorities.",
      "We have identified a few AI opportunities that could improve performance or customer value this year.",
      "Our strategy names clear AI priorities, owners and outcomes that the team understands.",
      "AI-enabled opportunity is central to our competitive strategy and shapes where we invest and learn.",
    ],
  },
  {
    dimension: "operations",
    label: "OPPORTUNITY FOCUS",
    question: "How well do you choose and prioritise the opportunities that deserve action?",
    session: "Session 2",
    options: [
      "We react to urgent work and do not have a shared method for choosing improvement opportunities.",
      "We have a list of ideas, but decisions are mostly based on enthusiasm or whoever has time.",
      "We compare opportunities by customer value, effort and likely return before choosing what to test.",
      "Priorities have owners, deadlines and clear success measures, and we stop work that is not proving useful.",
      "Opportunity selection is disciplined, evidence-led and continuously improves our strategic position.",
    ],
  },
  {
    dimension: "sales",
    label: "EXECUTION SYSTEMS",
    question: "How reliably does your business turn priorities into changed ways of working?",
    session: "Session 3",
    options: [
      "Good ideas often stay in conversations; daily work has not changed because of our strategy.",
      "We make occasional improvements, but they depend on individual effort and are difficult to repeat.",
      "We test changed processes with a person responsible for checking quality and learning from the result.",
      "Priority workflows are documented, shared across the team and reviewed against agreed outcomes.",
      "Execution is a reliable advantage: the business learns faster and delivers outcomes competitors struggle to match.",
    ],
  },
  {
    dimension: "finance",
    label: "CAPABILITY AND ADOPTION",
    question: "How ready are your people to adopt, govern and improve new ways of working?",
    session: "Session 4",
    options: [
      "Change feels like extra work and there is no shared confidence, time or guidance to try it.",
      "A few people are interested, but skills, permissions and responsible-use expectations are inconsistent.",
      "People can use the new tools with practical guidance, human checks and space to share what they learn.",
      "Capability building is planned, adoption is supported by leaders and responsible use is part of routine work.",
      "Our culture makes disciplined experimentation and shared learning a normal part of how we compete.",
    ],
  },
  {
    dimension: "innovation",
    label: "EVIDENCE AND LEARNING",
    question: "How confidently can you show that your strategy and execution are creating results?",
    session: "Session 5",
    options: [
      "We mostly rely on activity and intuition; it is hard to show what changed or why it mattered.",
      "We collect some numbers and stories, but they are inconsistent and rarely shape the next decision.",
      "We track practical indicators and customer feedback to understand whether a change is working.",
      "Evidence is reviewed regularly, linked to strategic outcomes and used to improve the next cycle of work.",
      "We can clearly prove impact, learn quickly and use evidence to unlock stronger offers and decisions.",
    ],
  },
];

export const sectors = [
  "Construction and trades", "Property and facilities services", "Professional services and consulting",
  "Retail and e-commerce", "Manufacturing", "Hospitality and tourism", "Logistics and transport",
  "Agriculture and agri-processing", "Technology and digital", "Education and training", "Health and wellness",
  "Creative and media", "Other",
];

export const sizes = ["Just me", "2 to 5", "6 to 20", "21 to 50", "51 to 200", "200+"];

export const baselineDistribution = [30, 36, 22, 9, 3];
export const baselineDimensions = [2.3, 2.0, 2.2, 1.9, 1.8];

export const recommendationText: Record<ReadinessDimension, [string, string, string]> = {
  foundations: [
    "Start with one weekly task you hand to an AI assistant and a 30-minute walkthrough of what these tools can do for your sector.",
    "Turn your ideas into a short list with an owner and a date, and agree what done looks like for each.",
    "Build consistency across the team with a shared prompt library, a monthly review and a named owner for AI.",
  ],
  operations: [
    "Pick the most repetitive task in your week and rebuild it with an AI assistant and a checklist.",
    "Extend what already works to the next two processes and start recording the hours saved.",
    "Measure and publish the time saved, then look at handoffs between people and systems.",
  ],
  sales: [
    "Build one reusable proposal or tender skeleton with AI and a short company summary.",
    "Move from drafting to researching prospects and tailoring each proposal to what they care about.",
    "Feed win and loss learning back into your positioning and let AI keep the CRM honest.",
  ],
  finance: [
    "Get a simple job-costing sheet in place this month: direct costs, overhead share and margin.",
    "Add scenario columns to your costing model and a 13-week cash view.",
    "Automate the data feed into your dashboards and set decision triggers.",
  ],
  innovation: [
    "Map your customers' biggest pains against what you offer, then identify one opportunity.",
    "Test one new service concept with three customers before building anything.",
    "Protect your differentiation by documenting it, pricing it and scanning the market with AI.",
  ],
};
