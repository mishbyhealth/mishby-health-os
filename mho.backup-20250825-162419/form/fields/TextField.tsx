import React from "react";

type Props = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  errors?: string[];
  name?: string;
};

export default function TextField({ label, value, onChange, placeholder, errors, name }: Props) {
  const hasError = errors && errors.length > 0;
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-md border px-3 py-2 outline-none ${
          hasError ? "border-red-500" : "border-[color:var(--gw-border)]"
        }`}
      />
      {hasError && (
        <ul className="mt-1 text-xs text-red-600 list-disc list-inside">
          {errors!.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
