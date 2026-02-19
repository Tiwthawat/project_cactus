"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/app/lib/apiFetch";
import Link from "next/link";

import StatusBadge from "@/app/component/StatusBadge";
import { getMeta, ORDER_STATUS } from "@/app/lib/status";

const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";

/** --------------------------
 *  Image helpers (รองรับหลายรูป)
 * -------------------------- */
type PictureLike = string | string[] | null | undefined;

const getImageUrl = (path: string | null | undefined) => {
  if (!path) return "/no-image.png";
  const clean = String(path).trim();
  if (!clean) return "/no-image.png";
  if (clean.startsWith("http")) return clean;
  if (clean.startsWith("/")) return `${API}${clean}`;
  return `${API}/${clean}`;
};

const toPictures = (raw: PictureLike): string[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter((x) => typeof x === "string" && x.trim());

  const s = String(raw).trim();
  if (!s) return [];

  // JSON string เช่น '["/a.png","/b.png"]'
  if (s.startsWith("[")) {
    try {
      const arr = JSON.parse(s);
      if (Array.isArray(arr)) {
        return arr.filter((x) => typeof x === "string" && x.trim());
      }
    } catch {
      // ignore
    }
  }

  // เผื่อเก็บเป็น "a.jpg,b.jpg"
  if (s.includes(",")) {
    return s
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }

  // รูปเดี่ยว
  return [s];
};

const firstPicture = (raw: PictureLike) => toPictures(raw)[0] ?? null;

const makeCode = (prefix: string, id: number) => `${prefix}:${String(id).padStart(4, "0")}`;

type OrderStatus =
  | "pending_payment"
  | "payment_review"
  | "paid"
  | "shipping"
  | "delivered"
  | "cancelled";

function fmtBaht(n: number) {
  return Number(n || 0).toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

interface OrderItem {
  Oiid: number;
  Pname: string;
  Oquantity: number;
  Oprice: number;
  Ppicture: string | string[] | null; // ✅ รองรับหลายรูป
}

interface FullOrder {
  Oid: number;
  Oprice: number;
  Odate: string;
  Ostatus: OrderStatus;

  Cname: string;
  Cphone: string;
  Caddress: string;

  Oslip: string | null;
  Opayment: string; // "transfer" | "cod" (ตาม backend)

  Oshipping: string | null;
  Otracking: string | null;

  items: OrderItem[];
}

/** --------------------------
 *  UI helpers
 * -------------------------- */
function clsx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "bg-white/80 backdrop-blur rounded-2xl shadow-lg border border-slate-200 overflow-hidden",
        className
      )}
    >
      {children}
    </div>
  );
}

function SectionTitle({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        {desc ? <p className="text-sm text-slate-500 mt-1">{desc}</p> : null}
      </div>
    </div>
  );
}

function GhostButton({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "inline-flex items-center justify-center px-4 py-2 rounded-xl",
        "border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold",
        "shadow-sm transition",
        className
      )}
    >
      {children}
    </button>
  );
}

function SolidButton({
  children,
  onClick,
  disabled,
  tone = "dark",
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tone?: "dark" | "emerald" | "amber" | "rose" | "indigo" | "blue";
  className?: string;
}) {
  const map: Record<string, string> = {
    dark: "bg-slate-900 hover:bg-slate-800 text-white",
    emerald: "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white",
    amber: "bg-amber-500 hover:bg-amber-600 text-white",
    rose: "bg-rose-600 hover:bg-rose-700 text-white",
    indigo: "bg-indigo-600 hover:bg-indigo-700 text-white",
    blue: "bg-blue-600 hover:bg-blue-700 text-white",
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        "w-full inline-flex items-center justify-center px-4 py-2 rounded-xl font-semibold",
        "shadow-sm transition",
        map[tone],
        disabled && "opacity-40 cursor-not-allowed",
        className
      )}
    >
      {children}
    </button>
  );
}

function KeyValue({
  k,
  v,
  mono,
}: {
  k: string;
  v: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-slate-100 last:border-b-0">
      <div className="text-sm font-semibold text-slate-600">{k}</div>
      <div className={clsx("text-sm text-slate-900 text-right", mono && "font-mono")}>
        {v}
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [order, setOrder] = useState<FullOrder | null>(null);
  const [loading, setLoading] = useState(true);

  const [shipComp, setShipComp] = useState("");
  const [trackNo, setTrackNo] = useState("");
  const [editShip, setEditShip] = useState(false);

  // ✅ image preview (สินค้า)
  const [imgOpen, setImgOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const openImg = (src: string) => {
    setImgSrc(src);
    setImgOpen(true);
  };
  const closeImg = () => {
    setImgOpen(false);
    setImgSrc(null);
  };

  // โหลดข้อมูลออเดอร์
  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        setLoading(true);
        const res = await apiFetch(`${API}/orders/${id}`);
        if (!res.ok) {
          setOrder(null);
          return;
        }
        const d: FullOrder = await res.json();
        setOrder(d);
        setShipComp(d.Oshipping ?? "");
        setTrackNo(d.Otracking ?? "");
      } catch {
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/35 to-slate-50 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur rounded-2xl border border-slate-200 shadow-lg px-6 py-5 text-slate-600 font-semibold">
          กำลังโหลดข้อมูล
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/35 to-slate-50">
        <div className="p-6 pt-10 max-w-7xl mx-auto">
          <Card className="p-10 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
              —
            </div>
            <p className="mt-4 text-slate-900 text-xl font-bold">ไม่พบข้อมูลคำสั่งซื้อ</p>
            <p className="mt-1 text-slate-500">ตรวจสอบรหัสคำสั่งซื้ออีกครั้ง</p>
            <div className="mt-6">
              <Link
                href="/admin/orders"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-sm transition"
              >
                กลับไปหน้ารายการ
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const isCOD = order.Opayment === "cod";

  // ✅ ใช้สถานะ “อันหลัก” จาก status.ts
  const meta = getMeta(ORDER_STATUS, order.Ostatus);

  // ✅ UI label สำหรับ COD: pending_payment ให้แสดง “รอจัดส่ง (COD)” (แต่สีตามอันหลัก)
  const uiMeta =
    isCOD && order.Ostatus === "pending_payment"
      ? { ...meta, label: "รอจัดส่ง (COD)" }
      : meta;

  // ---- เงื่อนไขปุ่มตาม flow (ไปข้างหน้าเป็นหลัก) ----
  const canCancel =
    order.Ostatus !== "cancelled" &&
    order.Ostatus !== "delivered" &&
    order.Ostatus !== "shipping"; // เริ่มส่งแล้วไม่ให้ยกเลิก

  const canGoPaymentReview = !isCOD && order.Ostatus === "pending_payment";
  const canApproveSlip = !isCOD && order.Ostatus === "payment_review";

  const canCreateShippingNow =
    (isCOD && order.Ostatus === "pending_payment") ||
    (!isCOD && order.Ostatus === "paid");

  const hasShippingInfo = Boolean(order.Oshipping || order.Otracking);

  const canShowShippingForm = canCreateShippingNow && !hasShippingInfo;
  const canEditShipping = hasShippingInfo && order.Ostatus !== "delivered";
  const canMarkDelivered = order.Ostatus === "shipping";

  // ---- API actions ----
  const patchStatus = async (newStatus: OrderStatus) => {
    const res = await apiFetch(`${API}/orders/${order.Oid}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) {
      alert("อัปเดตสถานะไม่สำเร็จ");
      return false;
    }
    setOrder((prev) => (prev ? { ...prev, Ostatus: newStatus } : prev));
    return true;
  };

  const goPaymentReview = async () => {
    if (!confirm("ย้ายไปสถานะตรวจสอบสลิป (payment_review) ?")) return;
    await patchStatus("payment_review");
  };

  const approveSlipToPaid = async () => {
    if (!confirm("ยืนยันอนุมัติสลิป และเปลี่ยนเป็นชำระแล้ว (paid) ?")) return;
    await patchStatus("paid");
  };

  const cancelOrder = async () => {
    if (!confirm("ยืนยันยกเลิกออเดอร์นี้?")) return;
    await patchStatus("cancelled");
  };

  const saveShipping = async () => {
    if (!shipComp || !trackNo) {
      alert("กรอกข้อมูลให้ครบก่อน");
      return;
    }

    // route นี้ของตะเอ๊ง: /orders/:id/shipping (และจะตั้ง status เป็น shipping)
    const res = await apiFetch(`${API}/orders/${order.Oid}/shipping`, {
      method: "PATCH",
      body: JSON.stringify({
        Oshipping: shipComp,
        Otracking: trackNo,
        Ostatus: "shipping",
      }),
    });

    if (!res.ok) {
      alert("บันทึกจัดส่งไม่สำเร็จ");
      return;
    }

    setOrder((prev) =>
      prev
        ? {
            ...prev,
            Oshipping: shipComp,
            Otracking: trackNo,
            Ostatus: "shipping",
          }
        : prev
    );
    setEditShip(false);
    alert("บันทึกจัดส่งแล้ว");
  };

  const markDelivered = async () => {
    if (!confirm("ยืนยันปิดเป็นจัดส่งสำเร็จ (delivered) ?")) return;

    const res = await apiFetch(`${API}/orders/${order.Oid}/delivered`, {
      method: "PATCH",
    });

    if (!res.ok) {
      alert("อัปเดตสถานะไม่สำเร็จ");
      return;
    }

    setOrder((prev) => (prev ? { ...prev, Ostatus: "delivered" } : prev));
    setEditShip(false);
    alert("อัปเดตเป็น delivered แล้ว");
  };

  const copyShippingAddress = async () => {
    const text = `ชื่อ: ${order.Cname}
โทร: ${order.Cphone}
ที่อยู่: ${order.Caddress}`;

    try {
      await navigator.clipboard.writeText(text);
      alert("คัดลอกข้อมูลจัดส่งแล้ว");
    } catch {
      alert("ไม่สามารถคัดลอกได้");
    }
  };

  const shipStatusMeta = getMeta(ORDER_STATUS, order.Ostatus);

  const payLabel = isCOD ? "ชำระปลายทาง (COD)" : "โอนผ่านบัญชี";
  const orderCode = makeCode("ord", order.Oid);

  const dateLabel = (() => {
    const d = new Date(order.Odate);
    const ok = !Number.isNaN(d.getTime());
    return ok ? d.toLocaleString("th-TH") : String(order.Odate);
  })();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/35 to-slate-50">
      <div className="p-6 pt-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/70 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm">
            Order Detail
          </div>

          <div className="mt-4 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
                รายละเอียดคำสั่งซื้อ
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-lg bg-slate-50 border border-slate-200 px-3 py-1 font-mono text-xs text-slate-700">
                  {orderCode}
                </span>
                <span className="text-sm text-slate-500">วันที่สั่งซื้อ: {dateLabel}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin/orders"
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold shadow-sm transition"
              >
                กลับไปหน้ารายการ
              </Link>

              <Link
                href={`/admin/orders/${order.Oid}/receipt`}
                target="_blank"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold shadow-lg transition text-center"
              >
                พิมพ์ใบเสร็จ
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ================= LEFT ================= */}
          <div className="lg:col-span-2 space-y-6">
            {/* รายละเอียด */}
            <Card>
              <div className="p-5 md:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">ข้อมูลคำสั่งซื้อ</h2>
                    <p className="text-sm text-slate-500 mt-1">
                      ตรวจสอบข้อมูลลูกค้า ช่องทางชำระเงิน และสถานะปัจจุบัน
                    </p>
                  </div>

                  <div className="shrink-0">
                    <StatusBadge label={uiMeta.label} tone={uiMeta.tone} />
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="text-xs font-semibold text-slate-500">ลูกค้า</div>
                    <div className="mt-1 font-bold text-slate-900">{order.Cname}</div>
                    <div className="mt-2 text-sm text-slate-700">
                      <span className="font-semibold text-slate-600">เบอร์โทร:</span>{" "}
                      {order.Cphone}
                    </div>
                    <div className="mt-1 text-sm text-slate-700">
                      <span className="font-semibold text-slate-600">ช่องทางชำระเงิน:</span>{" "}
                      <span className="font-semibold text-emerald-700">{payLabel}</span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="text-xs font-semibold text-slate-500">ที่อยู่จัดส่ง</div>
                    <div className="mt-2 text-sm text-slate-900 leading-relaxed">
                      {order.Caddress}
                    </div>

                    <div className="mt-4">
                      <GhostButton onClick={copyShippingAddress} className="w-full">
                        คัดลอกข้อมูลจัดส่ง
                      </GhostButton>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 text-xs text-slate-500 bg-slate-50 border-t border-slate-200">
                รหัสอ้างอิง: {orderCode} • สถานะระบบ: {order.Ostatus}
              </div>
            </Card>

            {/* รายการสินค้า */}
            <Card>
              <div className="p-5 md:p-6">
                <SectionTitle
                  title="รายการสินค้า"
                  desc="ตรวจสอบรายการสินค้า จำนวน และยอดรวมต่อรายการ"
                />

                <div className="mt-4 divide-y divide-slate-100">
                  {order.items.map((item) => {
                    const pics = toPictures(item.Ppicture);
                    const main = firstPicture(item.Ppicture);

                    return (
                      <div key={item.Oiid} className="py-4">
                        <div className="flex gap-4">
                          <button
                            type="button"
                            onClick={() => openImg(getImageUrl(main))}
                            className="shrink-0 w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm"
                            aria-label="open-product-image"
                          >
                            <img
                              src={getImageUrl(main)}
                              className="w-full h-full object-cover"
                              alt={item.Pname}
                            />
                          </button>

                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-slate-900 truncate">{item.Pname}</div>
                            <div className="mt-1 text-sm text-slate-600">
                              จำนวน <span className="font-semibold">{item.Oquantity}</span>{" "}
                              <span className="text-slate-400">×</span>{" "}
                              <span className="font-semibold">{fmtBaht(item.Oprice)}</span> บาท
                            </div>

                            {/* thumbs */}
                            {pics.length > 1 && (
                              <div className="mt-3 flex gap-2 flex-wrap">
                                {pics.slice(0, 6).map((p, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => openImg(getImageUrl(p))}
                                    className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-100"
                                    aria-label={`thumb-${idx + 1}`}
                                  >
                                    <img
                                      src={getImageUrl(p)}
                                      className="w-full h-full object-cover"
                                      alt={`${item.Pname}-${idx + 1}`}
                                    />
                                  </button>
                                ))}
                                {pics.length > 6 && (
                                  <span className="text-xs text-slate-500 self-center">
                                    +{pics.length - 6}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="shrink-0 text-right">
                            <div className="text-xs text-slate-500">รวม</div>
                            <div className="font-extrabold text-slate-900">
                              {fmtBaht(item.Oquantity * item.Oprice)}
                            </div>
                            <div className="text-xs text-slate-500">บาท</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>

            {/* สรุปราคา */}
            <Card>
              <div className="p-5 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-600">ยอดรวมสุทธิ</div>
                    <div className="text-xs text-slate-500 mt-1">รวมราคาสินค้าทั้งหมดในคำสั่งซื้อ</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-extrabold text-emerald-700">
                      {fmtBaht(order.Oprice)}
                    </div>
                    <div className="text-xs text-slate-500">THB</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* ================= RIGHT ================= */}
          <div className="space-y-6 lg:sticky lg:top-6 h-fit">
            {/* การดำเนินการ */}
            <Card>
              <div className="p-5 md:p-6">
                <SectionTitle title="การดำเนินการ" desc="ดำเนินการตามขั้นตอนของสถานะปัจจุบัน" />

                <div className="mt-4 space-y-2">
                  {canGoPaymentReview && (
                    <SolidButton onClick={goPaymentReview} tone="amber">
                      ไปตรวจสอบสลิป
                    </SolidButton>
                  )}

                  {canApproveSlip && (
                    <SolidButton onClick={approveSlipToPaid} tone="emerald">
                      อนุมัติสลิป และเปลี่ยนเป็นชำระแล้ว
                    </SolidButton>
                  )}

                  {canCancel && (
                    <SolidButton onClick={cancelOrder} tone="rose">
                      ยกเลิกออเดอร์
                    </SolidButton>
                  )}

                  {!canGoPaymentReview && !canApproveSlip && !canCancel && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                      ไม่มีการดำเนินการที่ทำได้ในสถานะนี้
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 text-xs text-slate-500 bg-slate-50 border-t border-slate-200">
                ระบบจะเดินสถานะไปข้างหน้าเป็นหลักเพื่อลดความผิดพลาด
              </div>
            </Card>

            {/* สลิป (ถ้ามี) */}
            {order.Oslip && (
              <Card>
                <div className="p-5 md:p-6">
                  <SectionTitle title="สลิปการโอน" desc="คลิกเพื่อขยายภาพสำหรับตรวจสอบ" />
                  <button
                    type="button"
                    onClick={() => openImg(getImageUrl(order.Oslip))}
                    className="mt-4 w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-100"
                    aria-label="open-slip"
                  >
                    <img
                      src={getImageUrl(order.Oslip)}
                      className="w-full object-contain"
                      alt="สลิป"
                    />
                  </button>
                </div>
              </Card>
            )}

            {/* จัดส่ง */}
            <Card>
              <div className="p-5 md:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">ข้อมูลจัดส่ง</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      บันทึกขนส่งและเลขพัสดุ ระบบจะเปลี่ยนสถานะตาม flow
                    </p>
                  </div>

                  {canEditShipping ? (
                    <button
                      type="button"
                      onClick={() => setEditShip((v) => !v)}
                      className="shrink-0 text-emerald-700 hover:underline font-semibold text-xs"
                    >
                      {editShip ? "ปิดการแก้ไข" : "แก้ไข"}
                    </button>
                  ) : null}
                </div>

                <div className="mt-4">
                  <div className="flex items-center gap-2">
                    <StatusBadge label={shipStatusMeta.label} tone={shipStatusMeta.tone} />
                    <span className="text-xs text-slate-500">({order.Ostatus})</span>
                  </div>
                </div>

                {/* ฟอร์มจัดส่ง (สร้างใหม่) */}
                {canShowShippingForm && (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <label className="block mb-2 text-sm font-semibold text-slate-700">
                      ขนส่ง
                    </label>
                    <select
                      className="border border-slate-200 p-2.5 rounded-xl w-full mb-3 bg-white focus:outline-none focus:border-emerald-400"
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
                      className="border border-slate-200 p-2.5 rounded-xl w-full mb-3 bg-white focus:outline-none focus:border-emerald-400"
                      value={trackNo}
                      onChange={(e) => setTrackNo(e.target.value)}
                      placeholder="เช่น TH1234567890"
                    />

                    <SolidButton onClick={saveShipping} tone="blue">
                      บันทึกจัดส่ง
                    </SolidButton>

                    <p className="text-xs text-slate-500 mt-2">
                      บันทึกแล้วระบบจะเปลี่ยนสถานะเป็น “กำลังจัดส่ง”
                    </p>
                  </div>
                )}

                {/* แสดงข้อมูลจัดส่ง + โหมดแก้ไข */}
                {hasShippingInfo && (
                  <div className="mt-4">
                    {!editShip ? (
                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <KeyValue k="ขนส่ง" v={order.Oshipping || "—"} />
                        <KeyValue k="เลขพัสดุ" v={order.Otracking || "—"} mono />

                        {canMarkDelivered && (
                          <div className="mt-3">
                            <SolidButton onClick={markDelivered} tone="emerald">
                              ปิดเป็นจัดส่งสำเร็จ
                            </SolidButton>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <label className="block mb-2 text-sm font-semibold text-slate-700">
                          ขนส่ง
                        </label>
                        <select
                          className="border border-slate-200 p-2.5 rounded-xl w-full mb-3 bg-white focus:outline-none focus:border-emerald-400"
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
                          className="border border-slate-200 p-2.5 rounded-xl w-full mb-3 bg-white focus:outline-none focus:border-emerald-400"
                          value={trackNo}
                          onChange={(e) => setTrackNo(e.target.value)}
                        />

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={saveShipping}
                            className="flex-1 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-sm transition"
                          >
                            บันทึก
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditShip(false)}
                            className="flex-1 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold shadow-sm transition"
                          >
                            ยกเลิก
                          </button>
                        </div>

                        <p className="text-xs text-slate-500 mt-2">
                          บันทึกแล้วระบบจะตั้งสถานะเป็น “กำลังจัดส่ง”
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* ยังไม่ถึงเงื่อนไขใส่จัดส่ง และยังไม่มีข้อมูล */}
                {!hasShippingInfo && !canShowShippingForm && (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    {isCOD
                      ? "COD: ใส่ข้อมูลจัดส่งได้เมื่ออยู่สถานะ “รอจัดส่ง (COD)”"
                      : "โอนเงิน: ใส่ข้อมูลจัดส่งได้เมื่ออนุมัติเป็น “ชำระแล้ว”"}
                  </div>
                )}
              </div>

              <div className="px-6 py-4 text-xs text-slate-500 bg-slate-50 border-t border-slate-200">
                แนะนำ: ใส่เลขพัสดุให้ครบเพื่อใช้ติดตามสถานะภายนอกระบบ
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {imgOpen && imgSrc && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={closeImg}
        >
          <div
            className="max-w-4xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-700">Preview</div>
              <button
                type="button"
                onClick={closeImg}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold"
              >
                Close
              </button>
            </div>
            <div className="p-4 bg-white">
              <img
                src={imgSrc}
                alt="preview"
                className="w-full max-h-[75vh] object-contain rounded-xl border border-slate-200 bg-slate-50"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
