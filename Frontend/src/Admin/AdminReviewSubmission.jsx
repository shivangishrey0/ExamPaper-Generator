import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function AdminReviewSubmission() {
  const { id } = useParams(); // submissionId
  const navigate = useNavigate();
  const [submission, setSubmission] = useState(null);
  const [manualMarks, setManualMarks] = useState({});

  
  useEffect(() => {
  // Use a relative path to let Vite's proxy handle the port (5000 vs 5173)
  fetch(`http://localhost:5000/api/admin/submission/${id}`)
    .then((res) => {
      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      return res.json();
    })
    .then((data) => setSubmission(data))
    .catch((err) => console.error("Fetch error:", err));
}, [id]);

  const handleSaveGrades = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/grade-submission/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marksData: manualMarks }),
      });
      if (res.ok) {
        alert("Grades saved successfully!");
        navigate(-1); // Go back to student list
      }
    } catch (err) {
      alert("Failed to save grades");
    }
  };

  if (!submission) return <div className="p-10 text-center">Loading Answer Sheet...</div>;

  return (
    <div className="min-h-screen bg-[#f4f7f5] p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="bg-[#2d4a3e] p-8 text-white flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Reviewing: {submission.studentName}</h2>
            <p className="text-green-200 text-sm">Exam: {submission.examTitle}</p>
          </div>
          <button onClick={handleSaveGrades} className="bg-[#ebc351] text-[#2d4a3e] px-6 py-3 rounded-xl font-black uppercase text-xs">
            Save Final Grades
          </button>
        </div>

        <div className="p-8 space-y-8">
          {submission.answers.map((ans, index) => (
            <div key={index} className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="flex justify-between mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Question {index + 1} ({ans.type})</span>
                {ans.type === 'mcq' && (
                  <span className={`text-[10px] font-bold px-2 py-1 rounded ${ans.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {ans.isCorrect ? 'Correct' : 'Incorrect'}
                  </span>
                )}
              </div>
              
              <h3 className="font-bold text-[#2d4a3e] mb-4">{ans.questionText}</h3>

              {ans.type === 'mcq' ? (
                <div className="text-sm text-gray-600">Student chose: <span className="font-bold">{ans.studentAnswer}</span></div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-white border rounded-xl italic text-gray-700">"{ans.studentAnswer || "No answer provided"}"</div>
                  <div className="flex items-center gap-4">
                    <label className="text-[10px] font-bold uppercase text-gray-500">Marks Awarded:</label>
                    <input 
  type="number" 
  // This ensures the input always has a number and never 'undefined'
  value={manualMarks[ans.questionId] || 0} 
  onChange={(e) => setManualMarks({...manualMarks, [ans.questionId]: e.target.value})}
  className="w-24 p-2 border rounded-lg focus:ring-2 focus:ring-[#ebc351] outline-none font-bold text-center"
/>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}