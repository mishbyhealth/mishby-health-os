import React from "react";

export default function Profile() {
  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-bold">Profile</h1>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-semibold">Personal Info</h3>
          <div className="mt-3 grid gap-3">
            <input className="input" placeholder="Full name" />
            <input className="input" placeholder="Email" />
          </div>
          <button className="mt-4 btn btn-primary">Save</button>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold">Preferences</h3>
          <div className="mt-3 grid gap-3">
            <input className="input" placeholder="Diet preference" />
            <input className="input" placeholder="Activity level" />
          </div>
          <button className="mt-4 btn btn-outline">Update</button>
        </div>
      </div>
    </div>
  );
}
