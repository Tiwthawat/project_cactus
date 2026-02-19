'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/app/lib/apiFetch';
import StatusBadge from '@/app/component/StatusBadge';
import { getOrderBadge } from '@/app/lib/status';

// ✅ types
interface User {
  Cid: number;
  Cname: string;
  Cphone: string;
  Caddress: string;
  Csubdistrict: string;
  Cdistrict: string;
  Cprovince: string;
  Czipcode: string;
}

interface Order {
  Oid: number;
  Odate: string;
  Oprice: number | string;
  Ostatus: string; // pending_payment | waiting | payment_review | paid | shipping | delivered | cancelled ...
  Opayment: string; // cod | bank | transfer | ...
}

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

type FilterKey =
  | 'all'
  | 'pending_payment'
  | 'payment_review'
  | 'to_ship'
  | 'shipping'
  | 'delivered'
  | 'cancelled';

function norm(s: unknown) {
  return String(s ?? '').trim();
}

function isCodPay(pay: unknown) {
  const p = norm(pay).toLowerCase();
  return p === 'cod' || p === 'cash_on_delivery' || p === 'cashondelivery';
}

function isWaitingOrPendingPayment(status: unknown) {
  const s = norm(status);
  return s === 'pending_payment' || s === 'waiting';
}

/** ✅ ตัวกลาง “groupKey” สำหรับ filter/count ฝั่งลูกค้า */
function customerGroupKey(o: Order): Exclude<FilterKey, 'all'> {
  const s = norm(o.Ostatus);
  const cod = isCodPay(o.Opayment);

  if (s === 'cancelled') return 'cancelled';
  if (s === 'delivered') return 'delivered';
  if (s === 'shipping') return 'shipping';
  if (s === 'payment_review') return 'payment_review';

  // ✅ โอน + pending_payment/waiting => รอชำระเงิน
  if (!cod && isWaitingOrPendingPayment(s)) return 'pending_payment';

  // ✅ paid => รอจัดส่ง
  if (s === 'paid') return 'to_ship';

  // ✅ COD + pending_payment/waiting => รอจัดส่ง (รวมไปเลย)
  if (cod && isWaitingOrPendingPayment(s)) return 'to_ship';

  // ✅ fallback
  return 'to_ship';
}

/* ---------- UI helpers ---------- */
function fmtBaht(v: number | string) {
  const n = Number(v || 0);
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDateTH(d: string) {
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '-';
  return dt.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
}

const FILTERS: Array<{ v: FilterKey; label: string }> = [
  { v: 'all', label: 'ทั้งหมด' },
  { v: 'pending_payment', label: 'รอชำระเงิน' },
  { v: 'payment_review', label: 'รอตรวจสอบ' },
  { v: 'to_ship', label: 'รอจัดส่ง' },
  { v: 'shipping', label: 'รอรับสินค้า' },
  { v: 'delivered', label: 'ได้รับแล้ว' },
  { v: 'cancelled', label: 'ยกเลิก' },
];

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<FilterKey>('all');

  // ✅ horizontal filter scroller (Shopee-like)
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const scrollByAmount = (dir: 'left' | 'right') => {
    const el = scrollerRef.current;
    if (!el) return;
    const step = Math.max(220, Math.floor(el.clientWidth * 0.75));
    el.scrollBy({ left: dir === 'left' ? -step : step, behavior: 'smooth' });
  };

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}') as User;
    setUser(storedUser);

    if (!storedUser?.Cid) {
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await apiFetch(`${API}/orders?Cid=${storedUser.Cid}`);
        const data = await res.json().catch(() => []);
        const sorted = [...data].sort((a: Order, b: Order) => Number(b.Oid) - Number(a.Oid));
        setOrders(sorted);
      } catch (err) {
        console.error('โหลดคำสั่งซื้อผิดพลาด:', err);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleCancel = async (orderId: number) => {
    if (!confirm('ต้องการยกเลิกคำสั่งซื้อนี้ใช่หรือไม่?')) return;

    try {
      const res = await apiFetch(`${API}/orders/${orderId}/cancel`, { method: 'PATCH' });
      if (!res.ok) throw new Error('ยกเลิกไม่สำเร็จ');

      setOrders((prev) =>
        prev.map((o) => (o.Oid === orderId ? { ...o, Ostatus: 'cancelled' } : o))
      );
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการยกเลิก');
    }
  };

  const statusButtons = useMemo(() => {
    return FILTERS.map((s) => ({
      ...s,
      count:
        s.v === 'all'
          ? orders.length
          : orders.filter((o) => customerGroupKey(o) === s.v).length,
    }));
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'all') return orders;
    return orders.filter((o) => customerGroupKey(o) === statusFilter);
  }, [orders, statusFilter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50/60 via-gray-50 to-gray-50 text-black">
        <div className="max-w-5xl mx-auto pt-28 p-6">
          <div className="bg-white border border-emerald-100 rounded-3xl p-8 shadow-sm">
            <div className="animate-pulse space-y-4">
              <div className="h-8 w-64 bg-gray-200 rounded" />
              <div className="h-4 w-96 bg-gray-200 rounded" />
              <div className="h-12 w-full bg-gray-200 rounded-2xl" />
              <div className="h-32 w-full bg-gray-200 rounded-3xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user?.Cid) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50/60 via-gray-50 to-gray-50 text-black">
        <div className="max-w-5xl mx-auto pt-28 p-6">
          <div className="bg-white border border-red-200 rounded-3xl p-8 shadow-sm">
            <p className="text-red-600 font-semibold text-center">ไม่พบข้อมูลผู้ใช้</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/60 via-gray-50 to-gray-50 text-black">
      <div className="max-w-5xl mx-auto pt-28 p-6">
        {/* Header (premium, green theme subtle) */}
        <div className="mb-6">
          <div className="bg-white/80 backdrop-blur border border-emerald-100 rounded-3xl shadow-sm p-6 md:p-7">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-semibold tracking-wide text-emerald-800">
                    Orders
                  </span>
                </div>

                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-3">
                  รายการสั่งซื้อของฉัน
                </h1>
                <p className="text-gray-500 mt-2">
                  ดูสถานะคำสั่งซื้อ แจ้งชำระเงิน และติดตามการจัดส่งได้ที่หน้านี้
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm min-w-[200px]">
                <div className="text-xs text-gray-500">จำนวนรายการทั้งหมด</div>
                <div className="text-2xl font-extrabold text-gray-900 mt-1">
                  {orders.length}
                  <span className="text-sm font-semibold text-gray-500 ml-2">รายการ</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter bar (Shopee-like scroll + arrows) */}
        <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-4 md:p-5 mb-6">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="text-lg font-bold text-gray-900">กรองตามสถานะ</h2>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => scrollByAmount('left')}
                className="h-10 w-10 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition flex items-center justify-center"
                aria-label="เลื่อนซ้าย"
                title="เลื่อนซ้าย"
              >
                <span className="text-gray-700 text-lg">‹</span>
              </button>
              <button
                type="button"
                onClick={() => scrollByAmount('right')}
                className="h-10 w-10 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition flex items-center justify-center"
                aria-label="เลื่อนขวา"
                title="เลื่อนขวา"
              >
                <span className="text-gray-700 text-lg">›</span>
              </button>
            </div>
          </div>

          <div
            ref={scrollerRef}
            className="flex gap-2 overflow-x-auto pb-2 scroll-smooth"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            <style>{`
              /* hide scrollbar (webkit) */
              div::-webkit-scrollbar { display: none; }
            `}</style>

            {statusButtons.map((x) => {
              const active = statusFilter === x.v;
              return (
                <button
                  key={x.v}
                  type="button"
                  onClick={() => setStatusFilter(x.v)}
                  className={[
                    'shrink-0 h-11 px-4 rounded-2xl border transition inline-flex items-center gap-2',
                    active
                      ? 'border-emerald-500 bg-emerald-600 text-white shadow-sm'
                      : 'border-gray-200 bg-white text-gray-800 hover:bg-emerald-50 hover:border-emerald-200',
                  ].join(' ')}
                >
                  <span className="text-sm font-semibold">{x.label}</span>
                  <span
                    className={[
                      'min-w-[34px] px-2 py-0.5 rounded-full text-xs font-extrabold text-center',
                      active ? 'bg-white/95 text-emerald-700' : 'bg-gray-100 text-gray-700',
                    ].join(' ')}
                  >
                    {x.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Empty state */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-10 text-center">
            <div className="mx-auto mb-5 w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <div className="w-8 h-8 rounded-xl bg-emerald-100" />
            </div>
            <p className="text-xl font-extrabold text-gray-900">ไม่มีรายการในสถานะนี้</p>
            <p className="text-gray-500 mt-2">ลองเปลี่ยนตัวกรองด้านบน หรือกลับไปเลือกสินค้าเพิ่ม</p>
            <div className="mt-6">
              <Link
                href="/"
                className="inline-flex items-center justify-center h-11 px-6 rounded-2xl bg-gray-900 text-white font-semibold hover:bg-black transition"
              >
                ไปหน้าเลือกสินค้า
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const meta = getOrderBadge(order.Ostatus, order.Opayment, 'customer');

              const rawStatus = norm(order.Ostatus);
              const isCod = isCodPay(order.Opayment);
              const isBank = !isCod;

              const canPay = isBank && isWaitingOrPendingPayment(rawStatus);
              const canCancel = canPay;

              return (
                <div
                  key={order.Oid}
                  className="bg-white border border-gray-200 rounded-3xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  {/* top strip subtle green */}
                  <div className="h-1 bg-gradient-to-r from-emerald-500/70 via-emerald-400/30 to-transparent" />

                  <div className="p-5 md:p-6">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="min-w-[240px]">
                        <Link href={`/me/orders/${order.Oid}`}>
                          <h3 className="text-xl md:text-2xl font-extrabold text-gray-900 hover:text-emerald-700 transition cursor-pointer">
                            คำสั่งซื้อ #{order.Oid}
                          </h3>
                        </Link>
                        <p className="text-sm text-gray-500 mt-1">
                          อัปเดตสถานะและรายละเอียดอยู่ในหน้าออเดอร์
                        </p>
                      </div>

                      <div className="flex items-center gap-3 ml-auto">
                        <div className="text-right">
                          <div className="text-xs text-gray-500">ยอดรวม</div>
                          <div className="text-2xl font-extrabold text-gray-900">
                            {fmtBaht(order.Oprice)}
                            <span className="text-sm font-semibold text-gray-500 ml-1">บาท</span>
                          </div>
                        </div>

                        <StatusBadge
                          label={meta.label}
                          tone={meta.tone}
                          className="px-3 py-1.5 rounded-2xl"
                        />
                      </div>
                    </div>

                    {/* info grid (อ่านง่ายแบบ marketplace) */}
                    <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                        <div className="text-xs text-gray-500">วันที่สั่งซื้อ</div>
                        <div className="text-sm font-semibold text-gray-900 mt-1">
                          {fmtDateTH(order.Odate)}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                        <div className="text-xs text-gray-500">ช่องทางชำระเงิน</div>
                        <div className="text-sm font-semibold text-gray-900 mt-1">
                          {isCod ? 'ชำระปลายทาง (COD)' : 'โอนเงิน'}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3">
                        <div className="text-xs text-emerald-800/70">คำแนะนำ</div>
                        <div className="text-sm font-semibold text-emerald-900 mt-1">
                          {canPay
                            ? 'กรุณาแจ้งชำระเงินเพื่อให้ระบบตรวจสอบ'
                            : isCod && isWaitingOrPendingPayment(rawStatus)
                            ? 'ชำระเงินเมื่อได้รับสินค้า'
                            : 'ติดตามสถานะในหน้ารายละเอียดออเดอร์'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-5 md:px-6 pb-5 md:pb-6">
                    <div className="flex flex-wrap gap-3">
                      <Link href={`/me/orders/${order.Oid}`} className="flex-1 min-w-[200px]">
                        <button
                          type="button"
                          className="w-full h-11 rounded-2xl border border-gray-200 bg-white text-gray-900 font-semibold hover:bg-gray-50 transition"
                        >
                          ดูรายละเอียด
                        </button>
                      </Link>

                      {canPay && (
                        <Link href={`/payment/${order.Oid}`} className="flex-1 min-w-[200px]">
                          <button
                            type="button"
                            className="w-full h-11 rounded-2xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition shadow-sm"
                          >
                            แจ้งชำระเงิน
                          </button>
                        </Link>
                      )}

                      {canCancel && (
                        <button
                          type="button"
                          onClick={() => handleCancel(order.Oid)}
                          className="flex-1 min-w-[200px] h-11 rounded-2xl border border-red-200 bg-white text-red-700 font-semibold hover:bg-red-50 transition"
                        >
                          ยกเลิกคำสั่งซื้อ
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
