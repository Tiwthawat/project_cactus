'use client';

import { apiFetch } from '@/app/lib/apiFetch';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  LineChart,
  Line,
} from 'recharts';

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

type PaymentKey = 'bank' | 'cod' | 'auction';

interface MethodRow {
  key: PaymentKey;
  label: string;
  value: number;
  percent: number;
}

/** ---------- NEW report rows ---------- */

interface TopProductRow {
  product_id: number;
  name: string;
  category?: string | null;
  qty: number;
  revenue: number;
}

interface CategoryRevenueRow {
  category: string;
  revenue: number;
  qty: number;
}

interface StockCategoryRow {
  category: string;
  total_products: number;
  total_stock: number;
  low_stock: number;
}

interface LowStockRow {
  product_id: number;
  name: string;
  category?: string | null;
  stock: number;
}

interface TopCustomerRow {
  customer_id: number;
  name: string;
  orders: number;
  total_spent: number;
  avg_order: number;
}

interface OrderStatusRow {
  status:
    | 'pending_payment'
    | 'payment_review'
    | 'paid'
    | 'shipping'
    | 'delivered'
    | 'cancelled'
    | 'failed'
    | string;
  count: number;
}

interface SalesDailyRow {
  date: string; // 'YYYY-MM-DD'
  revenue: number;
}

/** ---------- Main stats ---------- */
interface FullStats {
  // Orders (ขายปกติ)
  totalOrders: number;
  orderSales: number;
  cancelledOrders: number;
  failedOrders: number;
  orderToday: number;
  orderMonth: number;

  // Auctions
  totalAuctions: number;
  auctionSales: number;
  soldAuctionCount: number;
  unsoldAuctionCount: number;

  // Payment channels
  bankSales: number;
  codSales: number;

  // Total
  totalSales: number;

  // NEW datasets (optional)
  topProducts?: TopProductRow[];
  categoryRevenue?: CategoryRevenueRow[];
  stockByCategory?: StockCategoryRow[];
  lowStockProducts?: LowStockRow[];
  topCustomers?: TopCustomerRow[];
  orderStatusOverview?: OrderStatusRow[];
  salesDaily?: SalesDailyRow[];

  // optional auction performance
  auctionParticipationAvg?: number;
  auctionClosedRate?: number;
}

/** ---------- helpers ---------- */
const COLORS = ['#0ea5e9', '#f97316', '#22c55e']; // bank / cod / auction

const toNum = (n: unknown): number => {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
};

const fmtBaht = (n: unknown): string =>
  toNum(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtInt = (n: unknown): string =>
  toNum(n).toLocaleString('th-TH', { maximumFractionDigits: 0 });

const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = 2022;
const MAX_YEAR = CURRENT_YEAR;

/** ---------- Tabs ---------- */
type TabKey =
  | 'overview'
  | 'payments'
  | 'trend'
  | 'products'
  | 'categories'
  | 'stock'
  | 'orders'
  | 'auction';





const TAB_LIST: { key: TabKey; label: string; icon: string; desc: string }[] = [
  { key: 'overview', label: 'ภาพรวม', icon: '🧭', desc: 'สรุปยอดขาย + ตัวเลขหลักทั้งหมด' },
  { key: 'payments', label: 'ช่องทางรายได้', icon: '💳', desc: 'โอน / COD / ประมูล (Pie + ตาราง + bar)' },
  { key: 'trend', label: 'แนวโน้ม', icon: '📈', desc: 'ยอดขายรายวัน (ถ้ามีข้อมูล)' },
  { key: 'products', label: 'สินค้าขายดี', icon: '🏆', desc: 'Top Products + Top Customers' },
  { key: 'categories', label: 'หมวดหมู่ทำเงิน', icon: '🗂️', desc: 'ยอดขายตามหมวด (ตาราง + กราฟ)' },
  { key: 'stock', label: 'สต็อก', icon: '📦', desc: 'สต็อกรวม + ใกล้หมด' },
  { key: 'orders', label: 'สถานะออเดอร์', icon: '🧾', desc: 'ภาพรวมสถานะ + กราฟ' },
  { key: 'auction', label: 'ประมูล', icon: '🔨', desc: 'ตัวชี้วัดประมูล + สรุปผู้บริหาร' },
];

 const LS_TAB_KEY = 'admin_stats_tab';
const LS_YEAR_KEY = 'admin_stats_year';







function isTabKey(x: string | null): x is TabKey {
  return !!x && TAB_LIST.some((t) => t.key === x);
}

export default function AdminStatsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [stats, setStats] = useState<FullStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errMsg, setErrMsg] = useState<string>('');
  const [year, setYear] = useState<number>(() => {
  if (typeof window === 'undefined') return CURRENT_YEAR;
  const saved = localStorage.getItem(LS_YEAR_KEY);
  const y = Number(saved);
  return Number.isFinite(y) ? y : CURRENT_YEAR;
});

const [tab, setTab] = useState<TabKey>(() => {
  if (typeof window === 'undefined') return 'overview';
  const saved = localStorage.getItem(LS_TAB_KEY) as TabKey | null;
  return saved && TAB_LIST.some(t => t.key === saved) ? saved : 'overview';
});


useEffect(() => {
  const urlTab = searchParams.get('tab');

  if (isTabKey(urlTab)) {
    setTab(urlTab);
    localStorage.setItem(LS_TAB_KEY, urlTab); // กันกลับมาแล้วลืม
  } else {
    // ถ้าเข้ามาแบบไม่มี ?tab= ให้ "เขียน URL" ตามแท็บที่จำไว้
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`/admin/stats?${params.toString()}`);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [searchParams]);




  const setTabAndUrl = (next: TabKey) => {
    setTab(next);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', next);
    router.replace(`/admin/stats?${params.toString()}`);
  };

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setErrMsg('');

      try {
        const url = `${API}/stats/full?year=${year}`;
        const res = await apiFetch(url);

        if (res.status === 401 || res.status === 403) {
          router.replace('/');
          return;
        }

        if (!res.ok) {
          const t = await res.text().catch(() => '');
          throw new Error(t || `โหลดไม่สำเร็จ (HTTP ${res.status})`);
        }

        const data: FullStats = await res.json();
        if (!mounted) return;
        setStats(data);
      } catch (e) {
        if (!mounted) return;
        setErrMsg(e instanceof Error ? e.message : 'โหลดสถิติไม่สำเร็จ');
        setStats(null);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [router, year]);

  /** ----- Payment method report ----- */
  const methodRows: MethodRow[] = useMemo(() => {
    if (!stats) return [];
    const bank = toNum(stats.bankSales);
    const cod = toNum(stats.codSales);
    const auction = toNum(stats.auctionSales);
    const total = bank + cod + auction;
    const safeTotal = total <= 0 ? 1 : total;

    return [
      { key: 'bank', label: 'โอน (Bank / โอนผ่านบัญชี)', value: bank, percent: (bank / safeTotal) * 100 },
      { key: 'cod', label: 'ปลายทาง (COD)', value: cod, percent: (cod / safeTotal) * 100 },
      { key: 'auction', label: 'ประมูล', value: auction, percent: (auction / safeTotal) * 100 },
    ];
  }, [stats]);

  const pieData = useMemo(() => methodRows.map((r) => ({ name: r.label, value: r.value })), [methodRows]);

  const barData = useMemo(() => {
    if (!stats) return [];
    return [
      {
        name: 'ยอดขายรวม',
        bank: toNum(stats.bankSales),
        cod: toNum(stats.codSales),
        auction: toNum(stats.auctionSales),
      },
    ];
  }, [stats]);

  /** ----- New reports: safe fallbacks ----- */
  const topProducts = stats?.topProducts ?? [];
  const categoryRevenue = stats?.categoryRevenue ?? [];
  const stockByCategory = stats?.stockByCategory ?? [];
  const lowStockProducts = stats?.lowStockProducts ?? [];
  const topCustomers = stats?.topCustomers ?? [];
  const orderStatusOverview = stats?.orderStatusOverview ?? [];
  const salesDaily = stats?.salesDaily ?? [];

  const hasAnySales =
    !!stats && (toNum(stats.totalSales) > 0 || toNum(stats.orderSales) > 0 || toNum(stats.auctionSales) > 0);

  /** chart data transforms */
  const categoryBarData = useMemo(() => {
    return categoryRevenue.map((c) => ({
      name: c.category,
      revenue: toNum(c.revenue),
      qty: toNum(c.qty),
    }));
  }, [categoryRevenue]);

  const stockBarData = useMemo(() => {
    return stockByCategory.map((c) => ({
      name: c.category,
      stock: toNum(c.total_stock),
      low: toNum(c.low_stock),
      products: toNum(c.total_products),
    }));
  }, [stockByCategory]);

  const orderStatusBarData = useMemo(() => {
    return orderStatusOverview.map((r) => ({
      name: r.status,
      count: toNum(r.count),
    }));
  }, [orderStatusOverview]);

  const dailyLineData = useMemo(() => {
    return salesDaily.map((d) => ({
      date: d.date,
      revenue: toNum(d.revenue),
    }));
  }, [salesDaily]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-gray-100 bg-white/80 p-6 shadow-sm text-center text-gray-500">
          ⏳ กำลังโหลดสถิติร้านค้า...
        </div>
      </div>
    );
  }

  if (errMsg) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
          <div className="font-semibold text-rose-700">โหลดสถิติไม่สำเร็จ</div>
          <div className="mt-2 text-sm text-rose-700/90 break-words">{errMsg}</div>

          <button
            onClick={() => window.location.reload()}
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-700"
          >
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-gray-100 bg-white/80 p-6 shadow-sm text-center text-gray-500">
          ยังไม่มีข้อมูลสถิติ
        </div>
      </div>
    );
  }

  const activeTabMeta = TAB_LIST.find((t) => t.key === tab) || TAB_LIST[0];

  return (
    <div className="p-6 text-black space-y-8">
      {/* ===== Header ===== */}
      <header className="space-y-3">
        <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-2">
          <span className="text-3xl">📊</span>
          <span>รายงาน & สถิติร้านค้า</span>
        </h1>

        <p className="text-sm text-gray-500">
          Dashboard สำหรับเจ้าของร้าน: ยอดขาย, สต็อก, สินค้าขายดี, ลูกค้าประจำ, สถานะออเดอร์ และประสิทธิภาพประมูล
        </p>

        {/* ===== Year Switcher ===== */}
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
      </header>

      {/* ===== Tabs ===== */}
      <section className="bg-white/70 backdrop-blur border border-gray-100 rounded-2xl shadow-sm p-4">
        <div className="flex flex-wrap gap-2">
          {TAB_LIST.map((t) => (
            <button
              key={t.key}
              onClick={() => setTabAndUrl(t.key)}
              className={[
                'px-4 py-2 rounded-xl text-sm font-semibold border transition',
                tab === t.key
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50',
              ].join(' ')}
              type="button"
            >
              <span className="mr-2">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-3 text-sm text-gray-500">
          <span className="font-semibold text-gray-800">
            {activeTabMeta.icon} {activeTabMeta.label}
          </span>
          <span className="ml-2">— {activeTabMeta.desc}</span>
        </div>
      </section>

      {/* ===================== TAB CONTENTS ===================== */}
      {tab === 'overview' && (
        <>
          {/* Summary Cards (ของเก่า) */}
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

          {/* Mini Cards (ของเก่า) */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MiniCard label="ยอดขายแบบโอน (Bank)" value={`${fmtBaht(stats.bankSales)} บาท`} tag="ช่องทางโอน" />
            <MiniCard label="ยอดขายแบบเก็บปลายทาง (COD)" value={`${fmtBaht(stats.codSales)} บาท`} tag="ชำระหน้าบ้าน" />
            <MiniCard
              label="ประมูล: ขายแล้ว / ตกประมูล"
              value={`${fmtInt(stats.soldAuctionCount)} / ${fmtInt(stats.unsoldAuctionCount)} รายการ`}
              tag="สรุปผลประมูล"
            />
          </section>

          {/* Orders Snapshot (ของเก่า) */}
          <section className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <MiniCard label="ออเดอร์ทั้งหมด (ขายปกติ)" value={`${fmtInt(stats.totalOrders)} รายการ`} tag="Orders" />
            <MiniCard label="ออเดอร์วันนี้" value={`${fmtInt(stats.orderToday)} รายการ`} tag="Today" />
            <MiniCard label="ออเดอร์เดือนนี้" value={`${fmtInt(stats.orderMonth)} รายการ`} tag="This month" />
            <MiniCard
              label="ยกเลิก / ล้มเหลว"
              value={`${fmtInt(stats.cancelledOrders)} / ${fmtInt(stats.failedOrders)} รายการ`}
              tag="Quality"
            />
          </section>

          {/* สรุปแบบผู้บริหาร (เอามาจากของเก่า ไม่ลบ) */}
          <CardShell>
            <CardTitle icon="📝" title="สรุปภาพรวม (สำหรับนำเสนอ)" subtitle="มองภาพรวมเร็ว ๆ ว่าระบบรายงานทำอะไรได้" />
            <ul className="text-sm text-gray-700 space-y-2 list-disc pl-5">
              <li>
                เห็น <b>ยอดขายรวม</b> แยกช่องทาง (โอน/COD/ประมูล) เพื่อช่วยตัดสินใจเรื่องโปรโมชันและการลงสินค้า
              </li>
              <li>
                มี <b>สินค้าขายดี</b> และ <b>หมวดหมู่ทำเงิน</b> เพื่อวางแผนสต็อกและนำเข้าสินค้า
              </li>
              <li>
                มี <b>สต็อกคงเหลือ</b> และ <b>สินค้าใกล้หมด</b> ลดโอกาสเสียยอดขายจากของหมด
              </li>
              <li>
                มี <b>ลูกค้าประจำ</b> ช่วยทำการตลาดเฉพาะกลุ่ม (VIP/ส่วนลด/แจ้งเตือน)
              </li>
              <li>
                มี <b>สถานะออเดอร์</b> ให้แอดมินเห็นคอขวดงานและจัดการ flow ได้
              </li>
            </ul>
          </CardShell>
        </>
      )}

      {tab === 'payments' && (
        <>
          {/* Payment Pie + Table (ของเก่า) */}
          <section className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">
            <CardShell className="lg:col-span-2">
              <CardTitle icon="🍰" title="สัดส่วนรายได้ตามประเภท" subtitle="โอน / COD / ประมูล" />
              <div className="flex-1 min-h-[240px]">
                {!hasAnySales ? (
                  <EmptyState text="ยังไม่มีข้อมูลรายได้" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="80%" paddingAngle={4}>
                        {pieData.map((entry, index) => (
                          <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => `${fmtBaht(value)} บาท`}
                        contentStyle={{
                          borderRadius: 12,
                          borderColor: '#e5e7eb',
                          boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
                        }}
                      />
                      <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardShell>

            <CardShell className="lg:col-span-3">
              <CardTitle icon="📋" title="ตารางสรุปรายได้ตามช่องทาง" subtitle="ยอดขาย + สัดส่วน" />
              <DataTable
                columns={[
                  { key: 'type', header: 'ประเภท', align: 'left' },
                  { key: 'value', header: 'ยอดขาย', align: 'right' },
                  { key: 'percent', header: 'สัดส่วน', align: 'right' },
                ]}
                rows={methodRows.map((row, idx) => ({
                  id: row.key,
                  type: (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                      {row.label}
                    </span>
                  ),
                  value: `${fmtBaht(row.value)} บาท`,
                  percent: row.value === 0 ? '-' : `${row.percent.toFixed(1)} %`,
                }))}
                emptyText="ยังไม่มีข้อมูล"
              />
            </CardShell>
          </section>

          {/* Compare sales bar (ของเก่า) */}
          <CardShell>
            <CardTitle icon="📦" title="เปรียบเทียบยอดขาย (โอน / COD / ประมูล)" subtitle="กราฟแท่งภาพรวม" />
            <div className="h-72">
              {!hasAnySales ? (
                <EmptyState text="ยังไม่มีข้อมูลยอดขาย" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(v: number) => toNum(v).toLocaleString('th-TH', { maximumFractionDigits: 0 })} />
                    <Tooltip
                      formatter={(value) => `${fmtBaht(value)} บาท`}
                      contentStyle={{
                        borderRadius: 12,
                        borderColor: '#e5e7eb',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="bank" name="โอน (Bank)" radius={[10, 10, 0, 0]} fill={COLORS[0]} />
                    <Bar dataKey="cod" name="ปลายทาง (COD)" radius={[10, 10, 0, 0]} fill={COLORS[1]} />
                    <Bar dataKey="auction" name="ประมูล" radius={[10, 10, 0, 0]} fill={COLORS[2]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardShell>
        </>
      )}

      {tab === 'trend' && (
        <CardShell>
          <CardTitle icon="📈" title="แนวโน้มยอดขายรายวัน (ถ้ามีข้อมูล)" subtitle="ช่วยดูช่วงพีค/ตก" />
          <div className="h-72">
            {dailyLineData.length === 0 ? (
              <EmptyState text="ยังไม่มีข้อมูลแนวโน้ม (salesDaily)" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyLineData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={(v: number) => toNum(v).toLocaleString('th-TH', { maximumFractionDigits: 0 })} />
                  <Tooltip
                    formatter={(value) => `${fmtBaht(value)} บาท`}
                    contentStyle={{
                      borderRadius: 12,
                      borderColor: '#e5e7eb',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" name="ยอดขาย" stroke="#0ea5e9" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardShell>
      )}

      {tab === 'products' && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CardShell>
            <CardTitle icon="🏆" title="สินค้าขายดี (Top Products)" subtitle="ตามจำนวนขาย + ยอดเงิน" />
            <DataTable
              columns={[
                { key: 'name', header: 'สินค้า', align: 'left' },
                { key: 'category', header: 'หมวด', align: 'left' },
                { key: 'qty', header: 'จำนวน', align: 'right' },
                { key: 'revenue', header: 'ยอดเงิน', align: 'right' },
              ]}
              rows={topProducts.slice(0, 10).map((p) => ({
                id: p.product_id,
                name: p.name,
                category: p.category || '-',
                qty: fmtInt(p.qty),
                revenue: `${fmtBaht(p.revenue)} บาท`,
              }))}
              emptyText="ยังไม่มีข้อมูลสินค้าขายดี"
            />
          </CardShell>

          <CardShell>
            <CardTitle icon="👑" title="ลูกค้าประจำ (Top Customers)" subtitle="ซื้อบ่อย / ยอดรวมสูง" />
            <DataTable
              columns={[
                { key: 'name', header: 'ลูกค้า', align: 'left' },
                { key: 'orders', header: 'ครั้งที่ซื้อ', align: 'right' },
                { key: 'total', header: 'ยอดรวม', align: 'right' },
                { key: 'avg', header: 'เฉลี่ย/บิล', align: 'right' },
              ]}
              rows={topCustomers.slice(0, 10).map((c) => ({
                id: c.customer_id,
                name: c.name,
                orders: fmtInt(c.orders),
                total: `${fmtBaht(c.total_spent)} บาท`,
                avg: `${fmtBaht(c.avg_order)} บาท`,
              }))}
              emptyText="ยังไม่มีข้อมูลลูกค้าประจำ"
            />
          </CardShell>
        </section>
      )}

      {tab === 'categories' && (
        <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <CardShell className="lg:col-span-2">
            <CardTitle icon="🗂️" title="หมวดหมู่ทำเงิน" subtitle="ยอดขายตามหมวด" />
            <DataTable
              columns={[
                { key: 'category', header: 'หมวดหมู่', align: 'left' },
                { key: 'qty', header: 'จำนวนขาย', align: 'right' },
                { key: 'revenue', header: 'ยอดขาย', align: 'right' },
              ]}
              rows={categoryRevenue.slice(0, 10).map((r) => ({
                id: r.category,
                category: r.category,
                qty: fmtInt(r.qty),
                revenue: `${fmtBaht(r.revenue)} บาท`,
              }))}
              emptyText="ยังไม่มีข้อมูลหมวดหมู่"
            />
          </CardShell>

          <CardShell className="lg:col-span-3">
            <CardTitle icon="📊" title="กราฟยอดขายตามหมวดหมู่" subtitle="ดูหมวดที่ควรลงของเพิ่ม" />
            <div className="h-72">
              {categoryBarData.length === 0 ? (
                <EmptyState text="ยังไม่มีข้อมูล categoryRevenue" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryBarData} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(v: number) => toNum(v).toLocaleString('th-TH', { maximumFractionDigits: 0 })} />
                    <Tooltip formatter={(value) => `${fmtBaht(value)} บาท`} />
                    <Legend />
                    <Bar dataKey="revenue" name="ยอดขาย" radius={[10, 10, 0, 0]} fill="#22c55e" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardShell>
        </section>
      )}

      {tab === 'stock' && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CardShell>
            <CardTitle icon="📦" title="สต็อกคงเหลือตามหมวดหมู่" subtitle="รวมสต็อก + จำนวนสินค้าใกล้หมด" />
            <div className="h-72">
              {stockBarData.length === 0 ? (
                <EmptyState text="ยังไม่มีข้อมูล stockByCategory" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stockBarData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(v: number) => toNum(v).toLocaleString('th-TH', { maximumFractionDigits: 0 })} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="stock" name="สต็อกรวม" radius={[10, 10, 0, 0]} fill="#0ea5e9" />
                    <Bar dataKey="low" name="ใกล้หมด" radius={[10, 10, 0, 0]} fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardShell>

          <CardShell>
            <CardTitle icon="⚠️" title="สินค้าใกล้หมด (Low Stock)" subtitle="ควรเติมของก่อนขายหมด" />
            <DataTable
              columns={[
                { key: 'name', header: 'สินค้า', align: 'left' },
                { key: 'category', header: 'หมวด', align: 'left' },
                { key: 'stock', header: 'คงเหลือ', align: 'right' },
              ]}
              rows={lowStockProducts.slice(0, 12).map((p) => ({
                id: p.product_id,
                name: p.name,
                category: p.category || '-',
                stock: fmtInt(p.stock),
              }))}
              emptyText="ไม่มีสินค้าใกล้หมด / ยังไม่มีข้อมูล"
            />
            <p className="mt-3 text-xs text-gray-500">* threshold (เช่น ต่ำกว่า 5 ชิ้น) กำหนดฝั่ง backend ได้</p>
          </CardShell>
        </section>
      )}

      {tab === 'orders' && (
        <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <CardShell className="lg:col-span-2">
            <CardTitle icon="🧾" title="สถานะออเดอร์ (ภาพรวม)" subtitle="รู้คอขวดงานทันที" />
            <DataTable
              columns={[
                { key: 'status', header: 'สถานะ', align: 'left' },
                { key: 'count', header: 'จำนวน', align: 'right' },
              ]}
              rows={orderStatusOverview.map((r) => ({
                id: r.status,
                status: <StatusBadge status={r.status} />,
                count: fmtInt(r.count),
              }))}
              emptyText="ยังไม่มีข้อมูลสถานะออเดอร์"
            />
          </CardShell>

          <CardShell className="lg:col-span-3">
            <CardTitle icon="🧩" title="กราฟสถานะออเดอร์" subtitle="ช่วยเห็นว่า pending/ค้างเยอะไหม" />
            <div className="h-72">
              {orderStatusBarData.length === 0 ? (
                <EmptyState text="ยังไม่มีข้อมูล orderStatusOverview" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={orderStatusBarData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(v: number) => toNum(v).toLocaleString('th-TH', { maximumFractionDigits: 0 })} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="จำนวนออเดอร์" radius={[10, 10, 0, 0]} fill="#a855f7" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardShell>
        </section>
      )}

      {tab === 'auction' && (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <CardShell>
            <CardTitle icon="🎯" title="ประสิทธิภาพประมูล" subtitle="ตัวชี้วัดที่เจ้าของควรรู้" />
            <div className="space-y-3">
              <KeyValueRow label="จำนวนรอบประมูลทั้งหมด" value={`${fmtInt(stats.totalAuctions)} รอบ`} />
              <KeyValueRow label="ขายได้" value={`${fmtInt(stats.soldAuctionCount)} รอบ`} />
              <KeyValueRow label="ตกประมูล" value={`${fmtInt(stats.unsoldAuctionCount)} รอบ`} />
              <KeyValueRow
                label="อัตราปิดขาย (ถ้ามี)"
                value={stats.auctionClosedRate == null ? '-' : `${toNum(stats.auctionClosedRate).toFixed(1)} %`}
              />
              <KeyValueRow
                label="ผู้เข้าร่วมเฉลี่ย/รอบ (ถ้ามี)"
                value={stats.auctionParticipationAvg == null ? '-' : `${toNum(stats.auctionParticipationAvg).toFixed(1)} คน`}
              />
            </div>
          </CardShell>

          <CardShell className="lg:col-span-2">
            <CardTitle icon="📝" title="สรุปผู้บริหาร" subtitle="ข้อความใช้พูดกับอาจารย์/กรรมการได้เลย" />
            <ul className="text-sm text-gray-700 space-y-2 list-disc pl-5">
              <li>แสดงยอดขายรวมแยกช่องทาง (โอน/COD/ประมูล) เพื่อช่วยตัดสินใจด้านราคาและโปรโมชัน</li>
              <li>มีรายงานสินค้าขายดีและลูกค้าประจำเพื่อสนับสนุนการตลาดและการจัดสต็อก</li>
              <li>ติดตามสต็อกและสินค้าใกล้หมด ลดโอกาสเสียยอดขายจากของหมด</li>
              <li>ภาพรวมสถานะออเดอร์ช่วยให้แอดมินเห็นคอขวดงานและจัดการได้ทันที</li>
              <li>รายงานประมูลมีตัวชี้วัดจำนวนรอบ ขายได้/ตกประมูล และตัวชี้วัดเสริมถ้ามีข้อมูล</li>
            </ul>
          </CardShell>
        </section>
      )}
    </div>
  );
}

/* ------------------------ UI blocks ------------------------ */

function CardShell(props: { className?: string; children: React.ReactNode }) {
  return (
    <section
      className={[
        'bg-white/80 backdrop-blur rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col',
        props.className || '',
      ].join(' ')}
    >
      {props.children}
    </section>
  );
}

function CardTitle(props: { icon: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="font-semibold flex items-center gap-2">
        <span>{props.icon}</span>
        <span>{props.title}</span>
      </h2>
      {props.subtitle ? <p className="text-xs text-gray-500 mt-1">{props.subtitle}</p> : null}
    </div>
  );
}

function EmptyState(props: { text: string }) {
  return <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">{props.text}</div>;
}

function StatCard(props: { title: string; subtitle: string; value: string; accent: string }) {
  const { title, subtitle, value, accent } = props;
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white/80 shadow-sm">
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent}`} />
      <div className="p-5 space-y-1">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</div>
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
      <span className="inline-flex w-fit rounded-full bg-gray-100 px-3 py-0.5 text-[11px] text-gray-500">{tag}</span>
    </div>
  );
}

function KeyValueRow(props: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-sm text-gray-600">{props.label}</div>
      <div className="text-sm font-semibold text-gray-900">{props.value}</div>
    </div>
  );
}

function StatusBadge(props: { status: string }) {
  const s = props.status;

  const map: Record<string, string> = {
    pending_payment: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    payment_review: 'bg-blue-100 text-blue-800 border-blue-200',
    paid: 'bg-green-100 text-green-800 border-green-200',
    shipping: 'bg-purple-100 text-purple-800 border-purple-200',
    delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    cancelled: 'bg-gray-100 text-gray-700 border-gray-200',
    failed: 'bg-rose-100 text-rose-800 border-rose-200',
  };

  const cls = map[s] || 'bg-gray-100 text-gray-700 border-gray-200';

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-0.5 text-[12px] ${cls}`}>
      {s}
    </span>
  );
}

type Align = 'left' | 'right' | 'center';

function DataTable(props: {
  columns: { key: string; header: string; align: Align }[];
  rows: { id: string | number; [key: string]: React.ReactNode }[];
  emptyText: string;
}) {
  const { columns, rows, emptyText } = props;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-gray-600">
            {columns.map((c) => (
              <th
                key={c.key}
                className={[
                  'px-3 py-2',
                  c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left',
                ].join(' ')}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-6 text-center text-gray-400">
                {emptyText}
              </td>
            </tr>
          ) : (
            rows.map((row, idx) => (
              <tr key={row.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}>
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={[
                      'px-3 py-2',
                      c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left',
                    ].join(' ')}
                  >
                    {row[c.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
