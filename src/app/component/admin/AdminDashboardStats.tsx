'use client';

import { apiFetch } from '@/app/lib/apiFetch';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

type ModeKey =
  | 'payment_review'
  | 'cod_pending'
  | 'to_ship'
  | 'auction_pending'
  | 'auction_to_ship';

interface TasksOverview {
  paymentReviewOrders: number;     // โอน: รอตรวจสลิป
  codPendingOrders: number;        // COD: รอยืนยัน/รอดำเนินการ
  toShipOrders: number;            // พร้อมจัดส่ง (ออเดอร์ปกติ)
  pendingAuctionWinners: number;   // ผู้ชนะประมูลรอจ่าย
  auctionToShip: number;           // ✅ ประมูล: จ่ายแล้วรอจัดส่ง
}

interface AdminOrder {
  Oid: number;
  Oprice: number;
  Ostatus: string;
  Odate: string;
  Cname: string;
  Opayment?: string;
}

interface AuctionWinnerRow {
  Aid: number;
  PROid: number;
  PROname: string;
  current_price: number;
  winner_name: string;
  end_time: string;
  PROstatus: string;
}

interface AuctionToShipRow {
  Aid: number;
  PROid: number;
  PROname: string;
  current_price: number;
  winner_name: string;
  end_time: string;
  payment_status?: string | null;
  shipping_status?: string | null;
  tracking_number?: string | null;
  shipping_company?: string | null;
}

/* ---------------- Utils ---------------- */

const fmtBaht = (n: number | null | undefined): string =>
  Number(n || 0).toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// ✅ ถ้า backend ส่ง datetime เป็น local TH อยู่แล้ว = ไม่ต้อง +7
// ถ้า backend ส่งเป็น UTC string (ISO) แล้ว UI แสดงเพี้ยน = ค่อยเปิดอันนี้
const FORCE_ADD_7_HOURS = false;

function formatThaiDate(dateStr: string) {
  // รองรับ "YYYY-MM-DD HH:mm:ss" / ISO
  const raw = String(dateStr || '').trim();
  const d = new Date(raw.includes(' ') ? raw.replace(' ', 'T') : raw);

  if (FORCE_ADD_7_HOURS) d.setHours(d.getHours() + 7);

  if (Number.isNaN(d.getTime())) return '-';

  return d.toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusLabel(s: string) {
  const map: Record<string, string> = {
    pending_payment: 'รอชำระเงิน',
    payment_review: 'รอตรวจสอบสลิป',
    paid: 'ชำระแล้ว',
    shipping: 'กำลังจัดส่ง',
    delivered: 'สำเร็จ',
    cancelled: 'ยกเลิก',
    failed: 'ล้มเหลว',
    waiting: 'รอตรวจสอบ',
    to_ship: 'รอจัดส่ง',
    ready: 'พร้อม',
    unsold: 'ยังไม่ขาย',
    auction: 'กำลังประมูล',
  };
  return map[s] || s;
}

function statusPillClass(s: string) {
  if (s === 'payment_review' || s === 'waiting') return 'bg-amber-100 text-amber-800 border-amber-200';
  if (s === 'paid') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  if (s === 'shipping') return 'bg-blue-100 text-blue-800 border-blue-200';
  if (s === 'delivered') return 'bg-green-100 text-green-800 border-green-200';
  if (s === 'cancelled' || s === 'failed') return 'bg-red-100 text-red-800 border-red-200';
  if (s === 'pending_payment') return 'bg-orange-100 text-orange-800 border-orange-200';
  return 'bg-gray-100 text-gray-800 border-gray-200';
}

/* ---------------- Page ---------------- */

export default function AdminDashboardTasks() {
  const nowYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(nowYear);

  const MIN_YEAR = 2025;
  const MAX_YEAR = nowYear;

  const [loading, setLoading] = useState(true);

  const [overview, setOverview] = useState<TasksOverview>({
    paymentReviewOrders: 0,
    codPendingOrders: 0,
    toShipOrders: 0,
    pendingAuctionWinners: 0,
    auctionToShip: 0,
  });

  const [paymentReviewOrders, setPaymentReviewOrders] = useState<AdminOrder[]>([]);
  const [codPendingOrders, setCodPendingOrders] = useState<AdminOrder[]>([]);
  const [toShipOrders, setToShipOrders] = useState<AdminOrder[]>([]);
  const [auctionPending, setAuctionPending] = useState<AuctionWinnerRow[]>([]);
  const [auctionToShip, setAuctionToShip] = useState<AuctionToShipRow[]>([]);

  const hasAny = useMemo(() => {
    return (
      (overview.paymentReviewOrders || 0) +
        (overview.codPendingOrders || 0) +
        (overview.toShipOrders || 0) +
        (overview.pendingAuctionWinners || 0) +
        (overview.auctionToShip || 0) >
      0
    );
  }, [overview]);

  const chartData = useMemo(() => {
    return [
      { name: 'โอนรอตรวจ', value: overview.paymentReviewOrders || 0 },
      { name: 'COD รอยืนยัน', value: overview.codPendingOrders || 0 },
      { name: 'ออเดอร์รอส่ง', value: overview.toShipOrders || 0 },
      { name: 'ประมูลรอจ่าย', value: overview.pendingAuctionWinners || 0 },
      { name: 'ประมูลรอส่ง', value: overview.auctionToShip || 0 },
    ];
  }, [overview]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const [ovRes, prRes, codRes, shipRes, aRes, aShipRes] = await Promise.all([
          apiFetch(`${API}/stats/tasks-overview?year=${year}`).catch(() => null),
          apiFetch(`${API}/orders/all?year=${year}&type=payment_review&limit=10`),
          apiFetch(`${API}/orders/all?year=${year}&type=cod_pending&limit=10`).catch(() => null),
          apiFetch(`${API}/orders/all?year=${year}&type=to_ship&limit=10`),
          apiFetch(`${API}/auctions/winners?year=${year}&type=pending_payment&limit=10`).catch(() => null),
          apiFetch(`${API}/auctions/shipping?year=${year}&limit=10`).catch(() => null), // ✅ ใหม่
        ]);

        // auth guard
        if (prRes.status === 401 || prRes.status === 403) {
          window.location.href = '/';
          return;
        }

        // lists: orders
        const prJson: unknown = prRes.ok ? await prRes.json() : [];
        const prList = Array.isArray(prJson) ? (prJson as AdminOrder[]) : [];
        setPaymentReviewOrders(prList);

        const shipJson: unknown = shipRes.ok ? await shipRes.json() : [];
        const shipList = Array.isArray(shipJson) ? (shipJson as AdminOrder[]) : [];
        setToShipOrders(shipList);

        let codList: AdminOrder[] = [];
        if (codRes && (codRes as any).ok) {
          const codJson: unknown = await (codRes as any).json();
          codList = Array.isArray(codJson) ? (codJson as AdminOrder[]) : [];
        }
        setCodPendingOrders(codList);

        // auction pending (รอจ่าย)
        let aPendingList: AuctionWinnerRow[] = [];
        if (aRes && (aRes as any).ok) {
          const aJson: unknown = await (aRes as any).json();
          aPendingList = Array.isArray(aJson) ? (aJson as AuctionWinnerRow[]) : [];
        }
        setAuctionPending(aPendingList);

        // auction to ship (จ่ายแล้วรอส่ง)
        let aShipList: AuctionToShipRow[] = [];
        if (aShipRes && (aShipRes as any).ok) {
          const sJson: unknown = await (aShipRes as any).json();
          aShipList = Array.isArray(sJson) ? (sJson as AuctionToShipRow[]) : [];
        }
        setAuctionToShip(aShipList);

        // overview
        if (ovRes && (ovRes as any).ok) {
          const ovJson = await (ovRes as any).json();
          setOverview({
            paymentReviewOrders: Number(ovJson?.paymentReviewOrders || 0),
            codPendingOrders: Number(ovJson?.codPendingOrders || 0),
            toShipOrders: Number(ovJson?.toShipOrders || 0),
            pendingAuctionWinners: Number(ovJson?.pendingAuctionWinners || 0),
            auctionToShip: Number(ovJson?.auctionToShip || 0),
          });
        } else {
          // ✅ fallback: เอาจำนวนจาก list ที่โหลดมาแน่ ๆ (ไม่พึ่ง state ที่อัปเดตช้า)
          setOverview({
            paymentReviewOrders: prList.length,
            codPendingOrders: codList.length,
            toShipOrders: shipList.length,
            pendingAuctionWinners: aPendingList.length,
            auctionToShip: aShipList.length,
          });
        }
      } catch (err) {
        console.error('โหลดงานแอดมินผิด:', err);
        setOverview({
          paymentReviewOrders: 0,
          codPendingOrders: 0,
          toShipOrders: 0,
          pendingAuctionWinners: 0,
          auctionToShip: 0,
        });
        setPaymentReviewOrders([]);
        setCodPendingOrders([]);
        setToShipOrders([]);
        setAuctionPending([]);
        setAuctionToShip([]);
      } finally {
        setLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  if (loading) return <p className="text-center mt-10 text-gray-500">⏳ กำลังโหลดงาน...</p>;

  return (
    <div className="space-y-10 text-black">
      {/* Header + Year switch */}
      <section className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold">📌 งานแอดมิน (จัดการงานเท่านั้น)</h2>
          <p className="text-sm text-gray-600">
            ไม่มีสรุปรายได้ ไม่มีกราฟยอดขาย — หน้านี้ไว้เคลียร์งานให้จบ 😈
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={year <= MIN_YEAR}
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
            disabled={year >= MAX_YEAR}
            onClick={() => setYear((y) => y + 1)}
            className="px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ▶
          </button>
        </div>
      </section>

      {/* Cards */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card label="โอน: รอตรวจสอบสลิป" value={`${overview.paymentReviewOrders} รายการ`} tone="amber" />
          <Card label="COD: รอยืนยัน/รอดำเนินการ" value={`${overview.codPendingOrders} รายการ`} tone="violet" />
          <Card label="ออเดอร์: รอจัดส่ง" value={`${overview.toShipOrders} รายการ`} tone="blue" />
          <Card label="ประมูล: รอจ่าย" value={`${overview.pendingAuctionWinners} รายการ`} tone="orange" />
          <Card label="ประมูล: รอจัดส่ง" value={`${overview.auctionToShip} รายการ`} tone="cyan" />
        </div>

        {!hasAny && (
          <div className="mt-4 rounded-2xl border bg-white p-6 text-center text-gray-600">
            ตอนนี้ไม่มีงานค้าง 🎉
          </div>
        )}
      </section>

      {/* Tables */}
      <TaskTable
        title="🧾 โอน: รายการรอตรวจสอบการชำระเงิน"
        subtitle="ออเดอร์ที่แนบสลิปแล้ว (รอแอดมินตรวจ/กดยืนยัน)"
        rows={paymentReviewOrders}
        emptyText="ยังไม่มีรายการรอตรวจสอบ"
        rightAction={(o) => (
          <Link
            href={`/admin/orders/${o.Oid}`}
            className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700"
          >
            ไปจัดการ
          </Link>
        )}
      />

      <TaskTable
        title="💸 COD: รายการรอยืนยัน/รอดำเนินการ"
        subtitle="ออเดอร์แบบ COD ที่ต้องจัดการตาม flow ของร้าน"
        rows={codPendingOrders}
        emptyText="ยังไม่มีรายการ COD ค้าง"
        rightAction={(o) => (
          <Link
            href={`/admin/orders/${o.Oid}`}
            className="px-3 py-2 rounded-lg bg-violet-600 text-white text-sm hover:bg-violet-700"
          >
            ไปจัดการ
          </Link>
        )}
      />

      <TaskTable
        title="📦 ออเดอร์: รายการรอจัดส่ง"
        subtitle="ออเดอร์ที่พร้อมกรอกขนส่ง/Tracking"
        rows={toShipOrders}
        emptyText="ยังไม่มีรายการรอจัดส่ง"
        rightAction={(o) => (
          <Link
            href={`/admin/orders/${o.Oid}`}
            className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"
          >
            จัดส่ง
          </Link>
        )}
      />

      {/* Auction pending table */}
      <section className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
        <div className="p-5 border-b bg-gray-50">
          <div className="text-lg font-bold">🔨 ประมูล: ผู้ชนะรอชำระ</div>
          <div className="text-sm text-gray-600">จบประมูลแล้ว แต่ยังไม่จ่าย</div>
        </div>

        {auctionPending.length === 0 ? (
          <div className="p-6 text-gray-500">
            ยังไม่มีผู้ชนะประมูลรอชำระ (หรือยังไม่ได้ทำ endpoint)
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white">
                  <th className="px-4 py-3 text-left">สินค้า</th>
                  <th className="px-4 py-3 text-left">ผู้ชนะ</th>
                  <th className="px-4 py-3 text-right">ยอด</th>
                  <th className="px-4 py-3 text-center">จบประมูล</th>
                  <th className="px-4 py-3 text-center">สถานะ</th>
                  <th className="px-4 py-3 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {auctionPending.map((x) => (
                  <tr key={x.Aid} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{x.PROname}</td>
                    <td className="px-4 py-3">{x.winner_name}</td>
                    <td className="px-4 py-3 text-right font-semibold">{fmtBaht(x.current_price)} บาท</td>
                    <td className="px-4 py-3 text-center text-gray-600 text-xs">{formatThaiDate(x.end_time)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${statusPillClass(x.PROstatus)}`}>
                        {statusLabel(x.PROstatus)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Link
                        href={`/admin/auction-orders/${x.Aid}`}
                        className="px-3 py-2 rounded-lg bg-orange-600 text-white text-sm hover:bg-orange-700"
                      >
                        ไปจัดการ
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ✅ Auction to ship table */}
      <section className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
        <div className="p-5 border-b bg-gray-50">
          <div className="text-lg font-bold">🚚 ประมูล: รายการรอจัดส่ง</div>
          <div className="text-sm text-gray-600">จ่ายแล้ว (paid) แต่ยังไม่กรอกขนส่ง/Tracking</div>
        </div>

        {auctionToShip.length === 0 ? (
          <div className="p-6 text-gray-500">
            ยังไม่มีรายการประมูลรอจัดส่ง (หรือยังไม่ได้ทำ endpoint)
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white">
                  <th className="px-4 py-3 text-left">สินค้า</th>
                  <th className="px-4 py-3 text-left">ผู้ชนะ</th>
                  <th className="px-4 py-3 text-right">ยอด</th>
                  <th className="px-4 py-3 text-center">จบประมูล</th>
                  <th className="px-4 py-3 text-center">สถานะ</th>
                  <th className="px-4 py-3 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {auctionToShip.map((x) => (
                  <tr key={x.Aid} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{x.PROname}</td>
                    <td className="px-4 py-3">{x.winner_name}</td>
                    <td className="px-4 py-3 text-right font-semibold">{fmtBaht(x.current_price)} บาท</td>
                    <td className="px-4 py-3 text-center text-gray-600 text-xs">{formatThaiDate(x.end_time)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${statusPillClass(String(x.shipping_status || 'to_ship'))}`}>
                        {statusLabel(String(x.shipping_status || 'to_ship'))}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Link
                        href={`/admin/auction-orders/${x.Aid}`}
                        className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"
                      >
                        ไปจัดส่ง
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Bottom chart */}
      <section className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
        <div className="p-5 border-b bg-gray-50">
          <div className="text-lg font-bold">📊 สรุปงานค้าง (ภาพรวม)</div>
          <div className="text-sm text-gray-600">ดูว่างานไปกองตรงไหน จะได้ไล่เคลียร์</div>
        </div>

        <div className="p-5">
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 text-xs text-gray-500">
            *กราฟนี้คือ “งานค้าง” ไม่ใช่รายได้ — ถ้าจะเอารายได้ต้องไปหน้าแดชบอร์ดรายได้โดยเฉพาะ
          </div>
        </div>
      </section>
    </div>
  );
}

/* ---------------- Reusable Table ---------------- */

function TaskTable({
  title,
  subtitle,
  rows,
  emptyText,
  rightAction,
}: {
  title: string;
  subtitle: string;
  rows: AdminOrder[];
  emptyText: string;
  rightAction: (o: AdminOrder) => React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
      <div className="p-5 border-b bg-gray-50">
        <div className="text-lg font-bold">{title}</div>
        <div className="text-sm text-gray-600">{subtitle}</div>
      </div>

      {rows.length === 0 ? (
        <div className="p-6 text-gray-500">{emptyText}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white">
                <th className="px-4 py-3 text-left">รหัส</th>
                <th className="px-4 py-3 text-left">ลูกค้า</th>
                <th className="px-4 py-3 text-right">ยอด</th>
                <th className="px-4 py-3 text-center">ชำระ</th>
                <th className="px-4 py-3 text-center">สถานะ</th>
                <th className="px-4 py-3 text-center">วันที่</th>
                <th className="px-4 py-3 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.Oid} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{`ord:${String(o.Oid).padStart(4, '0')}`}</td>
                  <td className="px-4 py-3 font-medium">{o.Cname}</td>
                  <td className="px-4 py-3 text-right font-semibold">{fmtBaht(o.Oprice)} บาท</td>
                  <td className="px-4 py-3 text-center text-xs text-gray-700">{String(o.Opayment || '-').toUpperCase()}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${statusPillClass(o.Ostatus)}`}>
                      {statusLabel(o.Ostatus)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600 text-xs">{formatThaiDate(o.Odate)}</td>
                  <td className="px-4 py-3 text-center">{rightAction(o)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/* ---------------- Card ---------------- */

function Card({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'cyan' | 'amber' | 'orange' | 'violet' | 'gray' | 'blue';
}) {
  const gradientClass: Record<string, string> = {
    cyan: 'from-cyan-500 to-cyan-600',
    amber: 'from-amber-500 to-amber-600',
    orange: 'from-orange-500 to-orange-600',
    violet: 'from-violet-500 to-violet-600',
    blue: 'from-blue-500 to-blue-600',
    gray: 'from-gray-500 to-gray-600',
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white border-2 border-gray-200 shadow-lg hover:shadow-xl transition-shadow">
      <div className={`absolute inset-x-0 top-0 h-2 bg-gradient-to-r ${gradientClass[tone] || gradientClass.gray}`} />
      <div className="p-6 space-y-2">
        <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</div>
        <div className="text-2xl md:text-3xl font-bold text-gray-900">{value}</div>
      </div>
    </div>
  );
}
