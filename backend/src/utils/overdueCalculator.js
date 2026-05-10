/**
 * Determines the follow-up stage based on overdue days.
 *
 * Stage 1 →  1–7  days   warm reminder
 * Stage 2 →  8–14 days   polite but firm
 * Stage 3 → 15–21 days   formal notice
 * Stage 4 → 22–30 days   stern final warning
 * Stage 5 → 30+  days    escalate (legal / collections)
 */
const getStageFromOverdueDays = (days) => {
  if (days <= 0) return 0;           
  if (days <= 7) return 1;
  if (days <= 14) return 2;
  if (days <= 21) return 3;
  if (days <= 30) return 4;
  return 5;                 
};

const STAGE_LABELS = {
  0: "current",
  1: "warm_reminder",
  2: "polite_firm",
  3: "formal_notice",
  4: "final_warning",
  5: "escalated",
};

const calcOverdueDays = (dueDate) => {
  const now = new Date();
  const due = new Date(dueDate);
  const diff = Math.floor((now - due) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
};

module.exports = { getStageFromOverdueDays, calcOverdueDays, STAGE_LABELS };
