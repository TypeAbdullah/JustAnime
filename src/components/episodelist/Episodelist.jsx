import { useLanguage } from "@/src/context/LanguageContext";
import {
  faCirclePlay,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState, useEffect, useRef } from "react";

function Episodelist({
  episodes,
  onEpisodeClick,
  currentEpisode,
  totalEpisodes,
}) {
  const [activeEpisodeId, setActiveEpisodeId] = useState(currentEpisode);
  const { language } = useLanguage();
  const listContainerRef = useRef(null);
  const activeEpisodeRef = useRef(null);
  const [episodeNum, setEpisodeNum] = useState(currentEpisode);
  const [searchedEpisode, setSearchedEpisode] = useState(null);

  const scrollToActiveEpisode = () => {
    if (activeEpisodeRef.current && listContainerRef.current) {
      const container = listContainerRef.current;
      const activeEpisode = activeEpisodeRef.current;
      const containerTop = container.getBoundingClientRect().top;
      const containerHeight = container.clientHeight;
      const activeEpisodeTop = activeEpisode.getBoundingClientRect().top;
      const activeEpisodeHeight = activeEpisode.clientHeight;
      const offset = activeEpisodeTop - containerTop;
      container.scrollTop =
        container.scrollTop +
        offset -
        containerHeight / 2 +
        activeEpisodeHeight / 2;
    }
  };

  useEffect(() => {
    setActiveEpisodeId(episodeNum);
  }, [episodeNum]);

  useEffect(() => {
    scrollToActiveEpisode();
  }, [activeEpisodeId]);

  useEffect(() => {
    const activeEpisode = episodes?.find(
      (item) => item?.id.match(/ep=(.+)/)?.[1] === activeEpisodeId
    );
    if (activeEpisode) {
      setEpisodeNum(activeEpisode?.episode_no);
    }
  }, [activeEpisodeId, episodes]);

  return (
    <div className="flex flex-col w-full h-full">
      <div ref={listContainerRef} className="w-full flex-1 overflow-y-auto scrollbar-hide">
        <div className="flex flex-col gap-0.5">
          {episodes?.map((item, index) => {
              const episodeNumber = item?.id.match(/ep=(.+)/)?.[1];
              const isActive = activeEpisodeId === episodeNumber || currentEpisode === episodeNumber;
              const isSearched = searchedEpisode === item?.id;

              return (
                <div
                  key={item?.id}
                  ref={isActive ? activeEpisodeRef : null}
                  className={`w-full px-2 py-2 flex items-start gap-x-3 cursor-pointer transition-all hover:bg-[#1a1a1a] rounded-xl group ${isActive ? "bg-[#272727]" : ""} ${isSearched ? "ring-1 ring-white/50" : ""}`}
                  onClick={() => {
                    if (episodeNumber) {
                      onEpisodeClick(episodeNumber);
                      setActiveEpisodeId(episodeNumber);
                      setSearchedEpisode(null);
                    }
                  }}
                >
                  {/* Thumbnail */}
                  <div className={`flex-shrink-0 w-[140px] aspect-video bg-white/5 rounded-lg overflow-hidden relative shadow-sm`}>
                    {item?.thumbnail ? (
                      <img src={item.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#1a1a1a]">
                        <span className="text-[10px] font-bold text-gray-600">No Image</span>
                      </div>
                    )}
                    {/* Ep Badge */}
                    <div className="absolute bottom-1 left-1 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                       Ep {index + 1}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 py-0.5">
                    <h1 className={`line-clamp-2 text-[14px] leading-tight transition-colors ${isActive ? "text-white font-bold" : "text-[#f1f1f1] font-semibold group-hover:text-white"}`}>
                      {language === "EN" ? item?.title : item?.japanese_title}
                    </h1>
                    <div className="mt-1 flex flex-col gap-0.5">
                       <div className="flex items-center gap-1.5 text-[12px] text-[#aaaaaa]">
                          <span>{(10 + (index % 7) * 3)}K views</span>
                          <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                          <span>{item?.aired ? new Date(item.aired).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "Recently"}</span>
                       </div>
                       {item?.filler && (
                         <span className="text-[10px] uppercase tracking-wider text-orange-500 font-bold">Filler</span>
                       )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

export default Episodelist;
