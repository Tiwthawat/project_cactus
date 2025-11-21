"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";

const getImageUrl = (path: string | null) => {
  if (!path) return "/no-image.png";

  let clean = path.trim();

  // แบบเริ่มต้นด้วย http
  if (clean.startsWith("http")) return clean;

  // แบบเริ่มด้วย /
  if (clean.startsWith("/")) return `${API}${clean}`;

  // แบบไม่มี / ให้เติม
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


interface AuctionDetail {
  Aid: number;
  PROid: number;
  PROname: string;
  PROpicture: string;
  PROstatus: string;

  Cname: string;
  Cphone: string;
  Caddress: string;

  current_price: number;

  amount: number | null;
  slip: string | null;
  paid_at: string | null;
  payment_status: string | null;
}

export default function AuctionOrderDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState<AuctionDetail | null>(null);
  const [updating, setUpdating] = useState(false);

  // โหลดข้อมูลรอบประมูล
  useEffect(() => {
    if (!id) return;
    fetch(`${API}/auction-orders/${id}`)
      .then((res) => res.json())
      .then(setData)
      .catch(() => setData(null));
  }, [id]);

  if (!data) return <p className="p-6">ไม่พบข้อมูล</p>;

  const makeCode = (prefix: string, id: number) =>
    `${prefix}:${String(id).padStart(4, "0")}`;



  // เปลี่ยนสถานะสินค้า (PROstatus)
  const updateStatus = async (newStatus: string) => {
    setUpdating(true);
    await fetch(`${API}/auction-orders/${data.Aid}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

      setData({
    ...data,
    PROstatus: newStatus,
    payment_status: newStatus,
  });
    setUpdating(false);
  };

  return (
    <div className="p-6 text-black max-w-6xl mx-auto">
      {/* ปุ่มกลับ */}
      <button
        onClick={() => window.history.back()}
        className="text-blue-600 hover:underline mb-4 block"
      >
        ← กลับหน้าออเดอร์ประมูล
      </button>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ⬅️ ฝั่งซ้าย: รายละเอียดคำสั่งซื้อ */}
        <div className="w-full lg:w-1/2 bg-white p-4 rounded shadow">
          <h1 className="text-2xl font-bold mb-1">
            รายละเอียดออเดอร์ประมูล
            <span className="ml-2 font-mono text-blue-700">
              {makeCode("auc", data.Aid)}
            </span>
          </h1>

          <p className="text-sm text-gray-600 mb-4">รหัสระบบ: #{data.Aid}</p>

          {/* รายละเอียดผู้ชนะ */}
          <p className="mb-2">ผู้ชนะ: {data.Cname}</p>
          <p className="mb-2">เบอร์โทร: {data.Cphone}</p>
          <p className="mb-2">ที่อยู่จัดส่ง: {data.Caddress}</p>

          {/* ราคาชนะ */}
          <p className="mb-3 text-lg">
            ราคาชนะประมูล:
            <span className="font-bold text-red-600 ml-1">
              {data.current_price} บาท
            </span>
          </p>

          {/* เปลี่ยนสถานะ */}
          <label className="block mb-1 font-medium">สถานะสินค้า:</label>
          <select
            className={`border p-2 rounded w-full mb-4 text-sm font-medium ${statusColor(
              data.PROstatus
            )}`}
            value={data.PROstatus}
            onChange={(e) => updateStatus(e.target.value)}
            disabled={updating}
          >

            <option value="pending_payment">รอชำระเงิน</option>
            <option value="payment_review">รอตรวจสอบสลิป</option>
            <option value="paid">ชำระเงินแล้ว</option>
            <option value="shipping">กำลังจัดส่ง</option>
            <option value="delivered">จัดส่งสำเร็จ</option>
          </select>

          {/* สลิป */}
          {/* กล่องสลิปการโอน */}
{data.slip ? (
  <div className="mt-4 bg-gray-50 p-4 rounded border">
    <p className="font-medium mb-2">สลิปการโอน:</p>

    <img
      src={getImageUrl(data.slip)}
      alt="slip"
      className="w-72 border rounded-lg shadow mb-2"
    />

    {/* วันที่ชำระเงิน */}
    {data.paid_at && (
      <p className="text-sm text-gray-700">
        อัปโหลดเมื่อ:{" "}
        {new Date(data.paid_at).toLocaleString("th-TH")}
      </p>
    )}

    {/* สถานะชำระเงิน */}
    {data.payment_status && (
      <p className="text-sm mt-1">
        สถานะชำระเงิน:
        <span className="ml-1 font-semibold text-blue-700">
          {data.payment_status}
        </span>
      </p>
    )}
  </div>
) : (
  <p className="text-gray-500 mt-4">ยังไม่มีสลิปการโอน</p>
)}



        </div>

        {/* ➡️ ฝั่งขวา: สินค้า */}
        <div className="w-full lg:w-1/2 bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">ข้อมูลสินค้า</h2>

          <img
            src={getImageUrl(data.PROpicture)}
            alt={data.PROname}
            className="w-60 h-60 object-cover border rounded mb-4"
          />


          <p className="font-medium">ชื่อสินค้า: {data.PROname}</p>

          <p className="mt-2">
            สถานะปัจจุบัน:
            <span
              className={`ml-2 px-2 py-1 rounded text-sm font-medium ${statusColor(
                data.PROstatus
              )}`}
            >
              {data.PROstatus}
            </span>
          </p>

        </div>
      </div>
    </div>
  );
}
