import React, { useState } from 'react';

export default function HealthPlanForm() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    gender: '',
    dob: '',
    age: '',
    height: '',
    weight: '',
    allergies: '',
    medications: '',
    conditions: '',
    surgeries: '',
    exercise: '',
    diet: '',
    sleep: '',
    wakeTime: '',
    sleepTime: '',
    waterIntake: '',
    stress: '',
    workType: '',
    screenTime: '',
    mindfulness: '',
    locationType: '',
    regionType: '',
    climate: '',
    consent: false,
    privacy: false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitted Data:', formData);
    alert('Form submitted successfully. We will generate your health plan shortly.');
    // TODO: Send to backend or generate health plan
  };

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white rounded-2xl shadow-md">
      <h2 className="text-2xl font-bold mb-4">Mishby Health OS – Personalized Health Form</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
        <input name="fullName" placeholder="Full Name" className="input" onChange={handleChange} required />
        <input name="email" type="email" placeholder="Email Address" className="input" onChange={handleChange} required />
        <input name="mobile" placeholder="Mobile Number (Optional)" className="input" onChange={handleChange} />

        <select name="gender" onChange={handleChange} className="input" required>
          <option value="">Select Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>

        <input name="dob" type="date" placeholder="Date of Birth" className="input" onChange={handleChange} />
        <input name="age" placeholder="Age" className="input" onChange={handleChange} />
        <input name="height" placeholder="Height (cm or ft/in)" className="input" onChange={handleChange} />
        <input name="weight" placeholder="Weight (kg or lbs)" className="input" onChange={handleChange} />

        <textarea name="allergies" placeholder="Allergies (if any)" className="input" onChange={handleChange} />
        <textarea name="medications" placeholder="Current Medications" className="input" onChange={handleChange} />
        <textarea name="conditions" placeholder="Diagnosed Medical Conditions" className="input" onChange={handleChange} />
        <textarea name="surgeries" placeholder="Recent Surgeries or Injuries" className="input" onChange={handleChange} />

        <select name="exercise" onChange={handleChange} className="input">
          <option value="">Exercise Frequency</option>
          <option value="Daily">Daily</option>
          <option value="Occasionally">Occasionally</option>
          <option value="Rarely">Rarely</option>
          <option value="Never">Never</option>
        </select>

        <select name="diet" onChange={handleChange} className="input">
          <option value="">Select Diet Type</option>
          <option value="Vegetarian">Vegetarian</option>
          <option value="Vegan">Vegan</option>
          <option value="Non-Vegetarian">Non-Vegetarian</option>
          <option value="Jain">Jain</option>
          <option value="Ayurvedic">Ayurvedic</option>
          <option value="Other">Other</option>
        </select>

        <select name="sleep" onChange={handleChange} className="input">
          <option value="">Sleep Pattern</option>
          <option value="Deep Sleeper">Deep Sleeper</option>
          <option value="Light Sleeper">Light Sleeper</option>
          <option value="Insomnia">Insomnia</option>
          <option value="Regular">Regular</option>
        </select>

        <input name="wakeTime" type="time" placeholder="Wake-up Time" className="input" onChange={handleChange} />
        <input name="sleepTime" type="time" placeholder="Sleep Time" className="input" onChange={handleChange} />

        <select name="waterIntake" onChange={handleChange} className="input">
          <option value="">Water Intake per Day</option>
          <option value="< 1 liter">Less than 1 liter</option>
          <option value="1–2 liters">1–2 liters</option>
          <option value="2–3 liters">2–3 liters</option>
          <option value=">3 liters">More than 3 liters</option>
        </select>

        <textarea name="stress" placeholder="Any stress/mental health issue?" className="input" onChange={handleChange} />
        <input name="workType" placeholder="Work/Study Type (indoor/outdoor)" className="input" onChange={handleChange} />
        <input name="screenTime" placeholder="Screen Time per Day (in hours)" className="input" onChange={handleChange} />
        <input name="mindfulness" placeholder="Yoga/Prayer/Meditation Practice?" className="input" onChange={handleChange} />

        <select name="locationType" onChange={handleChange} className="input">
          <option value="">Living Area</option>
          <option value="City">City</option>
          <option value="Town">Town</option>
          <option value="Village">Village</option>
        </select>

        <select name="regionType" onChange={handleChange} className="input">
          <option value="">Geographical Region</option>
          <option value="Hill">Hill/Mountain</option>
          <option value="Plains">Plains/Plateau</option>
          <option value="Coastal">Coastal</option>
          <option value="Desert">Desert/Dry</option>
        </select>

        <select name="climate" onChange={handleChange} className="input">
          <option value="">Climate Type</option>
          <option value="Hot">Hot</option>
          <option value="Cold">Cold</option>
          <option value="Humid">Humid</option>
          <option value="Moderate">Moderate</option>
        </select>

        <label>
          <input type="checkbox" name="consent" onChange={handleChange} required /> I agree to receive personalized tips.
        </label>
        <label>
          <input type="checkbox" name="privacy" onChange={handleChange} required /> I understand my data will be kept private.
        </label>

        <button type="submit" className="mt-4 bg-green-600 text-white p-2 rounded-xl hover:bg-green-700">
          Submit
        </button>
      </form>
    </div>
  );
}
