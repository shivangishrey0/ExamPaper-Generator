import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
// Importing multiple images for carousel
import imgA from "../assets/img5.jpg";
import imgB from "../assets/img6.jpg";
import imgC from "../assets/img8.jpg";

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  // Carousel State
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = [imgA, imgB, imgC];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 4000); // Change image every 4 seconds
    return () => clearInterval(interval);
  }, [images.length]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", data.userId);
        localStorage.setItem("username", data.username);
        navigate("/user/dashboard");
      } else {
        alert(data.message || "Login failed");
      }
    } catch (error) {
      console.error("Login Error:", error);
      alert("Server error. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#FDFBF7] relative">

      {/* Background Image Container (Visible on all screens, but covered by form on large) */}
      <div className="absolute inset-0 lg:w-1/2 lg:relative overflow-hidden bg-stone-900 z-0">
        {images.map((img, index) => (
          <img
            key={index}
            src={img}
            alt={`Slide ${index}`}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${index === currentImageIndex ? 'opacity-60 lg:opacity-80' : 'opacity-0'
              }`}
          />
        ))}
        <div className="absolute inset-0 bg-stone-900/40 lg:bg-stone-900/30"></div>

        {/* Carousel Content */}
        <div className="absolute bottom-0 left-0 p-10 lg:p-16 text-white z-10 hidden lg:block">
          <h2 className="text-4xl font-bold font-serif italic mb-4 animate-slide-up">Empowering Education.</h2>
          <p className="text-stone-200 text-lg max-w-md animate-slide-up" style={{ animationDelay: '0.2s' }}>
            Seamlessly manage exams and assessments with our cutting-edge paper generator platform.
          </p>
          {/* Dots */}
          <div className="flex gap-2 mt-6">
            {images.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentImageIndex ? 'w-8 bg-white' : 'w-2 bg-white/50'}`}></div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Container */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 relative z-10">

        {/* Mobile Frosted Glass Effect */}
        <div className="w-full max-w-md bg-white/90 lg:bg-transparent backdrop-blur-xl lg:backdrop-blur-none p-8 rounded-3xl shadow-2xl lg:shadow-none animate-slide-up">

          <div className="mb-8 text-center lg:text-left">
            <h1 className="text-3xl lg:text-4xl font-bold text-stone-900 font-serif italic mb-2">Student Login</h1>
            <p className="text-stone-600">Enter your credentials to access your dashboard.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2 uppercase tracking-wide">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-4 bg-white/80 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all shadow-sm"
                placeholder="student@example.com"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-bold text-stone-700 uppercase tracking-wide">Password</label>
                <Link to="/forgot-password" className="text-xs text-amber-700 hover:text-amber-800 font-semibold">Forgot?</Link>
              </div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full p-4 bg-white/80 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all shadow-sm"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-transform transform active:scale-95 ${loading ? "bg-stone-500 cursor-not-allowed" : "bg-stone-900 hover:bg-stone-800 shadow-stone-900/20"
                }`}
            >
              {loading ? "Verifying..." : "Sign In"}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-stone-600">New around here? <Link to="/register" className="text-stone-900 font-bold hover:underline">Register now</Link></p>
          </div>

          <div className="mt-6 pt-6 border-t border-stone-200/50 text-center">
            <Link to="/admin/login" className="text-xs font-bold text-stone-400 hover:text-stone-600 uppercase tracking-widest transition-colors">Admin Access</Link>
          </div>

        </div>
      </div>
    </div>
  );
}