import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;

  const [otp, setOtp] = useState("");
  const [newPass, setNewPass] = useState("");
  const [msg, setMsg] = useState("");

  const handleReset = async () => {
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp, newPassword: newPass }),
    });

    const data = await res.json();
    setMsg(data.message);

    if (res.ok) {
      alert("Password reset successful. Please login.");
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100">
      <div className="bg-white p-8 w-96 shadow-lg rounded-xl">

        <h2 className="text-2xl font-bold mb-6 text-center">Reset Password</h2>

        {msg && <p className="text-center text-blue-600">{msg}</p>}

        <input
          placeholder="Enter OTP"
          className="w-full p-3 border mb-4 rounded-lg"
          onChange={(e) => setOtp(e.target.value)}
        />

        <input
          type="password"
          placeholder="New Password"
          className="w-full p-3 border mb-4 rounded-lg"
          onChange={(e) => setNewPass(e.target.value)}
        />

        <button
          onClick={handleReset}
          className="w-full bg-green-600 text-white py-3 rounded-lg"
        >
          Reset Password
        </button>

      </div>
    </div>
  );
}
