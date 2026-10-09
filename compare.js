// Artists match on name; albums and tracks match on name + artist
const artistKey = (item) => item.name.toLowerCase();
const itemKey = (item) => `${item.name.toLowerCase()}|${item.artist.toLowerCase()}`;

// Build a lookup table: key -> { item, plays, share }
function shareTable(list, key) {
  const table = new Map();
  let total = 0;

  for (const item of list) {
    const k = key(item);
    const entry = table.get(k) || { item, plays: 0 };
    entry.plays += item.playcount;
    table.set(k, entry);
    total += item.playcount;
  }

  for (const entry of table.values()) {
    entry.share = total > 0 ? entry.plays / total : 0;
  }
  return table;
}

// Weighted overlap: for every item both people play, add the smaller share
function overlap(listA, listB, key) {
  const tableA = shareTable(listA, key);
  const tableB = shareTable(listB, key);
  const shared = [];
  let total = 0;

  // Items missing from B have a smaller share of 0, so A's items are enough
  for (const [k, a] of tableA) {
    const b = tableB.get(k);
    if (!b) continue;

    const smaller = Math.min(a.share, b.share);
    total += smaller;
    shared.push({
      name: a.item.name,
      ...(a.item.artist && { artist: a.item.artist }),
      playsA: a.plays,
      playsB: b.plays,
      smaller,
    });
  }

  // Biggest contributors to the overlap first
  shared.sort((x, y) => y.smaller - x.smaller);
  return { total, shared: shared.map(({ smaller, ...rest }) => rest) };
}

const totalPlays = (list) => list.reduce((sum, item) => sum + item.playcount, 0);

// a and b are { artists, albums, tracks } from Last.fm
export function compareListening(a, b) {
  const artists = overlap(a.artists, b.artists, artistKey);
  const enoughListening = totalPlays(a.artists) > 0 && totalPlays(b.artists) > 0;

  return {
    score: enoughListening ? Math.round(artists.total * 100) : null,
    sharedArtists: artists.shared,
    sharedAlbums: overlap(a.albums, b.albums, itemKey).shared,
    sharedTracks: overlap(a.tracks, b.tracks, itemKey).shared,
  };
}
