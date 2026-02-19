"use client";

import { apiFetch } from "@/app/lib/apiFetch";
import StatusBadge from "@/app/component/StatusBadge";
import {
  AUCTION_PAY_STATUS,
  AUCTION_SHIP_STATUS,
  getMeta,
  StatusMeta,
} from "@/app/lib/status";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import BiddingLogsPanel from "@/app/component/admin/BiddingLogsPanel";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";

const getImageUrl = (path: string | null) => {
  if (!path) return "/no-image.png";
  const clean = path.trim();
  if (clean.startsWith("http")) return clean;
  if (clean.startsWith("/")) return `${API}${clean}`;
  return `${API}/${clean}`;
};

const makeCode = (prefix: string, id: number) =>
  `${prefix}:${String(id).padStart(4, "0")}`;

type PaymentStatus = "pending_payment" | "payment_review" | "paid";
type ShipStatus = "pending" | "shipped" | "delivered";

interface AuctionOrderDetail {
  Aid: number;
  PROid: number;
  PROname: string;
  PROpicture: string;

  Cname: string;
  Cphone: string;
  Caddress: string;

  current_price: number;

  slip: string | null;
  paid_at: string | null;
  payment_status: PaymentStatus | null;

  shipping_company: string | null;
  tracking_number: string | null;

  shipping_status: "pending" | "shipping" | "shipped" | "delivered" | null;
}

function fmtBaht(n: number) {
  return Number(n || 0).toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function isPaymentStatus(x: unknown): x is PaymentStatus {
  return x === "pending_payment" || x === "payment_review" || x === "paid";
}

function normalizeShipStatus(input: {
  payment_status: PaymentStatus;
  shipping_status: AuctionOrderDetail["shipping_status"];
  tracking_number: string | null;
}): ShipStatus | null {
  if (input.payment_status !== "paid") return null;

  const raw = String(input.shipping_status || "").trim();
  const hasTracking = Boolean(input.tracking_number);

  if (raw === "delivered") return "delivered";
  if (raw === "shipping" || raw === "shipped" || hasTracking) return "shipped";
  return "pending";
}

/** ---------- UI helpers (ธีมเดียวกับหน้า list) ---------- */
function clsx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function softCard(extra?: string) {
  return clsx(
    "bg-white/80 backdrop-blur rounded-2xl shadow-lg border border-slate-200",
    extra
  );
}

function sectionTitle() {
  return "text-sm font-bold text-slate-900";
}

function sectionHint() {
  return "text-xs text-slate-500";
}

function primaryBtn(disabled?: boolean) {
  return clsx(
    "w-full inline-flex items-center justify-center rounded-xl px-4 py-2.5 font-semibold shadow-sm transition",
    disabled
      ? "bg-slate-200 text-slate-400 cursor-not-allowed"
      : "bg-slate-900 text-white hover:bg-slate-800"
  );
}

function accentBtn(tone: "amber" | "green" | "blue", disabled?: boolean) {
  const map: Record<typeof tone, string> = {
    amber:
      "bg-amber-500 hover:bg-amber-600 text-white",
    green:
      "bg-emerald-600 hover:bg-emerald-700 text-white",
    blue:
      "bg-emerald-600 hover:bg-emerald-700 text-white",
  };
  return clsx(
    "w-full inline-flex items-center justify-center rounded-xl px-4 py-2.5 font-semibold shadow-sm transition",
    disabled ? "bg-slate-200 text-slate-400 cursor-not-allowed" : map[tone]
  );
}

export default function AuctionOrderDetailPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : undefined;

  const [data, setData] = useState<AuctionOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const [shipComp, setShipComp] = useState("");
  const [trackNo, setTrackNo] = useState("");
  const [editShip, setEditShip] = useState(false);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        setLoading(true);
        const res = await apiFetch(`${API}/auction-orders/${id}`);
        if (!res.ok) {
          setData(null);
          return;
        }

        const d: AuctionOrderDetail = await res.json();
        setData(d);
        setShipComp(d.shipping_company ?? "");
        setTrackNo(d.tracking_number ?? "");
      } catch (err) {
        console.error(err);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const paymentStatus: PaymentStatus = useMemo(() => {
    const s = data?.payment_status;
    if (isPaymentStatus(s)) return s;
    return "pending_payment";
  }, [data]);

  const shippingStatus: ShipStatus | null = useMemo(() => {
    if (!data) return null;
    return normalizeShipStatus({
      payment_status: paymentStatus,
      shipping_status: data.shipping_status,
      tracking_number: data.tracking_number,
    });
  }, [data, paymentStatus]);

  const payMeta: StatusMeta = useMemo(() => {
    return getMeta(AUCTION_PAY_STATUS, paymentStatus);
  }, [paymentStatus]);

  const shipMeta: StatusMeta = useMemo(() => {
    if (!shippingStatus) return { label: "—", tone: "gray" };
    return getMeta(AUCTION_SHIP_STATUS, shippingStatus);
  }, [shippingStatus]);

  const hasShippingInfo = Boolean(data?.shipping_company || data?.tracking_number);

  const canGoToReview = paymentStatus === "pending_payment" && Boolean(data?.slip);
  const canApprovePaid = paymentStatus === "payment_review";
  const canCreateShippingNow = paymentStatus === "paid";
  const canShowShippingForm = canCreateShippingNow && !hasShippingInfo;
  const canEditShipping = hasShippingInfo && shippingStatus !== "delivered";
  const canMarkDelivered = shippingStatus === "shipped";

  const updatePaymentStatus = async (next: PaymentStatus) => {
    if (!data) return;

    const okNext =
      (paymentStatus === "pending_payment" && next === "payment_review") ||
      (paymentStatus === "payment_review" && next === "paid") ||
      (paymentStatus === "pending_payment" && next === "paid");

    if (!okNext) {
      alert("ไม่สามารถเปลี่ยนสถานะย้อนกลับได้");
      return;
    }

    const res = await apiFetch(`${API}/auction-orders/${data.Aid}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: next }),
    });

    if (!res.ok) return alert("แก้สถานะไม่สำเร็จ");

    setData({ ...data, payment_status: next });
  };

  const saveShipping = async () => {
    if (!data) return;

    if (!shipComp || !trackNo) {
      alert("กรอกข้อมูลให้ครบก่อน");
      return;
    }

    const res = await apiFetch(`${API}/auction-orders/${data.Aid}/shipping`, {
      method: "PATCH",
      body: JSON.stringify({
        shipping_company: shipComp,
        tracking_number: trackNo,
        shipping_status: "shipped",
      }),
    });

    if (!res.ok) return alert("บันทึกจัดส่งไม่สำเร็จ");

    alert("บันทึกจัดส่งแล้ว");
    setData({
      ...data,
      shipping_company: shipComp,
      tracking_number: trackNo,
      shipping_status: "shipped",
    });
    setEditShip(false);
  };

  const markDelivered = async () => {
    if (!data) return;
    if (!confirm("ยืนยันปิดเป็นจัดส่งสำเร็จ (delivered) ?")) return;

    const res = await apiFetch(`${API}/auction-orders/${data.Aid}/delivered`, {
      method: "PATCH",
    });

    if (!res.ok) return alert("อัปเดตสถานะไม่สำเร็จ");

    alert("อัปเดตเป็น delivered แล้ว");
    setData({ ...data, shipping_status: "delivered" });
  };

  const copyAddress = async () => {
    if (!data) return;

    const text = `ชื่อ: ${data.Cname}\nโทร: ${data.Cphone}\nที่อยู่: ${data.Caddress}`;

    try {
      await navigator.clipboard.writeText(text);
      alert("คัดลอกที่อยู่เรียบร้อยแล้ว");
    } catch {
      alert("คัดลอกไม่สำเร็จ");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/35 to-slate-50 flex items-center justify-center">
        <div className={softCard("p-8 text-center")}>
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-600 font-medium">กำลังโหลดข้อมูล</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/35 to-slate-50 flex items-center justify-center">
        <div className={softCard("p-10 text-center")}>
          <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
            —
          </div>
          <p className="mt-4 text-slate-900 text-xl font-bold">ไม่พบข้อมูล</p>
          <p className="mt-1 text-slate-500">ลองกลับไปหน้า list แล้วเลือกใหม่</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/35 to-slate-50">
      <div className="p-6 pt-8 max-w-7xl mx-auto text-slate-900">
        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/70 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm">
            Auction Order Detail
          </div>

          <div className="mt-4 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                รายละเอียดออเดอร์ประมูล
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                รหัส {makeCode("auc", data.Aid)} • PRO#{data.PROid}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge label={payMeta.label} tone={payMeta.tone} />
              <StatusBadge label={shipMeta.label} tone={shipMeta.tone} />
              <Link
                href={`/admin/auction-orders/${data.Aid}/receipt`}
                target="_blank"
                className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-sm transition whitespace-nowrap"
              >
                พิมพ์ใบเสร็จ
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer + summary */}
            <div className={softCard("p-6")}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className={sectionHint()}>ข้อมูลผู้ชนะ</div>
                  <div className="mt-1 text-xl font-bold">{data.Cname}</div>
                  <div className="mt-1 text-sm text-slate-600">{data.Cphone}</div>
                </div>

                <div className="text-right">
                  <div className={sectionHint()}>ราคาชนะ</div>
                  <div className="mt-1 text-2xl font-extrabold text-emerald-700">
                    {fmtBaht(data.current_price)}
                    <span className="text-sm font-bold text-slate-500 ml-1">THB</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-white/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className={sectionTitle()}>ที่อยู่จัดส่ง</div>
                    <div className="mt-1 text-sm text-slate-700 whitespace-pre-line">
                      {data.Caddress}
                    </div>
                  </div>

                  <button
                    onClick={copyAddress}
                    className="shrink-0 inline-flex items-center justify-center px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-semibold shadow-sm transition"
                  >
                    คัดลอก
                  </button>
                </div>
              </div>

              <div className="mt-3 text-xs text-slate-500">
                อัปเดตสลิปล่าสุด:{" "}
                {data.paid_at ? new Date(data.paid_at).toLocaleString("th-TH") : "—"}
              </div>
            </div>

            {/* Product */}
            <div className={softCard("p-6")}>
              <div className="flex items-start justify-between">
                <div>
                  <div className={sectionHint()}>สินค้า</div>
                  <div className="mt-1 text-xl font-bold">{data.PROname}</div>
                  <div className="mt-1 text-sm text-slate-500">PRO#{data.PROid}</div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-[260px,1fr] gap-5">
                <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                  <img
                    src={getImageUrl(data.PROpicture)}
                    className="w-full h-[260px] object-cover"
                    alt={data.PROname}
                  />
                </div>

                <div className="space-y-3">
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                    <div className="text-xs font-semibold text-emerald-800">
                      สรุปยอดชำระ
                    </div>
                    <div className="mt-1 text-2xl font-extrabold text-emerald-800">
                      {fmtBaht(data.current_price)}{" "}
                      <span className="text-sm font-bold text-emerald-900/70">THB</span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white/60 p-4">
                    <div className="text-xs font-semibold text-slate-600">รหัสออเดอร์</div>
                    <div className="mt-1 font-mono text-sm text-slate-800">
                      {makeCode("auc", data.Aid)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bidding logs */}
            <div className={softCard("p-0 overflow-hidden")}>
              <div className="p-6 border-b border-slate-200">
                <div className={sectionTitle()}>ประวัติการบิด</div>
                <div className={sectionHint()}>ดู timeline การประมูลของรายการนี้</div>
              </div>
              <div className="p-6">
                <BiddingLogsPanel aid={data.Aid} />
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-6 lg:sticky lg:top-6 h-fit">
            {/* Actions */}
            <div className={softCard("p-6")}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className={sectionHint()}>การดำเนินการ</div>
                  <div className={sectionTitle()}>จัดการสถานะการชำระเงิน</div>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {paymentStatus === "pending_payment" ? (
                  <button
                    disabled={!canGoToReview}
                    onClick={() => updatePaymentStatus("payment_review")}
                    className={accentBtn("amber", !canGoToReview)}
                    title={!canGoToReview ? "ต้องมีสลิปก่อนถึงจะเข้าสู่ตรวจสอบได้" : ""}
                  >
                    ไปตรวจสอบสลิป
                  </button>
                ) : null}

                {paymentStatus === "payment_review" ? (
                  <button
                    onClick={() => updatePaymentStatus("paid")}
                    className={accentBtn("green")}
                  >
                    อนุมัติสลิป (ชำระแล้ว)
                  </button>
                ) : null}

                {paymentStatus === "paid" ? (
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-sm text-emerald-900">
                    ชำระแล้ว — กรอกข้อมูลจัดส่งด้านล่างได้เลย
                  </div>
                ) : null}
              </div>
            </div>

            {/* Slip */}
            <div className={softCard("p-6")}>
              <div className={sectionTitle()}>สลิปการโอน</div>
              <div className={sectionHint()}>
                {data.slip ? "คลิกขวาเปิดแท็บใหม่เพื่อซูมได้" : "ยังไม่มีสลิป"}
              </div>

              <div className="mt-4">
                {data.slip ? (
                  <>
                    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                      <img
                        src={getImageUrl(data.slip)}
                        className="w-full object-contain max-h-[420px]"
                        alt="slip"
                      />
                    </div>
                    {data.paid_at ? (
                      <div className="mt-2 text-xs text-slate-500">
                        เวลาอัปโหลด: {new Date(data.paid_at).toLocaleString("th-TH")}
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500 text-center">
                    ไม่มีสลิป
                  </div>
                )}
              </div>
            </div>

            {/* Shipping */}
            <div className={softCard("p-6")}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className={sectionHint()}>ข้อมูลจัดส่ง</div>
                  <div className={sectionTitle()}>ขนส่ง + เลขพัสดุ</div>
                </div>

                {canEditShipping ? (
                  <button
                    onClick={() => setEditShip((v) => !v)}
                    className="text-emerald-700 hover:underline font-semibold text-xs"
                  >
                    {editShip ? "ปิดการแก้ไข" : "แก้ไข"}
                  </button>
                ) : null}
              </div>

              {/* Create form */}
              {canShowShippingForm ? (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-white/60 p-4">
                  <label className="block mb-2 text-sm font-semibold text-slate-700">
                    ขนส่ง
                  </label>
                  <select
                    className="border border-slate-200 p-2.5 rounded-xl w-full mb-3 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    value={shipComp}
                    onChange={(e) => setShipComp(e.target.value)}
                  >
                    <option value="">เลือกขนส่ง</option>
                    <option value="Flash">Flash</option>
                    <option value="J&T">J&T</option>
                    <option value="Kerry">Kerry</option>
                    <option value="ThaiPost">ไปรษณีย์ไทย</option>
                  </select>

                  <label className="block mb-2 text-sm font-semibold text-slate-700">
                    เลขพัสดุ
                  </label>
                  <input
                    className="border border-slate-200 p-2.5 rounded-xl w-full mb-3 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    value={trackNo}
                    onChange={(e) => setTrackNo(e.target.value)}
                    placeholder="เช่น TH1234567890"
                  />

                  <button onClick={saveShipping} className={accentBtn("blue")}>
                    บันทึกจัดส่ง
                  </button>

                  <div className="mt-2 text-xs text-slate-500">
                    บันทึกแล้วระบบจะถือว่า “จัดส่งแล้ว”
                  </div>
                </div>
              ) : null}

              {/* Show info */}
              {hasShippingInfo ? (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <StatusBadge label={shipMeta.label} tone={shipMeta.tone} />
                    <span className="text-xs text-slate-500">{shippingStatus ?? "—"}</span>
                  </div>

                  {!editShip ? (
                    <div className="rounded-2xl border border-slate-200 bg-white/60 p-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">ขนส่ง</span>
                        <span className="font-semibold text-slate-900">
                          {data.shipping_company || "—"}
                        </span>
                      </div>
                      <div className="mt-2 flex justify-between">
                        <span className="text-slate-500">เลขพัสดุ</span>
                        <span className="font-mono font-semibold text-slate-900">
                          {data.tracking_number || "—"}
                        </span>
                      </div>

                      {canMarkDelivered ? (
                        <button
                          onClick={markDelivered}
                          className="mt-4 w-full rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-2.5 shadow-sm transition"
                        >
                          ปิดเป็นส่งสำเร็จ (delivered)
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-slate-200 bg-white/60 p-4">
                      <label className="block mb-2 text-sm font-semibold text-slate-700">
                        ขนส่ง
                      </label>
                      <select
                        className="border border-slate-200 p-2.5 rounded-xl w-full mb-3 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200"
                        value={shipComp}
                        onChange={(e) => setShipComp(e.target.value)}
                      >
                        <option value="">เลือกขนส่ง</option>
                        <option value="Flash">Flash</option>
                        <option value="J&T">J&T</option>
                        <option value="Kerry">Kerry</option>
                        <option value="ThaiPost">ไปรษณีย์ไทย</option>
                      </select>

                      <label className="block mb-2 text-sm font-semibold text-slate-700">
                        เลขพัสดุ
                      </label>
                      <input
                        className="border border-slate-200 p-2.5 rounded-xl w-full mb-4 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200"
                        value={trackNo}
                        onChange={(e) => setTrackNo(e.target.value)}
                      />

                      <div className="flex gap-2">
                        <button onClick={saveShipping} className={accentBtn("blue")}>
                          บันทึก
                        </button>
                        <button
                          onClick={() => setEditShip(false)}
                          className="w-full rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-semibold py-2.5 shadow-sm transition"
                        >
                          ยกเลิก
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

              {!hasShippingInfo && paymentStatus !== "paid" ? (
                <div className="mt-4 text-sm text-slate-500">
                  ต้องชำระเงินแล้ว (paid) ก่อน ถึงจะกรอกข้อมูลจัดส่งได้
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
