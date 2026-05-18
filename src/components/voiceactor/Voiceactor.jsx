import { useState } from "react";
import { FaChevronRight } from "react-icons/fa";
import VoiceactorList from "../voiceactorlist/VoiceactorList";

function Voiceactor({ animeInfo, className }) {
  const [showVoiceActors, setShowVoiceActors] = useState(false);
  console.log("Voiceactor animeInfo:", animeInfo);
  return (
    <div className={`w-full flex flex-col gap-y-5 ${className}`}>
      <div className="flex justify-between items-center">
        <h1 className="font-bold text-2xl text-zinc-100 max-[478px]:text-[18px] capitalize">
          Characters & Voice Actors
        </h1>
        <button 
          onClick={() => setShowVoiceActors(true)}
          className="flex items-center px-3 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700/80 transition-all duration-300 group"
        >
          <span className="text-zinc-300 text-sm font-medium group-hover:text-zinc-100">
            View more
          </span>
          <FaChevronRight className="text-zinc-400 text-xs ml-1.5 group-hover:text-zinc-300" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {animeInfo.charactersVoiceActors && animeInfo.charactersVoiceActors.length > 0 ? (
          animeInfo.charactersVoiceActors.slice(0, 12).map((character, index) => {
            if (!character.character) return null;
            return (
              <div
                key={index}
                className="flex items-stretch bg-[#141414] hover:bg-[#1a1a1a] rounded-lg overflow-hidden border border-white/5 transition-all duration-300 group shadow-lg"
              >
                {/* Character Image */}
                <div className="w-[65px] h-[90px] flex-shrink-0 bg-zinc-900">
                  <img
                    src={character.character.poster}
                    alt={character.character.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => { e.target.src = "https://i.postimg.cc/HnHKvHpz/no-avatar.jpg"; }}
                  />
                </div>

                {/* Content Section */}
                <div className="flex-1 flex justify-between p-3 min-w-0">
                  {/* Character Info */}
                  <div className="flex flex-col justify-between min-w-0 pr-2">
                    <div className="flex flex-col">
                      <h4 className="text-[13px] font-bold text-white truncate" title={character.character.name}>
                        {character.character.name}
                      </h4>
                      <span className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-tighter">
                        {character.character.cast || "SUPPORTING"}
                      </span>
                    </div>
                  </div>

                  {/* Voice Actor Info */}
                  {character.voiceActors?.length > 0 && character.voiceActors[0] && (
                    <div className="flex flex-col justify-between items-end min-w-0 pl-2">
                      <div className="flex flex-col items-end">
                        <h4 className="text-[13px] font-bold text-zinc-300 truncate w-full text-right" title={character.voiceActors[0].name}>
                          {character.voiceActors[0].name}
                        </h4>
                        <span className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-tighter">
                          Japanese
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Voice Actor Image */}
                {character.voiceActors?.length > 0 && character.voiceActors[0] && (
                  <div className="w-[65px] h-[90px] flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity bg-zinc-900">
                    <img
                      src={character.voiceActors[0].poster}
                      alt={character.voiceActors[0].name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => { e.target.src = "https://i.postimg.cc/HnHKvHpz/no-avatar.jpg"; }}
                    />
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-10 text-center text-zinc-500">
            No character information available for this series.
          </div>
        )}
      </div>

      {showVoiceActors && (
        <VoiceactorList
          id={animeInfo.id}
          isOpen={showVoiceActors}
          onClose={() => setShowVoiceActors(false)}
        />
      )}
    </div>
  );
}

export default Voiceactor;
