'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/app/lib/apiFetch';

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

interface TransferInfo {
  Tname: string;
  Tnum: string;
  Taccount: string;
  Tbranch: string;
  Tqr: string;
}

interface WinDetail {
  Aid: number;
  PROid: number;
  PROname: string;
  PROpicture: string;
  PROstatus: 'pending_payment' | 'payment_review' | 'paid';
  payment_status: 'pending_payment' | 'payment_review' | 'paid';
  current_price: number;
  end_time: string;

  shipping_company?: string | null;
  tracking_number?: string | null;
  shipping_status?: 'pending' | 'shipping' | 'delivered' | null;
  transfer?: TransferInfo | null;
}

export default function AuctionWinDetailPage() {
  const { Aid } = useParams<{ Aid: string }>();

  const [data, setData] = useState<WinDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState('');
  const [showQr, setShowQr] = useState(false);


  const load = async () => {
    try {
      const res = await apiFetch(`/me/my-auction-wins/${Aid}`);
      const json = await res.json();

      if (!res.ok) {
        setMsg(json.message || 'เกิดข้อผิดพลาด');
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

  const confirmDelivered = async () => {
    const res = await apiFetch(
      `/me/my-auction-wins/${Aid}/received`,
      { method: 'PATCH' }
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
    return <p className="p-10 text-center text-gray-500">กำลังโหลดข้อมูล…</p>;

  if (!data)
    return <p className="p-10 text-center text-red-500">{msg}</p>;

  const img = data.PROpicture?.split(',')[0] || '';

  const paymentBadge = () => {
    if (data.payment_status === 'pending_payment')
      return 'bg-orange-100 text-orange-600';
    if (data.payment_status === 'payment_review')
      return 'bg-blue-100 text-blue-600';
    return 'bg-green-100 text-green-600';
  };

  const paymentLabel = () => {
    if (data.payment_status === 'pending_payment') return 'รอชำระเงิน';
    if (data.payment_status === 'payment_review') return 'รอตรวจสอบ';
    return 'ชำระเงินแล้ว';
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">

      <h1 className="text-3xl font-bold text-center">
        รายละเอียดการประมูล #{data.Aid}
      </h1>

      {/* Payment Summary */}
      <div className="bg-white rounded-xl shadow-md p-6 border space-y-3">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-lg">สถานะการชำระเงิน</span>
          <span className={`px-4 py-1 rounded-full text-sm font-medium ${paymentBadge()}`}>
            {paymentLabel()}
          </span>
        </div>

        <p>
          <span className="font-semibold">ราคาที่ชนะ:</span>{' '}
          {data.current_price.toLocaleString()} บาท
        </p>

        <p>
          <span className="font-semibold">ปิดประมูล:</span>{' '}
          {new Date(data.end_time).toLocaleDateString('th-TH')}
        </p>
      </div>

      {/* Product Section */}
      <div className="bg-white rounded-xl shadow-md p-6 border">
        <h2 className="text-xl font-semibold mb-4">ข้อมูลสินค้า</h2>

        <div className="flex gap-5 items-center">
          <img
            src={`${API}${img}`}
            className="w-32 h-32 rounded-lg border object-cover"
          />
          <div className="space-y-1">
            <p className="text-lg font-semibold">{data.PROname}</p>
            <p className="text-gray-600">
              ราคา: {data.current_price.toLocaleString()} บาท
            </p>
          </div>
        </div>
      </div>

     {/* Transfer Info */}
{data.payment_status === 'pending_payment' && data.transfer && (
  <div className="bg-white rounded-2xl shadow-lg border p-6 space-y-6">

    <h2 className="text-2xl font-bold text-green-700">
      💳 ชำระเงินผ่านบัญชีธนาคาร
    </h2>

    {/* Bank Info */}
    <div className="bg-green-50 rounded-xl p-5 border space-y-4">

      <div>
        <p className="text-sm text-gray-500">ธนาคาร</p>
        <p className="font-semibold text-lg">{data.transfer.Tname}</p>
      </div>

      <div>
        <p className="text-sm text-gray-500">ชื่อบัญชี</p>
        <p className="font-medium">{data.transfer.Taccount}</p>
      </div>

      <div>
        <p className="text-sm text-gray-500">เลขบัญชี</p>
        <div className="flex items-center gap-3">
          <p className="text-2xl font-bold tracking-widest text-green-800">
            {data.transfer.Tnum}
          </p>

          <button
            onClick={() => {
              navigator.clipboard.writeText(data.transfer!.Tnum);
              alert("คัดลอกเลขบัญชีแล้ว");
            }}
            className="text-sm bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition"
          >
            คัดลอก
          </button>
        </div>
      </div>

      <div>
        <p className="text-sm text-gray-500">สาขา</p>
        <p>{data.transfer.Tbranch || '-'}</p>
      </div>

    </div>

    {data.transfer.Tqr && (
  <div className="text-center space-y-3">

    <p className="text-sm text-gray-500">
      แตะ QR เพื่อขยาย
    </p>

    <img
      src={`${API}${data.transfer.Tqr}`}
      alt="QR Code"
      className="mx-auto w-52 rounded-xl border shadow-md cursor-pointer hover:scale-105 transition"
      onClick={() => setShowQr(true)}
    />

  </div>
)}

  </div>
)}


      {/* Upload Slip */}
      {data.payment_status === 'pending_payment' && (
        <div className="bg-white rounded-xl shadow-md p-6 border space-y-4">

          <h2 className="text-xl font-semibold">แนบสลิปการโอนเงิน</h2>

          <input
            type="file"
            accept="image/*"
            className="w-full border rounded-lg p-2"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />

          <button
            onClick={uploadSlip}
            className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition"
          >
            อัปโหลดสลิป
          </button>

          {msg && (
            <p className="text-center text-sm text-green-600">{msg}</p>
          )}
        </div>
      )}

      {/* Shipping Section */}
      {data.payment_status === 'paid' && (
        <div className="bg-white rounded-xl shadow-md p-6 border space-y-4">

          <h2 className="text-xl font-semibold">การจัดส่งสินค้า</h2>

          <p>ขนส่ง: <b>{data.shipping_company || '—'}</b></p>
          <p>เลขพัสดุ: <b>{data.tracking_number || '—'}</b></p>

          <p>
            สถานะ:{' '}
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

          {data.shipping_status === 'shipping' && (
            <button
              onClick={confirmDelivered}
              className="w-full bg-green-700 text-white py-2 rounded-lg hover:bg-green-800 transition"
            >
              ✔ ยืนยันได้รับสินค้าแล้ว
            </button>
          )}

          {data.shipping_status === 'delivered' && (
            <p className="text-green-600 font-semibold text-center">
              ✔ คุณยืนยันการรับสินค้าแล้ว
            </p>
          )}
        </div>
      )}
      {showQr && (
  <div
    className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
    onClick={() => setShowQr(false)}
  >
    <img
      src={`${API}${data.transfer?.Tqr}`}
      alt="QR Full"
      className="max-w-[90%] max-h-[90%] rounded-xl shadow-2xl"
    />
  </div>
)}

    </div>
  );
}
