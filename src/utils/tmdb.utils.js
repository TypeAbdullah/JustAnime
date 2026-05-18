import axios from "axios";

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
const ANIME_LIST_URL = "https://raw.githubusercontent.com/Fribb/anime-lists/master/anime-list-full.json";

// Cache the anime list so we only fetch it once
let animeListCache = null;

const getAnimeList = async () => {
  if (animeListCache) return animeListCache;
  
  try {
    const res = await axios.get(ANIME_LIST_URL);
    animeListCache = res.data;
    console.log(`Anime Offline DB loaded: ${animeListCache.length} entries`);
    return animeListCache;
  } catch (error) {
    console.error("Failed to load anime offline database:", error.message);
    return null;
  }
};

/**
 * Look up all related IDs from AniList ID using the anime offline database.
 */
export const lookupAnimeIds = async (anilistId) => {
  const list = await getAnimeList();
  if (!list) return null;

  const entry = list.find((item) => item.anilist_id === anilistId);
  if (!entry) return null;

  return {
    malId: entry.mal_id,
    tmdbId: entry.themoviedb_id,
    kitsuId: entry.kitsu_id,
    type: entry.type,
    season: entry.season?.tmdb ?? 1,
  };
};

/**
 * Look up TMDB ID and season from AniList ID using the anime offline database.
 */
const lookupTmdbId = async (anilistId) => {
  const mapping = await lookupAnimeIds(anilistId);
  if (!mapping || !mapping.tmdbId) return null;

  return {
    tmdbId: mapping.tmdbId,
    type: mapping.type, // TV, MOVIE, OVA, SPECIAL
    season: mapping.season,
  };
};

/**
 * Fetch episode thumbnails from TMDB.
 * Uses anime offline database to convert AniList ID → TMDB ID for accurate lookup.
 * Falls back to title search if the offline database doesn't have the entry.
 */
export const fetchTmdbEpisodes = async (anilistId, title) => {
  if (!TMDB_API_KEY) {
    console.warn("TMDB: Missing API key in .env (VITE_TMDB_API_KEY)");
    return null;
  }

  try {
    // Step 1: Look up TMDB ID from anime offline database
    const mapping = await lookupTmdbId(anilistId);

    if (mapping) {
      console.log(`TMDB: Offline DB matched AniList ${anilistId} → TMDB ${mapping.tmdbId} (${mapping.type}, Season ${mapping.season})`);

      if (mapping.type === "MOVIE") {
        // Fetch movie details for backdrop
        const movieRes = await axios.get(`${TMDB_BASE}/movie/${mapping.tmdbId}`, {
          params: { api_key: TMDB_API_KEY },
        });
        const movie = movieRes.data;
        return [{
          number: 1,
          title: movie.title,
          thumbnail: movie.backdrop_path ? `${TMDB_IMG}${movie.backdrop_path}` : null,
          overview: movie.overview,
          aired: movie.release_date,
        }];
      }

      // TV / OVA / SPECIAL — fetch season episodes
      const seasonNum = mapping.season || 1;
      const seasonRes = await axios.get(`${TMDB_BASE}/tv/${mapping.tmdbId}/season/${seasonNum}`, {
        params: { api_key: TMDB_API_KEY },
      });

      const episodes = seasonRes.data.episodes;
      if (episodes && episodes.length > 0) {
        const today = new Date().toISOString().split("T")[0];
        const aired = episodes.filter((ep) => ep.air_date && ep.air_date <= today);
        console.log(`TMDB: Found ${aired.length}/${episodes.length} aired episodes for season ${seasonNum}`);
        if (aired.length > 0) {
          return aired.map((ep) => ({
            number: ep.episode_number,
            title: ep.name,
            thumbnail: ep.still_path ? `${TMDB_IMG}${ep.still_path}` : null,
            overview: ep.overview,
            aired: ep.air_date,
          }));
        }
      }
    }

    // Step 2: Fallback — search by title
    if (title) {
      console.log(`TMDB: Offline DB miss, searching by title: "${title}"`);
      const searchRes = await axios.get(`${TMDB_BASE}/search/tv`, {
        params: { api_key: TMDB_API_KEY, query: title },
      });

      const results = searchRes.data.results || [];
      const match =
        results.find((r) => r.origin_country?.includes("JP") && r.genre_ids?.includes(16)) ||
        results.find((r) => r.origin_country?.includes("JP")) ||
        results[0];

      if (match) {
        console.log(`TMDB: Title search matched "${title}" → ${match.name} (ID: ${match.id})`);
        const seasonRes = await axios.get(`${TMDB_BASE}/tv/${match.id}/season/1`, {
          params: { api_key: TMDB_API_KEY },
        });
        const episodes = seasonRes.data.episodes;
        if (episodes && episodes.length > 0) {
          const today = new Date().toISOString().split("T")[0];
          const aired = episodes.filter((ep) => ep.air_date && ep.air_date <= today);
          if (aired.length > 0) {
            return aired.map((ep) => ({
              number: ep.episode_number,
              title: ep.name,
              thumbnail: ep.still_path ? `${TMDB_IMG}${ep.still_path}` : null,
              overview: ep.overview,
              aired: ep.air_date,
            }));
          }
        }
      }
    }

    console.log(`TMDB: No results for AniList ${anilistId} / "${title}"`);
    return null;
  } catch (error) {
    console.error("TMDB fetch error:", error.response?.data || error.message);
    return null;
  }
};

/**
 * Fetch a single episode thumbnail from TMDB for a specific anime + episode number.
 * Optimized for the Recently Updated grid — uses cached offline DB and episode data.
 */
const episodeCache = {};

export const fetchSingleEpThumbnail = async (anilistId, episodeNumber) => {
  if (!TMDB_API_KEY || !anilistId) return null;

  const cacheKey = `${anilistId}-${episodeNumber}`;
  if (episodeCache[cacheKey] !== undefined) return episodeCache[cacheKey];

  try {
    const mapping = await lookupTmdbId(anilistId);
    if (!mapping || mapping.type === "MOVIE") {
      episodeCache[cacheKey] = null;
      return null;
    }

    const seasonNum = mapping.season || 1;
    const seasonRes = await axios.get(`${TMDB_BASE}/tv/${mapping.tmdbId}/season/${seasonNum}`, {
      params: { api_key: TMDB_API_KEY },
    });

    const episodes = seasonRes.data.episodes || [];
    // Cache ALL episodes from this season to avoid repeat API calls
    episodes.forEach((ep) => {
      const key = `${anilistId}-${ep.episode_number}`;
      episodeCache[key] = ep.still_path ? `${TMDB_IMG}${ep.still_path}` : null;
    });

    return episodeCache[cacheKey] || null;
  } catch {
    episodeCache[cacheKey] = null;
    return null;
  }
};
