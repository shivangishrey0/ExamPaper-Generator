import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function UserRegister() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [error, setError] = useState("");

  const validateAndRegister = async () => {
    if (!username.trim()) {
      setError("Username is required");
      return;
    }

    if (!email.includes("@")) {
      setError("Enter a valid email");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPass) {
      setError("Passwords do not match");
      return;
    }

    setError("");

    try {
      const res = await fetch("/api/user/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("register error:", res.status, data);
        setError(data.message || `Registration failed (${res.status})`);
        return;
      }

      alert("Registered Successfully! Please login now.");
      navigate("/user-login");
    } catch (err) {
      setError("Network error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">User Registration</h2>

        {error && <p className="text-red-600 mb-3">{error}</p>}

        <input
          type="text"
          placeholder="Username"
          className="w-full p-3 border rounded-lg mb-4"
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 border rounded-lg mb-4"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 border rounded-lg mb-4"
          onChange={(e) => setPassword(e.target.value)}
        />

        <input
          type="password"
          placeholder="Confirm Password"
          className="w-full p-3 border rounded-lg mb-4"
          onChange={(e) => setConfirmPass(e.target.value)}
        />

        <button
          onClick={validateAndRegister}
          className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 mb-3"
        >
          Register
        </button>

        <p
          onClick={() => navigate("/user-login")}
          className="text-blue-600 text-center cursor-pointer"
        >
          Already registered? Login
        </p>
      </div>
    </div>
  );
}
