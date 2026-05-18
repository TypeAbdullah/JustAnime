import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComment, faThumbsUp } from "@fortawesome/free-solid-svg-icons";

const RecentComments = () => {
  const placeholderComments = [
    {
      anime: "ONE PIECE",
      episode: "Ep 269",
      text: "well not torn to torn but there will be a satisfying moment at the end of arc from robin",
      user: "naruto66206o",
      time: "3m ago",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=naruto"
    },
    {
      anime: "My Hero Academia Season 5",
      episode: "Ep 18",
      text: "not bakugo getting hugged too lmao:sob:",
      user: "adegenerate",
      time: "6m ago",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=hero"
    },
    {
      anime: "That Time I Got Reincarnated as a Slime Season 4",
      episode: "Ep 5",
      text: "Noooo!!! Why",
      user: "Headache",
      time: "8m ago",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=slime"
    },
    {
      anime: "I Made Friends with the Second Prettiest Girl in My...",
      episode: "Ep 5",
      text: "mangareader use brave browser",
      user: "lagionary",
      time: "12m ago",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=friend"
    }
  ];

  return (
    <div className="recent-comments-container mt-10">
      <h2 className="text-xl font-bold text-white mb-6">Recent Comments</h2>
      <div className="flex flex-col gap-4">
        {placeholderComments.map((comment, index) => (
          <div key={index} className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-white/90 uppercase tracking-wider">{comment.anime}</span>
                <span className="text-[10px] text-white/40">{comment.episode}</span>
              </div>
              <div className="flex gap-3 text-white/30 text-[10px]">
                <div className="flex items-center gap-1">
                  <FontAwesomeIcon icon={faComment} /> 0
                </div>
                <div className="flex items-center gap-1">
                  <FontAwesomeIcon icon={faThumbsUp} /> {index === 3 ? 1 : 0}
                </div>
              </div>
            </div>
            <p className="text-white/60 text-[13px] line-clamp-2 mb-4 leading-relaxed italic">
              "{comment.text}"
            </p>
            <div className="flex items-center gap-2">
              <img src={comment.avatar} alt={comment.user} className="w-5 h-5 rounded-full" />
              <span className="text-[11px] font-bold text-white/70">{comment.user}</span>
              <span className="text-[10px] text-white/30 ml-auto">{comment.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentComments;
