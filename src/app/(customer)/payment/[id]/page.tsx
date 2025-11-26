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
    <div className="min-h-screen bg-white text-black">
      <div className="max-w-3xl pt-44 mx-auto p-6 bg-white text-black">
        <h1 className="text-2xl font-bold mb-6">แจ้งชำระเงิน</h1>

        <div className="mb-4">
          <p>
            เลขคำสั่งซื้อ:{' '}
            <span className="font-semibold">#{order.Oid}</span>
          </p>
          <p>
            ยอดที่ต้องชำระ:{' '}
            <span className="text-red-600 font-bold">
              {order.Oprice} บาท
            </span>
          </p>
        </div>

        <h2 className="font-semibold mb-3">เลือกช่องทางการโอน</h2>
        <div className="space-y-4 mb-6">
          {transfers.map((t) => (
            <label
              key={t.Tid}
              className="flex items-start justify-between border p-4 rounded-lg shadow-sm hover:bg-gray-50"
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="transfer"
                  value={t.Tid}
                  className="mt-1"
                  onChange={() => setSelectedTid(t.Tid)}
                />
                <div>
                  <p className="font-medium">
                    {t.Tname} — {t.Taccount} ({t.Tnum})
                  </p>
                  <p className="text-sm text-gray-600">
                    สาขา: {t.Tbranch}
                  </p>
                </div>
              </div>
              {t.Tqr && (
                <img
                  src={t.Tqr}
                  alt="QR"
                  className="w-20 h-20 object-contain border rounded-lg"
                />
              )}
            </label>
          ))}
        </div>

        <div className="mb-4">
          <label className="block font-medium mb-1">แนบสลิป</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full border p-2 rounded cursor-pointer bg-white"
          />
          {preview && (
            <img
              src={preview}
              alt="preview"
              className="w-full h-auto rounded shadow mt-4"
            />
          )}
        </div>

        <div className="text-right">
          <button
  onClick={handleSubmit}
  disabled={
    loading ||
    !slip ||
    !selectedTid ||
    order.Ostatus !== "pending_payment"
  }
  className="bg-green-600 text-white px-8 py-2 text-lg rounded
             hover:bg-green-700 disabled:opacity-50"
>
  {loading ? 'กำลังส่งข้อมูล...' : 'แจ้งชำระเงิน'}
</button>

        </div>
      </div>
    </div>
  );
}
