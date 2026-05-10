import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Components/AuthContext";

// Grade helper
const getGrade = (percentage) => {
  if (percentage >= 90) return { label: "A+", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
  if (percentage >= 80) return { label: "A",  color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
  if (percentage >= 70) return { label: "B",  color: "text-blue-700 bg-blue-50 border-blue-200" };
  if (percentage >= 60) return { label: "C",  color: "text-amber-700 bg-amber-50 border-amber-200" };
  if (percentage >= 40) return { label: "D",  color: "text-orange-700 bg-orange-50 border-orange-200" };
  return { label: "F", color: "text-red-700 bg-red-50 border-red-200" };
};

export default function UserDashboard() {
  const navigate = useNavigate();
  const { auth, clearSession } = useAuth(); // FIXED: use context not localStorage
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resultExam, setResultExam] = useState(null); // for result modal

  // FIXED: use auth.token from context
  const authHeaders = () => ({ Authorization: `Bearer ${auth.token}` });

  useEffect(() => {
    fetch(`/api/student/exams`, { headers: authHeaders() })
      .then((res) => { if (!res.ok) throw new Error("Failed"); return res.json(); })
      .then((data) => { setExams(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleLogout = () => { clearSession(); navigate("/login"); };

  const availableExams = exams.filter(e => e.status === "not_attempted" || !e.status);
  const pastExams = exams.filter(e => e.status === "submitted" || e.status === "graded");

  const getMaxScore = (questions = []) =>
    questions.reduce((t, q) => {
      if (q.questionType === "short") return t + 2;
      if (q.questionType === "long") return t + 5;
      return t + 1;
    }, 0);

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col font-sans text-stone-800">

      {/* Navbar */}
      <nav className="bg-stone-900 text-amber-50 px-8 py-4 shadow-lg flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-100 rounded text-stone-900 flex items-center justify-center font-bold font-serif italic text-lg">S</div>
          <div>
            <h1 className="text-xl font-bold font-serif italic tracking-wide">Student Portal</h1>
            <p className="text-stone-400 text-xs">Welcome, {auth.name || "Student"}</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="bg-red-500/10 border border-red-500/30 text-red-200 px-5 py-2 rounded-lg hover:bg-red-500 hover:text-white transition-all font-bold text-sm uppercase tracking-wider">
          Logout
        </button>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 md:p-12 space-y-16">

        {loading && (
          <div className="text-center py-32 animate-pulse">
            <p className="text-stone-400 font-bold text-xl uppercase tracking-widest">Loading Dashboard...</p>
          </div>
        )}

        {/* AVAILABLE EXAMS */}
        {!loading && (
          <div>
            <div className="flex items-center justify-between mb-8 border-b border-stone-200 pb-4">
              <div>
                <h2 className="text-3xl font-bold text-stone-900 font-serif italic mb-1">Available Exams</h2>
                <p className="text-stone-500 text-sm">Exams ready for you to take.</p>
              </div>
              <span className="bg-stone-200 text-stone-700 px-3 py-1 rounded-full font-bold text-sm">
                {availableExams.length} Pending
              </span>
            </div>

            {availableExams.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl shadow-sm border-2 border-dashed border-stone-200 text-center">
                <div className="text-4xl mb-4">🎉</div>
                <h3 className="text-xl font-bold text-stone-800 mb-2">All Caught Up!</h3>
                <p className="text-stone-500">No pending exams at the moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {availableExams.map((exam) => (
                  <div key={exam._id}
                    className="bg-white rounded-3xl shadow-xl shadow-stone-100 border border-white hover:border-amber-200 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col group p-6">
                    <div className="flex-1 mb-6">
                      <div className="flex justify-between items-start mb-4">
                        <span className="bg-amber-50 text-amber-800 border border-amber-100 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                          {exam.subject}
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold text-stone-900 mb-3 font-serif italic group-hover:text-amber-800 transition-colors line-clamp-2">
                        {exam.title}
                      </h3>
                      <div className="flex items-center gap-4 text-stone-500 text-sm font-medium">
                        <span>📄 {exam.questions?.length || 0} Questions</span>
                        <span>⏱️ {exam.duration ? `${exam.duration} Min` : "Untimed"}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/user/exam/${exam._id}`)}
                      className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold hover:bg-amber-600 transition-all flex justify-center items-center gap-2 shadow-lg">
                      Start Assessment →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* HISTORY & RESULTS */}
        {!loading && (
          <div>
            <div className="flex items-center justify-between mb-8 border-b border-stone-200 pb-4">
              <div>
                <h2 className="text-3xl font-bold text-stone-900 font-serif italic mb-1">History & Results</h2>
                <p className="text-stone-500 text-sm">Review your past performance.</p>
              </div>
              <span className="bg-stone-200 text-stone-700 px-3 py-1 rounded-full font-bold text-sm">
                {pastExams.length} Completed
              </span>
            </div>

            {pastExams.length === 0 ? (
              <div className="text-center py-12 text-stone-400 italic">No exam history yet.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {pastExams.map((exam) => {
                  const isGraded = exam.status === "graded";
                  const maxScore = getMaxScore(exam.questions);
                  const percentage = isGraded ? Math.round((exam.score / maxScore) * 100) : 0;
                  const grade = isGraded ? getGrade(percentage) : null;

                  return (
                    <div key={exam._id}
                      className="bg-white rounded-3xl shadow-md border border-stone-100 overflow-hidden hover:shadow-xl transition-all duration-300">
                      <div className={`h-1.5 w-full ${isGraded ? "bg-emerald-500" : "bg-amber-400"}`} />
                      <div className="p-8">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-xl font-bold text-stone-800 font-serif italic">{exam.title}</h3>
                          {isGraded ? (
                            <span className={`text-xs px-2 py-1 rounded font-bold uppercase border ${grade.color}`}>
                              {grade.label}
                            </span>
                          ) : (
                            <span className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded font-bold uppercase border border-amber-100">
                              Pending
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-stone-500 mb-6 font-medium uppercase tracking-wide">{exam.subject}</p>

                        {isGraded ? (
                          <div className="space-y-4">
                            <div className="bg-emerald-50/50 rounded-2xl p-6 border border-emerald-100 flex flex-col items-center">
                              <span className="text-stone-400 text-[10px] font-bold uppercase tracking-widest mb-1">Score</span>
                              <div className="flex items-baseline gap-2 mb-3">
                                <span className="text-5xl font-black text-emerald-800 font-serif italic">{exam.score}</span>
                                <span className="text-emerald-400 font-bold text-xl">/ {maxScore}</span>
                              </div>
                              <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden mb-1">
                                <div className="bg-emerald-500 h-2 rounded-full transition-all duration-1000"
                                  style={{ width: `${Math.min(percentage, 100)}%` }} />
                              </div>
                              <span className="text-xs text-stone-400">{percentage}% — {grade.label}</span>
                            </div>
                            {/* FIXED: View Full Report now opens modal */}
                            <button
                              onClick={() => setResultExam(exam)}
                              className="w-full py-3 border border-emerald-200 text-emerald-700 font-bold rounded-xl hover:bg-emerald-50 transition-colors text-sm uppercase tracking-wide">
                              View Full Report
                            </button>
                          </div>
                        ) : (
                          <div className="bg-amber-50/50 rounded-2xl p-8 border border-amber-100 text-center">
                            <div className="text-4xl mb-3 animate-pulse">⏳</div>
                            <h4 className="font-bold text-amber-900 font-serif italic text-lg">In Review</h4>
                            <p className="text-xs text-amber-700/80 mt-2 font-medium leading-relaxed">
                              Your submission is being evaluated by the teacher.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* RESULT MODAL */}
      {resultExam && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setResultExam(null)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}>

            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center rounded-t-3xl z-10">
              <div>
                <h2 className="text-2xl font-bold text-stone-900 font-serif italic">{resultExam.title}</h2>
                <p className="text-stone-500 text-sm">{resultExam.subject} — Full Report</p>
              </div>
              <button onClick={() => setResultExam(null)}
                className="w-10 h-10 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 font-bold">
                ✕
              </button>
            </div>

            {/* Score Summary */}
            <div className="p-6 border-b bg-emerald-50">
              {(() => {
                const maxScore = getMaxScore(resultExam.questions);
                const pct = Math.round((resultExam.score / maxScore) * 100);
                const g = getGrade(pct);
                return (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-stone-500 text-sm">Total Score</p>
                      <p className="text-4xl font-black text-emerald-800 font-serif italic">
                        {resultExam.score} <span className="text-xl text-emerald-400">/ {maxScore}</span>
                      </p>
                      <p className="text-stone-500 text-sm mt-1">{pct}% correct</p>
                    </div>
                    <span className={`text-4xl font-black px-6 py-3 rounded-2xl border-2 ${g.color}`}>
                      {g.label}
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* Question Breakdown */}
            <div className="p-6 space-y-4">
              <h3 className="font-bold text-stone-700 uppercase text-xs tracking-widest mb-4">Question Breakdown</h3>
              {resultExam.questions?.map((q, idx) => {
                const studentAns = resultExam.answers?.[q._id];
                const isCorrect = q.questionType === "mcq"
                  ? String(studentAns || "").trim().toLowerCase() === String(q.correctAnswer || "").trim().toLowerCase()
                  : null; // subjective — can't auto-check

                return (
                  <div key={q._id}
                    className={`p-4 rounded-2xl border-2 ${
                      q.questionType === "mcq"
                        ? isCorrect ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"
                        : "border-stone-200 bg-stone-50"
                    }`}>
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-bold text-stone-800 text-sm">Q{idx + 1}. {q.questionText}</p>
                      <span className={`text-xs px-2 py-0.5 rounded font-bold ml-2 flex-shrink-0 ${
                        q.questionType === "mcq"
                          ? isCorrect ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                          : "bg-stone-200 text-stone-600"
                      }`}>
                        {q.questionType === "mcq" ? (isCorrect ? "✓ Correct" : "✗ Wrong") : "Subjective"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs mt-3">
                      <div className="bg-white rounded-lg p-2 border">
                        <p className="text-stone-400 uppercase font-bold mb-1">Your answer</p>
                        <p className={`font-medium ${
                          q.questionType === "mcq"
                            ? isCorrect ? "text-emerald-700" : "text-red-600"
                            : "text-stone-700"
                        }`}>
                          {studentAns || "Not answered"}
                        </p>
                      </div>
                      {q.questionType === "mcq" && (
                        <div className="bg-white rounded-lg p-2 border">
                          <p className="text-stone-400 uppercase font-bold mb-1">Correct answer</p>
                          <p className="font-medium text-emerald-700">{q.correctAnswer}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-6 border-t">
              <button onClick={() => setResultExam(null)}
                className="w-full py-3 bg-stone-900 text-white rounded-xl font-bold hover:bg-stone-800">
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}