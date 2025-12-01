import React from "react";

export default function AdminNavbar() {
  return (
    <div className="w-full bg-blue-900 text-white p-4 shadow-md flex justify-between items-center">
      <h2 className="text-2xl font-bold">Admin Panel</h2>
      <button className="bg-red-600 px-4 py-2 rounded">Logout</button>
    </div>
  );
}
