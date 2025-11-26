'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

/** ใช้สถานะทั้งหมดตามจริง */
type Status = 'all' | 'ready' | 'auction' | 'paid' | 'unsold';

interface Row {
  PROid: number;
  PROname: string;
  PROpicture: string;
  PROprice: number;
  PROstatus: string;
  active_aid: number | null;
  active_end_time: string | null;
  active_current_price: number | null;
}

export default function AdminAuctionProductsPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const [status, setStatus] = useState<Status>((sp.get('status') as Status) || 'all');
  const [q, setQ] = useState(sp.get('q') ?? '');

  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const timerRef = useRef<number | null>(null);

  /** sync URL */
  useEffect(() => {
    const params = new URLSearchParams();
    if (status !== 'all') params.set('status', status);
    if (q.trim()) params.set('q', q.trim());

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      const qs = params.toString();
      router.replace(qs ? `/admin/auction-products?${qs}` : '/admin/auction-products', { scroll: false });
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [status, q, router]);

  /** load data */
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
      console.error(e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  /** re-fetch when URL changes */
  useEffect(() => {
    const s = (sp.get('status') as Status) || 'all';
    const query = sp.get('q') ?? '';
    setStatus(s);
    setQ(query);
    fetchData(s, query);
  }, [sp]);

  /** ฟิลเตอร์จริง (logic อยู่ฝั่ง frontend) */
  const filtered = useMemo(() => {
    return items.filter((p) => {
      if (status === 'all') return true;
      if (status === 'ready') return p.PROstatus === 'ready';
      if (status === 'auction') return p.PROstatus === 'auction';

      /** “ชำระแล้ว” → paid / shipping / delivered */
      if (status === 'paid')
        return ['paid', 'shipping', 'delivered'].includes(p.PROstatus);

      if (status === 'unsold') return p.PROstatus === 'unsold';
      return true;
    });
  }, [items, status]);

  const delProduct = async (id: number) => {
    if (!confirm('ลบสินค้านี้?')) return;
    const res = await fetch(`${API}/auction-products/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      alert('ลบไม่สำเร็จ');
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

      {/* ฟิลเตอร์ */}
      <div className="flex flex-wrap gap-2 mb-4">

        <div className="flex gap-1 bg-white rounded p-1 border">
          <button className={`px-3 py-1 rounded ${status === 'all' ? 'bg-gray-900 text-white' : 'hover:bg-gray-100'}`} onClick={() => setStatus('all')}>ทั้งหมด</button>

          <button className={`px-3 py-1 rounded ${status === 'ready' ? 'bg-green-600 text-white' : 'hover:bg-gray-100'}`} onClick={() => setStatus('ready')}>พร้อมเปิดรอบ</button>

          <button className={`px-3 py-1 rounded ${status === 'auction' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`} onClick={() => setStatus('auction')}>กำลังประมูล</button>

          <button className={`px-3 py-1 rounded ${status === 'paid' ? 'bg-purple-600 text-white' : 'hover:bg-gray-100'}`} onClick={() => setStatus('paid')}>ชำระแล้ว</button>

          <button className={`px-3 py-1 rounded ${status === 'unsold' ? 'bg-red-600 text-white' : 'hover:bg-gray-100'}`} onClick={() => setStatus('unsold')}>ไม่ถูกขาย</button>
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

      {/* ตารางหลัก */}
      {loading ? (
        <div className="bg-white p-4 rounded border">กำลังโหลด...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-4 rounded border">ไม่พบข้อมูล</div>
      ) : (
        <table className="w-full bg-white border">
          <thead>
  <tr className="bg-gray-100">
    <th className="p-2 border">รูป</th>
    <th className="p-2 border w-[110px] text-center">รหัส</th>
    <th className="p-2 border">สินค้า</th>
    <th className="p-2 border text-right">ราคาตั้งต้น</th>
    <th className="p-2 border text-right">ราคาขายจริง</th>
    <th className="p-2 border text-center">สถานะ</th>
    <th className="p-2 border text-center">จัดการ</th>
  </tr>
</thead>


          <tbody>
            {filtered.map((p) => {
              const img = p.PROpicture?.split(',')[0] ?? '';
              const fullImg = img ? `${API}${img.startsWith('/') ? '' : '/'}${img}` : '';
              const code = `Aca:${String(p.PROid).padStart(4, '0')}`;

              return (
                <tr key={p.PROid} className="odd:bg-white even:bg-gray-50">

                  <td className="p-2 border text-center">

                    {fullImg ? <img src={fullImg} className="h-12 rounded inline-block" /> : '—'}

                  </td>

                  <td className="p-2 border text-center font-mono text-sm">{code}</td>

                  <td className="p-2 border">

                    {p.PROname}


                    {p.active_aid ? (
                      <div className="text-xs text-green-600">
                        กำลังประมูล • ปิด {p.active_end_time ? new Date(p.active_end_time).toLocaleString('th-TH') : '-'}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400">ยังไม่มีรอบเปิด</div>
                    )}
                  </td>

                  <td className="p-2 border text-right">
  {fmtBaht(p.PROprice)} ฿
</td>

<td className="p-2 border text-right font-semibold">
  {p.active_current_price
    ? `${fmtBaht(p.active_current_price)} ฿`
    : "-"}
</td>




                  <td className="p-2 border text-center">
                    {p.PROstatus === 'ready' && <span className="px-2 py-1 rounded text-white bg-green-600">พร้อมเปิดรอบ</span>}
                    {p.PROstatus === 'auction' && <span className="px-2 py-1 rounded text-white bg-blue-600">กำลังประมูล</span>}
                    {['paid', 'shipping', 'delivered'].includes(p.PROstatus) && (
                      <span className="px-2 py-1 rounded text-white bg-purple-600">ชำระแล้ว</span>
                    )}
                    {p.PROstatus === 'unsold' && <span className="px-2 py-1 rounded text-white bg-red-600">ไม่ถูกขาย</span>}
                  </td>

                  <td className="p-2 border text-center space-x-2">

                    {p.active_aid ? (
                      <Link href={`/admin/auctions/${p.active_aid}`} className="bg-blue-600 text-white px-2 py-1 rounded">
                        ดูรอบ
                      </Link>
                    ) : (
                      <>
                        {p.PROstatus === 'ready' ? (
                          <Link
                            href={`/admin/auctions/new?proid=${p.PROid}`}
                            className="bg-orange-600 text-white px-2 py-1 rounded"
                          >
                            เปิดรอบ
                          </Link>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </>
                    )}

                    <button onClick={() => delProduct(p.PROid)} className="bg-red-600 text-white px-2 py-1 rounded">
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
