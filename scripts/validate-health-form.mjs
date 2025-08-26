// scripts/validate-health-form.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import Ajv from "ajv";
import addFormats from "ajv-formats";

const __dirname = dirname(fileURLToPath(import.meta.url));
const R = (p) => resolve(__dirname, "..", p);

const schema = JSON.parse(readFileSync(R("mho/form/healthForm.schema.json"), "utf8"));
const example = JSON.parse(readFileSync(R("mho/form/example.profile.json"), "utf8"));

const ajv = new Ajv({ allErrors: true, strict: false }); // Draft-07 friendly
addFormats(ajv);

const validate = ajv.compile(schema);
const ok = validate(example);

if (ok) {
  console.log("✅ example.profile.json is VALID against healthForm.schema.json");
  process.exit(0);
} else {
  console.error("❌ example.profile.json is NOT valid. Errors:");
  console.error(validate.errors);
  process.exit(1);
}
