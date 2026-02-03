'use client';

import { apiFetch } from '@/app/lib/apiFetch';
import { useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface FullStats {
  totalOrders: number;
  orderSales: number;
  cancelledOrders: number;
  failedOrders: number;
  orderToday: number;
  orderMonth: number;

  totalAuctions: number;
  auctionSales: number;
  soldAuctionCount: number;
  unsoldAuctionCount: number;

  bankSales: number;
  codSales: number;

  totalSales: number;
}

interface AdminOrder {
  Oid: number;
  Oprice: number;
  Ostatus: string;
  Odate: string; // datetime string
  Cname: string;
}

type Mode = 'day' | 'month' | 'year';

interface SalesSeriesRow {
  k: string; // day: "2026-01-11", month: "2026-01", year: "2026"
  transfer: number;
  cod: number;
  auction: number;
  total: number;
}

interface SalesSeriesResponse {
  mode: Mode;
  start: string;
  end: string;
  series: SalesSeriesRow[];
}

interface PendingStats {
  paymentReviewOrders: number;
  toShipOrders: number;
  pendingAuctionWinners: number;
}




const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

const fmtBaht = (n: number | null | undefined): string =>
  Number(n || 0).toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/* ---------- FIX TIME (MySQL → เวลาไทย) ---------- */
function formatThaiDate(dateStr: string) {
  const d = new Date(dateStr.replace(' ', 'T'));
  d.setHours(d.getHours() + 7);
  return d.toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/* ---------- label ตาม mode ---------- */
function makeLabel(k: string, mode: Mode) {
  if (!k) return '-';

  // ถ้า k เป็น Date.toString() → แปลงก่อน
  const clean =
    k.includes('GMT') ? new Date(k).toISOString().slice(0, 10) : k;

  if (mode === 'day') {
    const d = new Date(clean + 'T00:00:00');
    if (isNaN(d.getTime())) return clean;
    return d.toLocaleDateString('th-TH', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  }

  if (mode === 'month') {
    const d = new Date(clean + '-01T00:00:00');
    if (isNaN(d.getTime())) return clean;
    return d.toLocaleDateString('th-TH', {
      month: 'short',
      year: '2-digit',
    });
  }

  // year
  return clean;
}


export default function AdminDashboardStats() {
  const [stats, setStats] = useState<FullStats | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const [mode, setMode] = useState<Mode>('day');
  const [series, setSeries] = useState<SalesSeriesRow[]>([]);
  const [pending, setPending] = useState<PendingStats | null>(null);
  const nowYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(nowYear);
  const [ssRange, setSsRange] = useState<{ start: string; end: string } | null>(null);
const MIN_YEAR = 2025;
  const MAX_YEAR = new Date().getFullYear();

  const yearOptions = useMemo(() => {
    // ย้อนหลัง 5 ปี (ปรับได้)
    return Array.from({ length: 6 }, (_, i) => nowYear - i);
  }, [nowYear]);


  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const [sRes, ssRes, oRes, pRes] = await Promise.all([
          apiFetch(`${API}/stats/full?year=${year}`),
          apiFetch(`${API}/stats/sales-series?mode=${mode}&year=${year}`),
          apiFetch(`${API}/orders/all?year=${year}&type=latest_new&limit=10`)
          ,
          apiFetch(`${API}/stats/pending?year=${year}`)

        ]);

        if (sRes.status === 401 || sRes.status === 403) {
          window.location.href = '/';
          return;
        }

        if (!sRes.ok) {
          setStats(null);
          setOrders([]);
          setSeries([]);
          setSsRange(null);
          return;
        }

        // stats
        const statsJson: unknown = await sRes.json();
        setStats(statsJson && typeof statsJson === 'object' ? (statsJson as FullStats) : null);

        // orders
        const ordersJson: unknown = oRes.ok ? await oRes.json() : [];
        setOrders(Array.isArray(ordersJson) ? (ordersJson as AdminOrder[]) : []);

        // sales-series
        const ssJson: unknown = ssRes.ok ? await ssRes.json() : null;
        if (ssJson && typeof ssJson === 'object') {
          const ss = ssJson as SalesSeriesResponse;
          setSeries(Array.isArray(ss.series) ? ss.series : []);
          setSsRange({
            start: typeof ss.start === 'string' ? ss.start : '',
            end: typeof ss.end === 'string' ? ss.end : '',
          });
        } else {
          setSeries([]);
          setSsRange(null);
        }

        // pending
        const pJson: unknown = pRes.ok ? await pRes.json() : null;
        setPending(pJson && typeof pJson === 'object' ? (pJson as PendingStats) : null);

      } catch (err) {
        console.error('โหลดสถิติผิด:', err);
        setStats(null);
        setOrders([]);
        setSeries([]);
        setSsRange(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [mode, year]);

  function formatThaiDateOnly(s: string) {
    if (!s) return '-';
    const d = new Date(s + 'T00:00:00');
    if (isNaN(d.getTime())) return s;
    return d.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' });
  }





  const latestOrders = useMemo(() => {
    const safe = Array.isArray(orders) ? orders : [];
    return [...safe].sort((a, b) => b.Oid - a.Oid).slice(0, 10);
  }, [orders]);

  const chartData = useMemo(() => {
    return series.map((r) => ({
      ...r,
      label: makeLabel(r.k, mode),
    }));


  }, [series, mode]);

  if (loading || !stats) {
    return <p className="text-center mt-10 text-gray-500">⏳ กำลังโหลดข้อมูล...</p>;
  }

  return (
    <div className="space-y-10 text-black">
      {/* 1) KPI รวมยอด */}
      <section>

        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold">💰 ภาพรวมรายได้</h2>
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={year <= MIN_YEAR}
              onClick={() => setYear((y) => y - 1)}
              className="px-3 py-2 rounded-lg border border-gray-300 bg-white
               hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
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
              className="px-3 py-2 rounded-lg border border-gray-300 bg-white
               hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ▶
            </button>
          </div>

         
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card
            big
            label="ยอดขายรวม (ปกติ + ประมูล)"
            value={`${fmtBaht(stats.totalSales)} บาท`}
            color="emerald"
          />
          <Card
            label="ยอดขายวันนี้ (ขายปกติ)"
            value={`${fmtBaht(stats.orderToday)} บาท`}
            color="indigo"
          />
          <Card
            label="ยอดขายเดือนนี้ (ขายปกติ)"
            value={`${fmtBaht(stats.orderMonth)} บาท`}
            color="purple"
          />
        </div>
      </section>

      {/* 2) Pending Actions (ใส่เลขจริงทีหลังได้) */}
      <section>
        <h2 className="text-xl font-bold mb-3">⏳ งานที่รอดำเนินการ</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card
            label="รอตรวจสอบการชำระเงิน"
            value={`${pending?.paymentReviewOrders ?? 0} รายการ`}
            color="amber"
          />
          <Card
            label="รอจัดส่ง"
            value={`${pending?.toShipOrders ?? 0} รายการ`}
            color="cyan"
          />
          <Card
            label="ผู้ชนะประมูลรอชำระ"
            value={`${pending?.pendingAuctionWinners ?? 0} รายการ`}
            color="orange"
          />

        </div>

      </section>

      {/* 3) สรุปประมูล (เฉพาะที่จำเป็น) */}
      <section>
        <h2 className="text-xl font-bold mb-3">🔨 สรุปการประมูล</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card
            label="ยอดขายจากประมูล (จ่ายแล้ว)"
            value={`${fmtBaht(stats.auctionSales)} บาท`}
            color="orange"
          />
          <Card
            label="ขายแล้ว (จ่ายแล้ว)"
            value={`${stats.soldAuctionCount} รายการ`}
            color="green"
          />
          <Card
            label="ประมูลทั้งหมด"
            value={`${stats.totalAuctions} รายการ`}
            color="gray"
          />
        </div>
      </section>

      {/* 4) กราฟยอดขาย: วัน/เดือน/ปี */}
      {/* <section className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6">
        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xl shadow-md">
              📊
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                รายงานยอดขาย ({mode === 'day' ? 'รายวัน' : mode === 'month' ? 'รายเดือน' : 'รายปี'})
              </h2>
              <p className="text-sm text-gray-500">
                โอน / COD / ประมูล
                {ssRange?.start && ssRange?.end && (
                  <span className="ml-2 text-xs text-gray-400">
                    (ช่วงข้อมูล: {formatThaiDateOnly(ssRange.start)} – {formatThaiDateOnly(ssRange.end)})
                  </span>
                )}

              </p>

            </div>
          </div>

          <div className="flex gap-2">
            <div className="inline-flex rounded-xl border bg-white overflow-hidden">
              {(['day', 'month', 'year'] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-4 py-2 text-sm font-medium transition
        ${mode === m ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                >
                  {m === 'day' ? 'วัน' : m === 'month' ? 'เดือน' : 'ปี'}
                </button>
              ))}
            </div>

          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p className="text-lg">ยังไม่มีข้อมูลยอดขาย</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={{ stroke: '#d1d5db' }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={{ stroke: '#d1d5db' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
              <Bar dataKey="transfer" fill="#10b981" name="โอน" radius={[8, 8, 0, 0]} />
              <Bar dataKey="cod" fill="#3b82f6" name="COD" radius={[8, 8, 0, 0]} />
              <Bar dataKey="auction" fill="#f59e0b" name="ประมูล" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </section> */}

      {/* 5) 10 ออเดอร์ล่าสุด */}
      {/* <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl shadow-md">
            📋
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">10 ออเดอร์ล่าสุด</h2>
            <p className="text-sm text-gray-500 mt-1">
              แสดงคำสั่งซื้อที่เพิ่งเกิดขึ้นล่าสุด เพื่อให้ผู้ดูแลติดตามสถานะการชำระเงินและการจัดส่งได้อย่างรวดเร็ว
            </p>
          </div>

        </div>

        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                  <th className="px-4 py-3 text-left">รหัส</th>
                  <th className="px-4 py-3 text-left">ลูกค้า</th>
                  <th className="px-4 py-3 text-right">ยอดรวม</th>
                  <th className="px-4 py-3 text-center">สถานะ</th>
                  <th className="px-4 py-3 text-center">วันที่</th>
                </tr>
              </thead>
              <tbody>
                {latestOrders.map((o) => {
                  const code = `ord:${String(o.Oid).padStart(4, '0')}`;
                  return (
                    <tr key={o.Oid} className="border-b border-gray-200 hover:bg-purple-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs bg-gray-50">{code}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{o.Cname}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-700">
                        {fmtBaht(o.Oprice)} บาท
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-800">
                          {o.Ostatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600 text-xs">
                        {formatThaiDate(o.Odate)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section> */}
    </div>
  );
}

/* ---------------- Components ---------------- */

function Card({
  label,
  value,
  color,
  big,
}: {
  label: string;
  value: string;
  color: string;
  big?: boolean;
}) {
  const gradientClass: Record<string, string> = {
    emerald: 'from-emerald-500 to-emerald-600',
    blue: 'from-blue-500 to-blue-600',
    indigo: 'from-indigo-500 to-indigo-600',
    purple: 'from-purple-500 to-purple-600',
    gray: 'from-gray-500 to-gray-600',
    red: 'from-red-500 to-red-600',
    rose: 'from-rose-500 to-rose-600',
    cyan: 'from-cyan-500 to-cyan-600',
    amber: 'from-amber-500 to-amber-600',
    orange: 'from-orange-500 to-orange-600',
    green: 'from-green-500 to-green-600',
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white border-2 border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className={`absolute inset-x-0 top-0 h-2 bg-gradient-to-r ${gradientClass[color] || gradientClass.gray}`} />
      <div className="p-6 space-y-2">
        <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</div>
        <div className={`font-bold text-gray-900 ${big ? 'text-3xl md:text-4xl' : 'text-2xl md:text-3xl'}`}>
          {value}
        </div>
      </div>
    </div>
  );
}
