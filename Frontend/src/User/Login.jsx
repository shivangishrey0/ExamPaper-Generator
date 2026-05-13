import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../Components/AuthContext";
 
const roleConfig = {
  superadmin: {
    label: "Super Admin",
    icon: "ti-shield-lock",
    iconBg: "bg-purple-600",
    badge: "bg-purple-100 text-purple-800",
    ring: "focus:ring-purple-400/40 focus:border-purple-400",
    btn: "bg-purple-700 hover:bg-purple-800",
  },
  teacher: {
    label: "Teacher",
    icon: "ti-books",
    iconBg: "bg-stone-900",
    badge: "bg-stone-100 text-stone-800",
    ring: "focus:ring-stone-400/40 focus:border-stone-400",
    btn: "bg-stone-900 hover:bg-stone-800",
  },
  student: {
    label: "Student",
    icon: "ti-user-graduate",
    iconBg: "bg-emerald-600",
    badge: "bg-emerald-100 text-emerald-800",
    ring: "focus:ring-emerald-400/40 focus:border-emerald-500",
    btn: "bg-emerald-700 hover:bg-emerald-800",
  },
};
 
export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setSession } = useAuth();
 
  // Read role from ?role=superadmin in URL, default to student
  const roleKey = searchParams.get("role") || "student";
  const config = roleConfig[roleKey] || roleConfig.student;
 
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
 
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError("");
  };
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
 
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
 
      const data = await res.json();
 
      if (res.ok) {
        setSession({
          token: data.token,
          userId: data.userId,
          name: data.name,
          role: data.role,
          permissions: data.permissions || [],
        });
 
        if (data.role === "superadmin") navigate("/superadmin/dashboard");
        else if (data.role === "teacher") navigate("/teacher/dashboard");
        else navigate("/user/dashboard");
      } else {
        setError(data.message || "Login failed. Please check your credentials.");
      }
    } catch {
      setError("Cannot reach the server. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
 
        {/* Back link */}
        <button
          onClick={() => navigate("/login-options")}
          className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800 mb-8 transition-colors"
        >
          <i className="ti ti-arrow-left" style={{ fontSize: 15 }} aria-hidden="true" />
          All portals
        </button>
 
        {/* Role badge header */}
        <div className="flex items-center gap-3 mb-8">
          <div className={`w-12 h-12 rounded-2xl ${config.iconBg} flex items-center justify-center`}>
            <i className={`ti ${config.icon} text-white`} style={{ fontSize: 22 }} aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-stone-900">Sign in</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.badge}`}>
                {config.label}
              </span>
            </div>
            <p className="text-sm text-stone-500">Enter your credentials to continue</p>
          </div>
        </div>
 
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
 
          {/* Error banner */}
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              <i className="ti ti-alert-circle mt-0.5 flex-shrink-0" style={{ fontSize: 16 }} aria-hidden="true" />
              {error}
            </div>
          )}
 
          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-1.5">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
              className={`w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 text-sm outline-none transition-all ${config.ring}`}
            />
          </div>
 
          {/* Password */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-amber-700 hover:text-amber-800 font-semibold"
              >
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className={`w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 text-sm outline-none transition-all pr-11 ${config.ring}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <i
                  className={`ti ${showPassword ? "ti-eye-off" : "ti-eye"}`}
                  style={{ fontSize: 17 }}
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>
 
          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-all mt-2 ${
              loading ? "bg-stone-400 cursor-not-allowed" : config.btn
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <i className="ti ti-loader-2 animate-spin" style={{ fontSize: 16 }} aria-hidden="true" />
                Verifying...
              </span>
            ) : (
              `Sign in as ${config.label}`
            )}
          </button>
        </form>
 
        {/* Register link — only for student/teacher, not superadmin */}
        {roleKey !== "superadmin" && (
          <p className="mt-6 text-center text-sm text-stone-500">
            No account?{" "}
            <Link to="/register" className="text-stone-900 font-semibold hover:underline">
              Register now
            </Link>
          </p>
        )}
 
      </div>
    </div>
  );
}
 