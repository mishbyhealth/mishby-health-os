import React from 'react';
import HealthPlanForm from '../components/HealthPlanForm'; // ✅ Make sure this path is correct

const PlanForm = () => {
  return (
    <div className="min-h-screen bg-[#fdf6ec] text-gray-800 p-6 flex flex-col items-center justify-start">
      <h1 className="text-3xl font-bold text-green-800 mb-6">Plan Your Healing Journey</h1>
      <p className="text-center text-lg text-gray-700 mb-4">
        Welcome! Please fill your health information in the full form.
      </p>

      <div className="w-full max-w-4xl">
        <HealthPlanForm />
      </div>
    </div>
  );
};

export default PlanForm;
