import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email || "";

  const [newPassword, setNewPassword] = useState("");
  // const [otp, setOtp] = useState("");
  const [msg, setMsg] = useState("");

  const resetPass = async () => {
    if (!email) {
      setMsg("Email not found. Go back to Forgot Password.");
      return;
    }

    // if (!otp) {
    //   setMsg('Please enter the OTP sent to your email');
    //   return;
    // }

    const res = await fetch('/api/user/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email,newPassword }),
    });

    const data = await res.json();
    setMsg(data.msg || data.message || '');

    if (res.ok) {
      // go to user login page and pass email so login form can be pre-filled
      navigate('/user-login', { state: { email } });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-96">
        <h2 className="text-xl font-bold mb-6 text-center">Reset Password</h2>

        {msg && <p className="text-green-600 mb-3">{msg}</p>}

        <input
          type="email"
          value={email}
          disabled
          className="w-full p-3 border rounded-lg mb-4 bg-gray-100"
        />


        <input
          type="password"
          placeholder="New Password"
          className="w-full p-3 border rounded-lg mb-4"
          onChange={(e) => setNewPassword(e.target.value)}
        />

        <button
          onClick={resetPass}
          className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700"
        >
          Reset Password
        </button>
      </div>
    </div>
  );
}
