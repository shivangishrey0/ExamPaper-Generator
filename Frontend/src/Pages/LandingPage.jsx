import React from "react";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    // Outer container with light blue background
    <div className="min-h-screen bg-blue-50 flex items-center justify-center px-4">
      
      {/* Main Card container */}
      <div className="bg-white shadow-2xl p-10 rounded-2xl w-full max-w-lg text-center border-t-8 border-blue-900">

        {/* Title */}
        <h1 className="text-4xl font-extrabold mb-4 text-blue-900 tracking-tight">
          Exam Paper Generator
        </h1>
        <p className="text-gray-500 mb-10 text-lg">
          Welcome! Please select your role to continue.
        </p>

        {/* Buttons Container */}
        <div className="flex flex-col gap-4 space-y-2">

          {/* Admin Login - Darkest Navy */}
          <button
            onClick={() => navigate("/admin/login")}
            className="w-full bg-blue-900 text-white py-3.5 rounded-lg hover:bg-blue-800 transition duration-300 font-bold shadow-md"
          >
            Admin Login
          </button>

          {/* User Login - Medium Blue */}
          <button
            onClick={() => navigate("/login")}
            className="w-full bg-blue-600 text-white py-3.5 rounded-lg hover:bg-blue-500 transition duration-300 font-bold shadow-md"
          >
            User Login
          </button>

          {/* User Register - Outlined Style */}
          <button
            onClick={() => navigate("/register")}
            className="w-full bg-white text-blue-900 border-2 border-blue-900 py-3.5 rounded-lg hover:bg-blue-50 transition duration-300 font-bold"
          >
            User Register
          </button>

        </div>
      </div>
    </div>
  );
}