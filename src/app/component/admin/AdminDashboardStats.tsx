'use client';

import { useEffect, useState, useMemo } from 'react';
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
  Opay_method: 'transfer' | 'cod' | string; // ใช้แยกโอน / COD
}

interface AuctionOrder {
  AWid: number;
  AWprice: number;
  AWstatus: string;
  AWdate: string; // datetime string
}

interface DailyStat {
  dateKey: string;   // ใช้ sort เช่น "2025-11-04"
  dateLabel: string; // ใช้แสดงบนแกน X เช่น "4 พ.ย."
  transfer: number;
  cod: number;
  auction: number;
}

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

const fmtBaht = (n: number | null | undefined): string =>
  Number(n || 0).toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/* ---------- Badge สีสถานะ ---------- */
function StatusBadge({ status }: { status: string }) {
  const classes: Record<string, string> = {
    pending: 'bg-gray-200 text-gray-800',
    waiting: 'bg-yellow-100 text-yellow-800',
    payment_review: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    shipping: 'bg-blue-100 text-blue-800',
    shipped: 'bg-blue-100 text-blue-800',
    delivered: 'bg-emerald-100 text-emerald-800',
    cancelled: 'bg-red-100 text-red-800',
    refunded: 'bg-indigo-100 text-indigo-800',
    failed: 'bg-rose-100 text-rose-800',
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${classes[status] || 'bg-gray-300 text-gray-800'
        }`}
    >
      {status}
    </span>
  );
}

/* ---------- FIX TIME (MySQL → เวลาไทย) ---------- */
function formatThaiDate(dateStr: string) {
  const d = new Date(dateStr.replace(' ', 'T'));
  d.setHours(d.getHours() + 7); // shift to Thailand timezone
  return d.toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/* ---------- สรุปยอดรายวันจาก orders + auctionOrders ---------- */
function summarizeDailyStats(
  orders: AdminOrder[],
  auctionOrders: AuctionOrder[]
): DailyStat[] {
  const result: Record<string, DailyStat> = {};

  const isSuccessStatus = (status: string): boolean =>
    ['paid', 'delivered', 'shipping'].includes(status);

  // --- Orders ปกติ (โอน / COD) --- //
  for (const o of orders) {
    const date = new Date(o.Odate.replace(' ', 'T'));
    const dateKey = date.toISOString().slice(0, 10); // YYYY-MM-DD
    const dateLabel = date.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
    });

    if (!result[dateKey]) {
      result[dateKey] = {
        dateKey,
        dateLabel,
        transfer: 0,
        cod: 0,
        auction: 0,
      };
    }

    if (isSuccessStatus(o.Ostatus)) {
      if (o.Opay_method === 'transfer') {
        result[dateKey].transfer += o.Oprice;
      } else if (o.Opay_method === 'cod') {
        result[dateKey].cod += o.Oprice;
      }
    }
  }

  // --- Auction Orders (ประมูล) --- //
  for (const a of auctionOrders) {
    if (!a.AWdate) continue;

    const date = new Date(a.AWdate.replace(' ', 'T'));
    const dateKey = date.toISOString().slice(0, 10);
    const dateLabel = date.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
    });

    if (!result[dateKey]) {
      result[dateKey] = {
        dateKey,
        dateLabel,
        transfer: 0,
        cod: 0,
        auction: 0,
      };
    }

    if (isSuccessStatus(a.AWstatus)) {
      result[dateKey].auction += a.AWprice;
    }
  }

  const arr = Object.values(result) as DailyStat[];
  return arr.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
}

/* ---------- Component หลัก ---------- */
export default function AdminDashboardStats() {
  const [stats, setStats] = useState<FullStats | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [dailyData, setDailyData] = useState<DailyStat[]>([]);
  const [loading, setLoading] = useState(true);

  /* ---------- Load Stats + Orders + AuctionOrders ---------- */
  useEffect(() => {
    const load = async () => {
      try {
        const [sRes, oRes] = await Promise.all([
          fetch(`${API}/stats/full`),
          fetch(`${API}/orders/all`),
        ]);

        const statsData: FullStats = await sRes.json();
        const orderData: AdminOrder[] = await oRes.json();

        setStats(statsData);
        setOrders(orderData);

        // โหลด auction orders เพิ่ม
        const aoRes = await fetch(`${API}/auction-orders/all`);
        const auctionOrders: AuctionOrder[] = await aoRes.json();

        const daily = summarizeDailyStats(orderData, auctionOrders);
        setDailyData(daily);
      } catch (err) {
        console.error('โหลดสถิติผิด:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  /* ---------- 10 ออเดอร์ล่าสุด ---------- */
  const latestOrders = useMemo(() => {
    return [...orders].sort((a, b) => b.Oid - a.Oid).slice(0, 10);
  }, [orders]);

  if (loading || !stats) {
    return (
      <p className="text-center mt-10 text-gray-500">
        ⏳ กำลังโหลดข้อมูล...
      </p>
    );
  }

  return (
    <div className="space-y-10 text-black">
      {/* รวมยอด */}
      <section>
        <h2 className="text-xl font-bold mb-3">💰 รายได้รวมทั้งหมด</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card
            big
            label="ยอดขายรวม (ปกติ + ประมูล)"
            value={`${fmtBaht(stats.totalSales)} บาท`}
            color="emerald"
          />
        </div>
      </section>

      {/* ปกติ */}
      <section>
        <h2 className="text-xl font-bold mb-3">🛍️ รายได้จากการขายปกติ</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card
            label="ยอดขายปกติรวม"
            value={`${fmtBaht(stats.orderSales)} บาท`}
            color="blue"
          />
          <Card
            label="ยอดขายวันนี้"
            value={`${fmtBaht(stats.orderToday)} บาท`}
            color="indigo"
          />
          <Card
            label="ยอดขายเดือนนี้"
            value={`${fmtBaht(stats.orderMonth)} บาท`}
            color="purple"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <Card
            label="คำสั่งซื้อทั้งหมด"
            value={`${stats.totalOrders} ออเดอร์`}
            color="gray"
          />
          <Card
            label="ยกเลิก"
            value={`${stats.cancelledOrders}`}
            color="red"
          />
          <Card
            label="ล้มเหลว"
            value={`${stats.failedOrders}`}
            color="rose"
          />
        </div>
      </section>

      {/* Payment type */}
      <section>
        <h2 className="text-xl font-bold mb-3">
          🏦 / 🚚 รายได้ตามวิธีชำระเงิน
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card
            label="ยอดขายแบบโอน (Transfer)"
            value={`${fmtBaht(stats.bankSales)} บาท`}
            color="cyan"
          />
          <Card
            label="ยอดขาย COD"
            value={`${fmtBaht(stats.codSales)} บาท`}
            color="amber"
          />
        </div>
      </section>

      {/* Auction */}
      <section>
        <h2 className="text-xl font-bold mb-3">🔨 รายได้จากประมูล</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card
            label="ยอดขายประมูล"
            value={`${fmtBaht(stats.auctionSales)} บาท`}
            color="orange"
          />
          <Card
            label="ขายแล้ว"
            value={`${stats.soldAuctionCount} รายการ`}
            color="green"
          />
          <Card
            label="ตกประมูล"
            value={`${stats.unsoldAuctionCount} รายการ`}
            color="red"
          />
        </div>
      </section>

      {/* กราฟยอดขายรายวัน */}
      <section className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xl shadow-md">
            📊
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">ยอดขายรายวัน</h2>
            <p className="text-sm text-gray-500">โอน / COD / ประมูล</p>
          </div>
        </div>

        {dailyData.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p className="text-lg">ยังไม่มีข้อมูลยอดขาย</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={dailyData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="dateLabel"
                tick={{ fill: '#6b7280', fontSize: 12 }}
                axisLine={{ stroke: '#d1d5db' }}
              />
              <YAxis
                tick={{ fill: '#6b7280', fontSize: 12 }}
                axisLine={{ stroke: '#d1d5db' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
              />
              <Bar dataKey="transfer" fill="#10b981" name="โอน" radius={[8, 8, 0, 0]} />
              <Bar dataKey="cod" fill="#3b82f6" name="COD" radius={[8, 8, 0, 0]} />
              <Bar dataKey="auction" fill="#f59e0b" name="ประมูล" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>

      {/* Latest orders */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl shadow-md">
            📋
          </div>
          <h2 className="text-2xl font-bold text-gray-800">10 ออเดอร์ล่าสุด</h2>
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
                        <StatusBadge status={o.Ostatus} />
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
      </section>
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
      <div className={`absolute inset-x-0 top-0 h-2 bg-gradient-to-r ${gradientClass[color]}`} />
      <div className="p-6 space-y-2">
        <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</div>
        <div className={`font-bold text-gray-900 ${big ? 'text-3xl md:text-4xl' : 'text-2xl md:text-3xl'}`}>
          {value}
        </div>
      </div>
    </div>
  );
}
