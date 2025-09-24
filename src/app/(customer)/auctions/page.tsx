'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Auction {
  Aid: number;
  start_price: number;
  current_price: number;
  end_time: string; // ISO
  status: 'open' | 'closed';
  PROid: number;
  PROname: string;
  PROpicture: string; // 
}



const baht = (n: number) =>
  new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(n);

export default function AuctionPage() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const base = (process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000').replace(/\/$/, '');
      const url = `${base}/auctions?status=open`; // หรือ `${base}/api/auctions`
      try {
        const res = await fetch(url, { credentials: 'include', headers: { Accept: 'application/json' } });
        const ct = res.headers.get('content-type') || '';
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`HTTP ${res.status} – ${text.slice(0, 120)}`);
        }
        if (!ct.includes('application/json')) {
          const text = await res.text();
          throw new Error(`Not JSON: ${text.slice(0, 120)}… (url: ${url})`);
        }
        const data = await res.json();
        setAuctions(data);
      } catch (e: any) {
        setErr(e.message || 'โหลดรายการประมูลไม่สำเร็จ');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);


  const toImgSrc = (pictures: string): string | null => {
    const first = pictures?.split(',').map(s => s.trim()).filter(Boolean)[0];
    if (!first) return null;

    if (first.startsWith('http://') || first.startsWith('https://')) {
      return first; // รูปเป็น URL เต็มแล้ว
    }

    // กรณี path เช่น "uploads/xxx.jpg"
    const base = process.env.NEXT_PUBLIC_API_BASE as string;
    return `${base}/${first.startsWith('/') ? first.slice(1) : first}`;
  };


  return (
    <main className="pt-36 px-6 min-h-screen bg-white text-black">
      <h1 className="text-2xl font-bold mb-6">🌵 รายการประมูล</h1>

      {loading && <p className="text-gray-500">กำลังโหลด…</p>}
      {err && <p className="text-red-600">{err}</p>}
      {!loading && !err && auctions.length === 0 && (
        <p className="text-gray-500">ยังไม่มีรอบที่เปิดอยู่ในขณะนี้</p>
      )}

     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">

        {auctions.map((a) => {
          const imgSrc = toImgSrc(a.PROpicture);

          return (
            <Link
              key={a.Aid}
              href={`/auctions/${a.Aid}`}
              className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition border"
            >
              {imgSrc ? (
                <img
                  src={imgSrc}
                  alt={a.PROname}
                  className="w-full h-40 object-cover rounded"
                />
              ) : (
                <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-400">
                  ไม่มีรูป
                </div>
              )}

              <div className="mt-3 flex items-start justify-between gap-3">
                <h3 className="text-lg font-semibold line-clamp-2">{a.PROname}</h3>
                <span
                  className={`text-xs px-2 py-1 rounded-full border ${a.status === 'open' ? 'border-green-500 text-green-700' : 'border-gray-400 text-gray-600'
                    }`}
                >
                  {a.status}
                </span>
              </div>

              <p className="text-gray-600 mt-1">
                เริ่มต้นที่: <span className="font-semibold">{baht(a.start_price)}</span>
              </p>
              <p className="text-red-600 font-bold text-lg">
                ราคาปัจจุบัน: {baht(a.current_price)}
              </p>
              <p className="text-sm text-gray-500">
                ปิดประมูล: {new Date(a.end_time).toLocaleString('th-TH')}
              </p>

              <div className="mt-3 text-center bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded">
                ดูรายละเอียด
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
