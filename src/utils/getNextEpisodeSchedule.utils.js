import { fetchAniListInfo } from "./anilist.utils";

const getNextEpisodeSchedule = async (id) => {
  try {
    const alData = await fetchAniListInfo(id);
    if (alData?.Media?.nextAiringEpisode) {
      return {
        nextEpisodeSchedule: alData.Media.nextAiringEpisode.airingAt * 1000,
        episode: alData.Media.nextAiringEpisode.episode
      };
    }
    return null;
  } catch (err) {
    console.error("Error fetching next episode schedule from AniList:", err);
    return null;
  }
};

export default getNextEpisodeSchedule;
