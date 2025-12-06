import { BrowserRouter, Routes, Route } from "react-router-dom";

// Admin Pages
import AdminLogin from "./admin/AdminLogin";
import AdminDashboard from "./admin/AdminDashboard";

// User Pages
import Register from "./user/Register";
import VerifyOTP from "./user/VerifyOTP";
import Login from "./user/Login";
import ForgotPassword from "./user/ForgotPassword";
import ResetPassword from "./user/ResetPassword";

// Landing Page
import LandingPage from "./Pages/LandingPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<LandingPage />} />

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />

        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

      </Routes>
    </BrowserRouter>
  );
}
