import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function AdminCheckPaper() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [examData, setExamData] = useState(null);
  const [manualScores, setManualScores] = useState({}); 

  // 1. Fetch data
  useEffect(() => {
    fetch(`/api/admin/submissions/${examId}`)
      .then(res => res.json())
      .then(data => setSubmissions(data))
      .catch(err => console.error(err));

    fetch(`/api/admin/exam/${examId}`)
      .then(res => res.json())
      .then(data => setExamData(data));
  }, [examId]);

  // --- HELPER: Normalize Strings for Comparison ---
  // This fixes the "TCP" vs "tcp" and "Layer 2 " vs "Layer 2" issue
  const cleanString = (str) => {
    if (!str) return "";
    return String(str).trim().toLowerCase();
  };

  // --- HELPER: Convert "OptionA" -> "Actual Text Answer" ---
  const getOptionText = (question, optionKey) => {
    if (!optionKey) return "Not Answered";
    
    // If it's the new format "OptionA", "OptionB"...
    if (optionKey.startsWith("Option") && optionKey.length > 6) {
      const charCode = optionKey.charCodeAt(optionKey.length - 1);
      const index = charCode - 65;
      return question.options[index] || optionKey;
    }
    return optionKey;
  };

  // 2. Score Calculation Logic (UPDATED)
  const getAutoScore = () => {
    if (!selectedPaper || !examData) return 0;
    let score = 0;
    
    examData.questions.forEach(q => {
      if (q.questionType === 'mcq') {
        const studentAnsRaw = selectedPaper.answers[q._id];
        const correctAnsRaw = q.correctAnswer;

        // Resolve text first to ensure we compare apples to apples
        const studentText = getOptionText(q, studentAnsRaw);
        const correctText = getOptionText(q, correctAnsRaw);

        // Compare using the cleanString helper
        if (cleanString(studentText) === cleanString(correctText)) {
          score++;
        }
      }
    });
    return score;
  };

  const getTotalScore = () => {
    const autoScore = getAutoScore();
    const manualTotal = Object.values(manualScores).reduce((a, b) => a + Number(b), 0);
    return autoScore + manualTotal;
  };

  const getMaxScore = () => {
    if (!examData) return 0;
    return examData.questions.reduce((total, q) => {
      if (q.questionType === 'short') return total + 2;
      if (q.questionType === 'long') return total + 5;
      return total + 1; // MCQ = 1
    }, 0);
  };

  const countQuestionTypes = () => {
    if (!examData) return { mcq: 0, subjective: 0, total: 0 };
    const mcq = examData.questions.filter(q => q.questionType === 'mcq').length;
    const subjective = examData.questions.filter(q => q.questionType === 'short' || q.questionType === 'long').length;
    return { mcq, subjective, total: examData.questions.length };
  };

  // 3. Publish Result
  const handlePublishResult = async () => {
    const finalScore = getTotalScore();
    const res = await fetch("/api/admin/grade-paper", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        submissionId: selectedPaper._id,
        score: finalScore
      })
    });

    if (res.ok) {
      alert(`Result Published! Score: ${finalScore}`);
      setSelectedPaper(null);
      const updated = submissions.map(sub =>
        sub._id === selectedPaper._id ? { ...sub, isGraded: true, score: finalScore } : sub
      );
      setSubmissions(updated);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-blue-900">Student Submissions</h1>
        <button onClick={() => navigate("/admin/dashboard")} className="bg-gray-500 text-white px-4 py-2 rounded">Back</button>
      </div>

      {/* --- LIST OF STUDENTS --- */}
      <div className="grid gap-4">
        {submissions.length === 0 && <p>No students have submitted this exam yet.</p>}
        {submissions.map((sub) => (
          <div key={sub._id} className="bg-white p-4 rounded shadow border-l-4 border-blue-600 flex justify-between items-center">
            <div>
              <h3 className="font-bold">{sub.studentId?.username || "Student"}</h3>
              <p className="text-sm text-gray-500">{new Date(sub.createdAt).toLocaleString()}</p>
            </div>

            <div className="flex items-center gap-4">
              {sub.isGraded ? (
                <span className="text-green-600 font-bold border border-green-200 bg-green-50 px-3 py-1 rounded">
                  Score: {sub.score}
                </span>
              ) : (
                <span className="text-yellow-600 font-bold bg-yellow-50 px-3 py-1 rounded">Pending Check</span>
              )}

              <button
                onClick={() => {
                  setSelectedPaper(sub);
                  setManualScores({}); 
                }}
                className="bg-blue-900 text-white px-4 py-2 rounded hover:bg-blue-800"
              >
                {sub.isGraded ? "View Paper" : "Check & Grade"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* --- GRADING MODAL --- */}
      {selectedPaper && examData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white w-full max-w-4xl h-[90vh] rounded-lg shadow-2xl flex flex-col">

            {/* Header */}
            <div className="p-4 border-b bg-gray-50">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Grading Sheet: {selectedPaper.studentId?.username}</h2>
                <div className="text-right">
                  <span className="block text-sm text-gray-500">Total Score:</span>
                  <span className="text-2xl font-bold text-blue-600">{getTotalScore()} / {getMaxScore()}</span> (Auto: {getAutoScore()})
                </div>
              </div>
              {countQuestionTypes().subjective > 0 && (
                <div className="mt-3 bg-yellow-50 border border-yellow-300 rounded p-3 text-sm text-yellow-800">
                  ⚠️ <strong>Note:</strong> This exam contains {countQuestionTypes().subjective} subjective question(s). Please review manually.
                </div>
              )}
            </div>

            {/* Paper Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {examData.questions.map((q, index) => {
                const studentAnsKey = selectedPaper.answers[q._id];
                const correctAnsKey = q.correctAnswer;

                // 1. Resolve to text
                const studentText = q.questionType === 'mcq' ? getOptionText(q, studentAnsKey) : studentAnsKey;
                const correctText = q.questionType === 'mcq' ? getOptionText(q, correctAnsKey) : correctAnsKey;

                // 2. Normalize and Compare (Fix for case sensitivity)
                const isCorrect = cleanString(studentText) === cleanString(correctText);

                return (
                  <div key={q._id} className={`p-4 rounded border-2 ${isCorrect ? 'border-green-200 bg-green-50' : (q.questionType === 'mcq' ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50')}`}>
                    <div className="flex justify-between items-start mb-3">
                      <p className="font-bold">Q{index + 1}. {q.questionText}</p>
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase ml-2
                                    ${q.questionType === 'mcq' ? 'bg-blue-100 text-blue-700' :
                          q.questionType === 'short' ? 'bg-purple-100 text-purple-700' :
                            'bg-indigo-100 text-indigo-700'}`}>
                        {q.questionType}
                      </span>
                    </div>

                    {/* MCQ Display */}
                    {q.questionType === 'mcq' && (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="p-2 bg-white rounded border">
                          <span className="block text-gray-500 text-xs uppercase">Student Answer</span>
                          <span className={`font-bold ${isCorrect ? 'text-green-700' : 'text-red-600'}`}>
                            {studentText || "Not Answered"}
                          </span>
                        </div>
                        <div className="p-2 bg-white rounded border">
                          <span className="block text-gray-500 text-xs uppercase">Correct Answer</span>
                          <span className="font-bold text-green-700">{correctText}</span>
                        </div>
                      </div>
                    )}

                    {/* Subjective Display */}
                    {(q.questionType === 'short' || q.questionType === 'long') && (
                      <div className="space-y-3">
                        <div className="p-3 bg-blue-50 rounded border border-blue-200">
                          <span className="block text-gray-600 text-xs uppercase font-semibold mb-2">Student's Answer:</span>
                          <p className="text-gray-800 whitespace-pre-wrap">{studentText || "(No answer provided)"}</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded border border-green-200">
                          <span className="block text-gray-600 text-xs uppercase font-semibold mb-2">Expected Answer:</span>
                          <p className="text-gray-800 whitespace-pre-wrap">{correctText}</p>
                        </div>
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 text-sm text-yellow-800 flex justify-between items-center">
                          <div>
                            ⚠️ <strong>Manual Grading:</strong> (Max: {q.questionType === 'long' ? 5 : 2}).
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="font-bold text-blue-900">Score:</label>
                            <input
                              type="number"
                              min="0"
                              max={q.questionType === 'long' ? 5 : 2}
                              step="0.5"
                              className="w-16 p-1 border border-blue-300 rounded text-center font-bold"
                              value={manualScores[q._id] || ""}
                              onChange={(e) => setManualScores({ ...manualScores, [q._id]: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t flex justify-end gap-3 bg-gray-50">
              <button onClick={() => setSelectedPaper(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded">Cancel</button>
              <button
                onClick={handlePublishResult}
                className="px-6 py-2 bg-green-600 text-white font-bold rounded hover:bg-green-700 shadow-lg"
              >
                ✅ Confirm & Publish Score
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}