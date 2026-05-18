import { fetchAniListSearch } from "./anilist.utils";

const getSearch = async (keyword, page = 1) => {
  try {
    const alData = await fetchAniListSearch(keyword, page);
    
    return (alData.Page.media || []).map((item) => ({
      id: item.id,
      slug: item.id.toString(),
      ani_id: item.id,
      title: item.title.userPreferred || item.title.romaji || item.title.english,
      poster: item.coverImage.large,
      banner: item.bannerImage,
      type: item.format,
      episodes: {
        sub: item.episodes || 0,
        dub: 0
      },
      status: item.status,
      score: item.averageScore / 10,
      tvInfo: {
        sub: item.episodes || "?",
        dub: "?",
        quality: "HD",
        showType: item.format
      }
    }));
  } catch (err) {
    console.error("Error fetching search results from AniList:", err);
    return [];
  }
};

export default getSearch;
