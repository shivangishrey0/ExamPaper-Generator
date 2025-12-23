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

    const availableExams = exams.filter(e => e.status === 'not_attempted' || !e.status);
    const pastExams = exams.filter(e => e.status === 'submitted' || e.status === 'graded');

    return (
        <div className="min-h-screen bg-[#FDFBF7] flex flex-col font-sans text-stone-800">
            {/* Navbar */}
            <nav className="bg-stone-900 text-amber-50 px-8 py-4 shadow-lg flex justify-between items-center sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-100 rounded text-stone-900 flex items-center justify-center font-bold font-serif italic text-lg">S</div>
                    <h1 className="text-xl font-bold font-serif italic tracking-wide">Student Portal</h1>
                </div>
                <button onClick={handleLogout} className="bg-red-500/10 border border-red-500/30 text-red-200 px-5 py-2 rounded-lg hover:bg-red-500 hover:text-white transition-all font-bold text-sm uppercase tracking-wider">
                    Logout
                </button>
            </nav>

            <main className="flex-1 max-w-7xl mx-auto w-full p-6 md:p-12 space-y-16">

                {loading && (
                    <div className="text-center py-32 animate-pulse">
                        <div className="text-stone-300 text-5xl mb-4">⏳</div>
                        <h2 className="text-stone-400 font-bold text-xl uppercase tracking-widest">Loading Dashboard...</h2>
                    </div>
                )}

                {/* --- SECTION 1: AVAILABLE EXAMS --- */}
                {!loading && (
                    <div className="animate-slide-up">
                        <div className="flex items-center justify-between mb-8 border-b border-stone-200 pb-4">
                            <div>
                                <h2 className="text-3xl font-bold text-stone-900 font-serif italic mb-1">Available Exams</h2>
                                <p className="text-stone-500 text-sm">Exams ready for you to take.</p>
                            </div>
                            <span className="bg-stone-200 text-stone-700 px-3 py-1 rounded-full font-bold text-sm shadow-inner">{availableExams.length} Pending</span>
                        </div>

                        {availableExams.length === 0 ? (
                            <div className="bg-white p-12 rounded-3xl shadow-sm border-2 border-dashed border-stone-200 text-center">
                                <div className="text-4xl mb-4">🎉</div>
                                <h3 className="text-xl font-bold text-stone-800 mb-2">All Caught Up!</h3>
                                <p className="text-stone-500">You have no pending exams at the moment. Great job!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {availableExams.map((exam) => (
                                    <div key={exam._id} className="bg-white rounded-3xl shadow-xl shadow-stone-100 border border-white hover:border-amber-200 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col group p-6">
                                        <div className="flex-1 mb-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <span className="bg-amber-50 text-amber-800 border border-amber-100 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                                    {exam.subject}
                                                </span>
                                                <span className="text-stone-300 group-hover:text-amber-400 transition-colors">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                    </svg>
                                                </span>
                                            </div>
                                            <h3 className="text-2xl font-bold text-stone-900 mb-3 font-serif italic group-hover:text-amber-800 transition-colors line-clamp-2">{exam.title}</h3>
                                            <div className="flex items-center gap-4 text-stone-500 text-sm font-medium">
                                                <span className="flex items-center gap-1">📄 {exam.questions.length} Questions</span>
                                                <span className="flex items-center gap-1">⏱️ {exam.duration ? `${exam.duration} Min` : 'Untimed'}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => navigate(`/user/exam/${exam._id}`)}
                                            className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold hover:bg-amber-600 transition-all flex justify-center items-center gap-2 shadow-lg shadow-stone-900/20 active:scale-[0.98]"
                                        >
                                            Start Assessment <span>→</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* --- SECTION 2: EXAM RESULTS & HISTORY --- */}
                {!loading && (
                    <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
                        <div className="flex items-center justify-between mb-8 border-b border-stone-200 pb-4">
                            <div>
                                <h2 className="text-3xl font-bold text-stone-900 font-serif italic mb-1">History & Results</h2>
                                <p className="text-stone-500 text-sm">Review your past performance.</p>
                            </div>
                            <span className="bg-stone-200 text-stone-700 px-3 py-1 rounded-full font-bold text-sm shadow-inner">{pastExams.length} Completed</span>
                        </div>

                        {pastExams.length === 0 ? (
                            <div className="text-center py-12 text-stone-400 italic">
                                No exam history available yet.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {pastExams.map((exam) => {
                                    const isGraded = exam.status === 'graded';

                                    return (
                                        <div key={exam._id} className="bg-white rounded-3xl shadow-md border border-stone-100 overflow-hidden relative group hover:shadow-xl transition-all duration-300">

                                            {/* Status Strip */}
                                            <div className={`h-1.5 w-full ${isGraded ? 'bg-emerald-500' : 'bg-amber-400'}`}></div>

                                            <div className="p-8">
                                                <div className="flex justify-between items-start mb-4">
                                                    <h3 className="text-xl font-bold text-stone-800 mb-1 font-serif italic">{exam.title}</h3>
                                                    {isGraded ? (
                                                        <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded font-bold uppercase tracking-wide border border-emerald-100">Graded</span>
                                                    ) : (
                                                        <span className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded font-bold uppercase tracking-wide border border-amber-100">Pending</span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-stone-500 mb-6 font-medium uppercase tracking-wide">{exam.subject}</p>

                                                {/* SCORE DISPLAY LOGIC */}
                                                {isGraded ? (() => {
                                                    const maxScore = exam.questions.reduce((total, q) => {
                                                        if (q.questionType === 'short') return total + 2;
                                                        if (q.questionType === 'long') return total + 5;
                                                        return total + 1;
                                                    }, 0);
                                                    const percentage = (exam.score / maxScore) * 100;

                                                    return (
                                                        <div className="space-y-6">
                                                            <div className="bg-emerald-50/50 rounded-2xl p-6 border border-emerald-100 flex flex-col items-center justify-center relative overflow-hidden">
                                                                <div className="absolute -right-6 -top-6 w-20 h-20 bg-emerald-200/20 rounded-full blur-xl"></div>
                                                                <span className="text-stone-400 text-[10px] font-bold uppercase tracking-widest mb-1">Score Achieved</span>
                                                                <div className="flex items-baseline gap-2 mb-3">
                                                                    <span className="text-5xl font-black text-emerald-800 font-serif italic">{exam.score}</span>
                                                                    <span className="text-emerald-400 font-bold text-xl">/ {maxScore}</span>
                                                                </div>
                                                                <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
                                                                    <div className="bg-emerald-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${Math.min(percentage, 100)}%` }}></div>
                                                                </div>
                                                            </div>

                                                            <button
                                                                onClick={() => alert("Detailed report page coming soon!")}
                                                                className="w-full py-3 border border-emerald-200 text-emerald-700 font-bold rounded-xl hover:bg-emerald-50 transition-colors text-sm uppercase tracking-wide"
                                                            >
                                                                View Full Report
                                                            </button>
                                                        </div>
                                                    );
                                                })() : (
                                                    <div className="bg-amber-50/50 rounded-2xl p-8 border border-amber-100 text-center">
                                                        <div className="text-4xl mb-3 animate-pulse">⏳</div>
                                                        <h4 className="font-bold text-amber-900 font-serif italic text-lg">In Review</h4>
                                                        <p className="text-xs text-amber-700/80 mt-2 font-medium leading-relaxed">
                                                            Your submission is currently being evaluated by the administration.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}