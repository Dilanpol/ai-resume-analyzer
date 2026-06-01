require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const PDFDocument = require("pdfkit");

const { GoogleGenerativeAI } = require("@google/generative-ai");

if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing");
}

const genAI = new GoogleGenerativeAI(
    process.env.GEMINI_API_KEY
);

const app = express();

const upload = multer();

app.use(cors());
app.use(express.json());

const PORT = 3000;

app.get("/", (req, res) => {
    res.send("AI Resume Analyzer API is running");
});

app.post(
    "/upload-resume",
    upload.single("resume"),
    async (req, res) => {

        try {

            if (!req.file) {

                return res.status(400).json({
                    error: "No file uploaded"
                });

            }

            const fileName =
                req.file.originalname.toLowerCase();

            let text = "";

            if (fileName.endsWith(".pdf")) {

                console.log("PDF upload started");

                const pdfData =
                    await pdfParse(req.file.buffer);

                text = pdfData.text;

                console.log(
                    "PDF parsed successfully"
                );

            }

            else if (fileName.endsWith(".docx")) {

                console.log("DOCX upload started");

                const result =
                    await mammoth.extractRawText({
                        buffer: req.file.buffer
                    });

                text = result.value;

                console.log(
                    "DOCX parsed successfully"
                );

            }

            else {

                return res.status(400).json({
                    error:
                        "Only PDF and DOCX files are supported"
                });

            }

            res.json({
                text
            });

        }

        catch (error) {

            console.error(error);

            res.status(500).json({
                error:
                    "Failed to read resume file"
            });

        }

    }
);

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
  "matchScore": 82,
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

matchScore must be an integer from 0 to 100.

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

app.post("/download-report", (req, res) => {

    const {
        matchScore,
        missingSkills,
        improvements,
        coverLetter
    } = req.body;

    const doc = new PDFDocument();

    res.setHeader(
        "Content-Type",
        "application/pdf"
    );

    res.setHeader(
        "Content-Disposition",
        "attachment; filename=resume-report.pdf"
    );

    doc.pipe(res);

    doc
        .fontSize(22)
        .text(
            "AI Resume Analysis Report",
            {
                align: "center"
            }
        );

    doc.moveDown();

    doc
        .fontSize(16)
        .text(
            `Match Score: ${matchScore}%`
        );

    doc.moveDown();

    doc
        .fontSize(18)
        .text("Missing Skills");

    missingSkills.forEach(skill => {

        doc.text(`• ${skill}`);

    });

    doc.moveDown();

    doc
        .fontSize(18)
        .text("CV Improvements");

    improvements.forEach(item => {

        doc.text(`• ${item}`);

    });

    doc.moveDown();

    doc
        .fontSize(18)
        .text("Cover Letter");

    doc
        .fontSize(12)
        .text(coverLetter);

    doc.end();

});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});