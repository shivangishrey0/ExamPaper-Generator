import { BrowserRouter, Routes, Route } from "react-router-dom";

// Teacher/SuperAdmin Pages
import TeacherDashboard from "./Admin/TeacherDashboard";
import AdminViewPaper from "./Admin/AdminViewPaper";
import SuperAdminDashboard from "./Admin/SuperAdminDashboard";
import AdminCheckPaper from "./Admin/AdminCheckPaper";

// User Pages
import UserDashboard from "./User/UserDashboard.jsx";
import Register from "./User/Register";
import VerifyOTP from "./User/VerifyOTP";
import Login from "./User/Login";
import ForgotPassword from "./User/ForgotPassword";
import ResetPassword from "./User/ResetPassword";
import SetPassword from "./User/SetPassword";   // ← NEW

// Pages
import LandingPage from "./Pages/LandingPage";
import LoginOptions from "./Pages/LoginOptions";
import TakeExam from "./Pages/TakeExam";
import RequireAuth from "./Components/RequireAuth";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login-options" element={<LoginOptions />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/set-password" element={<SetPassword />} />  {/* ← NEW */}

        {/* Student Routes */}
        <Route element={<RequireAuth allowedRoles={["student"]} redirectTo="/login" />}>
          <Route path="/user/dashboard" element={<UserDashboard />} />
          <Route path="/user/exam/:id" element={<TakeExam />} />
        </Route>

        {/* Teacher Routes */}
        <Route element={<RequireAuth allowedRoles={["teacher", "superadmin"]} redirectTo="/login" />}>
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          <Route path="/teacher/view-exam/:id" element={<AdminViewPaper />} />
          <Route path="/teacher/check-paper/:examId" element={<AdminCheckPaper />} />
        </Route>

        {/* SuperAdmin Routes */}
        <Route element={<RequireAuth allowedRoles={["superadmin"]} requiredPermissions={["manage_users"]} redirectTo="/login" />}>
          <Route path="/superadmin/dashboard" element={<SuperAdminDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}