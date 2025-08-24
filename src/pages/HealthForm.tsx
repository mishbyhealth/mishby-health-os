// src/pages/HealthForm.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
// IMPORTANT: we will NOT use processForm for now (it’s likely overwriting the goal)
// import { processForm } from 'mho/engine/processForm';
import { buildPlan } from 'mho/planner/buildPlan';

// A tiny "ProcessedForm" shape that matches what buildPlan expects.
// (name: string | undefined, age: string | number | undefined, goal: string | undefined)
type SimpleProcessedForm = {
  name?: string;
  age?: string | number;
  goal?: string;
};

export default function HealthForm() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [goal, setGoal] = useState('Muscle Gain'); // default visible label

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // BYPASS processForm: send form values directly to the planner
    const processed: SimpleProcessedForm = {
      name,
      age: age,           // keep as string; planner coerces safely
      goal: goal,         // keep the visible label (e.g., "Muscle Gain")
    };

    const plan = buildPlan(processed as any);

    // Save for the view page
    localStorage.setItem('health-plan', JSON.stringify(plan));
    navigate('/health-plan/view');
  };

  return (
    <MainLayout>
      <div className="p-8 min-h-[60vh]">
        <h1 className="text-2xl font-semibold mb-4">Mishby Health — Health Form</h1>

        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          <div>
            <label className="block mb-1 font-medium">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Age</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="e.g., 35"
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Health Goal</label>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option>General Wellness</option>
              <option>Weight Loss</option>
              <option>Muscle Gain</option>
              <option>Diabetes Control</option>
              <option>Heart Health</option>
              <option>BP Control</option>
            </select>
          </div>

          <button
            type="submit"
            className="rounded bg-emerald-600 text-white px-4 py-2 hover:opacity-90"
          >
            Generate Plan
          </button>
        </form>
      </div>
    </MainLayout>
  );
}
