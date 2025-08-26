// mho/form/ajv.ts
// Centralized AJV factory + tiny helper for schema validation.
// No extra deps beyond "ajv" itself.

import Ajv, { ErrorObject } from "ajv";

// Create and return a configured AJV instance
export function makeAjv(): Ajv {
  const ajv = new Ajv({
    allErrors: true,      // collect all errors so we can show them at once
    coerceTypes: true,    // coerce strings->numbers where safe
    useDefaults: true,    // apply default values from schema (if any)
    removeAdditional: false
  });

  // If you later add formats, you can enable them here:
  // import addFormats from "ajv-formats";
  // addFormats(ajv);

  return ajv;
}

// Compile a validator function for a given JSON schema.
// T is the inferred/declared data type you expect from the form.
export function makeValidator<T = any>(schema: unknown) {
  const ajv = makeAjv();
  const validate = ajv.compile<T>(schema as any);

  return (data: unknown): { ok: true; data: T } | { ok: false; errors: string[] } => {
    const ok = validate(data as any);
    if (ok) {
      return { ok: true, data: data as T };
    }
    const errors = (validate.errors ?? []).map(formatAjvError);
    return { ok: false, errors };
  };
}

function formatAjvError(e: ErrorObject): string {
  const path = e.instancePath || "/";
  const msg = e.message || "invalid";
  // Include params if useful (e.g., limit values)
  const extras = e.params && Object.keys(e.params).length ? ` (${JSON.stringify(e.params)})` : "";
  return `${path} ${msg}${extras}`;
}
