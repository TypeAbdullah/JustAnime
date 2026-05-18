import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Helmet } from 'react-helmet-async';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faPlay, 
  faBookmark, 
  faShareAlt, 
  faExternalLinkAlt, 
  faEye, 
  faChevronRight,
  faHome,
  faImage,
  faSortAmountDown,
  faBell,
  faVideo
} from "@fortawesome/free-solid-svg-icons";

import getAnimeInfo from "@/src/utils/getAnimeInfo.utils";
import getSafeTitle from "@/src/utils/getSafetitle";
import { useLanguage } from "@/src/context/LanguageContext";
import Loader from "@/src/components/Loader/Loader";
import ErrorPage from "@/src/components/error/Error";
import Voiceactor from "@/src/components/voiceactor/Voiceactor";
import CategoryCard from "@/src/components/categorycard/CategoryCard";
import { fetchTmdbEpisodes } from "@/src/utils/tmdb.utils";

import "./AnimeInfo.css";

const MetaItem = ({ label, value, isAiring = false }) => {
  if (!value) return null;
  return (
    <div className="meta-group">
      <span className="meta-label">{label}</span>
      <span className={`meta-value ${isAiring ? 'airing' : ''}`}>{value}</span>
    </div>
  );
};

const TrailerModal = ({ isOpen, onClose, trailerId }) => {
  if (!isOpen) return null;
  return (
    <div className="trailer-modal-overlay" onClick={onClose}>
      <div className="trailer-modal-content" onClick={e => e.stopPropagation()}>
        <button className="close-modal" onClick={onClose}>&times;</button>
        {trailerId ? (
          <iframe
            src={`https://www.youtube.com/embed/${trailerId}?autoplay=1`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        ) : (
          <div className="no-trailer">No trailer available for this series.</div>
        )}
      </div>
    </div>
  );
};

const AnimeInfo = ({ random = false }) => {
  const { language } = useLanguage();
  const { id: paramId } = useParams();
  const id = random ? null : paramId;
  const navigate = useNavigate();

  const [animeInfo, setAnimeInfo] = useState(null);
  const [episodesData, setEpisodesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("Episodes");
  const [showTrailer, setShowTrailer] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (showTrailer) {
      document.body.style.overflow = 'hidden';
      const handleEsc = (e) => {
        if (e.key === 'Escape') setShowTrailer(false);
      };
      window.addEventListener('keydown', handleEsc);
      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleEsc);
      };
    }
  }, [showTrailer]);

  useEffect(() => {
    const fetchInfo = async () => {
      setLoading(true);
      try {
        const data = await getAnimeInfo(id, random);
        if (!data?.data) throw new Error("Anime not found");
        setAnimeInfo(data.data);
        
        // Fetch TMDB episode thumbnails via anime offline database mapping
        const tmdbData = await fetchTmdbEpisodes(data.data.ani_id, data.data.title);
        if (tmdbData) {
          setEpisodesData(tmdbData);
        }
      } catch (err) {
        console.error("Error fetching anime info:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInfo();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id, random]);

  useEffect(() => {
    if (isMobile) {
      setActiveTab("Overview");
    } else if (activeTab === "Overview") {
      setActiveTab("Episodes");
    }
  }, [isMobile]);

  const safeTitle = useMemo(() => {
    if (!animeInfo) return "";
    return getSafeTitle(animeInfo.title, language, animeInfo.japanese_title);
  }, [animeInfo, language]);

  if (loading) return <Loader type="animeInfo" />;
  if (error || (!animeInfo && !loading)) return <ErrorPage />;

  const { poster, banner, description, animeInfo: info, characters, recommended_data } = animeInfo;

  // Final fix for undefined season
  const cleanSeason = info?.Premiered?.includes("undefined") ? null : info?.Premiered;

  return (
    <div className="anime-info-page">
      <Helmet>
        <title>{safeTitle} - JustAnime</title>
        <meta name="description" content={description?.replace(/<[^>]*>?/gm, '').slice(0, 160)} />
      </Helmet>

      {/* Full Page Backdrop */}
      <div className="info-backdrop">
        <img src={banner || poster} alt="backdrop" className="backdrop-img" />
        <div className="backdrop-overlay"></div>
      </div>

      <div className="container mx-auto px-4 lg:px-10 relative z-10">
        {/* Breadcrumb */}
        <div className="breadcrumb-nav">
          <Link to="/home" className="home-link"><FontAwesomeIcon icon={faHome} /></Link>
          <FontAwesomeIcon icon={faChevronRight} className="breadcrumb-separator" />
          <span className="breadcrumb-current">{safeTitle}</span>
        </div>

        <div className="info-content-wrapper">
          <div className="info-main-grid">
            
            {/* Sidebar */}
            <aside className="info-sidebar">
              <div className="info-poster-container">
                <img src={poster} alt={safeTitle} />
              </div>

              <div className="sidebar-actions">
                {info?.NextAiring && (
                  <div className="airing-badge">
                    <FontAwesomeIcon icon={faBell} />
                    <span>Next ep airing in {Math.ceil((info.NextAiring.airingAt - Date.now()/1000) / 86400)} days</span>
                  </div>
                )}
                <button className="trailer-btn" onClick={() => setShowTrailer(true)}>
                  <FontAwesomeIcon icon={faVideo} className="text-red-500" />
                  Watch trailer
                </button>
              </div>

              <div className="metadata-column">
                <MetaItem label="Format" value={animeInfo.type} />
                <MetaItem label="Status" value={animeInfo.status} isAiring={animeInfo.status === 'RELEASING' || animeInfo.status === 'AIRING'} />
                <MetaItem label="Aired" value={info?.Aired} />
                <MetaItem label="Season" value={cleanSeason} />
                <MetaItem label="Average score" value={`${(animeInfo.score * 10).toFixed(0)}%`} />
                
                <div className="meta-group">
                   <span className="meta-label">Studios</span>
                   <div className="meta-tags-list">
                      {(info?.Studios || "").split(",").map((s, i) => s.trim() && (
                        <span key={i} className="meta-tag">{s.trim()}</span>
                      ))}
                   </div>
                </div>

                <div className="meta-group">
                   <span className="meta-label">Genres</span>
                   <div className="meta-tags-list">
                      {info?.Genres?.map((g, i) => (
                        <span key={i} className="meta-tag">{g}</span>
                      ))}
                   </div>
                </div>

                <MetaItem label="Romaji" value={animeInfo.title} />
                <MetaItem label="Native" value={animeInfo.japanese_title} />
              </div>
            </aside>

            {/* Main Content Area */}
            <main className="info-header-content">
              {cleanSeason && (
                <span className="season-tag">{cleanSeason}</span>
              )}
              <h1 className="anime-main-title">{safeTitle}</h1>
              
              <div className="genres-pills">
                {info?.Genres?.slice(0, 3).map((g, i) => (
                  <span key={i} className="genre-pill">{g}</span>
                ))}
              </div>

              <div className="header-action-row">
                <Link to={`/watch/${animeInfo.id}`} className="watch-now-btn">
                  <FontAwesomeIcon icon={faPlay} />
                  Watch Now
                </Link>
                <button className="icon-btn" title="Bookmark">
                  <FontAwesomeIcon icon={faBookmark} />
                </button>
                <button className="icon-btn" title="Share">
                  <FontAwesomeIcon icon={faShareAlt} />
                </button>
                <a href={`https://anilist.co/anime/${animeInfo.ani_id}`} target="_blank" rel="noreferrer" className="icon-btn" title="AniList">
                  <span className="font-black text-[10px]">AL</span>
                </a>
                <a href={`https://myanimelist.net/anime/${animeInfo.mal_id}`} target="_blank" rel="noreferrer" className="icon-btn" title="MyAnimeList">
                   <span className="font-black text-[10px]">MAL</span>
                </a>
              </div>

              <div className="synopsis-wrapper">
                <div 
                  className={`synopsis-text ${showFullDesc ? 'expanded' : ''}`} 
                  dangerouslySetInnerHTML={{ __html: description || "" }}
                ></div>
                {description?.length > (isMobile ? 150 : 300) && (
                  <button className="desc-toggle-btn" onClick={() => setShowFullDesc(!showFullDesc)}>
                    {showFullDesc ? "Show Less" : "Show More"}
                  </button>
                )}
              </div>

              {/* Tabs Section */}
              <div className="info-tabs-container">
                <div className="tabs-header">
                  {(isMobile ? ["Overview", "Episodes", "Characters", "Related", "More like this"] : ["Episodes", "Characters", "Related", "More like this"]).map(tab => (
                    <div 
                      key={tab} 
                      className={`tab-item ${activeTab === tab ? 'active' : ''}`}
                      onClick={() => setActiveTab(tab)}
                    >
                      {tab}
                    </div>
                  ))}
                </div>

                <div className="tab-content">
                  {activeTab === "Overview" && isMobile && (
                    <div className="overview-tab-view">
                       <div className="mobile-metadata metadata-column">
                          <MetaItem label="Format" value={animeInfo.type} />
                          <MetaItem label="Status" value={animeInfo.status} isAiring={animeInfo.status === 'RELEASING' || animeInfo.status === 'AIRING'} />
                          <MetaItem label="Aired" value={info?.Aired} />
                          <MetaItem label="Season" value={cleanSeason} />
                          <MetaItem label="Average score" value={`${(animeInfo.score * 10).toFixed(0)}%`} />
                          <MetaItem label="Studios" value={info?.Studios} />
                          <MetaItem label="Source" value={info?.Source} />
                          <MetaItem label="Native Title" value={animeInfo.japanese_title} />
                       </div>
                    </div>
                  )}

                  {activeTab === "Episodes" && (
                    <div className="episodes-tab-view">
                      <div className="episodes-top-row">
                        <div className="episode-count-pill">{animeInfo.sub_episodes || "?"} Episodes</div>
                        <div className="ep-grid-controls">
                           <div className="control-btn"><FontAwesomeIcon icon={faImage} /></div>
                           <div className="control-btn"><FontAwesomeIcon icon={faSortAmountDown} /></div>
                        </div>
                      </div>

                      <div className="ep-thumbnail-grid">
                        {(Array.isArray(episodesData) && episodesData.length > 0 
                          ? episodesData 
                          : Array.from({ length: Number(animeInfo?.sub_episodes) || 0 })
                        ).map((ep, i) => {
                          const epNum = ep?.number || i + 1;
                          const epTitle = ep?.title || `Episode ${epNum}`;
                          const epThumb = ep?.thumbnail || banner || poster;
                          
                          return (
                            <Link to={`/watch/${animeInfo.id}?ep=${epNum}`} key={i} className="ep-card group">
                              <div className="ep-thumb-wrapper">
                                <img src={epThumb} alt={epTitle} className="transition-transform duration-500 group-hover:scale-110" />
                                <div className="ep-badge">Ep {epNum}</div>
                                <div className="ep-views">
                                  <FontAwesomeIcon icon={faEye} className="text-[9px]" />
                                  {(Math.random() * 50 + 1).toFixed(1)}K
                                </div>
                              </div>
                              <h5 className="ep-title group-hover:text-white transition-colors" title={epTitle}>
                                 {epTitle}
                              </h5>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {activeTab === "Characters" && (
                    <Voiceactor animeInfo={animeInfo} />
                  )}

                  {activeTab === "Related" && (
                     <CategoryCard
                       label="Related Anime"
                       data={animeInfo.related_data}
                       limit={animeInfo.related_data?.length}
                       showViewMore={false}
                       gridClass="grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
                     />
                  )}

                  {activeTab === "More like this" && (
                    <CategoryCard
                      label="Recommended for you"
                      data={recommended_data}
                      limit={recommended_data?.length}
                      showViewMore={false}
                      gridClass="grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
                    />
                  )}
                </div>
              </div>
            </main>

          </div>
        </div>
      </div>

      <TrailerModal 
        isOpen={showTrailer} 
        onClose={() => setShowTrailer(false)} 
        trailerId={animeInfo.trailer} 
      />
    </div>
  );
};


export default AnimeInfo;
