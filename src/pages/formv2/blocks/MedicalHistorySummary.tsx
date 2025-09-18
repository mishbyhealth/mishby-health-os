import React, { useMemo } from "react";
import { Link } from "react-router-dom";

/**
 * MedicalHistorySummary — read-only card for Review screen
 * Data source: localStorage key "glowell:draft:v2.2" -> draft.medicalHistory
 * Additive-only; no new storage keys; safe for v19.x
 */

const DRAFT_KEY = "glowell:draft:v2.2";

type SurgeryEntry = {
  procedure: string;
  year: string;        // free text (YYYY)
  notes?: string;
};

type LifestyleRisks = {
  tobacco: {
    uses: boolean;
    type?: "smoking" | "chewing" | "occasionally" | "other" | "";
    amountPerDay?: string;
    years?: string;
  };
  alcohol: {
    uses: boolean;
    frequency?: "rare" | "weekly" | "daily" | "occasionally" | "";
    unitsPerWeek?: string;
  };
};

type MedicalHistoryDraft = {
  chronicConditions: string[];
  pastSurgeries: SurgeryEntry[];
  pastIllnesses: string;
  familyHistory: string;
  vaccinations: string;
  womensHistory?: string;
  lifestyleRisks: LifestyleRisks;
  lastKnownLabs: string;
};

type DraftShape = {
  medicalHistory?: MedicalHistoryDraft;
};

function safeParse<T>(raw: string | null, fb: T): T {
  try {
    return raw ? ((JSON.parse(raw) as T) ?? fb) : fb;
  } catch {
    return fb;
  }
}

function useDraft(): DraftShape {
  return useMemo(
    () => safeParse<DraftShape>(localStorage.getItem(DRAFT_KEY), {}),
    []
  );
}

function FieldRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-start md:gap-3 py-1">
      <div className="md:w-48 shrink-0 font-medium text-gray-700">{label}</div>
      <div className="flex-1">{value}</div>
    </div>
  );
}

function ListOrDash({ items }: { items: string[] }) {
  if (!items || items.length === 0) return <span>—</span>;
  return (
    <ul className="list-disc ml-5">
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ul>
  );
}

export default function MedicalHistorySummary({
  className = "",
  title = "Medical History",
}: {
  className?: string;
  title?: string;
}) {
  const draft = useDraft();
  const mh = draft.medicalHistory;

  // graceful empty state
  if (!mh) {
    return (
      <div className={`p-4 rounded-md border bg-white ${className}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{title}</h2>
          <Link
            to="/form/history"
            className="text-sm px-3 py-1 rounded-md border hover:bg-gray-50"
          >
            Edit
          </Link>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          No medical history saved yet. Fill it on the <b>History</b> tab.
        </p>
      </div>
    );
  }

  const {
    chronicConditions = [],
    pastSurgeries = [],
    pastIllnesses = "",
    familyHistory = "",
    vaccinations = "",
    womensHistory = "",
    lifestyleRisks,
    lastKnownLabs = "",
  } = mh;

  const tobacco =
    lifestyleRisks?.tobacco?.uses
      ? [
          lifestyleRisks.tobacco.type ? `Type: ${lifestyleRisks.tobacco.type}` : "",
          lifestyleRisks.tobacco.amountPerDay
            ? `Amount/day: ${lifestyleRisks.tobacco.amountPerDay}`
            : "",
          lifestyleRisks.tobacco.years ? `Years: ${lifestyleRisks.tobacco.years}` : "",
        ]
          .filter(Boolean)
          .join(" · ")
      : "No use";

  const alcohol =
    lifestyleRisks?.alcohol?.uses
      ? [
          lifestyleRisks.alcohol.frequency
            ? `Frequency: ${lifestyleRisks.alcohol.frequency}`
            : "",
          lifestyleRisks.alcohol.unitsPerWeek
            ? `Units/week: ${lifestyleRisks.alcohol.unitsPerWeek}`
            : "",
        ]
          .filter(Boolean)
          .join(" · ")
      : "No use";

  return (
    <div className={`p-4 md:p-5 rounded-md border bg-white ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{title}</h2>
        {/* Edit takes user to the History editor */}
        <Link
          to="/form/history"
          className="text-sm px-3 py-1 rounded-md border hover:bg-gray-50"
          title="Go to Medical History editor"
        >
          Edit
        </Link>
      </div>

      <div className="mt-3 space-y-3">
        <FieldRow
          label="Chronic Conditions"
          value={<ListOrDash items={chronicConditions} />}
        />

        <FieldRow
          label="Past Surgeries / Hospitalizations"
          value={
            pastSurgeries.length === 0 ? (
              <span>—</span>
            ) : (
              <ul className="list-disc ml-5">
                {pastSurgeries.map((s, i) => {
                  const line = [s.procedure, s.year && `(${s.year})`, s.notes]
                    .filter(Boolean)
                    .join(" ");
                  return <li key={i}>{line || "—"}</li>;
                })}
              </ul>
            )
          }
        />

        <FieldRow
          label="Significant Past Illnesses"
          value={pastIllnesses?.trim() ? pastIllnesses : "—"}
        />

        <FieldRow
          label="Family History"
          value={familyHistory?.trim() ? familyHistory : "—"}
        />

        <FieldRow
          label="Vaccinations"
          value={vaccinations?.trim() ? vaccinations : "—"}
        />

        <FieldRow
          label="Women’s History"
          value={womensHistory?.trim() ? womensHistory : "—"}
        />

        <FieldRow label="Lifestyle — Tobacco" value={tobacco || "—"} />
        <FieldRow label="Lifestyle — Alcohol" value={alcohol || "—"} />

        <FieldRow
          label="Last Known Labs"
          value={lastKnownLabs?.trim() ? lastKnownLabs : "—"}
        />
      </div>
    </div>
  );
}
