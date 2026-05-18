import { fetchAniListCategory } from "./anilist.utils";
import axios from "axios";

const ANILIST_API_URL = "https://graphql.anilist.co";

const getCategoryInfo = async (path, page = 1) => {
  try {
    let sort = ["TRENDING_DESC", "POPULARITY_DESC"];
    let status = null;
    let genre = null;
    let format = null;

    if (path.startsWith("genre/")) {
      genre = path.replace("genre/", "");
      // Capitalize first letter or map correctly
      genre = genre.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    } else {
      switch (path) {
        case "trending":
          sort = ["TRENDING_DESC"];
          break;
        case "most-popular":
          sort = ["POPULARITY_DESC"];
          break;
        case "top-airing":
          sort = ["SCORE_DESC"];
          status = "RELEASING";
          break;
        case "recently-updated":
          sort = ["UPDATED_AT_DESC"];
          break;
        case "top-upcoming":
          sort = ["POPULARITY_DESC"];
          status = "NOT_YET_RELEASED";
          break;
        case "movie":
          format = "MOVIE";
          break;
        case "special":
          format = "SPECIAL";
          break;
        case "ova":
          format = "OVA";
          break;
        case "ona":
          format = "ONA";
          break;
        case "tv":
          format = "TV";
          break;
        default:
          sort = ["TRENDING_DESC"];
      }
    }

    const query = `
      query ($sort: [MediaSort], $status: MediaStatus, $genre: String, $format: MediaFormat, $page: Int) {
        Page(page: $page, perPage: 20) {
          media(sort: $sort, status: $status, genre: $genre, format: $format, type: ANIME) {
            id
            title {
              userPreferred
              romaji
              english
            }
            coverImage {
              large
              extraLarge
            }
            bannerImage
            format
            episodes
            status
            averageScore
            genres
          }
        }
      }
    `;

    const variables = { sort, status, genre, format, page };
    // Remove null keys
    Object.keys(variables).forEach(key => variables[key] === null && delete variables[key]);

    const response = await axios.post(ANILIST_API_URL, { query, variables });
    const alData = response.data.data;
    
    return (alData.Page.media || []).map((item) => ({
      id: item.id,
      slug: item.id.toString(),
      ani_id: item.id,
      title: item.title.userPreferred || item.title.romaji || item.title.english,
      poster: item.coverImage.extraLarge || item.coverImage.large,
      banner: item.bannerImage,
      type: item.format,
      episodes: {
        sub: item.episodes || 0,
        dub: 0
      },
      status: item.status,
      score: item.averageScore / 10,
      genres: item.genres,
      tvInfo: {
        sub: item.episodes || "?",
        dub: "?",
        quality: "HD",
        showType: item.format
      }
    }));
  } catch (err) {
    console.error("Error fetching category info from AniList:", err);
    return [];
  }
};

export default getCategoryInfo;
