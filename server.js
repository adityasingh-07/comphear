import express from "express";
import { getTop, UserNotFoundError } from "./lastfm.js";

if (!process.env.LASTFM_API_KEY) {
  console.error("LASTFM_API_KEY is missing. Add it to .env and restart.");
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

const PERIODS = ["1month", "3month", "6month"];

// Serve the page, styles, and browser script from public/
app.use(express.static("public"));

app.get("/api/compare", async (req, res) => {
  const userA = (req.query.userA || "").trim();
  const userB = (req.query.userB || "").trim();
  const period = req.query.period;

  // The browser form can be bypassed, so check every input here
  if (!userA || !userB) {
    return res.status(400).json({ error: "Enter both usernames." });
  }
  if (userA.toLowerCase() === userB.toLowerCase()) {
    return res.status(400).json({ error: "Enter two different usernames." });
  }
  if (!PERIODS.includes(period)) {
    return res.status(400).json({ error: "Choose 1, 3, or 6 months." });
  }

  try {
    // Start all 6 requests at once and wait for every one to finish
    const [artistsA, albumsA, tracksA, artistsB, albumsB, tracksB] =
      await Promise.all([
        getTop("artists", userA, period),
        getTop("albums", userA, period),
        getTop("tracks", userA, period),
        getTop("artists", userB, period),
        getTop("albums", userB, period),
        getTop("tracks", userB, period),
      ]);

    res.json({
      period,
      userA: { name: userA, artists: artistsA, albums: albumsA, tracks: tracksA },
      userB: { name: userB, artists: artistsB, albums: albumsB, tracks: tracksB },
    });
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      return res.status(404).json({ error: `${error.message}.` });
    }
    console.error(error);
    res.status(502).json({ error: "Last.fm is unavailable, try again later." });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
