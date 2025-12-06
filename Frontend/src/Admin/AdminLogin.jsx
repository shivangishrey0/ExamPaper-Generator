import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const handleAdminLogin = () => {
    const adminUser = "admin";
    const adminPass = "admin123";

    if (username === adminUser && password === adminPass) {
      navigate("/admin/dashboard");
    } else {
      setMsg("Incorrect admin credentials");
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100">
      <div className="bg-white p-8 w-96 shadow-lg rounded-xl">
        <h2 className="text-2xl font-bold mb-6 text-center">Admin Login</h2>

        {msg && <p className="text-red-600 text-center mb-3">{msg}</p>}

        <input
          className="w-full p-3 border mb-4 rounded-lg"
          placeholder="Admin Username"
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          className="w-full p-3 border mb-4 rounded-lg"
          placeholder="Admin Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleAdminLogin}
          className="w-full bg-blue-600 text-white py-3 rounded-lg"
        >
          Login
        </button>
      </div>
    </div>
  );
}
