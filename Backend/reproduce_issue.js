
const API_BASE = "http://localhost:5000/api/admin";

async function run() {
    const payload = {
        title: "Test Exam Crash",
        subject: "DBMS",
        paperType: "mcq_only",
        duration: 30,
        easyCount: 1,
        mediumCount: 0,
        hardCount: 0,
        mcqCount: 0,
        shortCount: 0,
        longCount: 0
    };

    try {
        console.log("Sending payload:", payload);
        const res = await fetch(`${API_BASE}/generate-paper`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const text = await res.text();
        console.log("Status:", res.status);
        console.log("Response:", text);
    } catch (err) {
        console.error("Fetch error:", err);
    }
}

run();
