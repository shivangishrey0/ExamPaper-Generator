import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const handleLogin = async () => {
    const res = await fetch("/api/user/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    setMsg(data.message);

    if (res.ok) {
      localStorage.setItem("token", data.token);
      navigate("/user/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100">
      <div className="bg-white p-8 w-96 shadow-lg rounded-xl">

        <h2 className="text-2xl font-bold mb-6 text-center">User Login</h2>

        {msg && <p className="text-center text-red-600">{msg}</p>}

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
          onClick={handleLogin}
          className="w-full bg-blue-600 text-white py-3 rounded-lg"
        >
          Login
        </button>

        <p
          onClick={() => navigate("/forgot-password")}
          className="text-blue-600 text-center mt-3 cursor-pointer"
        >
          Forgot Password?
        </p>

        <p
          onClick={() => navigate("/register")}
          className="text-green-600 text-center mt-3 cursor-pointer"
        >
          New user? Register
        </p>
      </div>
    </div>
  );
}
