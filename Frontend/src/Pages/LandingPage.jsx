import React from "react";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white shadow-xl p-10 rounded-2xl w-full max-w-2xl text-center">

        {/* Title */}
        <h1 className="text-4xl font-bold mb-4">
          Exam Paper Generator
        </h1>
        <p className="text-gray-600 mb-8">
          Welcome! Choose how you want to continue.
        </p>

        {/* Buttons */}
        <div className="flex flex-col gap-4">

          <button
            onClick={() => navigate("/admin/login")}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Admin Login
          </button>

          <button
            onClick={() => navigate("/login")}
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition"
          >
            User Login
          </button>

          <button
            onClick={() => navigate("/register")}
            className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition"
          >
            User Register
          </button>

        </div>
      </div>
    </div>
  );
}
