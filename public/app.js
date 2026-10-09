const form = document.getElementById("compare-form");
const formView = document.getElementById("form-view");
const resultsView = document.getElementById("results-view");
const loading = document.getElementById("loading");
const errorBox = document.getElementById("error");

const PERIOD_TEXT = {
  "1month": "the last month",
  "3month": "the last 3 months",
  "6month": "the last 6 months",
};
const SHOWN_PER_LIST = 5;

form.addEventListener("submit", async (event) => {
  // Stop the browser from loading a new page; we fetch the data ourselves
  event.preventDefault();

  const params = new URLSearchParams(new FormData(form));
  errorBox.hidden = true;
  loading.hidden = false;

  try {
    const response = await fetch(`/api/compare?${params}`);
    const data = await response.json();

    if (!response.ok) {
      errorBox.textContent = data.error;
      errorBox.hidden = false;
      return;
    }

    showResults(data);
  } catch {
    errorBox.textContent = "Couldn't reach the server. Try again.";
    errorBox.hidden = false;
  } finally {
    loading.hidden = true;
  }
});

// Back to the form; the inputs keep what was typed
document.getElementById("back").addEventListener("click", () => {
  resultsView.hidden = true;
  formView.hidden = false;
});

function showResults(data) {
  const period = PERIOD_TEXT[data.period];
  const score = document.getElementById("score");
  const note = document.getElementById("note");
  const lists = document.getElementById("lists");

  document.getElementById("pair").textContent = `${data.userA} × ${data.userB} · ${period}`;
  lists.replaceChildren();

  if (data.score === null) {
    // Not enough listening: no number, say who and what to try
    const who = data.inactiveUsers.join(" and ");
    const verb = data.inactiveUsers.length > 1 ? "haven't" : "hasn't";
    score.hidden = true;
    note.textContent = `${who} ${verb} listened to enough music in ${period}. Try a longer period.`;
  } else {
    score.hidden = false;
    score.textContent = `${data.score}%`;
    note.textContent = data.score === 0 ? `No artists in common in ${period}.` : "";

    lists.append(
      buildList("Artists", data.sharedArtists, data),
      buildList("Albums", data.sharedAlbums, data),
      buildList("Songs", data.sharedTracks, data),
    );
  }

  formView.hidden = true;
  resultsView.hidden = false;
}

// One section: heading plus a table of up to 5 shared items with both play counts
function buildList(title, items, data) {
  const section = document.createElement("section");
  const heading = document.createElement("h2");
  heading.textContent = `Shared ${title.toLowerCase()}`;
  section.append(heading);

  if (items.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = `No shared ${title.toLowerCase()}.`;
    section.append(empty);
    return section;
  }

  const table = document.createElement("table");
  table.append(row("th", [title.slice(0, -1), data.userA, data.userB]));
  for (const item of items.slice(0, SHOWN_PER_LIST)) {
    const label = item.artist ? `${item.name} · ${item.artist}` : item.name;
    table.append(row("td", [label, item.playsA, item.playsB]));
  }
  section.append(table);
  return section;
}

function row(cellTag, values) {
  const tr = document.createElement("tr");
  for (const value of values) {
    const cell = document.createElement(cellTag);
    // textContent, never innerHTML: names come from Last.fm and user input
    cell.textContent = value;
    tr.append(cell);
  }
  return tr;
}
