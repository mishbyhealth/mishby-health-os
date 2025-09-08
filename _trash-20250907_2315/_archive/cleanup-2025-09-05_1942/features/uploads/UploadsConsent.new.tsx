/* features/uploads/UploadsConsent.tsx */
import React from "react";
export default function UploadsConsent(){
  return (<div className="p-4 space-y-2">
    <h3 className="font-medium">Consent for Using Uploads</h3>
    <label className="flex items-center gap-2"><input type="checkbox" defaultChecked/> Allow using uploads to adjust suggestions</label>
    <label className="flex items-center gap-2"><input type="checkbox" defaultChecked/> Store uploads for later reference</label>
    <label className="flex items-center gap-2">Auto-delete after <input className="border px-2 py-1 w-16" defaultValue={90}/> days</label>
  </div>);
}