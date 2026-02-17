'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/app/lib/apiFetch';

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

interface WinDetail {
  Aid: number;
  PROid: number;
  PROname: string;
  PROpicture: string;
  PROstatus: 'pending_payment' | 'payment_review' | 'paid';
  payment_status: 'pending_payment' | 'paid';
  current_price: number;
  end_time: string;

  shipping_company?: string | null;
  tracking_number?: string | null;
  shipping_status?: 'pending' | 'shipping' | 'delivered' | null;
}

export default function AuctionWinDetailPage() {
  const { Aid } = useParams<{ Aid: string }>();

  const [data, setData] = useState<WinDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState('');

  const load = async () => {
    try {
     
      const res = await apiFetch(`/me/my-auction-wins/${Aid}`, {
        
      });

      const json = await res.json();

      if (!res.ok) {
        setMsg(json.message || 'เกิดข้อผิดพลาด');
        setLoading(false);
        return;
      }

      setData(json);
    } catch {
      setMsg('โหลดข้อมูลไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

 useEffect(() => {
  if (!Aid) return;
  load();
}, [Aid]);


  // ---- Upload Slip ----
  const uploadSlip = async () => {
    if (!file) return;

    

    const form = new FormData();
    form.append('Aid', String(Aid));
    form.append('slip', file);

    const res = await apiFetch(`/auction-checkout`, {
      method: 'POST',
     
      body: form,
    });

    const json = await res.json();

    if (!res.ok) {
      setMsg(json.message || 'อัปโหลดไม่สำเร็จ');
      return;
    }

    setMsg('✔ อัปโหลดสลิปสำเร็จ รอตรวจสอบ');
    load();
  };

  // ⭐ ลูกค้ากดยืนยันได้รับสินค้าแล้ว
  const confirmDelivered = async () => {
    

    const res = await apiFetch(
  `/me/my-auction-wins/${Aid}/received`,
  {
    method: 'PATCH',
    
  }
);


    const json = await res.json();
    if (!res.ok) {
      alert(json.error || 'อัปเดตไม่สำเร็จ');
      return;
    }

    alert('✔ ยืนยันได้รับสินค้าแล้ว');
    load();
  };

  if (loading)
    return <p className="p-6 text-center text-lg">กำลังโหลดข้อมูล…</p>;

  if (!data)
    return <p className="p-6 text-center text-red-500">{msg}</p>;

  const img = data.PROpicture?.split(',')[0] || '';

  return (
    <div className="p-6 max-w-3xl mx-auto text-black">

      <h1 className="text-2xl font-bold mb-6 text-center">
        รายละเอียดการประมูล #{data.Aid}
      </h1>

      {/* กล่องรายละเอียด */}
      <div className="bg-white p-5 rounded-xl shadow border mb-6 space-y-2">
        <div className="flex gap-2 text-lg">
          <span className="font-semibold">สถานะการชำระ:</span>
          <span
            className={
              data.PROstatus === 'pending_payment'
                ? 'text-orange-500'
                : data.PROstatus === 'payment_review'
                ? 'text-blue-600'
                : 'text-green-600'
            }
          >
            {data.PROstatus === 'pending_payment'
              ? 'รอชำระเงิน'
              : data.PROstatus === 'payment_review'
              ? 'รอตรวจสอบ'
              : 'ชำระเงินแล้ว'}
          </span>
        </div>

        <p className="text-lg">
          <span className="font-semibold">ราคาที่ชนะ:</span>{' '}
          {data.current_price.toLocaleString()} บาท
        </p>

        <p className="text-lg">
          <span className="font-semibold">ปิดประมูลวันที่:</span>{' '}
          {new Date(data.end_time).toLocaleDateString('th-TH')}
        </p>
      </div>

      {/* สินค้า */}
      <div className="bg-white p-5 rounded-xl shadow border mb-6">
        <h2 className="font-semibold text-xl mb-4">สินค้า</h2>

        <div className="flex gap-4 items-center">
          <img
            src={`${API}${img}`}
            className="w-28 h-28 rounded-lg border object-cover"
          />
          <div>
            <p className="font-semibold text-lg">{data.PROname}</p>
            <p className="text-gray-600">จำนวน: 1</p>
            <p className="text-gray-600">
              ราคา: {data.current_price.toLocaleString()} บาท
            </p>
          </div>
        </div>
      </div>

      {/* อัปโหลดสลิป */}
      {data.PROstatus === 'pending_payment' && (
        <div className="bg-white p-5 rounded-xl shadow border mb-6">
          <h2 className="font-semibold text-xl mb-4">แนบสลิปโอนเงิน</h2>

          <input
            type="file"
            accept="image/*"
            className="w-full border p-2 rounded mb-3"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />

          <button
            onClick={uploadSlip}
            className="bg-green-600 hover:bg-green-700 text-white w-full py-2 rounded-lg"
          >
            อัปโหลดสลิป
          </button>

          {msg && (
            <p className="mt-3 text-center text-sm text-green-700">{msg}</p>
          )}
        </div>
      )}

      {/* รอตรวจสอบ */}
      {data.PROstatus === 'payment_review' && (
        <p className="text-center text-blue-600 font-semibold text-lg">
          ✔ รอตรวจสอบการชำระเงินจากผู้ดูแลระบบ
        </p>
      )}

      {/* โชว์จัดส่ง */}
      {data.PROstatus === 'paid' && (
        <div className="bg-white p-5 rounded-xl shadow border mb-6 text-lg">
          <h2 className="font-semibold text-xl mb-4">การจัดส่งสินค้า</h2>

          <p>ขนส่ง: <b>{data.shipping_company || "—"}</b></p>
          <p>เลขพัสดุ: <b>{data.tracking_number || "—"}</b></p>

          <p className="mt-2">
            สถานะจัดส่ง:{' '}
            <span className={
              data.shipping_status === 'shipping'
                ? 'text-blue-600'
                : data.shipping_status === 'delivered'
                ? 'text-green-600'
                : 'text-gray-500'
            }>
              {data.shipping_status === 'pending'
                ? 'รอจัดส่ง'
                : data.shipping_status === 'shipping'
                ? 'กำลังจัดส่ง'
                : data.shipping_status === 'delivered'
                ? 'จัดส่งสำเร็จแล้ว'
                : '—'}
            </span>
          </p>

          {/* ⭐ ลูกค้ากดยืนยันได้รับสินค้า */}
          {data.shipping_status === 'shipping' && (
            <button
              onClick={confirmDelivered}
              className="mt-4 bg-green-700 text-white px-4 py-2 rounded-lg w-full hover:bg-green-800"
            >
              ✔ ยืนยันได้รับสินค้าแล้ว
            </button>
          )}

          {data.shipping_status === 'delivered' && (
            <p className="mt-4 text-green-600 font-semibold text-center">
              ✔ คุณได้ยืนยันการรับสินค้าแล้ว
            </p>
          )}
        </div>
      )}

      {data.PROstatus === 'paid' && !data.shipping_company && (
        <p className="text-center text-gray-500">
          * ระบบกำลังรอผู้ขายจัดส่งสินค้า
        </p>
      )}
    </div>
  );
}
