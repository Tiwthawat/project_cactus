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
  Cell,
} from 'recharts';

import StatusBadge from '@/app/component/StatusBadge';
import {
  getMeta,
  ORDER_STATUS,
  AUCTION_PRODUCT_STATUS,
  AUCTION_SHIP_STATUS,
  type StatusMeta,
} from '@/app/lib/status';

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

interface TasksOverview {
  paymentReviewOrders: number;
  codPendingOrders: number;
  toShipOrders: number;
  pendingAuctionWinners: number;
  auctionToShip: number;
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

// ✅ Premium: ใช้โทนเขียวชุดเดียว (ไม่รุ้ง)
const BAR_COLORS = [
  '#064E3B', // emerald-900
  '#065F46', // emerald-800
  '#047857', // emerald-700
  '#059669', // emerald-600
  '#10B981', // emerald-500
];

const FORCE_ADD_7_HOURS = false;

function formatThaiDate(dateStr: string) {
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

async function readJsonArray<T>(res: Response | null): Promise<T[]> {
  if (!res || !res.ok) return [];
  const json: unknown = await res.json().catch(() => []);
  return Array.isArray(json) ? (json as T[]) : [];
}

function toKey(raw: unknown): string {
  return raw == null ? '' : String(raw).trim();
}

function getAuctionShippingMeta(input: {
  payment_status?: unknown;
  shipping_status?: unknown;
  tracking_number?: unknown;
}): StatusMeta {
  if (toKey(input.payment_status) !== 'paid') {
    return { label: '—', tone: 'gray' };
  }

  const s = toKey(input.shipping_status);
  const hasTracking = toKey(input.tracking_number).length > 0;

  if (s === 'delivered') return AUCTION_SHIP_STATUS.delivered;
  if (s === 'shipping' || hasTracking) return AUCTION_SHIP_STATUS.shipping;

  return AUCTION_SHIP_STATUS.pending;
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
          apiFetch(`${API}/auctions/winners?year=${year}&type=pending_payment&limit=10`).catch(
            () => null
          ),
          apiFetch(`${API}/auctions/shipping?year=${year}&limit=10`).catch(() => null),
        ]);

        if (prRes.status === 401 || prRes.status === 403) {
          window.location.href = '/';
          return;
        }

        const prList = await readJsonArray<AdminOrder>(prRes);
        const shipList = await readJsonArray<AdminOrder>(shipRes);
        const codList = await readJsonArray<AdminOrder>(codRes);
        const aPendingList = await readJsonArray<AuctionWinnerRow>(aRes);
        const aShipList = await readJsonArray<AuctionToShipRow>(aShipRes);

        setPaymentReviewOrders(prList);
        setToShipOrders(shipList);
        setCodPendingOrders(codList);
        setAuctionPending(aPendingList);
        setAuctionToShip(aShipList);

        if (ovRes && ovRes.ok) {
          const ovJson: any = await ovRes.json().catch(() => ({}));
          setOverview({
            paymentReviewOrders: Number(ovJson?.paymentReviewOrders || 0),
            codPendingOrders: Number(ovJson?.codPendingOrders || 0),
            toShipOrders: Number(ovJson?.toShipOrders || 0),
            pendingAuctionWinners: Number(ovJson?.pendingAuctionWinners || 0),
            auctionToShip: Number(ovJson?.auctionToShip || 0),
          });
        } else {
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
  }, [year]);

  if (loading)
    return (
      <div className="rounded-2xl border border-emerald-100 bg-white p-10 text-center text-emerald-700/70">
        กำลังโหลดข้อมูล...
      </div>
    );

  return (
    <div className="space-y-10 text-slate-900">
      {/* Header + Year */}
      <section className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-emerald-700 font-semibold">
            Tasks
          </p>
          <h2 className="text-2xl font-semibold text-emerald-950 tracking-wide">
            งานที่ต้องจัดการ
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            หน้านี้ไว้เคลียร์งานค้างให้จบ: ตรวจสลิป / จัดส่ง / ผู้ชนะประมูล
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={year <= MIN_YEAR}
            onClick={() => setYear((y) => y - 1)}
            className="h-10 w-10 rounded-lg border border-emerald-200 bg-white hover:bg-emerald-50 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="previous year"
          >
            ‹
          </button>

          <div className="h-10 px-6 rounded-lg bg-emerald-50 border border-emerald-100 text-base font-semibold text-emerald-950 flex items-center justify-center min-w-[96px]">
            {year}
          </div>

          <button
            type="button"
            disabled={year >= MAX_YEAR}
            onClick={() => setYear((y) => y + 1)}
            className="h-10 w-10 rounded-lg border border-emerald-200 bg-white hover:bg-emerald-50 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="next year"
          >
            ›
          </button>
        </div>
      </section>

      {/* Cards */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card label="โอนรอตรวจสลิป" value={`${overview.paymentReviewOrders} รายการ`} />
          <Card label="COD รอยืนยัน" value={`${overview.codPendingOrders} รายการ`} />
          <Card label="ออเดอร์รอส่ง" value={`${overview.toShipOrders} รายการ`} />
          <Card label="ประมูลรอจ่าย" value={`${overview.pendingAuctionWinners} รายการ`} />
          <Card label="ประมูลรอส่ง" value={`${overview.auctionToShip} รายการ`} />
        </div>

        {!hasAny && (
          <div className="mt-4 rounded-2xl border border-emerald-100 bg-white p-6 text-center text-slate-600">
            ตอนนี้ไม่มีงานค้าง
          </div>
        )}
      </section>

      {/* Tables */}
      <TaskTable
        title="โอน: รายการรอตรวจสอบการชำระเงิน"
        subtitle="ออเดอร์ที่แนบสลิปแล้ว รอแอดมินตรวจและยืนยัน"
        rows={paymentReviewOrders}
        emptyText="ยังไม่มีรายการรอตรวจสอบ"
        rightAction={(o) => (
          <Link
            href={`/admin/orders/${o.Oid}`}
            className="px-3 py-2 rounded-lg bg-emerald-700 text-white text-sm hover:bg-emerald-800"
          >
            จัดการ
          </Link>
        )}
      />

      <TaskTable
        title="COD: รายการรอยืนยัน/รอดำเนินการ"
        subtitle="ออเดอร์แบบ COD ที่ต้องจัดการตามขั้นตอนของร้าน"
        rows={codPendingOrders}
        emptyText="ยังไม่มีรายการ COD ค้าง"
        rightAction={(o) => (
          <Link
            href={`/admin/orders/${o.Oid}`}
            className="px-3 py-2 rounded-lg bg-emerald-700 text-white text-sm hover:bg-emerald-800"
          >
            จัดการ
          </Link>
        )}
      />

      <TaskTable
        title="ออเดอร์: รายการรอจัดส่ง"
        subtitle="ออเดอร์ที่พร้อมกรอกขนส่งและ Tracking"
        rows={toShipOrders}
        emptyText="ยังไม่มีรายการรอจัดส่ง"
        rightAction={(o) => (
          <Link
            href={`/admin/orders/${o.Oid}`}
            className="px-3 py-2 rounded-lg bg-emerald-700 text-white text-sm hover:bg-emerald-800"
          >
            จัดส่ง
          </Link>
        )}
      />

      {/* Auction pending */}
      <section className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
        <div className="p-6 border-b border-emerald-100 bg-emerald-50/60">
          <div className="text-lg font-semibold text-emerald-950">ประมูล: ผู้ชนะรอชำระ</div>
          <div className="text-sm text-slate-600">จบประมูลแล้ว แต่ยังไม่ชำระเงิน</div>
        </div>

        {auctionPending.length === 0 ? (
          <div className="p-6 text-slate-600">ยังไม่มีรายการค้าง</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    สินค้า
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    ผู้ชนะ
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    ยอด
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    จบประมูล
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    สถานะ
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody>
                {auctionPending.map((x) => {
                  const meta = getMeta(AUCTION_PRODUCT_STATUS, x.PROstatus);
                  return (
                    <tr key={x.Aid} className="border-t border-emerald-100 hover:bg-emerald-50/50">
                      <td className="px-5 py-4 font-medium">{x.PROname}</td>
                      <td className="px-5 py-4">{x.winner_name}</td>
                      <td className="px-5 py-4 text-right font-semibold">{fmtBaht(x.current_price)} บาท</td>
                      <td className="px-5 py-4 text-center text-slate-600 text-xs">
                        {formatThaiDate(x.end_time)}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <StatusBadge label={meta.label} tone={meta.tone} />
                      </td>
                      <td className="px-5 py-4 text-center">
                        <Link
                          href={`/admin/auction-orders/${x.Aid}`}
                          className="px-3 py-2 rounded-lg bg-emerald-700 text-white text-sm hover:bg-emerald-800"
                        >
                          จัดการ
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Auction to ship */}
      <section className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
        <div className="p-6 border-b border-emerald-100 bg-emerald-50/60">
          <div className="text-lg font-semibold text-emerald-950">ประมูล: รายการรอจัดส่ง</div>
          <div className="text-sm text-slate-600">ชำระแล้ว แต่ยังไม่กรอกขนส่งหรือ Tracking</div>
        </div>

        {auctionToShip.length === 0 ? (
          <div className="p-6 text-slate-600">ยังไม่มีรายการค้าง</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    สินค้า
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    ผู้ชนะ
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    ยอด
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    จบประมูล
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    สถานะ
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody>
                {auctionToShip.map((x) => {
                  const shipMeta = getAuctionShippingMeta({
                    payment_status: x.payment_status,
                    shipping_status: x.shipping_status,
                    tracking_number: x.tracking_number,
                  });

                  return (
                    <tr key={x.Aid} className="border-t border-emerald-100 hover:bg-emerald-50/50">
                      <td className="px-5 py-4 font-medium">{x.PROname}</td>
                      <td className="px-5 py-4">{x.winner_name}</td>
                      <td className="px-5 py-4 text-right font-semibold">{fmtBaht(x.current_price)} บาท</td>
                      <td className="px-5 py-4 text-center text-slate-600 text-xs">
                        {formatThaiDate(x.end_time)}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <StatusBadge label={shipMeta.label} tone={shipMeta.tone} />
                      </td>
                      <td className="px-5 py-4 text-center">
                        <Link
                          href={`/admin/auction-orders/${x.Aid}`}
                          className="px-3 py-2 rounded-lg bg-emerald-700 text-white text-sm hover:bg-emerald-800"
                        >
                          จัดส่ง
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Chart */}
      <section className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
        <div className="p-6 border-b border-emerald-100 bg-emerald-50/60">
          <div className="text-lg font-semibold text-emerald-950">สรุปงานค้าง</div>
          <div className="text-sm text-slate-600">ดูว่างานกองตรงไหน เพื่อไล่เคลียร์ได้ไว</div>
        </div>

        <div className="p-6">
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 text-xs text-slate-500">
            *แสดง “จำนวนงานค้าง” ไม่ใช่รายได้
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
    <section className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
      <div className="p-6 border-b border-emerald-100 bg-emerald-50/60">
        <div className="text-lg font-semibold text-emerald-950">{title}</div>
        <div className="text-sm text-slate-600">{subtitle}</div>
      </div>

      {rows.length === 0 ? (
        <div className="p-6 text-slate-600">{emptyText}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white">
                {['รหัส', 'ลูกค้า', 'ยอด', 'ชำระ', 'สถานะ', 'วันที่', 'จัดการ'].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => {
                const meta = getMeta(ORDER_STATUS, o.Ostatus);
                return (
                  <tr key={o.Oid} className="border-t border-emerald-100 hover:bg-emerald-50/50">
                    <td className="px-5 py-4 font-mono text-xs">{`ord:${String(o.Oid).padStart(
                      4,
                      '0'
                    )}`}</td>
                    <td className="px-5 py-4 font-medium">{o.Cname}</td>
                    <td className="px-5 py-4 text-right font-semibold">{fmtBaht(o.Oprice)} บาท</td>
                    <td className="px-5 py-4 text-center text-xs text-slate-700">
                      {String(o.Opayment || '-').toUpperCase()}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <StatusBadge label={meta.label} tone={meta.tone} />
                    </td>
                    <td className="px-5 py-4 text-center text-slate-600 text-xs">
                      {formatThaiDate(o.Odate)}
                    </td>
                    <td className="px-5 py-4 text-center">{rightAction(o)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/* ---------------- Card ---------------- */

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white border border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="p-6 space-y-2">
        <div className="text-xs font-semibold text-emerald-800/80 uppercase tracking-wide">
          {label}
        </div>
        <div className="text-2xl md:text-3xl font-semibold text-emerald-950">
          {value}
        </div>
        <div className="h-1 w-10 rounded-full bg-emerald-700/80" />
      </div>
    </div>
  );
}
