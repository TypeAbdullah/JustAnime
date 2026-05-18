import { useState } from "react";
import PropTypes from "prop-types";
import CategoryCard from "@/src/components/categorycard/CategoryCard.jsx";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";

function TabbedAnimeSection({ topAiring, mostFavorite, latestCompleted, className = "", limit = 24 }) {
  const [activeTab, setActiveTab] = useState("season");

  const tabs = [
    { id: "season", label: "This Season", data: topAiring, path: "top-airing" },
    { id: "popular", label: "All Time Popular", data: mostFavorite, path: "most-favorite" },
    { id: "top", label: "Top Rated", data: latestCompleted, path: "completed" },
  ];

  const activeTabData = tabs.find((tab) => tab.id === activeTab);

  return (
    <div className={`w-full ${className} mt-12`}>
      <div className="flex flex-wrap items-center gap-3 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-2.5 rounded-lg text-[13px] font-bold transition-all duration-300 
              ${activeTab === tab.id
                ? "bg-white text-black shadow-[0_4px_15px_rgba(255,255,255,0.2)]"
                : "bg-[#2a2a2a] text-white/50 hover:text-white hover:bg-[#333]"
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <CategoryCard
        data={activeTabData.data}
        path={activeTabData.path}
        limit={limit}
        showViewMore={false}
        variant="cinematic"
        cardStyle="grid-cols-6 max-[1400px]:grid-cols-4 max-[1024px]:grid-cols-3 max-[758px]:grid-cols-2 max-[478px]:grid-cols-2"
      />

      <div className="flex justify-center mt-10">
        <Link 
          to={`/${activeTabData.path}`}
          className="w-full max-w-[600px] h-12 bg-[#1a1a1a] hover:bg-[#252525] border border-white/5 text-white/70 hover:text-white transition-all rounded-xl flex items-center justify-center font-bold text-sm"
        >
          View more
        </Link>
      </div>
    </div>
  );
}

TabbedAnimeSection.propTypes = {
  topAiring: PropTypes.array.isRequired,
  mostFavorite: PropTypes.array.isRequired,
  latestCompleted: PropTypes.array.isRequired,
  className: PropTypes.string,
};

export default TabbedAnimeSection;