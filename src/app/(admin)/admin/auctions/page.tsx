'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';

interface Auction {
  Aid: number;
  start_price: number;
  current_price: number;
  end_time: string; // 'YYYY-MM-DD HH:mm:ss' หรือ ISO
  status: 'open' | 'closed';
  PROid: number;
  PROname: string;
  PROpicture: string;
}


type Filter = 'all' | 'open' | 'closed';
const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

export default function AdminAuctionsPage() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  // ด้านบนในคอมโพเนนต์
const [toasts, setToasts] = useState<Array<{ id: number; text: string }>>([]);
const notifiedRef = useRef<Set<number>>(new Set()); // เก็บ Aid ที่แจ้งไปแล้ว

function pushToast(text: string) {
  const id = Date.now() + Math.floor(Math.random() * 1000);
  setToasts((ts) => [...ts, { id, text }]);
  setTimeout(() => {
    setToasts((ts) => ts.filter((t) => t.id !== id));
  }, 4000); // แสดง 4 วิ
}

  // ⏱️ ทำให้ป้ายเวลาขยับทุก 1 วินาที (เฉพาะ UI)
  const [nowTs, setNowTs] = useState<number>(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowTs(Date.now()), 1000); // 1 วิ
    return () => clearInterval(t);
  }, []);

  // 🔁 ดึงข้อมูลจาก backend (ใช้ no-store กัน cache)
  const fetchAuctions = async (f: Filter) => {
    try {
      setLoading(true);
      const url = f === 'all' ? `${API}/auctions` : `${API}/auctions?status=${encodeURIComponent(f)}`;
      const res = await fetch(url, { cache: 'no-store' });
      const data: Auction[] = await res.json();
      setAuctions(data ?? []);
    } catch (err) {
      console.error('โหลดข้อมูลการประมูลล้มเหลว:', err);
      setAuctions([]);
    } finally {
      setLoading(false);
    }
  };

  // โหลดครั้งแรก + เมื่อเปลี่ยนฟิลเตอร์
  useEffect(() => {
    fetchAuctions(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  // 🔄 Auto-refetch ทุก 30 วิ (ดึงราคาล่าสุด/สถานะจากเซิร์ฟเวอร์)
  useEffect(() => {
    const t = setInterval(() => fetchAuctions(filter), 30000);
    return () => clearInterval(t);
  }, [filter]);

  const closeAuction = async (id: number) => {
    if (!confirm('ปิดประมูลรอบนี้เลยใช่ไหม?')) return;
    const res = await fetch(`${API}/auctions/${id}/close`, { method: 'PATCH' });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(body?.error || 'ปิดประมูลไม่สำเร็จ');
      return;
    }
    fetchAuctions(filter);
  };

  const deleteAuctionRound = async (aid: number) => {
    if (!confirm('ลบรอบนี้? (ลบได้เฉพาะรอบที่ยังไม่มีการบิด)')) return;
    const res = await fetch(`${API}/auctions/${aid}`, { method: 'DELETE' });
    const body: { message?: string; error?: string } = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(body?.error || 'ลบไม่สำเร็จ');
      return;
    }
    alert(body?.message || 'ลบสำเร็จ');
    fetchAuctions(filter);
  };
  

  const deleteAuctionProduct = async (proId: number) => {
    if (!confirm('ลบสินค้าออกจากคลังประมูล? (ลบทั้งสินค้า ไม่ใช่แค่รอบ)')) return;
    const res = await fetch(`${API}/auction-products/${proId}`, { method: 'DELETE' });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(body?.error || 'ลบสินค้าไม่สำเร็จ');
      return;
    }
    alert('ลบสินค้าสำเร็จ');
    fetchAuctions(filter);
  };

  const filtered = useMemo(
    () => (filter === 'all' ? auctions : auctions.filter((a) => a.status === filter)),
    [auctions, filter]
  );

  const fmtPrice = (n: number) =>
    n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // 🎯 แสดงเวลาที่เหลือเป็น วัน ชั่วโมง นาที วินาที
 const remainLabelAndClass = (end_time: string, status: 'open' | 'closed') => {
  if (status === 'closed') return { text: 'ปิดแล้ว', cls: 'text-gray-500' };

  const end = new Date(end_time).getTime();
  const diff = end - nowTs;
  if (diff <= 0) return { text: 'หมดเวลาแล้ว', cls: 'text-red-600 font-medium' };

  let s = Math.floor(diff / 1000);
  const days = Math.floor(s / 86400); s %= 86400;
  const hours = Math.floor(s / 3600); s %= 3600;
  const minutes = Math.floor(s / 60); s %= 60;

  const parts: string[] = [];
  if (days) parts.push(`${days} วัน`);
  if (hours || days) parts.push(`${hours} ชั่วโมง`);
  if (minutes || hours || days) parts.push(`${minutes} นาที`);
  parts.push(`${s} วินาที`);

  // 💡 ตัดสินใจเรื่องสีโดยดู "รวมเวลาที่เหลือเป็นวินาที"
  const totalSeconds = diff / 1000;
  let cls = 'text-gray-700';
  if (totalSeconds <= 60 * 5) {        // <= 5 นาที
    cls = 'text-orange-600 font-semibold';
  }
  if (totalSeconds <= 0) {
    cls = 'text-red-600 font-bold';
  }

  return { text: `เหลือ ${parts.join(' ')}`, cls };
};

useEffect(() => {
  // หาอันที่ยัง open และหมดเวลาแล้ว (diff <= 0)
  const ended = auctions.filter(
    (a) => a.status === 'open' && new Date(a.end_time).getTime() - nowTs <= 0
  );

  if (ended.length > 0) {
    let needRefetch = false;
    for (const a of ended) {
      if (!notifiedRef.current.has(a.Aid)) {
        notifiedRef.current.add(a.Aid);
        pushToast(`"${a.PROname}" หมดเวลาแล้ว`);
        needRefetch = true; // ดึงสถานะล่าสุดทันที
      }
    }
    if (needRefetch) {
      // เรียก backend เพื่ออัปเดตสถานะเป็น closed ทันที (ไม่ต้องรอ 30 วิ)
      fetchAuctions(filter);
    }
  }
}, [nowTs, auctions, filter]); // รันทุกครั้งที่เวลาปัจจุบัน / รายการเปลี่ยน



  return (
    <div className="p-6 text-black">
      {/* หัวข้อ + ปุ่มทางลัด */}
      <div className="flex items-center justify-between mb-5 gap-2">
        <h1 className="text-xl font-bold">จัดการสินค้าประมูล</h1>
        <div className="flex gap-2">
          <button
            onClick={() => fetchAuctions(filter)}
            className="border bg-white px-3 py-2 rounded hover:bg-gray-50"
            title="รีเฟรชรายการ"
          >
            รีเฟรช
          </button>
          <Link href="/admin/auction-products/new" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            + เพิ่มสินค้าประมูล
          </Link>
          <Link href="/admin/auctions/new" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            + เปิดรอบประมูล
          </Link>
        </div>
      </div>

      {/* ฟิลเตอร์สถานะ */}
      <div className="mb-4 flex items-center gap-2">
        <label className="font-medium">กรองตามสถานะ:</label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as Filter)}
          className="border px-3 py-2 rounded bg-white"
        >
          <option value="all">ทั้งหมด</option>
          <option value="open">เปิดประมูล</option>
          <option value="closed">ปิดประมูลแล้ว</option>
        </select>
      </div>

      {loading ? (
        <div className="p-4 bg-white rounded border">กำลังโหลด...</div>
      ) : filtered.length === 0 ? (
        <div className="p-4 bg-white rounded border">ไม่พบข้อมูลตามเงื่อนไขที่เลือก</div>
      ) : (
        <table className="w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">#</th>
              <th className="p-2 border">รูป</th>
              <th className="p-2 border">สินค้า</th>
              <th className="p-2 border text-right">ราคาเริ่มต้น</th>
              <th className="p-2 border text-right">ราคาปัจจุบัน</th>
              <th className="p-2 border text-center">ปิดประมูล</th>
              <th className="p-2 border text-center">สถานะ</th>
              <th className="p-2 border text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a, idx) => {
              const first = a.PROpicture?.split(',')[0]?.trim() ?? '';
              const img = first ? `${API}${first.startsWith('/') ? '' : '/'}${first}` : '';
              const endStr = a.end_time ? new Date(a.end_time).toLocaleString('th-TH') : '-';
              const remain = remainLabelAndClass(a.end_time, a.status);

              return (
                <tr key={a.Aid} className="odd:bg-white even:bg-gray-50">
                  <td className="p-2 border text-center">{idx + 1}</td>
                  <td className="p-2 border text-center">{img ? <img src={img} alt={a.PROname} className="h-12 mx-auto rounded" /> : '—'}</td>
                  <td className="p-2 border">
                    <Link href={`/admin/auctions/${a.Aid}`} className="text-blue-600 hover:underline">{a.PROname}</Link>
                  </td>
                  <td className="p-2 border text-right">{fmtPrice(a.start_price)} ฿</td>
                  <td className="p-2 border text-right">{fmtPrice(a.current_price)} ฿</td>
                  <td className="p-2 border text-center">
                    {endStr}
                    <div className={`text-xs mt-1 ${remain.cls}`}>{remain.text}</div>
                  </td>
                  <td className="p-2 border text-center">
                    <span className={`px-2 py-1 rounded text-white ${a.status === 'open' ? 'bg-green-500' : 'bg-gray-500'}`}>{a.status}</span>
                  </td>
                  <td className="p-2 border text-center">
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {a.status === 'open' && (
                        <>
                          <button className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600" onClick={() => closeAuction(a.Aid)}>
                            ปิดประมูล
                          </button>
                          <button
                            className="bg-gray-700 text-white px-2 py-1 rounded hover:bg-gray-800"
                            onClick={() => deleteAuctionRound(a.Aid)}
                            title="ลบรอบได้เฉพาะยังไม่มีการบิด"
                          >
                            ลบรอบ
                          </button>
                        </>
                      )}
                      <button className="bg-gray-200 text-gray-800 px-2 py-1 rounded hover:bg-gray-300" onClick={() => deleteAuctionProduct(a.PROid)}>
                        ลบสินค้า
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}{/* Toasts */}
<div className="fixed right-4 bottom-4 space-y-2 z-50">
  {toasts.map((t) => (
    <div
      key={t.id}
      className="bg-black text-white/90 px-4 py-2 rounded-lg shadow-lg max-w-xs"
      role="alert"
    >
      {t.text}
    </div>
  ))}
</div>

    </div>
  );
}
