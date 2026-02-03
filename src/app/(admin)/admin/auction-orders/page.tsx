'use client';

import { apiFetch } from '@/app/lib/apiFetch';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

interface AuctionOrder {
  Aid: number;
  PROid: number;
  PROname: string;
  Cname: string;
  current_price: number;
  payment_status: string;

  shipping_status?: 'pending' | 'shipped' | 'delivered' | null;
  shipping_company?: string | null;
  tracking_number?: string | null;

  end_time?: string | null;
  paid_at?: string | null;
}

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';
const STORAGE_KEY = 'admin_auction_orders_year';

function fmtBaht(n: number) {
  return Number(n || 0).toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtDateTime(s?: string | null) {
  if (!s) return '—';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function paymentBadge(payment_status: string) {
  switch (payment_status) {
    case 'pending_payment':
      return { label: '⏳ รอชำระเงิน', cls: 'bg-amber-100 text-amber-800 border-amber-200' };
    case 'payment_review':
      return { label: '🔍 รอตรวจสอบสลิป', cls: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
    case 'paid':
      return { label: '✅ ชำระแล้ว', cls: 'bg-green-100 text-green-800 border-green-200' };
    default:
      return { label: payment_status || '—', cls: 'bg-gray-100 text-gray-800 border-gray-200' };
  }
}

function shippingBadge(o: AuctionOrder) {
  if (o.payment_status === 'pending_payment') return { label: '—', cls: 'bg-gray-100 text-gray-700 border-gray-200' };
  if (o.payment_status === 'payment_review') return { label: '—', cls: 'bg-gray-100 text-gray-700 border-gray-200' };

  const s = o.shipping_status ?? null;
  const hasTracking = Boolean(o.tracking_number);

  if (s === 'delivered') return { label: '✅ ส่งสำเร็จ', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
  if (s === 'shipped' || hasTracking) return { label: '🚚 จัดส่งแล้ว', cls: 'bg-blue-100 text-blue-800 border-blue-200' };
  if (o.payment_status === 'paid') return { label: '📦 รอจัดส่ง', cls: 'bg-purple-100 text-purple-800 border-purple-200' };

  return { label: '—', cls: 'bg-gray-100 text-gray-700 border-gray-200' };
}

type Filter = 'all' | 'pending_payment' | 'payment_review' | 'paid';

export default function AuctionOrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const nowYear = new Date().getFullYear();
  const MIN_YEAR = 2000;
  const MAX_YEAR = nowYear + 1;

  const isValidYear = (v: number) => Number.isFinite(v) && v >= MIN_YEAR && v <= MAX_YEAR;

  // ✅ สำคัญ: render แรกให้ server/client เห็นเท่ากัน (กัน hydration error)
  const [year, setYear] = useState<number>(nowYear);

  // ✅ กันไม่ให้ sync กลับไปทับ URL/localStorage ก่อนที่เราจะอ่านค่าจริง
  const [ready, setReady] = useState(false);

  const [orders, setOrders] = useState<AuctionOrder[]>([]);
  const [filterStatus, setFilterStatus] = useState<Filter>('pending_payment');
  const [loading, setLoading] = useState(true);

  // ✅ 1) หลัง mount ค่อยอ่าน: URL > localStorage > nowYear
  useEffect(() => {
    const fromUrl = Number(searchParams.get('year'));
    if (isValidYear(fromUrl)) {
      setYear(fromUrl);
      setReady(true);
      return;
    }

    const saved = Number(localStorage.getItem(STORAGE_KEY));
    if (isValidYear(saved)) {
      setYear(saved);
      setReady(true);
      return;
    }

    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ 2) หลัง ready แล้ว ค่อย sync year -> localStorage + URL
  useEffect(() => {
    if (!ready) return;

    localStorage.setItem(STORAGE_KEY, String(year));

    const params = new URLSearchParams(searchParams.toString());
    if (params.get('year') !== String(year)) {
      params.set('year', String(year));
      router.replace(`?${params.toString()}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, ready]);

  // ✅ 3) โหลดข้อมูลตามปี (หลัง ready กันยิงปีผิดตอนเริ่ม)
  useEffect(() => {
    if (!ready) return;

    const load = async () => {
      try {
        setLoading(true);
        const res = await apiFetch(`${API}/auction-orders?year=${year}`);
        if (!res.ok) {
          setOrders([]);
          return;
        }
        const data: unknown = await res.json();
        setOrders(Array.isArray(data) ? (data as AuctionOrder[]) : []);
      } catch (err) {
        console.error(err);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [year, ready]);

  const counts = useMemo(() => {
    const all = Array.isArray(orders) ? orders : [];
    return {
      all: all.length,
      pending_payment: all.filter((o) => o.payment_status === 'pending_payment').length,
      payment_review: all.filter((o) => o.payment_status === 'payment_review').length,
      paid: all.filter((o) => o.payment_status === 'paid').length,
    };
  }, [orders]);

  const filtered = useMemo(() => {
    return orders.filter((o) => (filterStatus === 'all' ? true : o.payment_status === filterStatus));
  }, [orders, filterStatus]);

  const filterButtons: Array<{ v: Filter; label: string; count: number }> = [
    { v: 'pending_payment', label: '⏳ รอชำระเงิน', count: counts.pending_payment },
    { v: 'payment_review', label: '🔍 รอตรวจสอบสลิป', count: counts.payment_review },
    { v: 'paid', label: '✅ ชำระแล้ว', count: counts.paid },
    { v: 'all', label: '📦 ทั้งหมด', count: counts.all },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
      <div className="p-6 pt-8">
        <div className="mb-8">
          <div className="inline-block bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-full text-sm font-semibold mb-4">
            จัดการออเดอร์ประมูล
          </div>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                🔨 ออเดอร์ประมูล
              </h1>
              <p className="text-sm text-gray-500 mt-2">
                ใช้สำหรับติดตามงานล่าสุด/ตรวจสถานะค้าง เพื่อจัดการการชำระเงินและการจัดส่งให้รวดเร็ว
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={year <= MIN_YEAR || loading}
                onClick={() => setYear((y) => y - 1)}
                className="px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ◀
              </button>

              <div className="px-6 py-2 rounded-lg bg-gray-100 text-lg font-bold text-gray-800 min-w-[90px] text-center">
                {year}
              </div>

              <button
                type="button"
                disabled={year >= MAX_YEAR || loading}
                onClick={() => setYear((y) => y + 1)}
                className="px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ▶
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-2 border-gray-200">
          <div className="flex flex-wrap gap-2">
            {filterButtons.map((x) => {
              const isActive = filterStatus === x.v;
              return (
                <button
                  key={x.v}
                  type="button"
                  onClick={() => setFilterStatus(x.v)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold border transition
                    ${isActive ? 'bg-green-600 text-white border-green-600 shadow' : 'bg-white text-gray-700 border-gray-300 hover:bg-green-50'}`}
                >
                  {x.label}
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-white text-green-700' : 'bg-gray-200 text-gray-700'}`}>
                    {x.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                  <th className="p-4 text-center w-28">รหัส</th>
                  <th className="p-4 text-left">สินค้า</th>
                  <th className="p-4 text-left">ผู้ชนะ</th>
                  <th className="p-4 text-center w-44">จบประมูล</th>
                  <th className="p-4 text-center w-44">ชำระล่าสุด</th>
                  <th className="p-4 text-right w-32">ราคา</th>
                  <th className="p-4 text-center w-44">สถานะชำระเงิน</th>
                  <th className="p-4 text-center w-44">สถานะการจัดส่ง</th>
                  <th className="p-4 text-center w-40">จัดการ</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-gray-500">⏳ กำลังโหลด...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-gray-500">ไม่พบข้อมูล</td>
                  </tr>
                ) : (
                  filtered.map((o) => {
                    const code = `auc:${String(o.Aid).padStart(4, '0')}`;
                    const p = paymentBadge(o.payment_status);
                    const s = shippingBadge(o);

                    return (
                      <tr key={o.Aid} className="border-b border-gray-200 hover:bg-green-50 transition-colors">
                        <td className="p-4 text-center font-mono text-sm bg-gray-50">{code}</td>
                        <td className="p-4 font-semibold text-gray-900">{o.PROname}</td>
                        <td className="p-4 text-gray-700">{o.Cname}</td>
                        <td className="p-4 text-center text-sm text-gray-700">{fmtDateTime(o.end_time)}</td>
                        <td className="p-4 text-center text-sm text-gray-700">{fmtDateTime(o.paid_at)}</td>
                        <td className="p-4 text-right font-bold text-lg text-green-600">{fmtBaht(Number(o.current_price))} ฿</td>

                        <td className="p-4 text-center">
                          <span className={`inline-flex px-3 py-1.5 rounded-full text-sm font-semibold border ${p.cls}`}>
                            {p.label}
                          </span>
                        </td>

                        <td className="p-4 text-center">
                          <span className={`inline-flex px-3 py-1.5 rounded-full text-sm font-semibold border ${s.cls}`}>
                            {s.label}
                          </span>
                          {o.tracking_number ? <div className="text-xs text-gray-500 mt-1">#{o.tracking_number}</div> : null}
                        </td>

                        <td className="p-4 text-center">
                          <Link href={`/admin/auction-orders/${o.Aid}`}>
                            <button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 shadow-md hover:shadow-lg whitespace-nowrap">
                              📋 ดูรายละเอียด
                            </button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 text-xs text-gray-500 border-t bg-gray-50">
            * หน้านี้แสดงภาพรวมสถานะเท่านั้น การแก้สถานะ/ใส่เลขพัสดุ ทำในหน้ารายละเอียดออเดอร์
          </div>
        </div>
      </div>
    </div>
  );
}
