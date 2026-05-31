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

        let resumeText = cv;

            if (file) {

                const formData = new FormData();

                formData.append(
                    "resume",
                    file
                );

                const uploadResponse =
                    await fetch(
                        "http://localhost:3000/upload-resume",
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

                <h3>🤖 AI is analyzing your resume...</h3>

                <p id="step1">
                    ⏳ Comparing skills...
                </p>

                <p id="step2">
                    ⏳ Evaluating experience...
                </p>

                <p id="step3">
                    ⏳ Generating cover letter...
                </p>

            </div>

        `;

        const loadingTitle =
            document.querySelector(".loading-box h3");

        let dots = "";

        dotsInterval = setInterval(() => {

            dots += ".";

            if (dots.length > 3) {
                dots = "";
            }

            if (loadingTitle) {
                loadingTitle.innerText =
                    `🤖 AI is analyzing your resume${dots}`;
            }

        }, 500);

        setTimeout(() => {

            const step1 =
                document.getElementById("step1");

            if (step1) {

                step1.innerText =
                    "✅ Comparing skills";

            }

        }, 3000);

        setTimeout(() => {

            const step2 =
                document.getElementById("step2");

            if (step2) {

                step2.innerText =
                    "✅ Evaluating experience";

            }

        }, 6000);

        setTimeout(() => {

            const step3 =
                document.getElementById("step3");

            if (step3) {

                step3.innerText =
                    "✅ Generating cover letter";

            }

        }, 9000);

        const response = await fetch(
            "http://localhost:3000/analyze",
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

            <h2>Missing Skills</h2>

            <ul>
                ${result.missingSkills
                    .map(skill => `<li>${skill}</li>`)
                    .join("")}
            </ul>

            <hr class="section-divider">

            <h2>CV Improvements</h2>

            <ul>
                ${result.improvements
                    .map(item => `<li>${item}</li>`)
                    .join("")}
            </ul>

            <hr class="section-divider">

            <div class="cover-header">

                <h2>Cover Letter</h2>

                <div class="action-buttons">

                    <button id="copyBtn" class="copy-btn">
                        Copy
                    </button>

                    <button id="downloadBtn" class="copy-btn">
                        Download TXT
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

    }

});