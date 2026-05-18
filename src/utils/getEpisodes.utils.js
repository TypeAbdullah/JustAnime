import axios from "axios";

export default async function getEpisodes(id) {
  const api_url = import.meta.env.VITE_LEGACY_API_URL || import.meta.env.VITE_API_URL;
  try {
    const response = await axios.get(`${api_url}/episodes/${id}`);
    const resData = response.data;
    if (resData.episodes) {
      resData.episodes = resData.episodes.map(ep => ({
        ...ep,
        id: `ep=${ep.token}`, // Map token to ep= format for regex compatibility
        episode_no: parseInt(ep.number, 10),
      }));
    }
    resData.totalEpisodes = resData.count || resData.episodes?.length || 0;
    return resData;
  } catch (error) {
    console.warn("getEpisodes: API unavailable, falling back to AniList:", error.message);
    // Return empty so useWatch.js fallback logic generates episodes from AniList
    return { episodes: [], totalEpisodes: 0 };
  }
}
