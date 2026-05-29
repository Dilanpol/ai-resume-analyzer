const button = document.getElementById("analyzeBtn");

button.addEventListener("click", async () => {

    const cv = document.getElementById("cv").value;
    const job = document.getElementById("job").value;

    if (!cv.trim() || !job.trim()) {
        alert("Please fill in both fields");
        return;
    }

    try {

        button.disabled = true;

        document.getElementById("result").innerText =
            "Analyzing...";

        const response = await fetch(
            "http://localhost:3000/analyze",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    cv,
                    job
                })
            }
        );

        const data = await response.json();

        const result = JSON.parse(data.result);

        document.getElementById("result").innerHTML = `
            <h2>Missing Skills</h2>
            <ul>
                ${result.missingSkills
                    .map(skill => `<li>${skill}</li>`)
                    .join("")}
            </ul>

            <h2>CV Improvements</h2>
            <ul>
                ${result.improvements
                    .map(item => `<li>${item}</li>`)
                    .join("")}
            </ul>

            <h2>Cover Letter</h2>
            <p>${result.coverLetter}</p>
        `;

    }
    catch (error) {

        console.error(error);

        document.getElementById("result").innerText =
            "Something went wrong.";

    }
    finally {

        button.disabled = false;

    }

});