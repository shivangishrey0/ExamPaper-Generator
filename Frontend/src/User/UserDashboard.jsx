import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function UserDashboard() {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    
    // Safety check for ID
    const url = userId 
        ? `/api/user/exams?studentId=${userId}` 
        : `/api/user/exams`;

    fetch(url)
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
    localStorage.clear();
    navigate("/login"); 
  };

  // --- SEPARATE THE LISTS ---
  const availableExams = exams.filter(e => e.status === 'not_attempted' || !e.status);
  const pastExams = exams.filter(e => e.status === 'submitted' || e.status === 'graded');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <nav className="bg-blue-900 text-white p-4 shadow-lg flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
           <h1 className="text-xl font-bold tracking-wide">Student Portal</h1>
        </div>
        <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 px-5 py-2 rounded-lg font-semibold shadow-md transition">
          Logout
        </button>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full p-8 space-y-12">
        
        {loading && <div className="text-center py-20 text-blue-900 font-bold text-xl">Loading Dashboard...</div>}

        {/* --- SECTION 1: AVAILABLE EXAMS --- */}
        {!loading && (
            <div>
                <h2 className="text-3xl font-bold text-blue-900 mb-6 flex items-center gap-2">
                    📝 Available Exams <span className="text-sm font-normal text-gray-500 bg-gray-200 px-2 py-1 rounded-full">{availableExams.length}</span>
                </h2>
                
                {availableExams.length === 0 ? (
                    <div className="bg-white p-8 rounded-xl shadow border border-dashed border-gray-300 text-center text-gray-500">
                        You have no pending exams. Good job!
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {availableExams.map((exam) => (
                        <div key={exam._id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition duration-300 border-t-8 border-blue-600 flex flex-col">
                        <div className="p-6 flex-1">
                            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded uppercase mb-3 inline-block">
                                {exam.subject}
                            </span>
                            <h3 className="text-2xl font-bold text-gray-800 mb-2">{exam.title}</h3>
                            <div className="flex items-center gap-4 text-gray-500 text-sm mt-4">
                                <span>📄 {exam.questions.length} Questions</span>
                                <span>⏱️ Untimed</span>
                            </div>
                        </div>
                        <div className="bg-gray-50 p-4 border-t">
                            <button 
                                onClick={() => navigate(`/user/exam/${exam._id}`)}
                                className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition flex justify-center items-center gap-2 shadow-sm"
                            >
                                📸 Start Exam
                            </button>
                        </div>
                        </div>
                    ))}
                    </div>
                )}
            </div>
        )}

        {/* --- SECTION 2: EXAM RESULTS & HISTORY --- */}
        {!loading && (
            <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2 border-t pt-8">
                    📊 Exam Results <span className="text-sm font-normal text-gray-500 bg-gray-200 px-2 py-1 rounded-full">{pastExams.length}</span>
                </h2>

                {pastExams.length === 0 ? (
                    <p className="text-gray-500">No history available yet.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pastExams.map((exam) => (
                            <div key={exam._id} className={`bg-white rounded-xl shadow-md border overflow-hidden relative ${
                                exam.status === 'graded' ? 'border-green-500' : 'border-yellow-400'
                            }`}>
                                {/* Status Banner */}
                                <div className={`px-4 py-2 text-white font-bold text-sm text-center tracking-wide uppercase ${
                                    exam.status === 'graded' ? 'bg-green-600' : 'bg-yellow-500'
                                }`}>
                                    {exam.status === 'graded' ? 'Report Card' : 'Pending Check'}
                                </div>

                                <div className="p-6">
                                    <h3 className="text-xl font-bold text-gray-800 mb-1">{exam.title}</h3>
                                    <p className="text-sm text-gray-500 mb-6 font-medium">{exam.subject}</p>
                                    
                                    {/* SCORE DISPLAY */}
                                    {exam.status === 'graded' ? (
                                        <div className="bg-green-50 rounded-lg p-4 border border-green-100 flex flex-col items-center justify-center">
                                            <span className="text-gray-500 text-xs font-bold uppercase mb-1">Total Score</span>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-4xl font-black text-green-700">{exam.score}</span>
                                                <span className="text-gray-400 font-bold text-lg">/ {exam.questions.length}</span>
                                            </div>
                                            <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-300">
                                                <div 
                                                    className="bg-green-600 h-2.5 rounded-full" 
                                                    style={{ width: `${(exam.score / exam.questions.length) * 100}%` }}
                                                ></div>
                                            </div>
                                            <p className="text-xs text-green-800 mt-2 font-semibold">
                                                {((exam.score / exam.questions.length) * 100).toFixed(0)}% Percentage
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-100 text-center">
                                            <div className="text-3xl mb-2">⏳</div>
                                            <h4 className="font-bold text-yellow-800">Waiting for Results</h4>
                                            <p className="text-xs text-yellow-700 mt-1">Admin is currently checking your paper.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

      </main>
    </div>
  );
}