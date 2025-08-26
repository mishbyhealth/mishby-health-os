import { useEffect, useMemo, useState } from "react";
import Ajv, { ErrorObject } from "ajv";
import addFormats from "ajv-formats";
import schema from "./healthForm.schema.json";

// ---- types ----
type Profile = {
  name?: string;
  age?: number;
  sex?: string;
  heightCm?: number;
  weightKg?: number;
  locale?: string;
  country?: string;
};
type FormData = {
  profile: Profile;
  lifestyle?: any;
  preferences?: any;
  goals?: string[];
  [k: string]: any;
};

// ---- defaults ----
const DRAFT_KEY = "gw.form.draft";
const defaultData: FormData = {
  profile: {
    name: "",
    age: undefined,
    sex: "other",
    heightCm: undefined,
    weightKg: undefined,
    locale: "en-IN",
    country: "IN",
  },
};

// one AJV instance (ESM-safe)
function makeAjv() {
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  return ajv;
}

function messagesForPointer(errors: ErrorObject[] | null | undefined, pointer: string): string[] {
  if (!errors || errors.length === 0) return [];
  return errors
    .filter((e) => e.instancePath === pointer || e.instancePath.startsWith(pointer + "/"))
    .map((e) => e.message || "Invalid");
}

export function useSchemaForm() {
  const [data, setData] = useState<FormData>(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      return raw ? { ...defaultData, ...JSON.parse(raw) } : { ...defaultData };
    } catch {
      return { ...defaultData };
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
    } catch {}
  }, [data]);

  const { validate } = useMemo(() => {
    const ajv = makeAjv();
    const validate = ajv.compile(schema as any);
    return { validate };
  }, []);

  function setProfile(p: Partial<Profile>) {
    setData((prev) => ({ ...prev, profile: { ...prev.profile, ...p } }));
  }

  function validateAll() {
    const ok = validate(data);
    return { valid: Boolean(ok), errors: validate.errors || [] };
  }

  function validateField(pointer: string): string[] {
    const ok = validate(data);
    if (ok) return [];
    return messagesForPointer(validate.errors, pointer);
  }

  function clearDraft() {
    setData({ ...defaultData });
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {}
  }

  return { data, setProfile, validateAll, validateField, clearDraft };
}

export default useSchemaForm;
