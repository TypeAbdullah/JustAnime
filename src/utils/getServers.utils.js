import axios from "axios";

export default async function getServers(animeId, episodeId, options = {}) {
  try {
    const api_url = import.meta.env.VITE_API_URL;
    const cleanEpisodeId = episodeId.replace('ep=', '');
    const response = await axios.get(
      `${api_url}/servers/${cleanEpisodeId}`,
      { params: { anime_id: animeId, season: 1 }, signal: options.signal }
    );
    const serverData = response.data.servers || response.data || {};
    const { sub, dub, softsub } = serverData;
    const flatServers = [
      ...(sub || []).map(s => ({ ...s, data_id: s.link_id, serverName: s.name, type: 'sub' })),
      ...(dub || []).map(s => ({ ...s, data_id: s.link_id, serverName: s.name, type: 'dub' })),
      ...(softsub || []).map(s => ({ ...s, data_id: s.link_id, serverName: s.name, type: 'softsub' })),
    ];
    return flatServers;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
