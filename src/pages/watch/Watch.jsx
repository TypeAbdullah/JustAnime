/* eslint-disable react/prop-types */
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useLocation, useParams, Link, useNavigate } from "react-router-dom";
import { useLanguage } from "@/src/context/LanguageContext";
import { useWatch } from "@/src/hooks/useWatch";
import BouncingLoader from "@/src/components/ui/bouncingloader/Bouncingloader";
import Episodelist from "@/src/components/episodelist/Episodelist";
import website_name from "@/src/config/website";
import Sidecard from "@/src/components/sidecard/Sidecard";
import {
  faClosedCaptioning,
  faMicrophone,
  faPlay,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Skeleton } from "@/src/components/ui/Skeleton/Skeleton";
import SidecardLoader from "@/src/components/Loader/Sidecard.loader";
import Player from "@/src/components/player/Player";
import Servers from "@/src/components/servers/Servers";
import getSafeTitle from "@/src/utils/getSafetitle";
import { Helmet } from 'react-helmet-async';
import InfoTag from "@/src/components/ui/InfoTag/InfoTag";
import {
  ThumbsUp, ThumbsDown, Share2, Download, Flag, 
  Mic, Monitor, Plus, Check, ChevronUp, Search, RotateCcw, ListFilter, LayoutGrid, Bell
} from "lucide-react";
import {
  generateDescription,
  generateKeywords,
  generateCanonicalUrl,
  generateOGImage,
  generateAnimeStructuredData,
  generateVideoStructuredData,
  generateBreadcrumbStructuredData,
  optimizeTitle,
} from '@/src/utils/seo.utils';
import { createDownloadToken } from "@/src/utils/backendApi.utils";

export default function Watch() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id: animeId } = useParams();
  const queryParams = new URLSearchParams(location.search);
  let initialEpisodeId = queryParams.get("ep");
  const { language } = useLanguage();
  const isFirstSet = useRef(true);
  const [showNextEpisodeSchedule, setShowNextEpisodeSchedule] = useState(true);

  const {
    buffering,
    streamInfo,
    streamUrl,
    animeInfo,
    episodes,
    nextEpisodeSchedule,
    animeInfoLoading,
    totalEpisodes,
    isFullOverview,
    intro,
    outro,
    subtitles,
    thumbnail,
    setIsFullOverview,
    activeEpisodeNum,
    episodeId,
    setEpisodeId,
    activeServerId,
    setActiveServerId,
    servers,
    activeServer,
    serverLoading,
    activeServerType,
    setActiveServerType,
    activeServerName,
    setActiveServerName,
    seasons,
    // Multi-source
    activeSource,
    handleSourceChange,
    paheAvailable,
    paheLoading,
  } = useWatch(animeId, initialEpisodeId);

  const [autoPlay, setAutoPlay] = useState(() => JSON.parse(localStorage.getItem("autoPlay")) ?? true);
  const [autoSkipIntro, setAutoSkipIntro] = useState(() => JSON.parse(localStorage.getItem("autoSkipIntro")) ?? true);
  const [autoNext, setAutoNext] = useState(() => JSON.parse(localStorage.getItem("autoNext")) ?? true);

  useEffect(() => localStorage.setItem("autoPlay", JSON.stringify(autoPlay)), [autoPlay]);
  useEffect(() => localStorage.setItem("autoSkipIntro", JSON.stringify(autoSkipIntro)), [autoSkipIntro]);
  useEffect(() => localStorage.setItem("autoNext", JSON.stringify(autoNext)), [autoNext]);

  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [likesCount, setLikesCount] = useState(79);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [downloadError, setDownloadError] = useState("");


  const videoContainerRef = useRef(null);
  const playerRef = useRef(null);
  const episodesRef = useRef(null);

  // Sync URL with episodeId
  useEffect(() => {
    if (!episodes?.length) return;

    const currentEpNum = episodeId;
    const isValidEpisode = episodes.some(ep => ep.id.split('ep=')[1] === currentEpNum);

    if (!currentEpNum || !isValidEpisode) {
      const fallbackId = episodes[0].id.match(/ep=(.+)/)?.[1];
      if (fallbackId && fallbackId !== currentEpNum) setEpisodeId(fallbackId);
      return;
    }

    const newUrl = `/watch/${animeId}?ep=${currentEpNum}`;
    if (isFirstSet.current) {
      navigate(newUrl, { replace: true });
      isFirstSet.current = false;
    } else {
      navigate(newUrl);
    }
  }, [episodeId, animeId, navigate, episodes, setEpisodeId]);

  // Redirect if no episodes
  useEffect(() => {
    if (totalEpisodes === 0) navigate(`/${animeId}`);
  }, [animeId, totalEpisodes, navigate]);

  // Height adjustment logic
  const adjustHeight = useCallback(() => {
    if (window.innerWidth > 1200) {
      if (playerRef.current && episodesRef.current) {
        episodesRef.current.style.height = 'auto';
        episodesRef.current.style.maxHeight = `${playerRef.current.offsetHeight}px`;
      }
    } else if (episodesRef.current) {
      episodesRef.current.style.height = 'auto';
      episodesRef.current.style.maxHeight = 'none';
    }
  }, []);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(adjustHeight);

    if (playerRef.current) resizeObserver.observe(playerRef.current);

    window.addEventListener('resize', adjustHeight);
    adjustHeight();

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', adjustHeight);
    };
  }, [adjustHeight, buffering, animeInfoLoading]);

  const activeEpisode = useMemo(() => {
    return episodes?.find(ep => ep.episode_no === parseInt(activeEpisodeNum));
  }, [episodes, activeEpisodeNum]);

  const currentEpisodeName = useMemo(() => {
    // Priority 1: Use the title from our episodes list (which is now enriched with MAL data)
    if (activeEpisode?.title && !activeEpisode.title.match(/^Episode \d+$/i)) {
      return activeEpisode.title;
    }

    if (!animeInfo?.streamingEpisodes || animeInfo.streamingEpisodes.length === 0) return null;
    const epNum = parseInt(activeEpisodeNum);
    
    // Precise matching for the episode number
    const match = animeInfo.streamingEpisodes.find(ep => {
      const title = ep.title.toLowerCase();
      // Matches "Episode 1", "Ep 1", "1 - ", etc.
      const epRegex = new RegExp(`(^|\\s)(episode|ep|ep\\.)?\\s*0*${epNum}(\\s|:|-|$)`, 'i');
      return epRegex.test(title);
    });
    
    if (match) {
      // Split by common episode prefixes to get the name
      const titleParts = match.title.split(/episode \d+|ep \d+|ep\. \d+|\d+\s*[:-]\s*/i);
      if (titleParts.length > 1 && titleParts[1].trim()) {
        const extracted = titleParts[1].replace(/^[:\-\s]+/, "").trim();
        return extracted || match.title;
      }
      
      // If split failed, try manual cleanup of leading "1 - " or "Episode 1: "
      let cleaned = match.title.replace(new RegExp(`^(episode|ep|ep\\.)?\\s*0*${epNum}\\s*[:\\- ]+`, 'i'), "").trim();
      return cleaned || match.title;
    }
    return null;
  }, [animeInfo, activeEpisodeNum, activeEpisode]);

  const seoData = useMemo(() => {
    if (!animeInfo) return null;
    const safeT = getSafeTitle(animeInfo.title, language, animeInfo.japanese_title);
    const epTitle = currentEpisodeName ? ` - ${currentEpisodeName}` : "";
    return {
      safeTitle: safeT,
      pageTitle: optimizeTitle(`Watch ${safeT} Episode ${activeEpisodeNum}${epTitle} Sub Dub Online Free`),
      pageDescription: generateDescription(`Stream ${safeT} Episode ${activeEpisodeNum}${epTitle} in HD with English Sub and Dub. ${animeInfo.animeInfo?.Overview}`),
      pageKeywords: `${generateKeywords(animeInfo)}, episode ${activeEpisodeNum}${currentEpisodeName ? `, ${currentEpisodeName}` : ""}`,
      canonicalUrl: generateCanonicalUrl(`/watch/${animeId}?ep=${episodeId}`),
      ogImage: generateOGImage(animeInfo.poster),
      structured: generateAnimeStructuredData(animeInfo, { number: activeEpisodeNum, id: episodeId }),
      videoStructured: generateVideoStructuredData(animeInfo, { number: activeEpisodeNum, id: episodeId }, streamUrl),
      breadcrumb: generateBreadcrumbStructuredData([
        { name: 'Home', url: '/' },
        { name: animeInfo.title, url: `/${animeId}` },
        { name: `Episode ${activeEpisodeNum}`, url: `/watch/${animeId}?ep=${episodeId}` }
      ])
    };
  }, [animeId, animeInfo, activeEpisodeNum, episodeId, language, streamUrl, currentEpisodeName]);

  const tags = useMemo(() => {
    const info = animeInfo?.animeInfo?.tvInfo;
    if (!info) return [];
    return [
      { condition: info.rating, text: info.rating, bgColor: "#ffffff" },
      { condition: info.quality, text: info.quality, bgColor: "#FFBADE" },
      { condition: info.sub, text: info.sub, icon: faClosedCaptioning, bgColor: "#B0E3AF" },
      { condition: info.dub, text: info.dub, icon: faMicrophone, bgColor: "#B9E7FF" },
    ];
  }, [animeInfo]);

  const handleDownload = async () => {
    setDownloadError("");
    if (!activeServer?.share_id) {
      if (streamUrl) window.open(streamUrl, "_blank", "noopener,noreferrer");
      else setDownloadError("No download link is available for this episode yet.");
      return;
    }

    setDownloadLoading(true);
    try {
      const tokenData = await createDownloadToken(activeServer.share_id);
      const url = tokenData?.url || tokenData?.download_url;
      if (!url) throw new Error("The backend did not return a download URL.");
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      setDownloadError(error?.response?.data?.detail || error.message || "Could not create download link.");
    } finally {
      setDownloadLoading(false);
    }
  };

  return (
    <>
      {seoData && (
        <Helmet>
          <title>{seoData.pageTitle}</title>
          <meta name="description" content={seoData.pageDescription} />
          <meta name="keywords" content={seoData.pageKeywords} />
          <link rel="canonical" href={seoData.canonicalUrl} />
          <meta property="og:title" content={seoData.pageTitle} />
          <meta property="og:description" content={seoData.pageDescription} />
          <meta property="og:image" content={seoData.ogImage} />
          <meta property="og:url" content={seoData.canonicalUrl} />
          <meta property="og:type" content="video.episode" />
          <meta name="twitter:card" content="summary_large_image" />
          <script type="application/ld+json">{JSON.stringify(seoData.structured)}</script>
          <script type="application/ld+json">{JSON.stringify(seoData.videoStructured)}</script>
          <script type="application/ld+json">{JSON.stringify(seoData.breadcrumb)}</script>
        </Helmet>
      )}

      <div className="w-full min-h-screen bg-black text-[#f1f1f1]">
        <div className="w-full max-w-[1700px] mx-auto pt-20 pb-6 px-4 sm:px-6 lg:px-10 max-[1200px]:pt-16">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">

            {/* Left Column: Player & Info */}
            <div className="flex flex-col gap-4">
              {/* Player Container */}
              <div ref={playerRef} className="w-full bg-black rounded-xl overflow-hidden shadow-2xl">
                <div ref={videoContainerRef} className="w-full relative aspect-video bg-black">
                  {!buffering ? (
                    <Player
                      streamUrl={streamUrl}
                      subtitles={subtitles}
                      intro={intro}
                      outro={outro}
                      activeServerName={activeServerName}
                      thumbnail={thumbnail}
                      autoSkipIntro={autoSkipIntro}
                      autoPlay={autoPlay}
                      autoNext={autoNext}
                      episodeId={episodeId}
                      episodes={episodes}
                      playNext={setEpisodeId}
                      animeInfo={animeInfo}
                      episodeNum={activeEpisodeNum}
                      streamInfo={streamInfo}
                      servers={servers}
                      activeServerId={activeServerId}
                      setActiveServerId={setActiveServerId}
                    />
                  ) : (
                    <div className="absolute inset-0 flex justify-center items-center bg-black bg-opacity-50">
                      <BouncingLoader />
                    </div>
                  )}
                  {!buffering && !streamInfo && servers && (
                    <div className="absolute inset-0 flex flex-col justify-center items-center bg-black/80 text-center px-4">
                      <p className="text-lg font-medium text-white mb-2">Streaming server might be down</p>
                      <p className="text-sm text-gray-400">Please try switching servers or reload the page</p>
                    </div>
                  )}
                </div>

              </div>

              <Servers
                servers={servers}
                activeEpisodeNum={activeEpisodeNum}
                activeServerId={activeServerId}
                setActiveServerId={setActiveServerId}
                serverLoading={serverLoading}
                setActiveServerType={setActiveServerType}
                setActiveServerName={setActiveServerName}
                activeSource={activeSource}
                onSourceChange={handleSourceChange}
                paheAvailable={paheAvailable}
                paheLoading={paheLoading}
              />

              {/* Video Title */}
              <div className="flex flex-col gap-1 mt-2">
                <h1 className="text-xl lg:text-2xl font-bold text-white leading-tight">
                   {currentEpisodeName ? `${activeEpisodeNum}. ${currentEpisodeName}` : `Episode ${activeEpisodeNum}`}
                </h1>
              </div>

              {/* Action Bar (YouTube/Screenshot Style) */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 py-2 mt-1">
                <div className="flex items-center gap-3">
                  <Link to={`/${animeId}`} className="flex-shrink-0">
                    <img 
                      src={animeInfo?.poster} 
                      alt={seoData?.safeTitle} 
                      className="w-10 h-10 rounded-full object-cover border border-white/5" 
                    />
                  </Link>
                  <div className="flex flex-col mr-2">
                    <Link to={`/${animeId}`} className="font-bold text-[15px] text-white hover:text-blue-400 transition-colors leading-tight truncate max-w-[150px] sm:max-w-[250px]">
                      {seoData?.safeTitle}
                    </Link>
                    <span className="text-[12px] text-gray-400">1.1K users</span>
                  </div>
                  <button 
                    onClick={() => setIsSubscribed(!isSubscribed)}
                    className={`ml-2 px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 transform active:scale-95 ${
                      isSubscribed 
                        ? "bg-[#272727] text-white hover:bg-[#3f3f3f]" 
                        : "bg-white text-black hover:bg-[#e6e6e6]"
                    }`}
                  >
                    {isSubscribed ? <span className="flex items-center gap-2"><Check size={16} /> Added</span> : "Add to List"}
                  </button>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                  <div className="flex bg-[#272727] rounded-full overflow-hidden h-9">
                    <button 
                      onClick={() => {
                        if (!isLiked) {
                          setLikesCount(prev => prev + 1);
                          if (isDisliked) setIsDisliked(false);
                        } else {
                          setLikesCount(prev => prev - 1);
                        }
                        setIsLiked(!isLiked);
                      }}
                      className={`px-4 flex items-center gap-2 hover:bg-[#3f3f3f] transition-all border-r border-white/5 active:scale-90 ${isLiked ? "text-blue-400" : "text-white"}`}
                    >
                      <ThumbsUp size={18} className={`transition-transform duration-300 ${isLiked ? "scale-125" : "scale-100"}`} fill={isLiked ? "currentColor" : "none"} />
                      <span className="text-[13px] font-bold">{likesCount}</span>
                    </button>
                    <button 
                      onClick={() => {
                        setIsDisliked(!isDisliked);
                        if (isLiked) {
                          setIsLiked(false);
                          setLikesCount(prev => prev - 1);
                        }
                      }}
                      className={`px-4 hover:bg-[#3f3f3f] transition-all active:scale-90 ${isDisliked ? "text-red-400" : "text-white"}`}
                    >
                      <ThumbsDown size={18} className={`transition-transform duration-300 ${isDisliked ? "scale-125" : "scale-100"}`} fill={isDisliked ? "currentColor" : "none"} />
                    </button>
                  </div>

                  <button className="h-9 px-4 bg-[#272727] rounded-full hover:bg-[#3f3f3f] transition-all active:scale-95 text-white text-[13px] font-bold flex items-center gap-2">
                    <Mic size={18} />
                    <span>Dub</span>
                  </button>
                  
                  <button className="h-9 px-4 bg-[#272727] rounded-full hover:bg-[#3f3f3f] transition-all active:scale-95 text-white text-[13px] font-bold flex items-center gap-2">
                    <Monitor size={18} />
                    <span>Server</span>
                  </button>

                  <button className="h-9 px-4 bg-[#272727] rounded-full hover:bg-[#3f3f3f] transition-all active:scale-95 text-white text-[13px] font-bold flex items-center gap-2">
                    <Share2 size={18} />
                    <span>Share</span>
                  </button>

                  <button
                    onClick={handleDownload}
                    disabled={downloadLoading}
                    title={downloadError || "Download"}
                    className="h-9 w-9 bg-[#272727] rounded-full hover:bg-[#3f3f3f] transition-all active:scale-95 flex items-center justify-center text-white disabled:opacity-60"
                  >
                    <Download size={18} />
                  </button>

                  <button className="h-9 px-4 bg-[#272727] rounded-full hover:bg-[#3f3f3f] transition-all active:scale-95 text-white text-[13px] font-bold flex items-center gap-2">
                    <Flag size={18} />
                    <span>Report</span>
                  </button>
                </div>
              </div>
              {downloadError && (
                <p className="text-xs text-red-300 -mt-2">{downloadError}</p>
              )}

              {/* Description Section (YouTube Style) */}
              <div className="bg-[#272727] hover:bg-[#3f3f3f] transition-colors rounded-xl p-3 mt-2 cursor-pointer group/desc">
                <div className="flex gap-4 text-[14px] font-bold text-white mb-1">
                   <span>13K views</span>
                   <span>Apr 7, 2026</span>
                </div>
                {animeInfo?.animeInfo?.Overview && (
                  <div className="text-sm text-gray-200 leading-relaxed">
                    {animeInfo.animeInfo.Overview.length > 200 ? (
                      <>
                        {isFullOverview ? animeInfo.animeInfo.Overview : `${animeInfo.animeInfo.Overview.slice(0, 200)}...`}
                        <button 
                          onClick={() => setIsFullOverview(!isFullOverview)} 
                          className="ml-1 font-bold text-white hover:underline"
                        >
                          {isFullOverview ? "less" : "more"}
                        </button>
                      </>
                    ) : animeInfo.animeInfo.Overview}
                  </div>
                )}
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-bold mb-4">20 Comments</h3>
                {/* Mock Comment Input */}
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex-shrink-0"></div>
                  <div className="flex-1 border-b border-white/10 pb-2">
                     <input type="text" placeholder="Add a comment..." className="w-full bg-transparent outline-none text-sm" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Sidebar */}
            <div className="flex flex-col gap-4">
              {/* Up Next Section */}
              <div className="bg-black rounded-xl border border-white/5 overflow-hidden flex flex-col">
                 <div className="p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                       <h2 className="text-[15px] font-bold text-white">Up Next - {currentEpisodeName || `Episode ${activeEpisodeNum}`}</h2>
                       <button className="text-gray-400 hover:text-white transition-colors">
                         <ChevronUp size={20} />
                       </button>
                    </div>
                    <div className="text-[12px] text-[#aaaaaa] flex items-center gap-1.5 -mt-2">
                      <span className="font-medium">Playing</span>
                      <span className="w-0.5 h-0.5 rounded-full bg-gray-600"></span>
                      <span>Episode {activeEpisodeNum}</span>
                      <span className="w-0.5 h-0.5 rounded-full bg-gray-600"></span>
                      <span className="truncate max-w-[200px]">{seoData?.safeTitle}</span>
                    </div>
                    
                    {/* Sidebar Controls */}
                    <div className="flex items-center gap-2 mt-1">
                       <div className="flex-1 relative group">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-white transition-colors">
                            <Search size={14} />
                          </div>
                          <input 
                            type="text" 
                            placeholder="Search Episode" 
                            className="w-full bg-[#1a1a1a] rounded-lg py-2 pl-9 pr-4 text-xs text-[#f1f1f1] border border-transparent focus:border-white/20 outline-none transition-all placeholder:text-gray-600"
                          />
                       </div>
                       <div className="flex gap-1">
                          <button className="w-8 h-8 flex items-center justify-center bg-[#1a1a1a] rounded-lg hover:bg-[#272727] transition-colors text-[#f1f1f1]" title="Autoplay">
                            <RotateCcw size={14} />
                          </button>
                          <button className="w-8 h-8 flex items-center justify-center bg-[#1a1a1a] rounded-lg hover:bg-[#272727] transition-colors text-[#f1f1f1]" title="Sort">
                            <ListFilter size={14} />
                          </button>
                          <button className="w-8 h-8 flex items-center justify-center bg-[#1a1a1a] rounded-lg hover:bg-[#272727] transition-colors text-[#f1f1f1]" title="View Mode">
                            <LayoutGrid size={14} />
                          </button>
                       </div>
                    </div>
                 </div>

                 <div ref={episodesRef} className="max-h-[650px] overflow-y-auto scrollbar-hide px-1 pb-2">
                    {!episodes ? (
                      <div className="flex items-center justify-center py-20">
                        <BouncingLoader />
                      </div>
                    ) : (
                      <Episodelist
                        episodes={episodes}
                        currentEpisode={episodeId}
                        onEpisodeClick={setEpisodeId}
                        totalEpisodes={totalEpisodes}
                      />
                    )}
                 </div>
              </div>

              {/* Next Airing Alert (Green) */}
              {nextEpisodeSchedule?.nextEpisodeSchedule && (
                <div className="bg-[#0f1f14] border border-white/5 rounded-full py-2.5 px-4 flex items-center justify-center gap-2.5 hover:bg-[#1a2e1f] transition-colors group cursor-pointer">
                  <Bell size={14} className="text-white/60 group-hover:scale-110 transition-transform" />
                  <p className="text-[13px] font-bold text-[#2ba640]">
                    Next ep airing <span className="text-green-400 ml-1">in 4 days</span>
                  </p>
                </div>
              )}

              {/* Related Anime (More Like This) */}
              {!animeInfoLoading && animeInfo?.recommended_data?.length > 0 && (
                <div className="flex flex-col gap-4 mt-2">
                  <h2 className="text-lg font-bold text-white">More like this</h2>
                  <div className="flex flex-col gap-3">
                    {animeInfo.recommended_data.slice(0, 10).map((anime, idx) => (
                      <Link 
                        to={`/${anime.id}`} 
                        key={idx} 
                        className="group flex gap-3.5 p-2 rounded-xl hover:bg-white/5 transition-all duration-300 relative overflow-hidden min-h-[95px]"
                      >
                         {/* Banner Background */}
                         <div className="absolute inset-0 z-0">
                            <img 
                              src={anime.banner || anime.poster} 
                              className="w-full h-full object-cover opacity-30 group-hover:opacity-45 transition-opacity duration-500" 
                              alt="" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent"></div>
                         </div>

                         {/* Poster */}
                         <div className="w-[64px] aspect-[2/3] flex-shrink-0 rounded-lg overflow-hidden relative z-10 shadow-lg">
                            <img src={anime.poster} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                         </div>

                         {/* Content */}
                         <div className="flex-1 min-w-0 z-10 py-1 flex flex-col justify-center">
                            <h3 className="text-[15px] font-bold text-white line-clamp-1 group-hover:text-[#3ea6ff] transition-colors leading-tight">
                              {anime.title}
                            </h3>
                            <div className="flex items-center gap-2.5 text-[12px] text-[#aaaaaa] mt-2 font-medium">
                               <span className="uppercase">{anime.type || "TV"}</span>
                               <span className="uppercase">{anime.season || ""}</span>
                               <span>{anime.year || ""}</span>
                            </div>
                         </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
        </div>


        {/* Sections */}
        <div className="container mx-auto space-y-8 pb-12 px-4 sm:px-6 lg:px-10">
          {seasons?.length > 0 && (
            <div>
              <h2 className="text-xl md:text-2xl font-bold mb-6 px-1 text-white">More Seasons</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {seasons.map((season, index) => (
                  <Link
                    to={`/${season.id}`}
                    key={season.id}
                    className={`relative w-full aspect-[3/1] rounded-lg overflow-hidden group border-2 transition-all ${animeId === String(season.id) ? "border-white/40 shadow-lg" : "border-transparent"}`}
                  >
                    <img src={season.season_poster} alt={season.season} className={`w-full h-full object-cover scale-150 transition-opacity ${animeId === String(season.id) ? "opacity-50" : "opacity-40 group-hover:opacity-60"}`} />
                    <div
                      className="absolute inset-0 z-10"
                      style={{
                        backgroundImage: `url('data:image/svg+xml,<svg width="3" height="3" viewBox="0 0 3 3" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="1.5" cy="1.5" r="0.5" fill="white" fill-opacity="0.25"/></svg>')`,
                        backgroundSize: '3px 3px'
                      }}
                    />
                    <div className="absolute inset-0 z-20 bg-gradient-to-r from-black/60 to-transparent" />
                    <div className="absolute inset-0 z-30 flex items-center justify-center">
                      <p className="text-sm sm:text-base font-bold text-center px-4 text-white">{season.season}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </>
  );
}
