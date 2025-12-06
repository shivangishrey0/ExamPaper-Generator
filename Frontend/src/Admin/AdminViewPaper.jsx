import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function AdminViewPaper() {
  const { id } = useParams(); // Get the Exam ID from the URL
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);

  useEffect(() => {
    // Fetch the specific exam details
    fetch(`/api/admin/exam/${id}`)
      .then((res) => res.json())
      .then((data) => setExam(data))
      .catch((err) => alert("Failed to load exam"));
  }, [id]);

  if (!exam) return <div className="p-10 text-center font-bold">Loading Paper...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden border-t-8 border-blue-900">
        
        {/* Header */}
        <div className="bg-gray-100 p-6 flex justify-between items-center border-b">
          <div>
            <h1 className="text-3xl font-bold text-blue-900">{exam.title}</h1>
            <p className="text-gray-600 text-lg">Subject: <span className="font-semibold">{exam.subject}</span></p>
            <p className="text-sm text-gray-500 mt-1">Total Questions: {exam.questions.length}</p>
          </div>
          <button 
            onClick={() => navigate("/admin/dashboard")}
            className="bg-blue-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-800 transition"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Questions List */}
        <div className="p-8 space-y-8">
          {exam.questions.map((q, index) => (
            <div key={q._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition bg-white">
              
              {/* Question Text */}
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-800 w-3/4">
                  <span className="text-blue-600 mr-2">Q{index + 1}.</span> 
                  {q.questionText}
                </h3>
                <span className={`px-3 py-1 rounded-full text-xs font-bold
                  ${q.difficulty === 'Easy' ? 'bg-green-100 text-green-800' : 
                    q.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-red-100 text-red-800'}`}>
                  {q.difficulty}
                </span>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-6">
                {q.options.map((opt, i) => (
                  <div key={i} className={`p-3 rounded border 
                    ${opt === q.correctAnswer 
                      ? "bg-green-100 border-green-500 font-bold text-green-900" // Highlight Correct Answer
                      : "bg-gray-50 border-gray-200 text-gray-600"}`
                  }>
                    <span className="mr-2 opacity-50">{String.fromCharCode(65 + i)}.</span>
                    {opt} 
                    {opt === q.correctAnswer && <span className="float-right">✅</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {exam.questions.length === 0 && (
             <p className="text-center text-red-500 py-10">
                This exam has no questions. (Check your generator logic).
             </p>
          )}
        </div>

      </div>
    </div>
  );
}