import React from "react";
import { useNavigate } from "react-router-dom";

export default function AdminSidebar() {
  const navigate = useNavigate();

  return (
    <div className="w-64 bg-blue-950 text-white min-h-screen p-6">
      <h3 className="text-xl font-bold mb-6">Menu</h3>

      <ul className="space-y-4">
        <li
          className="cursor-pointer hover:text-blue-300"
          onClick={() => navigate("/admin-dashboard")}
        >
          Dashboard
        </li>

        <li
          className="cursor-pointer hover:text-blue-300"
          onClick={() => navigate("/admin-create-paper")}
        >
          Create Question Paper
        </li>

        <li
          className="cursor-pointer hover:text-blue-300"
          onClick={() => navigate("/admin-view-users")}
        >
          View Users
        </li>
      </ul>
    </div>
  );
}
