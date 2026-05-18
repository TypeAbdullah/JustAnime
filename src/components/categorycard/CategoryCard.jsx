import React, { useCallback, useEffect, useState, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClosedCaptioning,
  faMicrophone,
  faPlay,
  faPause,
  faStar,
  faCircle,
  faVolumeMute,
  faVolumeUp,
  faBookmark,
  faLayerGroup,
  faCalendarAlt
} from "@fortawesome/free-solid-svg-icons";
import { FaChevronRight } from "react-icons/fa";
import { useLanguage } from "@/src/context/LanguageContext";
import { Link, useNavigate } from "react-router-dom";
import getSafeTitle from "@/src/utils/getSafetitle";
import "./CategoryCard.css";

const AnimeCard = ({ item, navigate, path, language, isFirstRow = false, variant = "default", globalMute, toggleMute }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const iframeRef = useRef(null);
  const hoverTimeout = useRef(null);

  const handleMouseEnter = () => {
    hoverTimeout.current = setTimeout(() => {
      setIsHovered(true);
      setIsPlaying(true);
    }, 500); // 500ms delay to prevent accidental triggers while moving mouse
  };

  const handleMouseLeave = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setIsHovered(false);
  };

  const togglePlay = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const newPlaying = !isPlaying;
    setIsPlaying(newPlaying);
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func: newPlaying ? "playVideo" : "pauseVideo", args: [] }),
      "*"
    );
  };

  // Sync audio state when trailer loads or global mute changes
  useEffect(() => {
    if (isHovered && iframeRef.current) {
      const timer = setTimeout(() => {
        iframeRef.current?.contentWindow?.postMessage(
          JSON.stringify({ event: "command", func: globalMute ? "mute" : "unMute", args: [] }),
          "*"
        );
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isHovered, globalMute]);

  if (variant === "cinematic") {
    return (
      <div 
        className="flex flex-col w-full relative anime-card-container"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="relative aspect-[2/3] rounded-lg overflow-hidden group shadow-lg poster-wrapper">
          <Link to={`/${item.id}`} className="block w-full h-full">
            <img
              src={item.poster}
              alt={getSafeTitle(item.title, language, item.japanese_title)}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
               <FontAwesomeIcon icon={faPlay} className="text-4xl text-white drop-shadow-xl" />
            </div>
            {item.score && (
              <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md px-2 py-1 rounded flex items-center gap-1 border border-white/10">
                <FontAwesomeIcon icon={faStar} className="text-yellow-400 text-[10px]" />
                <span className="text-white text-[11px] font-extrabold">{item.score}</span>
              </div>
            )}
          </Link>
        </div>
        
        {/* Info Row: Type & Year */}
        <div className="flex items-center justify-between mt-3 px-1">
          <span className="text-[11px] text-white/50 font-bold uppercase tracking-wider">{item.type || 'TV Show'}</span>
          <span className="text-[11px] text-white/50 font-bold uppercase tracking-wider">{item.releaseDate || '2026'}</span>
        </div>

        {/* Title Row with Airing Dot */}
        <Link to={`/${item.id}`} className="flex items-center gap-2 mt-1.5 px-1 hover:text-white transition-colors group">
          <FontAwesomeIcon icon={faCircle} className="text-[8px] text-green-500 mt-0.5 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
          <h3 className="text-[14px] font-bold text-white/90 group-hover:text-white line-clamp-1 leading-tight tracking-tight">
            {getSafeTitle(item.title, language, item.japanese_title)}
          </h3>
        </Link>

        {/* HOVER PREVIEW CARD - Netflix Style */}
        {isHovered && item.trailer && (
          <div className="absolute top-[-50px] left-[-30px] w-[380px] bg-[#141414] rounded-2xl shadow-[0_30px_100px_rgba(0,0,0,1)] z-[1000] border border-white/5 animate-preview-pop overflow-hidden">
            <div className="relative aspect-video bg-black overflow-hidden">
              <iframe
                ref={iframeRef}
                src={`https://www.youtube.com/embed/${item.trailer}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&playsinline=1&enablejsapi=1&origin=${window.location.origin}&autohide=1&disablekb=1`}
                className="absolute inset-0 w-full h-full scale-[1.6]"
                frameBorder="0"
                allow="autoplay; encrypted-media"
              ></iframe>
              <div className="absolute inset-0 z-10 pointer-events-none"></div>
              
              {/* Controls */}
              <div className="absolute top-3 right-3 z-20 flex gap-2">
                 <button onClick={togglePlay} className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-xl flex items-center justify-center border border-white/10 hover:bg-black/80">
                    <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} className="text-white text-xs" />
                 </button>
                 <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleMute(); }} className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-xl flex items-center justify-center border border-white/10 hover:bg-black/80">
                    <FontAwesomeIcon icon={globalMute ? faVolumeMute : faVolumeUp} className="text-white text-xs" />
                 </button>
              </div>
            </div>

            <div className="p-5">
              <h4 className="text-white font-extrabold text-[20px] mb-3 leading-tight tracking-tight">{getSafeTitle(item.title, language, item.japanese_title)}</h4>
              
              <div className="flex items-center gap-2 mb-4">
                <span className="border border-green-500/50 text-green-500 text-[10px] font-bold px-2 py-0.5 rounded uppercase">AIRING</span>
                {item.genres?.slice(0, 2).map(genre => (
                  <span key={genre} className="bg-[#2a2a2a] text-white/80 text-[10px] font-bold px-2 py-0.5 rounded uppercase">{genre}</span>
                ))}
              </div>

              <div className="flex items-center gap-4 mb-4 text-white/50">
                <div className="flex items-center gap-1">
                  <FontAwesomeIcon icon={faStar} className="text-[10px] text-yellow-500" />
                  <span className="text-xs font-bold text-white/80">{item.score ? (item.score * 10).toFixed(0) : '??'}%</span>
                </div>
                <div className="flex items-center gap-1">
                  <FontAwesomeIcon icon={faLayerGroup} className="text-[10px]" />
                  <span className="text-xs font-bold text-white/80">{item.episodes?.sub || '?'} Eps</span>
                </div>
              </div>

              <p className="text-white/40 text-[12px] line-clamp-2 leading-relaxed mb-6">
                {item.description?.replace(/<[^>]*>?/gm, '')}
              </p>

              <div className="flex items-center gap-2">
                <Link to={`/watch/${item.id}`} className="flex-1 h-10 bg-white hover:bg-gray-200 transition-colors rounded-lg flex items-center justify-center gap-2 text-black font-bold text-[13px]">
                  <FontAwesomeIcon icon={faPlay} className="text-[10px]" />
                  <span>Watch now</span>
                </Link>
                <button className="w-10 h-10 rounded-lg bg-[#2a2a2a] text-white flex items-center justify-center hover:bg-[#333]">
                   <FontAwesomeIcon icon={faBookmark} className="text-[14px]" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Default variant (existing logic)
  return (
    <div
      className={`flex flex-col ${!isFirstRow ? 'transition-transform duration-300 ease-in-out' : 'category-card-container'}`}
      style={{ height: "fit-content" }}
    >
      <div className="w-full h-auto pb-[140%] relative inline-block overflow-hidden rounded-lg shadow-lg group">
        <div
          className="inline-block bg-gray-900 absolute left-0 top-0 w-full h-full group hover:cursor-pointer"
          onClick={() =>
            navigate(
              `${path === "top-upcoming"
                ? `/${item.id}`
                : `/watch/${item.id}`
              }`
            )
          }
        >
          <img
            src={`${item.poster}`}
            alt={getSafeTitle(item.title, language, item.japanese_title)}
            className="block w-full h-full object-cover transition-all duration-500 ease-in-out group-hover:scale-105 group-hover:blur-sm"
            loading="lazy"
          />
        </div>
      </div>
      <Link
        to={`/${item.id}`}
        className="text-white font-semibold mt-3 item-title hover:text-white hover:cursor-pointer line-clamp-1"
      >
        {getSafeTitle(item.title, language, item.japanese_title)}
      </Link>
    </div>
  );
};

const CategoryCard = React.memo(
  ({
    label,
    data,
    showViewMore = true,
    className,
    categoryPage = false,
    cardStyle,
    path,
    limit,
    gridClass,
    variant = "default"
  }) => {
    const { language } = useLanguage();
    const navigate = useNavigate();
    const [globalMute, setGlobalMute] = useState(true);

    const toggleMute = () => setGlobalMute(!globalMute);

    const displayData = React.useMemo(() => 
      limit ? data.slice(0, limit) : data
    , [data, limit]);

    const [itemsToRender, setItemsToRender] = useState({ firstRow: [], remainingItems: [] });

    useEffect(() => {
      const handleResize = () => {
        if (categoryPage && window.innerWidth > 758 && displayData.length > 4) {
          setItemsToRender({ firstRow: displayData.slice(0, 4), remainingItems: displayData.slice(4) });
        } else {
          setItemsToRender({ firstRow: [], remainingItems: displayData });
        }
      };

      window.addEventListener("resize", handleResize);
      handleResize();

      return () => window.removeEventListener("resize", handleResize);
    }, [categoryPage, displayData]);

    return (
      <div className={`w-full ${className}`}>
        {label && (
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-bold text-2xl text-white max-[478px]:text-[18px] tracking-tight">
              {label}
            </h1>
            {showViewMore && (
              <Link
                to={`/${path}`}
                className="flex items-center gap-x-1 py-1 px-2 -mr-2 rounded-md
                  text-[13px] font-medium text-[#ffffff40] hover:text-white
                  transition-all duration-300 group"
              >
                View all
                <FaChevronRight className="text-[10px] transform transition-transform duration-300 
                  group-hover:translate-x-0.5" />
              </Link>
            )}
          </div>
        )}
        <div className={`grid ${gridClass || cardStyle || 'grid-cols-5 max-[1400px]:grid-cols-4 max-[758px]:grid-cols-3 max-[478px]:grid-cols-3'} gap-x-4 gap-y-12 transition-all duration-300 ease-in-out`}>
          {itemsToRender.remainingItems.map((item, index) => (
            <AnimeCard
              key={index}
              item={item}
              navigate={navigate}
              path={path}
              language={language}
              variant={variant}
              globalMute={globalMute}
              toggleMute={toggleMute}
            />
          ))}
        </div>
      </div>
    );
  }
);

CategoryCard.displayName = "CategoryCard";

export default CategoryCard;
