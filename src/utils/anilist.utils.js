import axios from "axios";

const ANILIST_API_URL = "https://graphql.anilist.co";

const graphqlQuery = async (query, variables = {}) => {
  try {
    const response = await axios.post(ANILIST_API_URL, {
      query,
      variables,
    });
    if (response.data.errors) {
      const errorMsg = JSON.stringify(response.data.errors, null, 2);
      console.error("AniList API Errors Details:", errorMsg);
      throw new Error(response.data.errors[0].message);
    }
    return response.data.data;
  } catch (error) {
    const errorDetail = error.response?.data ? JSON.stringify(error.response.data, null, 2) : error.message;
    console.error("AniList API Error Details:", errorDetail);
    throw error;
  }
};

export const ANILIST_QUERIES = {
  GET_HOME: `
    query ($page: Int, $perPage: Int, $airingAt_lesser: Int, $season: MediaSeason, $seasonYear: Int) {
      trending: Page(page: $page, perPage: $perPage) {
        media(sort: TRENDING_DESC, type: ANIME, isAdult: false) {
          ...mediaFields
        }
      }
      popular: Page(page: $page, perPage: $perPage) {
        media(sort: POPULARITY_DESC, type: ANIME, isAdult: false) {
          ...mediaFields
        }
      }
      thisSeason: Page(page: $page, perPage: $perPage) {
        media(season: $season, seasonYear: $seasonYear, sort: POPULARITY_DESC, type: ANIME, isAdult: false) {
          ...mediaFields
        }
      }
      topRated: Page(page: $page, perPage: $perPage) {
        media(sort: SCORE_DESC, type: ANIME, isAdult: false) {
          ...mediaFields
        }
      }
      latest: Page(page: $page, perPage: 50) {
        airingSchedules(airingAt_lesser: $airingAt_lesser, sort: TIME_DESC) {
          episode
          media {
            ...mediaFields
          }
        }
      }
      upcoming: Page(page: $page, perPage: $perPage) {
        media(status: NOT_YET_RELEASED, sort: POPULARITY_DESC, type: ANIME, isAdult: false) {
          ...mediaFields
        }
      }
    }
    fragment mediaFields on Media {
      id
      title {
        romaji
        english
        native
        userPreferred
      }
      coverImage {
        extraLarge
        large
      }
      bannerImage
      description
      status
      episodes
      trailer {
        id
        site
      }
      nextAiringEpisode {
        airingAt
        episode
      }
      averageScore
      format
      genres
    }
  `,
  SEARCH: `
    query ($search: String, $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(search: $search, type: ANIME, isAdult: false) {
          id
          title {
            userPreferred
          }
          coverImage {
            large
          }
          format
          episodes
          status
          averageScore
        }
      }
    }
  `,
  GET_INFO: `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        id
        idMal
        title {
          romaji
          english
          native
          userPreferred
        }
        coverImage {
          extraLarge
          large
        }
        bannerImage
        startDate {
          year
          month
          day
        }
        description
        status
        episodes
        duration
        trailer {
          id
          site
        }
        genres
        averageScore
        meanScore
        source
        tags {
          name
        }
        externalLinks {
          url
          site
        }
        isAdult
        nextAiringEpisode {
          airingAt
          episode
        }
        characters(sort: [ROLE, RELEVANCE, ID], perPage: 25) {
          edges {
            role
            node {
              id
              name {
                full
              }
              image {
                large
              }
            }
            voiceActors(language: JAPANESE) {
              id
              name {
                full
              }
              image {
                large
              }
            }
          }
        }
        recommendations {
          edges {
            node {
              mediaRecommendation {
                id
                title {
                  userPreferred
                }
                coverImage {
                  large
                }
                bannerImage
                format
                season
                seasonYear
                episodes
                status
                averageScore
              }
            }
          }
        }
        relations {
          edges {
            relationType
            node {
              id
              title {
                userPreferred
              }
              coverImage {
                large
              }
              bannerImage
              format
              season
              seasonYear
              episodes
              status
              averageScore
            }
          }
        }
        studios(isMain: true) {
          edges {
            node {
              name
            }
          }
        }
        streamingEpisodes {
          title
          thumbnail
          url
          site
        }
      }
    }
  `,
  GET_SCHEDULE: `
    query ($weekStart: Int, $weekEnd: Int) {
      Page(page: 1, perPage: 50) {
        airingSchedules(airingAt_greater: $weekStart, airingAt_lesser: $weekEnd) {
          airingAt
          episode
          media {
            id
            title {
              userPreferred
            }
            coverImage {
              large
            }
            format
          }
        }
      }
    }
  `,
};

export const fetchAniListHome = async () => {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  const timestamp = Math.floor(now.getTime() / 1000);

  let season = "WINTER";
  if (month >= 3 && month <= 5) season = "SPRING";
  else if (month >= 6 && month <= 8) season = "SUMMER";
  else if (month >= 9 && month <= 11) season = "FALL";

  console.log(`Fetching AniList Home for Season: ${season}, Year: ${year}`);

  return await graphqlQuery(ANILIST_QUERIES.GET_HOME, { 
    page: 1, 
    perPage: 40, 
    airingAt_lesser: timestamp,
    season: season,
    seasonYear: year
  });
};

export const fetchAniListSearch = async (keyword, page = 1) => {
  return await graphqlQuery(ANILIST_QUERIES.SEARCH, { search: keyword, page, perPage: 20 });
};

export const fetchAniListInfo = async (id) => {
  return await graphqlQuery(ANILIST_QUERIES.GET_INFO, { id: parseInt(id) });
};

export const fetchAniListSchedule = async () => {
  const now = Math.floor(Date.now() / 1000);
  const weekStart = now - (now % 604800);
  const weekEnd = weekStart + 604800;
  return await graphqlQuery(ANILIST_QUERIES.GET_SCHEDULE, { weekStart, weekEnd });
};

export const fetchAniListCategory = async (sort, status, page = 1) => {
  const query = `
    query ($sort: [MediaSort], $status: MediaStatus, $genre: String, $format: MediaFormat, $page: Int) {
      Page(page: $page, perPage: 20) {
        media(sort: $sort, status: $status, genre: $genre, format: $format, type: ANIME, isAdult: false) {
          id
          title {
            userPreferred
          }
          coverImage {
            large
          }
          format
          episodes
          status
          averageScore
          genres
        }
      }
    }
  `;
  const variables = { sort, status, page };
  if (!status) delete variables.status;
  return await graphqlQuery(query, variables);
};
