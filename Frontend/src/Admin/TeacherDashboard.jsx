import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Components/AuthContext";
import { apiFetch } from "../api";
import { useToast } from "../Components/Toast";
import { useConfirm } from "../Components/ConfirmDialog";
import Pagination from "../Components/Pagination";
import { CardSkeleton } from "../Components/LoadingSkeleton";

const EXAM_LIMIT = 6;
const API_BASE = "/api/teacher";

export default function TeacherDashboard({ embeddedMode = false }) {
  const navigate = useNavigate();
  const { auth, clearSession } = useAuth();
  const { success, error: toastError } = useToast();
  const confirmDialog = useConfirm();

  const [activeTab, setActiveTab] = useState("generate");
  const [file, setFile] = useState(null);

  // Exam list + cursor-pagination state (see cursorStack in ManageUsers.jsx
  // for the same pattern)
  const [exams, setExams] = useState([]);
  const [examTotal, setExamTotal] = useState(0);
  const [examHasMore, setExamHasMore] = useState(false);
  const [examCursorStack, setExamCursorStack] = useState([null]);
  const [examPageIndex, setExamPageIndex] = useState(0);
  const examPage = examPageIndex + 1;
  const [examLoading, setExamLoading] = useState(false);
  const [examSearch, setExamSearch] = useState("");
  const [examSearchInput, setExamSearchInput] = useState("");

  const [qData, setQData] = useState({
    questionText: "", subject: "DBMS", difficulty: "Easy",
    option1: "", option2: "", option3: "", option4: "", correctAnswer: "",
  });

  const [gData, setGData] = useState({
    title: "", subject: "DBMS", paperType: "mcq_only", duration: 0,
    easyCount: 0, mediumCount: 0, hardCount: 0,
    mcqCount: 0, shortCount: 0, longCount: 0,
  });

  const fetchExams = useCallback(async () => {
    setExamLoading(true);
    const cursor = examCursorStack[examPageIndex];
    const params = new URLSearchParams({
      limit: EXAM_LIMIT,
      ...(cursor && { cursor }),
      ...(examSearch && { search: examSearch }),
    });
    const res = await apiFetch(`${API_BASE}/exams?${params}`);
    if (res.ok) {
      const data = await res.json();
      setExams(data.exams);
      setExamTotal(data.total);
      setExamHasMore(data.hasMore);
      if (data.hasMore && examCursorStack.length === examPageIndex + 1) {
        setExamCursorStack((prev) => [...prev, data.nextCursor]);
      }
    }
    setExamLoading(false);
  }, [examPageIndex, examCursorStack, examSearch]);

  useEffect(() => {
    if (activeTab === "view") fetchExams();
  }, [activeTab, fetchExams]);

  const resetExamPaging = () => { setExamCursorStack([null]); setExamPageIndex(0); };

  const applyExamSearch = () => {
    setExamSearch(examSearchInput.trim());
    resetExamPaging();
  };

  const goExamPrev = () => setExamPageIndex((i) => Math.max(0, i - 1));
  const goExamNext = () => { if (examHasMore) setExamPageIndex((i) => i + 1); };

  const addQuestion = async () => {
    const payload = {
      questionText: qData.questionText, subject: qData.subject,
      difficulty: qData.difficulty, correctAnswer: qData.correctAnswer,
      options: [qData.option1, qData.option2, qData.option3, qData.option4].filter(Boolean),
      questionType: "mcq",
    };
    const res = await apiFetch(`${API_BASE}/add-question`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (res.ok) success(data.message || "Question added");
    else toastError(data.message || "Failed");
  };

  const uploadQuestions = async () => {
    if (!file) return toastError("Please select a file first");
    const formData = new FormData();
    formData.append("file", file);
    const res = await apiFetch(`${API_BASE}/upload-questions`, {
      method: "POST", body: formData,
    });
    const data = await res.json();
    if (res.ok) success(data.message || "Uploaded");
    else toastError(data.message || "Upload failed");
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
    const res = await apiFetch(`${API_BASE}/generate-paper`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (res.ok) {
      success(data.message || "Exam generated");
      setActiveTab("view");
      resetExamPaging();
    } else {
      toastError(data.message || "Failed");
    }
  };

  const publishExam = async (id) => {
    const res = await apiFetch(`${API_BASE}/publish/${id}`, { method: "PUT" });
    if (res.ok) fetchExams();
  };

  const deleteExam = async (id) => {
    const ok = await confirmDialog("Delete this exam? Questions stay in your question bank.", { title: "Delete exam", danger: true, confirmLabel: "Delete" });
    if (!ok) return;
    const res = await apiFetch(`${API_BASE}/exam/${id}`, { method: "DELETE" });
    if (res.ok) {
      if (exams.length === 1 && examPageIndex > 0) goExamPrev();
      else fetchExams();
    }
  };

  const subjects = ["DBMS", "OS", "CN", "DSA", "SE", "TOC", "Maths"];
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
            <button onClick={() => { clearSession(); navigate("/login"); }}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
              Logout
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {["add", "upload", "generate", "view"].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded capitalize font-medium ${
                activeTab === tab ? "bg-stone-900 text-white" : "bg-white border text-stone-700 hover:bg-stone-50"
              }`}>
              {tab}
            </button>
          ))}
        </div>

        {/* ADD QUESTION */}
        {activeTab === "add" && (
          <div className="bg-white p-5 rounded-lg border space-y-3">
            <h2 className="font-semibold text-stone-700">Add MCQ Question</h2>
            <input className="w-full border p-2 rounded" placeholder="Question text"
              value={qData.questionText} onChange={(e) => setQData({ ...qData, questionText: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <input className="border p-2 rounded" placeholder="Option A" value={qData.option1} onChange={(e) => setQData({ ...qData, option1: e.target.value })} />
              <input className="border p-2 rounded" placeholder="Option B" value={qData.option2} onChange={(e) => setQData({ ...qData, option2: e.target.value })} />
              <input className="border p-2 rounded" placeholder="Option C" value={qData.option3} onChange={(e) => setQData({ ...qData, option3: e.target.value })} />
              <input className="border p-2 rounded" placeholder="Option D" value={qData.option4} onChange={(e) => setQData({ ...qData, option4: e.target.value })} />
            </div>
            <input className="w-full border p-2 rounded" placeholder="Correct answer text"
              value={qData.correctAnswer} onChange={(e) => setQData({ ...qData, correctAnswer: e.target.value })} />
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

        {/* UPLOAD */}
        {activeTab === "upload" && (
          <div className="bg-white p-5 rounded-lg border space-y-3">
            <h2 className="font-semibold text-stone-700">Bulk Upload via Excel</h2>
            <p className="text-sm text-stone-500">
              Columns: <code className="bg-stone-100 px-1 rounded">Question, Subject, Difficulty, OptionA–D, CorrectAnswer, QuestionType</code>
            </p>
            <input type="file" accept=".xlsx,.xls" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <button onClick={uploadQuestions} className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700">
              Upload
            </button>
          </div>
        )}

        {/* GENERATE */}
        {activeTab === "generate" && (
          <div className="bg-white p-5 rounded-lg border space-y-4">
            <h2 className="font-semibold text-stone-700">Generate Exam Paper</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-stone-500 uppercase mb-1 block">Exam Title</label>
                <input className="w-full border p-2 rounded" placeholder="e.g. DBMS Mid-Term"
                  value={gData.title} onChange={(e) => setGData({ ...gData, title: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-500 uppercase mb-1 block">Subject</label>
                <select className="w-full border p-2 rounded" value={gData.subject}
                  onChange={(e) => setGData({ ...gData, subject: e.target.value })}>
                  {subjects.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-500 uppercase mb-1 block">Duration (minutes)</label>
                <input type="number" min="0" className="w-full border p-2 rounded" placeholder="e.g. 60"
                  value={gData.duration || ""} onChange={(e) => setGData({ ...gData, duration: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-500 uppercase mb-1 block">Paper Type</label>
                <select className="w-full border p-2 rounded" value={gData.paperType}
                  onChange={(e) => setGData({ ...gData, paperType: e.target.value })}>
                  <option value="mcq_only">MCQ Only</option>
                  <option value="subjective_only">Subjective Only</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>
            </div>

            {(isMCQ || isMixed) && (
              <div>
                <label className="text-xs font-semibold text-stone-500 uppercase mb-2 block">MCQ by Difficulty</label>
                <div className="grid grid-cols-3 gap-3">
                  {[["Easy","easyCount"],["Medium","mediumCount"],["Hard","hardCount"]].map(([label, key]) => (
                    <div key={key}>
                      <label className="text-xs text-stone-400 mb-1 block">{label}</label>
                      <input type="number" min="0" className="w-full border p-2 rounded" placeholder="0"
                        value={gData[key] || ""} onChange={(e) => setGData({ ...gData, [key]: e.target.value })} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(isSubjective || isMixed) && (
              <div>
                <label className="text-xs font-semibold text-stone-500 uppercase mb-2 block">Subjective Questions</label>
                <div className="grid grid-cols-2 gap-3 max-w-sm">
                  <div>
                    <label className="text-xs text-stone-400 mb-1 block">Short (2 marks)</label>
                    <input type="number" min="0" className="w-full border p-2 rounded" placeholder="0"
                      value={gData.shortCount || ""} onChange={(e) => setGData({ ...gData, shortCount: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs text-stone-400 mb-1 block">Long (5 marks)</label>
                    <input type="number" min="0" className="w-full border p-2 rounded" placeholder="0"
                      value={gData.longCount || ""} onChange={(e) => setGData({ ...gData, longCount: e.target.value })} />
                  </div>
                </div>
              </div>
            )}

            <button onClick={generateExam} className="px-6 py-2.5 bg-stone-900 text-white rounded hover:bg-stone-800 font-medium">
              Generate Paper
            </button>
          </div>
        )}

        {/* VIEW EXAMS — with pagination */}
        {activeTab === "view" && (
          <div className="space-y-4">

            {/* Search bar */}
            <div className="flex gap-2">
              <input className="border p-2 rounded flex-1 text-sm" placeholder="Search exams by title..."
                value={examSearchInput}
                onChange={(e) => setExamSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyExamSearch()} />
              <button onClick={applyExamSearch}
                className="px-3 py-2 bg-stone-900 text-white rounded text-sm hover:bg-stone-800">
                Search
              </button>
              {examSearch && (
                <button onClick={() => { setExamSearch(""); setExamSearchInput(""); resetExamPaging(); }}
                  className="px-3 py-2 border rounded text-sm hover:bg-stone-50">
                  Clear
                </button>
              )}
            </div>

            {/* Stats */}
            <div className="flex justify-between items-center text-sm text-stone-500">
              <span>{examLoading ? "Loading..." : `${examTotal} exam${examTotal !== 1 ? "s" : ""}`}
                {examSearch && <span className="ml-1 text-stone-400">for "{examSearch}"</span>}
              </span>
            </div>

            {/* Exam cards */}
            {examLoading ? (
              <CardSkeleton count={EXAM_LIMIT} />
            ) : exams.length === 0 ? (
              <p className="text-stone-400 text-center py-10">No exams found.</p>
            ) : (
              exams.map((exam) => (
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
                    <button onClick={() => navigate(`/teacher/view-exam/${exam._id}`)}
                      className="px-3 py-1 bg-stone-100 rounded text-sm hover:bg-stone-200">View</button>
                    <button onClick={() => navigate(`/teacher/check-paper/${exam._id}`)}
                      className="px-3 py-1 bg-amber-100 text-amber-800 rounded text-sm hover:bg-amber-200">Grade</button>
                    {!exam.isPublished && (
                      <button onClick={() => publishExam(exam._id)}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">Publish</button>
                    )}
                    <button onClick={() => deleteExam(exam._id)}
                      className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700">Delete</button>
                  </div>
                </div>
              ))
            )}

            {!examLoading && (
              <Pagination
                page={examPage}
                total={examTotal}
                limit={EXAM_LIMIT}
                hasPrev={examPageIndex > 0}
                hasMore={examHasMore}
                onPrev={goExamPrev}
                onNext={goExamNext}
                className="pt-2"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
