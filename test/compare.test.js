import { test } from "node:test";
import assert from "node:assert/strict";
import { compareListening } from "../compare.js";

const listener = (artists, albums = [], tracks = []) => ({ artists, albums, tracks });

test("worked example from the design scores 39%", () => {
  const a = listener([
    { name: "Radiohead", playcount: 120 },
    { name: "Taylor Swift", playcount: 80 },
    { name: "Bon Iver", playcount: 40 },
    { name: "Phoebe Bridgers", playcount: 25 },
  ]);
  const b = listener([
    { name: "Taylor Swift", playcount: 200 },
    { name: "Radiohead", playcount: 15 },
    { name: "Drake", playcount: 10 },
    { name: "Bon Iver", playcount: 5 },
  ]);

  const result = compareListening(a, b);

  assert.equal(result.score, 39);
  // Taylor Swift contributes most (smaller share 30%), then Radiohead (7%), then Bon Iver (2%)
  assert.deepEqual(
    result.sharedArtists.map((artist) => artist.name),
    ["Taylor Swift", "Radiohead", "Bon Iver"],
  );
  assert.deepEqual(result.sharedArtists[0], { name: "Taylor Swift", playsA: 80, playsB: 200 });
});

test("identical listening scores 100%", () => {
  const artists = [
    { name: "Radiohead", playcount: 10 },
    { name: "Bon Iver", playcount: 30 },
  ];
  assert.equal(compareListening(listener(artists), listener(artists)).score, 100);
});

test("no artists in common scores 0%", () => {
  const a = listener([{ name: "Radiohead", playcount: 10 }]);
  const b = listener([{ name: "Drake", playcount: 10 }]);

  const result = compareListening(a, b);

  assert.equal(result.score, 0);
  assert.deepEqual(result.sharedArtists, []);
});

test("artist names match regardless of upper/lower case", () => {
  const a = listener([{ name: "RADIOHEAD", playcount: 10 }]);
  const b = listener([{ name: "radiohead", playcount: 10 }]);
  assert.equal(compareListening(a, b).score, 100);
});

test("a user with no listening gets no score", () => {
  const a = listener([]);
  const b = listener([{ name: "Radiohead", playcount: 10 }]);
  const result = compareListening(a, b);
  assert.equal(result.score, null);
  assert.deepEqual(result.inactive, ["a"]);
});

test("both users without listening are both reported", () => {
  assert.deepEqual(compareListening(listener([]), listener([])).inactive, ["a", "b"]);
});

test("songs only match when the artist matches too", () => {
  const a = listener([], [], [
    { name: "Creep", artist: "Radiohead", playcount: 5 },
    { name: "Hello", artist: "Adele", playcount: 5 },
  ]);
  const b = listener([], [], [
    { name: "creep", artist: "radiohead", playcount: 3 },
    { name: "Hello", artist: "Lionel Richie", playcount: 3 },
  ]);

  const result = compareListening(a, b);

  assert.deepEqual(result.sharedTracks, [
    { name: "Creep", artist: "Radiohead", playsA: 5, playsB: 3 },
  ]);
});
