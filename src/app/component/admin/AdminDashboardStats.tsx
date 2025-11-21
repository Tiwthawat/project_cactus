'use client';

import { useEffect, useState, useMemo } from 'react';

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
    paid: 'bg-green-100 text-green-800',
    shipped: 'bg-blue-100 text-blue-800',
    delivered: 'bg-emerald-100 text-emerald-800',
    cancelled: 'bg-red-100 text-red-800',
    refunded: 'bg-indigo-100 text-indigo-800',
    failed: 'bg-rose-100 text-rose-800',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${classes[status] || 'bg-gray-300'}`}>
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

export default function AdminDashboardStats() {
  const [stats, setStats] = useState<FullStats | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);

  /* ---------- Load Stats + Orders ---------- */
  useEffect(() => {
    const load = async () => {
      try {
        const [s, o] = await Promise.all([
          fetch(`${API}/stats/full`),
          fetch(`${API}/orders/all`),
        ]);

        setStats(await s.json());
        setOrders(await o.json());
      } catch (err) {
        console.error("โหลดสถิติผิด:", err);
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
    return <p className="text-center mt-10 text-gray-500">⏳ กำลังโหลดข้อมูล...</p>;
  }

  return (
    <div className="space-y-10 text-black">

      {/* รวมยอด */}
      <section>
        <h2 className="text-xl font-bold mb-3">💰 รายได้รวมทั้งหมด</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card big label="ยอดขายรวม (ปกติ + ประมูล)" value={`${fmtBaht(stats.totalSales)} บาท`} color="emerald" />
        </div>
      </section>

      {/* ปกติ */}
      <section>
        <h2 className="text-xl font-bold mb-3">🛍️ รายได้จากการขายปกติ</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card label="ยอดขายปกติรวม" value={`${fmtBaht(stats.orderSales)} บาท`} color="blue" />
          <Card label="ยอดขายวันนี้" value={`${fmtBaht(stats.orderToday)} บาท`} color="indigo" />
          <Card label="ยอดขายเดือนนี้" value={`${fmtBaht(stats.orderMonth)} บาท`} color="purple" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <Card label="คำสั่งซื้อทั้งหมด" value={`${stats.totalOrders} ออเดอร์`} color="gray" />
          <Card label="ยกเลิก" value={`${stats.cancelledOrders}`} color="red" />
          <Card label="ล้มเหลว" value={`${stats.failedOrders}`} color="rose" />
        </div>
      </section>

      {/* Payment type */}
      <section>
        <h2 className="text-xl font-bold mb-3">🏦 / 🚚 รายได้ตามวิธีชำระเงิน</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card label="ยอดขายแบบโอน (Transfer)" value={`${fmtBaht(stats.bankSales)} บาท`} color="cyan" />
          <Card label="ยอดขาย COD" value={`${fmtBaht(stats.codSales)} บาท`} color="amber" />
        </div>
      </section>

      {/* Auction */}
      <section>
        <h2 className="text-xl font-bold mb-3">🔨 รายได้จากประมูล</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card label="ยอดขายประมูล" value={`${fmtBaht(stats.auctionSales)} บาท`} color="orange" />
          <Card label="ขายแล้ว" value={`${stats.soldAuctionCount} รายการ`} color="green" />
          <Card label="ตกประมูล" value={`${stats.unsoldAuctionCount} รายการ`} color="red" />
        </div>
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
                    <td className="px-3 py-2 text-right">{fmtBaht(o.Oprice)} บาท</td>
                    <td className="px-3 py-2 text-center"><StatusBadge status={o.Ostatus} /></td>
                    <td className="px-3 py-2 text-center">{formatThaiDate(o.Odate)}</td>
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

function Card({ label, value, color, big }: { label: string; value: string; color: string; big?: boolean }) {
  const borderClass = {
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
  }[color];

  return (
    <div className={`p-5 rounded-xl bg-white border ${borderClass} shadow hover:shadow-md transition`}>
      <div className="text-xs text-gray-600">{label}</div>
      <div className={`font-bold text-black ${big ? 'text-2xl' : 'text-xl'}`}>{value}</div>
    </div>
  );
}
