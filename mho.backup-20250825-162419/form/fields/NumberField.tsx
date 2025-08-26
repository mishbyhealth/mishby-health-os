import React from "react";

type Props = {
  name: string;
  label: string;
  value: number | undefined;
  onChange: (v: number) => void;   // keep your existing signature
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  errors?: string[];
};

export default function NumberField({
  name, label, value, onChange, min, max, step, placeholder, errors = []
}: Props) {
  // show empty when undefined/NaN
  const display = value == null || Number.isNaN(value) ? "" : String(value);

  return (
    <label className="grid gap-1 mb-3">
      <span className="text-sm font-medium">{label}</span>
      <input
        name={name}
        type="number"
        className="border p-2 rounded"
        value={display}
        min={min}
        max={max}
        step={step ?? "any"}
        placeholder={placeholder ?? "Enter a number"}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          const s = e.target.value;
          if (s === "") {
            // keep existing external type (number) by sending NaN as a sentinel
            onChange(NaN as unknown as number);
            return;
          }
          const n = Number(s);
          onChange(n);
        }}
      />
      {errors.length > 0 && (
        <ul className="text-red-600 text-xs list-disc pl-5">
          {errors.map((m: string, i: number) => <li key={i}>{m}</li>)}
        </ul>
      )}
    </label>
  );
}
