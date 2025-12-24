"use client";
import { apiFetch } from '@/app/lib/apiFetch';
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";

const getImageUrl = (path: string | null) => {
  if (!path) return "/no-image.png";
  let clean = path.trim();
  if (clean.startsWith("http")) return clean;
  if (clean.startsWith("/")) return `${API}${clean}`;
  return `${API}/${clean}`;
};

const statusColor = (status: string) => {
  switch (status) {
    case "pending_payment":
      return "bg-red-100 text-red-800";
    case "payment_review":
      return "bg-yellow-100 text-yellow-800";
    case "paid":
      return "bg-green-100 text-green-800";
    case "shipping":
      return "bg-blue-100 text-blue-800";
    case "delivered":
      return "bg-emerald-100 text-emerald-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
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
  payment_status: string | null;

  shipping_company?: string | null;
  tracking_number?: string | null;
  shipping_status?: string | null;
}

export default function AuctionOrderDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState<AuctionOrderDetail | null>(null);

  const [shipComp, setShipComp] = useState("");
  const [trackNo, setTrackNo] = useState("");
  const [editShip, setEditShip] = useState(false);

 useEffect(() => {
  if (!id) return;

  const load = async () => {
    try {
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
    }
  };

  load();
}, [id]);


  if (!data) return <p className="p-6">ไม่พบข้อมูล</p>;

  const makeCode = (prefix: string, id: number) =>
    `${prefix}:${String(id).padStart(4, "0")}`;

  // อัปเดตสถานะชำระเงิน
  const updatePaymentStatus = async (newStatus: string) => {
    const res = await apiFetch(`${API}/auction-orders/${data.Aid}/status`, {
  method: "PATCH",
  body: JSON.stringify({ status: newStatus }),
});


    if (!res.ok) return alert("แก้สถานะไม่สำเร็จ");

    setData({ ...data, payment_status: newStatus });
  };

  // อัปเดตข้อมูลจัดส่ง
  const saveShipping = async () => {
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

  // กดยืนยัน delivered
  const markDelivered = async () => {
    const res = await apiFetch(`${API}/auction-orders/${data.Aid}/delivered`, {
      method: "PATCH",
    });

    if (!res.ok) return alert("อัปเดตสถานะไม่สำเร็จ");

    alert("อัปเดตเป็น delivered แล้ว");
    setData({ ...data, shipping_status: "delivered" });
  };

  return (
    <div className="p-6 text-black max-w-6xl mx-auto">

      <div className="flex flex-col lg:flex-row gap-6">

        {/* LEFT : รายละเอียดออเดอร์ */}
        <div className="w-full lg:w-1/2 bg-white p-4 rounded shadow">
          <h1 className="text-2xl font-bold mb-1">
            รายละเอียดออเดอร์{" "}
            <span className="ml-2 font-mono text-blue-700">
              {makeCode("auc", data.Aid)}
            </span>
          </h1>

          <p className="text-sm text-gray-600 mb-4">รหัสระบบ: #{data.Aid}</p>

          <p className="mb-2">ผู้ชนะ: {data.Cname}</p>
          <p className="mb-2">เบอร์โทร: {data.Cphone}</p>
          <p className="mb-2">ที่อยู่: {data.Caddress}</p>

          <p className="mb-3 text-lg">
            ราคาชนะ:
            <span className="font-bold text-red-600 ml-1">
              {data.current_price} บาท
            </span>
          </p>

          {/* สถานะ */}
          <label className="block mb-1 font-medium">สถานะชำระเงิน:</label>
          <select
            className={`border p-2 rounded w-full mb-4 text-sm font-medium ${statusColor(
              data.payment_status || ""
            )}`}
            value={data.payment_status || ""}
            onChange={(e) => updatePaymentStatus(e.target.value)}
          >
            <option value="pending_payment">รอชำระเงิน</option>
            <option value="payment_review">รอตรวจสอบสลิป</option>
            <option value="paid">ชำระเงินแล้ว</option>
          </select>

          {/* สลิป */}
          {data.slip ? (
            <div className="mt-4 bg-gray-50 p-4 rounded border">
              <p className="font-medium mb-2">สลิป:</p>
              <img
                src={getImageUrl(data.slip)}
                className="w-72 border rounded mb-2"
              />
              {data.paid_at && (
                <p className="text-sm text-gray-700">
                  เวลาอัปโหลด:{" "}
                  {new Date(data.paid_at).toLocaleString("th-TH")}
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-500 mt-4">ยังไม่มีสลิป</p>
          )}
        </div>

        {/* RIGHT : ข้อมูลสินค้า + จัดส่ง */}
        <div className="w-full lg:w-1/2 bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">ข้อมูลสินค้า</h2>

          <img
            src={getImageUrl(data.PROpicture)}
            className="w-60 h-60 object-cover border rounded mb-4"
          />

          <p className="font-medium mb-4">ชื่อสินค้า: {data.PROname}</p>

         {/* ⭐ ส่วนจัดส่ง */}
<div className="bg-gray-50 p-4 rounded border">

  <h3 className="font-semibold mb-3">ข้อมูลจัดส่ง</h3>

  {/* 1) ถ้าจ่ายเงินแล้วแต่ยังไม่มีข้อมูลจัดส่ง → ให้โชว์ฟอร์มกรอกทันที */}
  {data.payment_status === "paid" && !(data.shipping_company || data.tracking_number) && (
    <div className="bg-white p-3 border rounded">
      <label className="block mb-2">ขนส่ง</label>
      <select
        className="border p-2 rounded w-full mb-3"
        value={shipComp}
        onChange={(e) => setShipComp(e.target.value)}
      >
        <option value="">เลือกขนส่ง</option>
        <option value="Flash">Flash</option>
        <option value="J&T">J&T</option>
        <option value="Kerry">Kerry</option>
        <option value="ThaiPost">ไปรษณีย์ไทย</option>
      </select>

      <label className="block mb-2">เลขพัสดุ</label>
      <input
        className="border p-2 rounded w-full mb-3"
        value={trackNo}
        onChange={(e) => setTrackNo(e.target.value)}
      />

      <button
        onClick={saveShipping}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        บันทึกจัดส่ง
      </button>
    </div>
  )}

  {/* 2) ถ้ามีข้อมูลจัดส่งแล้ว → แสดงข้อมูล + ปุ่มแก้ไข */}
  {(data.shipping_company || data.tracking_number) && (
    <>
      <p><b>ขนส่ง:</b> {data.shipping_company || "—"}</p>
      <p><b>เลขพัสดุ:</b> {data.tracking_number || "—"}</p>
      <p><b>สถานะ:</b> {data.shipping_status || "—"}</p>

      <button
        onClick={() => setEditShip(true)}
        className="bg-yellow-500 text-white px-3 py-2 rounded hover:bg-yellow-600 mt-3"
      >
        แก้ไขข้อมูลจัดส่ง
      </button>
    </>
  )}

  {/* 3) ฟอร์มแก้ไข */}
  {editShip && (
    <div className="mt-4 p-3 border rounded bg-white">
      <label className="block mb-2">ขนส่ง</label>
      <select
        className="border p-2 rounded w-full mb-3"
        value={shipComp}
        onChange={(e) => setShipComp(e.target.value)}
      >
        <option value="">เลือกขนส่ง</option>
        <option value="Flash">Flash</option>
        <option value="J&T">J&T</option>
        <option value="Kerry">Kerry</option>
        <option value="ThaiPost">ไปรษณีย์ไทย</option>
      </select>

      <label className="block mb-2">เลขพัสดุ</label>
      <input
        className="border p-2 rounded w-full mb-3"
        value={trackNo}
        onChange={(e) => setTrackNo(e.target.value)}
      />

      <button
        onClick={saveShipping}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        บันทึกจัดส่ง
      </button>

      <button
        onClick={() => setEditShip(false)}
        className="ml-3 px-4 py-2 rounded border"
      >
        ยกเลิก
      </button>
    </div>
  )}

  {/* 4) ปุ่ม delivered */}
  {data.shipping_status === "shipped" && (
    <button
      onClick={markDelivered}
      className="mt-4 bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800"
    >
      ✔ ปิดเป็นจัดส่งสำเร็จ (delivered)
    </button>
  )}

</div>

        </div>
      </div>
    </div>
  );
}
