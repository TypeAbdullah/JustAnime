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
  faLayerGroup
} from "@fortawesome/free-solid-svg-icons";
import { useLanguage } from "@/src/context/LanguageContext";
import getSafeTitle from "@/src/utils/getSafetitle";
import "swiper/css";
import "swiper/css/navigation";
import "../trending/TrendingSlider.css";

const PopularSlider = ({ data }) => {
  const { language } = useLanguage();
  const [isGlobalMuted, setIsGlobalMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [hoveredId, setHoveredId] = useState(null);
  const iframeRefs = useRef({});

  const toggleGlobalMute = (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    const newMuted = !isGlobalMuted;
    setIsGlobalMuted(newMuted);
    if (hoveredId && iframeRefs.current[hoveredId]) {
      iframeRefs.current[hoveredId].contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: newMuted ? "mute" : "unMute", args: [] }),
        "*"
      );
    }
  };

  const togglePlay = (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    const newPlaying = !isPlaying;
    setIsPlaying(newPlaying);
    if (hoveredId && iframeRefs.current[hoveredId]) {
      iframeRefs.current[hoveredId].contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: newPlaying ? "playVideo" : "pauseVideo", args: [] }),
        "*"
      );
    }
  };

  useEffect(() => {
    if (hoveredId && iframeRefs.current[hoveredId]) {
      const timer = setTimeout(() => {
        iframeRefs.current[hoveredId]?.contentWindow?.postMessage(
          JSON.stringify({ event: "command", func: isGlobalMuted ? "mute" : "unMute", args: [] }),
          "*"
        );
        if (isPlaying) {
          iframeRefs.current[hoveredId]?.contentWindow?.postMessage(
            JSON.stringify({ event: "command", func: "playVideo", args: [] }),
            "*"
          );
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [hoveredId, isGlobalMuted, isPlaying]);

  if (!data || data.length === 0) return null;

  return (
    <div className="trending-slider-container mt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl md:text-3xl font-bold text-white tracking-tight">Most Popular</h2>
        <Link to="/most-popular" className="text-white/40 hover:text-white transition-colors flex items-center gap-2 text-sm font-semibold">
          View All <FontAwesomeIcon icon={faChevronRight} className="text-[10px]" />
        </Link>
      </div>

      <Swiper
        spaceBetween={15}
        slidesPerView={2.5}
        navigation={true}
        observer={true}
        observeParents={true}
        grabCursor={true}
        preventClicks={true}
        preventClicksPropagation={true}
        modules={[Navigation]}
        breakpoints={{
          640: { slidesPerView: 4.5 },
          1024: { slidesPerView: 7.5 },
          1440: { slidesPerView: 9.5 },
        }}
        className="trending-swiper"
      >
        {data.map((item, index) => (
          <SwiperSlide key={index} className="trending-slide">
            <div 
              className="anime-card group relative"
              onMouseEnter={() => { setHoveredId(item.id); setIsPlaying(true); }}
              onMouseLeave={() => setHoveredId(null)}
            >
              <Link to={`/${item.id}`} className="block" onDragStart={(e) => e.preventDefault()}>
                <div className="poster-wrapper relative aspect-[2/3] rounded-xl overflow-hidden shadow-xl">
                  <img
                    src={item.poster}
                    alt={getSafeTitle(item.title, language)}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    draggable="false"
                  />
                  {item.score && (
                    <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md px-2 py-1 rounded-md flex items-center gap-1 border border-white/10">
                      <FontAwesomeIcon icon={faStar} className="text-yellow-400 text-[10px]" />
                      <span className="text-white text-[12px] font-bold">{item.score}</span>
                    </div>
                  )}
                </div>
                <h3 className="mt-4 text-[15px] font-bold text-white/90 group-hover:text-white transition-colors line-clamp-1 tracking-tight">
                  {getSafeTitle(item.title, language)}
                </h3>
              </Link>

              {/* Hover Preview Card */}
              {hoveredId === item.id && (
                <div className="preview-card absolute top-[-60px] left-[-30px] w-[380px] bg-[#141414] rounded-2xl shadow-[0_30px_100px_rgba(0,0,0,1)] z-[100] border border-white/5 animate-preview-pop">
                  <div className="preview-video relative aspect-video overflow-hidden bg-black">
                    {item.trailer ? (
                      <iframe
                        ref={el => iframeRefs.current[item.id] = el}
                        src={`https://www.youtube.com/embed/${item.trailer}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&playsinline=1&enablejsapi=1&origin=${window.location.origin}&autohide=1&disablekb=1`}
                        className="absolute inset-0 w-full h-full scale-[1.6]"
                        frameBorder="0"
                        allow="autoplay; encrypted-media"
                      ></iframe>
                    ) : (
                        <img src={item.banner || item.poster} className="w-full h-full object-cover opacity-50" />
                    )}
                    <div className="absolute inset-0 z-10 pointer-events-none"></div>
                    <div className="absolute top-3 right-3 z-20 flex gap-2">
                       <button onClick={togglePlay} className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-xl flex items-center justify-center border border-white/10 hover:bg-black/80 transition-colors">
                          <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} className="text-white text-sm" />
                       </button>
                       <button onClick={toggleGlobalMute} className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-xl flex items-center justify-center border border-white/10 hover:bg-black/80 transition-colors">
                          <FontAwesomeIcon icon={isGlobalMuted ? faVolumeMute : faVolumeUp} className="text-white text-sm" />
                       </button>
                    </div>
                  </div>
                  <div className="p-6">
                    <h4 className="text-white font-extrabold text-[22px] mb-4 leading-tight tracking-tight">{getSafeTitle(item.title, language)}</h4>
                    <div className="flex items-center flex-wrap gap-2 mb-5">
                      <span className="bg-[#2a2a2a] text-white text-[11px] font-bold px-2 py-1 rounded uppercase">{item.type || 'TV'}</span>
                      <span className="border border-green-500/50 text-green-500 text-[11px] font-bold px-2 py-1 rounded uppercase">POPULAR</span>
                      {item.genres?.slice(0, 2).map(genre => (
                        <span key={genre} className="bg-[#2a2a2a] text-white/80 text-[11px] font-bold px-2 py-1 rounded uppercase">{genre}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-5 mb-5 text-white/50">
                      <div className="flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faStar} className="text-[12px] text-white/30" />
                        <span className="text-sm font-bold text-white/80">{item.score ? (item.score * 10).toFixed(0) : '??'}%</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faLayerGroup} className="text-[12px] text-white/30" />
                        <span className="text-sm font-bold text-white/80">{item.episodes?.sub || '?'} episodes</span>
                      </div>
                    </div>
                    <p className="text-white/50 text-[13px] line-clamp-3 leading-relaxed mb-8">
                      {item.description?.replace(/<[^>]*>?/gm, '')}
                    </p>
                    <div className="flex items-center gap-3">
                      <Link to={`/watch/${item.id}`} className="flex-1 h-12 bg-white hover:bg-gray-200 transition-colors rounded-lg flex items-center justify-center gap-2 text-black font-bold text-sm">
                        <FontAwesomeIcon icon={faPlay} className="text-xs" />
                        <span>Watch now</span>
                      </Link>
                      <button className="w-12 h-12 rounded-lg bg-[#2a2a2a] text-white flex items-center justify-center hover:bg-[#333] transition-colors">
                         <FontAwesomeIcon icon={faBookmark} className="text-[16px]" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default PopularSlider;
