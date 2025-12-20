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
    title: "", subject: "DBMS", paperType: "mcq_only", duration: 0, // Added duration
    easyCount: 0, mediumCount: 0, hardCount: 0,
    mcqCount: 0, shortCount: 0, longCount: 0
  });

  const [exams, setExams] = useState([]);

  // --- HANDLERS ---
  const handleAddQuestion = async () => {
    if (!qData.questionText.trim()) return alert("Please enter question text");
    if (!qData.correctAnswer.trim()) return alert("Please enter correct answer");

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
        setQData({ questionText: "", subject: "DBMS", difficulty: "Easy", option1: "", option2: "", option3: "", option4: "", correctAnswer: "" });
      } else {
        alert("Failed: " + (data.message || JSON.stringify(data)));
      }
    } catch (err) {
      alert("Server Error: " + err.message);
    }
  };

  const handleFileUpload = async () => {
    if (!file) return alert("Please select a file first");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`${API_BASE}/upload-questions`, { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) { alert(data.message); setFile(null); } 
      else { alert("Upload Failed: " + data.message); }
    } catch (error) { alert("Server Error during upload"); }
  };

  const handleGenerate = async () => {
    if (!gData.title) return alert("Please enter an Exam Title");
    const payload = {
        ...gData,
        duration: Number(gData.duration) || 0, // Ensure number
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
    if (!window.confirm("⚠️ Are you sure? This will delete the Exam AND its Questions.")) return;
    try {
      const res = await fetch(`${API_BASE}/exam/${examId}`, { method: "DELETE" });
      if (res.ok) { alert("Exam and Questions deleted successfully!"); setExams(exams.filter((e) => e._id !== examId)); } 
      else { alert("Failed to delete exam"); }
    } catch (error) { alert("Server error"); }
  };

  const handleClearDatabase = async () => {
    if (!window.confirm("⚠️ DANGER: This will delete EVERY question. Are you sure?")) return;
    try {
      const res = await fetch(`${API_BASE}/delete-all-questions`, { method: "DELETE" });
      if (res.ok) { alert("Database Cleared!"); window.location.reload(); } 
      else { alert("Failed to clear database"); }
    } catch (error) { alert("Server error"); }
  };

  const fetchExams = async () => {
      try {
        const res = await fetch(`${API_BASE}/get-exams`);
        const data = await res.json();
        setExams(data);
      } catch (err) { console.error("Error fetching exams"); }
  };

  useEffect(() => { if(activeTab === 'view') fetchExams(); }, [activeTab]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col relative">
      <nav className="bg-blue-900 text-white p-4 shadow-md flex justify-between items-center sticky top-0 z-50">
        <h1 className="text-xl font-bold">Admin Dashboard</h1>
        <button onClick={() => navigate("/")} className="bg-red-500 px-4 py-2 rounded hover:bg-red-600 font-bold text-sm">Logout</button>
      </nav>

      <div className="flex flex-1">
        <aside className="w-64 bg-white shadow-lg hidden md:flex flex-col fixed h-full pt-16 pb-4 overflow-y-auto">
          <div className="p-4 space-y-2">
            <button onClick={() => setActiveTab("add")} className={`w-full text-left p-3 rounded transition ${activeTab === "add" ? "bg-blue-100 text-blue-900 font-bold" : "hover:bg-gray-100"}`}>+ Add Question</button>
            <button onClick={() => setActiveTab("upload")} className={`w-full text-left p-3 rounded transition ${activeTab === "upload" ? "bg-blue-100 text-blue-900 font-bold" : "hover:bg-gray-100"}`}>📂 Bulk Upload</button>
            <button onClick={() => setActiveTab("generate")} className={`w-full text-left p-3 rounded transition ${activeTab === "generate" ? "bg-blue-100 text-blue-900 font-bold" : "hover:bg-gray-100"}`}>⚡ Generate Exam</button>
            <button onClick={() => setActiveTab("view")} className={`w-full text-left p-3 rounded transition ${activeTab === "view" ? "bg-blue-100 text-blue-900 font-bold" : "hover:bg-gray-100"}`}>📄 View Exams</button>
            <hr className="my-4 border-gray-200"/>
             <button onClick={handleClearDatabase} className="w-full text-left p-3 rounded text-red-600 hover:bg-red-50 font-bold border border-red-200 text-sm">⚠️ Clear Database</button>
          </div>
        </aside>

        <main className="flex-1 p-8 ml-0 md:ml-64 overflow-y-auto min-h-[calc(100vh-64px)]">
          {activeTab === "add" && (
            <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto border-t-4 border-blue-900">
              <h2 className="text-2xl font-bold mb-6 text-blue-900">Add New Question</h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <select className="border p-2 rounded" value={qData.subject} onChange={(e) => setQData({...qData, subject: e.target.value})}>
                  <option value="DBMS">DBMS</option><option value="Operating System">Operating System</option><option value="Computer Networks">Computer Networks</option><option value="Algorithms">Algorithms</option>
                </select>
                <select className="border p-2 rounded" value={qData.difficulty} onChange={(e) => setQData({...qData, difficulty: e.target.value})}>
                  <option>Easy</option><option>Medium</option><option>Hard</option>
                </select>
              </div>
              <textarea placeholder="Enter Question Text" className="w-full border p-2 rounded mb-4 h-24" value={qData.questionText} onChange={(e) => setQData({...qData, questionText: e.target.value})}></textarea>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <input placeholder="Option A" className="border p-2 rounded" value={qData.option1} onChange={(e) => setQData({...qData, option1: e.target.value})} />
                <input placeholder="Option B" className="border p-2 rounded" value={qData.option2} onChange={(e) => setQData({...qData, option2: e.target.value})} />
                <input placeholder="Option C" className="border p-2 rounded" value={qData.option3} onChange={(e) => setQData({...qData, option3: e.target.value})} />
                <input placeholder="Option D" className="border p-2 rounded" value={qData.option4} onChange={(e) => setQData({...qData, option4: e.target.value})} />
              </div>
              <input placeholder="Correct Answer" className="w-full border p-2 rounded mb-6 bg-green-50" value={qData.correctAnswer} onChange={(e) => setQData({...qData, correctAnswer: e.target.value})} />
              <button onClick={handleAddQuestion} className="w-full bg-blue-900 text-white py-3 rounded font-bold hover:bg-blue-800">Save Question</button>
            </div>
          )}

          {activeTab === "upload" && (
            <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto border-t-4 border-green-900">
                <h2 className="text-2xl font-bold mb-6 text-green-900">Upload Excel File</h2>
                <input type="file" accept=".xlsx, .xls" className="w-full border p-3 rounded mb-6" onChange={(e) => setFile(e.target.files[0])} />
                <button onClick={handleFileUpload} className="w-full bg-green-900 text-white py-3 rounded font-bold hover:bg-green-800">Upload Questions</button>
            </div>
          )}

          {activeTab === "generate" && (
            <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto border-t-4 border-blue-600">
                <h2 className="text-2xl font-bold mb-4 text-blue-900">Auto-Generate Exam</h2>
                <div className="mb-6 grid grid-cols-2 gap-4">
                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Exam Title</label><input placeholder="e.g. Mid-Term 2024" className="w-full border p-2 rounded" onChange={(e) => setGData({...gData, title: e.target.value})} /></div>
                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Subject</label><select className="w-full border p-2 rounded" onChange={(e) => setGData({...gData, subject: e.target.value})}><option value="DBMS">DBMS</option><option value="Operating System">Operating System</option><option value="Computer Networks">Computer Networks</option><option value="Algorithms">Algorithms</option></select></div>
                </div>

                {/* --- TIME DURATION INPUT --- */}
                <div className="mb-6 bg-yellow-50 p-3 rounded border border-yellow-200">
                    <label className="block text-sm font-bold text-yellow-800 mb-1">⏱️ Time Limit (Minutes)</label>
                    <input 
                        type="number" 
                        placeholder="e.g. 30 (Leave 0 for Untimed)" 
                        className="w-full border p-2 rounded focus:ring-2 focus:ring-yellow-400 outline-none" 
                        onChange={(e) => setGData({...gData, duration: e.target.value})} 
                    />
                    <p className="text-xs text-yellow-600 mt-1">If set to 0, the exam will have no time limit.</p>
                </div>
                {/* --------------------------- */}

                <div className="mb-6"><label className="block text-sm font-bold text-gray-700 mb-2">Select Paper Pattern:</label><div className="grid grid-cols-3 gap-2">
                    <button onClick={() => setGData({...gData, paperType: "mcq_only"})} className={`p-2 rounded border text-sm font-bold ${gData.paperType === "mcq_only" ? "bg-blue-600 text-white border-blue-600" : "bg-gray-50 text-gray-600"}`}>🔵 MCQ Only</button>
                    <button onClick={() => setGData({...gData, paperType: "subjective_only"})} className={`p-2 rounded border text-sm font-bold ${gData.paperType === "subjective_only" ? "bg-orange-50 text-white border-orange-500 bg-orange-500" : "bg-gray-50 text-gray-600"}`}>🟠 Subjective Only</button>
                    <button onClick={() => setGData({...gData, paperType: "mixed"})} className={`p-2 rounded border text-sm font-bold ${gData.paperType === "mixed" ? "bg-purple-600 text-white border-purple-600" : "bg-gray-50 text-gray-600"}`}>🟣 Mixed Paper</button>
                </div></div>
                {gData.paperType === "mcq_only" && (<div className="bg-blue-50 p-4 rounded border border-blue-100 mb-6"><div className="grid grid-cols-3 gap-4"><div><label className="text-xs font-bold">Easy</label><input type="number" className="w-full border p-2 rounded" onChange={(e) => setGData({...gData, easyCount: e.target.value})} /></div><div><label className="text-xs font-bold">Medium</label><input type="number" className="w-full border p-2 rounded" onChange={(e) => setGData({...gData, mediumCount: e.target.value})} /></div><div><label className="text-xs font-bold">Hard</label><input type="number" className="w-full border p-2 rounded" onChange={(e) => setGData({...gData, hardCount: e.target.value})} /></div></div></div>)}
                {gData.paperType === "subjective_only" && (<div className="bg-orange-50 p-4 rounded border border-orange-100 mb-6"><div className="grid grid-cols-2 gap-4"><div><label className="text-xs font-bold">Short</label><input type="number" className="w-full border p-2 rounded" onChange={(e) => setGData({...gData, shortCount: e.target.value})} /></div><div><label className="text-xs font-bold">Long</label><input type="number" className="w-full border p-2 rounded" onChange={(e) => setGData({...gData, longCount: e.target.value})} /></div></div></div>)}
                {gData.paperType === "mixed" && (<div className="bg-purple-50 p-4 rounded border border-purple-100 mb-6"><div className="grid grid-cols-3 gap-4"><div><label className="text-xs font-bold">MCQ</label><input type="number" className="w-full border p-2 rounded" onChange={(e) => setGData({...gData, mcqCount: e.target.value})} /></div><div><label className="text-xs font-bold">Short</label><input type="number" className="w-full border p-2 rounded" onChange={(e) => setGData({...gData, shortCount: e.target.value})} /></div><div><label className="text-xs font-bold">Long</label><input type="number" className="w-full border p-2 rounded" onChange={(e) => setGData({...gData, longCount: e.target.value})} /></div></div></div>)}
                <button onClick={handleGenerate} className="w-full bg-blue-900 text-white py-3 rounded font-bold hover:bg-blue-800 shadow-lg">⚡ Generate Paper</button>
            </div>
          )}
          
           {activeTab === "view" && (
             <div className="grid gap-4 pb-20">
                 {exams.map((exam) => (
                     <div key={exam._id} className="bg-white p-4 rounded shadow border-l-4 border-blue-900 flex justify-between items-center gap-4">
                         <div className="flex-1">
                            <h3 className="font-bold text-lg text-gray-800">{exam.title}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-bold uppercase">{exam.subject}</span>
                                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-bold">
                                    {exam.duration ? `⏱️ ${exam.duration} mins` : "⏱️ Untimed"}
                                </span>
                            </div>
                         </div>
                         <div className="flex items-center gap-2">
                            <button onClick={() => navigate(`/admin/view-exam/${exam._id}`)} className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm font-bold">View</button>
                            <button onClick={() => navigate(`/admin/check-paper/${exam._id}`)} className="bg-yellow-500 text-white px-3 py-1.5 rounded text-sm font-bold">Results</button>
                            <button onClick={() => handleDeleteExam(exam._id)} className="bg-red-500 text-white px-3 py-1.5 rounded text-sm font-bold">Delete</button>
                            {!exam.isPublished && <button onClick={async () => { if(confirm("Publish?")) { await fetch(`${API_BASE}/publish/${exam._id}`, { method: "PUT" }); fetchExams(); } }} className="bg-green-600 text-white px-3 py-1.5 rounded text-sm font-bold">Publish</button>}
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