'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Transfer {
  Tid: number;
  Tname: string;
  Tnum: string;
  Taccount: string;
  Tbranch: string;
  Tqr: string;
}

interface Order {
  Oid: number;
  Oprice: number;
  Ostatus: string;
}

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

export default function PaymentPage() {
  const { id } = useParams();
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [selectedTid, setSelectedTid] = useState<number | null>(null);
  const [slip, setSlip] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // โหลดคำสั่งซื้อ
    fetch(`${API}/orders/${id}`)
      .then((res) => res.json())
      .then((data: Order) => setOrder(data))
      .catch(() => setOrder(null));

    // โหลดบัญชีโอน
    fetch(`${API}/transfer`)
      .then((res) => res.json())
      .then((data: Transfer[]) => setTransfers(data))
      .catch(() => setTransfers([]));
  }, [id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && file.size > 3 * 1024 * 1024) {
      alert('ไฟล์ใหญ่เกิน 3MB');
      return;
    }
    setSlip(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async () => {
    if (!slip || !selectedTid || !order) {
      alert('กรุณาเลือกช่องทางโอนและแนบสลิป');
      return;
    }

    const formData = new FormData();
    formData.append('Oid', String(id));
    formData.append('Payprice', String(order.Oprice));
    formData.append('slip', slip);
    formData.append('Tid', String(selectedTid));

    setLoading(true);
    try {
      const res = await fetch(`${API}/payment`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        alert('แจ้งชำระเงินสำเร็จ!');
        router.push('/me/orders');
      } else {
        alert(data.message || 'เกิดข้อผิดพลาด');
      }
    } catch {
      alert('เชื่อมต่อ server ไม่ได้');
    } finally {
      setLoading(false);
    }
  };

  if (!order) {
    return (
      <p className="text-center bg-white p-10">
        กำลังโหลดข้อมูลคำสั่งซื้อ...
      </p>
    );
  }
  // ถ้าออเดอร์กำลังตรวจสอบ หรือจ่ายแล้ว → ห้ามส่งซ้ำ
  if (order.Ostatus === "payment_review") {
    return (
      <p className="text-center p-10 text-orange-600 bg-white">
        สลิปกำลังตรวจสอบ กรุณารอแอดมินยืนยันค่ะ
      </p>
    );
  }

  if (order.Ostatus === "paid") {
    return (
      <p className="text-center p-10 text-green-600 bg-white">
        ชำระเงินแล้ว ไม่ต้องส่งสลิปซ้ำค่ะ
      </p>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 text-black">
      <div className="max-w-4xl pt-32 mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-full text-sm font-semibold mb-4">
            ชำระเงิน
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">
            แจ้งชำระเงิน
          </h1>
        </div>

        {/* Order Info Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-2 border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xl shadow-md">
              📋
            </div>
            <h2 className="text-2xl font-bold text-gray-800">ข้อมูลคำสั่งซื้อ</h2>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">เลขคำสั่งซื้อ:</span>
              <span className="font-bold text-lg">#{order.Oid}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">ยอดที่ต้องชำระ:</span>
              <span className="text-2xl font-bold text-green-600">{order.Oprice} บาท</span>
            </div>
          </div>
        </div>

        {/* Transfer Methods Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-2 border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl shadow-md">
              🏦
            </div>
            <h2 className="text-2xl font-bold text-gray-800">เลือกช่องทางการโอน</h2>
          </div>
          <div className="space-y-4">
            {transfers.map((t) => (
              <label
                key={t.Tid}
                className={`flex items-start justify-between border-2 p-4 rounded-xl cursor-pointer transition-all duration-300 ${selectedTid === t.Tid
                    ? 'border-green-400 bg-green-50 shadow-md'
                    : 'border-gray-200 hover:border-green-300 hover:shadow-sm'
                  }`}
              >
                <div className="flex items-start gap-3 flex-1">
                  <input
                    type="radio"
                    name="transfer"
                    value={t.Tid}
                    className="mt-1 w-5 h-5 text-green-600"
                    onChange={() => setSelectedTid(t.Tid)}
                  />
                  <div>
                    <p className="font-bold text-gray-800 text-lg">
                      {t.Tname} — {t.Taccount}
                    </p>
                    <p className="text-gray-600">
                      เลขบัญชี: {t.Tnum}
                    </p>
                    <p className="text-sm text-gray-500">
                      สาขา: {t.Tbranch}
                    </p>
                  </div>
                </div>
                {t.Tqr && (
                  <img
                    src={t.Tqr}
                    alt="QR"
                    className="w-24 h-24 object-contain border-2 border-gray-200 rounded-xl shadow-sm"
                  />
                )}
              </label>
            ))}
          </div>
        </div>

        {/* Upload Slip Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-2 border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white text-xl shadow-md">
              📎
            </div>
            <h2 className="text-2xl font-bold text-gray-800">แนบสลิป</h2>
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full border-2 border-gray-200 p-3 rounded-xl cursor-pointer bg-gray-50 hover:border-green-300 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-500 file:text-white file:font-semibold hover:file:bg-green-600"
          />
          {preview && (
            <div className="mt-4">
              <img
                src={preview}
                alt="preview"
                className="w-full h-auto rounded-xl shadow-lg border-2 border-gray-200"
              />
            </div>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={
            loading ||
            !slip ||
            !selectedTid ||
            order.Ostatus !== "pending_payment"
          }
          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-4 text-lg rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'กำลังส่งข้อมูล...' : 'แจ้งชำระเงิน'}
        </button>
      </div>
    </div>
  );
}
