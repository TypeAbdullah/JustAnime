import axios from "axios";

const PAHE_API_URL = import.meta.env.VITE_PAHE_API_URL || "";
const WORKER_PROXY = import.meta.env.VITE_WORKER_PROXY || "";
const PAHE_CACHE_KEY = "pahe_episode_map";

/**
 * Helper to build proxy-wrapped URLs for AnimePahe API
 */
function buildApiUrl(endpoint, params = {}) {
  const url = new URL(endpoint.startsWith('http') ? endpoint : `${PAHE_API_URL}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value);
    }
  });

  if (WORKER_PROXY) {
    // Proxy all API requests to bypass CORS and 403 Forbidden
    return `${WORKER_PROXY}?url=${encodeURIComponent(url.toString())}`;
  }
  return url.toString();
}


function getPaheCache() {
  try {
    return JSON.parse(localStorage.getItem(PAHE_CACHE_KEY)) || {};
  } catch {
    return {};
  }
}

function setPaheCache(cache) {
  localStorage.setItem(PAHE_CACHE_KEY, JSON.stringify(cache));
}

/**
 * Search anime by query
 * Endpoint: GET /search?q=query
 */
export async function searchPahe(title) {
  if (!PAHE_API_URL) return null;
  try {
    const { data } = await axios.get(buildApiUrl("/search", { q: title }));
    // Response is a direct array of results
    if (Array.isArray(data) && data.length > 0) {
      return data[0]; // Take the best match
    }
    return null;
  } catch (err) {
    console.error("Pahe Search Error:", err.message);
    return null;
  }
}

/**
 * Get or resolve the Pahe session for a given anime.
 */
export async function getPaheSession(animeId, animeTitle) {
  const cache = getPaheCache();
  if (cache[animeId]?.session) {
    return cache[animeId];
  }

  const match = await searchPahe(animeTitle);
  if (!match) return null;

  const entry = {
    session: match.session,
    paheTitle: match.title,
    totalEpisodes: 0, // Will be updated when episodes are fetched
    episodeMap: {},
  };
  
  cache[animeId] = entry;
  setPaheCache(cache);
  return entry;
}

/**
 * Get all episodes for a given anime session
 * Endpoint: GET /episodes?session=session
 */
export async function getPaheEpisodes(animeId, session) {
  if (!PAHE_API_URL) return [];
  try {
    const { data } = await axios.get(buildApiUrl("/episodes", { session }));

    const episodes = Array.isArray(data) ? data : [];
    const cache = getPaheCache();
    if (!cache[animeId]) cache[animeId] = { session, episodeMap: {} };

    episodes.forEach((ep) => {
      // Map episode number to its session ID
      cache[animeId].episodeMap[String(ep.number)] = ep.session;
    });
    
    cache[animeId].totalEpisodes = episodes.length;
    setPaheCache(cache);

    return episodes;
  } catch (err) {
    console.error("Pahe Episodes Error:", err.message);
    return [];
  }
}

/**
 * Helper to fetch all episodes (this API returns them all in one go)
 */
export async function fetchAllPaheEpisodes(animeId, session) {
  return await getPaheEpisodes(animeId, session);
}

/**
 * Get the Pahe episode session ID for a specific episode number.
 */
export async function getPaheEpisodeSession(animeId, session, episodeNum) {
  const cache = getPaheCache();
  const epNum = String(episodeNum);

  if (cache[animeId]?.episodeMap?.[epNum]) {
    return cache[animeId].episodeMap[epNum];
  }

  await getPaheEpisodes(animeId, session);
  const updatedCache = getPaheCache();
  return updatedCache[animeId]?.episodeMap?.[epNum] || null;
}

/**
 * Retrieve source links for a specific episode
 * Endpoint: GET /sources?anime_session=session&episode_session=episode_session
 */
export async function getPaheStreamingLinks(session, episodeSessionId) {
  if (!PAHE_API_URL) return null;
  try {
    const { data } = await axios.get(buildApiUrl("/sources", { 
      anime_session: session,
      episode_session: episodeSessionId 
    }));
    return data; // Returns array of { url, quality, fansub, audio }
  } catch (err) {
    console.error("Pahe Sources Error:", err.message);
    return null;
  }
}

/**
 * Resolve the final m3u8 URL from a kwik URL
 * Endpoint: GET /m3u8?url=kwik_url
 */
export async function resolveM3u8(kwikUrl) {
  if (!PAHE_API_URL) return null;
  try {
    const { data } = await axios.get(buildApiUrl("/m3u8", { url: kwikUrl }));
    return data; // { m3u8, referer, headers, proxy_url }
  } catch (err) {
    console.error("Pahe M3U8 Resolution Error:", err.message);
    return null;
  }
}

/**
 * Build servers list. 
 * Since we need to resolve m3u8 URLs, we store the kwik URL and resolve it when selected.
 */
export function buildPaheServers(sources) {
  if (!Array.isArray(sources)) return [];

  return sources.map((src, index) => ({
    data_id: `pahe-kwik-${index}`,
    serverName: `${src.quality} (${src.fansub})`,
    quality: src.quality,
    audio: src.audio,
    type: src.audio === "jpn" ? "sub" : "dub",
    kwikUrl: src.url, // Original kwik link
    source: "pahe",
    isKwik: true
  }));
}

export function clearPaheCache(animeId = null) {
  if (animeId) {
    const cache = getPaheCache();
    delete cache[animeId];
    setPaheCache(cache);
  } else {
    localStorage.removeItem(PAHE_CACHE_KEY);
  }
}
