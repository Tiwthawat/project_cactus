"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/app/lib/apiFetch";
import Link from "next/link";

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

const makeCode = (prefix: string, id: number) =>
  `${prefix}:${String(id).padStart(4, "0")}`;

type OrderStatus =
  | "pending_payment"
  | "payment_review"
  | "paid"
  | "shipping"
  | "delivered"
  | "cancelled";

const statusBadge = (status: OrderStatus) => {
  const map: Record<OrderStatus, { cls: string; label: string }> = {
    pending_payment: {
      cls: "bg-red-100 text-red-800 border-red-200",
      label: "รอชำระเงิน",
    },
    payment_review: {
      cls: "bg-yellow-100 text-yellow-800 border-yellow-200",
      label: "รอตรวจสอบสลิป",
    },
    paid: {
      cls: "bg-green-100 text-green-800 border-green-200",
      label: "ชำระเงินแล้ว",
    },
    shipping: {
      cls: "bg-blue-100 text-blue-800 border-blue-200",
      label: "กำลังจัดส่ง",
    },
    delivered: {
      cls: "bg-emerald-100 text-emerald-800 border-emerald-200",
      label: "จัดส่งสำเร็จ",
    },
    cancelled: {
      cls: "bg-gray-200 text-gray-800 border-gray-300",
      label: "ยกเลิกแล้ว",
    },
  };
  return map[status];
};

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

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [order, setOrder] = useState<FullOrder | null>(null);
  const [loading, setLoading] = useState(true);

  const [shipComp, setShipComp] = useState("");
  const [trackNo, setTrackNo] = useState("");
  const [editShip, setEditShip] = useState(false);

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

  if (loading) return <p className="p-6 text-gray-600">⏳ กำลังโหลด...</p>;
  if (!order) return <p className="p-6">ไม่พบข้อมูลคำสั่งซื้อ</p>;

  const isCOD = order.Opayment === "cod";
  const badge = statusBadge(order.Ostatus);

  // ✅ UI label สำหรับ COD: pending_payment ให้แสดง “รอจัดส่ง (COD)”
  const uiStatusLabel =
    isCOD && order.Ostatus === "pending_payment"
      ? "รอจัดส่ง (COD)"
      : badge.label;

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
      alert("📋 คัดลอกข้อมูลจัดส่งแล้ว");
    } catch {
      alert("ไม่สามารถคัดลอกได้");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto text-black">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ================= LEFT : รายละเอียด + สินค้า + ราคา ================= */}
        <div className="lg:col-span-2 space-y-6">
          {/* รายละเอียดคำสั่งซื้อ */}
          <div className="bg-white p-6 rounded-xl shadow border">
            <h1 className="text-2xl font-bold mb-1">
              รายละเอียดคำสั่งซื้อ
              <span className="ml-2 font-mono text-blue-700">
                {makeCode("ord", order.Oid)}
              </span>
            </h1>

            <p className="text-sm text-gray-500 mb-4">
              วันที่สั่งซื้อ: {new Date(order.Odate).toLocaleString("th-TH")}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <p>
                <b>ลูกค้า:</b> {order.Cname}
              </p>
              <p>
                <b>เบอร์โทร:</b> {order.Cphone}
              </p>
              <p className="md:col-span-2">
                <b>ที่อยู่:</b> {order.Caddress}
              </p>

              <div className="md:col-span-2 mt-2">
                <button
                  onClick={copyShippingAddress}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-sm font-semibold"
                >
                  📋 คัดลอกข้อมูลจัดส่ง
                </button>
              </div>

              <p>
                <b>วิธีชำระเงิน:</b>{" "}
                <span className="text-blue-600 font-semibold">
                  {isCOD ? "ชำระปลายทาง (COD)" : "โอนผ่านบัญชี"}
                </span>
              </p>

              <p className="flex items-center gap-2">
                <b>สถานะ:</b>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold border ${badge.cls}`}
                  title={order.Ostatus}
                >
                  {uiStatusLabel}
                </span>
              </p>
            </div>
          </div>

          {/* รายการสินค้า */}
          <div className="bg-white p-6 rounded-xl shadow border">
            <h2 className="text-xl font-semibold mb-4">รายการสินค้า</h2>

            {order.items.map((item) => {
              const pics = toPictures(item.Ppicture);
              const main = firstPicture(item.Ppicture);

              return (
                <div
                  key={item.Oiid}
                  className="border-b py-4 last:border-b-0"
                >
                  <div className="flex gap-4">
                    <img
                      src={getImageUrl(main)}
                      className="w-20 h-20 rounded object-cover border"
                      alt={item.Pname}
                    />
                    <div className="flex-1">
                      <p className="font-medium">{item.Pname}</p>
                      <p className="text-sm text-gray-600">
                        จำนวน {item.Oquantity} × {fmtBaht(item.Oprice)} บาท
                      </p>
                    </div>
                    <div className="font-semibold text-right">
                      {fmtBaht(item.Oquantity * item.Oprice)} บาท
                    </div>
                  </div>

                  {/* ✅ ถ้ามีหลายรูป โชว์ thumbnail */}
                  {pics.length > 1 && (
                    <div className="mt-3 ml-[96px] flex gap-2 flex-wrap">
                      {pics.slice(0, 6).map((p, idx) => (
                        <img
                          key={idx}
                          src={getImageUrl(p)}
                          className="w-10 h-10 rounded border object-cover"
                          alt={`${item.Pname}-${idx + 1}`}
                        />
                      ))}
                      {pics.length > 6 && (
                        <span className="text-xs text-gray-500 self-center">
                          +{pics.length - 6}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* สรุปราคา */}
          <div className="bg-white p-6 rounded-xl shadow border">
            <div className="flex justify-between text-lg font-bold">
              <span>ยอดรวมสุทธิ</span>
              <span className="text-red-600">{fmtBaht(order.Oprice)} บาท</span>
            </div>
          </div>
        </div>

        {/* ================= RIGHT : การจัดการ ================= */}
        <div className="space-y-6 lg:sticky lg:top-6 h-fit">
          {/* การดำเนินการ */}
          <div className="bg-white p-6 rounded-xl shadow border">
            <h2 className="text-xl font-semibold mb-4">การดำเนินการ</h2>

            {/* โอน: ไปตรวจสลิป */}
            {canGoPaymentReview && (
              <button
                onClick={goPaymentReview}
                className="w-full bg-yellow-500 text-white py-2 rounded hover:bg-yellow-600 mb-2"
              >
                🔍 ไปตรวจสอบสลิป
              </button>
            )}

            {/* โอน: อนุมัติสลิป */}
            {canApproveSlip && (
              <button
                onClick={approveSlipToPaid}
                className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 mb-2"
              >
                ✅ อนุมัติสลิป (ชำระแล้ว)
              </button>
            )}

            {/* ยกเลิก */}
            {canCancel && (
              <button
                onClick={cancelOrder}
                className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700"
              >
                ❌ ยกเลิกออเดอร์
              </button>
            )}

            {!canGoPaymentReview && !canApproveSlip && !canCancel && (
              <p className="text-sm text-gray-500">
                * ไม่มีการดำเนินการที่ทำได้ในสถานะนี้
              </p>
            )}
          </div>

          <Link
            href={`/admin/orders/${order.Oid}/receipt`}
            target="_blank"
            className="block w-full text-center bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 font-semibold mb-2"
          >
            🧾 พิมพ์ใบเสร็จ
          </Link>

          {/* สลิป (ถ้ามี) */}
          {order.Oslip && (
            <div className="bg-white p-6 rounded-xl shadow border">
              <h3 className="font-semibold mb-2">สลิปการโอน</h3>
              <img
                src={getImageUrl(order.Oslip)}
                className="w-full rounded border"
                alt="สลิป"
              />
            </div>
          )}

          {/* จัดส่ง */}
          <div className="bg-white p-6 rounded-xl shadow border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">ข้อมูลจัดส่ง</h3>

              {hasShippingInfo && order.Ostatus !== "delivered" && (
                <button
                  onClick={() => setEditShip((v) => !v)}
                  className="text-blue-600 hover:underline font-semibold text-xs"
                >
                  {editShip ? "ปิดการแก้ไข" : "แก้ไขข้อมูลจัดส่ง"}
                </button>
              )}
            </div>

            {/* ฟอร์มจัดส่ง (สร้างใหม่) */}
            {canShowShippingForm && (
              <div className="bg-gray-50 p-4 rounded border">
                <label className="block mb-2 text-sm font-semibold">ขนส่ง</label>
                <select
                  className="border p-2 rounded w-full mb-3 bg-white"
                  value={shipComp}
                  onChange={(e) => setShipComp(e.target.value)}
                >
                  <option value="">เลือกขนส่ง</option>
                  <option value="Flash">Flash</option>
                  <option value="J&T">J&T</option>
                  <option value="Kerry">Kerry</option>
                  <option value="ThaiPost">ไปรษณีย์ไทย</option>
                </select>

                <label className="block mb-2 text-sm font-semibold">เลขพัสดุ</label>
                <input
                  className="border p-2 rounded w-full mb-3 bg-white"
                  value={trackNo}
                  onChange={(e) => setTrackNo(e.target.value)}
                  placeholder="เช่น TH1234567890"
                />

                <button
                  onClick={saveShipping}
                  className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-semibold"
                >
                  🚚 บันทึกจัดส่ง
                </button>

                <p className="text-xs text-gray-500 mt-2">
                  * บันทึกแล้วระบบจะเปลี่ยนสถานะเป็น “กำลังจัดส่ง”
                </p>
              </div>
            )}

            {/* แสดงข้อมูลจัดส่ง + โหมดแก้ไข */}
            {hasShippingInfo && (
              <div className="text-sm space-y-2">
                <span
                  className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${
                    order.Ostatus === "delivered"
                      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                      : order.Ostatus === "shipping"
                      ? "bg-blue-100 text-blue-800 border-blue-200"
                      : "bg-gray-100 text-gray-800 border-gray-200"
                  }`}
                >
                  🚚{" "}
                  {order.Ostatus === "delivered"
                    ? "จัดส่งสำเร็จ"
                    : order.Ostatus === "shipping"
                    ? "กำลังจัดส่ง"
                    : "—"}
                </span>

                {!editShip ? (
                  <>
                    <p>
                      <b>ขนส่ง:</b> {order.Oshipping || "—"}
                    </p>
                    <p>
                      <b>เลขพัสดุ:</b> {order.Otracking || "—"}
                    </p>

                    {canMarkDelivered && (
                      <button
                        onClick={markDelivered}
                        className="mt-2 w-full bg-emerald-700 text-white py-2 rounded hover:bg-emerald-800 font-semibold"
                      >
                        ✔ ปิดเป็นจัดส่งสำเร็จ (delivered)
                      </button>
                    )}
                  </>
                ) : (
                  <div className="mt-2 bg-gray-50 p-4 rounded border">
                    <label className="block mb-2 text-sm font-semibold">ขนส่ง</label>
                    <select
                      className="border p-2 rounded w-full mb-3 bg-white"
                      value={shipComp}
                      onChange={(e) => setShipComp(e.target.value)}
                    >
                      <option value="">เลือกขนส่ง</option>
                      <option value="Flash">Flash</option>
                      <option value="J&T">J&T</option>
                      <option value="Kerry">Kerry</option>
                      <option value="ThaiPost">ไปรษณีย์ไทย</option>
                    </select>

                    <label className="block mb-2 text-sm font-semibold">เลขพัสดุ</label>
                    <input
                      className="border p-2 rounded w-full mb-3 bg-white"
                      value={trackNo}
                      onChange={(e) => setTrackNo(e.target.value)}
                    />

                    <div className="flex gap-2">
                      <button
                        onClick={saveShipping}
                        className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-semibold"
                      >
                        บันทึก
                      </button>
                      <button
                        onClick={() => setEditShip(false)}
                        className="flex-1 border py-2 rounded hover:bg-white font-semibold"
                      >
                        ยกเลิก
                      </button>
                    </div>

                    <p className="text-xs text-gray-500 mt-2">
                      * บันทึกแล้วระบบจะเซ็ตสถานะเป็น “กำลังจัดส่ง”
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ยังไม่ถึงเงื่อนไขใส่จัดส่ง และยังไม่มีข้อมูล */}
            {!hasShippingInfo && !canShowShippingForm && (
              <p className="text-sm text-gray-500">
                {isCOD
                  ? "* COD: ใส่ข้อมูลจัดส่งได้เมื่ออยู่สถานะ “รอจัดส่ง (COD)”"
                  : "* โอนเงิน: ใส่ข้อมูลจัดส่งได้เมื่ออนุมัติเป็น “ชำระแล้ว”"}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
