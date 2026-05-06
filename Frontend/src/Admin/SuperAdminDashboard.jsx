import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Components/AuthContext";
import ManageUsers from "./ManageUsers";
import TeacherDashboard from "./TeacherDashboard";

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { auth, clearSession } = useAuth();
  const [activeTab, setActiveTab] = useState("users");

  const tabs = [
    { id: "users", label: "Manage Users" },
    { id: "exams", label: "Manage Exams" },
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
            <p className="text-stone-600">
              Welcome, {auth.name || "SuperAdmin"} &mdash;
              <span className="ml-1 px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs font-semibold uppercase">
                superadmin
              </span>
            </p>
          </div>
          <button
            onClick={() => { clearSession(); navigate("/login"); }}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded font-medium ${
                activeTab === tab.id
                  ? "bg-stone-900 text-white"
                  : "bg-white border text-stone-700 hover:bg-stone-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "users" && <ManageUsers />}

        {/* Superadmin can also manage exams — reuses TeacherDashboard internals */}
        {activeTab === "exams" && <TeacherDashboard embeddedMode />}

      </div>
    </div>
  );
}
