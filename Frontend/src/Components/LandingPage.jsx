import React from "react";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#021026] via-[#02182b] to-black">
      <div className="text-center px-6 py-10">
        <h1 className="text-5xl font-extrabold mb-12 text-white drop-shadow-lg">Exam Paper Generator</h1>

        <div className="w-1/2 mx-auto">
          <div className="flex gap-16 justify-center items-center">
            <button
              onClick={() => navigate('/user-login')}
              className="flex-1 min-w-[220px] px-24 py-8 rounded-full text-3xl font-extrabold text-white bg-gradient-to-r from-[#054fa3] via-[#0777c9] to-black shadow-[0_30px_60px_rgba(3,37,76,0.6)] transform hover:scale-105 transition"
            >
              Login as User
            </button>

            <button
              onClick={() => navigate('/admin-login')}
              className="flex-1 min-w-[220px] px-24 py-8 rounded-full text-3xl font-extrabold text-white bg-gradient-to-r from-black via-[#063b6b] to-[#0777c9] shadow-[0_30px_60px_rgba(3,37,76,0.6)] transform hover:scale-105 transition"
            >
              Login as Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
