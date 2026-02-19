'use client';

import { apiFetch } from '@/app/lib/apiFetch';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import StatusBadge from '@/app/component/StatusBadge';
import { getMeta, ORDER_STATUS } from '@/app/lib/status';

interface Order {
  Oid: number;
  Oprice: number;
  Ostatus: string;
  Odate: string;
  Cname: string;
  Opayment: string;
}

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';
const STORAGE_KEY = 'admin_orders_year';

function fmtBaht(n: number | string) {
  return Number(n || 0).toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** MySQL DATETIME string -> แสดงเป็นวันที่ไทย (กัน timezone เพี้ยน) */
function formatThaiDateOnlyFromMysql(dateStr: string) {
  if (!dateStr) return '-';
  const d = new Date(dateStr.replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return String(dateStr);

  // ถ้า backend ส่งเป็น UTC แต่จริงๆเป็นเวลาไทยค่อยชดเชย +7
  d.setHours(d.getHours() + 7);

  return d.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

function normalizePay(p: string) {
  return (p || '').toLowerCase();
}

function isTransferPay(p: string) {
  const pay = normalizePay(p);
  return ['transfer', 'bank', 'bank_transfer', 'bank-transfer'].includes(pay);
}

type PayFilter = 'all' | 'transfer' | 'cod';
type StatusFilter =
  | 'all'
  | 'pending_payment'
  | 'payment_review'
  | 'paid'
  | 'shipping'
  | 'delivered'
  | 'cancelled';

export default function OrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const nowYear = new Date().getFullYear();
  const MIN_YEAR = 2020;
  const MAX_YEAR = nowYear + 1;

  // ✅ เริ่มเป็น null ก่อน เพื่อกัน “ปีปัจจุบันทับ URL”
  const [year, setYear] = useState<number | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filterStatus, setFilterStatus] =
    useState<StatusFilter>('pending_payment');
  const [filterPay, setFilterPay] = useState<PayFilter>('all');
  const [loading, setLoading] = useState(true);

  const didInitRef = useRef(false);

  // ✅ 1) init year: URL > localStorage > nowYear
  useEffect(() => {
    const fromUrl = Number(searchParams.get('year'));
    if (Number.isFinite(fromUrl) && fromUrl >= MIN_YEAR && fromUrl <= MAX_YEAR) {
      setYear(fromUrl);
      didInitRef.current = true;
      return;
    }

    const saved = Number(localStorage.getItem(STORAGE_KEY));
    if (Number.isFinite(saved) && saved >= MIN_YEAR && saved <= MAX_YEAR) {
      setYear(saved);
      didInitRef.current = true;
      return;
    }

    setYear(nowYear);
    didInitRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ 2) sync year -> localStorage + URL (หลัง init เท่านั้น)
  useEffect(() => {
    if (!didInitRef.current) return;
    if (year === null) return;

    localStorage.setItem(STORAGE_KEY, String(year));

    const current = searchParams.get('year');
    if (current !== String(year)) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('year', String(year));
      router.replace(`?${params.toString()}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  // ✅ 3) load data
  useEffect(() => {
    if (year === null) return;

    const load = async () => {
      try {
        setLoading(true);

        const res = await apiFetch(`${API}/orders/all?year=${year}`);

        if (res.status === 401 || res.status === 403) {
          window.location.href = '/';
          return;
        }

        if (!res.ok) {
          setOrders([]);
          return;
        }

        const data: unknown = await res.json();
        setOrders(Array.isArray(data) ? (data as Order[]) : []);
      } catch (err) {
        console.error('❌ โหลด orders fail:', err);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [year]);

  const makeCode = (prefix: string, id: number) =>
    `${prefix}:${String(id).padStart(4, '0')}`;

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const st = String(o.Ostatus || '').trim();
      const matchStatus = filterStatus === 'all' ? true : st === filterStatus;

      const pay = normalizePay(o.Opayment);
      const matchPay =
        filterPay === 'all'
          ? true
          : filterPay === 'transfer'
          ? isTransferPay(pay)
          : pay === 'cod';

      return matchStatus && matchPay;
    });
  }, [orders, filterStatus, filterPay]);

  // ✅ นับจำนวน “ตามช่องทางจ่าย” ที่เลือก + กัน COD ไปโผล่ใน “รอชำระเงิน” (all/transfer)
  const statusCounts = useMemo(() => {
    const base: Record<StatusFilter, number> = {
      all: 0,
      pending_payment: 0,
      payment_review: 0,
      paid: 0,
      shipping: 0,
      delivered: 0,
      cancelled: 0,
    };

    for (const o of orders) {
      const pay = normalizePay(o.Opayment);

      const matchPay =
        filterPay === 'all'
          ? true
          : filterPay === 'transfer'
          ? isTransferPay(pay)
          : pay === 'cod';

      if (!matchPay) continue;

      base.all += 1;

      const st = String(o.Ostatus || '').trim();

      // ✅ COD + (pending_payment|waiting) => ไม่ควรไปนับเป็น “รอชำระเงิน” ถ้าไม่ได้ดูโหมด COD
      if (
        (st === 'pending_payment' || st === 'waiting') &&
        pay === 'cod' &&
        filterPay !== 'cod'
      ) {
        continue;
      }

      const s = st as StatusFilter;
      if (s in base) base[s] += 1;
    }

    return base;
  }, [orders, filterPay]);

  const statusButtons: Array<{ v: StatusFilter; label: string; count: number }> =
    [
      {
        v: 'pending_payment',
        label: filterPay === 'cod' ? ' รอจัดส่ง' : '⏳ รอชำระเงิน',
        count: statusCounts.pending_payment,
      },
      {
        v: 'payment_review',
        label: ' รอตรวจสอบสลิป',
        count: statusCounts.payment_review,
      },
      { v: 'paid', label: ' ชำระแล้ว', count: statusCounts.paid },
      { v: 'shipping', label: ' กำลังจัดส่ง', count: statusCounts.shipping },
      { v: 'delivered', label: ' ส่งสำเร็จ', count: statusCounts.delivered },
      { v: 'cancelled', label: ' ยกเลิก', count: statusCounts.cancelled },
      { v: 'all', label: ' ทั้งหมด', count: statusCounts.all },
    ];

  const payButtons: Array<{ v: PayFilter; label: string }> = [
    { v: 'all', label: '💳 ทุกช่องทาง' },
    { v: 'transfer', label: '🏦 โอน' },
    { v: 'cod', label: '📦 COD' },
  ];

  // ✅ กันหน้ากระพริบ/URL เด้งตอน year ยัง null
  if (year === null) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        ⏳ กำลังเตรียมข้อมูล...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
      <div className="p-6 pt-8">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-block bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-full text-sm font-semibold mb-4">
            จัดการออเดอร์
          </div>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                📦 ออเดอร์ทั้งหมด
              </h1>
              <p className="text-sm text-gray-500 mt-2">
                แยกปี + กรองสถานะ/ช่องทางจ่าย
              </p>
            </div>

            {/* Year Picker */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={year <= MIN_YEAR || loading}
                onClick={() =>
                  setYear((y) => Math.max(MIN_YEAR, (y ?? nowYear) - 1))
                }
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
                onClick={() =>
                  setYear((y) => Math.min(MAX_YEAR, (y ?? nowYear) + 1))
                }
                className="px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ▶
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-2 border-gray-200 space-y-4">
          <div className="flex flex-wrap gap-2">
            {statusButtons.map((x) => {
              const isActive = filterStatus === x.v;
              return (
                <button
                  key={x.v}
                  type="button"
                  onClick={() => setFilterStatus(x.v)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold border transition
                    ${
                      isActive
                        ? 'bg-green-600 text-white border-green-600 shadow'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-green-50'
                    }`}
                >
                  {x.label}
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full
                      ${
                        isActive
                          ? 'bg-white text-green-700'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                  >
                    {x.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2">
            {payButtons.map((x) => {
              const isActive = filterPay === x.v;
              return (
                <button
                  key={x.v}
                  type="button"
                  onClick={() => setFilterPay(x.v)}
                  className={`px-4 py-2 rounded-xl font-semibold border transition
                    ${
                      isActive
                        ? 'bg-gray-900 text-white border-gray-900 shadow'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  {x.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                  <th className="p-4 text-center w-28">รหัส</th>
                  <th className="p-4 text-left">ลูกค้า</th>
                  <th className="p-4 text-center w-40">วันที่</th>
                  <th className="p-4 text-center w-40">ช่องทางจ่าย</th>
                  <th className="p-4 text-right w-40">ยอดรวม</th>
                  <th className="p-4 text-center w-52">สถานะ</th>
                  <th className="p-4 text-center w-40">จัดการ</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      ⏳ กำลังโหลด...
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      ไม่พบข้อมูล
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((o) => {
                    const code = makeCode('ord', o.Oid);

                    const pay = normalizePay(o.Opayment);
                    const isCod = pay === 'cod';
                    const st = String(o.Ostatus || '').trim();

                    let meta = getMeta(ORDER_STATUS, st);

                    // ✅ COD + (pending_payment|waiting) => แสดงเป็น “รอจัดส่ง” แทน “รอชำระเงิน”
                    if (isCod && (st === 'pending_payment' || st === 'waiting')) {
                      meta = { ...meta, label: ' รอจัดส่ง' }; // หรือ 'รอยืนยัน COD'
                    }

                    return (
                      <tr
                        key={o.Oid}
                        className="border-b border-gray-200 hover:bg-green-50 transition-colors"
                      >
                        <td className="p-4 text-center font-mono text-sm bg-gray-50">
                          {code}
                        </td>

                        <td className="p-4 font-semibold text-gray-900">
                          {o.Cname}
                        </td>

                        <td className="p-4 text-center text-sm text-gray-700">
                          {formatThaiDateOnlyFromMysql(o.Odate)}
                        </td>

                        <td className="p-4 text-center text-sm text-gray-700">
                          {isTransferPay(o.Opayment)
                            ? '🏦 โอน'
                            : pay === 'cod'
                            ? '📦 COD'
                            : o.Opayment || '—'}
                        </td>

                        <td className="p-4 text-right font-bold text-lg text-green-600">
                          {fmtBaht(o.Oprice)} ฿
                        </td>

                        <td className="p-4 text-center">
                          <StatusBadge label={meta.label} tone={meta.tone} />
                        </td>

                        <td className="p-4 text-center">
                          <Link href={`/admin/orders/${o.Oid}`}>
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
            * หน้านี้จำปีจาก URL / localStorage และจะไม่เด้งกลับปีปัจจุบันตอนรีเฟรช
          </div>
        </div>
      </div>
    </div>
  );
}
