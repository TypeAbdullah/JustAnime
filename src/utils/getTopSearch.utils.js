import { fetchAniListHome } from "./anilist.utils";

const getTopSearch = async () => {
  try {
    const storedData = localStorage.getItem("topSearch_anilist_v2");
    if (storedData) {
      const { data, timestamp } = JSON.parse(storedData);
      if (Date.now() - timestamp <= 24 * 60 * 60 * 1000) {
        return data;
      }
    }

    const alData = await fetchAniListHome();
    if (!alData || !alData.popular) return [];
    const results = (alData.popular.media || []).map((item) => ({
      id: item.id,
      title: item.title.userPreferred || item.title.romaji || item.title.english,
      poster: item.coverImage.large,
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

    if (results.length) {
      localStorage.setItem(
        "topSearch_anilist_v2",
        JSON.stringify({ data: results, timestamp: Date.now() })
      );
      return results;
    }
    return [];
  } catch (error) {
    console.error("Error fetching top search data from AniList:", error);
    return [];
  }
};

export default getTopSearch;
