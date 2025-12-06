import Question from "../models/Questions.js"; 
import Exam from "../models/Exam.js";
import xlsx from "xlsx";
import fs from "fs";

// --- 1. ADMIN LOGIN ---
export const adminLogin = (req, res) => {
  const { username, password } = req.body;

  const ADMIN_USER = "admin";
  const ADMIN_PASS = "admin123";

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    return res.json({ message: "Admin login success" });
  }

  return res.status(400).json({ message: "Invalid admin credentials" });
};

// --- 2. ADD QUESTION MANUALLY ---
export const addQuestion = async (req, res) => {
  try {
    console.log("Received Data:", req.body); 

    const newQuestion = new Question(req.body);
    await newQuestion.save();
    
    console.log("Saved to DB!"); 
    res.status(201).json({ message: "Question added successfully!" });
  } catch (error) {
    console.error("Error saving question:", error); 
    res.status(500).json({ message: "Error adding question", error });
  }
};

// --- 3. BULK UPLOAD QUESTIONS (EXCEL) ---
export const uploadQuestions = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // DEBUG: Print the first row to see what headers Excel actually found
    if (sheetData.length > 0) {
      console.log("Excel Headers Found:", Object.keys(sheetData[0]));
    }

    const questionsToInsert = sheetData.map((row) => {
      // Helper to find key case-insensitively
      const getKey = (key) => Object.keys(row).find(k => k.toLowerCase() === key.toLowerCase());

      return {
        questionText: row[getKey("question")] || row[getKey("questiontext")],
        subject: row[getKey("subject")], // Matches 'Subject', 'subject', 'SUBJECT'
        difficulty: row[getKey("difficulty")], // Matches 'Difficulty', 'difficulty'
        options: [
          row[getKey("optiona")], 
          row[getKey("optionb")], 
          row[getKey("optionc")], 
          row[getKey("optiond")]
        ].filter(Boolean),
        correctAnswer: row[getKey("correctanswer")] || row[getKey("correct")]
      };
    });

    // Remove rows where crucial data is missing
    const validQuestions = questionsToInsert.filter(q => q.questionText && q.subject && q.difficulty);

    if (validQuestions.length === 0) {
      return res.status(400).json({ message: "No valid questions found. Check Excel headers." });
    }

    await Question.insertMany(validQuestions);
    fs.unlinkSync(req.file.path);

    res.status(201).json({ 
      message: `Successfully uploaded ${validQuestions.length} questions! (Skipped ${questionsToInsert.length - validQuestions.length} bad rows)` 
    });

  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ message: "Failed to upload", error: error.message });
  }
};

// --- 4. GENERATE PAPER (The Algorithm) ---
// --- 4. GENERATE PAPER (Smart Version) ---
export const generatePaper = async (req, res) => {
  let { title, subject, easyCount, mediumCount, hardCount } = req.body;

  // 1. Validation & Cleanup
  if (!title || title.trim() === "") {
    return res.status(400).json({ message: "Please provide an Exam Title." });
  }

  // Remove spaces: " OS " -> "OS"
  // Escape special chars just in case
  const cleanSubject = subject.trim(); 
  
  // Create a "Case Insensitive" search pattern
  // This matches "os", "OS", "Os", "oS"
  const subjectRegex = new RegExp(`^${cleanSubject}$`, "i");

  console.log(`Generating for: "${cleanSubject}" (Regex: ${subjectRegex})`);

  try {
    // 2. Check counts using the Regex
    const totalEasy = await Question.countDocuments({ subject: subjectRegex, difficulty: "Easy" });
    const totalMedium = await Question.countDocuments({ subject: subjectRegex, difficulty: "Medium" });
    const totalHard = await Question.countDocuments({ subject: subjectRegex, difficulty: "Hard" });

    console.log(`Found: Easy=${totalEasy}, Medium=${totalMedium}, Hard=${totalHard}`);

    if (totalEasy < easyCount || totalMedium < mediumCount || totalHard < hardCount) {
      return res.status(400).json({ 
        message: `Not enough questions! Requested (E:${easyCount}, M:${mediumCount}, H:${hardCount}) but found (E:${totalEasy}, M:${totalMedium}, H:${totalHard}) for ${cleanSubject}`
      });
    }

    // 3. Aggregate Random Questions using the Regex
    const easyQ = await Question.aggregate([
      { $match: { subject: subjectRegex, difficulty: "Easy" } },
      { $sample: { size: Number(easyCount) } }
    ]);

    const mediumQ = await Question.aggregate([
      { $match: { subject: subjectRegex, difficulty: "Medium" } },
      { $sample: { size: Number(mediumCount) } }
    ]);

    const hardQ = await Question.aggregate([
      { $match: { subject: subjectRegex, difficulty: "Hard" } },
      { $sample: { size: Number(hardCount) } }
    ]);

    const allQuestions = [...easyQ, ...mediumQ, ...hardQ];

    // 4. Create Exam
    const newExam = new Exam({
      title,
      subject: cleanSubject, // Save the clean name (e.g., "OS")
      questions: allQuestions.map(q => q._id)
    });

    await newExam.save();

    res.status(201).json({ 
      message: "Exam generated successfully!", 
      exam: newExam,
      totalQuestions: allQuestions.length 
    });

  } catch (error) {
    console.error("Generate Error:", error);
    res.status(500).json({ message: "Server Error generating exam" });
  }
};

// --- 5. GET ALL EXAMS ---
export const getExams = async (req, res) => {
    try {
        // .populate("questions") is the magic part!
        // It fills in the actual question data instead of just the ID.
        const exams = await Exam.find()
            .populate("questions") 
            .sort({ createdAt: -1 });
            
        res.json(exams);
    } catch (error) {
        res.status(500).json({ message: "Error fetching exams" });
    }
};
// --- 6. GET SINGLE EXAM BY ID (New) ---
export const getExamById = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id).populate("questions");
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    res.json(exam);
  } catch (error) {
    res.status(500).json({ message: "Error loading exam" });
  }
};
// --- 7. DEBUG: VIEW ALL QUESTIONS ---
export const getAllQuestions = async (req, res) => {
  try {
    const questions = await Question.find({});
    res.json({
      count: questions.length,
      sample: questions.slice(0, 3) // Show first 3 questions only
    });
  } catch (error) {
    res.status(500).json({ message: "Error" });
  }
};