/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useRef } from "react";
import getAnimeInfo from "@/src/utils/getAnimeInfo.utils";
import getEpisodes from "@/src/utils/getEpisodes.utils";
import getNextEpisodeSchedule from "../utils/getNextEpisodeSchedule.utils";
import getServers from "../utils/getServers.utils";
import getStreamInfo from "../utils/getStreamInfo.utils";
import {
  getPaheSession,
  getPaheEpisodes,
  getPaheEpisodeSession,
  getPaheStreamingLinks,
  buildPaheServers,
  resolveM3u8
} from "../utils/pahe.utils";
import getSafeTitle from "../utils/getSafetitle";
import { fetchTmdbEpisodes, lookupAnimeIds } from "../utils/tmdb.utils";
import { getSessionToken, saveStreamMemory } from "../utils/backendApi.utils";

const PAHE_API_URL = import.meta.env.VITE_PAHE_API_URL || "";
const WORKER_PROXY = import.meta.env.VITE_WORKER_PROXY || "";

const getEpisodeNumberFromId = (id) => {
  if (!id) return null;
  const value = String(id).replace(/^ep=/, "");
  const match = value.match(/(\d+)$/);
  return match ? Number(match[1]) : null;
};

const buildNumberedEpisodes = (count) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `ep=${i + 1}`,
    episode_no: i + 1,
    title: `Episode ${i + 1}`,
    number: i + 1,
    isFiller: false,
    synthetic: true,
    source: "pahe",
  }));
};

const buildPaheEpisodesFromApi = (paheEpisodes) => {
  return paheEpisodes
    .map((ep, index) => {
      const number = Number(ep.number || ep.episode || index + 1);
      if (!number) return null;

      return {
        ...ep,
        id: `ep=${number}`,
        episode_no: number,
        title: ep.title || `Episode ${number}`,
        number,
        isFiller: false,
        source: "pahe",
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.episode_no - b.episode_no);
};

export const useWatch = (animeId, initialEpisodeId) => {
  const [error, setError] = useState(null);
  const [buffering, setBuffering] = useState(true);
  const [streamInfo, setStreamInfo] = useState(null);
  const [animeInfo, setAnimeInfo] = useState(null);
  const [episodes, setEpisodes] = useState(null);
  const [animeInfoLoading, setAnimeInfoLoading] = useState(false);
  const [totalEpisodes, setTotalEpisodes] = useState(null);
  const [seasons, setSeasons] = useState(null);
  const [servers, setServers] = useState(null);
  const [streamUrl, setStreamUrl] = useState(null);
  const [activeServer, setActiveServer] = useState(null);
  const [isFullOverview, setIsFullOverview] = useState(false);
  const [subtitles, setSubtitles] = useState([]);
  const [thumbnail, setThumbnail] = useState(null);
  const [intro, setIntro] = useState(null);
  const [outro, setOutro] = useState(null);
  const [episodeId, setEpisodeId] = useState(null);
  const [activeEpisodeNum, setActiveEpisodeNum] = useState(null);
  const [activeServerId, setActiveServerId] = useState(null);
  const [activeServerType, setActiveServerType] = useState(null);
  const [activeServerName, setActiveServerName] = useState(null);
  const [serverLoading, setServerLoading] = useState(true);
  const [nextEpisodeSchedule, setNextEpisodeSchedule] = useState(null);

  // --- Multi-source state ---
  const [activeSource, setActiveSource] = useState(
    () => localStorage.getItem("active_source") || "default"
  );
  const [paheSession, setPaheSession] = useState(null);
  const [paheLoading, setPaheLoading] = useState(false);
  const [paheAvailable, setPaheAvailable] = useState(true);
  const [malMetadata, setMalMetadata] = useState(null);
  const [tmdbMetadata, setTmdbMetadata] = useState(null);

  const isServerFetchInProgress = useRef(false);
  const isStreamFetchInProgress = useRef(false);
  const hasFetchedMal = useRef(false);
  const hasFetchedTmdb = useRef(false);
  const persistedMalData = useRef(null);
  const persistedTmdbData = useRef(null);

  // Persist source preference
  useEffect(() => {
    localStorage.setItem("active_source", activeSource);
  }, [activeSource]);

  useEffect(() => {
    setEpisodes(null);
    setEpisodeId(null);
    setActiveEpisodeNum(null);
    setServers(null);
    setActiveServerId(null);
    setActiveServer(null);
    setStreamInfo(null);
    setStreamUrl(null);
    setSubtitles([]);
    setThumbnail(null);
    setIntro(null);
    setOutro(null);
    setBuffering(true);
    setServerLoading(true);
    setError(null);
    setAnimeInfo(null);
    setSeasons(null);
    setTotalEpisodes(null);
    setAnimeInfoLoading(true);
    setPaheSession(null);
    setPaheAvailable(true);
    isServerFetchInProgress.current = false;
    isStreamFetchInProgress.current = false;
    hasFetchedMal.current = false;
    hasFetchedTmdb.current = false;
    setMalMetadata(null);
    setTmdbMetadata(null);
  }, [animeId]);

  useEffect(() => {
    const fetchInitialData = async () => {
      setAnimeInfoLoading(true);
      setError(null);

      let animeData = null;

      try {
        // Fetch Anime Info
        try {
          animeData = await getAnimeInfo(animeId, false);
          setAnimeInfo(animeData?.data);
          setSeasons(animeData?.seasons);
        } catch (infoErr) {
          console.warn("Failed to fetch anime info metadata:", infoErr);
          // Don't set global error yet, we want to try fetching episodes
        }

        const initialEpisodeNumber = getEpisodeNumberFromId(initialEpisodeId);

        // Fetch Episodes from anime-kai
        const ani_id = animeId;
        const episodesData = await getEpisodes(ani_id);

        if (episodesData?.episodes && episodesData.episodes.length > 0) {
          setEpisodes(episodesData.episodes);
          setTotalEpisodes(episodesData.totalEpisodes);

          const newEpisodeId =
            initialEpisodeId ||
            episodesData.episodes[0].id.match(/ep=(.+)/)?.[1];
          setEpisodeId(newEpisodeId);
        } else {
          let paheFallbackEpisodes = [];
          const title = getSafeTitle(
            animeData?.data?.title,
            "EN",
            animeData?.data?.japanese_title
          );

          if (title) {
            const sessionData = await getPaheSession(animeId, title);
            if (sessionData?.session) {
              setPaheSession(sessionData);
              setPaheAvailable(true);
              const paheEpisodes = await getPaheEpisodes(animeId, sessionData.session);
              paheFallbackEpisodes = buildPaheEpisodesFromApi(paheEpisodes);
            }
          }

          if (paheFallbackEpisodes.length > 0) {
            setEpisodes(paheFallbackEpisodes);
            setTotalEpisodes(paheFallbackEpisodes.length);

            const requestedEpisode = paheFallbackEpisodes.find(
              (episode) => episode.episode_no === initialEpisodeNumber
            );
            const newEpisodeId =
              requestedEpisode?.id.match(/ep=(.+)/)?.[1] ||
              paheFallbackEpisodes[0].id.match(/ep=(.+)/)?.[1];

            setEpisodeId(newEpisodeId);
            setActiveSource("pahe");
            return;
          }
          // anime-kai returned 0 episodes — check AniList episode count
          const aniListEpCount = animeData?.data?.sub_episodes || animeData?.data?.animeInfo?.tvInfo?.sub || 0;

          if (aniListEpCount > 0) {
            // Generate synthetic episode list from AniList count
            const syntheticEpisodes = buildNumberedEpisodes(aniListEpCount);

            setEpisodes(syntheticEpisodes);
            setTotalEpisodes(aniListEpCount);

            const requestedEpisode = syntheticEpisodes.find(
              (episode) => episode.episode_no === initialEpisodeNumber
            );
            const newEpisodeId =
              requestedEpisode?.id.match(/ep=(.+)/)?.[1] ||
              syntheticEpisodes[0].id.match(/ep=(.+)/)?.[1];
            setEpisodeId(newEpisodeId);

            // Auto-switch to Pahe since default source can't stream these
            setActiveSource("pahe");
          } else {
            throw new Error("No episodes found for this anime.");
          }
        }

      } catch (err) {
        console.error("Error fetching initial watch data:", err);
        setError(err.message || "An error occurred.");
      } finally {
        setAnimeInfoLoading(false);
        setBuffering(false);
      }
    };
    fetchInitialData();
  }, [animeId]);

  // Resolve Pahe session when animeInfo is available
  useEffect(() => {
    if (!animeInfo) return;
    const resolveSession = async () => {
      try {
        const title = getSafeTitle(animeInfo.title, "EN", animeInfo.japanese_title);
        const sessionData = await getPaheSession(animeId, title);
        if (sessionData) {
          setPaheSession(sessionData);
          setPaheAvailable(true);
        } else {
          setPaheAvailable(false);
          if (activeSource === "pahe") {
            // If we're stuck on pahe but no session, try fallback to default
            setActiveSource("default");
          }
        }
      } catch (err) {
        console.warn("Could not resolve Pahe session:", err);
        setPaheAvailable(false);
        if (activeSource === "pahe") {
          setActiveSource("default");
        }
      } finally {
        // If we are on pahe and it failed, we need to clear buffering so the error/fallback shows
        if (activeSource === "pahe" && !paheAvailable) {
          setBuffering(false);
        }
      }
    };
    resolveSession();
  }, [animeInfo, animeId, activeSource]);

  useEffect(() => {
    const fetchNextEpisodeScheduleData = async () => {
      try {
        const data = await getNextEpisodeSchedule(animeId);
        setNextEpisodeSchedule(data);
      } catch (err) {
        console.error("Error fetching next episode schedule:", err);
      }
    };
    fetchNextEpisodeScheduleData();
  }, [animeId]);  // Effect to fetch external metadata (runs once per anime)
  useEffect(() => {
    if (!animeInfo) return;
    const anilistId = Number(animeInfo.ani_id || animeId);
    let malId = animeInfo.idMal || animeInfo.mal_id;

    const fetchMetadata = async () => {
      // 0. Resolve missing MAL ID
      if (anilistId && !malId) {
        try {
          const mapping = await lookupAnimeIds(anilistId);
          if (mapping?.malId) malId = mapping.malId;
        } catch (e) { console.warn("Mapping failed", e); }
      }

      // 1. Fetch MAL (Jikan)
      if (malId && !hasFetchedMal.current) {
        try {
          const res = await fetch(`https://api.jikan.moe/v4/anime/${malId}/episodes`);
          if (res.status === 200) {
            const data = await res.json();
            if (data?.data) setMalMetadata(data.data);
            hasFetchedMal.current = true;
          } else if (res.status !== 429) {
            hasFetchedMal.current = true; // Don't retry non-429 errors
          }
        } catch (e) { console.warn("MAL fetch failed", e); }
      }

      // 2. Fetch TMDB
      if (anilistId && !hasFetchedTmdb.current) {
        try {
          const title = getSafeTitle(animeInfo.title, "EN", animeInfo.japanese_title);
          const data = await fetchTmdbEpisodes(anilistId, title);
          if (data) setTmdbMetadata(data);
          hasFetchedTmdb.current = true;
        } catch (e) { console.warn("TMDB fetch failed", e); }
      }
    };

    fetchMetadata();
  }, [animeInfo, animeId]);

  // Effect to apply metadata whenever episodes OR metadata changes
  useEffect(() => {
    if (!episodes || episodes.length === 0 || (!malMetadata && !tmdbMetadata)) return;

    setEpisodes(prev => {
      if (!prev) return prev;
      let changed = false;
      const updated = prev.map(ep => {
        let newTitle = ep.title;
        let newThumbnail = ep.thumbnail;
        let titleChanged = false;
        let thumbChanged = false;

        // Priority 1: MAL for Titles
        if (malMetadata) {
          const match = malMetadata.find(m => m.mal_id === ep.episode_no) || malMetadata[ep.episode_no - 1];
          if (match && match.title && !match.title.match(/^Episode \d+$/i)) {
            if (newTitle !== match.title) {
              newTitle = match.title;
              titleChanged = true;
            }
          }
        }

        // Priority 2: TMDB for Thumbnails (and fallback titles)
        if (tmdbMetadata) {
          const match = tmdbMetadata.find(t => t.number === ep.episode_no);
          if (match) {
            if (match.thumbnail && newThumbnail !== match.thumbnail) {
              newThumbnail = match.thumbnail;
              thumbChanged = true;
            }
            if (match.title && (!newTitle || newTitle.match(/^Episode \d+$/i)) && match.title !== newTitle) {
              newTitle = match.title;
              titleChanged = true;
            }
          }
        }

        if (titleChanged || thumbChanged) {
          changed = true;
          return { ...ep, title: newTitle, thumbnail: newThumbnail };
        }
        return ep;
      });

      return changed ? updated : prev;
    });
  }, [malMetadata, tmdbMetadata, episodes?.length]); // Only run when metadata arrives or episode count changes
;

  useEffect(() => {
    if (!episodes || !episodeId) {
      setActiveEpisodeNum(null);
      return;
    }
    const activeEpisode = episodes.find((episode) => {
      const match = episode.id.match(/ep=(.+)/);
      return match && match[1] === episodeId;
    });

    // Reset stream state when episode changes
    setStreamUrl(null);
    setStreamInfo(null);
    setBuffering(true);
    setServers(null);
    setActiveServerId(null);
    setActiveServer(null);
    setError(null);
    isServerFetchInProgress.current = false;
    isStreamFetchInProgress.current = false;

    const newActiveEpisodeNum = activeEpisode ? activeEpisode.episode_no : null;
    if (activeEpisodeNum !== newActiveEpisodeNum) {
      setActiveEpisodeNum(newActiveEpisodeNum);
    }
  }, [episodeId, episodes]);

  // ===== DEFAULT SOURCE: Fetch servers =====
  useEffect(() => {
    if (activeSource !== "default") return;
    if (!episodeId || !episodes || isServerFetchInProgress.current) return;

    let mounted = true;
    const controller = new AbortController();
    isServerFetchInProgress.current = true;
    setServerLoading(true);

    const fetchServers = async () => {
      try {
        const data = await getServers(animeId, episodeId, { signal: controller.signal });
        if (!mounted) return;

        const filteredServers = data || [];
        let serversList = [...filteredServers];

        const savedServerName = localStorage.getItem("server_name");
        const savedServerType = localStorage.getItem("server_type");

        const initialServer =
          serversList.find(s => s.serverName === savedServerName && s.type === savedServerType) ||
          serversList.find(s => s.serverName === savedServerName) ||
          serversList.find(s => s.serverName === "HD-2") ||
          serversList.find(
            s =>
              s.type === savedServerType &&
              ["HD-1", "HD-2", "HD-3", "HD-4", "Vidstreaming", "Vidcloud", "DouVideo"].includes(s.serverName)
          ) ||
          serversList[0];

        setServers(serversList);
        setActiveServer(initialServer || null);
        setActiveServerType(initialServer?.type);
        setActiveServerName(initialServer?.serverName);
        setActiveServerId(initialServer?.data_id);
      } catch (err) {
        if (err?.name === "AbortError") return;
        console.error("Error fetching servers:", err);
        if (mounted) setError(err.message || "An error occurred.");
      } finally {
        if (mounted) {
          setServerLoading(false);
          isServerFetchInProgress.current = false;
        }
      }
    };

    fetchServers();

    return () => {
      mounted = false;
      try { controller.abort(); } catch (e) {
        // console.log(e.message);
      }
      isServerFetchInProgress.current = false;
    };
  }, [episodeId, episodes, activeSource]);

  // ===== PAHE SOURCE: Fetch servers =====
  useEffect(() => {
    if (activeSource !== "pahe") return;
    if (!episodeId || !episodes || !paheSession?.session || !activeEpisodeNum) return;

    let mounted = true;
    setPaheLoading(true);
    setServerLoading(true);
    setBuffering(true);

    const fetchPaheStream = async () => {
      try {
        // Get the Pahe episode session for this episode number
        const epSession = await getPaheEpisodeSession(
          animeId,
          paheSession.session,
          activeEpisodeNum
        );

        if (!epSession) {
          if (mounted) {
            setServers([]);
            setServerLoading(false);
            setPaheLoading(false);
            setBuffering(false);
            setError(`Episode ${activeEpisodeNum} not found on Pahe`);
          }
          return;
        }

        // Get streaming links (array of sources)
        const streamData = await getPaheStreamingLinks(paheSession.session, epSession);

        if (!mounted) return;

        if (streamData && Array.isArray(streamData)) {
          const paheServers = buildPaheServers(streamData);
          if (mounted) {
            setServers(paheServers);
            // Always ensure a valid Pahe server is selected when switching to Pahe
            const isCurrentServerValid = paheServers.some(s => s.data_id === activeServerId);
            if (paheServers.length > 0 && (!activeServerId || !isCurrentServerValid)) {
              setActiveServerId(paheServers[0].data_id);
              setActiveServerType(paheServers[0].type);
              setActiveServerName(paheServers[0].serverName);
            }
          }
        } else {
          if (mounted) {
            setServers([]);
            setError("No sources found on Pahe");
          }
        }
      } catch (err) {
        console.error("Error fetching Pahe stream:", err);
        if (mounted) setError(err.message || "Pahe stream error");
      } finally {
        if (mounted) {
          setServerLoading(false);
          setPaheLoading(false);
          setBuffering(false);
          isServerFetchInProgress.current = false;
        }
      }
    };

    fetchPaheStream();

    return () => {
      mounted = false;
    };
  }, [episodeId, episodes, activeSource, paheSession, activeEpisodeNum]);

  // ===== PAHE: Resolve M3U8 on server selection =====
  useEffect(() => {
    if (activeSource !== "pahe" || !activeServerId || !servers) return;

    const activeServer = servers.find((s) => s.data_id === activeServerId);
    if (!activeServer || activeServer.source !== "pahe" || !activeServer.kwikUrl) return;

    let mounted = true;
    setBuffering(true);

    const resolvePaheStream = async () => {
      try {
        console.log(`Pahe: Resolving M3U8 for ${activeServer.serverName} (${activeServer.kwikUrl})...`);
        const resolved = await resolveM3u8(activeServer.kwikUrl);
        if (mounted && (resolved?.m3u8 || resolved?.proxy_url)) {
          let finalUrl = "";

          if (WORKER_PROXY) {
            // Use the high-performance Cloudflare Worker Proxy
            const referer = resolved.referer || 'https://kwik.cx/';
            const directM3u8 = resolved.m3u8;
            finalUrl = `${WORKER_PROXY}?url=${encodeURIComponent(directM3u8)}&referer=${encodeURIComponent(referer)}`;
            console.log("Pahe: Using Worker Proxy:", finalUrl);
          } else {
            // Fallback to the Vercel API proxy
            finalUrl = resolved.proxy_url
              ? (resolved.proxy_url.startsWith('http') ? resolved.proxy_url : `${PAHE_API_URL}${resolved.proxy_url}`)
              : resolved.m3u8;

            if (finalUrl.includes('referer=')) {
              const baseReferer = encodeURIComponent('https://kwik.cx/');
              finalUrl = finalUrl.replace(/referer=[^&]+/, `referer=${baseReferer}`);
            }
            console.log("Pahe: Using API Proxy:", finalUrl);
          }

          setStreamUrl(finalUrl);
          setStreamInfo({
            url: finalUrl,
            directUrl: resolved.m3u8,
            referer: resolved.referer,
            headers: resolved.headers
          });
          setSubtitles([]);
          setThumbnail(null);
          setIntro(null);
          setOutro(null);
        } else if (mounted) {
          console.error("Pahe: Resolution failed, no URL returned", resolved);
          setError("Could not resolve Pahe video stream");
        }
      } catch (err) {
        console.error("Pahe Resolution Error:", err);
        if (mounted) setError("Pahe stream resolution failed");
      } finally {
        if (mounted) setBuffering(false);
      }
    };

    resolvePaheStream();

    return () => {
      mounted = false;
    };
  }, [activeServerId, servers, activeSource]);

  useEffect(() => {
    if (!servers || !activeServerId) return;
    const activeServer = servers.find((s) => s.data_id === activeServerId);
    if (activeServer) {
      setActiveServerName(activeServer.serverName);
      setActiveServerType(activeServer.type);
      setActiveServer(activeServer);
    }
  }, [activeServerId, servers]);

  // Fetch stream info only when episodeId, activeServerId, and servers are ready (DEFAULT source)
  useEffect(() => {
    if (activeSource !== "default") return;
    if (
      !episodeId ||
      !activeServerId ||
      !servers ||
      isServerFetchInProgress.current ||
      isStreamFetchInProgress.current
    )
      return;
    const iframeServers = [];
    // const iframeServers = ["hd-1", "hd-4", "vidstreaming", "vidcloud", "douvideo"];

    if (iframeServers.includes(activeServerName?.toLowerCase()) && !serverLoading) {
      setBuffering(false);
      return;
    }
    const fetchStreamInfo = async () => {
      isStreamFetchInProgress.current = true;
      setBuffering(true);
      try {
        const server = servers.find((srv) => srv.data_id === activeServerId);
        if (server) {
          const data = await getStreamInfo(server.data_id);
          setStreamInfo(data);
          setActiveServer(server);
          const stream = data?.streamingLink?.[0];
          setStreamUrl(stream?.link || stream?.file || null);
          setIntro(data?.intro || null);
          setOutro(data?.outro || null);
          const subtitles =
            data?.tracks
              ?.filter((track) => track.kind === "captions")
              .map(({ file, label, default: isDefault }) => ({ file, label, default: isDefault })) || [];
          setSubtitles(subtitles);
          const thumbnailTrack = data?.tracks?.find(
            (track) => track.kind === "thumbnails" && track.file
          );
          if (thumbnailTrack) setThumbnail(thumbnailTrack.file);
        } else {
          setError("No server found with the activeServerId.");
        }
      } catch (err) {
        console.error("Error fetching stream info:", err);
        setError(err.message || "An error occurred.");
      } finally {
        setBuffering(false);
        isStreamFetchInProgress.current = false;
      }
    };
    fetchStreamInfo();
  }, [episodeId, activeServerId, servers, activeSource]);

  // When source changes, reset stream state and re-trigger
  const handleSourceChange = (newSource) => {
    if (newSource === activeSource) return;
    setServers(null);
    setActiveServerId(null);
    setActiveServer(null);
    setStreamInfo(null);
    setStreamUrl(null);
    setSubtitles([]);
    setThumbnail(null);
    setIntro(null);
    setOutro(null);
    setBuffering(true);
    setServerLoading(true);
    setError(null);
    isServerFetchInProgress.current = false;
    isStreamFetchInProgress.current = false;
    setActiveSource(newSource);
  };

  useEffect(() => {
    if (!getSessionToken()) return;
    if (!streamUrl || !activeServer || !activeEpisodeNum) return;
    if (activeSource !== "default") return;

    const timeout = setTimeout(() => {
      saveStreamMemory({
        anime_id: Number(animeId),
        season: 1,
        episode: Number(activeEpisodeNum),
        quality: String(activeServer.quality || "").replace("p", "") || "auto",
        file_id: activeServer.file_id || activeServer.data_id,
        share_id: activeServer.share_id || null,
        stream_url: streamUrl,
        tracks_url: activeServer.tracks_url || null,
        file_name: activeServer.file_name || null,
        position: 0,
        anime_title: getSafeTitle(animeInfo?.title, "EN", animeInfo?.japanese_title),
      }).catch((err) => console.warn("Could not save stream memory:", err));
    }, 750);

    return () => clearTimeout(timeout);
  }, [streamUrl, activeServer, activeEpisodeNum, activeSource, animeId, animeInfo]);

  return {
    error,
    buffering,
    serverLoading,
    streamInfo,
    animeInfo,
    episodes,
    nextEpisodeSchedule,
    animeInfoLoading,
    totalEpisodes,
    seasons,
    servers,
    activeServer,
    streamUrl,
    isFullOverview,
    setIsFullOverview,
    subtitles,
    thumbnail,
    intro,
    outro,
    episodeId,
    setEpisodeId,
    activeEpisodeNum,
    setActiveEpisodeNum,
    activeServerId,
    setActiveServerId,
    activeServerType,
    setActiveServerType,
    activeServerName,
    setActiveServerName,
    // Multi-source
    activeSource,
    handleSourceChange,
    paheAvailable,
    paheLoading,
  };
};
