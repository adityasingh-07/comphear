const API_URL = "https://ws.audioscrobbler.com/2.0/";
const LIMIT = 50;
const TIMEOUT_MS = 10_000;

// Last.fm error code for an unknown username
const USER_NOT_FOUND = 6;

export class UserNotFoundError extends Error {
  constructor(username) {
    super(`User ${username} not found`);
    this.username = username;
  }
}

export class LastfmUnavailableError extends Error {}

// Each kind of top list: the Last.fm method and where the list sits in its response
const TOP_LISTS = {
  artists: { method: "user.gettopartists", outer: "topartists", inner: "artist" },
  albums: { method: "user.gettopalbums", outer: "topalbums", inner: "album" },
  tracks: { method: "user.gettoptracks", outer: "toptracks", inner: "track" },
};

export async function getTop(kind, username, period) {
  const { method, outer, inner } = TOP_LISTS[kind];
  const params = new URLSearchParams({
    method,
    user: username,
    period,
    limit: LIMIT,
    api_key: process.env.LASTFM_API_KEY,
    format: "json",
  });

  let data;
  try {
    const response = await fetch(`${API_URL}?${params}`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    data = await response.json();
  } catch (error) {
    // Network failure, timeout, or a response that isn't JSON
    throw new LastfmUnavailableError(error.message);
  }

  if (data.error === USER_NOT_FOUND) {
    throw new UserNotFoundError(username);
  }
  if (data.error || !data[outer]) {
    // Keep Last.fm's message (e.g. "Invalid API key") for the server log
    throw new LastfmUnavailableError(data.message || "Unexpected response");
  }

  // Last.fm returns a single object instead of an array when there's one item
  const items = [].concat(data[outer][inner] || []);

  // Keep only the fields the comparison uses
  return items.map((item) => ({
    name: item.name,
    ...(item.artist && { artist: item.artist.name }),
    playcount: Number(item.playcount),
  }));
}
