"use client";

import { apiFetch } from "@/app/lib/apiFetch";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import BiddingLogsPanel from '@/app/component/admin/BiddingLogsPanel';
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
type ShipStatus = "" | "pending" | "shipped" | "delivered";

const payBadge = (s: PaymentStatus) => {
  const map: Record<PaymentStatus, { cls: string; label: string }> = {
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
  };
  return map[s];
};

const shipBadge = (s: ShipStatus) => {
  const map: Record<ShipStatus, { cls: string; label: string }> = {
    "": { cls: "bg-gray-100 text-gray-800 border-gray-200", label: "—" },
    pending: {
      cls: "bg-gray-100 text-gray-800 border-gray-200",
      label: "รอจัดส่ง",
    },
    shipped: {
      cls: "bg-blue-100 text-blue-800 border-blue-200",
      label: "กำลังจัดส่ง",
    },
    delivered: {
      cls: "bg-emerald-100 text-emerald-800 border-emerald-200",
      label: "จัดส่งสำเร็จ",
    },
  };
  return map[s] ?? map[""];
};

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

  shipping_company?: string | null;
  tracking_number?: string | null;
  shipping_status?: ShipStatus | null;
}

function fmtBaht(n: number) {
  return Number(n || 0).toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function AuctionOrderDetailPage() {
  const { id } = useParams<{ id: string }>();

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

        const d = (await res.json()) as AuctionOrderDetail;
        setData(d);
        setShipComp(d.shipping_company ?? "");
        setTrackNo(d.tracking_number ?? "");
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const paymentStatus: PaymentStatus = useMemo(() => {
    const s = data?.payment_status;
    if (s === "pending_payment" || s === "payment_review" || s === "paid") return s;
    return "pending_payment";
  }, [data]);

  const shippingStatus: ShipStatus = useMemo(() => {
    const s = data?.shipping_status ?? "";
    if (s === "pending" || s === "shipped" || s === "delivered") return s;
    return "";
  }, [data]);

  const hasShippingInfo = Boolean(data?.shipping_company || data?.tracking_number);

  // ตาม flow: ไปข้างหน้าเป็นหลัก
  const canGoToReview = paymentStatus === "pending_payment" && Boolean(data?.slip);
  const canApprovePaid = paymentStatus === "payment_review";
  const canCreateShippingNow = paymentStatus === "paid";
  const canShowShippingForm = canCreateShippingNow && !hasShippingInfo;
  const canEditShipping = hasShippingInfo && shippingStatus !== "delivered";
  const canMarkDelivered = shippingStatus === "shipped";

  const updatePaymentStatus = async (next: PaymentStatus) => {
    if (!data) return;

    // กันย้อนกลับ / กันข้ามขั้น
    const okNext =
      (paymentStatus === "pending_payment" && next === "payment_review") ||
      (paymentStatus === "payment_review" && next === "paid") ||
      (paymentStatus === "pending_payment" && next === "paid"); // เผื่อเคสพิเศษ (อยากตัดขั้น)

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

  if (loading) return <p className="p-6 text-gray-600">⏳ กำลังโหลด...</p>;
  if (!data) return <p className="p-6">ไม่พบข้อมูล</p>;

  const pay = payBadge(paymentStatus);
  const ship = shipBadge(shippingStatus);


  const copyAddress = async () => {
  if (!data) return;

  const text = `ชื่อ: ${data.Cname}
โทร: ${data.Cphone}
ที่อยู่: ${data.Caddress}`;

  try {
    await navigator.clipboard.writeText(text);
    alert("คัดลอกที่อยู่เรียบร้อยแล้ว");
  } catch {
    alert("คัดลอกไม่สำเร็จ");
  }
};

  

  return (
    <div className="p-6 max-w-7xl mx-auto text-black">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT: รายละเอียด + สินค้า + ราคา */}
        <div className="lg:col-span-2 space-y-6">
          {/* รายละเอียดออเดอร์ */}
          <div className="bg-white p-6 rounded-xl shadow border">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h1 className="text-2xl font-bold">
                รายละเอียดออเดอร์{" "}
                <span className="ml-2 font-mono text-blue-700">
                  {makeCode("auc", data.Aid)}
                </span>
              </h1>

              <div className="flex flex-wrap gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${pay.cls}`}>
                  💰 {pay.label}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${ship.cls}`}>
                  🚚 {ship.label}
                </span>
              </div>
            </div>

            <p className="text-sm text-gray-500 mt-2">
              รหัสระบบ: #{data.Aid} • เวลาอัปเดตสลิป:{" "}
              {data.paid_at ? new Date(data.paid_at).toLocaleString("th-TH") : "—"}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mt-4">
              <p>
                <b>ผู้ชนะ:</b> {data.Cname}
              </p>
              <p>
                <b>เบอร์โทร:</b> {data.Cphone}
              </p>
              
  <p>
    <b>ที่อยู่:</b> {data.Caddress}
  </p>

  <div className="md:col-span-2 mt-2">
  <button
    onClick={copyAddress}
    className="inline-flex items-center gap-2 px-3 py-1.5
      rounded-lg border border-gray-300 bg-white
      hover:bg-gray-100 text-sm font-semibold"
  >
    📋 คัดลอกข้อมูลจัดส่ง
  </button>

 
</div>

              <p className="md:col-span-2">
                <b>ราคาชนะ:</b>{" "}
                <span className="font-bold text-red-600">{fmtBaht(data.current_price)} บาท</span>
              </p>
            </div>
          </div>

          {/* สินค้า */}
          <div className="bg-white p-6 rounded-xl shadow border">
            <h2 className="text-xl font-semibold mb-4">สินค้า</h2>

            <div className="flex flex-col sm:flex-row gap-4">
              <img
                src={getImageUrl(data.PROpicture)}
                className="w-full sm:w-56 h-56 object-cover border rounded-lg"
                alt={data.PROname}
              />
              <div className="flex-1">
                <p className="text-lg font-semibold">{data.PROname}</p>
                <p className="text-sm text-gray-500 mt-1">รหัสสินค้า: PRO#{data.PROid}</p>
              </div>
            </div>
          </div>

          {/* ⭐ ฟีเจอร์เสริม: ประวัติการบิด */}
<BiddingLogsPanel aid={data?.Aid ?? null} />

          

          {/* สรุปราคา */}
          <div className="bg-white p-6 rounded-xl shadow border">
            <div className="flex justify-between text-lg font-bold">
              <span>ยอดชำระ (ราคาชนะ)</span>
              <span className="text-red-600">{fmtBaht(data.current_price)} บาท</span>
            </div>
          </div>
        </div>

        {/* RIGHT: การจัดการ */}
        <div className="space-y-6 lg:sticky lg:top-6 h-fit">
          {/* การดำเนินการ */}
          <div className="bg-white p-6 rounded-xl shadow border">
            <h2 className="text-xl font-semibold mb-4">การดำเนินการ</h2>

            {/* ✅ เปลี่ยนสถานะแบบ “ไปข้างหน้า” */}
            {paymentStatus === "pending_payment" && (
              <div className="space-y-2">
                <button
                  disabled={!canGoToReview}
                  onClick={() => updatePaymentStatus("payment_review")}
                  className={`w-full py-2 rounded font-semibold text-white ${
                    canGoToReview ? "bg-yellow-500 hover:bg-yellow-600" : "bg-gray-300 cursor-not-allowed"
                  }`}
                  title={!canGoToReview ? "ต้องมีสลิปก่อนถึงจะเข้าสู่ตรวจสอบได้" : ""}
                >
                  🔍 รอตรวจสอบสลิป
                </button>

               
                {/* <button
                  onClick={() => {
                    if (!confirm("ยืนยันเปลี่ยนเป็นชำระแล้ว (paid) ?")) return;
                    updatePaymentStatus("paid");
                  }}
                  className="w-full py-2 rounded font-semibold text-white bg-green-600 hover:bg-green-700"
                >
                  ✅ ยืนยันชำระแล้ว (ทางลัด)
                </button> */}

                
              </div>
            )}

            {paymentStatus === "payment_review" && (
              <button
                onClick={() => updatePaymentStatus("paid")}
                className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 font-semibold"
              >
                ✅ อนุมัติสลิป 
              </button>
            )}

            {paymentStatus === "paid" && (
              <div className="text-sm text-gray-600">
                ✅ ชำระแล้ว — ต่อไปกรอกข้อมูลจัดส่งด้านล่าง
              </div>
            )}
          </div>{/* สลิป */}

          <Link
  href={`/admin/auction-orders/${data.Aid}/receipt`}
  target="_blank"
  className="block w-full text-center bg-indigo-600 text-white py-2 rounded
             hover:bg-indigo-700 font-semibold mb-2"
>
  🧾 พิมพ์ใบเสร็จ
</Link>

          

          <div className="bg-white p-6 rounded-xl shadow border">
            <h3 className="font-semibold mb-3">สลิปการโอน</h3>

            {data.slip ? (
              <>
                <img src={getImageUrl(data.slip)} className="w-full max-w-md rounded border" alt="slip" />
                {data.paid_at && (
                  <p className="text-sm text-gray-600 mt-2">
                    เวลาอัปโหลด: {new Date(data.paid_at).toLocaleString("th-TH")}
                  </p>
                )}
              </>
            ) : (
              <p className="text-gray-500">ยังไม่มีสลิป</p>
            )}
          </div>



          {/* จัดส่ง */}
          <div className="bg-white p-6 rounded-xl shadow border">
            <h3 className="font-semibold mb-3">ข้อมูลจัดส่ง</h3>

            {/* ฟอร์มจัดส่ง */}
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
              </div>
            )}

            {/* แสดงข้อมูลจัดส่ง */}
            {hasShippingInfo && (
              <div className="text-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${ship.cls}`}>
                    🚚 {ship.label}
                  </span>

                  {canEditShipping && (
                    <button
                      onClick={() => setEditShip((v) => !v)}
                      className="text-blue-600 hover:underline font-semibold text-xs"
                    >
                      {editShip ? "ปิดการแก้ไข" : "แก้ไขข้อมูลจัดส่ง"}
                    </button>
                  )}
                </div>

                <p>
                  <b>ขนส่ง:</b> {data.shipping_company || "—"}
                </p>
                <p>
                  <b>เลขพัสดุ:</b> {data.tracking_number || "—"}
                </p>

                {editShip && canEditShipping && (
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
                  </div>
                )}

                {canMarkDelivered && (
                  <button
                    onClick={markDelivered}
                    className="mt-2 w-full bg-emerald-700 text-white py-2 rounded hover:bg-emerald-800 font-semibold"
                  >
                    ✔ ปิดเป็นจัดส่งสำเร็จ (delivered)
                  </button>
                )}
              </div>
            )}

            {!hasShippingInfo && paymentStatus !== "paid" && (
              <p className="text-sm text-gray-500">
                * ต้องชำระเงินแล้ว (paid) ก่อน ถึงจะกรอกข้อมูลจัดส่งได้
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
