import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setMsg("");

    // Validation
    if (!username.trim()) {
      setError("Username is required");
      return;
    }
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/register-start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), email: email.trim(), password }),
    });

    const data = await res.json();

    if (res.ok) {
        setMsg(data.message || "OTP sent successfully");
        setTimeout(() => {
          navigate("/verify-otp", { state: { email: email.trim() } });
        }, 1000);
      } else {
        setError(data.message || "Registration failed");
      }
    } catch (err) {
      console.error("Register Error:", err);
      setError("Network error. Please check if the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100">
      <div className="bg-white p-8 w-96 shadow-lg rounded-xl">

        <h2 className="text-2xl font-bold mb-6 text-center">User Register</h2>

        {error && <p className="text-center text-red-600 mb-2">{error}</p>}
        {msg && <p className="text-center text-green-600 mb-2">{msg}</p>}

        <form onSubmit={handleRegister}>
        <input
          className="w-full p-3 border mb-4 rounded-lg"
          placeholder="Username"
            value={username}
          onChange={(e) => setUsername(e.target.value)}
            required
        />

        <input
          type="email"
          className="w-full p-3 border mb-4 rounded-lg"
          placeholder="Email"
            value={email}
          onChange={(e) => setEmail(e.target.value)}
            required
        />

        <input
          type="password"
          className="w-full p-3 border mb-4 rounded-lg"
            placeholder="Password (min 6 characters)"
            value={password}
          onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
        />

        <button
            type="submit"
            disabled={loading}
            className={`w-full text-white py-3 rounded-lg ${
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {loading ? "Registering..." : "Register"}
        </button>
        </form>

        <p
          onClick={() => navigate("/login")}
          className="text-blue-600 text-center mt-3 cursor-pointer"
        >
          Already have an account? Login
        </p>
      </div>
    </div>
  );
}
