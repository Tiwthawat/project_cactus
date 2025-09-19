'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface OrderItem {
  Oiid: number;
  Pname: string;
  Oquantity: number;
  Oprice: number;
  Ppicture: string;
}

interface Order {
  Oid: number;
  Cname: string;
  Oprice: number;
  Ostatus: string;
  Odate: string;
  Oslip: string;
  items: OrderItem[];
}
interface Review {
  stars: number;
  text: string;
  created_at: string;
}

const statusMap: Record<string, string> = {
  pending: 'รอชำระ',
  waiting: 'รอตรวจสอบ',
  paid: 'ชำระเงินแล้ว',
  shipped: 'จัดส่งแล้ว',
  delivered: 'จัดส่งสำเร็จ',
  cancelled: 'ยกเลิกแล้ว',
  refunded: 'คืนเงินแล้ว',
  failed: 'ล้มเหลว',
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [updating, setUpdating] = useState(false);
  const [review, setReview] = useState<Review | null>(null);

useEffect(() => {
  if (!id) return;
  fetch(`http://localhost:3000/admin/orders/${id}/review`)
    .then(res => res.json())
    .then(setReview)
    .catch(() => {});
}, [id]);

  useEffect(() => {
    fetch(`http://localhost:3000/orders/${id}`)
      .then((res) => res.json())
      .then((data) => setOrder(data))
      .catch((err) => console.error('โหลดข้อมูลคำสั่งซื้อผิดพลาด:', err));
  }, [id]);

  const getValidImage = (urls: string[]) => {
    for (let url of urls) {
      url = url.trim();
      if (!url) continue;

      if (url.startsWith('http')) return url;
      if (url.startsWith('/')) return `http://localhost:3000${url}`;
    }
    return '/no-image.png'; // fallback
  };



  const updateStatus = async (newStatus: string) => {
    if (!order) return;
    setUpdating(true);
    await fetch(`http://localhost:3000/orders/${order.Oid}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Ostatus: newStatus }),
    });
    setOrder({ ...order, Ostatus: newStatus });
    setUpdating(false);
  };


  if (!order) return <p className="text-center mt-10">กำลังโหลดข้อมูล...</p>;



  return (<div className="p-6 text-black max-w-6xl mx-auto">
  <button
    onClick={() => window.history.back()}
    className="text-blue-600 hover:underline mb-4 block"
  >
    ← กลับหน้ารายการคำสั่งซื้อ
  </button>

  <div className="flex flex-col lg:flex-row gap-6">
    {/* ⬅️ ฝั่งซ้าย: รายละเอียดคำสั่งซื้อ */}
    <div className="w-full lg:w-1/2">
      <h1 className="text-2xl font-bold mb-4">รายละเอียดคำสั่งซื้อ #{order.Oid}</h1>
      <p className="mb-2">ลูกค้า: {order.Cname}</p>
      <p className="mb-2">
        วันที่สั่งซื้อ: {new Date(order.Odate).toLocaleString('th-TH', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })}
      </p>
      <select
        className={`border px-2 py-1 rounded text-sm font-medium mb-4 ${order.Ostatus === 'pending' ? 'bg-gray-200 text-gray-800' :
          order.Ostatus === 'waiting' ? 'bg-yellow-100 text-yellow-800' :
            order.Ostatus === 'paid' ? 'bg-green-100 text-green-800' :
              order.Ostatus === 'shipped' ? 'bg-blue-100 text-blue-800' :
                order.Ostatus === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                  order.Ostatus === 'cancelled' ? 'bg-red-100 text-red-800' :
                    order.Ostatus === 'refunded' ? 'bg-indigo-100 text-indigo-800' :
                      order.Ostatus === 'failed' ? 'bg-rose-100 text-rose-800' : ''
          }`}
        value={order.Ostatus}
        onChange={(e) => updateStatus(e.target.value)}
        disabled={updating}
      >
        {Object.entries(statusMap).map(([key, label]) => (
          <option key={key} value={key}>{label}</option>
        ))}
      </select>

      <p className="mb-4">ยอดรวม: {order.Oprice} บาท</p>

      {order.Oslip?.startsWith('/slips/') && (
        <div className="mb-4">
          <p className="font-medium">สลิปการโอน:</p>
          <img
            src={`http://localhost:3000${order.Oslip}`}
            alt="slip"
            className="w-80 border rounded shadow mt-2"
          />
        </div>
      )}
    </div>

    {/* ➡️ ฝั่งขวา: ตารางสินค้า */}
    <div className="w-full lg:w-1/2 overflow-x-auto">
      <h2 className="text-xl font-semibold mb-2">รายการสินค้า:</h2>
      <table className="min-w-full bg-white border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">รูป</th>
            <th className="p-2 border">ชื่อสินค้า</th>
            <th className="p-2 border">จำนวน</th>
            <th className="p-2 border">ราคา</th>
          </tr>
        </thead>
        <tbody>
          {order.items.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center text-gray-500 p-4">ไม่มีรายการสินค้า</td>
            </tr>
          ) : (
            order.items.map((item, index) => {
              const pictures = item.Ppicture ? item.Ppicture.split(',') : [];
              return (
                <tr key={index}>
                  <td className="p-2 border text-center">
                    <img
                      src={getValidImage(pictures)}
                      alt={item.Pname}
                      className="w-16 h-16 object-cover"
                    />
                  </td>
                  <td className="p-2 border text-center">{item.Pname}</td>
                  <td className="p-2 border text-center">{item.Oquantity}</td>
                  <td className="p-2 border text-center">{item.Oprice} บาท</td>
                </tr>
                
              );
            })
          )}
        </tbody>
      </table>{review && (
  <div className="mt-6 p-4 border rounded bg-white shadow-sm">
    <h2 className="text-lg font-bold">รีวิวจากลูกค้า</h2>
    <p>⭐ {review.stars} ดาว</p>
    <p>{review.text}</p>
    <p className="text-sm text-gray-500">
      รีวิวเมื่อ: {new Date(review.created_at).toLocaleString()}
    </p>
  </div>
)}

    </div>
  </div>
</div>

    
  );
}
{/* <div className="p-6 text-black max-w-4xl mx-auto">
      <button
        onClick={() => window.history.back()}
        className="text-blue-600 hover:underline mb-4 block"
      >
        ← กลับหน้ารายการคำสั่งซื้อ
      </button>

      <h1 className="text-2xl font-bold mb-4">รายละเอียดคำสั่งซื้อ #{order.Oid}</h1>
      <p className="mb-2">ลูกค้า: {order.Cname}</p>
      <p className="mb-2">
        วันที่สั่งซื้อ: {new Date(order.Odate).toLocaleString('th-TH', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })}
      </p>

      <select
        className={`border px-2 py-1 rounded text-sm font-medium mb-4 ${order.Ostatus === 'pending' ? 'bg-gray-200 text-gray-800' :
          order.Ostatus === 'waiting' ? 'bg-yellow-100 text-yellow-800' :
            order.Ostatus === 'paid' ? 'bg-green-100 text-green-800' :
              order.Ostatus === 'shipped' ? 'bg-blue-100 text-blue-800' :
                order.Ostatus === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                  order.Ostatus === 'cancelled' ? 'bg-red-100 text-red-800' :
                    order.Ostatus === 'refunded' ? 'bg-indigo-100 text-indigo-800' :
                      order.Ostatus === 'failed' ? 'bg-rose-100 text-rose-800' : ''
          }`}
        value={order.Ostatus}
        onChange={(e) => updateStatus(e.target.value)}
        disabled={updating}
      >
        {Object.entries(statusMap).map(([key, label]) => (
          <option key={key} value={key}>{label}</option>
        ))}
      </select>

      <p className="mb-4">ยอดรวม: {order.Oprice} บาท</p>

      {order.Oslip?.startsWith('/slips/') && (
        <div className="mb-4">
          <p className="font-medium">สลิปการโอน:</p>
          <img
            src={`http://localhost:3000${order.Oslip}`}
            alt="slip"
            className="w-80 border rounded shadow mt-2"
          />
        </div>
      )}


      <h2 className="text-xl font-semibold mb-2">รายการสินค้า:</h2>
      <table className="min-w-full bg-white border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">รูป</th>
            <th className="p-2 border">ชื่อสินค้า</th>
            <th className="p-2 border">จำนวน</th>
            <th className="p-2 border">ราคา</th>
          </tr>
        </thead>
        <tbody>
          {order.items.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center text-gray-500 p-4">
                ไม่มีรายการสินค้าในคำสั่งซื้อนี้
              </td>
            </tr>
          ) : (
            order.items.map((item, index) => {
              const pictures = item.Ppicture ? item.Ppicture.split(',') : [];
              return (
                <tr key={index}>
                  <td className="p-2 border text-center">
                    <img
                      src={getValidImage(pictures)}
                      alt={item.Pname}
                      className="w-16 h-16 object-cover"
                    />
                  </td>
                  <td className="p-2 border text-center">{item.Pname}</td>
                  <td className="p-2 border text-center">{item.Oquantity}</td>
                  <td className="p-2 border text-center">{item.Oprice} บาท</td>
                </tr>
              );
            })
          )}
        </tbody>

      </table>
    </div> */}