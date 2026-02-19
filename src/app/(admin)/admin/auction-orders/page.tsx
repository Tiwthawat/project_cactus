'use client';

import { apiFetch } from '@/app/lib/apiFetch';
import StatusBadge from '@/app/component/StatusBadge';
import { getMeta, AUCTION_PAY_STATUS, AUCTION_SHIP_STATUS, StatusMeta } from '@/app/lib/status';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type PaymentStatus = 'pending_payment' | 'payment_review' | 'paid' | 'expired' | string;
type ShipStatus = 'pending' | 'shipped' | 'delivered' | null;

interface AuctionOrder {
  Aid: number;
  PROid: number;
  PROname: string;
  Cname: string;
  current_price: number;
  payment_status: PaymentStatus;

  // db อาจเก็บ 'shipping' แต่ใน status map เราใช้ 'shipped'
  shipping_status?: 'pending' | 'shipping' | 'shipped' | 'delivered' | null;
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

type Filter = 'all' | 'pending_payment' | 'payment_review' | 'paid';
type ShipFilter = 'all' | 'pending' | 'shipped' | 'delivered';

export default function AuctionOrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const nowYear = new Date().getFullYear();
  const MIN_YEAR = 2000;
  const MAX_YEAR = nowYear + 1;

  const isValidYear = (v: number) => Number.isFinite(v) && v >= MIN_YEAR && v <= MAX_YEAR;

  // ✅ render แรกให้ server/client เห็นเท่ากัน กัน hydration
  const [year, setYear] = useState<number>(nowYear);
  const [ready, setReady] = useState(false);

  const [orders, setOrders] = useState<AuctionOrder[]>([]);
  const [filterStatus, setFilterStatus] = useState<Filter>('pending_payment');
  const [shipFilter, setShipFilter] = useState<ShipFilter>('all');
  const [loading, setLoading] = useState(true);

  // ---------- status helpers (typed) ----------
  const getPaymentMeta = (raw: PaymentStatus): StatusMeta => getMeta(AUCTION_PAY_STATUS, raw);

  const normalizeShip = (o: AuctionOrder): ShipStatus => {
    const paid = String(o.payment_status || '').trim() === 'paid';
    if (!paid) return null;

    const sRaw = String(o.shipping_status || '').trim();
    const hasTracking = Boolean(o.tracking_number);

    // ✅ normalize ให้เข้ามาตรฐาน AUCTION_SHIP_STATUS: pending | shipped | delivered
    if (sRaw === 'delivered') return 'delivered';
    if (sRaw === 'shipping' || sRaw === 'shipped' || hasTracking) return 'shipped';
    return 'pending';
  };

  const getShipMeta = (o: AuctionOrder): StatusMeta => {
    const s = normalizeShip(o);
    if (!s) return { label: '—', tone: 'gray' };
    return getMeta(AUCTION_SHIP_STATUS, s);
  };

  // ✅ 1) mount แล้วค่อยอ่าน year: URL > localStorage > nowYear
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

  // ✅ 2) ready แล้วค่อย sync year -> localStorage + URL
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

  // ✅ 3) โหลดข้อมูลตามปี
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

  const shipCounts = useMemo(() => {
    const all = Array.isArray(orders) ? orders : [];
    const paidOnly = all.filter((o) => String(o.payment_status || '').trim() === 'paid');
    return {
      all: paidOnly.length,
      pending: paidOnly.filter((o) => normalizeShip(o) === 'pending').length,
      shipped: paidOnly.filter((o) => normalizeShip(o) === 'shipped').length,
      delivered: paidOnly.filter((o) => normalizeShip(o) === 'delivered').length,
    };
  }, [orders]);

  const filtered = useMemo(() => {
    const byPayment = orders.filter((o) =>
      filterStatus === 'all' ? true : o.payment_status === filterStatus
    );

    if (shipFilter === 'all') return byPayment;

    // ✅ shipFilter มีความหมายจริง ๆ เฉพาะ paid เท่านั้น
    return byPayment.filter((o) => normalizeShip(o) === shipFilter);
  }, [orders, filterStatus, shipFilter]);

  const filterButtons: Array<{ v: Filter; label: string; count: number }> = [
    { v: 'pending_payment', label: '⏳ รอชำระเงิน', count: counts.pending_payment },
    { v: 'payment_review', label: '🔍 รอตรวจสอบสลิป', count: counts.payment_review },
    { v: 'paid', label: '✅ ชำระแล้ว', count: counts.paid },
    { v: 'all', label: '📦 ทั้งหมด', count: counts.all },
  ];

  const shipButtons: Array<{ v: ShipFilter; label: string; count: number }> = [
    { v: 'pending', label: '📦 รอจัดส่ง', count: shipCounts.pending },
    { v: 'shipped', label: '🚚 จัดส่งแล้ว', count: shipCounts.shipped },
    { v: 'delivered', label: '✅ ส่งสำเร็จ', count: shipCounts.delivered },
    { v: 'all', label: '📦 ชำระแล้วทั้งหมด', count: shipCounts.all },
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

        {/* ✅ ฟิลเตอร์แบบไม่งง: แยก 2 กล่อง */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* ------- Payment ------- */}
          <div className="bg-white rounded-2xl shadow-lg p-5 border-2 border-gray-200">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <div className="text-sm font-bold text-gray-800">สถานะชำระเงิน</div>
                <div className="text-xs text-gray-500">กรองตามขั้นตอนการจ่ายเงิน</div>
              </div>
              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-700 border">
                ทั้งหมด {counts.all}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {filterButtons.map((x) => {
                const isActive = filterStatus === x.v;
                return (
                  <button
                    key={x.v}
                    type="button"
                    onClick={() => {
                      setFilterStatus(x.v);
                      // ✅ เปลี่ยนโหมดชำระเงินแล้ว reset ship filter ให้ไม่งง
                      setShipFilter('all');
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl font-semibold border transition
                      ${
                        isActive
                          ? 'bg-green-600 text-white border-green-600 shadow'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-green-50'
                      }`}
                  >
                    <span className="truncate">{x.label}</span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        isActive ? 'bg-white text-green-700' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {x.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ------- Shipping ------- */}
          <div className="bg-white rounded-2xl shadow-lg p-5 border-2 border-gray-200">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <div className="text-sm font-bold text-gray-800">สถานะจัดส่ง</div>
                <div className="text-xs text-gray-500">นับ/กรองเฉพาะออเดอร์ที่ “ชำระแล้ว”</div>
              </div>
              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                ชำระแล้ว {shipCounts.all}
              </span>
            </div>

            {(() => {
              const shipEnabled = filterStatus === 'paid' || filterStatus === 'all';
              return (
                <>
                  <div className={`grid grid-cols-2 md:grid-cols-4 gap-2 ${!shipEnabled ? 'opacity-50' : ''}`}>
                    {shipButtons.map((x) => {
                      const isActive = shipFilter === x.v;
                      return (
                        <button
                          key={x.v}
                          type="button"
                          disabled={!shipEnabled}
                          onClick={() => setShipFilter(x.v)}
                          className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl font-semibold border transition
                            ${
                              !shipEnabled
                                ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                                : isActive
                                  ? 'bg-blue-600 text-white border-blue-600 shadow'
                                  : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'
                            }`}
                        >
                          <span className="truncate">{x.label}</span>
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                              !shipEnabled
                                ? 'bg-gray-200 text-gray-500'
                                : isActive
                                  ? 'bg-white text-blue-700'
                                  : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            {x.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {!shipEnabled ? (
                    <div className="mt-3 text-xs text-gray-500">
                      * เลือก “✅ ชำระแล้ว” หรือ “📦 ทั้งหมด” ก่อน ถึงจะกรองสถานะจัดส่งได้
                    </div>
                  ) : null}
                </>
              );
            })()}
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
                    <td colSpan={9} className="p-8 text-center text-gray-500">
                      ⏳ กำลังโหลด...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-gray-500">
                      ไม่พบข้อมูล
                    </td>
                  </tr>
                ) : (
                  filtered.map((o) => {
                    const code = `auc:${String(o.Aid).padStart(4, '0')}`;

                    const pay = getPaymentMeta(o.payment_status);
                    const ship = getShipMeta(o);

                    return (
                      <tr key={o.Aid} className="border-b border-gray-200 hover:bg-green-50 transition-colors">
                        <td className="p-4 text-center font-mono text-sm bg-gray-50">{code}</td>
                        <td className="p-4 font-semibold text-gray-900">{o.PROname}</td>
                        <td className="p-4 text-gray-700">{o.Cname}</td>
                        <td className="p-4 text-center text-sm text-gray-700">{fmtDateTime(o.end_time)}</td>
                        <td className="p-4 text-center text-sm text-gray-700">{fmtDateTime(o.paid_at)}</td>

                        <td className="p-4 text-right font-bold text-lg text-green-600">
                          {fmtBaht(Number(o.current_price))} ฿
                        </td>

                        <td className="p-4 text-center">
                          <StatusBadge label={pay.label} tone={pay.tone} />
                        </td>

                        <td className="p-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <StatusBadge label={ship.label} tone={ship.tone} />
                            {o.tracking_number ? (
                              <div className="text-xs text-gray-500">#{o.tracking_number}</div>
                            ) : null}
                          </div>
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
