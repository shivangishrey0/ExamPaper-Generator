import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import { useAuth } from "../Components/AuthContext";

const AUTOSAVE_KEY = (examId) => `exam_autosave_${examId}`;

export default function TakeExam() {
  const { id } = useParams();
  const navigate = useNavigate();
  const webcamRef = useRef(null);
  const { auth } = useAuth(); // FIXED: use context not localStorage

  const [exam, setExam] = useState(null);
  const [step, setStep] = useState("instructions");
  const [answers, setAnswers] = useState({});
  const [cameraAllowed, setCameraAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false); // FIX 4
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const [lastSaved, setLastSaved] = useState(null); // auto-save indicator

  const authHeaders = () => ({
    Authorization: `Bearer ${auth.token}`,
    "Content-Type": "application/json",
  });

  // Fetch exam + check if already submitted
  useEffect(() => {
    fetch(`/api/student/exam/${id}`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    })
      .then((res) => { if (!res.ok) throw new Error("Exam not found"); return res.json(); })
      .then((data) => {
        setExam(data);

        // FIX 4: check if student already submitted this exam
        if (data.status === "submitted" || data.status === "graded") {
          setAlreadySubmitted(true);
          setLoading(false);
          return;
        }

        if (data.duration && data.duration > 0) {
          setTimeLeft(data.duration * 60);
        }

        // FIX 3: restore auto-saved answers if they exist
        const saved = localStorage.getItem(AUTOSAVE_KEY(id));
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setAnswers(parsed);
            console.log("Restored auto-saved answers");
          } catch (_) {}
        }

        setLoading(false);
      })
      .catch(() => {
        alert("Failed to load exam.");
        navigate("/user/dashboard");
      });
  }, [id, auth.token]);

  // Timer logic
  useEffect(() => {
    if (step !== "test" || timeLeft === null) return;
    if (timeLeft <= 0) {
      alert("⏳ Time is up! Submitting automatically.");
      handleSubmit(true);
      return;
    }
    const timerId = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timerId);
  }, [step, timeLeft]);

  // FIX 3: Auto-save answers to localStorage every 15 seconds
  useEffect(() => {
    if (step !== "test") return;
    const saveInterval = setInterval(() => {
      localStorage.setItem(AUTOSAVE_KEY(id), JSON.stringify(answers));
      setLastSaved(new Date().toLocaleTimeString());
    }, 15000);
    return () => clearInterval(saveInterval);
  }, [step, answers, id]);

  // Also save immediately on every answer change
  const handleAnswerChange = useCallback((qId, value) => {
    setAnswers((prev) => {
      const updated = { ...prev, [qId]: value };
      localStorage.setItem(AUTOSAVE_KEY(id), JSON.stringify(updated));
      return updated;
    });
  }, [id]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleStartExam = () => {
    if (!cameraAllowed) return alert("You must allow camera access to start!");
    setStep("test");
  };

  // FIX 5: Back button
  const handlePrevQuestion = () => {
    if (currentQIndex > 0) setCurrentQIndex((i) => i - 1);
  };

  const handleNextQuestion = () => {
    if (currentQIndex < exam.questions.length - 1) setCurrentQIndex((i) => i + 1);
  };

  const hasAnsweredCurrent = () => {
    if (!exam) return false;
    const ans = answers[exam.questions[currentQIndex]._id];
    return ans && ans.trim().length > 0;
  };

  const answeredCount = () =>
    exam ? exam.questions.filter((q) => answers[q._id]?.trim?.()).length : 0;

  const handleSubmit = async (autoSubmit = false) => {
    if (!autoSubmit && !window.confirm("Are you sure you want to submit?")) return;

    try {
      const res = await fetch("/api/student/submit-exam", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ examId: id, answers }),
      });

      if (res.ok) {
        // FIX 3: Clear auto-save after successful submit
        localStorage.removeItem(AUTOSAVE_KEY(id));
        setStep("submitted");
      } else {
        const err = await res.json();
        alert("Submission failed: " + err.message);
      }
    } catch {
      alert("Network error. Could not submit.");
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-blue-900 font-bold">
      Loading Exam...
    </div>
  );

  // FIX 4: Already submitted screen
  if (alreadySubmitted) return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
      <div className="bg-white p-12 rounded-3xl shadow-2xl text-center max-w-lg w-full border border-stone-100">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
          🔒
        </div>
        <h1 className="text-3xl font-bold text-stone-900 mb-3 font-serif italic">Already Submitted</h1>
        <p className="text-stone-500 mb-8 leading-relaxed">
          You have already submitted this exam. You cannot attempt it again.
          Check your results on the dashboard.
        </p>
        <button onClick={() => navigate("/user/dashboard")}
          className="w-full bg-stone-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-stone-800">
          Back to Dashboard
        </button>
      </div>
    </div>
  );

  // INSTRUCTIONS VIEW
  if (step === "instructions") {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-2xl max-w-2xl w-full">
          <h1 className="text-3xl font-bold text-blue-900 mb-4">{exam.title}</h1>
          <p className="text-stone-500 mb-4 text-sm">{exam.subject} — {exam.questions.length} Questions</p>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 text-sm text-yellow-700">
            <p className="font-bold">⚠️ IMPORTANT RULES:</p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              {exam.duration > 0 && <li>Time Limit: {exam.duration} minutes.</li>}
              <li>Your camera will be ON during the entire exam.</li>
              <li>Answers are auto-saved every 15 seconds.</li>
              <li>Once submitted, you cannot re-enter this exam.</li>
              <li>You can go back and change answers before submitting.</li>
            </ul>
          </div>

          <div className="mb-6 flex flex-col items-center bg-black rounded-lg overflow-hidden h-64 w-full relative">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="absolute inset-0 w-full h-full object-cover"
              onUserMedia={() => setCameraAllowed(true)}
            />
            {!cameraAllowed && (
              <p className="text-white z-10 font-bold absolute top-1/2 -translate-y-1/2">
                Waiting for camera permission...
              </p>
            )}
          </div>

          <button onClick={handleStartExam} disabled={!cameraAllowed}
            className={`w-full py-4 rounded-lg font-bold text-lg transition ${
              cameraAllowed
                ? "bg-green-600 text-white hover:bg-green-700 shadow-lg"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}>
            {cameraAllowed ? "I Agree & Start Exam" : "Allow Camera to Enable Button"}
          </button>

          <button onClick={() => navigate("/user/dashboard")}
            className="mt-4 w-full text-gray-500 text-sm hover:underline">
            Cancel and Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // EXAM VIEW
  if (step === "test") {
    const q = exam.questions[currentQIndex];
    const isLastQuestion = currentQIndex === exam.questions.length - 1;
    const isFirstQuestion = currentQIndex === 0;
    const totalAnswered = answeredCount();

    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col md:flex-row relative font-sans">

        {/* Floating Timer */}
        {timeLeft !== null && (
          <div className={`fixed top-4 right-4 z-[60] px-4 py-2 rounded-lg font-mono text-xl font-bold shadow-xl border-2 ${
            timeLeft < 60
              ? "bg-red-600 text-white border-red-800 animate-pulse"
              : timeLeft < 300
              ? "bg-amber-500 text-white border-amber-700"
              : "bg-white text-stone-900 border-stone-900"
          }`}>
            ⏳ {formatTime(timeLeft)}
          </div>
        )}

        {/* Auto-save indicator */}
        {lastSaved && (
          <div className="fixed bottom-4 left-4 z-50 text-xs text-stone-400 bg-white border border-stone-200 px-3 py-1.5 rounded-lg shadow">
            ✓ Auto-saved at {lastSaved}
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 p-8 md:p-16 flex flex-col h-screen overflow-hidden">

          {/* Header */}
          <div className="flex justify-between items-center mb-8 border-b border-stone-200 pb-4">
            <div>
              <h2 className="text-3xl font-bold text-stone-900 font-serif italic mb-1">{exam.title}</h2>
              <p className="text-stone-500 text-sm font-medium uppercase tracking-wider">{exam.subject}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-stone-400">{totalAnswered}/{exam.questions.length} answered</span>
              <div className="bg-stone-900 text-amber-50 px-4 py-1.5 rounded-full text-sm font-bold">
                Q {currentQIndex + 1} / {exam.questions.length}
              </div>
            </div>
          </div>

          {/* Question Card */}
          <div className="flex-1 overflow-y-auto">
            <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-white relative">
              <div className="absolute top-0 right-0 p-6 opacity-5">
                <span className="text-9xl font-serif italic font-black text-stone-900">?</span>
              </div>

              <p className="font-bold text-2xl text-stone-800 leading-relaxed font-serif mb-8 relative z-10">
                {q.questionText}
              </p>

              <div className="relative z-10">
                {/* MCQ */}
                {q.questionType === "mcq" && q.options?.length > 0 && (
                  <div className="space-y-4 max-w-3xl">
                    {q.options.map((opt, i) => {
                      const optLabel = String.fromCharCode(65 + i);
                      const optKey = `Option${optLabel}`;
                      const isSelected = answers[q._id] === optKey;
                      return (
                        <label key={i}
                          className={`flex items-center p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 group ${
                            isSelected
                              ? "bg-stone-900 border-stone-900 text-white shadow-lg scale-[1.01]"
                              : "bg-white border-stone-200 hover:border-amber-400 hover:bg-stone-50"
                          }`}>
                          <input type="radio" name={q._id} value={optKey}
                            checked={isSelected}
                            onChange={() => handleAnswerChange(q._id, optKey)}
                            className="hidden" />
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-5 font-bold text-lg transition-colors ${
                            isSelected ? "bg-white text-stone-900" : "bg-stone-100 text-stone-500 group-hover:bg-amber-100 group-hover:text-amber-700"
                          }`}>
                            {optLabel}
                          </div>
                          <span className={`text-lg font-medium ${isSelected ? "text-white" : "text-stone-700"}`}>
                            {opt}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* Short Answer */}
                {q.questionType === "short" && (
                  <textarea
                    placeholder="Type your answer here..."
                    className="w-full max-w-3xl p-6 text-lg border-2 border-stone-200 rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none resize-none transition-all shadow-inner bg-stone-50 focus:bg-white"
                    rows="4"
                    value={answers[q._id] || ""}
                    onChange={(e) => handleAnswerChange(q._id, e.target.value)}
                  />
                )}

                {/* Long Answer */}
                {q.questionType === "long" && (
                  <textarea
                    placeholder="Write your detailed answer here..."
                    className="w-full max-w-3xl p-6 text-lg border-2 border-stone-200 rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none resize-y transition-all shadow-inner bg-stone-50 focus:bg-white min-h-[300px]"
                    rows="12"
                    value={answers[q._id] || ""}
                    onChange={(e) => handleAnswerChange(q._id, e.target.value)}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Footer Navigation */}
          <div className="mt-8 flex justify-between items-center gap-4">

            {/* FIX 5: Back button */}
            <button
              onClick={handlePrevQuestion}
              disabled={isFirstQuestion}
              className={`px-8 py-4 rounded-xl font-bold text-lg transition-all flex items-center gap-2 ${
                isFirstQuestion
                  ? "bg-stone-100 text-stone-300 cursor-not-allowed"
                  : "bg-white border-2 border-stone-200 text-stone-700 hover:border-stone-400"
              }`}>
              ← Previous
            </button>

            {/* Next / Submit */}
            {!isLastQuestion ? (
              <button onClick={handleNextQuestion}
                className="px-10 py-4 rounded-xl font-bold text-lg transition-all flex items-center gap-2 bg-stone-900 text-white hover:bg-emerald-600 shadow-xl active:scale-[0.98]">
                Next Question →
              </button>
            ) : (
              <button onClick={() => handleSubmit(false)}
                disabled={totalAnswered === 0}
                className={`px-10 py-4 rounded-xl font-bold text-lg transition-all flex items-center gap-2 ${
                  totalAnswered > 0
                    ? "bg-green-600 text-white hover:bg-green-700 shadow-xl shadow-green-600/30"
                    : "bg-stone-200 text-stone-400 cursor-not-allowed"
                }`}>
                ✅ Finish & Submit
              </button>
            )}
          </div>
        </div>

        {/* Sidebar: Webcam + Progress */}
        <div className="w-full md:w-80 bg-stone-900 p-6 flex flex-col items-center md:h-screen sticky top-0 z-50 border-l border-stone-800 shadow-2xl">
          <div className="w-full aspect-video bg-stone-800 rounded-xl overflow-hidden border-2 border-red-500/50 relative mb-6 shadow-lg">
            <Webcam audio={false} ref={webcamRef} className="w-full h-full object-cover opacity-80" />
            <div className="absolute top-3 right-3 w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
            <div className="absolute bottom-2 left-3 text-red-100 text-[10px] font-bold bg-red-900/80 px-2 py-0.5 rounded tracking-widest">
              REC ●
            </div>
          </div>

          <div className="text-center mb-6">
            <p className="text-stone-400 text-xs font-bold uppercase tracking-widest">Proctoring Active</p>
          </div>

          <div className="w-full">
            <p className="text-stone-500 text-xs font-bold uppercase tracking-widest mb-4">
              Progress — {totalAnswered}/{exam.questions.length}
            </p>
            <div className="grid grid-cols-5 gap-2">
              {exam.questions.map((question, i) => {
                const isAnswered = answers[question._id]?.trim?.();
                const isCurrent = i === currentQIndex;
                let cls = "bg-stone-800 text-stone-500";
                if (isCurrent) cls = "bg-amber-500 text-white border-2 border-amber-300 shadow-lg scale-110 z-10";
                else if (isAnswered) cls = "bg-emerald-600 text-white";

                return (
                  // FIX 5: clicking question number in sidebar also navigates
                  <button key={i} onClick={() => setCurrentQIndex(i)}
                    className={`h-10 w-10 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${cls}`}>
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <p className="text-stone-600 text-xs mt-4 text-center">
              Click any number to jump to that question
            </p>
          </div>
        </div>
      </div>
    );
  }

  // SUBMITTED VIEW
  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
      <div className="bg-white p-12 rounded-3xl shadow-2xl text-center max-w-lg w-full border border-stone-100">
        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-inner">
          ✅
        </div>
        <h1 className="text-4xl font-bold text-stone-900 mb-4 font-serif italic">Exam Submitted!</h1>
        <p className="text-stone-500 mb-10 text-lg leading-relaxed">
          Your answers have been saved. Your teacher will review and publish results soon.
        </p>
        <button onClick={() => navigate("/user/dashboard")}
          className="w-full bg-stone-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-stone-800 shadow-lg">
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}