import axios from "axios";

export default async function getStreamInfo(linkId) {
  const api_url = import.meta.env.VITE_API_URL;
  try {
    const response = await axios.get(`${api_url}/source/${linkId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching stream info:", error);
    throw error;
  }
}
