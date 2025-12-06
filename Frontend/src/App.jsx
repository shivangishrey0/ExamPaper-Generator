import { BrowserRouter, Routes, Route } from "react-router-dom";

// Admin Pages
import AdminLogin from "./Admin/AdminLogin";
import AdminDashboard from "./Admin/AdminDashboard";

// User Pages
import Register from "./User/Register";
import VerifyOTP from "./User/VerifyOTP";
import Login from "./User/Login";
import ForgotPassword from "./User/ForgotPassword";
import ResetPassword from "./User/ResetPassword";
import AdminViewPaper from "./Admin/AdminViewPaper";

// Landing Page
import LandingPage from "./Pages/LandingPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<LandingPage />} />

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/view-exam/:id" element={<AdminViewPaper />} />

        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
      </Routes>
    </BrowserRouter>
  );
}
