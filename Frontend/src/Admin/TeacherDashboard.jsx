import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Components/AuthContext";
 
export default function TeacherDashboard({ embeddedMode = false }) {
  const navigate = useNavigate();
  const { auth, clearSession } = useAuth();
  const API_BASE = "/api/teacher";
 
  const [activeTab, setActiveTab] = useState("generate");
  const [file, setFile] = useState(null);
  const [exams, setExams] = useState([]);
 
  const [qData, setQData] = useState({
    questionText: "",
    subject: "DBMS",
    difficulty: "Easy",
    option1: "", option2: "", option3: "", option4: "",
    correctAnswer: "",
  });
 
  const [gData, setGData] = useState({
    title: "",
    subject: "DBMS",
    paperType: "mcq_only",
    duration: 0,
    easyCount: 0,
    mediumCount: 0,
    hardCount: 0,
    mcqCount: 0,
    shortCount: 0,
    longCount: 0,
  });
 
  const authHeaders = () => ({ Authorization: `Bearer ${auth.token}` });
 
  const fetchExams = async () => {
    const res = await fetch(`${API_BASE}/exams`, { headers: authHeaders() });
    if (res.ok) setExams(await res.json());
  };
 
  useEffect(() => {
    if (activeTab === "view") fetchExams();
  }, [activeTab]);
 
  const addQuestion = async () => {
    const payload = {
      questionText: qData.questionText,
      subject: qData.subject,
      difficulty: qData.difficulty,
      correctAnswer: qData.correctAnswer,
      options: [qData.option1, qData.option2, qData.option3, qData.option4].filter(Boolean),
      questionType: "mcq",
    };
    const res = await fetch(`${API_BASE}/add-question`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    alert(data.message || (res.ok ? "Question added" : "Failed"));
  };
 
  const uploadQuestions = async () => {
    if (!file) return alert("Please select a file first");
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/upload-questions`, {
      method: "POST",
      headers: authHeaders(),
      body: formData,
    });
    const data = await res.json();
    alert(data.message || (res.ok ? "Uploaded" : "Upload failed"));
  };
 
  const generateExam = async () => {
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
    const res = await fetch(`${API_BASE}/generate-paper`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    alert(data.message || (res.ok ? "Exam generated" : "Generation failed"));
    if (res.ok) setActiveTab("view");
  };
 
  const publishExam = async (id) => {
    const res = await fetch(`${API_BASE}/publish/${id}`, { method: "PUT", headers: authHeaders() });
    if (res.ok) fetchExams();
  };
 
  const deleteExam = async (id) => {
    if (!confirm("Delete this exam?")) return;
    const res = await fetch(`${API_BASE}/exam/${id}`, { method: "DELETE", headers: authHeaders() });
    if (res.ok) fetchExams();
  };
 
  const subjects = ["DBMS", "OS", "CN", "DSA", "SE", "TOC", "Maths"];
  const tabs = ["add", "upload", "generate", "view"];
 
  // Which count fields to show based on paperType
  const isMCQ = gData.paperType === "mcq_only";
  const isSubjective = gData.paperType === "subjective_only";
  const isMixed = gData.paperType === "mixed";
 
  return (
    <div className={embeddedMode ? "" : "min-h-screen bg-[#FDFBF7] p-6"}>
      <div className={embeddedMode ? "" : "max-w-6xl mx-auto"}>
 
        {!embeddedMode && (
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
              <p className="text-stone-600">Welcome, {auth.name || "Teacher"}</p>
            </div>
            <button
              onClick={() => { clearSession(); navigate("/login"); }}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        )}
 
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded capitalize font-medium ${
                activeTab === tab ? "bg-stone-900 text-white" : "bg-white border text-stone-700 hover:bg-stone-50"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
 
        {/* ── ADD QUESTION ── */}
        {activeTab === "add" && (
          <div className="bg-white p-5 rounded-lg border space-y-3">
            <h2 className="font-semibold text-stone-700">Add MCQ Question</h2>
            <input
              className="w-full border p-2 rounded"
              placeholder="Question text"
              value={qData.questionText}
              onChange={(e) => setQData({ ...qData, questionText: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              <input className="border p-2 rounded" placeholder="Option A" value={qData.option1} onChange={(e) => setQData({ ...qData, option1: e.target.value })} />
              <input className="border p-2 rounded" placeholder="Option B" value={qData.option2} onChange={(e) => setQData({ ...qData, option2: e.target.value })} />
              <input className="border p-2 rounded" placeholder="Option C" value={qData.option3} onChange={(e) => setQData({ ...qData, option3: e.target.value })} />
              <input className="border p-2 rounded" placeholder="Option D" value={qData.option4} onChange={(e) => setQData({ ...qData, option4: e.target.value })} />
            </div>
            <input
              className="w-full border p-2 rounded"
              placeholder="Correct answer (exact text of the correct option)"
              value={qData.correctAnswer}
              onChange={(e) => setQData({ ...qData, correctAnswer: e.target.value })}
            />
            <div className="flex gap-2">
              <select className="border p-2 rounded" value={qData.subject} onChange={(e) => setQData({ ...qData, subject: e.target.value })}>
                {subjects.map(s => <option key={s}>{s}</option>)}
              </select>
              <select className="border p-2 rounded" value={qData.difficulty} onChange={(e) => setQData({ ...qData, difficulty: e.target.value })}>
                <option>Easy</option><option>Medium</option><option>Hard</option>
              </select>
            </div>
            <button onClick={addQuestion} className="px-4 py-2 bg-stone-900 text-white rounded hover:bg-stone-800">
              Save Question
            </button>
          </div>
        )}
 
        {/* ── UPLOAD ── */}
        {activeTab === "upload" && (
          <div className="bg-white p-5 rounded-lg border space-y-3">
            <h2 className="font-semibold text-stone-700">Bulk Upload via Excel</h2>
            <p className="text-sm text-stone-500">
              Excel columns: <code className="bg-stone-100 px-1 rounded">Question, Subject, Difficulty, OptionA, OptionB, OptionC, OptionD, CorrectAnswer, QuestionType</code>
            </p>
            <p className="text-xs text-stone-400">QuestionType values: <code>mcq</code> / <code>short</code> / <code>long</code></p>
            <input type="file" accept=".xlsx,.xls" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <button onClick={uploadQuestions} className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700">
              Upload
            </button>
          </div>
        )}
 
        {/* ── GENERATE ── */}
        {activeTab === "generate" && (
          <div className="bg-white p-5 rounded-lg border space-y-4">
            <h2 className="font-semibold text-stone-700">Generate Exam Paper</h2>
 
            {/* Basic info */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-stone-500 uppercase mb-1 block">Exam Title</label>
                <input
                  className="w-full border p-2 rounded"
                  placeholder="e.g. DBMS Mid-Term 2025"
                  value={gData.title}
                  onChange={(e) => setGData({ ...gData, title: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-500 uppercase mb-1 block">Subject</label>
                <select
                  className="w-full border p-2 rounded"
                  value={gData.subject}
                  onChange={(e) => setGData({ ...gData, subject: e.target.value })}
                >
                  {subjects.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-500 uppercase mb-1 block">Duration (minutes)</label>
                <input
                  type="number" min="0"
                  className="w-full border p-2 rounded"
                  placeholder="e.g. 60"
                  value={gData.duration || ""}
                  onChange={(e) => setGData({ ...gData, duration: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-500 uppercase mb-1 block">Paper Type</label>
                <select
                  className="w-full border p-2 rounded"
                  value={gData.paperType}
                  onChange={(e) => setGData({ ...gData, paperType: e.target.value })}
                >
                  <option value="mcq_only">MCQ Only</option>
                  <option value="subjective_only">Subjective Only (Short + Long)</option>
                  <option value="mixed">Mixed (MCQ + Short + Long)</option>
                </select>
              </div>
            </div>
 
            {/* MCQ difficulty counts — shown for mcq_only and mixed */}
            {(isMCQ || isMixed) && (
              <div>
                <label className="text-xs font-semibold text-stone-500 uppercase mb-2 block">
                  MCQ Question Count by Difficulty
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-stone-400 mb-1 block">Easy</label>
                    <input
                      type="number" min="0"
                      className="w-full border p-2 rounded"
                      placeholder="0"
                      value={gData.easyCount || ""}
                      onChange={(e) => setGData({ ...gData, easyCount: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-stone-400 mb-1 block">Medium</label>
                    <input
                      type="number" min="0"
                      className="w-full border p-2 rounded"
                      placeholder="0"
                      value={gData.mediumCount || ""}
                      onChange={(e) => setGData({ ...gData, mediumCount: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-stone-400 mb-1 block">Hard</label>
                    <input
                      type="number" min="0"
                      className="w-full border p-2 rounded"
                      placeholder="0"
                      value={gData.hardCount || ""}
                      onChange={(e) => setGData({ ...gData, hardCount: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}
 
            {/* Mixed MCQ total — for mixed only */}
            {isMixed && (
              <div>
                <label className="text-xs font-semibold text-stone-500 uppercase mb-1 block">
                  Total MCQ Count (for mixed)
                </label>
                <input
                  type="number" min="0"
                  className="w-full border p-2 rounded max-w-xs"
                  placeholder="0"
                  value={gData.mcqCount || ""}
                  onChange={(e) => setGData({ ...gData, mcqCount: e.target.value })}
                />
              </div>
            )}
 
            {/* Subjective counts — shown for subjective_only and mixed */}
            {(isSubjective || isMixed) && (
              <div>
                <label className="text-xs font-semibold text-stone-500 uppercase mb-2 block">
                  Subjective Question Count
                </label>
                <div className="grid grid-cols-2 gap-3 max-w-sm">
                  <div>
                    <label className="text-xs text-stone-400 mb-1 block">Short answer (2 marks each)</label>
                    <input
                      type="number" min="0"
                      className="w-full border p-2 rounded"
                      placeholder="0"
                      value={gData.shortCount || ""}
                      onChange={(e) => setGData({ ...gData, shortCount: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-stone-400 mb-1 block">Long answer (5 marks each)</label>
                    <input
                      type="number" min="0"
                      className="w-full border p-2 rounded"
                      placeholder="0"
                      value={gData.longCount || ""}
                      onChange={(e) => setGData({ ...gData, longCount: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}
 
            <button
              onClick={generateExam}
              className="px-6 py-2.5 bg-stone-900 text-white rounded hover:bg-stone-800 font-medium"
            >
              Generate Paper
            </button>
          </div>
        )}
 
        {/* ── VIEW EXAMS ── */}
        {activeTab === "view" && (
          <div className="space-y-3">
            {exams.length === 0 && (
              <p className="text-stone-500 text-center py-10">No exams yet. Go to Generate to create one.</p>
            )}
            {exams.map((exam) => (
              <div key={exam._id} className="bg-white p-4 rounded-lg border flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-stone-900">{exam.title}</h3>
                  <p className="text-sm text-stone-500">
                    {exam.subject} &bull; {exam.questions?.length || 0} questions &bull;{" "}
                    {exam.duration ? `${exam.duration} min` : "no time limit"} &bull;{" "}
                    <span className={exam.isPublished ? "text-green-600 font-medium" : "text-amber-600 font-medium"}>
                      {exam.isPublished ? "Published" : "Draft"}
                    </span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => navigate(`/teacher/view-exam/${exam._id}`)} className="px-3 py-1 bg-stone-100 rounded text-sm hover:bg-stone-200">View</button>
                  <button onClick={() => navigate(`/teacher/check-paper/${exam._id}`)} className="px-3 py-1 bg-amber-100 text-amber-800 rounded text-sm hover:bg-amber-200">Grade</button>
                  {!exam.isPublished && (
                    <button onClick={() => publishExam(exam._id)} className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">Publish</button>
                  )}
                  <button onClick={() => deleteExam(exam._id)} className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
 
      </div>
    </div>
  );
}