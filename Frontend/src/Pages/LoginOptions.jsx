import React from "react";
import { useNavigate } from "react-router-dom";
 
const portals = [
  {
    role: "superadmin",
    label: "Super Admin",
    description: "Manage teachers, students & platform settings",
    icon: "ti-shield-lock",
    accent: "bg-purple-600",
    border: "border-purple-200 hover:border-purple-400",
    badge: "bg-purple-100 text-purple-800",
  },
  {
    role: "teacher",
    label: "Teacher",
    description: "Create exams, upload questions & grade submissions",
    icon: "ti-books",
    accent: "bg-stone-900",
    border: "border-stone-200 hover:border-stone-400",
    badge: "bg-stone-100 text-stone-800",
  },
  {
    role: "student",
    label: "Student",
    description: "Take published exams and view your results",
    icon: "ti-user-graduate",
    accent: "bg-emerald-600",
    border: "border-emerald-200 hover:border-emerald-400",
    badge: "bg-emerald-100 text-emerald-800",
  },
];
 
export default function LoginOptions() {
  const navigate = useNavigate();
 
  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
 
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-stone-900 rounded-2xl mb-4">
            <i className="ti ti-file-certificate text-white" style={{ fontSize: 26 }} aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-bold text-stone-900 font-serif italic">Exam Portal</h1>
          <p className="text-stone-500 mt-1">Choose your role to continue</p>
        </div>
 
        {/* Role Cards */}
        <div className="space-y-3">
          {portals.map((portal) => (
            <button
              key={portal.role}
              onClick={() => navigate(`/login?role=${portal.role}`)}
              className={`w-full flex items-center gap-4 p-4 bg-white rounded-2xl border-2 transition-all duration-200 shadow-sm hover:shadow-md ${portal.border} group text-left`}
            >
              {/* Icon */}
              <div className={`w-11 h-11 rounded-xl ${portal.accent} flex items-center justify-center flex-shrink-0`}>
                <i className={`ti ${portal.icon} text-white`} style={{ fontSize: 20 }} aria-hidden="true" />
              </div>
 
              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-stone-900">{portal.label}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${portal.badge}`}>
                    {portal.role}
                  </span>
                </div>
                <p className="text-sm text-stone-500 mt-0.5 truncate">{portal.description}</p>
              </div>
 
              {/* Arrow */}
              <i
                className="ti ti-arrow-right text-stone-400 group-hover:text-stone-700 transition-colors flex-shrink-0"
                style={{ fontSize: 18 }}
                aria-hidden="true"
              />
            </button>
          ))}
        </div>
 
        {/* Footer */}
        <div className="mt-8 text-center text-sm text-stone-500">
          Don't have an account?{" "}
          <button
            onClick={() => navigate("/register")}
            className="text-stone-900 font-semibold hover:underline"
          >
            Register
          </button>
        </div>
 
      </div>
    </div>
  );
}