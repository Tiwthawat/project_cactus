'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface AuctionWin {
  Aid: number;
  PROid: number;
  PROname: string;
  PROpicture: string;
  PROstatus: string;
  current_price: number;
}

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

export default function AuctionWinsPage() {
  const [wins, setWins] = useState<AuctionWin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('ยังไม่ได้เข้าสู่ระบบ');
          setLoading(false);
          return;
        }

        const res = await fetch(`${API}/me/my-auction-wins`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();

        if (!res.ok) {
          setError(json.message || 'Error');
          return;
        }

        setWins(Array.isArray(json) ? json : []);
      } catch {
        setError('โหลดข้อมูลไม่สำเร็จ');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const badgeClass = (s: string) =>
    s === 'pending_payment'
      ? 'bg-orange-100 text-orange-700'
      : s === 'payment_review'
        ? 'bg-blue-100 text-blue-700'
        : s === 'paid'
          ? 'bg-green-100 text-green-700'
          : 'bg-gray-100 text-gray-600';

  const badgeLabel = (s: string) =>
    s === 'pending_payment'
      ? 'รอชำระเงิน'
      : s === 'payment_review'
        ? 'รอตรวจสอบ'
        : s === 'paid'
          ? 'ชำระแล้ว'
          : s;

  if (loading)
    return <p className="p-10 text-center text-gray-500">กำลังโหลด…</p>;

  if (error)
    return <p className="p-10 text-center text-red-500">{error}</p>;

  return (
    <div className="px-6 py-10 w-full max-w-7xl mx-auto">

      <h1 className="text-3xl font-bold mb-10 text-center text-gray-800 tracking-wide">
        สินค้าที่ชนะประมูล
      </h1>

      <div className="grid gap-8 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">

        {wins.map((w) => {
          const img = w.PROpicture
            ? `${API}${w.PROpicture.startsWith('/') ? '' : '/'}${w.PROpicture}`
            : '';

          return (
            <div
  key={w.Aid}
  className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-md hover:shadow-xl transition-all"
>
  {/* รูปจัตุรัส */}
  <div className="w-full aspect-square overflow-hidden">
    <img
      src={img}
      className="w-full h-full object-cover"
      alt={w.PROname}
    />
  </div>

  <div className="p-3 space-y-2">
    <p className="font-semibold text-gray-900 text-sm line-clamp-1">
      {w.PROname}
    </p>

    <span
      className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${badgeClass(w.PROstatus)}`}
    >
      {badgeLabel(w.PROstatus)}
    </span>

    <p className="text-gray-700 text-sm">
      ราคาชนะ:{" "}
      <span className="font-semibold text-gray-900">
        {w.current_price.toLocaleString()} บาท
      </span>
    </p>

    <Link
      href={`/me/auction-wins/${w.Aid}`}
      className="block text-center mt-2 bg-gray-900 text-white py-2 rounded-lg text-sm hover:bg-black transition"
    >
      ดูรายละเอียด
    </Link>
  </div>
</div>

          );
        })}
      </div>

    </div>
  );
}
