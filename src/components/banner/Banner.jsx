import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlay,
  faPause,
  faVolumeUp,
  faVolumeMute,
  faBookmark,
} from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import { useLanguage } from "@/src/context/LanguageContext";
import getSafeTitle from "@/src/utils/getSafetitle";
import "./Banner.css";

function Banner({ item, index, isActive }) {
  const { language } = useLanguage();
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);
  const iframeRef = useRef(null);

  useEffect(() => {
    if (isActive && item.trailer) {
      setShowTrailer(true);
    } else {
      setShowTrailer(false);
      setIsPlaying(true); // Reset state for next time
    }
  }, [isActive, item.trailer]);

  const toggleMute = () => {
    const command = isMuted ? "unMute" : "mute";
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func: command, args: [] }),
      "*"
    );
    setIsMuted(!isMuted);
  };

  const togglePlay = () => {
    const command = isPlaying ? "pauseVideo" : "playVideo";
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func: command, args: [] }),
      "*"
    );
    setIsPlaying(!isPlaying);
  };

  const scorePercentage = item.score ? Math.round(item.score * 10) : null;

  return (
    <section className="spotlight w-full h-full relative overflow-hidden bg-black">
      {/* Background Poster fallback */}
      <img
        src={`${item.banner || item.poster}`}
        alt={getSafeTitle(item.title, language, item.japanese_title)}
        className={`absolute inset-0 object-cover w-full h-full z-[0] transition-opacity duration-1000 ${showTrailer ? 'opacity-0' : 'opacity-100'}`}
        draggable="false"
      />

      {/* Video Trailer - Only render if isActive is true */}
      {isActive && showTrailer && item.trailer && (
        <div className="trailer-container">
          <iframe
            ref={iframeRef}
            src={`https://www.youtube.com/embed/${item.trailer}?autoplay=1&mute=1&controls=0&loop=1&playlist=${item.trailer}&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&playsinline=1&enablejsapi=1&origin=${window.location.origin}&autohide=1&disablekb=1`}
            frameBorder="0"
            allow="autoplay; encrypted-media"
            allowFullScreen
            title="trailer"
          ></iframe>
        </div>
      )}

      {/* Cinematic Overlay */}
      <div className="spotlight-overlay absolute inset-0 z-[2]"></div>

      <div className="absolute flex flex-col left-0 bottom-[15%] w-[65%] px-4 sm:px-6 lg:px-10 z-[3] max-md:w-full max-md:bottom-[20px]">
        {/* Title */}
        <h3 className="text-white banner-title line-clamp-2 text-5xl font-extrabold text-left tracking-tight max-[1390px]:text-[36px] max-md:text-2xl leading-[1.1]">
          {getSafeTitle(item.title, language, item.japanese_title)}
        </h3>

        {/* Metadata Chips */}
        <div className="metadata-chips flex flex-wrap items-center gap-2 mt-5">
          {item.type && (
            <div className="metadata-chip">
              {item.type === "TV" ? "TV Show" : item.type}
            </div>
          )}
          {scorePercentage && (
            <div className="metadata-chip score">
              {scorePercentage}%
            </div>
          )}
          {item.tvInfo?.duration && (
            <div className="metadata-chip">
              {item.tvInfo.duration}
            </div>
          )}
          {item.status && (
            <div className="metadata-chip year">
              {item.status}
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-white/60 text-[15px] font-medium mt-5 text-left line-clamp-2 max-w-[600px] max-md:hidden leading-relaxed">
          {item.description?.replace(/<[^>]*>?/gm, '')}
        </p>

        {/* Action Buttons */}
        <div className="action-buttons flex items-center gap-3 mt-10 max-md:mt-5">
          <Link
            to={`/watch/${item.id}`}
            className="watch-now-btn"
          >
            <FontAwesomeIcon icon={faPlay} className="text-[14px]" />
            <span>Watch Now</span>
          </Link>
          
          <button className="icon-btn" title="Add to List">
            <FontAwesomeIcon icon={faBookmark} className="text-[16px]" />
          </button>

          {item.trailer && (
            <>
              <button 
                className="icon-btn" 
                onClick={togglePlay}
                title={isPlaying ? "Pause" : "Resume"}
              >
                <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} className="text-[16px]" />
              </button>
              <button 
                className="icon-btn" 
                onClick={toggleMute}
                title={isMuted ? "Unmute" : "Mute"}
              >
                <FontAwesomeIcon icon={isMuted ? faVolumeMute : faVolumeUp} className="text-[16px]" />
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default Banner;