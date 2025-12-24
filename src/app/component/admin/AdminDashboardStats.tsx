'use client';
import { apiFetch } from '@/app/lib/apiFetch';
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
      className={`px-2 py-1 rounded-full text-xs font-medium ${
        classes[status] || 'bg-gray-300 text-gray-800'
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

useEffect(() => {
  const load = async () => {
    try {
      setLoading(true);

      const [sRes, oRes, aoRes] = await Promise.all([
        apiFetch(`${API}/stats/full`),
        apiFetch(`${API}/orders/all`),
        apiFetch(`${API}/auction-orders/all`),
      ]);

      if (sRes.status === 401 || sRes.status === 403) {
        window.location.href = "/";
        return;
      }

      // --- stats ---
      if (!sRes.ok) {
        setStats(null);
        setOrders([]);
        setDailyData([]);
        return;
      }
      const statsJson: unknown = await sRes.json();
      setStats(
        typeof statsJson === "object" && statsJson !== null
          ? (statsJson as FullStats)
          : null
      );

      // --- orders ---
      const ordersJson: unknown = oRes.ok ? await oRes.json() : [];
      const safeOrders = Array.isArray(ordersJson)
        ? (ordersJson as AdminOrder[])
        : [];
      setOrders(safeOrders);

      // --- auction orders ---
      const aoJson: unknown = aoRes.ok ? await aoRes.json() : [];
      const auctionOrders = Array.isArray(aoJson)
        ? (aoJson as AuctionOrder[])
        : [];

      setDailyData(summarizeDailyStats(safeOrders, auctionOrders));
    } catch (err) {
      console.error("โหลดสถิติผิด:", err);
      setStats(null);
      setOrders([]);
      setDailyData([]);
    } finally {
      setLoading(false);
    }
  };

  load();
}, []);



  /* ---------- 10 ออเดอร์ล่าสุด ---------- */
  const latestOrders = useMemo(() => {
  const safe = Array.isArray(orders) ? orders : [];
  return [...safe].sort((a, b) => b.Oid - a.Oid).slice(0, 10);
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
      <section className="bg-white p-5 rounded-xl border shadow">
        <h2 className="text-xl font-bold mb-3">
          📊 ยอดขายรายวัน (โอน / COD / ประมูล)
        </h2>

        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={dailyData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="dateLabel" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="transfer" fill="#4ade80" name="โอน" />
            <Bar dataKey="cod" fill="#60a5fa" name="COD" />
            <Bar dataKey="auction" fill="#fbbf24" name="ประมูล" />
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* Latest orders */}
      <section>
        <h2 className="text-xl font-bold mb-3">📋 10 ออเดอร์ล่าสุด</h2>

        <div className="bg-white rounded-xl border shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">รหัส</th>
                <th className="px-3 py-2 text-left">ลูกค้า</th>
                <th className="px-3 py-2 text-right">ยอดรวม</th>
                <th className="px-3 py-2 text-center">สถานะ</th>
                <th className="px-3 py-2 text-center">วันที่</th>
              </tr>
            </thead>
            <tbody>
              {latestOrders.map((o) => {
                const code = `ord:${String(o.Oid).padStart(4, '0')}`;
                return (
                  <tr key={o.Oid} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-2 font-mono text-xs">{code}</td>
                    <td className="px-3 py-2">{o.Cname}</td>
                    <td className="px-3 py-2 text-right">
                      {fmtBaht(o.Oprice)} บาท
                    </td>
                    <td className="px-3 py-2 text-center">
                      <StatusBadge status={o.Ostatus} />
                    </td>
                    <td className="px-3 py-2 text-center">
                      {formatThaiDate(o.Odate)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
  const borderClass: Record<string, string> = {
    emerald: 'border-emerald-300',
    blue: 'border-blue-300',
    indigo: 'border-indigo-300',
    purple: 'border-purple-300',
    gray: 'border-gray-300',
    red: 'border-red-300',
    rose: 'border-rose-300',
    cyan: 'border-cyan-300',
    amber: 'border-amber-300',
    orange: 'border-orange-300',
    green: 'border-green-300',
  };

  return (
    <div
      className={`p-5 rounded-xl bg-white border ${
        borderClass[color]
      } shadow hover:shadow-md transition`}
    >
      <div className="text-xs text-gray-600">{label}</div>
      <div className={`font-bold text-black ${big ? 'text-2xl' : 'text-xl'}`}>
        {value}
      </div>
    </div>
  );
}
