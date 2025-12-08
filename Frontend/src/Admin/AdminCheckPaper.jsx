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

  // 2. Auto-Check Logic (Compares Keys: OptionA === OptionA)
  const calculateScore = () => {
    if (!selectedPaper || !examData) return 0;
    let score = 0;
    examData.questions.forEach(q => {
      const studentAns = selectedPaper.answers[q._id];
      if (studentAns === q.correctAnswer) score++;
    });
    return score;
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
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="text-xl font-bold">Grading Sheet: {selectedPaper.studentId?.username}</h2>
                    <div className="text-right">
                        <span className="block text-sm text-gray-500">Auto-Calculated Score:</span>
                        <span className="text-2xl font-bold text-blue-600">{calculateScore()} / {examData.questions.length}</span>
                    </div>
                </div>

                {/* Paper Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                    {examData.questions.map((q, index) => {
                        const studentAnsKey = selectedPaper.answers[q._id]; // "OptionA"
                        const correctAnsKey = q.correctAnswer; // "OptionA"
                        
                        const isCorrect = studentAnsKey === correctAnsKey;

                        // 👇 CONVERT KEYS TO READABLE TEXT HERE 👇
                        const studentText = getOptionText(q, studentAnsKey);
                        const correctText = getOptionText(q, correctAnsKey);
                        
                        return (
                            <div key={q._id} className={`p-4 rounded border-2 ${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                                <p className="font-bold mb-2">Q{index+1}. {q.questionText}</p>
                                
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