import type { ReadIssue, WorkbenchSnapshot } from "./contracts";
import { validateWorkbenchSnapshot as validateRuntime } from "./snapshot-guard.mjs";

export function validateWorkbenchSnapshot(value: unknown): ReadIssue[] {
  return validateRuntime(value);
}

export function isWorkbenchSnapshot(value: unknown): value is WorkbenchSnapshot {
  return validateWorkbenchSnapshot(value).length === 0;
}
