"use client";
import React, { useEffect, useState } from "react";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa";

type Banner = { src: string; title?: string };

const banners: Banner[] = [
  { src: "/bannerlogo.png", title: "" }, 
  { src: "/bannerlogo.png", title: "" }, 
  { src: "/bannerlogo.png", title: "" },
  { src: "/bannerlogo.png", title: "" },
 
];

export default function BannerSlider() {
  const [index, setIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  useEffect(() => {
    if (!isAutoPlay || banners.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [isAutoPlay]);

  const goToSlide = (i: number) => {
    setIndex(i);
    setIsAutoPlay(false);
    setTimeout(() => setIsAutoPlay(true), 8000);
  };

  const prevSlide = () => {
    setIndex((prev) => (prev - 1 + banners.length) % banners.length);
    setIsAutoPlay(false);
    setTimeout(() => setIsAutoPlay(true), 8000);
  };

  const nextSlide = () => {
    setIndex((prev) => (prev + 1) % banners.length);
    setIsAutoPlay(false);
    setTimeout(() => setIsAutoPlay(true), 8000);
  };

  return (
    <div className="relative w-full overflow-hidden shadow-2xl group">
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {banners.map((b, i) => (
          <div key={i} className="w-full flex-shrink-0 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent z-10" />
            <img
              src={b.src}
              className="w-full h-64 sm:h-80 md:h-96 lg:h-[500px] object-cover"
              alt={b.title ?? `banner-${i + 1}`}
            />
            {b.title && (
              <div className="absolute bottom-8 left-8 z-20 text-white">
                <h3 className="text-2xl md:text-3xl font-bold drop-shadow-lg">
                  {b.title}
                </h3>
              </div>
            )}
          </div>
        ))}
      </div>

      {banners.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-white/90 hover:bg-white text-gray-800 rounded-full p-3 shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
            aria-label="Previous slide"
          >
            <FaAngleLeft className="w-6 h-6" />
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-white/90 hover:bg-white text-gray-800 rounded-full p-3 shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
            aria-label="Next slide"
          >
            <FaAngleRight className="w-6 h-6" />
          </button>

          <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-20">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => goToSlide(i)}
                className={`transition-all duration-300 rounded-full ${
                  i === index
                    ? "bg-white w-10 h-3"
                    : "bg-white/60 hover:bg-white/80 w-3 h-3"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
