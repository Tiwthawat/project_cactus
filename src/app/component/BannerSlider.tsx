'use client';
import React, { useEffect, useState } from "react";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa";

interface Product {
  Pid: number;
  Pname: string;
  Ppicture: string;
}

export default function BannerSlider() {
  const [banners, setBanners] = useState<Product[]>([]);
  const [index, setIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("http://localhost:3000/Product");
        const data = await res.json();
        const sliced = data.slice(0, 6);
        setBanners(sliced);
      } catch (err) {
        console.error("โหลด Banner ไม่สำเร็จ:", err);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!isAutoPlay || !banners.length) return;
    
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % banners.length);
    }, 4000);
    
    return () => clearInterval(timer);
  }, [banners, isAutoPlay]);

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

  if (!banners.length)
    return (
      <div className="w-full h-96 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse shadow-lg" />
    );

  return (
    <div className="relative w-full overflow-hidden shadow-2xl group">
      {/* รูปภาพ */}
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {banners.map((p) => (
          <div key={p.Pid} className="w-full flex-shrink-0 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent z-10" />
            <img
              src={`http://localhost:3000${p.Ppicture}`}
              className="w-full h-64 sm:h-80 md:h-96 lg:h-[500px] object-cover"
              alt={p.Pname}
            />
            <div className="absolute bottom-8 left-8 z-20 text-white">
              <h3 className="text-2xl md:text-3xl font-bold drop-shadow-lg">
                {p.Pname}
              </h3>
            </div>
          </div>
        ))}
      </div>

      {/* ปุ่มซ้าย-ขวา */}
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

      {/* จุด indicator */}
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

      {/* Thumbnail preview (แสดงบน desktop) */}
      <div className="absolute bottom-20 left-0 right-0 hidden md:flex justify-center gap-2 px-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {banners.map((p, i) => (
          <button
            key={p.Pid}
            onClick={() => goToSlide(i)}
            className={`relative overflow-hidden rounded-lg transition-all duration-300 ${
              i === index
                ? "ring-4 ring-white scale-110"
                : "opacity-60 hover:opacity-100 hover:scale-105"
            }`}
          >
            <img
              src={`http://localhost:3000${p.Ppicture}`}
              className="w-16 h-12 object-cover"
              alt={`Thumbnail ${p.Pname}`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}