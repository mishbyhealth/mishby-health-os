export type Plan = {
  name: string;
  age: number;
  goal: string;
  recommendations: string[];
  notes?: string;
};

export default function PlanCard({ plan }: { plan: Plan }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="mb-2">
        <div className="text-sm text-gray-600">Name</div>
        <div className="text-lg font-medium">{plan.name}</div>
      </div>

      <div className="mb-2">
        <div className="text-sm text-gray-600">Age</div>
        <div className="text-lg font-medium">{plan.age}</div>
      </div>

      <div className="mb-2">
        <div className="text-sm text-gray-600">Goal</div>
        <div className="text-lg font-medium">{plan.goal}</div>
      </div>

      <div className="mb-2">
        <div className="text-sm text-gray-600">Recommendations</div>
        <ul className="list-disc pl-5">
          {plan.recommendations.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      </div>

      {plan.notes && (
        <div className="mt-3">
          <div className="text-sm text-gray-600">Notes</div>
          <div className="text-base">{plan.notes}</div>
        </div>
      )}
    </div>
  );
}
