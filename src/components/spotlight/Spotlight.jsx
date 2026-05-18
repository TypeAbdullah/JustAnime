import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/autoplay";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "./Spotlight.css";
import Banner from "../banner/Banner";

const Spotlight = ({ spotlights }) => {
  return (
    <>
      <div className="relative h-[740px] max-[1390px]:h-[640px] max-[1100px]:h-[490px] max-md:h-[340px]">
        {spotlights && spotlights.length > 0 ? (
          <>
            <Swiper
              spaceBetween={0}
              slidesPerView={1}
              loop={true}
              allowTouchMove={true}
              grabCursor={true}
              pagination={{
                clickable: true,
                dynamicBullets: false,
              }}
              modules={[Pagination]}
              className="h-full overflow-hidden relative shadow-2xl"
            >
              {spotlights.map((item, index) => (
                <SwiperSlide className="text-black relative" key={index}>
                  {({ isActive }) => (
                    <Banner item={item} index={index} isActive={isActive} />
                  )}
                </SwiperSlide>
              ))}
            </Swiper>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-900 rounded-xl">
             <p className="text-zinc-500 font-medium">No spotlights to show.</p>
          </div>
        )}
      </div>
    </>
  );
};

export default Spotlight;