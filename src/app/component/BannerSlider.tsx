"use client";
import React, { useEffect, useState } from "react";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa";
import { useRouter } from "next/navigation";

type Banner = {
  src: string;
  heading?: string;
  subheading?: string;
  buttonText?: string;
  href?: string;
  overlay?: boolean;
  kicker?: string;       // ✅ เพิ่ม: แถบคำเล็กๆบนหัวข้อ (LIVE / SHIPPING / NEW)
  chips?: string[];      // ✅ เพิ่ม: จุดขายสั้นๆ 2-3 อัน
};

const banners: Banner[] = [

  {
    src: "banner-03-rare.png",
    kicker: "SHIPPING DEAL",
    heading: "ค่าส่งเริ่มต้น 50฿",
    subheading: "ซื้อ 1–999฿: 50฿ • 1,000฿+: ส่งฟรี!!!",
    buttonText: "Shop Now",
    href: "/",
    overlay: true,
   
  },
  {
    src: "banner-01-hero.png",
    kicker: "AUCTION HOUSE",
    heading: "Auction Cactus",
    
    buttonText: "Explore Auctions",
    href: "/auctions",
    overlay: true,
    
  },
 
  
];

export default function BannerSlider() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  useEffect(() => {
    if (!isAutoPlay || banners.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % banners.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isAutoPlay]);

  const pauseAuto = () => {
    setIsAutoPlay(false);
    setTimeout(() => setIsAutoPlay(true), 8000);
  };

  const goToSlide = (i: number) => {
    setIndex(i);
    pauseAuto();
  };
  const prevSlide = () => {
    setIndex((prev) => (prev - 1 + banners.length) % banners.length);
    pauseAuto();
  };
  const nextSlide = () => {
    setIndex((prev) => (prev + 1) % banners.length);
    pauseAuto();
  };

  return (
    <section className="relative w-full">
      {/* ✅ ทำให้มันดูเป็น “โปรหลัก” ด้วยกรอบ + แสง + มิติ */}
      <div className="relative w-full overflow-hidden rounded-3xl shadow-2xl group ring-1 ring-black/5 bg-white">
        {/* Slides */}
        <div
          className="flex transition-transform duration-700 ease-[cubic-bezier(.2,.8,.2,1)]"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {banners.map((b, i) => (
            <div
              key={i}
              className={`w-full flex-shrink-0 relative ${b.href ? "cursor-pointer" : ""}`}
              onClick={() => b.href && router.push(b.href)}
            >
              {/* Image */}
              <img
                src={b.src}
                className="w-full h-64 sm:h-80 md:h-[420px] lg:h-[520px] object-cover select-none"
                alt={b.heading ?? `banner-${i + 1}`}
                draggable={false}
              />

              {/* ✅ สปอร์ต: vignette + spotlight + noise (คมขึ้น แต่ไม่ดุทึบ) */}
              {b.overlay !== false && (
                <>
                  <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/55 via-black/25 to-black/10" />
                  <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_75%_45%,rgba(16,185,129,0.38),transparent_60%)]" />
                  <div className="absolute inset-0 z-10 opacity-[0.08] mix-blend-overlay bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22400%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22400%22 height=%22400%22 filter=%22url(%23n)%22 opacity=%220.35%22/%3E%3C/svg%3E')]" />
                </>
              )}

              {/* Text overlay */}
              {(b.heading || b.subheading || b.buttonText) && (
                <div className="absolute inset-0 z-20 flex items-center pointer-events-none">
                  <div className="ml-auto mr-4 sm:mr-8 md:mr-14 max-w-[620px] w-full px-4 sm:px-6">
                    {/* ✅ glass panel แบบคม: ขอบ+เงา+blur พอดี */}
                    <div className="pointer-events-auto rounded-3xl bg-white/12 backdrop-blur-xl border border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.35)] p-5 sm:p-7 md:p-8">
                      {/* kicker */}
                      {b.kicker && (
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wider
                                        bg-emerald-400/15 text-emerald-100 border border-emerald-300/25">
                          <span className={b.kicker.includes("LIVE") ? "text-emerald-300" : ""}>
                            {b.kicker}
                          </span>
                        </div>
                      )}

                      {/* Heading */}
                      {b.heading && (
                        <div className="mt-3">
                          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-[0_8px_30px_rgba(0,0,0,0.55)]">
                            {b.heading}
                          </h2>
                          {/* accent line */}
                          <div className="mt-4 h-1 w-16 rounded-full bg-emerald-400 shadow-[0_0_22px_rgba(16,185,129,0.55)]" />
                        </div>
                      )}

                      {/* Subheading */}
                      {b.subheading && (
                        <p className="mt-4 text-base sm:text-lg text-white/92 leading-relaxed">
                          {b.subheading}
                        </p>
                      )}

                      {/* chips */}
                      {!!b.chips?.length && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {b.chips.slice(0, 3).map((t, idx) => (
                            <span
                              key={idx}
                              className="text-xs sm:text-sm text-white/85 px-3 py-1 rounded-full
                                         bg-black/20 border border-white/15"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* CTA */}
                      {b.buttonText && (
                        <div className="mt-6">
                          <button
                            className="px-6 py-3 rounded-2xl font-semibold text-white
                                       bg-gradient-to-r from-emerald-500 to-emerald-700
                                       shadow-lg shadow-emerald-500/30
                                       hover:shadow-emerald-500/50 hover:-translate-y-[1px]
                                       active:translate-y-0 active:scale-[0.99]
                                       transition-all duration-300"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (b.href) router.push(b.href);
                            }}
                          >
                            {b.buttonText}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Controls */}
        {banners.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-30
                         bg-white/90 hover:bg-white text-gray-800
                         rounded-full p-3 shadow-xl
                         opacity-0 group-hover:opacity-100
                         transition-all duration-300 hover:scale-110"
              aria-label="Previous slide"
            >
              <FaAngleLeft className="w-6 h-6" />
            </button>

            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-30
                         bg-white/90 hover:bg-white text-gray-800
                         rounded-full p-3 shadow-xl
                         opacity-0 group-hover:opacity-100
                         transition-all duration-300 hover:scale-110"
              aria-label="Next slide"
            >
              <FaAngleRight className="w-6 h-6" />
            </button>

            {/* Dots: modern emerald */}
            <div className="absolute bottom-5 left-0 right-0 flex justify-center gap-2 z-20">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goToSlide(i)}
                  className={`transition-all duration-300 rounded-full ${
                    i === index
                      ? "bg-emerald-400 w-10 h-2 shadow-[0_0_18px_rgba(16,185,129,0.55)]"
                      : "bg-white/45 hover:bg-white/70 w-2.5 h-2.5"
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}