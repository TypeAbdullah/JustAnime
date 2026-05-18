import { fetchAniListHome } from "./anilist.utils";

const CACHE_KEY = "homeInfoCache_anilist_v7";
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes for fresh data

export default async function getHomeInfo() {
  const currentTime = Date.now();
  const cachedData = JSON.parse(localStorage.getItem(CACHE_KEY));

  if (cachedData && currentTime - cachedData.timestamp < CACHE_DURATION) {
    return cachedData.data;
  }

  try {
    const alData = await fetchAniListHome();
    
    const mapMedia = (item) => ({
      id: item.id,
      slug: item.id.toString(),
      ani_id: item.id,
      title: item.title.userPreferred || item.title.romaji || item.title.english,
      poster: item.coverImage.extraLarge || item.coverImage.large,
      banner: item.bannerImage,
      description: item.description,
      type: item.format,
      episodes: {
        sub: item.episodes || 0,
        dub: 0
      },
      status: item.status,
      score: item.averageScore / 10,
      genres: item.genres,
      trailer: item.trailer?.site === "youtube" ? item.trailer.id : null,
      tvInfo: {
        sub: item.episodes || "?",
        dub: "?",
        quality: "HD",
        showType: item.format
      }
    });

    const trending = (alData.trending.media || []).map(mapMedia);
    const popular = (alData.popular.media || []).map(mapMedia);
    const thisSeason = (alData.thisSeason?.media || []).map(mapMedia);
    const topRated = (alData.topRated?.media || []).map(mapMedia);
    const upcoming = (alData.upcoming?.media || []).map(mapMedia);
    console.log("Fetched Upcoming Anime Count:", upcoming.length);
    
    const latestEpisodes = (alData.latest.airingSchedules || [])
      .filter(sched => sched.media)
      .map(sched => ({
        ...mapMedia(sched.media),
        episode_no: sched.episode,
        airingAt: sched.airingAt,
        tvInfo: {
          sub: sched.episode,
          dub: "?",
          quality: "HD",
          showType: sched.media.format
        }
      }));

    const spotlights = trending.filter(item => item.trailer).slice(0, 5);
    const finalSpotlights = spotlights.length > 0 ? spotlights : trending.slice(0, 5);

    const dataToCache = {
      data: {
        spotlights: finalSpotlights,
        trending: trending,
        latest_episode: latestEpisodes,
        topten: popular.slice(0, 10),
        most_popular: popular,
        most_favorite: popular,
        latest_completed: topRated,
        top_upcoming: upcoming,
        recently_added: [],
        top_airing: thisSeason,
        genres: [],
      },
      timestamp: currentTime,
    };

    localStorage.setItem(CACHE_KEY, JSON.stringify(dataToCache));
    return dataToCache.data;
  } catch (error) {
    console.error("Error fetching AniList home info:", error);
    return null;
  }
}
