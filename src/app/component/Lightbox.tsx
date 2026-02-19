"use client";

import React, { useEffect, useMemo, useState } from "react";

type LightboxProps = {
  open: boolean;
  images: string[];
  startIndex?: number;
  onClose: () => void;
};

export default function Lightbox({
  open,
  images,
  startIndex = 0,
  onClose,
}: LightboxProps) {
  const list = useMemo(
    () => (Array.isArray(images) ? images.filter(Boolean) : []),
    [images]
  );
  const [idx, setIdx] = useState(startIndex);

  useEffect(() => {
    if (open) setIdx(startIndex);
  }, [open, startIndex]);

  // keyboard
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIdx((v) => Math.min(v + 1, list.length - 1));
      if (e.key === "ArrowLeft") setIdx((v) => Math.max(v - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, list.length, onClose]);

  if (!open || list.length === 0) return null;

  const current = list[idx];

  const prev = () => setIdx((v) => Math.max(v - 1, 0));
  const next = () => setIdx((v) => Math.min(v + 1, list.length - 1));

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/80 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="w-full max-w-6xl px-3 sm:px-6" onClick={(e) => e.stopPropagation()}>
        {/* top bar */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-white/90 text-sm font-semibold">
            รูปที่ {idx + 1} / {list.length}
          </div>

          <button
            onClick={onClose}
            className="text-white/90 hover:text-white text-2xl leading-none px-2"
            aria-label="close"
          >
            ✕
          </button>
        </div>

        {/* main */}
        <div className="relative bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
          {/* arrows */}
          {list.length > 1 && (
            <>
              <button
                onClick={prev}
                disabled={idx === 0}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10
                           w-10 h-10 rounded-full bg-white/15 hover:bg-white/25
                           text-white text-xl disabled:opacity-30"
                aria-label="prev"
              >
                ‹
              </button>

              <button
                onClick={next}
                disabled={idx === list.length - 1}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10
                           w-10 h-10 rounded-full bg-white/15 hover:bg-white/25
                           text-white text-xl disabled:opacity-30"
                aria-label="next"
              >
                ›
              </button>
            </>
          )}

          {/* image (full view, not crop) */}
          <div className="w-full h-[70vh] sm:h-[78vh] flex items-center justify-center bg-black">
            <img
              src={current}
              alt="full"
              className="max-h-full max-w-full object-contain select-none"
              draggable={false}
            />
          </div>
        </div>

        {/* thumbnails */}
        {list.length > 1 && (
          <div className="mt-3">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {list.map((u, i) => (
                <button
                  key={`${u}-${i}`}
                  type="button"
                  onClick={() => setIdx(i)}
                  className={
                    i === idx
                      ? "shrink-0 rounded-xl overflow-hidden border-2 border-emerald-400"
                      : "shrink-0 rounded-xl overflow-hidden border border-white/15 opacity-80 hover:opacity-100"
                  }
                  title={`รูปที่ ${i + 1}`}
                >
                  <img
                    src={u}
                    alt="thumb"
                    className="h-16 w-24 object-cover bg-black"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>

            <div className="text-white/60 text-xs mt-1">
              Tip: ใช้ปุ่มลูกศรคีย์บอร์ด ← → ได้
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
