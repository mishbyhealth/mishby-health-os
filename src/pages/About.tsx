export default function About() {
  return (
    <div className="space-y-6">
      <section className="gw-card tinted">
        <h1 className="text-xl font-semibold">About GloWell</h1>
        <p className="gw-muted text-sm mt-1">
          GloWell is a non-clinical wellness companion. It helps you build a balanced day —
          hydration, meals, movement, and gentle tips — with privacy by default.
        </p>
      </section>

      <section className="gw-card">
        <h2 className="font-medium">Principles</h2>
        <ul className="mt-2 text-sm gw-muted list-disc pl-5 space-y-1">
          <li>Privacy-first: data stays on your device (localStorage).</li>
          <li>Natural guidance: simple habits, food combos, and daily rhythm.</li>
          <li>Export-friendly: JSON/CSV/ZIP for backup or sharing.</li>
          <li>Inclusive: supports diet types and regional preferences.</li>
        </ul>
      </section>
    </div>
  );
}
