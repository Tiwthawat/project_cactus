'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

type Status = 'all' | 'auction' | 'inactive';

interface Row {
  PROid: number;
  PROname: string;
  PROpicture: string;
  PROprice: number;
  PROstatus: 'auction' | 'inactive' | string;
  active_aid: number | null;
  active_end_time: string | null;
  active_current_price: number | null;
}

export default function AdminAuctionProductsPage() {
  const router = useRouter();
  const sp = useSearchParams();

  // init from URL
  const [status, setStatus] = useState<Status>((sp.get('status') as Status) || 'all');
  const [q, setQ] = useState<string>(sp.get('q') ?? '');

  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // ---- keep URL in sync with debounce (300ms) ----
  const timerRef = useRef<number | null>(null);
  useEffect(() => {
    const params = new URLSearchParams();
    if (status !== 'all') params.set('status', status);
    if (q.trim()) params.set('q', q.trim());

    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      const qs = params.toString();
      router.replace(qs ? `/admin/auction-products?${qs}` : '/admin/auction-products', { scroll: false });
    }, 300);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [status, q, router]);

  // ---- fetch data whenever search params change ----
  const fetchData = async (s: Status, query: string) => {
    try {
      setLoading(true);
      const p = new URLSearchParams();
      p.set('status', s);
      if (query.trim()) p.set('q', query.trim());
      const res = await fetch(`${API}/auction-products?${p.toString()}`, { cache: 'no-store' });
      const data: Row[] = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('fetch failed', e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  // react if URL changed externally (e.g. browser nav)
  useEffect(() => {
    const s = (sp.get('status') as Status) || 'all';
    const query = sp.get('q') ?? '';
    setStatus(s);
    setQ(query);
    fetchData(s, query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp]);

  const filtered = useMemo(() => items, [items]); // (server already filters)

  const delProduct = async (id: number) => {
    if (!confirm('ลบสินค้านี้?')) return;
    const res = await fetch(`${API}/auction-products/${id}`, { method: 'DELETE' });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(body?.error || 'ลบไม่สำเร็จ');
      return;
    }
    fetchData(status, q);
  };

  const fmtBaht = (n: number) =>
    n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="p-6 text-black">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">สินค้าสำหรับประมูล</h1>
        <Link href="/admin/auction-products/new" className="bg-green-600 text-white px-4 py-2 rounded">
          + เพิ่มสินค้า
        </Link>
      </div>

      {/* ฟิลเตอร์ + ค้นหา */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex gap-1 bg-white rounded p-1 border">
          <button
            className={`px-3 py-1 rounded ${status === 'all' ? 'bg-gray-900 text-white' : 'hover:bg-gray-100'}`}
            onClick={() => setStatus('all')}
          >
            ทั้งหมด
          </button>
          <button
            className={`px-3 py-1 rounded ${status === 'auction' ? 'bg-green-600 text-white' : 'hover:bg-gray-100'}`}
            onClick={() => setStatus('auction')}
          >
            พร้อมประมูล
          </button>
          <button
            className={`px-3 py-1 rounded ${status === 'inactive' ? 'bg-gray-600 text-white' : 'hover:bg-gray-100'}`}
            onClick={() => setStatus('inactive')}
          >
            ปิดใช้งาน
          </button>
        </div>

        <div className="flex-1 min-w-[240px]">
          <input
            className="w-full border rounded px-3 py-2 bg-white"
            placeholder="ค้นหาชื่อสินค้า"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-4 rounded border">กำลังโหลด...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-4 rounded border">ไม่พบข้อมูลตามเงื่อนไขที่เลือก</div>
      ) : (
        <table className="w-full bg-white border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">รูป</th>
              <th className="p-2 border">สินค้า</th>
              <th className="p-2 border text-right">ราคา</th>
              <th className="p-2 border text-center">สถานะ</th>
              <th className="p-2 border text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const first = p.PROpicture?.split(',')[0] ?? '';
              const img = first ? `${API}${first.startsWith('/') ? '' : '/'}${first}` : '';
              return (
                <tr key={p.PROid} className="odd:bg-white even:bg-gray-50">
                  <td className="p-2 border text-center">
                    <Link href={`/admin/auction-products/${p.PROid}`}>
                      {img ? <img src={img} alt={p.PROname} className="h-12 inline-block rounded" /> : <span>—</span>}
                    </Link>
                  </td>
                  <td className="p-2 border">
                    <Link href={`/admin/auction-products/${p.PROid}`} className="text-blue-600 hover:underline">
                      {p.PROname}
                    </Link>
                    {p.active_aid ? (
                      <div className="text-xs text-green-600">
                        กำลังประมูล • ปิด {p.active_end_time ? new Date(p.active_end_time).toLocaleString('th-TH') : '-'}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400">ยังไม่มีรอบเปิด</div>
                    )}
                  </td>
                  <td className="p-2 border text-right">{fmtBaht(p.PROprice)} ฿</td>
                  <td className="p-2 border text-center">
                    <span
                      className={`px-2 py-1 rounded text-white ${
                        p.PROstatus === 'auction' ? 'bg-green-500' : 'bg-gray-500'
                      }`}
                    >
                      {p.PROstatus}
                    </span>
                  </td>
                  <td className="p-2 border text-center space-x-2">
                    {p.active_aid ? (
                      <Link href={`/admin/auctions/${p.active_aid}`} className="bg-blue-600 text-white px-2 py-1 rounded">
                        ดูรอบ
                      </Link>
                    ) : (
                      <Link
                        href={`/admin/auctions/new?proid=${p.PROid}`}
                        className="bg-orange-600 text-white px-2 py-1 rounded"
                      >
                        เปิดรอบ
                      </Link>
                    )}
                    <button
                      onClick={() => delProduct(p.PROid)}
                      className="bg-red-600 text-white px-2 py-1 rounded"
                    >
                      ลบ
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
