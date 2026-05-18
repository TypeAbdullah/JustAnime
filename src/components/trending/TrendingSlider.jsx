import { useState, useRef, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faPlay, 
  faPause,
  faStar, 
  faBookmark, 
  faVolumeUp,
  faVolumeMute,
  faChevronRight,
  faCalendarAlt,
  faLayerGroup,
  faCircle
} from "@fortawesome/free-solid-svg-icons";
import { useLanguage } from "@/src/context/LanguageContext";
import getSafeTitle from "@/src/utils/getSafetitle";
import "swiper/css";
import "swiper/css/navigation";
import "./TrendingSlider.css";

const TrendingCard = ({ item, language, isGlobalMuted, setIsGlobalMuted }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const iframeRef = useRef(null);
  const hoverTimeout = useRef(null);

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

  const toggleMute = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsGlobalMuted(!isGlobalMuted);
  };

  useEffect(() => {
    if (isHovered && iframeRef.current) {
      const timer = setTimeout(() => {
        iframeRef.current?.contentWindow?.postMessage(
          JSON.stringify({ event: "command", func: isGlobalMuted ? "mute" : "unMute", args: [] }),
          "*"
        );
        if (isPlaying) {
          iframeRef.current?.contentWindow?.postMessage(
            JSON.stringify({ event: "command", func: "playVideo", args: [] }),
            "*"
          );
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isHovered, isGlobalMuted, isPlaying]);

  return (
    <div 
      className="anime-card group relative"
      onMouseEnter={() => {
        hoverTimeout.current = setTimeout(() => setIsHovered(true), 500);
      }}
      onMouseLeave={() => {
        if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
        setIsHovered(false);
      }}
    >
      <Link to={`/${item.id}`} className="block" onDragStart={(e) => e.preventDefault()}>
        <div className="poster-wrapper relative aspect-[2/3] rounded-lg overflow-hidden group shadow-lg">
          <img
            src={item.poster}
            alt={getSafeTitle(item.title, language)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            draggable="false"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
             <FontAwesomeIcon icon={faPlay} className="text-4xl text-white drop-shadow-xl" />
          </div>
          {item.score && (
            <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md px-2 py-1 rounded-md flex items-center gap-1 border border-white/10">
              <FontAwesomeIcon icon={faStar} className="text-yellow-400 text-[10px]" />
              <span className="text-white text-[12px] font-bold">{item.score}</span>
            </div>
          )}
        </div>
      </Link>

      {/* Info Row: Type & Year */}
      <div className="flex items-center justify-between mt-3 px-1">
        <span className="text-[11px] text-white/50 font-bold uppercase tracking-wider">{item.type || 'TV Show'}</span>
        <span className="text-[11px] text-white/50 font-bold uppercase tracking-wider">{item.year || '2026'}</span>
      </div>

      {/* Title Row with Airing Dot */}
      <Link to={`/${item.id}`} className="flex items-center gap-2 mt-1.5 px-1 hover:text-white transition-colors group">
        <FontAwesomeIcon icon={faCircle} className="text-[8px] text-green-500 mt-0.5 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
        <h3 className="text-[14px] font-bold text-white/90 group-hover:text-white line-clamp-1 leading-tight tracking-tight">
          {getSafeTitle(item.title, language)}
        </h3>
      </Link>

      {isHovered && item.trailer && (
        <div 
          className="preview-card swiper-no-swiping absolute top-[-60px] left-[-30px] w-[380px] bg-[#141414] rounded-2xl shadow-[0_30px_80px_rgba(0,0,0,0.9)] z-[100] border border-white/5 animate-preview-pop"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="preview-video relative aspect-video overflow-hidden bg-black">
            <iframe
              ref={iframeRef}
              src={`https://www.youtube.com/embed/${item.trailer}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&playsinline=1&enablejsapi=1&origin=${window.location.origin}&autohide=1&disablekb=1`}
              className="absolute inset-0 w-full h-full scale-[1.6]"
              frameBorder="0"
              allow="autoplay; encrypted-media"
            ></iframe>
            <div className="interaction-shield absolute inset-0 z-10"></div>
            
            <div className="absolute top-3 right-3 z-20 flex gap-2">
               <button onClick={togglePlay} className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-xl flex items-center justify-center border border-white/10 hover:bg-black/80">
                  <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} className="text-white text-sm" />
               </button>
               <button onClick={toggleMute} className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-xl flex items-center justify-center border border-white/10 hover:bg-black/80">
                  <FontAwesomeIcon icon={isGlobalMuted ? faVolumeMute : faVolumeUp} className="text-white text-sm" />
               </button>
            </div>
          </div>

          <div className="p-5">
            <h4 className="text-white font-extrabold text-[20px] mb-3 leading-tight tracking-tight">{getSafeTitle(item.title, language)}</h4>
            
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
};

const TrendingSlider = ({ data }) => {
  const { language } = useLanguage();
  const [isGlobalMuted, setIsGlobalMuted] = useState(true);

  return (
    <div className="trending-slider-container mt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl md:text-3xl font-bold text-white tracking-tight">Trending Now</h2>
        <Link to="/trending" className="text-white/40 hover:text-white transition-colors flex items-center gap-2 text-sm font-semibold">
          View All <FontAwesomeIcon icon={faChevronRight} className="text-[10px]" />
        </Link>
      </div>

      <Swiper
        spaceBetween={15}
        slidesPerView={2.5}
        navigation={true}
        grabCursor={true}
        preventClicks={true}
        preventClicksPropagation={true}
        observer={true}
        observeParents={true}
        modules={[Navigation]}
        breakpoints={{
          640: { slidesPerView: 3.5 },
          1024: { slidesPerView: 5.5 },
          1440: { slidesPerView: 6.5 },
        }}
        className="trending-swiper"
      >
        {data && data.map((item, index) => (
          <SwiperSlide key={index} className="trending-slide">
            <TrendingCard 
                item={item} 
                language={language} 
                isGlobalMuted={isGlobalMuted} 
                setIsGlobalMuted={setIsGlobalMuted} 
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default TrendingSlider;
