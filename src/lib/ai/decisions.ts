export type Decision = "approved" | "changes" | "flagged" | "held" | "in-person" | "unsure" | "error";

export const DECISION_LABEL: Record<Decision, string> = {
  approved: "Approved",
  changes: "Sent back",
  flagged: "Flagged for a leader",
  held: "Left for a leader",
  "in-person": "Needs a leader in person",
  unsure: "Left for a leader",
  error: "Couldn't review",
};
