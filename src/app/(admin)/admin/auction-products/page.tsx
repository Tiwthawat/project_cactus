'use client';
import { apiFetch } from '@/app/lib/apiFetch';
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



  const [status, setStatus] = useState<Status>('ready');
  const [q, setQ] = useState('');


  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const timerRef = useRef<number | null>(null);


  useEffect(() => {
    const params = new URLSearchParams();
    params.set('status', status); // ✅ ใส่เสมอ แม้เป็น all
    if (q.trim()) params.set('q', q.trim());


    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      const qs = params.toString();
      router.replace(`/admin/auction-products?${qs}`, { scroll: false });

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
      p.set('status', 'all');
      if (query.trim()) p.set('q', query.trim());

      const res = await apiFetch(`${API}/auction-products?${p.toString()}`, { cache: 'no-store' });
      if (!res.ok) {
        setItems([]);
        return;
      }
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
    const s = (sp.get('status') as Status) || 'ready';
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
    const res = await apiFetch(`${API}/auction-products/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      alert('ลบไม่สำเร็จ');
      return;
    }
    fetchData(status, q);
  };

  const fmtBaht = (n: number) =>
    n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  /** นับจำนวนแต่ละสถานะ (นับจาก items ที่ดึงมาจาก API) */
  const counts = useMemo(() => {
    const c = { all: 0, ready: 0, auction: 0, paid: 0, unsold: 0 };

    for (const p of items) {
      c.all += 1;

      if (p.PROstatus === 'ready') c.ready += 1;
      else if (p.PROstatus === 'auction') c.auction += 1;
      else if (['paid', 'shipping', 'delivered'].includes(p.PROstatus)) c.paid += 1;
      else if (p.PROstatus === 'unsold') c.unsold += 1;
    }

    return c;
  }, [items]);

  useEffect(() => {
    fetchData(status, q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
      <div className="p-6 pt-8">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-block bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-full text-sm font-semibold mb-4">
            จัดการสินค้าประมูล
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              🔨 สินค้าสำหรับประมูล
            </h1>
            <Link href="/admin/auction-products/new" className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl text-center">
              + เพิ่มสินค้า
            </Link>
          </div>
        </div>

        {/* Filters Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-2 border-gray-200">
          

          <div className="flex flex-col lg:flex-row gap-4">
            {/* Status Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { v: 'ready', label: '✅ พร้อมเปิดรอบ', active: 'from-green-500 to-green-600' },
                  { v: 'auction', label: '🔨 กำลังประมูล', active: 'from-blue-500 to-blue-600' },
                  { v: 'paid', label: '💰 ชำระแล้ว', active: 'from-purple-500 to-purple-600' },
                  { v: 'unsold', label: '❌ ไม่ถูกขาย', active: 'from-red-500 to-red-600' },
                  { v: 'all', label: '📦 ทั้งหมด', active: 'from-gray-700 to-gray-900' },
                ] as const
              ).map((x) => {
                const isActive = status === x.v;

                const base =
                  'px-4 py-2 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg border-2 inline-flex items-center gap-2';
                const active = `bg-gradient-to-r ${x.active} text-white border-transparent`;
                const idle = 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50';

                const n = counts[x.v]; // ✅ จำนวนตามสถานะ

                return (
                  <button
                    key={x.v}
                    type="button"
                    onClick={() => setStatus(x.v)}
                    className={`${base} ${isActive ? active : idle}`}
                  >
                    <span>{x.label}</span>

                    {/* badge จำนวน */}
                    <span
                      className={[
                        'min-w-[28px] h-6 px-2 rounded-full text-xs font-bold flex items-center justify-center',
                        isActive ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-700 border border-gray-200',
                      ].join(' ')}
                      aria-label={`จำนวน ${x.v}: ${n}`}
                    >
                      {n}
                    </span>
                  </button>
                );
              })}

            </div>

            {/* Search Input */}
            {/* <div className="flex-1 min-w-[240px]">
              <input
                className="w-full p-3 border-2 border-gray-200 rounded-xl bg-gray-50 focus:border-green-400 focus:outline-none transition-colors placeholder-gray-400"
                placeholder="🔎 ค้นหาชื่อสินค้า..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div> */}
          </div>
        </div>


        {/* Table */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow-lg p-10 text-center border-2 border-gray-200">
            <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">กำลังโหลด...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-10 text-center border-2 border-gray-200">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl">
              🔨
            </div>
            <p className="text-gray-800 text-2xl md:text-3xl font-bold mb-3">ไม่พบข้อมูล</p>
            <p className="text-gray-500 text-base md:text-lg">ลองปรับเปลี่ยนตัวกรองหรือเพิ่มสินค้าใหม่</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                    <th className="p-4 text-center hidden md:table-cell">รูป</th>
                    <th className="p-4 text-center">รหัส</th>
                    <th className="p-4 text-left">สินค้า</th>
                    <th className="p-4 text-right">ราคาตั้งต้น</th>
                    <th className="p-4 text-right hidden lg:table-cell">ราคาขายจริง</th>
                    <th className="p-4 text-center">สถานะ</th>
                    <th className="p-4 text-center">จัดการ</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((p) => {
                    const img = p.PROpicture?.split(',')[0] ?? '';
                    const fullImg = img ? `${API}${img.startsWith('/') ? '' : '/'}${img}` : '';
                    const code = `aucpro:${String(p.PROid).padStart(4, '0')}`;

                    return (
                      <tr key={p.PROid} className="border-b border-gray-200 hover:bg-green-50 transition-colors">
                        <td className="p-4 text-center hidden md:table-cell">
                          {fullImg ? <img src={fullImg} className="h-16 w-16 mx-auto rounded-lg object-cover shadow-md" alt={p.PROname} /> : '—'}
                        </td>

                        <td className="p-4 text-center font-mono text-sm bg-gray-50">{code}</td>

                        <td className="p-4">
                          <div className="font-semibold text-gray-900">{p.PROname}</div>
                          <div className="text-xs mt-1">
                            {p.PROstatus === 'auction' ? (
                              <span className="text-blue-600">
                                🔨 กำลังประมูล • ปิด{' '}
                                {p.active_end_time
                                  ? new Date(p.active_end_time.replace(' ', 'T')).toLocaleString('th-TH')
                                  : '-'}
                              </span>
                            ) : p.PROstatus === 'ready' ? (
                              <span className="text-gray-500">✅ พร้อมเปิดรอบ</span>
                            ) : ['paid', 'shipping', 'delivered'].includes(p.PROstatus) ? (
                              <span className="text-purple-600">
                                💰 ปิดการขายแล้ว • ราคาขายจริง {p.active_current_price ? `${fmtBaht(p.active_current_price)} ฿` : '-'}
                              </span>
                            ) : p.PROstatus === 'unsold' ? (
                              <span className="text-red-600">❌ ปิดแล้ว • ไม่ถูกขาย</span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </div>

                        </td>

                        <td className="p-4 text-right font-semibold text-gray-700">{fmtBaht(p.PROprice)} ฿</td>

                        <td className="p-4 text-right font-semibold text-green-600 hidden lg:table-cell">
                          {p.active_current_price ? `${fmtBaht(p.active_current_price)} ฿` : "-"}
                        </td>

                        <td className="p-4 text-center">
                          {p.PROstatus === 'ready' && <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700 border-2 border-green-300">✅ พร้อมเปิดรอบ</span>}
                          {p.PROstatus === 'auction' && <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-700 border-2 border-blue-300">🔨 กำลังประมูล</span>}
                          {['paid', 'shipping', 'delivered'].includes(p.PROstatus) && (
                            <span className="px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-700 border-2 border-purple-300">💰 ชำระแล้ว</span>
                          )}
                          {p.PROstatus === 'unsold' && <span className="px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-700 border-2 border-red-300">❌ ไม่ถูกขาย</span>}
                        </td>

                        <td className="p-4 text-center">
                          <div className="flex flex-col gap-2">
                            {p.active_aid ? (
                              <Link href={`/admin/auctions/${p.active_aid}`} className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-lg whitespace-nowrap">
                                ดูรอบ
                              </Link>
                            ) : (
                              <>
                                {p.PROstatus === 'ready' ? (
                                  <Link
                                    href={`/admin/auctions/new?proid=${p.PROid}`}
                                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-lg whitespace-nowrap"
                                  >
                                    เปิดรอบ
                                  </Link>
                                ) : (
                                  <span className="text-gray-400 text-sm">—</span>
                                )}
                              </>
                            )}

                            <button onClick={() => delProduct(p.PROid)} className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-lg whitespace-nowrap">
                              ลบ
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
