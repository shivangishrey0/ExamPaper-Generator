import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function UserDashboard() {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch exams from the backend
  useEffect(() => {
    fetch("/api/user/exams")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        setExams(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading exams:", err);
        setLoading(false);
      });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/"); 
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      
      {/* --- NAVBAR --- */}
      <nav className="bg-blue-900 text-white p-4 shadow-lg flex justify-between items-center">
        <div className="flex items-center gap-2">
           <h1 className="text-xl font-bold tracking-wide">Student Portal</h1>
        </div>
        <button 
          onClick={handleLogout} 
          className="bg-red-500 hover:bg-red-600 px-5 py-2 rounded-lg font-semibold transition shadow-md"
        >
          Logout
        </button>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-8">
        
        <div className="mb-8 border-b pb-4">
            <h2 className="text-3xl font-bold text-blue-900">Available Exams</h2>
            <p className="text-gray-600 mt-2">Select an exam below to start your assessment.</p>
        </div>

        {/* Loading State */}
        {loading && (
            <div className="text-center py-20">
                <div className="text-xl font-semibold text-blue-900 animate-pulse">Loading Exams...</div>
            </div>
        )}

        {/* Empty State */}
        {!loading && exams.length === 0 && (
            <div className="text-center py-20 bg-white rounded-xl shadow border border-gray-200">
                <p className="text-gray-500 text-lg">No exams are currently available.</p>
                <p className="text-sm text-gray-400">Please check back later.</p>
            </div>
        )}

        {/* --- EXAM CARDS GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => (
            <div 
              key={exam._id} 
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition duration-300 border-t-8 border-blue-900 flex flex-col"
            >
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-2">
                    <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded uppercase">
                        {exam.subject}
                    </span>
                    <span className="text-gray-400 text-xs">
                        {new Date(exam.createdAt).toLocaleDateString()}
                    </span>
                </div>
                
                <h3 className="text-2xl font-bold text-gray-800 mb-2">{exam.title}</h3>
                
                <div className="flex items-center gap-2 text-gray-600 text-sm mb-4">
                    <span>📝 {exam.questions.length} Questions</span>
                    <span>•</span>
                    <span>⏱️ Untimed</span>
                </div>
              </div>

              {/* FOOTER BUTTON AREA */}
              <div className="bg-gray-50 p-4 border-t border-gray-100">
                <button 
                  onClick={() => navigate(`/user/exam/${exam._id}`)}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow-sm flex justify-center items-center gap-2"
                >
                  📸 Start Exam with Webcam
                </button>
              </div>
            </div>
          ))}
        </div>

      </main>
    </div>
  );
}