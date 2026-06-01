const button = document.getElementById("analyzeBtn");

const fileInput =
    document.getElementById("resumeFile");

const fileStatus =
    document.getElementById("fileStatus");

fileInput.addEventListener("change", () => {

    const file =
        fileInput.files[0];

    if (!file) {

        fileStatus.innerText =
            "No file selected";

        return;
    }

    fileStatus.innerText =
        `📄 ${file.name}`;

});

button.addEventListener("click", async () => {

    let dotsInterval;

    const cv = document.getElementById("cv").value;
    const job = document.getElementById("job").value;

    const file =
        document.getElementById("resumeFile")
            .files[0];

    if ((!cv.trim() && !file) || !job.trim()) {

        alert(
            "Please provide a resume and job description"
        );

        return;
    }

    try {

        button.disabled = true;

        button.innerText =
            "Analyzing...";

        let resumeText = cv;

            if (file) {

                const formData = new FormData();

                formData.append(
                    "resume",
                    file
                );

                const uploadResponse =
                    await fetch(
                        "/upload-resume",
                        {
                            method: "POST",
                            body: formData
                        }
                    );

                if (!uploadResponse.ok) {

                    throw new Error(
                        "Failed to parse PDF"
                    );

                }

                const uploadData =
                    await uploadResponse.json();

                console.log(uploadData);

                resumeText =
                    uploadData.text;

            }

        document.getElementById("result").innerHTML = `

            <div class="loading-box">

                <h3>
                    AI is analyzing your resume
                </h3>

                <div id="step1" class="loading-step">
                    ⏳ Comparing skills
                </div>

                <div id="step2" class="loading-step">
                    ⏳ Evaluating experience
                </div>

                <div id="step3" class="loading-step">
                    ⏳ Generating cover letter
                </div>

            </div>

        `;

        document
            .getElementById("step1")
            .classList
            .add("active-step");

        setTimeout(() => {

            const step1 =
                document.getElementById("step1");

            const step2 =
                document.getElementById("step2");

            if (step1) {

                step1.classList.remove(
                    "active-step"
                );

                step1.classList.add(
                    "completed-step"
                );

                step1.innerText =
                    "✅ Comparing skills";

            }

            if (step2) {

                step2.classList.add(
                    "active-step"
                );

            }

        }, 3000);

        setTimeout(() => {

            const step2 =
                document.getElementById("step2");

            const step3 =
                document.getElementById("step3");

            if (step2) {

                step2.classList.remove(
                    "active-step"
                );

                step2.classList.add(
                    "completed-step"
                );

                step2.innerText =
                    "✅ Evaluating experience";

            }

            if (step3) {

                step3.classList.add(
                    "active-step"
                );

            }

        }, 6000);

        setTimeout(() => {

            const step3 =
                document.getElementById("step3");

            if (step3) {

                step3.classList.remove(
                    "active-step"
                );

                step3.classList.add(
                    "completed-step"
                );

                step3.innerText =
                    "✅ Generating cover letter";

            }

        }, 9000);

        const response = await fetch(
            "/analyze",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    cv: resumeText,
                    job
                })
            }
        );

        const data = await response.json();

        if (!data.result) {
            throw new Error("No result returned from API");
        }

        const result = JSON.parse(data.result);

        clearInterval(dotsInterval);

        document.getElementById("result").innerHTML = `

            <div class="score-card">
                <div class="score-title">
                    Match Score
                </div>

                <div class="score-value">
                    ${result.matchScore}%
                </div>
            </div>

            <div class="result-card">

                <h2>Missing Skills</h2>

                <ul>
                    ${result.missingSkills
                        .map(skill => `<li>${skill}</li>`)
                        .join("")}
                </ul>

            </div>

            <div class="result-card">

                <h2>CV Improvements</h2>

                <ul>
                    ${result.improvements
                        .map(item => `<li>${item}</li>`)
                        .join("")}
                </ul>

            </div>

            <div class="result-card">

                <div class="cover-header">

                    <h2>Cover Letter</h2>

                    <div class="action-buttons">

                        <button
                            id="copyBtn"
                            class="copy-btn"
                        >
                            Copy
                        </button>

                        <button
                            id="downloadBtn"
                            class="copy-btn"
                        >
                            Download TXT
                        </button>

                        <button
                            id="pdfBtn"
                            class="copy-btn"
                        >
                            Download PDF
                        </button>

                    </div>

                </div>

                <div id="coverLetterText">
                    ${result.coverLetter}
                </div>

            </div>

        `;

    const copyBtn =
        document.getElementById("copyBtn");

    const downloadBtn =
        document.getElementById("downloadBtn");

    const pdfBtn =
        document.getElementById("pdfBtn");

    copyBtn.addEventListener("click", async () => {

        await navigator.clipboard.writeText(
            result.coverLetter
        );

        copyBtn.innerText =
            "Copied!";

        setTimeout(() => {

            copyBtn.innerText =
                "Copy Cover Letter";

        }, 2000);

    });

    downloadBtn.addEventListener("click", () => {

        const blob = new Blob(
            [result.coverLetter],
            {
                type: "text/plain"
            }
        );

        const url =
            URL.createObjectURL(blob);

        const a =
            document.createElement("a");

        a.href = url;

        a.download =
            "cover-letter.txt";

        a.click();

        URL.revokeObjectURL(url);

    });

    pdfBtn.addEventListener(
        "click",
        async () => {

            const response =
                await fetch(
                    "/download-report",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            matchScore:
                                result.matchScore,

                            missingSkills:
                                result.missingSkills,

                            improvements:
                                result.improvements,

                            coverLetter:
                                result.coverLetter

                        })

                    }
                );

            const blob =
                await response.blob();

            const url =
                URL.createObjectURL(blob);

            const a =
                document.createElement("a");

            a.href = url;

            a.download =
                "resume-report.pdf";

            a.click();

            URL.revokeObjectURL(url);

        }
    );

    }

    catch (error) {

        console.error(error);

        clearInterval(dotsInterval);

        document.getElementById("result").innerHTML = `
            <p>Analysis failed. Please try again.</p>
        `;

    }

    finally {

        clearInterval(dotsInterval);

        button.disabled = false;

        button.innerText =
            "Analyze Resume";

    }

});