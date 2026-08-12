export type GuardIssue = {
  code: string;
  severity: "info" | "warning" | "error" | "blocked";
  message: string;
  sourceId?: string;
  subjectId?: string;
};

export function validateWorkbenchSnapshot(value: unknown): GuardIssue[];
