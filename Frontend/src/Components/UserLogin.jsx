import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function UserLogin() {
  const navigate = useNavigate();
  const location = useLocation();

  // If navigated from Reset Password, prefill the email
  const [email, setEmail] = useState(location.state?.email || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    try {
      const res = await fetch("/api/user/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("login error:", res.status, data);
        setError(data.message || `Login failed (${res.status})`);
        return;
      }

      alert("Login Successful!");
      navigate("/user-dashboard");
    } catch (err) {
      setError("Network error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">User Login</h2>

        {error && <p className="text-red-600 mb-3">{error}</p>}

        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 border rounded-lg mb-4"
          onChange={(e) => setEmail(e.target.value)}
          value={email}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 border rounded-lg mb-4"
          onChange={(e) => setPassword(e.target.value)}
          value={password}
        />

        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 mb-3"
        >
          Login
        </button>

        <p
          onClick={() => navigate("/forgot-password")}
          className="text-blue-600 text-center cursor-pointer"
        >
          Forgot Password?
        </p>

        <p
          onClick={() => navigate("/user-register")}
          className="text-green-600 text-center cursor-pointer mt-3"
        >
          Not registered? Register here
        </p>
      </div>
    </div>
  );
}
