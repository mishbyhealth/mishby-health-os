/* features/health-plan/MultiStepHealthForm.tsx
 * Minimal, copy-paste friendly 5-step form skeleton
 * Steps: Basics -> Lifestyle -> Schedule -> Problems/Symptoms -> Uploads -> Review
 */
import React, { useState } from "react";

type FormData = any;

const Step = ({children}:{children:React.ReactNode}) => (
  <div className="p-4 border rounded-md space-y-4">{children}</div>
);

export default function MultiStepHealthForm({onSubmit}:{onSubmit:(data:FormData)=>void}){
  const [step,setStep]=useState(0);
  const [data,setData]=useState<FormData>({ locale:"en", lifestyle:{}, schedule:{}, problems:[], symptoms:[], uploads:{} });

  const next = ()=> setStep(s=>Math.min(s+1,5));
  const prev = ()=> setStep(s=>Math.max(s-1,0));
  const done = ()=> onSubmit(data);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">GloWell Health Form (Non-Clinical)</h2>

      {step===0 && <Step>
        <h3 className="font-medium">Basics</h3>
        <label className="block">Name <input className="border px-2 py-1 w-full" onChange={e=>setData({...data, profile:{...(data.profile||{}), name:e.target.value}})} /></label>
        <label className="block">Age <input type="number" className="border px-2 py-1 w-full" onChange={e=>setData({...data, profile:{...(data.profile||{}), age:+e.target.value}})} /></label>
        <label className="block">Sex
          <select className="border px-2 py-1 w-full" onChange={e=>setData({...data, profile:{...(data.profile||{}), sex:e.target.value}})}>
            <option value="">Select</option><option>male</option><option>female</option><option>other</option>
          </select>
        </label>
      </Step>}

      {step===1 && <Step>
        <h3 className="font-medium">Lifestyle</h3>
        <label className="block">Diet Type
          <select className="border px-2 py-1 w-full" onChange={e=>setData({...data, lifestyle:{...(data.lifestyle||{}), dietType:e.target.value}})}>
            <option value="">Select</option><option>vegan</option><option>veg</option><option>eggetarian</option><option>pescatarian</option><option>non-veg</option><option>mixed</option>
          </select>
        </label>
        <label className="block">Religion
          <select className="border px-2 py-1 w-full" onChange={e=>setData({...data, lifestyle:{...(data.lifestyle||{}), religion:e.target.value}})}>
            <option value="">None</option><option>jain</option><option>sattvic</option><option>halal</option><option>kosher</option>
          </select>
        </label>
      </Step>}

      {step===2 && <Step>
        <h3 className="font-medium">Schedule</h3>
        <label className="block">Wake (HH:MM) <input className="border px-2 py-1 w-full" placeholder="06:30" onChange={e=>setData({...data, schedule:{...(data.schedule||{}), wake:e.target.value}})} /></label>
        <label className="block">Sleep (HH:MM) <input className="border px-2 py-1 w-full" placeholder="22:30" onChange={e=>setData({...data, schedule:{...(data.schedule||{}), sleep:e.target.value}})} /></label>
      </Step>}

      {step===3 && <Step>
        <h3 className="font-medium">Problems & Symptoms (Non-Clinical)</h3>
        <label className="block">Known problems (comma separated)
          <input className="border px-2 py-1 w-full" onChange={e=>setData({...data, problems:e.target.value.split(",").map(s=>s.trim()).filter(Boolean)})} />
        </label>
        <label className="block">Current symptoms (comma separated)
          <input className="border px-2 py-1 w-full" onChange={e=>setData({...data, symptoms:e.target.value.split(",").map(s=>s.trim()).filter(Boolean)})} />
        </label>
      </Step>}

      {step===4 && <Step>
        <h3 className="font-medium">Uploads</h3>
        <p className="text-sm opacity-70">Upload doctor prescriptions, lab/blood reports, or other health docs. Used only to shape neutral wellness suggestions. Not medical advice.</p>
        <input type="file" multiple />
        {/* Wire to your storage service; save paths into data.uploads */}
      </Step>}

      {step===5 && <Step>
        <h3 className="font-medium">Review & Consent</h3>
        <p className="text-sm">By submitting, you agree this app shares general wellness suggestions only (non-clinical).</p>
        <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto">{JSON.stringify(data,null,2)}</pre>
      </Step>}

      <div className="flex gap-2">
        <button className="px-3 py-1 border rounded" onClick={prev} disabled={step===0}>Back</button>
        {step<5 ? <button className="px-3 py-1 border rounded" onClick={next}>Next</button> :
          <button className="px-3 py-1 border rounded bg-black text-white" onClick={done}>Submit</button>}
      </div>
    </div>
  );
}
