import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function SetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  // If no token in URL, show error immediately
  useEffect(() => {
    if (!token) setError("Invalid invite link. Please ask your admin to resend.");
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/set-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setDone(true);
      } else {
        setError(data.message || "Something went wrong.");
      }
    } catch {
      setError("Cannot reach the server. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  // Success screen
  if (done) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
            <i className="ti ti-circle-check text-emerald-600" style={{ fontSize: 32 }} aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-stone-900 mb-2">You're all set!</h1>
          <p className="text-stone-500 mb-6">Your password has been saved. You can now log in to your account.</p>
          <button
            onClick={() => navigate("/login-options")}
            className="w-full py-3 bg-stone-900 text-white rounded-xl font-semibold hover:bg-stone-800"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-stone-900 rounded-2xl mb-4">
            <i className="ti ti-lock text-white" style={{ fontSize: 22 }} aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-stone-900">Set your password</h1>
          <p className="text-stone-500 mt-1 text-sm">
            Choose a password to activate your Exam Portal account.
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
            <i className="ti ti-alert-circle mt-0.5 flex-shrink-0" style={{ fontSize: 16 }} aria-hidden="true" />
            {error}
          </div>
        )}

        {/* Form — only show if token exists */}
        {token && (
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-stone-400/40 focus:border-stone-400 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <i className={`ti ${showPassword ? "ti-eye-off" : "ti-eye"}`} style={{ fontSize: 17 }} aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-1.5">
                Confirm Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat your password"
                required
                className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-stone-400/40 focus:border-stone-400"
              />
            </div>

            {/* Password strength hint */}
            {password.length > 0 && (
              <div className="flex gap-1">
                {[1, 2, 3].map((level) => (
                  <div
                    key={level}
                    className={`h-1 flex-1 rounded-full transition-all ${
                      password.length >= level * 4
                        ? level === 1 ? "bg-red-400" : level === 2 ? "bg-amber-400" : "bg-emerald-500"
                        : "bg-stone-200"
                    }`}
                  />
                ))}
                <span className="text-xs text-stone-400 ml-1">
                  {password.length < 4 ? "Weak" : password.length < 8 ? "Fair" : "Strong"}
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 rounded-xl text-white font-semibold text-sm mt-2 transition-all ${
                loading ? "bg-stone-400 cursor-not-allowed" : "bg-stone-900 hover:bg-stone-800"
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <i className="ti ti-loader-2 animate-spin" style={{ fontSize: 16 }} aria-hidden="true" />
                  Activating account...
                </span>
              ) : (
                "Activate Account"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}