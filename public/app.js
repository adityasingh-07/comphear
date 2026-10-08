const form = document.getElementById("compare-form");
const loading = document.getElementById("loading");
const errorBox = document.getElementById("error");
const resultBox = document.getElementById("result");

form.addEventListener("submit", async (event) => {
  // Stop the browser from loading a new page; we fetch the data ourselves
  event.preventDefault();

  const params = new URLSearchParams(new FormData(form));
  errorBox.hidden = true;
  resultBox.hidden = true;
  loading.hidden = false;

  try {
    const response = await fetch(`/api/compare?${params}`);
    const data = await response.json();

    if (!response.ok) {
      errorBox.textContent = data.error;
      errorBox.hidden = false;
      return;
    }

    resultBox.textContent = JSON.stringify(data, null, 2);
    resultBox.hidden = false;
  } catch {
    errorBox.textContent = "Couldn't reach the server. Try again.";
    errorBox.hidden = false;
  } finally {
    loading.hidden = true;
  }
});
