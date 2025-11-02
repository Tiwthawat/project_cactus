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
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h.toString().padStart(2, "0")}:${m
    .toString()
    .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function AuctionCard({ auction }: { auction: Auction }) {
  const imgSrc = toImgSrc(auction.PROpicture);

  // state สำหรับ countdown
  const [remaining, setRemaining] = useState<string>("");

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
      className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition border"
    >
      {imgSrc ? (
        <img src={imgSrc} alt={auction.PROname} className="w-full h-40 object-cover rounded" />
      ) : (
        <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-400">
          ไม่มีรูป
        </div>
      )}

      <div className="mt-3 flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold line-clamp-2">{auction.PROname}</h3>
        <span
          className={`text-xs px-2 py-1 rounded-full border ${
            auction.status === "open"
              ? "border-green-500 text-green-700"
              : "border-gray-400 text-gray-600"
          }`}
        >
          {auction.status}
        </span>
      </div>

      
      <p className="text-red-600 font-bold text-lg">ราคาปัจจุบัน: {baht(auction.current_price)}</p>

      <p className="text-sm text-gray-500">
        ปิดประมูล: {new Date(auction.end_time).toLocaleString("th-TH")}
      </p>

      {/* 🕒 เวลาที่เหลือ */}
      <p className="text-sm font-semibold text-blue-600">
        เวลาที่เหลือ: {remaining}
      </p>

      <div className="mt-3 text-center bg-red-500 hover:bg-red-300 text-white px-4 py-2 rounded">
        ประมูลเลยตอนนี้
      </div>
    </Link>
  );
}
