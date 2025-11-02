"use client";

import { useEffect, useState } from "react";

import AuctionCard from "./AuctionCard";
import { Auction } from "../types";

const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001";

export default function AuctionItems() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API}/auctions?status=open&sort=end_time&limit=4`, {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error("โหลดรายการไม่สำเร็จ");
        const data = await res.json();
        setAuctions(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <p className="text-gray-500">กำลังโหลด…</p>;
  if (!auctions.length) return <p className="text-gray-500">ยังไม่มีรอบที่เปิดอยู่ในขณะนี้</p>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {auctions.map((a) => (
        <AuctionCard key={a.Aid} auction={a} />
      ))}
    </div>
  );
}
