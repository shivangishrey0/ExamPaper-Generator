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

  // Fetch Exam Data
  useEffect(() => {
    fetch(`/api/user/exam/${id}`)
      .then((res) => {
        if(!res.ok) throw new Error("Exam not found");
        return res.json();
      })
      .then((data) => {
        setExam(data);
        setLoading(false);
      })
      .catch((err) => {
        alert("Failed to load exam. Check backend connection.");
        navigate("/user/dashboard");
      });
  }, [id, navigate]);

  const handleStartExam = () => {
    if (!cameraAllowed) return alert("You must allow camera access to start!");
    setStep("test");
  };

  const handleSubmit = async () => {
    if (!window.confirm("Are you sure you want to submit?")) return;
    
    // 1. GET THE SAVED ID
    const studentId = localStorage.getItem("userId");

    // Safety Check
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
              <li>Your camera will be ON during the entire exam.</li>
              <li>Ensure you are in a well-lit room.</li>
              <li>Do not leave the exam window.</li>
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
              onUserMediaError={(err) => {
                 console.error("Camera Error:", err);
                 alert(`Camera Failed: ${err.name} - ${err.message}`);
              }}
            />
            {!cameraAllowed && <p className="text-white z-10 font-bold">Waiting for camera permission...</p>}
          </div>

          <button 
            onClick={handleStartExam}
            disabled={!cameraAllowed}
            className={`w-full py-4 rounded-lg font-bold text-lg transition ${
              cameraAllowed 
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

  // --- VIEW 2: THE EXAM INTERFACE ---
  if (step === "test") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
        
        {/* Main Content: Questions */}
        <div className="flex-1 p-8 overflow-y-auto h-screen">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h2 className="text-2xl font-bold text-blue-900">
                {exam.title} <span className="text-sm text-gray-500 font-normal">({exam.subject})</span>
            </h2>
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">
                {exam.questions.length} Questions
            </div>
          </div>

          <div className="space-y-8 pb-20">
            {exam.questions.map((q, index) => (
              <div key={q._id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <p className="font-semibold text-lg text-gray-800 flex-1">
                    <span className="text-blue-600 mr-2">Q{index + 1}.</span> {q.questionText}
                  </p>
                  {/* Question Type Badge */}
                  <span className={`px-2 py-1 rounded text-xs font-bold ml-2 whitespace-nowrap
                    ${q.questionType === 'mcq' ? 'bg-blue-100 text-blue-700' : 
                      q.questionType === 'short' ? 'bg-purple-100 text-purple-700' : 
                      'bg-indigo-100 text-indigo-700'}`}>
                    {q.questionType === 'mcq' ? 'MCQ' : q.questionType === 'short' ? 'Short Answer' : 'Long Answer'}
                  </span>
                </div>
                
                {/* MCQ Options */}
                {q.questionType === 'mcq' && q.options && q.options.length > 0 && (
                  <div className="space-y-2 pl-4">
                    {q.options.map((opt, i) => {
                      const optionLabel = String.fromCharCode(65 + i);
                      const optionKey = `Option${optionLabel}`; 
                      
                      return (
                        <label key={i} className={`flex items-center p-3 rounded border cursor-pointer hover:bg-blue-50 transition ${answers[q._id] === optionKey ? "bg-blue-100 border-blue-500 ring-1 ring-blue-500" : "border-gray-200"}`}>
                          <input 
                            type="radio" 
                            name={q._id} 
                            value={optionKey} 
                            checked={answers[q._id] === optionKey}
                            onChange={() => setAnswers({...answers, [q._id]: optionKey})}
                            className="w-4 h-4 text-blue-600 mr-3"
                          />
                          <span className="font-bold mr-2 text-gray-400">({optionLabel})</span>
                          {opt} 
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* Short Answer Text Area */}
                {q.questionType === 'short' && (
                  <div className="pl-4">
                    <textarea
                      placeholder="Type your answer here (2-3 lines recommended)"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none"
                      rows="3"
                      value={answers[q._id] || ''}
                      onChange={(e) => setAnswers({...answers, [q._id]: e.target.value})}
                    />
                  </div>
                )}

                {/* Long Answer Text Area */}
                {q.questionType === 'long' && (
                  <div className="pl-4">
                    <textarea
                      placeholder="Write a detailed answer here (elaborate explanation expected)"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-y"
                      rows="8"
                      value={answers[q._id] || ''}
                      onChange={(e) => setAnswers({...answers, [q._id]: e.target.value})}
                    />
                  </div>
                )}

              </div>
            ))}
          </div>

          <div className="fixed bottom-0 left-0 w-full md:w-auto md:relative bg-white border-t p-4 flex justify-end">
             <button 
                onClick={handleSubmit}
                className="bg-blue-900 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-800 shadow-lg"
             >
                Submit Answer Sheet
             </button>
          </div>
        </div>

        {/* Sidebar: Webcam Proctoring */}
        <div className="w-full md:w-72 bg-black p-4 flex flex-col items-center md:h-screen sticky top-0 z-50">
          <div className="w-full aspect-video bg-gray-900 rounded-lg overflow-hidden border-2 border-red-500 relative mb-4 shadow-lg">
             <Webcam
                audio={false}
                ref={webcamRef}
                className="w-full h-full object-cover"
             />
             <div className="absolute top-2 right-2 w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
             <div className="absolute bottom-1 left-2 text-white text-[10px] bg-black bg-opacity-50 px-1 rounded">REC</div>
          </div>
          <p className="text-white text-xs text-center opacity-70">
            <span className="text-red-500 font-bold">PROCTORING ACTIVE</span><br/>
            Your session is being monitored.
          </p>
          
          {/* Question Navigator */}
          <div className="mt-8 w-full grid grid-cols-5 gap-2">
            {exam.questions.map((q, i) => (
                <div key={i} className={`h-8 w-8 rounded flex items-center justify-center text-xs font-bold ${answers[q._id] ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-300'}`}>
                    {i+1}
                </div>
            ))}
          </div>
        </div>

      </div>
    );
  }

  // --- VIEW 3: SUCCESS SCREEN ---
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-xl shadow-xl text-center max-w-md w-full border-t-8 border-green-500">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Exam Submitted!</h1>
        <p className="text-gray-600 mb-8">Your answers have been securely sent to the admin for grading.</p>
        <button 
          onClick={() => navigate("/user/dashboard")}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}