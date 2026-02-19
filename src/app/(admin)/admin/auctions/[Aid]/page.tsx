"use client";

import { apiFetch } from "@/app/lib/apiFetch";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import StatusBadge from "@/app/component/StatusBadge";
import { getMeta, AUCTION_STATUS } from "@/app/lib/status";

type AuctionStatus = "open" | "closed";

interface AuctionDetail {
  Aid: number;
  start_price: number;
  current_price: number;
  close_price?: number;
  end_time: string;
  status: AuctionStatus;

  PROid: number;
  PROname: string;
  PROpicture: string;
  PROdetail?: string;

  winner_id?: number;
  winnerName?: string | null;
}

const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";

const fmt = (n: number) =>
  Number(n ?? 0).toLocaleString("th-TH", { minimumFractionDigits: 2 });

function safeImgUrl(p: string) {
  const raw = String(p || "").trim();
  if (!raw) return "";
  if (raw.startsWith("http")) return raw;
  if (raw.startsWith("/")) return `${API}${raw}`;
  return `${API}/${raw}`;
}

export default function AdminAuctionDetailPage() {
  const { Aid } = useParams<{ Aid: string }>();
  const router = useRouter();

  const [data, setData] = useState<AuctionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDetail = async () => {
    try {
      setLoading(true);

      const res = await apiFetch(`${API}/auction/${Aid}`, { cache: "no-store" });
      if (!res.ok) {
        setData(null);
        return;
      }

      const d: AuctionDetail = await res.json();
      setData(d);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Aid]);

  const imageUrls = useMemo(() => {
    if (!data?.PROpicture) return [];
    return data.PROpicture
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((p) => safeImgUrl(p))
      .filter(Boolean);
  }, [data?.PROpicture]);

  const [sel, setSel] = useState(0);

  const closeAuction = async () => {
    if (!confirm("ต้องการปิดประมูลนี้?")) return;

    const res = await apiFetch(`${API}/auctions/${Aid}/close`, {
      method: "PATCH",
    });

    if (!res.ok) {
      alert("ปิดประมูลไม่สำเร็จ");
      return;
    }

    alert("ปิดประมูลแล้ว");
    fetchDetail();
  };

  const deleteProduct = async () => {
    if (!data) return;
    if (!confirm("ลบสินค้าออกจากคลัง?")) return;

    const res = await apiFetch(`${API}/auction-products/${data.PROid}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      alert("ลบสินค้าไม่สำเร็จ");
      return;
    }

    alert("ลบสินค้าแล้ว");
    router.push("/admin/auction-products");
  };

  if (loading || !data) {
    return (
      <main className="min-h-screen bg-emerald-50">
        <div className="max-w-5xl mx-auto px-8 py-10">
          <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-8">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
              <div className="text-sm text-slate-600">กำลังโหลดข้อมูล...</div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const closePrice = data.close_price ?? data.current_price;
  const st = getMeta(AUCTION_STATUS, data.status);

  const cardCls =
    "bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden";
  const sectionTitleCls =
    "text-xs uppercase tracking-widest text-emerald-700 font-semibold";
  const labelCls = "text-xs uppercase tracking-wide text-slate-500";
  const valueCls = "text-sm font-semibold text-slate-800";
  const rowCls = "flex items-center justify-between py-3 border-t border-emerald-100/70";

  const Btn = ({
    children,
    onClick,
    disabled,
    tone = "outline",
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    tone?: "outline" | "primary" | "danger" | "neutral";
  }) => {
    const base =
      "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition shadow-sm";
    const tones: Record<string, string> = {
      outline:
        "border border-emerald-200 bg-white text-slate-700 hover:bg-emerald-50",
      primary: "bg-emerald-800 text-white hover:bg-emerald-900",
      danger: "bg-rose-700 text-white hover:bg-rose-800",
      neutral: "bg-slate-700 text-white hover:bg-slate-800",
    };
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={[
          base,
          tones[tone],
          disabled ? "opacity-50 cursor-not-allowed hover:shadow-sm" : "",
        ].join(" ")}
      >
        {children}
      </button>
    );
  };

  return (
    <main className="min-h-screen bg-emerald-50 text-black">
      <div className="max-w-5xl mx-auto px-8 py-10">
        {/* Header */}
        <div className="mb-8 border-b border-emerald-100 pb-6">
          <p className={sectionTitleCls}>Auctions</p>
          <div className="mt-2 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold text-emerald-950 tracking-wide">
                รายละเอียดประมูล
              </h1>
              <div className="mt-1 text-sm text-slate-600">
                รหัสรอบ:{" "}
                <span className="font-mono text-slate-800">{`auc:${String(
                  Aid
                ).padStart(4, "0")}`}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Btn tone="outline" onClick={() => router.push("/admin/auctions")}>
                กลับไปรายการ
              </Btn>
              {data.status === "closed" && data.winner_id ? (
                <Btn
                  tone="primary"
                  onClick={() => router.push(`/admin/auction-orders/${data.Aid}`)}
                >
                  ดูออเดอร์ประมูล
                </Btn>
              ) : null}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Gallery */}
          <section className={cardCls}>
            <div className="p-5 border-b border-emerald-100 bg-emerald-50/60">
              <div className="text-lg font-semibold text-emerald-950">
                รูปสินค้า
              </div>
              <div className="text-sm text-slate-600">
                เลือกรูปด้านล่างเพื่อดูภาพขยาย
              </div>
            </div>

            <div className="p-5">
              <div className="w-full aspect-[4/3] rounded-2xl bg-emerald-50/60 border border-emerald-100 overflow-hidden flex items-center justify-center">
                {imageUrls[sel] ? (
                  <img
                    src={imageUrls[sel]}
                    className="w-full h-full object-contain"
                    alt={data.PROname}
                  />
                ) : (
                  <div className="text-sm text-slate-500">ไม่มีรูป</div>
                )}
              </div>

              {imageUrls.length > 1 && (
                <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                  {imageUrls.map((u, i) => {
                    const active = sel === i;
                    return (
                      <button
                        key={`${u}-${i}`}
                        type="button"
                        onClick={() => setSel(i)}
                        className={[
                          "h-16 w-16 rounded-xl overflow-hidden border transition flex-none",
                          active
                            ? "border-emerald-400 ring-4 ring-emerald-100"
                            : "border-emerald-100 hover:border-emerald-300",
                        ].join(" ")}
                        aria-label={`เลือกภาพ ${i + 1}`}
                      >
                        <img
                          src={u}
                          className="w-full h-full object-cover"
                          alt={`${data.PROname}-${i + 1}`}
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Detail */}
          <section className={cardCls}>
            <div className="p-5 border-b border-emerald-100 bg-emerald-50/60">
              <div className="text-lg font-semibold text-emerald-950">
                ข้อมูลประมูล
              </div>
              <div className="text-sm text-slate-600">
                ตรวจสอบราคา เวลา และสถานะรอบประมูล
              </div>
            </div>

            <div className="p-6">
              {/* Product */}
              <div className="mb-5">
                <div className={labelCls}>สินค้า</div>
                <div className="text-2xl font-semibold text-emerald-950 mt-1">
                  {data.PROname}
                </div>
                {data.PROdetail ? (
                  <div className="mt-2 text-sm text-slate-600 leading-relaxed line-clamp-4">
                    {data.PROdetail}
                  </div>
                ) : null}
              </div>

              {/* Metrics */}
              <div className="rounded-2xl border border-emerald-100 overflow-hidden">
                <div className="px-5 py-3 bg-white">
                  <div className="grid grid-cols-1 gap-0">
                    <div className={rowCls}>
                      <span className="text-slate-600">ราคาเริ่มต้น</span>
                      <span className={valueCls}>{fmt(data.start_price)} ฿</span>
                    </div>

                    <div className={rowCls}>
                      <span className="text-slate-600">ราคาปัจจุบัน</span>
                      <span className="text-sm font-semibold text-emerald-800">
                        {fmt(data.current_price)} ฿
                      </span>
                    </div>

                    <div className={rowCls}>
                      <span className="text-slate-600">ราคาปิด</span>
                      <span className="text-sm font-semibold text-slate-800">
                        {fmt(closePrice)} ฿
                      </span>
                    </div>

                    <div className={rowCls}>
                      <span className="text-slate-600">ปิดประมูล</span>
                      <span className="text-sm text-slate-700">
                        {new Date(data.end_time).toLocaleString("th-TH")}
                      </span>
                    </div>

                    <div className={rowCls}>
                      <span className="text-slate-600">สถานะ</span>
                      <StatusBadge label={st.label} tone={st.tone} />
                    </div>

                    {data.status === "closed" && (
                      <div className={rowCls}>
                        <span className="text-slate-600">ผู้ชนะ</span>
                        <span className="text-sm font-semibold text-slate-800">
                          {data.winnerName || "—"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex flex-wrap gap-2">
                <Btn tone="outline" onClick={() => router.push("/admin/auctions")}>
                  กลับ
                </Btn>

                {data.status === "open" && (
                  <Btn tone="danger" onClick={closeAuction}>
                    ปิดประมูล
                  </Btn>
                )}

                <Btn tone="neutral" onClick={deleteProduct}>
                  ลบสินค้า
                </Btn>
              </div>

              <div className="mt-3 text-xs text-slate-500">
                หมายเหตุ: ลบสินค้าจะลบออกจากคลังสินค้าประมูล (ตรวจสอบให้แน่ใจก่อนทำรายการ)
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
