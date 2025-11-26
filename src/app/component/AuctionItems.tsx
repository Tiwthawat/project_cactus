"use client";

import { useEffect, useState } from "react";
import AuctionCard from "./AuctionCard";
import { Auction } from "../types";

const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";

interface Props {
  limit?: number;
}

export default function AuctionItems({ limit }: Props) {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        let url = `${API}/auctions?status=open&sort=end_time`;
        if (limit) url += `&limit=${limit}`;

        const res = await fetch(url, {
          headers: { Accept: "application/json" },
        });

        if (!res.ok) throw new Error("โหลดรายการไม่สำเร็จ");

        const data: Auction[] = await res.json();

        const sorted = data.sort(
          (a, b) =>
            new Date(a.end_time).getTime() -
            new Date(b.end_time).getTime()
        );

        setAuctions(sorted);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [limit]);

  if (loading) return <p className="text-gray-500">กำลังโหลด…</p>;
  if (!auctions.length)
    return <p className="text-gray-500">ยังไม่มีรอบที่เปิดอยู่ในขณะนี้</p>;

  // ⭐ ใช้ array ที่ถูกตัดเรียบร้อย
  const display = limit ? auctions.slice(0, limit) : auctions;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {display.map((a) => (
        <AuctionCard key={a.Aid} auction={a} />
      ))}
    </div>
  );
}
