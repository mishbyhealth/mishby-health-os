/* features/uploads/UploadsManager.tsx */
import React, { useState } from "react";
export default function UploadsManager(){
  const [files,setFiles]=useState<File[]>([]);
  return (<div className="p-4 space-y-3">
    <h2 className="text-xl font-semibold">Health Documents</h2>
    <input type="file" multiple onChange={e=>setFiles(Array.from(e.target.files||[]))}/>
    <ul className="list-disc pl-5">{files.map((f,i)=><li key={i}>{f.name}</li>)}</ul>
    <p className="text-sm opacity-70">Uploads help shape neutral wellness suggestions. Not medical advice.</p>
  </div>);
}