export default function Terms() {
  return (
    <div className="space-y-6">
      <section className="gw-card tinted">
        <h1 className="text-xl font-semibold">Terms & Conditions</h1>
        <p className="gw-muted text-sm mt-1">
          GloWell provides non-clinical wellness guidance. It is not a substitute for professional medical advice, diagnosis, or treatment.
        </p>
      </section>

      <section className="gw-card">
        <h2 className="font-medium">Use of Service</h2>
        <ul className="mt-2 text-sm gw-muted list-disc pl-5 space-y-1">
          <li>Personal, non-commercial use.</li>
          <li>No emergency use. For urgent issues, contact local health services.</li>
          <li>Content is informational; consult a qualified professional when needed.</li>
        </ul>
      </section>

      <section className="gw-card">
        <h2 className="font-medium">Privacy</h2>
        <p className="mt-2 text-sm gw-muted">
          Data is stored locally on your device. You control exports and backups.
        </p>
      </section>
    </div>
  );
}
