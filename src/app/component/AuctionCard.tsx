"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Auction } from "../types";

const baht = (n: number | string) =>
  new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
  }).format(Number(n));

function toImgSrc(pictures: string): string | null {
  const first = (pictures || "")
    .split(",")
    .map((s) => s.trim())
    .find(Boolean);
  if (!first) return null;

  if (
    first.startsWith("http://") ||
    first.startsWith("https://") ||
    first.startsWith("data:")
  ) {
    return first;
  }

  const base = (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001").replace(/\/$/, "");
  return `${base}/${first.replace(/^\/+/, "")}`;
}

// 🕒 helper format เวลา
function formatRemaining(ms: number): string {
  if (ms <= 0) return "ปิดแล้ว";

  const totalSec = Math.floor(ms / 1000);

  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;

  const d = days > 0 ? `${days} วัน ` : "";

  return `${d} ${hours}:${mins}:${secs} วินาที`;
}


export default function AuctionCard({ auction }: { auction: Auction }) {
  const imgSrc = toImgSrc(auction.PROpicture);

  // state สำหรับ countdown
  const [remaining, setRemaining] = useState<string>("");
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    function update() {
      const end = new Date(auction.end_time).getTime();
      const now = Date.now();
      setRemaining(formatRemaining(end - now));
    }

    update(); // run ตอน mount
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [auction.end_time]);

  return (
    <Link
      href={`/auctions/${auction.Aid}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-2 border"
    >
      <div className="absolute top-3 left-3 z-10 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
        🔥 ประมูล
      </div>

      <div className="relative overflow-hidden bg-gray-100 aspect-square">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={auction.PROname}
            className={`w-full h-full object-cover transition-transform duration-500 ${
              hovered ? "scale-110" : "scale-100"
            }`}
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
            ไม่มีรูป
          </div>
        )}

        <div
          className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${
            hovered ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-white text-gray-800 px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
              ดูรายละเอียด →
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 hover:text-red-600 transition-colors min-h-[2.5rem]">
          {auction.PROname}
        </h3>

        <p className="text-red-600 font-bold text-xl">
          {baht(auction.current_price)}
        </p>

        <p className="text-sm text-gray-500">
          ปิดประมูล: {new Date(auction.end_time).toLocaleString("th-TH")}
        </p>

        <p className="text-sm font-semibold text-blue-600">
          เวลาที่เหลือ: {remaining}
        </p>

        <div className="space-y-2 mt-4">
          <div className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-2.5 px-4 rounded-xl transition-all duration-300 shadow-md hover:shadow-xl flex items-center justify-center gap-2 transform hover:scale-105">
            ประมูลเลยตอนนี้
          </div>
        </div>
      </div>

      <div
        className={`absolute inset-0 rounded-2xl border-2 border-transparent transition-all duration-300 pointer-events-none ${
          hovered ? "border-red-400" : ""
        }`}
      ></div>
    </Link>
  );
}
