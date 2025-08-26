/* ${featuresV2}/uploads-v2/UploadsBeautifulV2.tsx */
import React, { useState } from "react";
export default function UploadsBeautifulV2(){
  const [files,setFiles]=useState<File[]>([]);
  return (
    <div className="bg-white/90 backdrop-blur p-6 rounded-2xl shadow-lg border border-gray-100">
      <h3 className="text-lg font-semibold text-emerald-900 mb-2">Health Documents</h3>
      <p className="text-sm text-gray-600 mb-3">Optional uploads to refine neutral suggestions. Not medical advice.</p>
      <input
        type="file"
        multiple
        onChange={e=>setFiles(Array.from(e.target.files||[]))}
        className="block w-full file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-emerald-600 file:text-white hover:file:bg-emerald-700"
      />
      <ul className="list-disc pl-6 mt-3 text-sm">{files.map((f,i)=><li key={i}>{f.name}</li>)}</ul>
    </div>
  );
}