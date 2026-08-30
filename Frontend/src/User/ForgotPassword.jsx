import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authUrl, apiFetch } from "../api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleForgot = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setMsg("Email is required");
      return;
    }
    if (loading) return;

    setLoading(true);
    setMsg("Sending OTP...");

    try {
      const res = await apiFetch(authUrl("/forgot-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      const data = await res.json();
      setMsg(data.message || (res.ok ? "OTP sent to your email" : "Could not send OTP"));

      if (res.ok) {
        navigate("/reset-password", { state: { email: normalizedEmail } });
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      setMsg("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100">
      <div className="bg-white p-8 w-96 shadow-lg rounded-xl">

        <h2 className="text-2xl font-bold mb-6 text-center">Forgot Password</h2>

        {msg && <p className="text-center text-blue-600">{msg}</p>}

        <input
          type="email"
          placeholder="Enter Registered Email"
          className="w-full p-3 border mb-4 rounded-lg"
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          onClick={handleForgot}
          disabled={loading}
          className={`w-full text-white py-3 rounded-lg ${loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600"}`}
        >
          {loading ? "Sending OTP..." : "Send OTP"}
        </button>

      </div>
    </div>
  );
}
