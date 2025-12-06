import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("add"); 
  
  // --- STATES ---
  const [qData, setQData] = useState({
    questionText: "", 
    subject: "DBMS", 
    difficulty: "Easy", 
    option1: "", option2: "", option3: "", option4: "", correctAnswer: ""
  });

  const [file, setFile] = useState(null);

  const [gData, setGData] = useState({
    title: "", 
    subject: "DBMS", 
    easyCount: 0, mediumCount: 0, hardCount: 0
  });

  const [exams, setExams] = useState([]);

  // --- HANDLERS ---

  const handleAddQuestion = async () => {
    const payload = {
      ...qData,
      options: [qData.option1, qData.option2, qData.option3, qData.option4]
    };
    
    try {
      const res = await fetch("/api/admin/add-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (res.ok) alert("Question Added!");
      else alert("Failed to add question");
    } catch (err) {
      alert("Server Error");
    }
  };

  const handleFileUpload = async () => {
    if (!file) return alert("Please select a file first");
    const formData = new FormData();
    formData.append("file", file);
  
    try {
      const res = await fetch("/api/admin/upload-questions", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setFile(null);
      } else {
        alert("Upload Failed: " + data.message);
      }
    } catch (error) {
      alert("Server Error during upload");
    }
  };

  const handleGenerate = async () => {
    if (!gData.title) return alert("Please enter an Exam Title");

    try {
      const res = await fetch("/api/admin/generate-paper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gData),
      });
      const data = await res.json();
      if (res.ok) alert(`Success! Exam created with ${data.totalQuestions} questions.`);
      else alert(data.message);
    } catch (err) {
      alert("Server Error");
    }
  };

  const fetchExams = async () => {
      try {
        const res = await fetch("/api/admin/get-exams");
        const data = await res.json();
        setExams(data);
      } catch (err) {
        console.error("Error fetching exams");
      }
  };

  useEffect(() => {
      if(activeTab === 'view') fetchExams();
  }, [activeTab]);


  return (
    <div className="min-h-screen bg-gray-100 flex flex-col relative">
      {/* Navbar */}
      <nav className="bg-blue-900 text-white p-4 shadow-md flex justify-between items-center">
        <h1 className="text-xl font-bold">Admin Dashboard</h1>
        <button onClick={() => navigate("/")} className="bg-red-500 px-4 py-2 rounded hover:bg-red-600">Logout</button>
      </nav>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-lg hidden md:block">
          <div className="p-4 space-y-2">
            <button onClick={() => setActiveTab("add")} className={`w-full text-left p-3 rounded transition ${activeTab === "add" ? "bg-blue-100 text-blue-900 font-bold" : "hover:bg-gray-100"}`}>
              + Add Single Question
            </button>
            <button onClick={() => setActiveTab("upload")} className={`w-full text-left p-3 rounded transition ${activeTab === "upload" ? "bg-blue-100 text-blue-900 font-bold" : "hover:bg-gray-100"}`}>
              📂 Bulk Upload (Excel)
            </button>
            <button onClick={() => setActiveTab("generate")} className={`w-full text-left p-3 rounded transition ${activeTab === "generate" ? "bg-blue-100 text-blue-900 font-bold" : "hover:bg-gray-100"}`}>
              ⚡ Generate Paper
            </button>
             <button onClick={() => setActiveTab("view")} className={`w-full text-left p-3 rounded transition ${activeTab === "view" ? "bg-blue-100 text-blue-900 font-bold" : "hover:bg-gray-100"}`}>
              📄 View Created Exams
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          
          {/* 1. ADD QUESTION */}
          {activeTab === "add" && (
            <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto border-t-4 border-blue-900">
              <h2 className="text-2xl font-bold mb-6 text-blue-900">Add New Question</h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                
                {/* --- UPDATED DROPDOWN (Manual Add) --- */}
                <select className="border p-2 rounded" value={qData.subject} onChange={(e) => setQData({...qData, subject: e.target.value})}>
                  <option value="DBMS">DBMS</option>
                  <option value="Operating System">Operating System</option>
                  <option value="Computer Networks">Computer Networks</option>
                  <option value="Algorithms">Algorithms</option>
                  <option value="Digital Logic">Digital Logic</option>
                </select>

                <select className="border p-2 rounded" value={qData.difficulty} onChange={(e) => setQData({...qData, difficulty: e.target.value})}>
                  <option>Easy</option><option>Medium</option><option>Hard</option>
                </select>
              </div>
              <textarea placeholder="Enter Question Text" className="w-full border p-2 rounded mb-4 h-24" onChange={(e) => setQData({...qData, questionText: e.target.value})}></textarea>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <input placeholder="Option A" className="border p-2 rounded" onChange={(e) => setQData({...qData, option1: e.target.value})} />
                <input placeholder="Option B" className="border p-2 rounded" onChange={(e) => setQData({...qData, option2: e.target.value})} />
                <input placeholder="Option C" className="border p-2 rounded" onChange={(e) => setQData({...qData, option3: e.target.value})} />
                <input placeholder="Option D" className="border p-2 rounded" onChange={(e) => setQData({...qData, option4: e.target.value})} />
              </div>
              <input placeholder="Correct Answer" className="w-full border p-2 rounded mb-6 bg-green-50" onChange={(e) => setQData({...qData, correctAnswer: e.target.value})} />
              <button onClick={handleAddQuestion} className="w-full bg-blue-900 text-white py-3 rounded font-bold hover:bg-blue-800">Save Question</button>
            </div>
          )}

          {/* 2. BULK UPLOAD */}
          {activeTab === "upload" && (
            <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto border-t-4 border-green-900">
                <h2 className="text-2xl font-bold mb-6 text-green-900">Upload Excel File</h2>
                <div className="bg-yellow-50 p-4 rounded mb-6 text-sm text-yellow-800 border border-yellow-200">
                  Headers required: <code>Question, Subject, Difficulty, OptionA, OptionB, OptionC, OptionD, CorrectAnswer</code>
                </div>
                <input type="file" accept=".xlsx, .xls" className="w-full border p-3 rounded mb-6" onChange={(e) => setFile(e.target.files[0])} />
                <button onClick={handleFileUpload} className="w-full bg-green-900 text-white py-3 rounded font-bold hover:bg-green-800">Upload Questions</button>
            </div>
          )}

          {/* 3. GENERATE PAPER */}
          {activeTab === "generate" && (
            <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto border-t-4 border-purple-900">
              <h2 className="text-2xl font-bold mb-6 text-purple-900">Auto-Generate Exam</h2>
              <input placeholder="Exam Title (e.g., Mid-Term DBMS)" className="w-full border p-2 rounded mb-4" onChange={(e) => setGData({...gData, title: e.target.value})} />
              
              {/* --- UPDATED DROPDOWN (Generator) --- */}
              <select className="w-full border p-2 rounded mb-6" onChange={(e) => setGData({...gData, subject: e.target.value})}>
                 <option value="DBMS">DBMS</option>
                 <option value="Operating System">Operating System</option>
                 <option value="Computer Networks">Computer Networks</option>
                 <option value="Algorithms">Algorithms</option>
                 <option value="Digital Logic">Digital Logic</option>
              </select>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center bg-green-50 p-3 rounded"><span>Easy</span><input type="number" className="border w-20 p-1" onChange={(e) => setGData({...gData, easyCount: e.target.value})} /></div>
                <div className="flex justify-between items-center bg-yellow-50 p-3 rounded"><span>Medium</span><input type="number" className="border w-20 p-1" onChange={(e) => setGData({...gData, mediumCount: e.target.value})} /></div>
                <div className="flex justify-between items-center bg-red-50 p-3 rounded"><span>Hard</span><input type="number" className="border w-20 p-1" onChange={(e) => setGData({...gData, hardCount: e.target.value})} /></div>
              </div>
              <button onClick={handleGenerate} className="w-full bg-purple-900 text-white py-3 rounded font-bold hover:bg-purple-800">Generate & Publish Exam</button>
            </div>
          )}
          
           {/* 4. VIEW EXAMS */}
           {activeTab === "view" && (
             <div className="grid gap-4">
                 {exams.length === 0 && <p className="text-gray-500">No exams generated yet.</p>}
                 {exams.map((exam) => (
                     <div key={exam._id} className="bg-white p-4 rounded shadow border-l-4 border-blue-900 flex justify-between items-center">
                         <div>
                            <h3 className="font-bold text-lg">{exam.title}</h3>
                            <p className="text-gray-600">Subject: {exam.subject}</p>
                         </div>
                         <div className="flex items-center gap-4">
                            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                                {exam.questions?.length || 0} Questions
                            </span>
                            <button 
                              onClick={() => navigate(`/admin/view-exam/${exam._id}`)}
                              className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm font-bold shadow-sm"
                            >
                              View Full Paper →
                            </button>
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