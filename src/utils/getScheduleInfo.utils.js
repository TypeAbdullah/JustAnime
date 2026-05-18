import axios from "axios";
import { ANILIST_QUERIES } from "./anilist.utils";

const ANILIST_API_URL = "https://graphql.anilist.co";

export default async function getSchedInfo(dateStr) {
  try {
    // Parse the date as local time
    const [year, month, day] = dateStr.split('-').map(Number);
    const localDate = new Date(year, month - 1, day);
    
    const startOfDay = Math.floor(localDate.setHours(0, 0, 0, 0) / 1000);
    const endOfDay = Math.floor(localDate.setHours(23, 59, 59, 999) / 1000);

    const response = await axios.post(ANILIST_API_URL, {
      query: ANILIST_QUERIES.GET_SCHEDULE,
      variables: {
        weekStart: startOfDay,
        weekEnd: endOfDay,
      },
    });

    const schedules = response.data.data.Page.airingSchedules || [];

    return schedules.map((item) => ({
      id: item.media.id,
      title: item.media.title.userPreferred || item.media.title.romaji || item.media.title.english,
      time: new Date(item.airingAt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      episode_no: item.episode,
      image: item.media.coverImage.large,
    }));
  } catch (error) {
    console.error("Error fetching schedule from AniList:", error);
    return [];
  }
}
