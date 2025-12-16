import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function VerifyOTP() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;

  const [otp, setOtp] = useState("");
  const [msg, setMsg] = useState("");

  const handleVerify = async () => {
    const res = await fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });

    const data = await res.json();
    setMsg(data.message);

    if (res.ok) {
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100">
      <div className="bg-white p-8 w-96 shadow-lg rounded-xl">

        <h2 className="text-2xl font-bold mb-6 text-center">Verify Email</h2>

        {msg && <p className="text-center text-blue-600">{msg}</p>}

        <input
          className="w-full p-3 border mb-4 rounded-lg"
          placeholder="Enter OTP"
          onChange={(e) => setOtp(e.target.value)}
        />

        <button
          onClick={handleVerify}
          className="w-full bg-blue-600 text-white py-3 rounded-lg"
        >
          Verify
        </button>
      </div>
    </div>
  );
}
