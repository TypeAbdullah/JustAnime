import axios from "axios";

const SIMKL_CLIENT_ID = import.meta.env.VITE_SIMKL_CLIENT_ID || "56e4c27a29958742880df96025175653818e692a7e704173f4e8e1f579301980";

export const fetchSimklEpisodes = async (anilistId) => {
  try {
    // Step 1: Get SIMKL metadata using AniList ID
    const metaResponse = await axios.get(`https://api.simkl.com/anime/anilist/${anilistId}?client_id=${SIMKL_CLIENT_ID}`);
    const simklId = metaResponse.data?.[0]?.ids?.simkl || metaResponse.data?.ids?.simkl;

    console.log(`SIMKL Meta for AniList ${anilistId}:`, metaResponse.data);
    console.log(`Found SIMKL ID:`, simklId);

    if (!simklId) return null;

    const episodesResponse = await axios.get(`https://api.simkl.com/anime/episodes/${simklId}?extended=full&client_id=${SIMKL_CLIENT_ID}`);
    console.log(`SIMKL Episodes Count:`, episodesResponse.data?.length);
    
    return episodesResponse.data.map(ep => ({
      number: ep.episode,
      title: ep.title,
      thumbnail: ep.img ? `https://simkl.in/episodes/${ep.img}_w.webp` : null,
      overview: ep.description,
      aired: ep.date
    }));
  } catch (error) {
    console.error("Error fetching SIMKL episodes:", error.response?.data || error.message);
    return null;
  }
};
