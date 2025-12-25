'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/app/lib/apiFetch';

interface Transfer {
  Tid: number;
  Tname: string;
  Tnum: string;
  Taccount: string;
  Tbranch: string;
  Tqr: string; // path เช่น "/qrs/xxx.png"
}

interface Order {
  Oid: number;
  Oprice: number;
  Ostatus: string;
}

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

const getImageUrl = (path: string | null | undefined) => {
  if (!path) return '/no-image.png';
  const clean = String(path).trim();
  if (clean.startsWith('http')) return clean;
  if (clean.startsWith('/')) return `${API}${clean}`;
  return `${API}/${clean}`;
};

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();

  const id = useMemo(() => {
    const raw = (params as any)?.id;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);

  const [order, setOrder] = useState<Order | null>(null);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [selectedTid, setSelectedTid] = useState<number | null>(null);
  const [slip, setSlip] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  // โหลด order + transfers
  useEffect(() => {
    if (!id) return;

    const load = async () => {
      setPageError(null);
      try {
        const [orderRes, transferRes] = await Promise.all([
          apiFetch(`${API}/orders/${id}`),
          apiFetch(`${API}/transfer`),
        ]);

        if (!orderRes.ok) {
          setOrder(null);
          setPageError('ไม่พบคำสั่งซื้อ หรือไม่มีสิทธิ์เข้าถึง');
        } else {
          const od = await orderRes.json();
          // บาง route ของเธออาจคืน { ...order, items } ก็ยัง ok เพราะเราดึงเฉพาะฟิลด์นี้
          setOrder({
            Oid: Number(od.Oid),
            Oprice: Number(od.Oprice),
            Ostatus: String(od.Ostatus),
          });
        }

        if (!transferRes.ok) {
          setTransfers([]);
        } else {
          const ts = await transferRes.json();
          setTransfers(Array.isArray(ts) ? ts : []);
        }
      } catch (err) {
        console.error(err);
        setOrder(null);
        setTransfers([]);
        setPageError('โหลดข้อมูลไม่สำเร็จ');
      }
    };

    load();
  }, [id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;

    if (file && file.size > 3 * 1024 * 1024) {
      alert('ไฟล์ใหญ่เกิน 3MB');
      return;
    }

    setSlip(file);

    if (!file) {
      setPreview(null);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!order) return;
    if (!slip || !selectedTid) {
      alert('กรุณาเลือกช่องทางโอนและแนบสลิป');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('Oid', String(order.Oid));
      formData.append('Payprice', String(order.Oprice));
      formData.append('slip', slip);
      formData.append('Tid', String(selectedTid));

      const res = await apiFetch(`${API}/payment`, {
        method: 'POST',
        body: formData, // ✅ ต้องเป็น FormData
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        alert('แจ้งชำระเงินสำเร็จ!');
        router.push('/me/orders');
      } else {
        alert(data?.message || 'เกิดข้อผิดพลาด');
      }
    } catch (err) {
      console.error(err);
      alert('เชื่อมต่อ server ไม่ได้');
    } finally {
      setLoading(false);
    }
  };

  // Loading / Error
  if (pageError) {
    return <p className="text-center bg-white p-10 text-red-600">{pageError}</p>;
  }

  if (!order) {
    return <p className="text-center bg-white p-10">กำลังโหลดข้อมูลคำสั่งซื้อ...</p>;
  }

  // บล็อกส่งซ้ำ
  if (order.Ostatus === 'payment_review') {
    return (
      <p className="text-center p-10 text-orange-600 bg-white">
        สลิปกำลังตรวจสอบ กรุณารอแอดมินยืนยันค่ะ
      </p>
    );
  }

  if (order.Ostatus === 'paid') {
    return (
      <p className="text-center p-10 text-green-600 bg-white">
        ชำระเงินแล้ว ไม่ต้องส่งสลิปซ้ำค่ะ
      </p>
    );
  }

  // UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 text-black">
      <div className="max-w-5xl mx-auto pt-32 p-6">
        <div className="text-center mb-8">
          <div className="inline-block bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-full text-sm font-semibold mb-4">
            แจ้งชำระเงิน
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">
            ส่งสลิปการโอน
          </h1>
          <p className="text-gray-600">
            ออเดอร์ #{order.Oid} • ยอดที่ต้องชำระ <span className="font-semibold text-green-700">{order.Oprice}</span> บาท
          </p>
        </div>

        {/* เลือกบัญชีโอน */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-2 border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">เลือกบัญชีสำหรับโอน</h2>

          {transfers.length === 0 ? (
            <p className="text-gray-500">ยังไม่มีบัญชีโอน</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {transfers.map((t) => {
                const active = selectedTid === t.Tid;
                return (
                  <button
                    key={t.Tid}
                    onClick={() => setSelectedTid(t.Tid)}
                    className={[
                      'text-left p-4 rounded-2xl border-2 transition-all',
                      active ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300',
                    ].join(' ')}
                    type="button"
                  >
                    <div className="flex items-start gap-4">
                      <img
                        src={getImageUrl(t.Tqr)}
                        alt="QR"
                        className="w-24 h-24 object-cover rounded-xl border"
                      />
                      <div className="flex-1">
                        <p className="font-bold text-gray-800">{t.Tname}</p>
                        <p className="text-gray-700">เลขบัญชี: <span className="font-semibold">{t.Tnum}</span></p>
                        <p className="text-gray-700">ชื่อบัญชี: {t.Taccount}</p>
                        <p className="text-gray-700">สาขา: {t.Tbranch}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* แนบสลิป */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-2 border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">แนบสลิป</h2>

          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-700
              file:mr-4 file:py-2 file:px-4
              file:rounded-xl file:border-0
              file:text-sm file:font-semibold
              file:bg-green-50 file:text-green-700
              hover:file:bg-green-100"
          />

          {preview && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">ตัวอย่างสลิป:</p>
              <img src={preview} alt="slip preview" className="max-w-full rounded-xl border shadow-sm" />
            </div>
          )}

          <p className="text-xs text-gray-500 mt-3">* รองรับรูปภาพ ขนาดไม่เกิน 3MB</p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !selectedTid || !slip}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-4 rounded-xl text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50"
        >
          {loading ? 'กำลังส่ง...' : 'ยืนยันส่งสลิป'}
        </button>
      </div>
    </div>
  );
}
