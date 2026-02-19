"use client";

import { apiFetch } from "@/app/lib/apiFetch";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import StatusBadge from "@/app/component/StatusBadge";
import { getMeta, ORDER_STATUS } from "@/app/lib/status";

interface Order {
  Oid: number;
  Oprice: number;
  Ostatus: string;
  Odate: string;
  Cname: string;
  Opayment: string;
}

const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";
const STORAGE_KEY = "admin_orders_year";

function fmtBaht(n: number | string) {
  return Number(n || 0).toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** MySQL DATETIME string -> แสดงเป็นวันที่ไทย (กัน timezone เพี้ยน) */
function formatThaiDateOnlyFromMysql(dateStr: string) {
  if (!dateStr) return "-";
  const d = new Date(dateStr.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return String(dateStr);

  // ถ้า backend ส่งเป็น UTC แต่จริงๆเป็นเวลาไทยค่อยชดเชย +7
  d.setHours(d.getHours() + 7);

  return d.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function normalizePay(p: string) {
  return (p || "").toLowerCase();
}

function isTransferPay(p: string) {
  const pay = normalizePay(p);
  return ["transfer", "bank", "bank_transfer", "bank-transfer"].includes(pay);
}

type PayFilter = "all" | "transfer" | "cod";
type StatusFilter =
  | "all"
  | "pending_payment"
  | "payment_review"
  | "paid"
  | "shipping"
  | "delivered"
  | "cancelled";

function pillBase(active: boolean) {
  return [
    "px-4 py-2 rounded-xl font-semibold border transition",
    "shadow-sm hover:shadow-md",
    active
      ? "bg-slate-900 text-white border-slate-900"
      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
  ].join(" ");
}

function statusPill(active: boolean) {
  return [
    "px-4 py-2 rounded-xl font-semibold border transition inline-flex items-center gap-2",
    "shadow-sm hover:shadow-md",
    active
      ? "bg-gradient-to-r from-emerald-600 to-green-600 text-white border-transparent"
      : "bg-white text-slate-700 border-slate-200 hover:bg-emerald-50/60",
  ].join(" ");
}

/** UI helpers */
function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
      {children}
    </div>
  );
}

function SoftTopbar({
  title,
  desc,
  right,
}: {
  title: string;
  desc?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/70 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm">
        Orders Management
      </div>

      <div className="mt-4 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
            {title}
          </h1>
          {desc ? <p className="mt-2 text-sm text-slate-500">{desc}</p> : null}
        </div>

        {right ? <div className="flex items-center gap-3">{right}</div> : null}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const nowYear = new Date().getFullYear();
  const MIN_YEAR = 2020;
  const MAX_YEAR = nowYear + 1;

  // ✅ เริ่มเป็น null ก่อน เพื่อกัน “ปีปัจจุบันทับ URL”
  const [year, setYear] = useState<number | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filterStatus, setFilterStatus] =
    useState<StatusFilter>("pending_payment");
  const [filterPay, setFilterPay] = useState<PayFilter>("all");
  const [loading, setLoading] = useState(true);

  const didInitRef = useRef(false);

  // ✅ 1) init year: URL > localStorage > nowYear
  useEffect(() => {
    const fromUrl = Number(searchParams.get("year"));
    if (
      Number.isFinite(fromUrl) &&
      fromUrl >= MIN_YEAR &&
      fromUrl <= MAX_YEAR
    ) {
      setYear(fromUrl);
      didInitRef.current = true;
      return;
    }

    const saved = Number(localStorage.getItem(STORAGE_KEY));
    if (Number.isFinite(saved) && saved >= MIN_YEAR && saved <= MAX_YEAR) {
      setYear(saved);
      didInitRef.current = true;
      return;
    }

    setYear(nowYear);
    didInitRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ 2) sync year -> localStorage + URL (หลัง init เท่านั้น)
  useEffect(() => {
    if (!didInitRef.current) return;
    if (year === null) return;

    localStorage.setItem(STORAGE_KEY, String(year));

    const current = searchParams.get("year");
    if (current !== String(year)) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("year", String(year));
      router.replace(`?${params.toString()}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  // ✅ 3) load data
  useEffect(() => {
    if (year === null) return;

    const load = async () => {
      try {
        setLoading(true);

        const res = await apiFetch(`${API}/orders/all?year=${year}`);

        if (res.status === 401 || res.status === 403) {
          window.location.href = "/";
          return;
        }

        if (!res.ok) {
          setOrders([]);
          return;
        }

        const data: unknown = await res.json();
        setOrders(Array.isArray(data) ? (data as Order[]) : []);
      } catch (err) {
        console.error("load orders fail:", err);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [year]);

  const makeCode = (prefix: string, id: number) =>
    `${prefix}:${String(id).padStart(4, "0")}`;

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const st = String(o.Ostatus || "").trim();
      const matchStatus = filterStatus === "all" ? true : st === filterStatus;

      const pay = normalizePay(o.Opayment);
      const matchPay =
        filterPay === "all"
          ? true
          : filterPay === "transfer"
          ? isTransferPay(pay)
          : pay === "cod";

      return matchStatus && matchPay;
    });
  }, [orders, filterStatus, filterPay]);

  // ✅ นับจำนวน “ตามช่องทางจ่าย” ที่เลือก + กัน COD ไปโผล่ใน “รอชำระเงิน” (all/transfer)
  const statusCounts = useMemo(() => {
    const base: Record<StatusFilter, number> = {
      all: 0,
      pending_payment: 0,
      payment_review: 0,
      paid: 0,
      shipping: 0,
      delivered: 0,
      cancelled: 0,
    };

    for (const o of orders) {
      const pay = normalizePay(o.Opayment);

      const matchPay =
        filterPay === "all"
          ? true
          : filterPay === "transfer"
          ? isTransferPay(pay)
          : pay === "cod";

      if (!matchPay) continue;

      base.all += 1;

      const st = String(o.Ostatus || "").trim();

      // ✅ COD + (pending_payment|waiting) => ไม่ควรไปนับเป็น “รอชำระเงิน” ถ้าไม่ได้ดูโหมด COD
      if (
        (st === "pending_payment" || st === "waiting") &&
        pay === "cod" &&
        filterPay !== "cod"
      ) {
        continue;
      }

      const s = st as StatusFilter;
      if (s in base) base[s] += 1;
    }

    return base;
  }, [orders, filterPay]);

  const statusButtons: Array<{ v: StatusFilter; label: string; count: number }> =
    [
      {
        v: "pending_payment",
        label: filterPay === "cod" ? "รอจัดส่ง" : "รอชำระเงิน",
        count: statusCounts.pending_payment,
      },
      {
        v: "payment_review",
        label: "รอตรวจสอบสลิป",
        count: statusCounts.payment_review,
      },
      { v: "paid", label: "ชำระแล้ว", count: statusCounts.paid },
      { v: "shipping", label: "กำลังจัดส่ง", count: statusCounts.shipping },
      { v: "delivered", label: "ส่งสำเร็จ", count: statusCounts.delivered },
      { v: "cancelled", label: "ยกเลิก", count: statusCounts.cancelled },
      { v: "all", label: "ทั้งหมด", count: statusCounts.all },
    ];

  const payButtons: Array<{ v: PayFilter; label: string }> = [
    { v: "all", label: "ทุกช่องทาง" },
    { v: "transfer", label: "โอน" },
    { v: "cod", label: "เก็บเงินปลายทาง" },
  ];

  // ✅ กันหน้ากระพริบ/URL เด้งตอน year ยัง null
  if (year === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/35 to-slate-50 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur rounded-2xl border border-slate-200 shadow-lg px-6 py-5 text-slate-600 font-semibold">
          กำลังเตรียมข้อมูล
        </div>
      </div>
    );
  }

  const yearPicker = (
    <>
      <button
        type="button"
        disabled={year <= MIN_YEAR || loading}
        onClick={() => setYear((y) => Math.max(MIN_YEAR, (y ?? nowYear) - 1))}
        className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition"
        aria-label="ปีก่อนหน้า"
      >
        Previous
      </button>

      <div className="px-6 py-2 rounded-xl bg-white border border-slate-200 text-lg font-extrabold text-slate-900 min-w-[92px] text-center shadow-sm">
        {year}
      </div>

      <button
        type="button"
        disabled={year >= MAX_YEAR || loading}
        onClick={() => setYear((y) => Math.min(MAX_YEAR, (y ?? nowYear) + 1))}
        className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition"
        aria-label="ปีถัดไป"
      >
        Next
      </button>
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/35 to-slate-50">
      <div className="p-6 pt-8 max-w-7xl mx-auto">
        <SoftTopbar
          title="ออเดอร์ทั้งหมด"
          desc="เลือกปี และกรองสถานะ/ช่องทางชำระเงิน"
          right={yearPicker}
        />

        {/* Filters */}
        <CardShell>
          <div className="p-5 md:p-6 space-y-5">
            <div>
              <div className="text-xs font-semibold text-slate-500 mb-2">
                สถานะ
              </div>
              <div className="flex flex-wrap gap-2">
                {statusButtons.map((x) => {
                  const isActive = filterStatus === x.v;
                  return (
                    <button
                      key={x.v}
                      type="button"
                      onClick={() => setFilterStatus(x.v)}
                      className={statusPill(isActive)}
                    >
                      <span>{x.label}</span>
                      <span
                        className={[
                          "min-w-[28px] h-6 px-2 rounded-full text-xs font-bold flex items-center justify-center",
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-slate-100 text-slate-700 border border-slate-200",
                        ].join(" ")}
                        aria-label={`count-${x.v}`}
                      >
                        {x.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="h-px bg-slate-200/70" />

            <div>
              <div className="text-xs font-semibold text-slate-500 mb-2">
                ช่องทางชำระเงิน
              </div>
              <div className="flex flex-wrap gap-2">
                {payButtons.map((x) => {
                  const isActive = filterPay === x.v;
                  return (
                    <button
                      key={x.v}
                      type="button"
                      onClick={() => setFilterPay(x.v)}
                      className={pillBase(isActive)}
                    >
                      {x.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </CardShell>

        {/* Table */}
        <div className="mt-6">
          <CardShell>
            {loading ? (
              <div className="p-10 text-center">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-slate-600 font-medium">กำลังโหลดข้อมูล</p>
                <p className="text-xs text-slate-400 mt-1">
                  ดึงรายการออเดอร์ตามปีที่เลือก
                </p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-12 text-center border-t border-slate-200">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                  —
                </div>
                <p className="mt-4 text-slate-900 text-xl font-bold">
                  ไม่พบข้อมูล
                </p>
                <p className="mt-1 text-slate-500">
                  ลองเปลี่ยนตัวกรองสถานะหรือช่องทางชำระเงิน
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-emerald-700 to-green-700 text-white">
                      <th className="p-4 text-center w-32">รหัส</th>
                      <th className="p-4 text-left min-w-[240px]">ลูกค้า</th>
                      <th className="p-4 text-center w-40">วันที่</th>
                      <th className="p-4 text-center w-44">ช่องทางจ่าย</th>
                      <th className="p-4 text-right w-44">ยอดรวม</th>
                      <th className="p-4 text-center w-56">สถานะ</th>
                      <th className="p-4 text-center w-44">จัดการ</th>
                    </tr>
                  </thead>

                  <tbody className="bg-white">
                    {filteredOrders.map((o) => {
                      const code = makeCode("ord", o.Oid);

                      const pay = normalizePay(o.Opayment);
                      const isCod = pay === "cod";
                      const st = String(o.Ostatus || "").trim();

                      let meta = getMeta(ORDER_STATUS, st);

                      // ✅ COD + (pending_payment|waiting) => แสดงเป็น “รอจัดส่ง”
                      if (isCod && (st === "pending_payment" || st === "waiting")) {
                        meta = { ...meta, label: "รอจัดส่ง" };
                      }

                      const payLabel = isTransferPay(o.Opayment)
                        ? "โอน"
                        : pay === "cod"
                        ? "เก็บเงินปลายทาง"
                        : o.Opayment || "—";

                      return (
                        <tr
                          key={o.Oid}
                          className="border-b border-slate-100 hover:bg-emerald-50/40 transition"
                        >
                          <td className="p-4 text-center">
                            <span className="inline-flex items-center rounded-lg bg-slate-50 border border-slate-200 px-3 py-1 font-mono text-xs text-slate-700">
                              {code}
                            </span>
                          </td>

                          <td className="p-4">
                            <div className="font-semibold text-slate-900">
                              {o.Cname}
                            </div>
                            <div className="text-xs text-slate-500">
                              Order ID: {o.Oid}
                            </div>
                          </td>

                          <td className="p-4 text-center text-sm text-slate-700">
                            {formatThaiDateOnlyFromMysql(o.Odate)}
                          </td>

                          <td className="p-4 text-center text-sm text-slate-700">
                            <span className="inline-flex items-center justify-center px-3 py-1 rounded-full border border-slate-200 bg-white">
                              {payLabel}
                            </span>
                          </td>

                          <td className="p-4 text-right">
                            <div className="font-extrabold text-lg text-emerald-700">
                              {fmtBaht(o.Oprice)}
                            </div>
                            <div className="text-xs text-slate-500">THB</div>
                          </td>

                          <td className="p-4 text-center">
                            <StatusBadge label={meta.label} tone={meta.tone} />
                          </td>

                          <td className="p-4 text-center">
                            <Link
                              href={`/admin/orders/${o.Oid}`}
                              className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-sm transition"
                            >
                              ดูรายละเอียด
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div className="px-6 py-4 text-xs text-slate-500 bg-slate-50 border-t border-slate-200">
                  หน้านี้จำปีจาก URL และ localStorage และจะไม่เด้งกลับปีปัจจุบันตอนรีเฟรช
                </div>
              </div>
            )}
          </CardShell>
        </div>
      </div>
    </div>
  );
}
