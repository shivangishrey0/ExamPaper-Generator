import React from "react";
import AdminNavbar from "./AdminNavbar";
import AdminSidebar from "./AdminSidebar";

export default function AdminDashboard() {
  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <AdminSidebar />

      <div className="flex-1">
        {/* Top Navbar */}
        <AdminNavbar />

        {/* Main Content */}
        <div className="p-6">
          <h1 className="text-3xl font-bold">Welcome to Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Your admin controls will appear here.</p>
        </div>
      </div>
    </div>
  );
}
