import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Webcam from "react-webcam";

export default function TakeExam() {
  const { id } = useParams();
  const navigate = useNavigate();
  const webcamRef = useRef(null);

  // States
  const [exam, setExam] = useState(null);
  const [step, setStep] = useState("instructions"); // 'instructions', 'test', 'submitted'
  const [answers, setAnswers] = useState({});
  const [cameraAllowed, setCameraAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const studentId = localStorage.getItem("userId"); // Defined here for usage in render

  // --- NEW: SEQUENTIAL NAVIGATION STATE ---
  const [currentQIndex, setCurrentQIndex] = useState(0);
  // ---------------------------------------

  // --- TIMER STATE ---
  const [timeLeft, setTimeLeft] = useState(null); // in seconds
  // ------------------

  // Fetch Exam Data
  useEffect(() => {
    fetch(`/api/user/exam/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Exam not found");
        return res.json();
      })
      .then((data) => {
        setExam(data);
        // Set initial time (convert minutes to seconds)
        if (data.duration && data.duration > 0) {
          setTimeLeft(data.duration * 60);
        }
        setLoading(false);
      })
      .catch((err) => {
        alert("Failed to load exam. Check backend connection.");
        navigate("/user/dashboard");
      });
  }, [id, navigate]);

  // --- TIMER LOGIC ---
  useEffect(() => {
    if (step === "test" && timeLeft !== null) {
      if (timeLeft <= 0) {
        alert("⏳ Time is up! Submitting your exam automatically.");
        handleSubmit(true); // Force submit
        return;
      }

      const timerId = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);

      return () => clearInterval(timerId);
    }
  }, [step, timeLeft]);

  // Format Time Helper
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  // -------------------

  const handleStartExam = () => {
    if (!cameraAllowed) return alert("You must allow camera access to start!");
    setStep("test");
  };

  const handleNextQuestion = () => {
    if (currentQIndex < exam.questions.length - 1) {
      setCurrentQIndex(currentQIndex + 1);
    }
  };

  const hasAnsweredCurrent = () => {
    if (!exam) return false;
    const currentQId = exam.questions[currentQIndex]._id;
    const currentAns = answers[currentQId];
    return currentAns && currentAns.trim().length > 0;
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (!autoSubmit && !window.confirm("Are you sure you want to submit?")) return;

    const studentId = localStorage.getItem("userId");
    if (!studentId) {
      alert("User ID missing. Please Logout and Login again.");
      return;
    }

    try {
      const res = await fetch("/api/user/submit-exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId: id,
          answers,
          studentId: studentId
        }),
      });

      if (res.ok) {
        setStep("submitted");
      } else {
        const errorData = await res.json();
        alert("Submission failed: " + errorData.message);
      }
    } catch (error) {
      alert("Network error. Could not submit.");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-blue-900 font-bold">Loading Exam...</div>;

  // --- VIEW 1: INSTRUCTIONS & WEBCAM CHECK ---
  if (step === "instructions") {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-2xl max-w-2xl w-full">
          <h1 className="text-3xl font-bold text-blue-900 mb-4">Exam Instructions</h1>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 text-sm text-yellow-700">
            <p className="font-bold">⚠️ IMPORTANT RULES:</p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              {exam.duration > 0 && <li><strong>Time Limit:</strong> {exam.duration} Minutes.</li>}
              <li>Your camera will be ON during the entire exam.</li>
              <li>Ensure you are in a well-lit room.</li>
              <li>Once you click Submit, you cannot go back.</li>
            </ul>
          </div>

          {/* Webcam Preview Area */}
          <div className="mb-6 flex flex-col items-center justify-center bg-black rounded-lg overflow-hidden h-64 w-full relative">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="absolute inset-0 w-full h-full object-cover"
              onUserMedia={() => setCameraAllowed(true)}
            />
            {!cameraAllowed && <p className="text-white z-10 font-bold">Waiting for camera permission...</p>}
          </div>

          <button
            onClick={handleStartExam}
            disabled={!cameraAllowed}
            className={`w-full py-4 rounded-lg font-bold text-lg transition ${cameraAllowed
              ? "bg-green-600 text-white hover:bg-green-700 shadow-lg"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
          >
            {cameraAllowed ? "I Agree & Start Exam" : "Allow Camera to Enable Button"}
          </button>

          <button onClick={() => navigate("/user/dashboard")} className="mt-4 w-full text-gray-500 text-sm hover:underline">
            Cancel and Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // --- VIEW 2: THE EXAM INTERFACE (SEQUENTIAL) ---
  if (step === "test") {
    const q = exam.questions[currentQIndex]; // Get CURRENT question only
    const isLastQuestion = currentQIndex === exam.questions.length - 1;
    const canProceed = hasAnsweredCurrent();

    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col md:flex-row relative font-sans">

        {/* --- FLOATING TIMER --- */}
        {timeLeft !== null && (
          <div className={`fixed top-4 right-4 z-[60] px-4 py-2 rounded-lg font-mono text-xl font-bold shadow-xl border-2 ${timeLeft < 60 ? 'bg-red-600 text-white border-red-800 animate-pulse' : 'bg-white text-stone-900 border-stone-900'}`}>
            ⏳ {formatTime(timeLeft)}
          </div>
        )}
        {/* ---------------------- */}

        {/* Main Content: Single Question */}
        <div className="flex-1 p-8 md:p-16 flex flex-col h-screen overflow-hidden">

          {/* Header */}
          <div className="flex justify-between items-center mb-8 border-b border-stone-200 pb-4">
            <div>
              <h2 className="text-3xl font-bold text-stone-900 font-serif italic mb-1">{exam.title}</h2>
              <p className="text-stone-500 text-sm font-medium uppercase tracking-wider">{exam.subject}</p>
            </div>
            <div className="bg-stone-900 text-amber-50 px-4 py-1.5 rounded-full text-sm font-bold shadow-lg shadow-stone-900/10">
              Question {currentQIndex + 1} of {exam.questions.length}
            </div>
          </div>

          {/* Question Card */}
          <div className="flex-1 overflow-y-auto">
            <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl shadow-stone-200/50 border border-white animate-fade-in relative">

              {/* Decoration */}
              <div className="absolute top-0 right-0 p-6 opacity-5">
                <span className="text-9xl font-serif italic font-black text-stone-900">?</span>
              </div>

              <div className="flex justify-between items-start mb-8 relative z-10">
                <p className="font-bold text-2xl text-stone-800 leading-relaxed font-serif">
                  {q.questionText}
                </p>
              </div>

              <div className="relative z-10">
                {/* MCQ Options */}
                {q.questionType === 'mcq' && q.options && q.options.length > 0 && (
                  <div className="space-y-4 max-w-3xl">
                    {q.options.map((opt, i) => {
                      const optionLabel = String.fromCharCode(65 + i);
                      const optionKey = `Option${optionLabel}`;
                      const isSelected = answers[q._id] === optionKey;

                      return (
                        <label key={i} className={`flex items-center p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 group ${isSelected ? "bg-stone-900 border-stone-900 text-white shadow-lg transform scale-[1.01]" : "bg-white border-stone-200 hover:border-amber-400 hover:bg-stone-50"}`}>
                          <input
                            type="radio"
                            name={q._id}
                            value={optionKey}
                            checked={isSelected}
                            onChange={() => setAnswers({ ...answers, [q._id]: optionKey })}
                            className="hidden"
                          />
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-5 font-bold text-lg transition-colors ${isSelected ? 'bg-white text-stone-900' : 'bg-stone-100 text-stone-500 group-hover:bg-amber-100 group-hover:text-amber-700'}`}>
                            {optionLabel}
                          </div>
                          <span className={`text-lg font-medium ${isSelected ? 'text-white' : 'text-stone-700'}`}>{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* Short Answer Input */}
                {q.questionType === 'short' && (
                  <div className="max-w-3xl">
                    <textarea
                      placeholder="Type your precise answer here..."
                      className="w-full p-6 text-lg border-2 border-stone-200 rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none resize-none transition-all shadow-inner bg-stone-50 focus:bg-white"
                      rows="4"
                      value={answers[q._id] || ''}
                      onChange={(e) => setAnswers({ ...answers, [q._id]: e.target.value })}
                    />
                  </div>
                )}

                {/* Long Answer Input */}
                {q.questionType === 'long' && (
                  <div className="max-w-3xl">
                    <textarea
                      placeholder="Write your detailed explanation here..."
                      className="w-full p-6 text-lg border-2 border-stone-200 rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none resize-y transition-all shadow-inner bg-stone-50 focus:bg-white min-h-[300px]"
                      rows="12"
                      value={answers[q._id] || ''}
                      onChange={(e) => setAnswers({ ...answers, [q._id]: e.target.value })}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="mt-8 flex justify-end items-center gap-4">
            {/* Next / Submit Button */}
            {!isLastQuestion ? (
              <button
                onClick={handleNextQuestion}
                disabled={!canProceed}
                className={`px-10 py-4 rounded-xl font-bold text-lg transition-all flex items-center gap-2 ${canProceed
                  ? 'bg-stone-900 text-white hover:bg-emerald-600 shadow-xl shadow-stone-900/20 active:scale-[0.98]'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  }`}
              >
                Next Question <span>→</span>
              </button>
            ) : (
              <button
                onClick={() => handleSubmit(false)}
                disabled={!canProceed}
                className={`px-10 py-4 rounded-xl font-bold text-lg transition-all flex items-center gap-2 ${canProceed
                  ? 'bg-green-600 text-white hover:bg-green-700 shadow-xl shadow-green-600/30 animate-pulse'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  }`}
              >
                ✅ Finish & Submit
              </button>
            )}
          </div>
        </div>

        {/* Sidebar: Webcam Proctoring */}
        <div className="w-full md:w-80 bg-stone-900 p-6 flex flex-col items-center md:h-screen sticky top-0 z-50 border-l border-stone-800 shadow-2xl">
          <div className="w-full aspect-video bg-stone-800 rounded-xl overflow-hidden border-2 border-red-500/50 relative mb-6 shadow-lg group">
            <Webcam audio={false} ref={webcamRef} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
            <div className="absolute top-3 right-3 w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
            <div className="absolute bottom-2 left-3 text-red-100 text-[10px] font-bold bg-red-900/80 px-2 py-0.5 rounded tracking-widest backdrop-blur-sm">REC ●</div>
          </div>

          <div className="text-center mb-8">
            <p className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-1">Proctoring Active</p>
            <p className="text-stone-600 text-[10px]">Session ID: {studentId?.substring(0, 8)}...</p>
          </div>

          <div className="w-full">
            <p className="text-stone-500 text-xs font-bold uppercase tracking-widest mb-4">Progress Tracker</p>
            <div className="grid grid-cols-5 gap-3">
              {exam.questions.map((q, i) => {
                // Logic for coloring the grid
                let statusColor = "bg-stone-800 text-stone-600 border-none"; // Future
                if (i === currentQIndex) statusColor = "bg-amber-500 text-white border-2 border-amber-300 shadow-lg shadow-amber-500/40 scale-110 z-10"; // Current
                else if (i < currentQIndex) statusColor = "bg-green-600 text-green-100"; // Completed (Assumed since we enforce linear)

                return (
                  <div key={i} className={`h-10 w-10 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${statusColor}`}>
                    {i + 1}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    );
  }

  // --- VIEW 3: SUCCESS SCREEN ---
  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
      <div className="bg-white p-12 rounded-3xl shadow-2xl text-center max-w-lg w-full border border-stone-100 animate-slide-up">
        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-inner">
          ✅
        </div>
        <h1 className="text-4xl font-bold text-stone-900 mb-4 font-serif italic">Exam Submitted!</h1>
        <p className="text-stone-500 mb-10 text-lg leading-relaxed">
          Your answers have been securely synced. <br />
          You may now close this window or return to the dashboard.
        </p>
        <button onClick={() => navigate("/user/dashboard")} className="w-full bg-stone-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-stone-800 transition shadow-lg shadow-stone-900/20">
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}
const studentId = localStorage.getItem("userId"); // Used in render, defined outside component scope in original, checking placement.
// Wait, studentId is used inside the component render for the sidebar.
// I should define it inside the component or make sure it's available.
// In my rewrite above, `const studentId` is in `handleSubmit` but referenced in the sidebar under `VIEW 2`.
// I will ensure `const studentId = localStorage.getItem("userId");` is inside the component body or the specific view.