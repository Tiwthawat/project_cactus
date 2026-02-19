'use client';

import { apiFetch } from '@/app/lib/apiFetch';
import React, { useEffect, useMemo, useState } from 'react';
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

import {
  FiBarChart2,
  FiPieChart,
  FiTrendingUp,
  FiTag,
  FiBox,
  FiAlertTriangle,
  FiUsers,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiRefreshCw,
  FiLoader,
} from 'react-icons/fi';

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

type SeriesMode = 'day' | 'month' | 'year';
type RangeMode = 'year' | 'yearRange' | 'dateRange';

/** ---------- report rows ---------- */
interface CategoryRevenueByTypeRow {
  type?: string | null;
  revenue: number;
  qty: number;
}

interface CategoryRevenueRow {
  type?: string | null;
  subtype?: string | null;
  revenue: number;
  qty: number;
}

interface StockByTypeRow {
  type?: string | null;
  total_products: number;
  total_stock: number;
  low_stock: number;
}

interface StockCategoryRow {
  type?: string | null;
  subtype?: string | null;
  total_products: number;
  total_stock: number;
  low_stock: number;
}

interface LowStockRow {
  product_id: number;
  name: string;
  type?: string | null;
  subtype?: string | null;
  stock: number;
}

interface TopCustomerRow {
  customer_id: number;
  name: string;
  orders: number;
  total_spent: number;
  avg_order: number;
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
  auctionSales: number;

  // Payment channels
  bankSales: number;
  codSales: number;

  // Total
  totalSales: number;

  // datasets
  categoryRevenueByType?: CategoryRevenueByTypeRow[];
  categoryRevenue?: CategoryRevenueRow[];

  stockByType?: StockByTypeRow[];
  stockByCategory?: StockCategoryRow[];

  lowStockProducts?: LowStockRow[];
  topCustomers?: TopCustomerRow[];
}

/** ---------- Sales series ---------- */
type SalesSeriesRow = {
  k: string;
  transfer: number;
  cod: number;
  auction: number;
  total: number;
};

type SalesSeriesResponse = {
  mode: SeriesMode;
  rangeMode?: string;
  year?: number;
  yearStart?: number | null;
  yearEnd?: number | null;
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
  series: SalesSeriesRow[];
};

/** ---------- helpers ---------- */
const toNum = (n: unknown): number => {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
};

const fmtBaht = (n: unknown): string =>
  toNum(n).toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const fmtInt = (n: unknown): string => toNum(n).toLocaleString('th-TH', { maximumFractionDigits: 0 });

const pad2 = (n: number) => String(n).padStart(2, '0');
const ymd = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = 2022;
const MAX_YEAR = CURRENT_YEAR;

const LOW_STOCK_THRESHOLD = 10; // ใกล้หมด <= 10

const clampYear = (y: number) => {
  if (!Number.isFinite(y)) return CURRENT_YEAR;
  if (y < MIN_YEAR) return MIN_YEAR;
  if (y > MAX_YEAR) return MAX_YEAR;
  return y;
};

const parseYearParam = (raw: string | null) => {
  const y = Number(raw);
  if (!Number.isFinite(y) || y < 1000) return null;
  return y;
};

function normalizeText(x: unknown) {
  const s = (x ?? '').toString().trim();
  return s.length ? s : null;
}

function typeName(type?: string | null) {
  return normalizeText(type) ?? 'ไม่ระบุหมวด';
}

function subtypeName(subtype?: string | null) {
  return normalizeText(subtype) ?? 'ไม่ระบุหมวดย่อย';
}

function pathLabel(type?: string | null, subtype?: string | null) {
  return `${typeName(type)} > ${subtypeName(subtype)}`;
}

/** ---------- Tabs ---------- */
type TabKey = 'overview' | 'payments' | 'trend' | 'insights' | 'stock';

const TAB_LIST: { key: TabKey; label: string; Icon: React.ComponentType<any>; desc: string }[] = [
  { key: 'overview', label: 'ภาพรวม', Icon: FiBarChart2, desc: 'ยอดขาย + ตัวเลขหลัก' },
  { key: 'payments', label: 'ช่องทางรายได้', Icon: FiPieChart, desc: 'โอน / COD / ประมูล (Pie + ตาราง + Bar)' },
  { key: 'trend', label: 'แนวโน้ม', Icon: FiTrendingUp, desc: 'รายวัน/เดือน/ปี + เลือกช่วงเอง' },
  { key: 'insights', label: 'หมวดทำเงิน', Icon: FiTag, desc: 'หมวดหลักก่อน แล้วค่อยแจกแจงหมวดย่อย' },
  { key: 'stock', label: 'สต็อก', Icon: FiBox, desc: 'หมวดหลักก่อน + เจาะหมวดย่อย + ใกล้หมด' },
];

const LS_TAB_KEY = 'admin_stats_tab';
const LS_YEAR_KEY = 'admin_stats_year';

function isTabKey(x: string | null): x is TabKey {
  return !!x && TAB_LIST.some((t) => t.key === x);
}

/** ---------- theme colors (premium green / white / gray) ---------- */
const COLOR_BANK = '#0ea5e9';
const COLOR_COD = '#f59e0b';
const COLOR_AUCTION = '#22c55e';

const COLOR_SALES = '#22c55e';
const COLOR_TOTAL = '#111827';

const COLOR_STOCK = '#0ea5e9';
const COLOR_LOW = '#ef4444';

const PIE_COLORS = [COLOR_BANK, COLOR_COD, COLOR_AUCTION];

export default function AdminStatsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [stats, setStats] = useState<FullStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errMsg, setErrMsg] = useState<string>('');

  const [year, setYear] = useState<number>(() => {
    if (typeof window === 'undefined') return CURRENT_YEAR;

    const urlYear = parseYearParam(new URLSearchParams(window.location.search).get('year'));
    if (urlYear != null) return clampYear(urlYear);

    const saved = Number(localStorage.getItem(LS_YEAR_KEY));
    return clampYear(saved);
  });

  const [tab, setTab] = useState<TabKey>(() => {
    if (typeof window === 'undefined') return 'overview';
    const saved = localStorage.getItem(LS_TAB_KEY) as TabKey | null;
    return saved && TAB_LIST.some((t) => t.key === saved) ? saved : 'overview';
  });

  /** ---------- Trend state (sales-series) ---------- */
  const [seriesMode, setSeriesMode] = useState<SeriesMode>('day');
  const [rangeMode, setRangeMode] = useState<RangeMode>('year');
  const [yearStart, setYearStart] = useState<number>(clampYear(CURRENT_YEAR - 1));
  const [yearEnd, setYearEnd] = useState<number>(clampYear(CURRENT_YEAR));
  const [startDate, setStartDate] = useState<string>(() => ymd(new Date()));
  const [endDate, setEndDate] = useState<string>(() => ymd(new Date()));
  const [seriesLoading, setSeriesLoading] = useState<boolean>(false);
  const [seriesErr, setSeriesErr] = useState<string>('');
  const [seriesData, setSeriesData] = useState<SalesSeriesResponse | null>(null);

  /** ---------- category expand states ---------- */
  const [openTypesRevenue, setOpenTypesRevenue] = useState<Record<string, boolean>>({});
  const [openTypesStock, setOpenTypesStock] = useState<Record<string, boolean>>({});

  /** ----- ensure URL has tab + year ----- */
  useEffect(() => {
    const urlTab = searchParams.get('tab');
    const urlYearRaw = searchParams.get('year');
    const urlYear = parseYearParam(urlYearRaw);

    const params = new URLSearchParams(searchParams.toString());
    let changed = false;

    if (isTabKey(urlTab)) {
      if (urlTab !== tab) setTab(urlTab);
      localStorage.setItem(LS_TAB_KEY, urlTab);
    } else {
      params.set('tab', tab);
      changed = true;
    }

    if (urlYear != null) {
      const cy = clampYear(urlYear);
      if (cy !== year) {
        setYear(cy);
        localStorage.setItem(LS_YEAR_KEY, String(cy));
      }
    } else {
      params.set('year', String(year));
      changed = true;
    }

    if (changed) router.replace(`/admin/stats?${params.toString()}`);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const setYearAndPersist = (nextYear: number) => {
    const y = clampYear(nextYear);
    setYear(y);

    if (typeof window !== 'undefined') localStorage.setItem(LS_YEAR_KEY, String(y));

    const params = new URLSearchParams(searchParams.toString());
    params.set('year', String(y));
    params.set('tab', tab);
    router.replace(`/admin/stats?${params.toString()}`);
  };

  const setTabAndUrl = (next: TabKey) => {
    setTab(next);
    if (typeof window !== 'undefined') localStorage.setItem(LS_TAB_KEY, next);

    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', next);
    params.set('year', String(year));
    router.replace(`/admin/stats?${params.toString()}`);
  };

  /** ---------- load /stats/full ---------- */
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

        // reset expand maps (กันค้างข้ามปีจนงง)
        setOpenTypesRevenue({});
        setOpenTypesStock({});
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

  /** ---------- load /stats/sales-series ---------- */
  const buildSeriesUrl = () => {
    const params = new URLSearchParams();
    params.set('mode', seriesMode);

    if (rangeMode === 'year') {
      params.set('year', String(year));
    } else if (rangeMode === 'yearRange') {
      params.set('mode', 'year');
      params.set('yearStart', String(clampYear(yearStart)));
      params.set('yearEnd', String(clampYear(yearEnd)));
    } else {
      params.set('start', startDate);
      params.set('end', endDate);
    }

    return `${API}/stats/sales-series?${params.toString()}`;
  };

  const loadSeries = async () => {
    setSeriesLoading(true);
    setSeriesErr('');
    try {
      const url = buildSeriesUrl();
      const res = await apiFetch(url);

      if (res.status === 401 || res.status === 403) {
        router.replace('/');
        return;
      }
      if (!res.ok) {
        const t = await res.text().catch(() => '');
        throw new Error(t || `โหลดกราฟไม่สำเร็จ (HTTP ${res.status})`);
      }

      const data: SalesSeriesResponse = await res.json();
      setSeriesData(data);
    } catch (e) {
      setSeriesData(null);
      setSeriesErr(e instanceof Error ? e.message : 'โหลดกราฟไม่สำเร็จ');
    } finally {
      setSeriesLoading(false);
    }
  };

  useEffect(() => {
    if (tab !== 'trend') return;

    if (rangeMode === 'dateRange' && (!startDate || !endDate)) {
      const today = new Date();
      const start = new Date();
      start.setDate(today.getDate() - 6);
      setStartDate(ymd(start));
      setEndDate(ymd(today));
    }

    loadSeries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, year]);

  /** ----- Payment method report ----- */
  const methodRows = useMemo(() => {
    if (!stats) return [];
    const bank = toNum(stats.bankSales);
    const cod = toNum(stats.codSales);
    const auction = toNum(stats.auctionSales);
    const total = bank + cod + auction;
    const safeTotal = total <= 0 ? 1 : total;

    return [
      { key: 'bank' as const, label: 'โอน (Bank / Transfer)', value: bank, percent: (bank / safeTotal) * 100 },
      { key: 'cod' as const, label: 'ปลายทาง (COD)', value: cod, percent: (cod / safeTotal) * 100 },
      { key: 'auction' as const, label: 'ประมูล', value: auction, percent: (auction / safeTotal) * 100 },
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

  /** ----- datasets fallbacks ----- */
  const categoryRevenueByType = stats?.categoryRevenueByType ?? [];
  const categoryRevenue = stats?.categoryRevenue ?? [];
  const stockByType = stats?.stockByType ?? [];
  const stockByCategory = stats?.stockByCategory ?? [];
  const lowStockProducts = stats?.lowStockProducts ?? [];
  const topCustomers = stats?.topCustomers ?? [];

  const hasAnySales =
    !!stats && (toNum(stats.totalSales) > 0 || toNum(stats.orderSales) > 0 || toNum(stats.auctionSales) > 0);

  /** ---------- transform chart data (TYPE-first) ---------- */
  const categoryTypeBarData = useMemo(() => {
    return categoryRevenueByType.map((r) => ({
      name: typeName(r.type),
      revenue: toNum(r.revenue),
      qty: toNum(r.qty),
    }));
  }, [categoryRevenueByType]);

  const stockTypeBarData = useMemo(() => {
    return stockByType.map((r) => ({
      name: typeName(r.type),
      stock: toNum(r.total_stock),
      low: toNum(r.low_stock),
      products: toNum(r.total_products),
    }));
  }, [stockByType]);

  /** ---------- trend chart ---------- */
  const seriesChartData = useMemo(() => {
    const s = seriesData?.series ?? [];
    return s.map((r) => ({
      k: r.k,
      transfer: toNum(r.transfer),
      cod: toNum(r.cod),
      auction: toNum(r.auction),
      total: toNum(r.total),
    }));
  }, [seriesData]);

  /** ---------- build grouped maps (TYPE -> SUBTYPE rows) ---------- */
  const revenueSubsByType = useMemo(() => {
    const m = new Map<string, CategoryRevenueRow[]>();
    for (const r of categoryRevenue) {
      const t = typeName(r.type);
      const arr = m.get(t) ?? [];
      arr.push(r);
      m.set(t, arr);
    }
    for (const [k, arr] of Array.from(m.entries())) {
      arr.sort((a, b) => toNum(b.revenue) - toNum(a.revenue));
      m.set(k, arr);
    }
    return m;
  }, [categoryRevenue]);

  const stockSubsByType = useMemo(() => {
    const m = new Map<string, StockCategoryRow[]>();
    for (const r of stockByCategory) {
      const t = typeName(r.type);
      const arr = m.get(t) ?? [];
      arr.push(r);
      m.set(t, arr);
    }
    for (const [k, arr] of Array.from(m.entries())) {
      arr.sort((a, b) => toNum(b.total_stock) - toNum(a.total_stock));
      m.set(k, arr);
    }
    return m;
  }, [stockByCategory]);

  /** map สินค้าใกล้หมดแยกตาม (Type + Subtype) เพื่อโชว์ใต้หมวดย่อย */
  const lowStockMap = useMemo(() => {
    const m = new Map<string, LowStockRow[]>();
    for (const p of lowStockProducts) {
      const t = typeName(p.type);
      const s = subtypeName(p.subtype);
      const key = `${t}||${s}`;
      const arr = m.get(key) ?? [];
      arr.push(p);
      m.set(key, arr);
    }
    for (const [k, arr] of Array.from(m.entries())) {
      arr.sort((a, b) => toNum(a.stock) - toNum(b.stock));
      m.set(k, arr);
    }
    return m;
  }, [lowStockProducts]);

  const toggleRevenueType = (t: string) => {
    setOpenTypesRevenue((prev) => ({ ...prev, [t]: !prev[t] }));
  };
  const toggleStockType = (t: string) => {
    setOpenTypesStock((prev) => ({ ...prev, [t]: !prev[t] }));
  };

  /** ---------- UI states ---------- */
  if (loading) {
    return (
      <div className="p-6">
        <Surface>
          <div className="flex items-center justify-center gap-3 text-slate-500">
            <FiLoader className="h-4 w-4 animate-spin" />
            <span className="text-sm">กำลังโหลดสถิติร้านค้า...</span>
          </div>
        </Surface>
      </div>
    );
  }

  if (errMsg) {
    return (
      <div className="p-6">
        <Surface className="border-rose-200 bg-rose-50/60">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-xl bg-white/70 p-2 ring-1 ring-rose-100">
              <FiAlertTriangle className="h-5 w-5 text-rose-600" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-rose-700">โหลดสถิติไม่สำเร็จ</div>
              <div className="mt-1 text-sm text-rose-700/90 break-words">{errMsg}</div>

              <button
                onClick={() => window.location.reload()}
                className="mt-4 inline-flex items-center justify-center rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-700"
              >
                <FiRefreshCw className="mr-2" />
                ลองใหม่
              </button>
            </div>
          </div>
        </Surface>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6">
        <Surface>
          <div className="text-center text-slate-500 text-sm">ยังไม่มีข้อมูลสถิติ</div>
        </Surface>
      </div>
    );
  }

  const activeTabMeta = TAB_LIST.find((t) => t.key === tab) || TAB_LIST[0];
  const ActiveIcon = activeTabMeta.Icon;

  return (
    <div className="p-6 text-slate-900 space-y-8">
      {/* ===== Background vibe (green / gray premium) ===== */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-40 -left-40 h-[420px] w-[420px] rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="absolute -bottom-44 -right-44 h-[520px] w-[520px] rounded-full bg-slate-900/10 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-slate-50" />
      </div>

      {/* ===== Header ===== */}
      <header className="space-y-4">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              รายงาน & สถิติร้านค้า
              <span className="ml-3 align-middle inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                Admin Analytics
              </span>
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Dashboard สำหรับเจ้าของร้าน: ยอดขาย, แนวโน้ม, สต็อก, และหมวดทำเงิน (Type → Subtype)
            </p>
          </div>

          {/* ===== Year Switcher ===== */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={year <= MIN_YEAR}
              onClick={() => setYearAndPersist(year - 1)}
              className="group inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FiChevronLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition" />
            </button>

            <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white px-5 py-2 text-center shadow-sm">
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-emerald-400 via-emerald-600 to-emerald-400" />
              <div className="flex items-center gap-2">
                <FiCalendar className="text-emerald-700" />
                <span className="text-lg font-extrabold text-slate-900 tabular-nums">{year}</span>
              </div>
            </div>

            <button
              type="button"
              disabled={year >= MAX_YEAR}
              onClick={() => setYearAndPersist(year + 1)}
              className="group inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FiChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition" />
            </button>
          </div>
        </div>

        {/* ===== Tabs ===== */}
        <Surface className="p-3">
          <div className="flex flex-wrap gap-2">
            {TAB_LIST.map((t) => (
              <TabButton key={t.key} active={tab === t.key} onClick={() => setTabAndUrl(t.key)} Icon={t.Icon}>
                {t.label}
              </TabButton>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
            <span className="inline-flex items-center gap-2 font-semibold text-slate-900">
              <span className="rounded-lg bg-emerald-50 p-1.5 ring-1 ring-emerald-100">
                <ActiveIcon className="h-4 w-4 text-emerald-700" />
              </span>
              {activeTabMeta.label}
            </span>
            <span className="text-slate-400">—</span>
            <span>{activeTabMeta.desc}</span>
          </div>
        </Surface>
      </header>

      {/* ===================== TAB CONTENTS ===================== */}
      {tab === 'overview' && (
        <>
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="รายได้รวมทั้งหมด"
              subtitle="ปกติ + ประมูล"
              value={`${fmtBaht(stats.totalSales)} บาท`}
              accent="from-emerald-500/70 via-emerald-600/70 to-emerald-500/70"
              icon={<FiBarChart2 className="h-4 w-4" />}
            />
            <StatCard
              title="รายได้จากการขายปกติ"
              subtitle="ออเดอร์ที่นับเป็นรายได้จริง"
              value={`${fmtBaht(stats.orderSales)} บาท`}
              accent="from-slate-700/60 via-slate-900/60 to-slate-700/60"
              icon={<FiBarChart2 className="h-4 w-4" />}
            />
            <StatCard
              title="รายได้จากการประมูล"
              subtitle="สรุปยอดขายฝั่งประมูล"
              value={`${fmtBaht(stats.auctionSales)} บาท`}
              accent="from-emerald-400/60 via-emerald-600/60 to-slate-900/50"
              icon={<FiTrendingUp className="h-4 w-4" />}
            />
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MiniCard label="ยอดขายแบบโอน (Bank)" value={`${fmtBaht(stats.bankSales)} บาท`} tag="Transfer" />
            <MiniCard label="ยอดขายแบบเก็บปลายทาง (COD)" value={`${fmtBaht(stats.codSales)} บาท`} tag="COD" />
            <MiniCard label="ยกเลิก / ล้มเหลว" value={`${fmtInt(stats.cancelledOrders)} / ${fmtInt(stats.failedOrders)}`} tag="Quality" />
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <MiniCard label="ออเดอร์ทั้งหมด (ขายปกติ)" value={`${fmtInt(stats.totalOrders)} รายการ`} tag="Orders" />
            <MiniCard label="ออเดอร์วันนี้ (รายได้)" value={`${fmtBaht(stats.orderToday)} บาท`} tag="Today" />
            <MiniCard label="ออเดอร์เดือนนี้ (รายได้)" value={`${fmtBaht(stats.orderMonth)} บาท`} tag="Month" />
            <MiniCard label="ยอดขายรวม (ย้ำอีกที)" value={`${fmtBaht(stats.totalSales)} บาท`} tag="Total" />
          </section>
        </>
      )}

      {tab === 'payments' && (
        <>
          <section className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">
            <CardShell className="lg:col-span-2">
              <CardTitle
                icon={<FiPieChart className="h-4 w-4 text-emerald-700" />}
                title="สัดส่วนรายได้ตามประเภท"
                subtitle="โอน / COD / ประมูล"
              />
              <div className="flex-1 min-h-[240px]">
                {!hasAnySales ? (
                  <EmptyState text="ยังไม่มีข้อมูลรายได้" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="80%" paddingAngle={4}>
                        {pieData.map((entry, index) => (
                          <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => `${fmtBaht(value)} บาท`}
                        contentStyle={{
                          borderRadius: 14,
                          borderColor: '#e2e8f0',
                          boxShadow: '0 18px 40px rgba(15, 23, 42, 0.14)',
                        }}
                      />
                      <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardShell>

            <CardShell className="lg:col-span-3">
              <CardTitle
                icon={<FiBarChart2 className="h-4 w-4 text-emerald-700" />}
                title="ตารางสรุปรายได้ตามช่องทาง"
                subtitle="ยอดขาย + สัดส่วน"
              />
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
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx] }} />
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

          <CardShell>
            <CardTitle
              icon={<FiBarChart2 className="h-4 w-4 text-emerald-700" />}
              title="เปรียบเทียบยอดขาย (โอน / COD / ประมูล)"
              subtitle="กราฟแท่งภาพรวม"
            />
            <div className="h-72 min-h-[288px]">
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
                        borderRadius: 14,
                        borderColor: '#e2e8f0',
                        boxShadow: '0 18px 40px rgba(15, 23, 42, 0.14)',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="bank" name="โอน (Bank)" radius={[10, 10, 0, 0]} fill={COLOR_BANK} />
                    <Bar dataKey="cod" name="ปลายทาง (COD)" radius={[10, 10, 0, 0]} fill={COLOR_COD} />
                    <Bar dataKey="auction" name="ประมูล" radius={[10, 10, 0, 0]} fill={COLOR_AUCTION} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardShell>
        </>
      )}

      {tab === 'trend' && (
        <CardShell>
          <CardTitle
            icon={<FiTrendingUp className="h-4 w-4 text-emerald-700" />}
            title="แนวโน้มยอดขาย"
            subtitle="รายวัน / รายเดือน / รายปี + เลือกช่วงเองได้"
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Panel title="ความละเอียด">
              <div className="flex gap-2">
                {(['day', 'month', 'year'] as SeriesMode[]).map((m) => (
                  <PillButton
                    key={m}
                    active={seriesMode === m}
                    onClick={() => setSeriesMode(m)}
                    label={m === 'day' ? 'รายวัน' : m === 'month' ? 'รายเดือน' : 'รายปี'}
                  />
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-500">ถ้าเลือก “ช่วงปีหลายปี” ระบบจะสรุปเป็นรายปีให้อัตโนมัติ</p>
            </Panel>

            <Panel title="ช่วงข้อมูล">
              <div className="flex gap-2 flex-wrap">
                {(['year', 'dateRange', 'yearRange'] as RangeMode[]).map((r) => (
                  <PillButton
                    key={r}
                    active={rangeMode === r}
                    onClick={() => setRangeMode(r)}
                    label={r === 'year' ? 'ทั้งปีที่เลือก' : r === 'dateRange' ? 'เลือกช่วงวันที่' : 'เลือกช่วงปี'}
                  />
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-500">ใช้ปีบนหัวหน้าเป็นค่าเริ่มต้นสำหรับ “ทั้งปีที่เลือก”</p>
            </Panel>

            <Panel title="ตั้งค่าเพิ่มเติม">
              {rangeMode === 'year' && (
                <div className="text-sm text-slate-700">
                  ดูข้อมูลทั้งปี: <b className="text-slate-900">{year}</b>
                </div>
              )}

              {rangeMode === 'yearRange' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">ปีเริ่ม</div>
                    <input
                      value={yearStart}
                      onChange={(e) => setYearStart(Number(e.target.value))}
                      type="number"
                      min={MIN_YEAR}
                      max={MAX_YEAR}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">ปีจบ</div>
                    <input
                      value={yearEnd}
                      onChange={(e) => setYearEnd(Number(e.target.value))}
                      type="number"
                      min={MIN_YEAR}
                      max={MAX_YEAR}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                  </div>
                  <p className="col-span-2 text-xs text-slate-500">ระบบจะสรุปเป็น “รายปี” ให้อัตโนมัติ</p>
                </div>
              )}

              {rangeMode === 'dateRange' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">เริ่ม</div>
                    <input
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      type="date"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">ถึง</div>
                    <input
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      type="date"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                  </div>
                  <p className="col-span-2 text-xs text-slate-500">ช่วงวันที่ใช้แบบ inclusive (เริ่ม..ถึง)</p>
                </div>
              )}

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={loadSeries}
                  className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
                >
                  โหลดกราฟ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSeriesMode('day');
                    setRangeMode('year');
                    setYearStart(clampYear(CURRENT_YEAR - 1));
                    setYearEnd(clampYear(CURRENT_YEAR));
                    const today = new Date();
                    const start = new Date();
                    start.setDate(today.getDate() - 6);
                    setStartDate(ymd(start));
                    setEndDate(ymd(today));
                  }}
                  className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-800 border border-slate-200 hover:bg-slate-50"
                >
                  รีเซ็ต
                </button>
              </div>
            </Panel>
          </div>

          <div className="mt-5">
            {seriesLoading ? (
              <Surface className="p-6">
                <div className="flex items-center justify-center gap-3 text-slate-500">
                  <FiLoader className="h-4 w-4 animate-spin" />
                  <span className="text-sm">กำลังโหลดกราฟ...</span>
                </div>
              </Surface>
            ) : seriesErr ? (
              <Surface className="border-rose-200 bg-rose-50/60 p-6">
                <div className="font-semibold text-rose-700">โหลดกราฟไม่สำเร็จ</div>
                <div className="mt-2 text-sm text-rose-700/90 break-words">{seriesErr}</div>
              </Surface>
            ) : seriesChartData.length === 0 ? (
              <Surface className="p-6">
                <div className="text-center text-slate-400 text-sm">ยังไม่มีข้อมูลในช่วงนี้</div>
              </Surface>
            ) : (
              <div className="h-[340px] rounded-2xl border border-slate-200 bg-white/80 shadow-sm p-3">
                <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-2xl bg-gradient-to-r from-emerald-400 via-emerald-600 to-emerald-400" />
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={seriesChartData} margin={{ left: 8, right: 12, top: 6, bottom: 6 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="k" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(v: number) => toNum(v).toLocaleString('th-TH', { maximumFractionDigits: 0 })} />
                    <Tooltip formatter={(value) => `${fmtBaht(value)} บาท`} />
                    <Legend />
                    <Line type="monotone" dataKey="total" name="รวม" stroke={COLOR_TOTAL} strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="transfer" name="โอน" stroke={COLOR_BANK} dot={false} />
                    <Line type="monotone" dataKey="cod" name="COD" stroke={COLOR_COD} dot={false} />
                    <Line type="monotone" dataKey="auction" name="ประมูล" stroke={COLOR_AUCTION} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
              <MiniCard label="ช่วงข้อมูล" value={`${seriesData?.start ?? '-'} → ${seriesData?.end ?? '-'}`} tag="Range" />
              <MiniCard label="โหมด" value={seriesMode === 'day' ? 'รายวัน' : seriesMode === 'month' ? 'รายเดือน' : 'รายปี'} tag="Mode" />
              <MiniCard
                label="รวมในช่วงนี้ (ประมาณ)"
                value={`${fmtBaht(seriesChartData.reduce((s, r) => s + toNum(r.total), 0))} บาท`}
                tag="Sum"
              />
              <MiniCard
                label="จุดสูงสุด (Total)"
                value={`${fmtBaht(Math.max(0, ...seriesChartData.map((r) => toNum(r.total))))} บาท`}
                tag="Peak"
              />
            </div>
          </div>
        </CardShell>
      )}

      {/* ===== INSIGHTS: Type-first + expand Subtypes ===== */}
      {tab === 'insights' && (
        <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <CardShell className="lg:col-span-2">
            <CardTitle
              icon={<FiTag className="h-4 w-4 text-emerald-700" />}
              title="หมวดทำเงิน (Type → Subtype)"
              subtitle="หมวดหลักก่อน แล้วค่อยกดดูหมวดย่อย"
            />

            {categoryRevenueByType.length === 0 ? (
              <EmptyState text="ยังไม่มีข้อมูลหมวดทำเงิน" />
            ) : (
              <div className="space-y-2">
                {categoryRevenueByType.slice(0, 20).map((tRow, idx) => {
                  const t = typeName(tRow.type);
                  const opened = !!openTypesRevenue[t];
                  const subs = revenueSubsByType.get(t) ?? [];
                  return (
                    <AccordionCard
                      key={`${t}-${idx}`}
                      title={t}
                      subtitle={`ยอดขาย: ${fmtBaht(tRow.revenue)} บาท · จำนวนขาย: ${fmtInt(tRow.qty)}`}
                      opened={opened}
                      onToggle={() => toggleRevenueType(t)}
                    >
                      {subs.length === 0 ? (
                        <div className="text-sm text-slate-400 py-2">ไม่มีข้อมูลหมวดย่อย</div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="text-slate-600 bg-slate-50">
                                <th className="text-left px-2 py-2">หมวดย่อย</th>
                                <th className="text-right px-2 py-2">จำนวนขาย</th>
                                <th className="text-right px-2 py-2">ยอดขาย</th>
                              </tr>
                            </thead>
                            <tbody>
                              {subs.slice(0, 12).map((sRow, sIdx) => (
                                <tr key={`${t}-${sIdx}`} className={sIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                                  <td className="px-2 py-2">{subtypeName(sRow.subtype)}</td>
                                  <td className="px-2 py-2 text-right">{fmtInt(sRow.qty)}</td>
                                  <td className="px-2 py-2 text-right">{fmtBaht(sRow.revenue)} บาท</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          {subs.length > 12 && <div className="text-xs text-slate-400 mt-2">แสดงแค่ 12 หมวดย่อยแรก (เรียงตามยอดขาย)</div>}
                        </div>
                      )}
                    </AccordionCard>
                  );
                })}
              </div>
            )}
          </CardShell>

          <CardShell className="lg:col-span-3">
            <CardTitle
              icon={<FiBarChart2 className="h-4 w-4 text-emerald-700" />}
              title="กราฟหมวดทำเงิน (หมวดหลัก)"
              subtitle="แนวนอน อ่านง่าย (Type-first)"
            />

            <div className="h-[520px] min-h-[520px]">
              {categoryTypeBarData.length === 0 ? (
                <EmptyState text="ยังไม่มีข้อมูล categoryRevenueByType" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={categoryTypeBarData}
                    layout="vertical"
                    margin={{ top: 8, right: 16, left: 16, bottom: 8 }}
                    barCategoryGap={10}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tickFormatter={(v: number) => toNum(v).toLocaleString('th-TH', { maximumFractionDigits: 0 })} />
                    <YAxis type="category" dataKey="name" width={240} tick={{ fontSize: 12 }} />
                    <Tooltip content={<TypeRevenueTooltip />} />
                    <Legend />
                    <Bar dataKey="revenue" name="ยอดขาย" radius={[10, 10, 10, 10]} fill={COLOR_SALES} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardShell>

          <CardShell className="lg:col-span-5">
            <CardTitle
              icon={<FiUsers className="h-4 w-4 text-emerald-700" />}
              title="ลูกค้าประจำ (Top Customers)"
              subtitle="ซื้อบ่อย / ยอดรวมสูง"
            />
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

      {/* ===== STOCK: Type-first + expand Subtypes + show product names for low stock ===== */}
      {tab === 'stock' && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CardShell>
            <CardTitle
              icon={<FiBox className="h-4 w-4 text-emerald-700" />}
              title="สต็อกคงเหลือตามหมวด (หมวดหลักก่อน)"
              subtitle={`กราฟแนวนอน: สต็อกรวม + ใกล้หมด (≤ ${LOW_STOCK_THRESHOLD})`}
            />

            <div className="h-[520px] min-h-[520px]">
              {stockTypeBarData.length === 0 ? (
                <EmptyState text="ยังไม่มีข้อมูล stockByType" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stockTypeBarData}
                    layout="vertical"
                    margin={{ top: 8, right: 16, left: 16, bottom: 8 }}
                    barCategoryGap={10}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tickFormatter={(v: number) => toNum(v).toLocaleString('th-TH', { maximumFractionDigits: 0 })} />
                    <YAxis type="category" dataKey="name" width={220} tick={{ fontSize: 12 }} />
                    <Tooltip content={<StockTooltip />} />
                    <Legend />
                    <Bar dataKey="stock" name="สต็อกรวม" radius={[10, 10, 10, 10]} fill={COLOR_STOCK} />
                    <Bar dataKey="low" name={`ใกล้หมด (≤ ${LOW_STOCK_THRESHOLD})`} radius={[10, 10, 10, 10]} fill={COLOR_LOW} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <p className="mt-3 text-xs text-slate-500">
              เกณฑ์: ใกล้หมด = stock ≤ {LOW_STOCK_THRESHOLD} · หมดแล้ว = stock = 0 (ตัวแดง)
            </p>
          </CardShell>

          <CardShell>
            <CardTitle
              icon={<FiTag className="h-4 w-4 text-emerald-700" />}
              title="เจาะหมวดย่อย (Type → Subtype)"
              subtitle="กดหมวดหลักเพื่อดูหมวดย่อย + รายชื่อสินค้าใกล้หมด"
            />

            {stockByType.length === 0 ? (
              <EmptyState text="ยังไม่มีข้อมูลสต๊อก" />
            ) : (
              <div className="space-y-2">
                {stockByType.slice(0, 30).map((tRow, idx) => {
                  const t = typeName(tRow.type);
                  const opened = !!openTypesStock[t];
                  const subs = stockSubsByType.get(t) ?? [];

                  return (
                    <AccordionCard
                      key={`${t}-${idx}`}
                      title={t}
                      subtitle={`สต๊อกรวม: ${fmtInt(tRow.total_stock)} · ใกล้หมด: ${fmtInt(tRow.low_stock)} · สินค้า: ${fmtInt(tRow.total_products)}`}
                      opened={opened}
                      onToggle={() => toggleStockType(t)}
                      tone="stock"
                      rightMeta={
                        <div className="flex items-center gap-2">
                          <span
                            className={[
                              'rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1',
                              toNum(tRow.total_stock) === 0
                                ? 'bg-red-50 text-red-700 ring-red-100'
                                : toNum(tRow.total_stock) <= LOW_STOCK_THRESHOLD
                                ? 'bg-amber-50 text-amber-800 ring-amber-100'
                                : 'bg-emerald-50 text-emerald-700 ring-emerald-100',
                            ].join(' ')}
                          >
                            {toNum(tRow.total_stock) === 0 ? 'หมดแล้ว' : toNum(tRow.total_stock) <= LOW_STOCK_THRESHOLD ? 'ใกล้หมด' : 'ปกติ'}
                          </span>
                        </div>
                      }
                    >
                      {subs.length === 0 ? (
                        <div className="text-sm text-slate-400 py-2">ไม่มีข้อมูลหมวดย่อย</div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="text-slate-600 bg-slate-50">
                                <th className="text-left px-2 py-2">หมวดย่อย</th>
                                <th className="text-right px-2 py-2">สินค้า</th>
                                <th className="text-right px-2 py-2">สต๊อก</th>
                                <th className="text-right px-2 py-2">ใกล้หมด</th>
                              </tr>
                            </thead>
                            <tbody>
                              {subs.slice(0, 12).map((sRow, sIdx) => {
                                const sub = subtypeName(sRow.subtype);
                                const key = `${t}||${sub}`;
                                const lowItems = lowStockMap.get(key) ?? [];

                                const stockN = toNum(sRow.total_stock);
                                const lowN = toNum(sRow.low_stock);

                                return (
                                  <React.Fragment key={`${t}-${sub}-${sIdx}`}>
                                    <tr className={sIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                                      <td className="px-2 py-2">{sub}</td>
                                      <td className="px-2 py-2 text-right">{fmtInt(sRow.total_products)}</td>
                                      <td
                                        className={[
                                          'px-2 py-2 text-right font-semibold',
                                          stockN === 0 ? 'text-red-600' : stockN <= LOW_STOCK_THRESHOLD ? 'text-amber-700' : 'text-slate-900',
                                        ].join(' ')}
                                      >
                                        {fmtInt(stockN)}
                                      </td>
                                      <td className={['px-2 py-2 text-right font-semibold', lowN > 0 ? 'text-rose-600' : 'text-slate-900'].join(' ')}>
                                        {fmtInt(lowN)}
                                      </td>
                                    </tr>

                                    {lowItems.length > 0 && (
                                      <tr className={sIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                                        <td colSpan={4} className="px-3 py-2">
                                          <div className="rounded-2xl border border-rose-200 bg-rose-50/60 px-3 py-3">
                                            <div className="flex items-center gap-2 text-[11px] font-semibold text-rose-700 mb-2">
                                              <FiAlertTriangle className="h-3.5 w-3.5" />
                                              สินค้าใกล้หมด (≤ {LOW_STOCK_THRESHOLD}) / หมดแล้ว (0)
                                            </div>

                                            <div className="space-y-1.5">
                                              {lowItems.map((item) => (
                                                <div key={item.product_id} className="flex items-center justify-between gap-3">
                                                  <div className="min-w-0">
                                                    <div className="text-sm font-medium text-slate-900 truncate">{item.name}</div>
                                                    <div className="text-[11px] text-slate-500">ID: {item.product_id}</div>
                                                  </div>

                                                  <span
                                                    className={[
                                                      'shrink-0 rounded-full px-3 py-1 text-xs font-semibold ring-1',
                                                      toNum(item.stock) === 0
                                                        ? 'bg-red-50 text-red-700 ring-red-100'
                                                        : 'bg-amber-50 text-amber-800 ring-amber-100',
                                                    ].join(' ')}
                                                  >
                                                    {toNum(item.stock) === 0 ? 'หมดแล้ว (0)' : `เหลือ ${fmtInt(item.stock)}`}
                                                  </span>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                );
                              })}
                            </tbody>
                          </table>

                          {subs.length > 12 && <div className="text-xs text-slate-400 mt-2">แสดงแค่ 12 หมวดย่อยแรก (เรียงตามสต๊อก)</div>}
                        </div>
                      )}
                    </AccordionCard>
                  );
                })}
              </div>
            )}

            <div className="mt-6">
              <CardTitle
                icon={<FiAlertTriangle className="h-4 w-4 text-rose-600" />}
                title="สินค้าใกล้หมด (Low Stock)"
                subtitle={`รวมทุกหมวด: ใกล้หมด (≤ ${LOW_STOCK_THRESHOLD}) + หมดแล้ว (0 แดง)`}
              />
              <DataTable
                columns={[
                  { key: 'name', header: 'สินค้า', align: 'left' },
                  { key: 'category', header: 'หมวด', align: 'left' },
                  { key: 'stock', header: 'คงเหลือ', align: 'right' },
                ]}
                rows={lowStockProducts.slice(0, 30).map((p) => ({
                  id: p.product_id,
                  name: p.name,
                  category: pathLabel(p.type ?? null, p.subtype ?? null),
                  stock: (
                    <span className={['font-semibold', toNum(p.stock) === 0 ? 'text-red-600' : 'text-amber-700'].join(' ')}>
                      {fmtInt(p.stock)}
                    </span>
                  ),
                }))}
                emptyText="ไม่มีสินค้าใกล้หมด / ยังไม่มีข้อมูล"
              />
            </div>
          </CardShell>
        </section>
      )}
    </div>
  );
}

/* ------------------------ UI blocks ------------------------ */

function Surface(props: { className?: string; children: React.ReactNode }) {
  return (
    <section
      className={[
        'relative overflow-hidden rounded-2xl border border-slate-200 bg-white/80 backdrop-blur shadow-sm p-5',
        props.className || '',
      ].join(' ')}
    >
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-emerald-400 via-emerald-600 to-emerald-400" />
      {props.children}
    </section>
  );
}

function CardShell(props: { className?: string; children: React.ReactNode }) {
  return (
    <section
      className={[
        'relative overflow-hidden bg-white/80 backdrop-blur rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col',
        props.className || '',
      ].join(' ')}
    >
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-emerald-400 via-emerald-600 to-emerald-400" />
      {props.children}
    </section>
  );
}

function CardTitle(props: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="font-semibold flex items-center gap-2">
        <span className="rounded-lg bg-emerald-50 p-1.5 ring-1 ring-emerald-100">{props.icon}</span>
        <span>{props.title}</span>
      </h2>
      {props.subtitle ? <p className="text-xs text-slate-500 mt-1">{props.subtitle}</p> : null}
    </div>
  );
}

function EmptyState(props: { text: string }) {
  return <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">{props.text}</div>;
}

function StatCard(props: { title: string; subtitle: string; value: string; accent: string; icon: React.ReactNode }) {
  const { title, subtitle, value, accent, icon } = props;
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white/85 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${accent}`} />
      <div className="p-5 space-y-1">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{title}</div>
          <div className="rounded-xl bg-slate-50 p-2 ring-1 ring-slate-200 text-slate-700">{icon}</div>
        </div>
        <div className="text-2xl font-extrabold text-slate-900 tabular-nums">{value}</div>
        <div className="text-xs text-slate-400">{subtitle}</div>
      </div>
    </div>
  );
}

function MiniCard(props: { label: string; value: string; tag: string }) {
  const { label, value, tag } = props;
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white/85 shadow-sm p-4 flex flex-col justify-between transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-emerald-300 via-emerald-500 to-emerald-300 opacity-70" />
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="text-xl font-semibold text-slate-900 mb-2 break-words tabular-nums">{value}</div>
      <span className="inline-flex w-fit rounded-full bg-slate-50 px-3 py-0.5 text-[11px] text-slate-500 ring-1 ring-slate-200">
        {tag}
      </span>
    </div>
  );
}

function TabButton(props: {
  active: boolean;
  onClick: () => void;
  Icon: React.ComponentType<any>;
  children: React.ReactNode;
}) {
  const { active, onClick, Icon, children } = props;
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'group relative inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition',
        active
          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50',
      ].join(' ')}
    >
      <Icon className={['h-4 w-4 transition', active ? 'text-emerald-300' : 'text-emerald-600 group-hover:text-emerald-700'].join(' ')} />
      <span>{children}</span>
      {active && <span className="absolute inset-x-2 -bottom-1 h-1 rounded-full bg-emerald-400/70 blur-[1px]" />}
    </button>
  );
}

function Panel(props: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm">
      <div className="text-xs font-semibold text-slate-500 mb-2">{props.title}</div>
      {props.children}
    </div>
  );
}

function PillButton(props: { active: boolean; onClick: () => void; label: string }) {
  const { active, onClick, label } = props;
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'px-3 py-2 rounded-xl border text-sm font-semibold transition',
        active
          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50',
      ].join(' ')}
    >
      {label}
    </button>
  );
}

function AccordionCard(props: {
  title: string;
  subtitle: string;
  opened: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  tone?: 'default' | 'stock';
  rightMeta?: React.ReactNode;
}) {
  const { title, subtitle, opened, onToggle, children, rightMeta } = props;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/85 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition"
      >
        <div className="min-w-0">
          <div className="font-semibold text-slate-900 truncate">{title}</div>
          <div className="text-xs text-slate-500 mt-0.5">{subtitle}</div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          {rightMeta}
          <span className="text-sm text-slate-500">{opened ? 'ซ่อน' : 'ดูย่อย'}</span>
          <span className={['text-slate-400 transition', opened ? 'rotate-180' : 'rotate-0'].join(' ')}>▾</span>
        </div>
      </button>

      {opened && <div className="px-4 pb-4">{children}</div>}
    </div>
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
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white/85 shadow-sm">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-slate-50 text-slate-600">
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
              <td colSpan={columns.length} className="px-3 py-6 text-center text-slate-400">
                {emptyText}
              </td>
            </tr>
          ) : (
            rows.map((row, idx) => (
              <tr key={row.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={[
                      'px-3 py-2 align-top',
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

/** ---------- Tooltip cards ---------- */
function TooltipCard(props: { title: string; lines: { label: string; value: string; color: string }[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl">
      <div className="font-semibold text-slate-900">{props.title}</div>
      <div className="mt-2 space-y-1 text-sm">
        {props.lines.map((l, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: l.color }} />
            <span className="text-slate-600">{l.label}:</span>
            <span className="font-semibold" style={{ color: l.color }}>
              {l.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TypeRevenueTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload;
  const title = String(p?.name ?? '-');
  const revenue = fmtBaht(p?.revenue ?? 0);
  const qty = fmtInt(p?.qty ?? 0);

  return (
    <TooltipCard
      title={title}
      lines={[
        { label: 'ยอดขาย', value: `${revenue} บาท`, color: COLOR_SALES },
        { label: 'จำนวนขาย', value: qty, color: COLOR_SALES },
      ]}
    />
  );
}

function StockTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload;
  const title = String(p?.name ?? '-');
  const stock = fmtInt(p?.stock ?? 0);
  const low = fmtInt(p?.low ?? 0);

  return (
    <TooltipCard
      title={title}
      lines={[
        { label: 'สต็อกรวม', value: stock, color: COLOR_STOCK },
        { label: `ใกล้หมด (≤ ${LOW_STOCK_THRESHOLD})`, value: low, color: COLOR_LOW },
      ]}
    />
  );
}