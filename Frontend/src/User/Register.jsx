import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import imgA from "../assets/img2.jpg";
import imgB from "../assets/img3.jpg";
import imgC from "../assets/img4.jpg";

export default function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = [imgA, imgB, imgC];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [images.length]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setMsg("");

    if (!username.trim()) { setError("Username is required"); return; }
    if (!email.trim()) { setError("Email is required"); return; }
    if (!password || password.length < 6) { setError("Password must be at least 6 characters"); return; }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/register-start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), email: email.trim(), password }),
      });

      const data = await res.json();

      if (res.ok) {
        setMsg(data.message || "OTP sent successfully");
        setTimeout(() => {
          navigate("/verify-otp", { state: { email: email.trim() } });
        }, 1000);
      } else {
        setError(data.message || "Registration failed");
      }
    } catch (err) {
      console.error("Register Error:", err);
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#FDFBF7] relative">

      {/* Carousel */}
      <div className="absolute inset-0 lg:w-1/2 lg:relative overflow-hidden bg-stone-900 z-0">
        {images.map((img, index) => (
          <img
            key={index}
            src={img}
            alt={`Slide ${index}`}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${index === currentImageIndex ? 'opacity-50 lg:opacity-70' : 'opacity-0'
              }`}
          />
        ))}
        <div className="absolute inset-0 bg-stone-900/40 lg:bg-stone-900/30"></div>
        <div className="absolute bottom-0 left-0 p-10 lg:p-16 text-white z-10 hidden lg:block">
          <h2 className="text-4xl font-bold font-serif italic mb-4 animate-slide-up">Join the Future.</h2>
          <p className="text-stone-200 text-lg max-w-md animate-slide-up">
            Create an account to start taking online exams and tracking your performance in real-time.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 relative z-10">
        <div className="w-full max-w-md bg-white/90 lg:bg-transparent backdrop-blur-xl lg:backdrop-blur-none p-8 rounded-3xl shadow-2xl lg:shadow-none animate-slide-up">

          <div className="mb-6 text-center lg:text-left">
            <h1 className="text-3xl lg:text-4xl font-bold text-stone-900 font-serif italic mb-2">Create Account</h1>
            <p className="text-stone-600">Register to get started.</p>
          </div>

          {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm mb-4 border border-red-100">{error}</div>}
          {msg && <div className="p-3 bg-green-50 text-green-600 rounded-lg text-sm mb-4 border border-green-100">{msg}</div>}

          <form onSubmit={handleRegister} className="space-y-4">
            <input
              className="w-full p-4 bg-white/80 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-sm"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />

            <input
              type="email"
              className="w-full p-4 bg-white/80 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-sm"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              type="password"
              className="w-full p-4 bg-white/80 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-sm"
              placeholder="Password (min 6 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-transform transform active:scale-95 ${loading ? "bg-emerald-400 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
                }`}
            >
              {loading ? "Creating..." : "Sign Up"}
            </button>
          </form>

          <p onClick={() => navigate("/login")} className="text-center text-stone-600 mt-6 cursor-pointer hover:text-stone-900 transition-colors">
            Already have an account? <span className="font-bold underline">Login</span>
          </p>
        </div>
      </div>
    </div>
  );
}
