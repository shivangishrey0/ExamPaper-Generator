import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import imgA from "../assets/img7.jpg";
import imgB from "../assets/img1.jpg";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = [imgA, imgB];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [images.length]);

  const handleAdminLogin = () => {
    const adminUser = "admin";
    const adminPass = "admin123";

    if (username === adminUser && password === adminPass) {
      navigate("/admin/dashboard");
    } else {
      setMsg("Incorrect credentials.");
    }
  };

  return (
    <div className="min-h-screen flex bg-[#FDFBF7] relative">

      {/* Carousel */}
      <div className="absolute inset-0 lg:w-1/2 lg:relative overflow-hidden bg-slate-900 z-0">
        {images.map((img, index) => (
          <img
            key={index}
            src={img}
            alt={`Slide ${index}`}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${index === currentImageIndex ? 'opacity-50 lg:opacity-70' : 'opacity-0'
              }`}
          />
        ))}
        <div className="absolute inset-0 bg-slate-900/50 lg:bg-slate-900/40"></div>
        <div className="absolute bottom-0 left-0 p-10 lg:p-16 text-white z-10 hidden lg:block">
          <h2 className="text-4xl font-bold font-serif italic mb-4 animate-slide-up">Admin Control Center</h2>
          <p className="text-slate-200 text-lg max-w-md animate-slide-up">
            Manage exam papers, grading, and student records with precision and security.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 relative z-10">
        <div className="w-full max-w-md bg-white/90 lg:bg-transparent backdrop-blur-xl lg:backdrop-blur-none p-8 rounded-3xl shadow-2xl lg:shadow-none animate-slide-up">

          <div className="mb-8 text-center lg:text-left">
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 font-serif italic mb-2">Admin Login</h1>
            <p className="text-slate-600">Restricted access for administrators only.</p>
          </div>

          {msg && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm mb-6 border border-red-100 text-center">{msg}</div>}

          <div className="space-y-5">
            <input
              className="w-full p-4 bg-white/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <input
              type="password"
              className="w-full p-4 bg-white/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              onClick={handleAdminLogin}
              className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 active:scale-95"
            >
              Access Dashboard
            </button>
          </div>

          <div className="mt-8 text-center">
            <p onClick={() => navigate("/login")} className="text-slate-500 hover:text-slate-800 cursor-pointer text-sm">Return to Student Login</p>
          </div>

        </div>
      </div>
    </div>
  );
}
