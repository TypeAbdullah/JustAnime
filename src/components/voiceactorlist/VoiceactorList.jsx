import { useState, useEffect } from "react";
import {
  faAngleDoubleLeft,
  faAngleDoubleRight,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import fetchVoiceActorInfo from "@/src/utils/getVoiceActor.utils";
import VoiceActorlistLoader from "../Loader/VoiceActorlist.loader";
import { useNavigate } from "react-router-dom";
import Error from "../error/Error";
import {
  cleanupScrollbar,
  toggleScrollbar,
} from "@/src/helper/toggleScrollbar";
import PageSlider from "../pageslider/PageSlider";

function VoiceactorList({ id, isOpen, onClose }) {
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(null);
  const [VoiceactorList, setVoiceactorList] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    toggleScrollbar(isOpen);
    return () => {
      cleanupScrollbar();
    };
  }, [isOpen]);

  useEffect(() => {
    const fetchCategoryInfo = async () => {
      setLoading(true);
      try {
        const data = await fetchVoiceActorInfo(id, page);
        setVoiceactorList(data.data);
        setTotalPages(data.totalPages);
        setLoading(false);
      } catch (err) {
        setError(err);
        console.error("Error fetching category info:", err);
      }
    };
    fetchCategoryInfo();
  }, [page]);

  if (error) {
    navigate("/error-page");
    return <Error />;
  }
  if (!VoiceactorList) {
    navigate("/404-not-found-page");
    return null;
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm z-[1000000]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="min-h-screen w-full py-4 sm:py-8 px-2 sm:px-4 flex items-center justify-center">
        <div
          className="w-full max-w-[920px] bg-zinc-900/80 backdrop-blur-xl rounded-xl border border-zinc-800 shadow-2xl max-h-[85vh] flex flex-col mx-auto max-sm:max-h-[80vh] max-sm:w-[92%] max-sm:my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative flex items-center justify-between p-3 sm:p-6 border-b border-zinc-800/50 flex-shrink-0">
            {!loading && (
              <h2 className="text-base sm:text-xl font-bold text-zinc-100">
                Characters & Voice Actors
              </h2>
            )}
            <button
              onClick={onClose}
              className="absolute right-2 sm:right-4 top-2 sm:top-4 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-all duration-300"
            >
              <span className="text-lg sm:text-xl leading-none mb-0.5">&times;</span>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-2 sm:p-6 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
            {loading ? (
              <VoiceActorlistLoader />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {VoiceactorList?.map((item, index) => {
                  if (!item.character) return null;
                  return (
                    <div
                      key={index}
                      className="flex items-stretch bg-[#141414] rounded-lg overflow-hidden border border-white/5 transition-all duration-300 shadow-md group"
                    >
                      {/* Character Image */}
                      <div className="w-[60px] h-[85px] flex-shrink-0 bg-zinc-900">
                        <img
                          src={item.character.poster}
                          alt={item.character.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => { e.target.src = "https://i.postimg.cc/HnHKvHpz/no-avatar.jpg"; }}
                        />
                      </div>

                      {/* Content Section */}
                      <div className="flex-1 flex justify-between p-2.5 min-w-0">
                        {/* Character Info */}
                        <div className="flex flex-col justify-between min-w-0 pr-2">
                          <div className="flex flex-col">
                            <h4 className="text-[12px] font-bold text-white truncate" title={item.character.name}>
                              {item.character.name}
                            </h4>
                            <span className="text-[9px] font-extrabold text-zinc-500 uppercase tracking-tighter">
                              {item.character.cast || "SUPPORTING"}
                            </span>
                          </div>
                        </div>

                        {/* Voice Actor Info */}
                        {item.voiceActors?.length > 0 && item.voiceActors[0] && (
                          <div className="flex flex-col justify-between items-end min-w-0 pl-2">
                            <div className="flex flex-col items-end">
                              <h4 className="text-[12px] font-bold text-zinc-300 truncate w-full text-right" title={item.voiceActors[0].name}>
                                {item.voiceActors[0].name}
                              </h4>
                              <span className="text-[9px] font-extrabold text-zinc-500 uppercase tracking-tighter">
                                Japanese
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Voice Actor Image */}
                      {item.voiceActors?.length > 0 && item.voiceActors[0] && (
                        <div className="w-[60px] h-[85px] flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity bg-zinc-900">
                          <img
                            src={item.voiceActors[0].poster}
                            alt={item.voiceActors[0].name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => { e.target.src = "https://i.postimg.cc/HnHKvHpz/no-avatar.jpg"; }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="p-2 sm:p-6 sm:pt-2 border-t border-zinc-800/50 flex-shrink-0">
            <PageSlider
              page={page}
              totalPages={totalPages}
              handlePageChange={setPage}
              start={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default VoiceactorList;
