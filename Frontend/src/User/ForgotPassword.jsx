import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authUrl } from "../api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  const handleForgot = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setMsg("Email is required");
      return;
    }

    try {
      const res = await fetch(authUrl("/forgot-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      const data = await res.json();
      setMsg(data.message);

      if (res.ok) {
        navigate("/reset-password", { state: { email: normalizedEmail } });
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      setMsg("Network error. Please try again.");
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
          className="w-full bg-blue-600 text-white py-3 rounded-lg"
        >
          Send OTP
        </button>

      </div>
    </div>
  );
}
