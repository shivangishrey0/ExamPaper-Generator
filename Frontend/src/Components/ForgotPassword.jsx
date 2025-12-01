import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  const verifyEmail = async () => {
    const res = await fetch('/api/user/forgot-password', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    // backend returns { msg: '...' }
    setMsg(data.msg || data.message || '');

    if (res.ok) {
      // navigate to reset page where user can enter OTP + new password
      navigate('/reset-password', { state: { email } });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-96">
        <h2 className="text-xl font-bold mb-6 text-center">Forgot Password</h2>

        {msg && <p className="text-green-600 mb-3">{msg}</p>}

        <input
          type="email"
          placeholder="Enter Registered Email"
          className="w-full p-3 border rounded-lg mb-4"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          onClick={verifyEmail}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
        >
          Verify Email
        </button>
      </div>
    </div>
  );
}
