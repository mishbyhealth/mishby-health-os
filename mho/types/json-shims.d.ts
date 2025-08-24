// mho/types/json-shims.d.ts
declare module "mho/form/healthForm.schema" {
  const value: any;
  export default value;
}

declare module "*.json?raw" {
  const value: string;
  export default value;
}
