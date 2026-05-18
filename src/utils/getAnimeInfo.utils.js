import { fetchAniListInfo } from "./anilist.utils";
import axios from "axios";

const mapAnimeData = (alData) => ({
  id: alData.id,
  ani_id: alData.id,
  mal_id: alData.idMal,
  title: alData.title.userPreferred || alData.title.romaji || alData.title.english,
  japanese_title: alData.title.native,
  poster: alData.coverImage.extraLarge || alData.coverImage.large,
  banner: alData.bannerImage,
  description: alData.description,
  type: alData.format,
  status: alData.status,
  score: alData.averageScore / 10,
  sub_episodes: alData.episodes || 0,
  dub_episodes: 0,
  trailer: alData.trailer?.site === "youtube" ? alData.trailer.id : null,
  animeInfo: {
    Overview: alData.description,
    tvInfo: {
      rating: alData.isAdult ? "R+" : "PG-13",
      quality: "HD",
      sub: alData.episodes || 0,
      dub: 0,
    },
    Status: alData.status,
    Japanese: alData.title.native,
    Aired: `${alData.startDate.year}-${alData.startDate.month}-${alData.startDate.day}`,
    Premiered: `${alData.season} ${alData.seasonYear}`,
    Duration: `${alData.duration} min`,
    "MAL Score": alData.averageScore / 10,
    "Mean Score": alData.meanScore / 10,
    Source: alData.source,
    Genres: alData.genres,
    Tags: alData.tags?.map(t => t.name) || [],
    Studios: alData.studios.edges.map(e => e.node.name).join(", "),
    Producers: [],
    External: alData.externalLinks || [],
    NextAiring: alData.nextAiringEpisode,
  },
  related_data: alData.relations.edges.map(e => ({
    id: e.node.id,
    title: e.node.title.userPreferred,
    poster: e.node.coverImage.large,
    banner: e.node.bannerImage,
    type: e.node.format,
    season: e.node.season,
    year: e.node.seasonYear,
    relation: e.relationType
  })),
  recommended_data: alData.recommendations.edges.map(e => ({
    id: e.node.mediaRecommendation.id,
    title: e.node.mediaRecommendation.title.userPreferred,
    poster: e.node.mediaRecommendation.coverImage.large,
    banner: e.node.mediaRecommendation.bannerImage,
    type: e.node.mediaRecommendation.format,
    season: e.node.mediaRecommendation.season,
    year: e.node.mediaRecommendation.seasonYear
  })),
  charactersVoiceActors: alData.characters.edges.map(e => ({
    character: {
      id: e.node.id,
      name: e.node.name.full,
      poster: e.node.image.large,
      cast: e.role
    },
    voiceActors: e.voiceActors.map(va => ({
      id: va.id,
      name: va.name.full,
      poster: va.image.large
    }))
  })),
  streamingEpisodes: alData.streamingEpisodes || []
});

export default async function fetchAnimeInfo(id, random = false) {
  const api_url = import.meta.env.VITE_LEGACY_API_URL || import.meta.env.VITE_API_URL;
  try {
    let aniId = id;
    if (random) {
      const idResponse = await axios.get(`${api_url}/random/id`);
      aniId = idResponse.data.results;
    }

    const alData = await fetchAniListInfo(aniId);
    if (!alData || !alData.Media) return null;

    return {
      data: mapAnimeData(alData.Media),
      seasons: []
    };
  } catch (error) {
    console.error("Error fetching anime info from AniList:", error);
    throw error;
  }
}
