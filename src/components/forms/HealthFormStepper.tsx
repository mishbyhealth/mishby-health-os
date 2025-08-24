// BEGIN: src/components/forms/HealthFormStepper.tsx
import React from "react";

export type HealthFormStepperPropsBase = {
  title: string;
  stepIndex: number;      // 0-based
  totalSteps: number;     // total number of steps

  // Navigation / actions
  onContinue?: () => Promise<void> | void; // primary action (Next/Continue)
  onNext?: () => Promise<void> | void;     // legacy/compat alias
  onPrev?: () => Promise<void> | void;     // legacy name used in some callers
  onBack?: () => Promise<void> | void;     // alias supported for compatibility
  onSaveDraft?: () => Promise<void> | void;
  onSubmit?: () => Promise<void> | void;

  // State
  isSubmitting?: boolean;
  lastStep?: boolean;

  // Styling
  className?: string;
};

export type HealthFormStepperProps = React.PropsWithChildren<HealthFormStepperPropsBase>;

function boxStyle(padding = 16): React.CSSProperties {
  return {
    background: "#fff",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.06)",
    boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
    padding,
  };
}

function btnStyle(): React.CSSProperties {
  return {
    padding: "8px 14px",
    borderRadius: 8,
    border: "1px solid rgba(0,0,0,0.12)",
    background: "#fff",
    cursor: "pointer",
    fontSize: 14,
  };
}

const HealthFormStepper: React.FC<HealthFormStepperProps> = ({
  title,
  stepIndex,
  totalSteps,
  children,
  onContinue,
  onNext,
  onPrev,
  onBack,
  onSaveDraft,
  onSubmit,
  isSubmitting = false,
  lastStep = false,
  className = "",
}) => {
  const stepLabel = `Step ${stepIndex + 1} of ${totalSteps}`;

  const handlePrimary = async () => {
    if (onContinue) return await onContinue();
    if (onNext) return await onNext();
  };

  const handleBack = async () => {
    if (onBack) return await onBack();
    if (onPrev) return await onPrev();
  };

  return (
    <div style={{ width: "100%", maxWidth: 880, margin: "0 auto", padding: "16px 16px 0 16px" }} className={className}>
      <header style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, opacity: 0.7 }}>{stepLabel}</div>
        <h1 style={{ fontSize: 22, fontWeight: 600, marginTop: 4 }}>{title}</h1>
      </header>

      <section style={boxStyle(16)}>{children}</section>

      <div style={{ height: 84 }} />

      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 999,
        }}
      >
        <div style={{ maxWidth: 880, margin: "0 auto", padding: "0 16px 0 16px" }}>
          <footer
            style={{
              ...boxStyle(12),
              backdropFilter: "saturate(180%) blur(6px)",
              background: "rgba(255,255,255,0.92)",
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", gap: 8 }}>
                {(onBack || onPrev) && (
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={isSubmitting}
                    style={btnStyle()}
                  >
                    Back
                  </button>
                )}
                {onSaveDraft && (
                  <button
                    type="button"
                    onClick={onSaveDraft}
                    disabled={isSubmitting}
                    style={btnStyle()}
                  >
                    Save draft
                  </button>
                )}
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                {!lastStep ? (
                  <button
                    type="button"
                    onClick={handlePrimary}
                    disabled={isSubmitting}
                    style={btnStyle()}
                  >
                    {isSubmitting ? "Please wait…" : "Continue"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onSubmit}
                    disabled={isSubmitting}
                    style={btnStyle()}
                  >
                    {isSubmitting ? "Submitting…" : "Submit"}
                  </button>
                )}
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default HealthFormStepper;
export { HealthFormStepper };
// NOTE: We already exported `export type HealthFormStepperProps` above.
// Do NOT re-export the type again here to avoid TS2484 conflicts.
// END: src/components/forms/HealthFormStepper.tsx
