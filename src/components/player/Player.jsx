/* eslint-disable no-empty */
/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import Hls from "hls.js";
import { useEffect, useRef, useState, useMemo } from "react";
import Artplayer from "artplayer";
import artplayerPluginChapter from "./artPlayerPluinChaper";
import autoSkip from "./autoSkip";
import artplayerPluginVttThumbnail from "./artPlayerPluginVttThumbnail";
import {
  loadingIcon,
  playIconLg,
} from "./PlayerIcons";
import "./CustomPlayer.css";
import website_name from "@/src/config/website";
import getChapterStyles from "./getChapterStyle";
import artplayerPluginHlsControl from "artplayer-plugin-hls-control";
import artplayerPluginUploadSubtitle from "./artplayerPluginUploadSubtitle";
import { getTitle } from "@/src/utils/title.utils";
import { 
  Play, Pause, SkipForward, Volume2, VolumeX, Settings, 
  Maximize, Minimize, PictureInPicture, Airplay, 
  Mic, Music, Timer, Captions, Video, Monitor, SlidersHorizontal,
  ChevronLeft, ChevronRight, Check
} from "lucide-react";

Artplayer.LOG_VERSION = false;
Artplayer.CONTEXTMENU = false;
Artplayer.CONTROL_HEIGHT = 0; // Set control height to 0

const patchAacMainSourceBuffer = () => {
  const mediaSources = [
    window.MediaSource,
    window.WebKitMediaSource,
    window.ManagedMediaSource,
  ].filter((mediaSource, index, list) => {
    return mediaSource?.prototype?.addSourceBuffer && list.indexOf(mediaSource) === index;
  });

  const originals = mediaSources.map((mediaSource) => {
    const originalAddSourceBuffer = mediaSource.prototype.addSourceBuffer;

    mediaSource.prototype.addSourceBuffer = function addSourceBuffer(mimeType) {
      const patchedMimeType =
        typeof mimeType === "string"
          ? mimeType.replace(/mp4a\.40\.1/gi, "mp4a.40.2")
          : mimeType;
      return originalAddSourceBuffer.call(this, patchedMimeType);
    };

    return { mediaSource, originalAddSourceBuffer };
  });

  return () => {
    originals.forEach(({ mediaSource, originalAddSourceBuffer }) => {
      mediaSource.prototype.addSourceBuffer = originalAddSourceBuffer;
    });
  };
};

export default function Player({
  streamUrl,
  subtitles,
  thumbnail,
  intro,
  outro,
  autoSkipIntro,
  autoPlay,
  autoNext,
  episodeId,
  episodes,
  playNext,
  animeInfo,
  episodeNum,
  streamInfo,
  activeServerName,
  servers,
  activeServerId,
  setActiveServerId,
}) {
  const playerRootRef = useRef(null);
  const artRef = useRef(null);
  const [artInstance, setArtInstance] = useState(null);
  const leftAtRef = useRef(0);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [activeMenu, setActiveMenu] = useState("main"); // main, quality, server, speed
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPaused, setIsPaused] = useState(!autoPlay);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showStateIcon, setShowStateIcon] = useState(false);
  const [stateIconType, setStateIconType] = useState("play"); // play, pause

  const controlsTimeoutRef = useRef(null);

  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(
    episodes?.findIndex((episode) => episode.id.match(/ep=(.+)/)?.[1] === episodeId)
  );

  const activeServer = useMemo(() => servers?.find(s => s.data_id === activeServerId), [servers, activeServerId]);
  const isPahe = activeServer?.source === "pahe";
  const isDub = activeServer?.audio !== "jpn" && activeServer?.audio !== undefined;

  useEffect(() => {
    if (episodes?.length > 0) {
      const newIndex = episodes.findIndex(
        (episode) => episode.id.match(/ep=(.+)/)?.[1] === episodeId
      );
      setCurrentEpisodeIndex(newIndex);
    }
  }, [episodeId, episodes]);

  useEffect(() => {
    const applyChapterStyles = () => {
      const existingStyles = document.querySelectorAll("style[data-chapter-styles]");
      existingStyles.forEach((style) => style.remove());
      const styleElement = document.createElement("style");
      styleElement.setAttribute("data-chapter-styles", "true");
      const styles = getChapterStyles(intro, outro);
      styleElement.textContent = styles;
      document.head.appendChild(styleElement);
      return () => {
        styleElement.remove();
      };
    };

    if (streamUrl || intro || outro) {
      const cleanup = applyChapterStyles();
      return cleanup;
    }
  }, [streamUrl, intro, outro]);

  const hlsConfig = {
    enableWorker: false,
    lowLatencyMode: false,
    backBufferLength: 30,
    maxBufferLength: 30,
    maxMaxBufferLength: 60,
    appendErrorMaxRetry: 10,
    maxBufferHole: 0.5,
    nudgeOffset: 0.1,
    nudgeMaxRetry: 10,
    testBandwidth: false,
    defaultAudioCodec: "mp4a.40.2",
    preferManagedMediaSource: false,
  };

  const playM3u8 = (video, url, art) => {
    if (Hls.isSupported()) {
      if (art.hls) art.hls.destroy();
      let hls = null;
      let recoveryAttempts = 0;
      const unpatchSourceBuffer = patchAacMainSourceBuffer();

      const setupHls = () => {
        hls = new Hls(hlsConfig);
        art.hls = hls;

        hls.on(Hls.Events.BUFFER_CODECS, (event, data) => {
          if (data?.audio?.codec?.includes("mp4a.40.1")) {
            data.audio.codec = data.audio.codec.replace(/mp4a\.40\.1/gi, "mp4a.40.2");
          }
          const videoCodec = data?.video?.codec || "";
          if (videoCodec.includes("hvc1") || videoCodec.includes("hev1") || videoCodec.includes("hevc")) {
            art.notice.show = "HEVC not supported in Chrome.";
            hls.destroy();
          }
        });

        hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
          art.loading.show = false;
          if (art.option.autoplay) art.play();
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              recoveryAttempts++;
              if (recoveryAttempts <= 2) hls.recoverMediaError();
              else { hls.destroy(); setupHls(); }
            } else if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
              hls.startLoad();
            }
          }
        });

        hls.loadSource(url);
        hls.attachMedia(video);
      };

      setupHls();
      art.on("destroy", () => { hls?.destroy(); unpatchSourceBuffer(); });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
    }
  };

  useEffect(() => {
    if (!streamUrl || !artRef.current) return;

    const streamType = streamUrl.includes(".m3u8") ? "m3u8" : "mp4";

    // Clean up container to prevent double instances
    if (artRef.current) {
      artRef.current.innerHTML = "";
    }

    const art = new Artplayer({
      url: streamUrl,
      container: artRef.current,
      type: streamType,
      autoplay: autoPlay,
      volume: 1,
      controls: [], // Hide default controls
      setting: false, // Hide default settings
      playbackRate: true,
      pip: true,
      hotkey: true,
      fullscreen: true,
      mutex: true,
      playsInline: true,
      lock: true,
      airplay: true,
      autoOrientation: true,
      moreVideoAttr: { crossOrigin: "anonymous", preload: "auto" },
      plugins: [
        ...(streamType === "m3u8" ? [artplayerPluginHlsControl({ quality: { setting: false } })] : []),
        artplayerPluginUploadSubtitle(),
      ],
      icons: { loading: loadingIcon, state: playIconLg },
      customType: streamType === "m3u8" ? { m3u8: playM3u8 } : {},
    });

    setArtInstance(art);

    art.on("ready", () => {
      setDuration(art.duration);
      setIsPaused(!art.playing);
      const continueWatchingList = JSON.parse(localStorage.getItem("continueWatching")) || [];
      const currentEntry = continueWatchingList.find((item) => item.episodeId === episodeId);
      if (currentEntry?.leftAt) art.currentTime = currentEntry.leftAt;
    });

    art.on("video:timeupdate", () => {
      setCurrentTime(art.currentTime);
      leftAtRef.current = Math.floor(art.currentTime);
    });

    art.on("video:play", () => setIsPaused(false));
    art.on("video:pause", () => setIsPaused(true));
    art.on("fullscreen", (state) => {
      setIsFullScreen(state);
    });

    // Handle browser fullscreen changes manually to sync state
    const handleFsChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    art.on("pip", (state) => console.log("PIP state:", state));
    art.on("video:volumechange", () => {
      setVolume(art.volume);
      setIsMuted(art.muted);
    });

    art.on("fullscreen", (state) => setIsFullScreen(state));

    return () => {
      document.removeEventListener("fullscreenchange", handleFsChange);
      if (art && art.destroy) art.destroy(false);
      
      // Save progress
      try {
        const continueWatching = JSON.parse(localStorage.getItem("continueWatching")) || [];
        const newEntry = {
          id: animeInfo?.id,
          data_id: animeInfo?.data_id,
          episodeId,
          episodeNum,
          adultContent: animeInfo?.adultContent,
          poster: animeInfo?.poster,
          title: getTitle(animeInfo, "EN"),
          japanese_title: getTitle(animeInfo, "JP"),
          leftAt: leftAtRef.current,
          updatedAt: Date.now(),
        };
        if (newEntry.data_id) {
          const filtered = continueWatching.filter((item) => item.data_id !== newEntry.data_id);
          filtered.unshift(newEntry);
          localStorage.setItem("continueWatching", JSON.stringify(filtered.slice(0, 50)));
        }
      } catch (err) { }
    };
  }, [streamUrl, subtitles, intro, outro, activeServerName]);

  const toggleFullscreen = () => {
    if (!playerRootRef.current) return;
    if (!document.fullscreenElement) {
      playerRootRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const togglePlay = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!artInstance) return;
    
    const wasPlaying = artInstance.playing;
    if (wasPlaying) {
      artInstance.pause();
    } else {
      artInstance.play();
    }
    
    setStateIconType(wasPlaying ? "pause" : "play");
    setShowStateIcon(true);
    setTimeout(() => setShowStateIcon(false), 500);
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    if (artInstance) artInstance.currentTime = pct * artInstance.duration;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (!showSettings) setShowControls(false);
    }, 3000);
  };

  const formatTime = (time) => {
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  const handleDubToggle = () => {
    if (!isPahe || !servers) return;
    const targetAudio = isDub ? "jpn" : "eng"; // Simplistic check, Pahe uses 'jpn' for sub
    const targetServer = servers.find(s => s.quality === activeServer.quality && (targetAudio === "jpn" ? s.audio === "jpn" : s.audio !== "jpn"));
    if (targetServer) setActiveServerId(targetServer.data_id);
    else {
      // Find any server with target audio if same quality not found
      const anyTarget = servers.find(s => targetAudio === "jpn" ? s.audio === "jpn" : s.audio !== "jpn");
      if (anyTarget) setActiveServerId(anyTarget.data_id);
    }
  };

  const handleQualityChange = (dataId) => {
    setActiveServerId(dataId);
    setShowSettings(false);
  };

  const renderSettingsMenu = () => {
    if (!showSettings) return null;

    if (activeMenu === "main") {
      const currentQuality = activeServer?.quality || "Auto";
      const subLabel = subtitles?.length > 0 ? "On" : "Off";
      const getCleanServerName = (server) => {
        if (!server) return "Default";
        return server.serverName?.replace(/\d+p/g, "").replace(/\(.*\)/g, "").trim() || server.source?.toUpperCase() || "Default";
      };
      const serverLabel = getCleanServerName(activeServer);
      
      const menuItems = [
        { id: "dub", label: "Dub", icon: <Mic />, value: <div className={`settings-toggle ${isDub ? "active" : ""}`}><div className="settings-toggle-dot" /></div>, onClick: handleDubToggle },
        { id: "audio", label: "Audio", icon: <Music />, value: isDub ? "English" : "Original" },
        { id: "speed", label: "Playback speed", icon: <Timer />, value: `${playbackRate}x`, onClick: () => setActiveMenu("speed") },
        { id: "subtitles", label: "Subtitles/CC", icon: <Captions />, value: subLabel, onClick: () => {
          if (artInstance) {
            artInstance.subtitle.show = !artInstance.subtitle.show;
          }
        }},
        { id: "quality", label: "Quality", icon: <Video />, value: currentQuality, onClick: () => setActiveMenu("quality") },
        { id: "server", label: "Server", icon: <Monitor />, value: serverLabel, onClick: () => setActiveMenu("server") },
        { id: "more", label: "More", icon: <SlidersHorizontal />, value: <ChevronRight size={16} /> },
      ];

      return (
        <div className="settings-menu-overlay" onClick={e => e.stopPropagation()}>
          {menuItems.map(item => (
            <div key={item.id} className="settings-item" onClick={item.onClick}>
              <div className="settings-item-left">
                {item.icon}
                <span>{item.label}</span>
              </div>
              <div className="settings-item-right">
                {item.value}
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (activeMenu === "quality") {
      const paheQualities = isPahe ? servers.filter(s => s.audio === activeServer.audio) : [];
      return (
        <div className="settings-menu-overlay" onClick={e => e.stopPropagation()}>
          <div className="settings-header" onClick={() => setActiveMenu("main")}>
            <ChevronLeft size={18} />
            <span className="font-medium text-sm">Quality</span>
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {isPahe ? paheQualities.map(s => (
              <div key={s.data_id} className="settings-item" onClick={() => handleQualityChange(s.data_id)}>
                <div className="settings-item-left">
                  <span className="w-5 flex justify-center">{activeServerId === s.data_id ? <Check size={16} className="checkmark" /> : null}</span>
                  {s.quality}
                </div>
              </div>
            )) : (
              <div className="p-4 text-xs text-gray-500 text-center">Auto quality managed by HLS</div>
            )}
          </div>
        </div>
      );
    }

    if (activeMenu === "server") {
      return (
        <div className="settings-menu-overlay" onClick={e => e.stopPropagation()}>
          <div className="settings-header" onClick={() => setActiveMenu("main")}>
            <ChevronLeft size={18} />
            <span className="font-medium text-sm">Server</span>
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {(() => {
              const uniqueServers = [];
              const seen = new Set();
              
              servers?.forEach(s => {
                const name = s.serverName.replace(/\d+p/g, "").replace(/\(.*\)/g, "").trim() || s.source?.toUpperCase();
                if (!seen.has(name)) {
                  seen.add(name);
                  uniqueServers.push({ ...s, cleanName: name });
                }
              });

              const currentActiveName = activeServer?.serverName?.replace(/\d+p/g, "").replace(/\(.*\)/g, "").trim() || activeServer?.source?.toUpperCase();

              return uniqueServers.map(s => (
                <div key={s.data_id} className="settings-item" onClick={() => handleQualityChange(s.data_id)}>
                  <div className="settings-item-left">
                    <span className="w-5 flex justify-center">
                      {(currentActiveName === s.cleanName) ? <Check size={16} className="checkmark" /> : <div className="w-4 h-4 rounded-full border border-gray-500" />}
                    </span>
                    <div className="flex flex-col ml-2">
                      <span className="text-sm font-medium">{s.cleanName}</span>
                      <span className="server-subtext">
                        {s.source === "pahe" ? "Hard sub, Fast, Multi quality" : 
                         s.cleanName === "Kite" ? "Soft sub, Multi quality" :
                         s.cleanName === "Meg" ? "Hard sub, Multi quality" :
                         "High Speed Source"}
                      </span>
                    </div>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      );
    }

    if (activeMenu === "speed") {
      const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
      return (
        <div className="settings-menu-overlay" onClick={e => e.stopPropagation()}>
          <div className="settings-header" onClick={() => setActiveMenu("main")}>
            <ChevronLeft size={18} />
            <span className="font-medium text-sm">Playback speed</span>
          </div>
          {speeds.map(speed => (
            <div key={speed} className="settings-item" onClick={() => {
              if (artInstance) artInstance.playbackRate = speed;
              setPlaybackRate(speed);
              setActiveMenu("main");
            }}>
              <div className="settings-item-left">
                <span className="w-5 flex justify-center">{playbackRate === speed ? <Check size={16} className="checkmark" /> : null}</span>
                {speed === 1 ? "Normal" : `${speed}x`}
              </div>
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <div 
      ref={playerRootRef}
      className="relative w-full h-full bg-black overflow-hidden group/player"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => !showSettings && setShowControls(false)}
    >
      <div ref={artRef} className="w-full h-full artplayer-app" />

      {/* Click Overlay (YouTube Style: Single click play/pause, Double click fullscreen) */}
      <div 
        className="absolute inset-0 z-10" 
        onClick={togglePlay}
        onDoubleClick={(e) => {
          e.stopPropagation();
          toggleFullscreen();
        }}
      />

      {/* State Icon Overlay */}
      <div className={`state-icon-overlay ${showStateIcon ? "active" : ""}`}>
        {stateIconType === "play" ? <Play size={40} fill="white" /> : <Pause size={40} fill="white" />}
      </div>

      {/* Custom Controls */}
      <div className={`custom-player-controls ${showControls ? "" : "hidden"}`} onClick={e => e.stopPropagation()}>
        {/* Progress Bar */}
        <div className="progress-bar-container" onClick={handleSeek}>
          <div className="progress-bar-fill" style={{ width: `${(currentTime / duration) * 100}%` }}>
            <div className="progress-bar-handle"></div>
          </div>
        </div>

        <div className="controls-row">
          <div className="controls-left">
            <button className="control-btn" onClick={togglePlay}>
              {isPaused ? <Play fill="white" /> : <Pause fill="white" />}
            </button>
            <button className="control-btn" onClick={() => {
               if (currentEpisodeIndex < episodes?.length - 1) {
                  const nextId = episodes[currentEpisodeIndex + 1].id.match(/ep=(.+)/)?.[1];
                  if (nextId) playNext(nextId);
               }
            }}>
              <SkipForward fill="white" />
            </button>
            <div className="flex items-center group/vol bg-white/10 rounded-full h-[44px] transition-all duration-300">
              <button className="control-btn !bg-transparent" onClick={() => {
                if (artInstance) artInstance.muted = !artInstance.muted;
              }}>
                {isMuted || volume === 0 ? <VolumeX size={22} /> : <Volume2 size={22} />}
              </button>
              <div className="w-0 group-hover/vol:w-24 group-hover/vol:pr-4 overflow-hidden transition-all duration-300 flex items-center">
                <input 
                  type="range" min="0" max="1" step="0.1" 
                  value={volume} 
                  onChange={(e) => { if (artInstance) artInstance.volume = parseFloat(e.target.value); }}
                  className="w-full accent-white h-1 cursor-pointer"
                />
              </div>
            </div>
            <div className="time-display">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          <div className="controls-right">
            <button className="control-btn" onClick={() => {
               setShowSettings(!showSettings);
               setActiveMenu("main");
            }}>
              <Settings />
            </button>
            <button className="control-btn" onClick={() => {
              if (artInstance) artInstance.pip = !artInstance.pip;
            }}>
              <PictureInPicture />
            </button>
            <button className="control-btn" onClick={toggleFullscreen}>
              {isFullScreen ? <Minimize /> : <Maximize />}
            </button>
          </div>
        </div>

        {renderSettingsMenu()}
      </div>
    </div>
  );
}
