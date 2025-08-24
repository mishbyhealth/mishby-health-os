import type { HealthFormInput } from "mho/engine/processForm";

// Minimal validation for Step 1. Expand with schema rules in Step 2.
export function validateHealthForm(input: HealthFormInput) {
  const errors: Record<string, string> = {};

  if (!input.name?.trim()) {
    errors.name = "Name is required.";
  }
  if (!input.age?.toString().trim()) {
    errors.age = "Age is required.";
  } else if (!/^\d+$/.test(String(input.age))) {
    errors.age = "Age must be a number.";
  }
  if (!input.goal?.trim()) {
    errors.goal = "Please select a health goal.";
  }

  return errors;
}
