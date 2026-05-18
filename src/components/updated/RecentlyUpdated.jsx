import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight, faPlay, faClock, faEye } from "@fortawesome/free-solid-svg-icons";
import { useLanguage } from "@/src/context/LanguageContext";
import getSafeTitle from "@/src/utils/getSafetitle";
import { fetchSingleEpThumbnail } from "@/src/utils/tmdb.utils";
import "./RecentlyUpdated.css";

const UpdatedCard = ({ item, language }) => {
  const [thumbnail, setThumbnail] = useState(item.banner || item.poster);

  useEffect(() => {
    let cancelled = false;
    const loadThumb = async () => {
      const tmdbThumb = await fetchSingleEpThumbnail(item.ani_id || item.id, item.episode_no);
      if (tmdbThumb && !cancelled) {
        setThumbnail(tmdbThumb);
      }
    };
    loadThumb();
    return () => { cancelled = true; };
  }, [item.id, item.ani_id, item.episode_no]);

  const getRelativeTime = (timestamp) => {
    if (!timestamp) return `${Math.floor(Math.random() * 20 + 1)} hours ago`;
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;
    if (diff < 0) return "Just now";
    
    const minutes = Math.floor(diff / 60);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };
  
  return (
    <div className="updated-card group">
      <Link to={`/watch/${item.id}?ep=${item.episode_no}`} className="updated-thumbnail-wrapper">
        <img
          src={thumbnail}
          alt={getSafeTitle(item.title, language)}
          className="updated-thumbnail-img"
          loading="lazy"
        />
        <div className="updated-thumbnail-overlay"></div>
        <div className="updated-episode-badge">
          Ep {item.episode_no}
        </div>
        <div className="updated-play-button">
           <div className="updated-play-icon">
              <FontAwesomeIcon icon={faPlay} className="ml-0.5" />
           </div>
        </div>
      </Link>

      <div className="updated-info">
        <div className="updated-avatar">
           <img 
             src={item.poster} 
             alt="avatar" 
           />
        </div>
        <div className="updated-meta">
          <h4 className="updated-ep-title">
            Episode {item.episode_no}
          </h4>
          <p className="updated-anime-title">
            {getSafeTitle(item.title, language)}
          </p>
          <div className="updated-stats">
            <span className="updated-stat-item">
              <FontAwesomeIcon icon={faEye} />
              {(Math.random() * 20 + 1).toFixed(1)}K views
            </span>
            <span className="updated-stat-item">
              <FontAwesomeIcon icon={faClock} />
              {getRelativeTime(item.airingAt)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const RecentlyUpdated = ({ data }) => {
  const { language } = useLanguage();

  if (!data || data.length === 0) return null;

  return (
    <div className="recently-updated-container mt-16 mb-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            Recently Updated
        </h2>
        <Link to="/latest" className="updated-view-all">
          View All <FontAwesomeIcon icon={faChevronRight} />
        </Link>
      </div>

      <div className="updated-grid">
        {data.slice(0, 100).map((item, index) => (
          <UpdatedCard key={index} item={item} language={language} />
        ))}
      </div>
    </div>
  );
};

export default RecentlyUpdated;
