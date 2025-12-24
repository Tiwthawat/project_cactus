'use client';
import { apiFetch } from '@/app/lib/apiFetch';
import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

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

interface MethodRow {
  key: 'bank' | 'cod' | 'auction';
  label: string;
  value: number;
  percent: number;
}

const fmtBaht = (n: number | null | undefined): string =>
  Number(n || 0).toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const COLORS = ['#0ea5e9', '#f97316', '#22c55e']; // bank / cod / auction

export default function AdminStatsPage() {
  const [stats, setStats] = useState<FullStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
  const load = async () => {
    try {
      const res = await apiFetch(`${API}/stats/full`);

      if (res.status === 401 || res.status === 403) {
        window.location.href = "/";
        return;
      }

      const data: FullStats = await res.json();
      setStats(data);

    } catch (err) {
      console.error('โหลดสถิติไม่สำเร็จ:', err);
    } finally {
      setLoading(false);
    }
  };

  load();
}, []);


  const methodRows: MethodRow[] = useMemo(() => {
    if (!stats) return [];
    const bank = Number(stats.bankSales || 0);
    const cod = Number(stats.codSales || 0);
    const auction = Number(stats.auctionSales || 0);
    const total = bank + cod + auction || 1;

    return [
      {
        key: 'bank',
        label: 'โอน (Bank / โอนผ่านบัญชี)',
        value: bank,
        percent: (bank / total) * 100,
      },
      {
        key: 'cod',
        label: 'ปลายทาง (COD)',
        value: cod,
        percent: (cod / total) * 100,
      },
      {
        key: 'auction',
        label: 'ประมูล',
        value: auction,
        percent: (auction / total) * 100,
      },
    ];
  }, [stats]);

  const barData = useMemo(
    () =>
      stats
        ? [
            {
              name: 'ยอดขายรวม',
              bank: Number(stats.bankSales || 0),
              cod: Number(stats.codSales || 0),
              auction: Number(stats.auctionSales || 0),
            },
          ]
        : [],
    [stats]
  );

  const pieData = useMemo(
    () =>
      methodRows.map((r) => ({
        name: r.label,
        value: r.value,
      })),
    [methodRows]
  );

  if (loading || !stats) {
    return (
      <div className="p-6 text-center text-gray-500">
        ⏳ กำลังโหลดสถิติร้านค้า...
      </div>
    );
  }

  return (
    <div className="p-6 text-black space-y-10">
      {/* หัวหน้า + summary */}
      <header className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-2">
          <span className="text-3xl">📊</span>
          <span>สถิติร้านค้า</span>
        </h1>
        <p className="text-sm text-gray-500">
          ภาพรวมรายได้จากการขายปกติ การโอนเงิน เก็บปลายทาง และการประมูล
        </p>
      </header>

      {/* การ์ดสรุปบนสุด */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="รายได้รวมทั้งหมด"
          subtitle="ปกติ + ประมูล"
          value={`${fmtBaht(stats.totalSales)} บาท`}
          accent="from-emerald-400/80 to-emerald-600/90"
        />
        <StatCard
          title="รายได้จากการขายปกติ"
          subtitle="ออเดอร์ที่นับเป็นรายได้จริง"
          value={`${fmtBaht(stats.orderSales)} บาท`}
          accent="from-sky-400/80 to-sky-600/90"
        />
        <StatCard
          title="รายได้จากการประมูล"
          subtitle="รายการประมูลที่ปิดและชำระแล้ว"
          value={`${fmtBaht(stats.auctionSales)} บาท`}
          accent="from-orange-400/80 to-orange-600/90"
        />
      </section>

      {/* การ์ดรอง: โอน / COD / จำนวนรายการ */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MiniCard
          label="ยอดขายแบบโอน (Bank)"
          value={`${fmtBaht(stats.bankSales)} บาท`}
          tag="ช่องทางโอน"
        />
        <MiniCard
          label="ยอดขายแบบเก็บปลายทาง (COD)"
          value={`${fmtBaht(stats.codSales)} บาท`}
          tag="ชำระหน้าบ้าน"
        />
        <MiniCard
          label="รายการประมูลที่ขายแล้ว / ตกประมูล"
          value={`${stats.soldAuctionCount} / ${stats.unsoldAuctionCount} รายการ`}
          tag="สรุปผลประมูล"
        />
      </section>

      {/* สัดส่วนรายได้ (Pie) + ตารางสรุป */}
      <section className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">
        {/* Pie */}
        <div className="lg:col-span-2 bg-white/80 backdrop-blur rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col">
          <h2 className="font-semibold mb-2 flex items-center gap-2">
            <span>🍰 สัดส่วนรายได้ตามประเภท</span>
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            เปรียบเทียบรายได้จากการโอน เก็บปลายทาง และการประมูล
          </p>

          <div className="flex-1 min-h-[220px]">
            {pieData.every((p) => p.value === 0) ? (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                ยังไม่มีข้อมูลรายได้
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="55%"
                    outerRadius="80%"
                    paddingAngle={4}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `${fmtBaht(Number(value))} บาท`}
                    contentStyle={{
                      borderRadius: 12,
                      borderColor: '#e5e7eb',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
                    }}
                  />
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{ fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ตารางสรุปช่องทาง */}
        <div className="lg:col-span-3 bg-white/80 backdrop-blur rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold mb-2 flex items-center gap-2">
            <span>📋 ตารางสรุปรายได้ตามช่องทาง</span>
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            แสดงยอดขายและสัดส่วนของแต่ละวิธีการชำระเงินในตารางเดียว
          </p>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600">
                  <th className="px-3 py-2 text-left">ประเภท</th>
                  <th className="px-3 py-2 text-right">ยอดขาย</th>
                  <th className="px-3 py-2 text-right">สัดส่วน</th>
                </tr>
              </thead>
              <tbody>
                {methodRows.map((row, idx) => (
                  <tr
                    key={row.key}
                    className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}
                  >
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: COLORS[idx] }}
                        />
                        {row.label}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      {fmtBaht(row.value)} บาท
                    </td>
                    <td className="px-3 py-2 text-right">
                      {row.value === 0 ? '-' : `${row.percent.toFixed(1)} %`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* กราฟแท่งเปรียบเทียบรวม 3 แบบ */}
      <section className="bg-white/80 backdrop-blur rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold mb-2 flex items-center gap-2">
          <span>📦 เปรียบเทียบยอดขาย (โอน / COD / ประมูล)</span>
        </h2>
        <p className="text-xs text-gray-500 mb-4">
          ดูภาพรวมยอดขายของแต่ละช่องทางในกราฟเดียวกัน
        </p>

        <div className="h-72">
          {barData.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
              ยังไม่มีข้อมูลยอดขาย
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis
                  tickFormatter={(value: number) =>
                    value.toLocaleString('th-TH', { maximumFractionDigits: 0 })
                  }
                />
                <Tooltip
                  formatter={(value) => `${fmtBaht(Number(value))} บาท`}
                  contentStyle={{
                    borderRadius: 12,
                    borderColor: '#e5e7eb',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
                  }}
                />
                <Legend />
                <Bar dataKey="bank" name="โอน (Bank)" radius={[10, 10, 0, 0]} fill={COLORS[0]} />
                <Bar dataKey="cod" name="ปลายทาง (COD)" radius={[10, 10, 0, 0]} fill={COLORS[1]} />
                <Bar
                  dataKey="auction"
                  name="ประมูล"
                  radius={[10, 10, 0, 0]}
                  fill={COLORS[2]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>
    </div>
  );
}

/* ------------------------ Sub components ------------------------ */

function StatCard(props: {
  title: string;
  subtitle: string;
  value: string;
  accent: string;
}) {
  const { title, subtitle, value, accent } = props;
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white/80 shadow-sm">
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent}`} />
      <div className="p-5 space-y-1">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {title}
        </div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-xs text-gray-400">{subtitle}</div>
      </div>
    </div>
  );
}

function MiniCard(props: { label: string; value: string; tag: string }) {
  const { label, value, tag } = props;
  return (
    <div className="rounded-2xl border border-gray-100 bg-white/80 shadow-sm p-4 flex flex-col justify-between">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-xl font-semibold text-gray-900 mb-2">{value}</div>
      <span className="inline-flex w-fit rounded-full bg-gray-100 px-3 py-0.5 text-[11px] text-gray-500">
        {tag}
      </span>
    </div>
  );
}
