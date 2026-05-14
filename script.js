const button = document.getElementById("analyzeBtn");

button.addEventListener("click", () => {
  const cv = document.getElementById("cv").value;
  const job = document.getElementById("job").value;

  if (!cv || !job) {
    alert("Please fill both fields");
    return;
  }

  document.getElementById("result").innerHTML =
    "AI analysis will be here...";
});