import { fetchAniListInfo } from "./anilist.utils";

const getQtip = async (id) => {
  try {
    const alData = await fetchAniListInfo(id);
    if (!alData?.Media) return null;

    const media = alData.Media;
    return {
      title: media.title.userPreferred || media.title.romaji || media.title.english,
      japanese_title: media.title.native,
      description: media.description,
      type: media.format,
      status: media.status,
      score: media.averageScore / 10,
      sub_episodes: media.episodes || 0,
      dub_episodes: 0,
      quality: "HD",
      genres: media.genres,
      aired: `${media.startDate.year}-${media.startDate.month}-${media.startDate.day}`,
    };
  } catch (err) {
    console.error("Error fetching Qtip from AniList:", err);
    return null; 
  }
};

export default getQtip;
