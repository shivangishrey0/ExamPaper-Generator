import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function AdminCheckPaper() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [selectedPaper, setSelectedPaper] = useState(null); 
  const [examData, setExamData] = useState(null);

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

  // --- HELPER: Convert "OptionA" -> "Actual Text Answer" ---
  const getOptionText = (question, optionKey) => {
    if (!optionKey) return "Not Answered";
    
    // If it's the new format "OptionA", "OptionB"...
    if (optionKey.startsWith("Option") && optionKey.length > 6) {
      // Get the last character ('A', 'B'...)
      const charCode = optionKey.charCodeAt(optionKey.length - 1); 
      // Convert 'A' (65) -> Index 0
      const index = charCode - 65; 
      
      // Return the text from the options array
      return question.options[index] || optionKey;
    }

    // Fallback for old data or other formats
    return optionKey;
  };

  // 2. Auto-Check Logic (Only MCQs can be auto-graded)
  const calculateScore = () => {
    if (!selectedPaper || !examData) return 0;
    let score = 0;
    examData.questions.forEach(q => {
      // Only auto-grade MCQs
      if (q.questionType === 'mcq') {
        const studentAns = selectedPaper.answers[q._id];
        if (studentAns === q.correctAnswer) score++;
      }
    });
    return score;
  };

  // Count question types
  const countQuestionTypes = () => {
    if (!examData) return { mcq: 0, subjective: 0, total: 0 };
    const mcq = examData.questions.filter(q => q.questionType === 'mcq').length;
    const subjective = examData.questions.filter(q => q.questionType === 'short' || q.questionType === 'long').length;
    return { mcq, subjective, total: examData.questions.length };
  };

  // 3. Publish Result
  const handlePublishResult = async () => {
    const finalScore = calculateScore();
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
                  onClick={() => setSelectedPaper(sub)}
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
                            <span className="block text-sm text-gray-500">MCQ Score (Auto-Graded):</span>
                            <span className="text-2xl font-bold text-blue-600">{calculateScore()} / {countQuestionTypes().mcq}</span>
                        </div>
                    </div>
                    {countQuestionTypes().subjective > 0 && (
                        <div className="mt-3 bg-yellow-50 border border-yellow-300 rounded p-3 text-sm text-yellow-800">
                            ⚠️ <strong>Note:</strong> This exam contains {countQuestionTypes().subjective} subjective question(s). Please review manually and adjust the final score before publishing.
                        </div>
                    )}
                </div>

                {/* Paper Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                    {examData.questions.map((q, index) => {
                        const studentAnsKey = selectedPaper.answers[q._id];
                        const correctAnsKey = q.correctAnswer;
                        
                        const isCorrect = studentAnsKey === correctAnsKey;

                        // For MCQ: Convert keys to readable text
                        const studentText = q.questionType === 'mcq' ? getOptionText(q, studentAnsKey) : studentAnsKey;
                        const correctText = q.questionType === 'mcq' ? getOptionText(q, correctAnsKey) : correctAnsKey;
                        
                        return (
                            <div key={q._id} className={`p-4 rounded border-2 ${isCorrect ? 'border-green-200 bg-green-50' : (q.questionType === 'mcq' ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50')}`}>
                                <div className="flex justify-between items-start mb-3">
                                  <p className="font-bold">Q{index+1}. {q.questionText}</p>
                                  {/* Question Type Badge */}
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
                                              {studentText} 
                                          </span>
                                      </div>
                                      <div className="p-2 bg-white rounded border">
                                          <span className="block text-gray-500 text-xs uppercase">Correct Answer</span>
                                          <span className="font-bold text-green-700">{correctText}</span>
                                      </div>
                                  </div>
                                )}

                                {/* Subjective Display (Short/Long) */}
                                {(q.questionType === 'short' || q.questionType === 'long') && (
                                  <div className="space-y-3">
                                      <div className="p-3 bg-blue-50 rounded border border-blue-200">
                                          <span className="block text-gray-600 text-xs uppercase font-semibold mb-2">Student's Answer:</span>
                                          <p className="text-gray-800 whitespace-pre-wrap">{studentText || "(No answer provided)"}</p>
                                      </div>
                                      <div className="p-3 bg-green-50 rounded border border-green-200">
                                          <span className="block text-gray-600 text-xs uppercase font-semibold mb-2">Expected Answer / Key Points:</span>
                                          <p className="text-gray-800 whitespace-pre-wrap">{correctText}</p>
                                      </div>
                                      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 text-xs text-yellow-800">
                                          ⚠️ <strong>Manual Grading Required:</strong> Compare the student's answer with the expected answer and adjust the score manually if needed.
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