require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { GoogleGenerativeAI } = require("@google/generative-ai");

if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing");
}

const genAI = new GoogleGenerativeAI(
    process.env.GEMINI_API_KEY
);

const app = express();

app.use(cors());
app.use(express.json());

const PORT = 3000;

app.get("/", (req, res) => {
    res.send("AI Resume Analyzer API is running");
});

app.post("/analyze", async (req, res) => {

    try {

        const { cv, job } = req.body;

        if (!cv || !job) {
            return res.status(400).json({
                success: false,
                message: "CV and job description are required"
            });
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash"
        });

        const prompt = `
You are a professional recruiter.

Analyze the candidate CV against the job description.

Candidate CV:
${cv}

Job Description:
${job}

Return ONLY valid JSON.

Example:

{
  "missingSkills": [
    "React",
    "Docker",
    "Git"
  ],
  "improvements": [
    "Add React project examples",
    "Improve GitHub profile"
  ],
  "coverLetter": "Short cover letter here"
}

Do not add explanations.
Do not use markdown.
Do not wrap JSON in code blocks.
Return JSON only.
`;

        const result = await model.generateContent(prompt);

        const response = await result.response.text();

        res.json({
            success: true,
            result: response
        });

    } catch (error) {

        console.error("Gemini Error:", error);

        res.status(500).json({
            success: false,
            message: "AI analysis failed"
        });

    }

});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});