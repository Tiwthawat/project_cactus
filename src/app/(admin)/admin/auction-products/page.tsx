"use client";

import { apiFetch } from "@/app/lib/apiFetch";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import StatusBadge from "@/app/component/StatusBadge";
import { AUCTION_PRODUCT_STATUS, getMeta } from "@/app/lib/status";

const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";

/** UI filter */
type StatusFilter = "all" | "ready" | "auction" | "paid" | "unsold";

/** DB/API status */
type AuctionProductStatus =
  | "ready"
  | "auction"
  | "pending_payment"
  | "payment_review"
  | "paid"
  | "shipping"
  | "delivered"
  | "unsold";

interface Row {
  PROid: number;
  PROname: string;
  PROpicture: string;
  PROprice: number;
  PROstatus: AuctionProductStatus | string;

  active_aid: number | null;
  active_end_time: string | null;
  active_current_price: number | null;
}

function fmtBaht(n: number) {
  return Number(n || 0).toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function isStatusFilter(x: unknown): x is StatusFilter {
  return x === "all" || x === "ready" || x === "auction" || x === "paid" || x === "unsold";
}

function normStatus(s: unknown) {
  return String(s ?? "").trim();
}

function toFirstPicPath(raw: string): string {
  return String(raw || "").split(",")[0]?.trim() || "";
}

function toImgUrl(path: string): string {
  const clean = String(path || "").trim();
  if (!clean) return "/no-image.png";
  if (clean.startsWith("http")) return clean;
  if (clean.startsWith("/")) return `${API}${clean}`;
  return `${API}/${clean}`;
}

function canDelete(st: string) {
  // กันพัง: ถ้ากำลังประมูลหรือปิดขายแล้ว ไม่ให้ลบ
  return !["auction", "paid", "shipping", "delivered"].includes(st);
}

export default function AdminAuctionProductsPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const [status, setStatus] = useState<StatusFilter>("ready");
  const [q, setQ] = useState("");

  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const timerRef = useRef<number | null>(null);
  const didInitRef = useRef(false);

  const fetchData = async (s: StatusFilter, query: string) => {
    try {
      setLoading(true);

      const p = new URLSearchParams();
      p.set("status", s);
      if (query.trim()) p.set("q", query.trim());

      const res = await apiFetch(`${API}/auction-products?${p.toString()}`, { cache: "no-store" });

      if (!res.ok) {
        setItems([]);
        return;
      }

      const data: unknown = await res.json();
      setItems(Array.isArray(data) ? (data as Row[]) : []);
    } catch (e) {
      console.error(e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => fetchData(status, q);

  /** init from URL once */
  useEffect(() => {
    if (didInitRef.current) return;

    const sRaw = sp.get("status");
    const qRaw = sp.get("q") ?? "";
    const s: StatusFilter = isStatusFilter(sRaw) ? sRaw : "ready";

    setStatus(s);
    setQ(qRaw);
    fetchData(s, qRaw);

    didInitRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp]);

  /** sync state -> URL (debounce) + fetch */
  useEffect(() => {
    if (!didInitRef.current) return;

    const params = new URLSearchParams();
    params.set("status", status);
    if (q.trim()) params.set("q", q.trim());

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      router.replace(`/admin/auction-products?${params.toString()}`, { scroll: false });
      fetchData(status, q);
    }, 250);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [status, q, router]);

  /** server already filters by status, but keep safe mapping */
  const filtered = useMemo(() => {
    return items.filter((p) => {
      const st = normStatus(p.PROstatus);
      if (status === "all") return true;
      if (status === "ready") return st === "ready";
      if (status === "auction") return st === "auction";
      if (status === "paid") return ["paid", "shipping", "delivered"].includes(st);
      if (status === "unsold") return st === "unsold";
      return true;
    });
  }, [items, status]);

  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = { all: 0, ready: 0, auction: 0, paid: 0, unsold: 0 };
    for (const p of items) {
      c.all += 1;
      const st = normStatus(p.PROstatus);
      if (st === "ready") c.ready += 1;
      else if (st === "auction") c.auction += 1;
      else if (["paid", "shipping", "delivered"].includes(st)) c.paid += 1;
      else if (st === "unsold") c.unsold += 1;
    }
    return c;
  }, [items]);

  const filterButtons: Array<{ v: StatusFilter; label: string }> = [
    { v: "ready", label: "พร้อมเปิดรอบ" },
    { v: "auction", label: "กำลังประมูล" },
    { v: "paid", label: "ชำระแล้ว" },
    { v: "unsold", label: "ไม่ถูกขาย" },
    { v: "all", label: "ทั้งหมด" },
  ];

  const delProduct = async (p: Row) => {
    const st = normStatus(p.PROstatus);
    if (!canDelete(st)) return;

    if (!confirm(`ลบสินค้านี้ออกจากคลังประมูล?\n\n${p.PROname}`)) return;

    try {
      setBusyId(p.PROid);
      const res = await apiFetch(`${API}/auction-products/${p.PROid}`, { method: "DELETE" });
      if (!res.ok) {
        alert("ลบไม่สำเร็จ");
        return;
      }
      await fetchData(status, q);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/40 to-slate-50">
      <div className="p-6 pt-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/70 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm">
            Auction Management
          </div>

          <div className="mt-4 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
                สินค้าสำหรับประมูล
              </h1>
              <p className="mt-1 text-slate-500">
                จัดการรายการสินค้า เปิดรอบ ดูรอบ และตรวจสอบราคาปิด
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={refresh}
                className="px-4 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold shadow-sm transition"
              >
                รีเฟรช
              </button>

              <Link
                href="/admin/auction-products/new"
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold shadow-lg transition text-center"
              >
                เพิ่มสินค้า
              </Link>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="p-5 md:p-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              {/* Filter Pills */}
              <div className="flex flex-wrap gap-2">
                {filterButtons.map((x) => {
                  const active = status === x.v;
                  const n = counts[x.v];

                  return (
                    <button
                      key={x.v}
                      type="button"
                      onClick={() => setStatus(x.v)}
                      className={[
                        "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold border transition",
                        active
                          ? "bg-emerald-600 text-white border-emerald-600 shadow"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      <span>{x.label}</span>
                      <span
                        className={[
                          "min-w-[28px] h-6 px-2 rounded-full text-xs font-bold flex items-center justify-center",
                          active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700",
                        ].join(" ")}
                      >
                        {n}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Search */}
              <div className="flex-1 min-w-[260px]">
                <div className="flex gap-2">
                  <input
                    className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:border-emerald-400 focus:outline-none transition placeholder:text-slate-400"
                    placeholder="ค้นหาชื่อสินค้า..."
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                  {q.trim() ? (
                    <button
                      type="button"
                      onClick={() => setQ("")}
                      className="px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold transition"
                    >
                      ล้าง
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="p-10 text-center border-t border-slate-200">
              <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-slate-600 font-medium">กำลังโหลดข้อมูล</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center border-t border-slate-200">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                —
              </div>
              <p className="mt-4 text-slate-900 text-xl font-bold">ไม่พบข้อมูล</p>
              <p className="mt-1 text-slate-500">ลองเปลี่ยนตัวกรอง หรือค้นหาด้วยชื่อสินค้า</p>
            </div>
          ) : (
            <div className="border-t border-slate-200 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-emerald-700 to-green-700 text-white">
                    <th className="p-4 text-center hidden md:table-cell w-24">รูป</th>
                    <th className="p-4 text-center w-44">รหัส</th>
                    <th className="p-4 text-left min-w-[320px]">สินค้า</th>
                    <th className="p-4 text-right w-40">ราคาตั้งต้น</th>
                    <th className="p-4 text-right hidden lg:table-cell w-44">ราคาขายจริง</th>
                    <th className="p-4 text-center w-40">สถานะ</th>
                    <th className="p-4 text-center w-36">จัดการ</th>
                  </tr>
                </thead>

                <tbody className="bg-white">
                  {filtered.map((p) => {
                    const firstPic = toFirstPicPath(p.PROpicture);
                    const hasPic = Boolean(firstPic && firstPic.trim().length > 0);
                    const imgSrc = hasPic ? toImgUrl(firstPic) : "/no-image.png";

                    const code = `aucpro:${String(p.PROid).padStart(4, "0")}`;

                    const st = normStatus(p.PROstatus);
                    const meta = getMeta(AUCTION_PRODUCT_STATUS, st);

                    const allowDelete = canDelete(st);
                    const rowBusy = busyId === p.PROid;

                    return (
                      <tr
                        key={p.PROid}
                        className="border-b border-slate-100 hover:bg-emerald-50/40 transition"
                      >
                        <td className="p-4 text-center hidden md:table-cell">
                          <div className="mx-auto w-16 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
                            <img
                              src={imgSrc}
                              className="w-full h-full object-cover"
                              alt={p.PROname}
                            />
                          </div>
                        </td>

                        <td className="p-4 text-center">
                          <span className="inline-flex items-center rounded-lg bg-slate-50 border border-slate-200 px-3 py-1 font-mono text-xs text-slate-700">
                            {code}
                          </span>
                        </td>

                        <td className="p-4">
                          <div className="font-semibold text-slate-900">{p.PROname}</div>

                          <div className="mt-1 text-xs text-slate-500">
                            {st === "auction" ? (
                              <span>
                                ปิดรอบ{" "}
                                {p.active_end_time
                                  ? new Date(p.active_end_time.replace(" ", "T")).toLocaleString("th-TH")
                                  : "-"}
                              </span>
                            ) : st === "ready" ? (
                              <span>พร้อมเปิดรอบ</span>
                            ) : ["paid", "shipping", "delivered"].includes(st) ? (
                              <span>
                                ปิดการขายแล้ว • ราคาขาย{" "}
                                {p.active_current_price ? `${fmtBaht(p.active_current_price)} ฿` : "-"}
                              </span>
                            ) : st === "unsold" ? (
                              <span>ปิดแล้ว • ไม่ถูกขาย</span>
                            ) : (
                              <span>-</span>
                            )}
                          </div>
                        </td>

                        <td className="p-4 text-right font-semibold text-slate-900">
                          {fmtBaht(p.PROprice)} ฿
                        </td>

                        <td className="p-4 text-right font-semibold text-emerald-700 hidden lg:table-cell">
                          {p.active_current_price ? `${fmtBaht(p.active_current_price)} ฿` : "-"}
                        </td>

                        <td className="p-4 text-center">
                          <StatusBadge label={meta.label} tone={meta.tone} />
                        </td>

                        <td className="p-4 text-center">
                          <div className="flex flex-col gap-2">
                            {p.active_aid ? (
                              <Link
                                href={`/admin/auctions/${p.active_aid}`}
                                className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold shadow-sm transition"
                              >
                                ดูรอบ
                              </Link>
                            ) : st === "ready" ? (
                              <Link
                                href={`/admin/auctions/new?proid=${p.PROid}`}
                                className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm transition"
                              >
                                เปิดรอบ
                              </Link>
                            ) : (
                              <div className="px-3 py-2 rounded-lg bg-slate-100 text-slate-400 text-sm font-semibold">
                                —
                              </div>
                            )}

                            <button
                              type="button"
                              disabled={!allowDelete || rowBusy}
                              onClick={() => delProduct(p)}
                              className={[
                                "px-3 py-2 rounded-lg text-sm font-semibold shadow-sm transition",
                                allowDelete
                                  ? "bg-white border border-rose-200 text-rose-700 hover:bg-rose-50"
                                  : "bg-slate-100 text-slate-400 cursor-not-allowed",
                              ].join(" ")}
                            >
                              {rowBusy ? "กำลังลบ..." : "ลบ"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="px-6 py-4 text-xs text-slate-500 bg-slate-50 border-t border-slate-200">
                หมายเหตุ: รายการที่กำลังประมูลหรือปิดขายแล้ว จะไม่อนุญาตให้ลบเพื่อป้องกันข้อมูลออเดอร์/ผู้ชนะเสียหาย
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
