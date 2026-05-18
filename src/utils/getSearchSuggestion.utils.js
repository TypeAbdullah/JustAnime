import { fetchAniListSearch } from "./anilist.utils";

const getSearchSuggestion = async (keyword) => {
  try {
    const alData = await fetchAniListSearch(keyword, 1);
    const results = (alData.Page.media || []).slice(0, 5).map((item) => ({
      id: item.id,
      slug: item.id.toString(),
      ani_id: item.id,
      title: item.title.userPreferred || item.title.romaji || item.title.english,
      poster: item.coverImage.large,
      type: item.format,
      status: item.status,
      score: item.averageScore / 10
    }));
    return results;
  } catch (err) {
    console.error("Error fetching search suggestions from AniList:", err);
    return [];
  }
};

export default getSearchSuggestion;
