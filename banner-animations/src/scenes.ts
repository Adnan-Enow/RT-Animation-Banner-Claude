/**
 * Scene definitions shared by V1 (UI-based) and V2 (skeleton).
 * Each scene represents one service pillar in the marketing banner.
 */

export type Scene = {
  title: string;
  author: string;
  tabs: [string, string, string, string];
  steps: [string, string, string, string, string];
  /** Skeleton layout style for V2. */
  skeleton: "paragraph" | "code" | "list" | "grid";
};

export const SCENES: Scene[] = [
  {
    title: "Proposal Writing",
    author: "Henry Arthur",
    tabs: ["Outline", "Draft", "Review", "Finalize"],
    steps: [
      "Project overview",
      "Scope & objectives",
      "Approach & methodology",
      "Timeline & milestones",
      "Pricing & next steps",
    ],
    skeleton: "paragraph",
  },
  {
    title: "Software Development",
    author: "Priya Shah",
    tabs: ["Plan", "Build", "Test", "Ship"],
    steps: [
      "Requirements & specs",
      "System architecture",
      "Feature implementation",
      "QA & test cycles",
      "Release & deployment",
    ],
    skeleton: "code",
  },
  {
    title: "Staffing & Recruitment",
    author: "Daniel Cole",
    tabs: ["Source", "Screen", "Match", "Place"],
    steps: [
      "Role intake brief",
      "Candidate sourcing",
      "Screening & interviews",
      "Client shortlist",
      "Offer & onboarding",
    ],
    skeleton: "list",
  },
  {
    title: "IT Support Services",
    author: "Maya Iyer",
    tabs: ["Triage", "Diagnose", "Resolve", "Verify"],
    steps: [
      "Ticket received",
      "Issue diagnosis",
      "Resolution plan",
      "Fix applied",
      "Verification & close",
    ],
    skeleton: "grid",
  },
];

/** Per-scene active-tab boundaries: at which step index does each tab activate? */
export const TAB_BOUNDARIES = [0, 2, 3, 4] as const;
