import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function VerifyOTP() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;

  const [otp, setOtp] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setMsg("");

    if (!email) {
      setError("Email not found. Please register again.");
      return;
    }
    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });

    const data = await res.json();

    if (res.ok) {
        setMsg(data.message || "Email verified successfully!");
        setTimeout(() => {
      navigate("/login");
        }, 1500);
      } else {
        setError(data.message || "Verification failed");
      }
    } catch (err) {
      console.error("Verify Error:", err);
      setError("Network error. Please check if the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100">
      <div className="bg-white p-8 w-96 shadow-lg rounded-xl">

        <h2 className="text-2xl font-bold mb-6 text-center">Verify Email</h2>

        {error && <p className="text-center text-red-600 mb-2">{error}</p>}
        {msg && <p className="text-center text-green-600 mb-2">{msg}</p>}

        {email && <p className="text-center text-gray-600 text-sm mb-4">OTP sent to: {email}</p>}

        <form onSubmit={handleVerify}>
        <input
          className="w-full p-3 border mb-4 rounded-lg"
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            maxLength={6}
            required
        />

        <button
            type="submit"
            disabled={loading || !email}
            className={`w-full text-white py-3 rounded-lg ${
              loading || !email ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Verifying..." : "Verify"}
        </button>
        </form>
      </div>
    </div>
  );
}
