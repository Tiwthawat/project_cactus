"use client";

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
    case "cancelled":
      return "bg-gray-200 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

interface OrderItem {
  Oiid: number;
  Pname: string;
  Oquantity: number;
  Oprice: number;
  Ppicture: string;
}

interface FullOrder {
  Oid: number;
  Oprice: number;
  Odate: string;
  Ostatus: string;

  Cname: string;
  Cphone: string;
  Caddress: string;

  Oslip: string | null;
  Opayment: string;

  Oshipping: string | null;
  Otracking: string | null;

  items: OrderItem[];
}

export default function OrderDetailPage() {
  const { id } = useParams();

  const [order, setOrder] = useState<FullOrder | null>(null);

  const [shipComp, setShipComp] = useState("");
  const [trackNo, setTrackNo] = useState("");
  const [editShip, setEditShip] = useState(false);

  // โหลดข้อมูลออเดอร์
  useEffect(() => {
    if (!id) return;
    fetch(`${API}/orders/${id}`)
      .then((res) => res.json())
      .then((d) => {
        setOrder(d);
        setShipComp(d.Oshipping ?? "");
        setTrackNo(d.Otracking ?? "");
      })
      .catch(() => setOrder(null));
  }, [id]);

  if (!order) return <p className="p-6">ไม่พบข้อมูลคำสั่งซื้อ</p>;

  const makeCode = (prefix: string, id: number) =>
    `${prefix}:${String(id).padStart(4, "0")}`;

  // เปลี่ยนสถานะคำสั่งซื้อ
  const updateStatus = async (newStatus: string) => {
    const res = await fetch(`${API}/orders/${order.Oid}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (!res.ok) return alert("แก้สถานะไม่สำเร็จ");

    setOrder({ ...order, Ostatus: newStatus });
  };

  // บันทึกข้อมูลจัดส่ง
  const saveShipping = async () => {
    if (!shipComp || !trackNo) {
      alert("กรอกข้อมูลให้ครบก่อน");
      return;
    }

    const res = await fetch(`${API}/orders/${order.Oid}/shipping`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        Oshipping: shipComp,
        Otracking: trackNo,
        Ostatus: "shipping",
      }),
    });

    if (!res.ok) return alert("บันทึกจัดส่งไม่สำเร็จ");

    alert("บันทึกจัดส่งแล้ว");

    setOrder({
      ...order,
      Oshipping: shipComp,
      Otracking: trackNo,
      Ostatus: "shipping",
    });

    setEditShip(false);
  };

  // ปิดเป็น delivered
  const markDelivered = async () => {
    const res = await fetch(`${API}/orders/${order.Oid}/delivered`, {
      method: "PATCH",
    });

    if (!res.ok) return alert("อัปเดตสถานะไม่สำเร็จ");

    alert("อัปเดตเป็น delivered แล้ว");

    setOrder({
      ...order,
      Ostatus: "delivered",
    });
  };

  return (
    <div className="p-6 text-black max-w-6xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-6">

        {/* LEFT : ข้อมูลคำสั่งซื้อ */}
        <div className="w-full lg:w-1/2 bg-white p-4 rounded shadow">
          <h1 className="text-2xl font-bold mb-1">
            รายละเอียดคำสั่งซื้อ{" "}
            <span className="ml-2 font-mono text-blue-700">
              {makeCode("ord", order.Oid)}
            </span>
          </h1>

          <p className="text-sm text-gray-600 mb-4">รหัสระบบ: #{order.Oid}</p>

          <p>ลูกค้า: {order.Cname}</p>
          <p>เบอร์โทร: {order.Cphone}</p>
          <p>ที่อยู่: {order.Caddress}</p>

          <p className="text-lg mt-4 mb-2">
            วิธีชำระเงิน:{" "}
            <b className="text-blue-700">
              {order.Opayment === "transfer" ? "โอนผ่านบัญชี" : "ชำระปลายทาง (COD)"}
            </b>
          </p>

          <label className="block mt-4 mb-1 font-medium">สถานะ:</label>
          <select
            className={`border p-2 rounded w-full text-sm font-medium ${statusColor(
              order.Ostatus
            )}`}
            value={order.Ostatus}
            onChange={(e) => updateStatus(e.target.value)}
          >
            <option value="pending_payment">
  {order.Opayment === "cod" ? "รอจัดส่ง" : "รอชำระเงิน"}
</option>

            <option value="payment_review">รอตรวจสอบสลิป</option>
            <option value="paid">ชำระเงินแล้ว</option>
            <option value="shipping">กำลังจัดส่ง</option>
            <option value="delivered">จัดส่งสำเร็จ</option>
            <option value="cancelled">ยกเลิกแล้ว</option>
          </select>

          <p className="text-lg font-semibold mt-4">
            ยอดรวม: <span className="text-red-600">{order.Oprice} บาท</span>
          </p>

          {/* สลิป */}
          {order.Oslip && (
            <div className="mt-4 bg-gray-50 p-4 rounded border">
              <p className="font-medium mb-2">สลิปการโอน:</p>
              <img
                src={getImageUrl(order.Oslip)}
                className="w-72 border rounded mb-2"
              />
            </div>
          )}
        </div>

        {/* RIGHT : จัดส่ง + สินค้า */}
        <div className="w-full lg:w-1/2 bg-white p-4 rounded shadow">

          <h2 className="text-xl font-semibold mb-3">รายการสินค้า</h2>

          {order.items.length === 0 ? (
            <p className="text-gray-500">ไม่มีสินค้า</p>
          ) : (
            order.items.map((item, index) => {
              const pics = item.Ppicture ? item.Ppicture.split(",") : [];
              return (
                <div key={index} className="flex gap-3 border-b py-3">
                  <img
                    src={getImageUrl(pics[0] || "")}
                    className="w-20 h-20 object-cover rounded border"
                  />
                  <div>
                    <p className="font-medium">{item.Pname}</p>
                    <p>จำนวน: {item.Oquantity}</p>
                    <p>ราคา: {item.Oprice} บาท</p>
                  </div>
                </div>
              );
            })
          )}

          {/* ⭐ จัดส่ง */}
          <div className="mt-6 bg-gray-50 p-4 rounded border">
            <h3 className="font-semibold mb-3">ข้อมูลจัดส่ง</h3>
            

            {/* ถ้าจ่ายเงินแล้ว แต่ยังไม่มีข้อมูลจัดส่ง */}
           {/* ⭐ ฟอร์มเพิ่มข้อมูลจัดส่ง (รองรับทั้ง โอน & COD) */}
{
  (
    // COD: ให้ใส่เลขพัสดุได้ตั้งแต่ pending_payment
    (order.Opayment === "cod" && order.Ostatus === "pending_payment") ||

    // โอน: ต้องชำระแล้ว
    (order.Opayment !== "cod" && order.Ostatus === "paid")
  )
  &&
  // ยังไม่มีข้อมูลจัดส่ง
  !(order.Oshipping || order.Otracking)
  &&
  (
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
  )
}


            {/* มีข้อมูลจัดส่งแล้ว */}
            {(order.Oshipping || order.Otracking) && (
              <>
                <p>🚚 <b>ขนส่ง:</b> {order.Oshipping}</p>
                <p>📦 <b>เลขพัสดุ:</b> {order.Otracking}</p>
                <p>📌 <b>สถานะ:</b> {order.Ostatus}</p>

                <button
                  onClick={() => setEditShip(true)}
                  className="bg-yellow-500 text-white px-3 py-2 rounded hover:bg-yellow-600 mt-3"
                >
                  แก้ไขข้อมูลจัดส่ง
                </button>
              </>
            )}

            {/* ฟอร์มแก้ไข */}
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

            {/* ปุ่ม delivered */}
            {order.Ostatus === "shipping" && (
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
