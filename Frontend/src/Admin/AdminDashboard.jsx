import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("add"); 
  const API_BASE = "http://localhost:5000/api/admin";
  
  // --- STATES ---
  const [qData, setQData] = useState({
    questionText: "", subject: "DBMS", difficulty: "Easy", 
    option1: "", option2: "", option3: "", option4: "", correctAnswer: ""
  });
  const [file, setFile] = useState(null);
  const [gData, setGData] = useState({
    title: "", subject: "DBMS", paperType: "mcq_only",
    easyCount: 0, mediumCount: 0, hardCount: 0,
    mcqCount: 0, shortCount: 0, longCount: 0
  });
  const [aiData, setAiData] = useState({ topic: "", subject: "DBMS", difficulty: "Medium", count: 5 });
  const [aiLoading, setAiLoading] = useState(false);
  const [exams, setExams] = useState([]);

  // --- HANDLERS ---

  const handleAddQuestion = async () => {
    // Validation
    if (!qData.questionText.trim()) {
      return alert("Please enter question text");
    }
    if (!qData.correctAnswer.trim()) {
      return alert("Please enter correct answer");
    }

    const payload = {
      questionText: qData.questionText,
      subject: qData.subject,
      difficulty: qData.difficulty,
      correctAnswer: qData.correctAnswer,
      options: [qData.option1, qData.option2, qData.option3, qData.option4].filter(opt => opt.trim()),
      questionType: "mcq"
    };
    try {
      const res = await fetch(`${API_BASE}/add-question`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        alert("Question Added Successfully!");
        // Reset form
        setQData({
          questionText: "", 
          subject: "DBMS", 
          difficulty: "Easy", 
          option1: "", option2: "", option3: "", option4: "", correctAnswer: ""
        });
      } else {
        alert("Failed: " + (data.message || JSON.stringify(data)));
      }
    } catch (err) {
      console.error("Add Question Error:", err);
      alert("Server Error: " + err.message);
    }
  };

  const handleFileUpload = async () => {
    if (!file) return alert("Please select a file first");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`${API_BASE}/upload-questions`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) { alert(data.message); setFile(null); } 
      else { alert("Upload Failed: " + data.message); }
    } catch (error) { alert("Server Error during upload"); }
  };

  const handleAIGenerate = async () => {
    if(!aiData.topic) return alert("Please enter a topic!");
    setAiLoading(true);
    try {
        const res = await fetch(`${API_BASE}/generate-ai-questions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(aiData),
        });
        const data = await res.json();
        if(res.ok) alert(data.message); else alert("Error: " + data.message);
    } catch (error) { alert("Server error connecting to AI"); } 
    finally { setAiLoading(false); }
  };

  const handleGenerate = async () => {
    if (!gData.title) return alert("Please enter an Exam Title");
    const payload = {
        ...gData,
        easyCount: Number(gData.easyCount) || 0,
        mediumCount: Number(gData.mediumCount) || 0,
        hardCount: Number(gData.hardCount) || 0,
        mcqCount: Number(gData.mcqCount) || 0,
        shortCount: Number(gData.shortCount) || 0,
        longCount: Number(gData.longCount) || 0,
    };
    try {
      const res = await fetch(`${API_BASE}/generate-paper`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload), 
      });
      const data = await res.json();
      if (res.ok) { alert(`Success! Exam created with ${data.totalQuestions} questions.`); fetchExams(); setActiveTab("view"); }
      else { alert(`Generation Failed: ${data.message}`); }
    } catch (err) { alert("Server Error during generation request."); }
  };

  const handleDeleteExam = async (examId) => {
    if (!window.confirm("⚠️ Are you sure? This will delete the Exam AND its Questions. This action cannot be undone.")) return;
    try {
      const res = await fetch(`${API_BASE}/exam/${examId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("Exam and Questions deleted successfully!");
        setExams(exams.filter((e) => e._id !== examId));
      } else {
        alert("Failed to delete exam");
      }
    } catch (error) {
      alert("Server error");
    }
  };

  // --- CLEAR ENTIRE DATABASE HANDLER ---
  const handleClearDatabase = async () => {
    if (!window.confirm("⚠️ DANGER: This will delete EVERY question in your database. Are you sure?")) return;
    try {
      const res = await fetch(`${API_BASE}/delete-all-questions`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("Database Cleared! All questions are gone.");
        window.location.reload();
      } else {
        alert("Failed to clear database");
      }
    } catch (error) {
      alert("Server error");
    }
  };

  const fetchExams = async () => {
      try {
        const res = await fetch(`${API_BASE}/get-exams`);
        const data = await res.json();
        setExams(data);
      } catch (err) {
        console.error("Error fetching exams");
      }
  };

  useEffect(() => { if(activeTab === 'view') fetchExams(); }, [activeTab]);


  return (
    <div className="min-h-screen bg-gray-100 flex flex-col relative">
      {/* Navbar */}
      <nav className="bg-blue-900 text-white p-4 shadow-md flex justify-between items-center sticky top-0 z-50">
        <h1 className="text-xl font-bold">Admin Dashboard</h1>
        <button onClick={() => navigate("/")} className="bg-red-500 px-4 py-2 rounded hover:bg-red-600 font-bold text-sm">Logout</button>
      </nav>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-lg hidden md:flex flex-col fixed h-full pt-16 pb-4 overflow-y-auto">
          <div className="p-4 space-y-2">
            <button onClick={() => setActiveTab("add")} className={`w-full text-left p-3 rounded transition ${activeTab === "add" ? "bg-blue-100 text-blue-900 font-bold" : "hover:bg-gray-100"}`}>
              + Add Single Question
            </button>
            <button onClick={() => setActiveTab("upload")} className={`w-full text-left p-3 rounded transition ${activeTab === "upload" ? "bg-blue-100 text-blue-900 font-bold" : "hover:bg-gray-100"}`}>
              📂 Bulk Upload (Excel)
            </button>
            <button onClick={() => setActiveTab("ai")} className={`w-full text-left p-3 rounded transition ${activeTab === "ai" ? "bg-purple-100 text-purple-900 font-bold" : "hover:bg-gray-100"}`}>
              ✨ AI Question Generator
            </button>
            <button onClick={() => setActiveTab("generate")} className={`w-full text-left p-3 rounded transition ${activeTab === "generate" ? "bg-blue-100 text-blue-900 font-bold" : "hover:bg-gray-100"}`}>
              ⚡ Generate Exam Paper
            </button>
             <button onClick={() => setActiveTab("view")} className={`w-full text-left p-3 rounded transition ${activeTab === "view" ? "bg-blue-100 text-blue-900 font-bold" : "hover:bg-gray-100"}`}>
              📄 View Created Exams
            </button>

            {/* DANGER ZONE - MOVED UP */}
            <hr className="my-4 border-gray-200"/>
             <button 
                onClick={handleClearDatabase} 
                className="w-full text-left p-3 rounded text-red-600 hover:bg-red-50 font-bold border border-red-200 text-sm flex items-center gap-2"
            >
                ⚠️ Clear Question Bank
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 ml-0 md:ml-64 overflow-y-auto min-h-[calc(100vh-64px)]">
          
          {/* 1. ADD QUESTION */}
          {activeTab === "add" && (
            <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto border-t-4 border-blue-900">
              <h2 className="text-2xl font-bold mb-6 text-blue-900">Add New Question</h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <select className="border p-2 rounded" value={qData.subject} onChange={(e) => setQData({...qData, subject: e.target.value})}>
                  <option value="DBMS">DBMS</option><option value="Operating System">Operating System</option><option value="Computer Networks">Computer Networks</option><option value="Algorithms">Algorithms</option><option value="Digital Logic">Digital Logic</option>
                </select>
                <select className="border p-2 rounded" value={qData.difficulty} onChange={(e) => setQData({...qData, difficulty: e.target.value})}>
                  <option>Easy</option><option>Medium</option><option>Hard</option>
                </select>
              </div>
              <textarea 
                placeholder="Enter Question Text" 
                className="w-full border p-2 rounded mb-4 h-24" 
                value={qData.questionText}
                onChange={(e) => setQData({...qData, questionText: e.target.value})}
              ></textarea>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <input 
                  placeholder="Option A" 
                  className="border p-2 rounded" 
                  value={qData.option1}
                  onChange={(e) => setQData({...qData, option1: e.target.value})} 
                />
                <input 
                  placeholder="Option B" 
                  className="border p-2 rounded" 
                  value={qData.option2}
                  onChange={(e) => setQData({...qData, option2: e.target.value})} 
                />
                <input 
                  placeholder="Option C" 
                  className="border p-2 rounded" 
                  value={qData.option3}
                  onChange={(e) => setQData({...qData, option3: e.target.value})} 
                />
                <input 
                  placeholder="Option D" 
                  className="border p-2 rounded" 
                  value={qData.option4}
                  onChange={(e) => setQData({...qData, option4: e.target.value})} 
                />
              </div>
              <input 
                placeholder="Correct Answer" 
                className="w-full border p-2 rounded mb-6 bg-green-50" 
                value={qData.correctAnswer}
                onChange={(e) => setQData({...qData, correctAnswer: e.target.value})} 
              />
              <button onClick={handleAddQuestion} className="w-full bg-blue-900 text-white py-3 rounded font-bold hover:bg-blue-800">Save Question</button>
            </div>
          )}

          {/* 2. BULK UPLOAD */}
          {activeTab === "upload" && (
            <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto border-t-4 border-green-900">
                <h2 className="text-2xl font-bold mb-6 text-green-900">Upload Excel File</h2>
                <div className="bg-yellow-50 p-4 rounded mb-6 text-sm text-yellow-800 border border-yellow-200">
                  <p className="font-bold mb-2">Instructions:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Headers: <code>QuestionText, Section, QuestionType, Option1...Option4, CorrectAnswer</code></li>
                    <li><strong>QuestionType:</strong> 'mcq', 'short', or 'long'</li>
                    <li>For Short/Long answers, leave Option columns empty.</li>
                  </ul>
                </div>
                <input type="file" accept=".xlsx, .xls" className="w-full border p-3 rounded mb-6" onChange={(e) => setFile(e.target.files[0])} />
                <button onClick={handleFileUpload} className="w-full bg-green-900 text-white py-3 rounded font-bold hover:bg-green-800">Upload Questions</button>
            </div>
          )}

          {/* 3. AI GENERATOR */}
          {activeTab === "ai" && (
             <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto border-t-4 border-purple-600">
                <h2 className="text-2xl font-bold mb-2 text-purple-900">✨ AI Question Generator</h2>
                <p className="mb-6 text-gray-600 text-sm">Enter a topic, and our AI will automatically generate questions and save them to the database.</p>
                <label className="block text-gray-700 font-bold mb-2">Topic</label>
                <input placeholder="e.g., Normalization, Deadlocks, TCP/IP" className="w-full border p-3 rounded mb-4 focus:ring-2 ring-purple-500 outline-none" onChange={(e) => setAiData({...aiData, topic: e.target.value})}/>
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Subject</label><select className="w-full border p-2 rounded" onChange={(e) => setAiData({...aiData, subject: e.target.value})}><option value="DBMS">DBMS</option><option value="Operating System">Operating System</option><option value="Computer Networks">Networks</option></select></div>
                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Difficulty</label><select className="w-full border p-2 rounded" onChange={(e) => setAiData({...aiData, difficulty: e.target.value})}><option>Easy</option><option>Medium</option><option>Hard</option></select></div>
                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Count</label><input type="number" max="10" placeholder="5" className="w-full border p-2 rounded" value={aiData.count} onChange={(e) => setAiData({...aiData, count: e.target.value})}/></div>
                </div>
                <button onClick={handleAIGenerate} disabled={aiLoading} className={`w-full py-3 rounded font-bold text-white transition shadow-lg ${aiLoading ? "bg-gray-400 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700"}`}>{aiLoading ? "Generating... 🤖" : "Generate & Save Questions ✨"}</button>
             </div>
          )}

          {/* 4. MASTER EXAM GENERATOR */}
          {activeTab === "generate" && (
            <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto border-t-4 border-blue-600">
                <h2 className="text-2xl font-bold mb-4 text-blue-900">Auto-Generate Exam</h2>
                <div className="mb-6 grid grid-cols-2 gap-4">
                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Exam Title</label><input placeholder="e.g. Mid-Term 2024" className="w-full border p-2 rounded" onChange={(e) => setGData({...gData, title: e.target.value})} /></div>
                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Subject</label><select className="w-full border p-2 rounded" onChange={(e) => setGData({...gData, subject: e.target.value})}><option value="DBMS">DBMS</option><option value="Operating System">Operating System</option><option value="Computer Networks">Computer Networks</option><option value="Algorithms">Algorithms</option></select></div>
                </div>
                <div className="mb-6"><label className="block text-sm font-bold text-gray-700 mb-2">Select Paper Pattern:</label><div className="grid grid-cols-3 gap-2">
                    <button onClick={() => setGData({...gData, paperType: "mcq_only"})} className={`p-2 rounded border text-sm font-bold ${gData.paperType === "mcq_only" ? "bg-blue-600 text-white border-blue-600" : "bg-gray-50 text-gray-600"}`}>🔵 MCQ Only</button>
                    <button onClick={() => setGData({...gData, paperType: "subjective_only"})} className={`p-2 rounded border text-sm font-bold ${gData.paperType === "subjective_only" ? "bg-orange-500 text-white border-orange-500" : "bg-gray-50 text-gray-600"}`}>🟠 Subjective Only</button>
                    <button onClick={() => setGData({...gData, paperType: "mixed"})} className={`p-2 rounded border text-sm font-bold ${gData.paperType === "mixed" ? "bg-purple-600 text-white border-purple-600" : "bg-gray-50 text-gray-600"}`}>🟣 Mixed Paper</button>
                </div></div>
                {gData.paperType === "mcq_only" && (<div className="bg-blue-50 p-4 rounded border border-blue-100 mb-6 animate-fade-in"><h3 className="text-blue-900 font-bold mb-3 text-sm uppercase">MCQ Configuration</h3><div className="grid grid-cols-3 gap-4"><div><label className="text-xs text-gray-500 font-bold">Easy Qs</label><input type="number" className="w-full border p-2 rounded" placeholder="0" onChange={(e) => setGData({...gData, easyCount: e.target.value})} /></div><div><label className="text-xs text-gray-500 font-bold">Medium Qs</label><input type="number" className="w-full border p-2 rounded" placeholder="0" onChange={(e) => setGData({...gData, mediumCount: e.target.value})} /></div><div><label className="text-xs text-gray-500 font-bold">Hard Qs</label><input type="number" className="w-full border p-2 rounded" placeholder="0" onChange={(e) => setGData({...gData, hardCount: e.target.value})} /></div></div></div>)}
                {gData.paperType === "subjective_only" && (<div className="bg-orange-50 p-4 rounded border border-orange-100 mb-6 animate-fade-in"><h3 className="text-orange-900 font-bold mb-3 text-sm uppercase">Theory Configuration</h3><div className="grid grid-cols-2 gap-4"><div><label className="text-xs text-gray-500 font-bold">Short Answer Qs</label><input type="number" className="w-full border p-2 rounded" placeholder="0" onChange={(e) => setGData({...gData, shortCount: e.target.value})} /></div><div><label className="text-xs text-gray-500 font-bold">Long Answer Qs</label><input type="number" className="w-full border p-2 rounded" placeholder="0" onChange={(e) => setGData({...gData, longCount: e.target.value})} /></div></div></div>)}
                {gData.paperType === "mixed" && (<div className="bg-purple-50 p-4 rounded border border-purple-100 mb-6 animate-fade-in"><h3 className="text-purple-900 font-bold mb-3 text-sm uppercase">Mixed Paper Configuration</h3><div className="grid grid-cols-3 gap-4"><div><label className="text-xs text-gray-500 font-bold">Total MCQs</label><input type="number" className="w-full border p-2 rounded" placeholder="0" onChange={(e) => setGData({...gData, mcqCount: e.target.value})} /></div><div><label className="text-xs text-gray-500 font-bold">Short Ans</label><input type="number" className="w-full border p-2 rounded" placeholder="0" onChange={(e) => setGData({...gData, shortCount: e.target.value})} /></div><div><label className="text-xs text-gray-500 font-bold">Long Ans</label><input type="number" className="w-full border p-2 rounded" placeholder="0" onChange={(e) => setGData({...gData, longCount: e.target.value})} /></div></div></div>)}
                <button onClick={handleGenerate} className="w-full bg-blue-900 text-white py-3 rounded font-bold hover:bg-blue-800 shadow-lg transition transform hover:scale-[1.02]">⚡ Generate Paper</button>
            </div>
          )}
          
           {/* 5. VIEW EXAMS */}
           {activeTab === "view" && (
             <div className="grid gap-4 pb-20">
                 {exams.length === 0 && <p className="text-gray-500 text-center mt-10">No exams generated yet.</p>}
                 {exams.map((exam) => (
                     <div key={exam._id} className="bg-white p-4 rounded shadow border-l-4 border-blue-900 flex flex-col md:flex-row justify-between items-center gap-4">
                         
                         {/* Exam Info */}
                         <div className="flex-1">
                            <h3 className="font-bold text-lg text-gray-800">{exam.title}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-bold uppercase">{exam.subject}</span>
                                {exam.isPublished ? (
                                   <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-bold">LIVE ✅</span>
                                ) : (
                                   <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-bold">Draft 🔒</span>
                                )}
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-bold">{exam.questions?.length || 0} Qs</span>
                            </div>
                         </div>
                         
                         {/* Action Buttons */}
                         <div className="flex items-center gap-2">
                            <button 
                              onClick={() => navigate(`/admin/view-exam/${exam._id}`)}
                              className="bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 text-sm font-bold shadow-sm"
                            >
                              View
                            </button>

                            <button 
                              onClick={() => navigate(`/admin/check-paper/${exam._id}`)}
                              className="bg-yellow-500 text-white px-3 py-1.5 rounded hover:bg-yellow-600 text-sm font-bold shadow-sm"
                            >
                              Results 📊
                            </button>

                            <button 
                              onClick={() => handleDeleteExam(exam._id)}
                              className="bg-red-500 text-white px-3 py-1.5 rounded hover:bg-red-600 text-sm font-bold shadow-sm"
                            >
                              Delete 🗑️
                            </button>

                            {!exam.isPublished && (
                              <button 
                                onClick={async () => {
                                    if(!confirm("Are you sure? Students will be able to see this exam.")) return;
                                    const res = await fetch(`${API_BASE}/publish/${exam._id}`, { method: "PUT" });
                                    if(res.ok) {
                                        alert("Exam Published Successfully!");
                                        fetchExams(); 
                                    }
                                }}
                                className="bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 text-sm font-bold shadow-sm"
                              >
                                Publish 🚀
                              </button>
                            )}
                         </div>
                     </div>
                 ))}
             </div>
           )}

        </main>
      </div>
    </div>
  );
}