import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const handleRegister = async () => {
    const res = await fetch("/api/auth/register-start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await res.json();
    setMsg(data.message);

    if (res.ok) {
      navigate("/verify-otp", { state: { email } });
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100">
      <div className="bg-white p-8 w-96 shadow-lg rounded-xl">

        <h2 className="text-2xl font-bold mb-6 text-center">User Register</h2>

        {msg && <p className="text-center text-blue-600">{msg}</p>}

        <input
          className="w-full p-3 border mb-4 rounded-lg"
          placeholder="Username"
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="email"
          className="w-full p-3 border mb-4 rounded-lg"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="w-full p-3 border mb-4 rounded-lg"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleRegister}
          className="w-full bg-green-600 text-white py-3 rounded-lg"
        >
          Register
        </button>

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
