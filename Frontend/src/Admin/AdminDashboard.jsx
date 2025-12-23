import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("add");
  const API_BASE = "http://localhost:5000/api/admin";

  // --- STATES (Preserved) ---
  const [qData, setQData] = useState({
    questionText: "", subject: "DBMS", difficulty: "Easy",
    option1: "", option2: "", option3: "", option4: "", correctAnswer: ""
  });
  const [file, setFile] = useState(null);
  const [gData, setGData] = useState({
    title: "", subject: "DBMS", paperType: "mcq_only", duration: 0,
    easyCount: 0, mediumCount: 0, hardCount: 0,
    mcqCount: 0, shortCount: 0, longCount: 0
  });

  const [exams, setExams] = useState([]);

  // --- HANDLERS (Preserved) ---
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
      duration: Number(gData.duration) || 0,
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
    if (!window.confirm("⚠️ Are you sure? This will delete the Exam structure. \n\n(Questions remain safely in your Question Bank)")) return;
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

  useEffect(() => { if (activeTab === 'view') fetchExams(); }, [activeTab]);

  // --- UI COMPONENTS ---
  // Reusable themed input class
  const inputClass = "w-full p-3 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-500/20 focus:border-stone-500 transition-all shadow-sm";
  const labelClass = "block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2";

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col relative font-sans text-stone-800">

      {/* Navbar */}
      <nav className="bg-stone-900 text-amber-50 px-6 py-4 shadow-lg flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-100 rounded text-stone-900 flex items-center justify-center font-bold font-serif italic text-lg">A</div>
          <h1 className="text-xl font-bold font-serif italic tracking-wide">Admin Dashboard</h1>
        </div>
        <button onClick={() => navigate("/")} className="bg-red-500/20 border border-red-500/30 text-red-200 px-5 py-2 rounded-lg hover:bg-red-500 hover:text-white transition-all font-bold text-sm uppercase tracking-wider">
          Logout
        </button>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 bg-white border-r border-stone-200 hidden md:flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] h-[calc(100vh-64px)] overflow-y-auto">
          <div className="p-6 space-y-3">
            <p className="px-4 text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Management</p>
            {[
              { id: "add", label: "Add Question", icon: "+" },
              { id: "upload", label: "Bulk Upload", icon: "📂" },
              { id: "generate", label: "Generate Exam", icon: "⚡" },
              { id: "view", label: "View Exams", icon: "📄" },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-5 py-3.5 rounded-xl transition-all duration-300 flex items-center gap-3 font-medium ${activeTab === tab.id
                  ? "bg-stone-900 text-white shadow-lg shadow-stone-900/20 translate-x-1"
                  : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                  }`}
              >
                <span className="opacity-70">{tab.icon}</span> {tab.label}
              </button>
            ))}

            <div className="pt-6 mt-6 border-t border-stone-100">
              <p className="px-4 text-xs font-bold text-red-400 uppercase tracking-widest mb-2">Danger Zone</p>
              <button onClick={handleClearDatabase} className="w-full text-left px-5 py-3 rounded-xl text-red-600 hover:bg-red-50 font-bold border border-red-100/50 hover:border-red-200 transition-all text-sm flex items-center gap-2">
                <span>⚠️</span> Clear Database
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-10 overflow-y-auto h-[calc(100vh-64px)] scroll-smooth">

          <div className="max-w-4xl mx-auto animate-fade-in">
            {/* Header Description */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-stone-900 font-serif italic mb-2">
                {activeTab === 'add' && 'Create New Question'}
                {activeTab === 'upload' && 'Bulk Import'}
                {activeTab === 'generate' && 'Exam Generator'}
                {activeTab === 'view' && 'Exam Repository'}
              </h2>
              <p className="text-stone-500">
                {activeTab === 'add' && 'Manually input individual questions into the bank.'}
                {activeTab === 'upload' && 'Upload Excel sheets to populte the question bank quickly.'}
                {activeTab === 'generate' && 'Configure and auto-generate balanced exam papers.'}
                {activeTab === 'view' && 'Manage and review detailed status of generated exams.'}
              </p>
            </div>

            {/* TABS CONTENT */}

            {/* 1. Add Question */}
            {activeTab === "add" && (
              <div className="bg-white p-8 rounded-3xl shadow-xl shadow-stone-200/50 border border-white">
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className={labelClass}>Subject</label>
                    <select className={inputClass} value={qData.subject} onChange={(e) => setQData({ ...qData, subject: e.target.value })}>
                      <option value="DBMS">DBMS</option><option value="Operating System">Operating System</option><option value="Computer Networks">Computer Networks</option><option value="Algorithms">Algorithms</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Difficulty</label>
                    <select className={inputClass} value={qData.difficulty} onChange={(e) => setQData({ ...qData, difficulty: e.target.value })}>
                      <option>Easy</option><option>Medium</option><option>Hard</option>
                    </select>
                  </div>
                </div>

                <div className="mb-6">
                  <label className={labelClass}>Question Text</label>
                  <textarea placeholder="Type your question here..." className={`${inputClass} h-32 resize-none`} value={qData.questionText} onChange={(e) => setQData({ ...qData, questionText: e.target.value })}></textarea>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6">
                  {['option1', 'option2', 'option3', 'option4'].map((opt, i) => (
                    <div key={opt}>
                      <label className="text-xs text-stone-400 font-bold mb-1 block">Option {String.fromCharCode(65 + i)}</label>
                      <input placeholder={`Option ${String.fromCharCode(65 + i)}`} className={inputClass} value={qData[opt]} onChange={(e) => setQData({ ...qData, [opt]: e.target.value })} />
                    </div>
                  ))}
                </div>

                <div className="mb-8">
                  <label className={labelClass}>Correct Answer</label>
                  <input placeholder="Exact text of correct option" className={`${inputClass} bg-green-50/50 border-green-200 focus:ring-green-500/20`} value={qData.correctAnswer} onChange={(e) => setQData({ ...qData, correctAnswer: e.target.value })} />
                </div>

                <button onClick={handleAddQuestion} className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold font-serif italic text-lg hover:bg-stone-800 shadow-lg shadow-stone-900/20 transition-all active:scale-[0.99]">
                  Save Question Button
                </button>
              </div>
            )}

            {/* 2. Upload */}
            {activeTab === "upload" && (
              <div className="bg-white p-10 rounded-3xl shadow-xl shadow-stone-200/50 border border-white text-center">
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">📂</div>
                <h3 className="text-xl font-bold text-emerald-900 mb-2">Upload Excel File</h3>
                <p className="text-stone-500 mb-8 max-w-sm mx-auto">Supports .xlsx and .xls formats. Ensure columns match the template format.</p>

                <div className="max-w-md mx-auto relative border-2 border-dashed border-stone-300 rounded-2xl p-8 hover:bg-stone-50 transition-colors cursor-pointer group">
                  <input type="file" accept=".xlsx, .xls" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => setFile(e.target.files[0])} />
                  <p className="text-stone-600 font-medium group-hover:text-stone-900 transition-colors">
                    {file ? file.name : "Click to browse files"}
                  </p>
                </div>

                <button onClick={handleFileUpload} className="mt-8 px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all">
                  Start Upload
                </button>
              </div>
            )}

            {/* 3. Generate Exam */}
            {activeTab === "generate" && (
              <div className="bg-white p-8 rounded-3xl shadow-xl shadow-stone-200/50 border border-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div><label className={labelClass}>Exam Title</label><input placeholder="e.g. Final Semester Exam" className={inputClass} onChange={(e) => setGData({ ...gData, title: e.target.value })} /></div>
                  <div>
                    <label className={labelClass}>Subject</label>
                    <select className={inputClass} onChange={(e) => setGData({ ...gData, subject: e.target.value })}>
                      <option value="DBMS">DBMS</option><option value="Operating System">Operating System</option><option value="Computer Networks">Computer Networks</option><option value="Algorithms">Algorithms</option>
                    </select>
                  </div>
                </div>

                {/* Time Duration */}
                <div className="mb-8 bg-amber-50 p-6 rounded-2xl border border-amber-100">
                  <label className="block text-sm font-bold text-amber-900 mb-2 font-serif italic">⏱️ Time Duration (Minutes)</label>
                  <input
                    type="number"
                    placeholder="e.g. 30 (0 for Untimed)"
                    className="w-full border-none p-3 rounded-xl bg-white focus:ring-2 focus:ring-amber-400 outline-none shadow-sm text-amber-900 font-bold"
                    onChange={(e) => setGData({ ...gData, duration: e.target.value })}
                  />
                  <p className="text-xs text-amber-700/70 mt-2 font-medium">Leave as 0 for no time limit.</p>
                </div>

                <div className="mb-8">
                  <label className={labelClass}>Pattern Selection</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'mcq_only', label: 'MCQ Only', color: 'bg-blue-600 border-blue-600' },
                      { id: 'subjective_only', label: 'Subjective', color: 'bg-orange-500 border-orange-500' },
                      { id: 'mixed', label: 'Mixed Mode', color: 'bg-purple-600 border-purple-600' },
                    ].map(type => (
                      <button
                        key={type.id}
                        onClick={() => setGData({ ...gData, paperType: type.id })}
                        className={`p-4 rounded-xl border-2 text-sm font-bold transition-all ${gData.paperType === type.id
                          ? `${type.color} text-white shadow-md transform scale-[1.02]`
                          : "bg-white border-stone-200 text-stone-500 hover:bg-stone-50"
                          }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dynamic Inputs based on type */}
                <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 mb-8">
                  <p className="text-xs font-bold text-stone-400 uppercase mb-4">Question Distribution</p>
                  <div className="grid grid-cols-3 gap-4">
                    {gData.paperType === "mcq_only" && (
                      <>
                        <div><label className="text-xs font-bold mb-1 block">Easy</label><input type="number" className={inputClass} onChange={(e) => setGData({ ...gData, easyCount: e.target.value })} /></div>
                        <div><label className="text-xs font-bold mb-1 block">Medium</label><input type="number" className={inputClass} onChange={(e) => setGData({ ...gData, mediumCount: e.target.value })} /></div>
                        <div><label className="text-xs font-bold mb-1 block">Hard</label><input type="number" className={inputClass} onChange={(e) => setGData({ ...gData, hardCount: e.target.value })} /></div>
                      </>
                    )}
                    {gData.paperType === "subjective_only" && (
                      <>
                        <div className="col-span-1.5"><label className="text-xs font-bold mb-1 block">Short Answer</label><input type="number" className={inputClass} onChange={(e) => setGData({ ...gData, shortCount: e.target.value })} /></div>
                        <div className="col-span-1.5"><label className="text-xs font-bold mb-1 block">Long Answer</label><input type="number" className={inputClass} onChange={(e) => setGData({ ...gData, longCount: e.target.value })} /></div>
                      </>
                    )}
                    {gData.paperType === "mixed" && (
                      <>
                        <div><label className="text-xs font-bold mb-1 block">MCQ</label><input type="number" className={inputClass} onChange={(e) => setGData({ ...gData, mcqCount: e.target.value })} /></div>
                        <div><label className="text-xs font-bold mb-1 block">Short</label><input type="number" className={inputClass} onChange={(e) => setGData({ ...gData, shortCount: e.target.value })} /></div>
                        <div><label className="text-xs font-bold mb-1 block">Long</label><input type="number" className={inputClass} onChange={(e) => setGData({ ...gData, longCount: e.target.value })} /></div>
                      </>
                    )}
                  </div>
                </div>

                <button onClick={handleGenerate} className="w-full bg-gradient-to-r from-stone-900 to-stone-800 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl hover:shadow-stone-900/20 transition-all active:scale-[0.99]">
                  ⚡ Generate Paper
                </button>
              </div>
            )}

            {/* 4. View Exams */}
            {activeTab === "view" && (
              <div className="space-y-4 pb-20">
                {exams.map((exam) => (
                  <div key={exam._id} className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 hover:shadow-md transition-shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group">
                    <div>
                      <h3 className="font-bold text-xl text-stone-800 font-serif italic group-hover:text-amber-700 transition-colors">{exam.title}</h3>
                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        <span className="text-xs bg-stone-100 text-stone-600 px-3 py-1 rounded-full font-bold uppercase tracking-wide border border-stone-200">{exam.subject}</span>
                        <span className="text-xs bg-amber-50 text-amber-800 px-3 py-1 rounded-full font-bold border border-amber-100">
                          {exam.duration ? `⏱️ ${exam.duration} mins` : "⏱️ Untimed"}
                        </span>
                        {exam.isPublished ? (
                          <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded font-bold">Published</span>
                        ) : (
                          <span className="text-xs bg-stone-50 text-stone-400 px-2 py-1 rounded font-bold">Draft</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <button onClick={() => navigate(`/admin/view-exam/${exam._id}`)} className="flex-1 md:flex-none bg-stone-100 text-stone-700 hover:bg-stone-200 px-4 py-2 rounded-lg text-sm font-bold transition-colors">View</button>
                      <button onClick={() => navigate(`/admin/check-paper/${exam._id}`)} className="flex-1 md:flex-none bg-amber-100 text-amber-800 hover:bg-amber-200 px-4 py-2 rounded-lg text-sm font-bold transition-colors">Results</button>

                      {!exam.isPublished && (
                        <button
                          onClick={async () => { if (confirm("Publish this exam for students to see?")) { await fetch(`${API_BASE}/publish/${exam._id}`, { method: "PUT" }); fetchExams(); } }}
                          className="flex-1 md:flex-none bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-bold shadow-green-200 shadow-md transition-all"
                        >
                          Publish
                        </button>
                      )}

                      <button onClick={() => handleDeleteExam(exam._id)} className="flex-1 md:flex-none p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete Exam">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}

                {exams.length === 0 && (
                  <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-stone-200">
                    <p className="text-stone-400 font-bold text-lg">No exams found.</p>
                    <button onClick={() => setActiveTab('generate')} className="text-amber-600 hover:text-amber-700 font-bold mt-2 hover:underline">Create One Now</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}