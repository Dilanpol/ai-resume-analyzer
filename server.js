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

app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

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

async function generateWithRetry(
    model,
    prompt,
    retries = 2
) {

    for (
        let attempt = 0;
        attempt <= retries;
        attempt++
    ) {

        try {

            return await model.generateContent(
                prompt
            );

        }

        catch (error) {

            const status =
                error.status;

            const is503 =
                status === 503;

            const isLastAttempt =
                attempt === retries;

            if (!is503 || isLastAttempt) {

                throw error;

            }

            const delay =
                (attempt + 1) * 2000;

            console.log(
                `503 error. Retrying in ${delay}ms...`
            );

            await new Promise(resolve =>
                setTimeout(resolve, delay)
            );

        }

    }

}

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

        const result =
            await generateWithRetry(
                model,
                prompt
            );

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

// Header

doc
    .fillColor("#2563eb")
    .fontSize(28)
    .text("AI Resume Analyzer", {
        align: "center"
    });

doc.moveDown(0.2);

doc
    .fillColor("#6b7280")
    .fontSize(12)
    .text("Resume Analysis Report", {
        align: "center"
    });

doc.moveDown(1);

// Match Score

doc
    .fillColor("#111827")
    .fontSize(18)
    .text("Match Score");

doc
    .fillColor("#2563eb")
    .fontSize(32)
    .text(`${matchScore}%`);

doc.moveDown(0.3);

// Divider

doc
    .moveTo(50, doc.y)
    .lineTo(550, doc.y)
    .strokeColor("#d1d5db")
    .stroke();

doc.moveDown(0.5);

doc
    .fillColor("#111827")
    .fontSize(18)
    .text("Missing Skills");

doc.moveDown(0.5);

missingSkills.forEach(skill => {

    doc
        .fontSize(12)
        .fillColor("#374151")
        .text(`• ${skill}`);

});

doc.moveDown();

// Divider

doc
    .moveTo(50, doc.y)
    .lineTo(550, doc.y)
    .strokeColor("#d1d5db")
    .stroke();

doc.moveDown();

// CV Improvements

doc
    .fillColor("#111827")
    .fontSize(18)
    .text("CV Improvements");

doc.moveDown(0.5);

improvements.forEach(item => {

    doc
        .fontSize(12)
        .fillColor("#374151")
        .text(`• ${item}`);

});

doc.moveDown();

// Divider

doc
    .moveTo(50, doc.y)
    .lineTo(550, doc.y)
    .strokeColor("#d1d5db")
    .stroke();

doc.moveDown();

doc
    .fillColor("#111827")
    .fontSize(18)
    .text("Cover Letter");

doc.moveDown(0.5);

doc
    .fontSize(12)
    .fillColor("#374151")
    .text(coverLetter, {
        align: "left",
        lineGap: 4
    });

doc.end();

});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});