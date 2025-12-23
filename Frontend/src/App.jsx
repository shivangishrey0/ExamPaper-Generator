import { BrowserRouter, Routes, Route } from "react-router-dom";

// Admin Pages
import AdminLogin from "./Admin/AdminLogin";
import AdminDashboard from "./Admin/AdminDashboard";
import AdminViewPaper from "./Admin/AdminViewPaper";

// User Pages
import UserDashboard from "./User/UserDashboard.jsx"; // <--- FIXED HERE
import Register from "./User/Register";
import VerifyOTP from "./User/VerifyOTP";
import Login from "./User/Login";
import ForgotPassword from "./User/ForgotPassword";
import ResetPassword from "./User/ResetPassword";
import TakeExam from "./Pages/TakeExam";
import AdminCheckPaper from "./Admin/AdminCheckPaper"; // Import at top

// Inside Routes
// Landing Page
import LandingPage from "./Pages/LandingPage";
import LoginOptions from "./Pages/LoginOptions";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login-options" element={<LoginOptions />} />

        {/* User Routes */}
        <Route path="/user/dashboard" element={<UserDashboard />} />
        <Route path="/user/exam/:id" element={<TakeExam />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/view-exam/:id" element={<AdminViewPaper />} />
        <Route path="/admin/check-paper/:examId" element={<AdminCheckPaper />} />

      </Routes>
    </BrowserRouter>
  );
}