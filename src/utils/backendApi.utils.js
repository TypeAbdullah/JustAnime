import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "";
const TOKEN_KEY = "justanime_session_token";
const USER_KEY = "justanime_user";

export const getSessionToken = () => localStorage.getItem(TOKEN_KEY);

export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
};

export const setSession = ({ token, user }) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const backend = axios.create({
  baseURL: API_URL,
});

backend.interceptors.request.use((config) => {
  const token = getSessionToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function registerUser(payload) {
  const { data } = await backend.post("/v1/auth/register", payload);
  setSession(data);
  return data;
}

export async function loginUser(payload) {
  const { data } = await backend.post("/v1/auth/login", payload);
  setSession(data);
  return data;
}

export async function logoutUser() {
  try {
    await backend.post("/v1/auth/logout");
  } finally {
    clearSession();
  }
}

export async function getCurrentUser() {
  const { data } = await backend.get("/v1/users/me");
  if (data?.user) setSession({ user: data.user });
  return data.user;
}

export async function saveStreamMemory(payload) {
  if (!getSessionToken()) return null;
  const { data } = await backend.post("/v1/users/me/streams", payload);
  return data.stream;
}

export async function getSavedStreams(limit = 100) {
  if (!getSessionToken()) return [];
  const { data } = await backend.get("/v1/users/me/streams", { params: { limit } });
  return data.streams || [];
}

export async function createDownloadToken(shareId) {
  const { data } = await backend.post(`/v1/download-token/${shareId}`);
  return data;
}
