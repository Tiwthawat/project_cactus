'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface AuctionWinDetail {
  Aid: number;
  PROid: number;
  PROname: string;
  PROpicture: string;
  PROstatus: 'pending_payment' | 'paid' | string;
  current_price: number;
}

interface Transfer {
  Tid: number;
  Tname: string;
  Tnum: string;
  Taccount: string;
  Tbranch: string;
  Tqr: string;
}

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

export default function AuctionCheckoutPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [win, setWin] = useState<AuctionWinDetail | null>(null);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [selectedTid, setSelectedTid] = useState<number | null>(null);

  const [slip, setSlip] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // โหลดข้อมูลสินค้าที่ชนะ
  useEffect(() => {
    const fetchWin = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('ยังไม่ได้เข้าสู่ระบบ');
          setLoading(false);
          return;
        }

        const res = await fetch(`${API}/me/my-auction-wins/${params.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const json = await res.json();
        if (!res.ok) {
          setError(json.message || 'โหลดข้อมูลไม่สำเร็จ');
          setLoading(false);
          return;
        }

        setWin(json);
      } catch {
        setError('โหลดข้อมูลไม่สำเร็จ');
      } finally {
        setLoading(false);
      }
    };

    fetchWin();
  }, [params.id]);

  // โหลดบัญชีธนาคาร
  useEffect(() => {
    fetch(`${API}/transfer`)
      .then((res) => res.json())
      .then((data: Transfer[]) => setTransfers(data))
      .catch(() => setTransfers([]));
  }, []);

  // อัปโหลดสลิป
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  // ส่งชำระเงิน
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!win) return;

    if (!selectedTid) {
      alert('กรุณาเลือกบัญชีธนาคาร');
      return;
    }
    if (!slip) {
      alert('กรุณาอัปโหลดสลิป');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        setError('ยังไม่ได้เข้าสู่ระบบ');
        setSubmitting(false);
        return;
      }

      const form = new FormData();
      form.append('Aid', String(win.Aid));
      form.append('Tid', String(selectedTid));
      form.append('Payprice', String(win.current_price));
      form.append('slip', slip);

      const res = await fetch(`${API}/auction-checkout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      });

      const json = await res.json();
      console.log('auction-checkout =>', res.status, json);

      if (!res.ok) {
        setError(json.message || 'ชำระเงินไม่สำเร็จ');
        return;
      }

      // ✅ สำเร็จ: เด้งกลับหน้า /me
      alert('ชำระเงินสำเร็จแล้ว');
      router.push('/me');
    } catch {
      setError('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="pt-36 text-center">กำลังโหลด...</p>;
  if (!win) return <p className="pt-36 text-center">ไม่พบสินค้า</p>;

  const img = win.PROpicture
    ? `${API}${win.PROpicture.startsWith('/') ? '' : '/'}${win.PROpicture}`
    : '';

  return (
    <div className="max-w-6xl mx-auto p-6 pt-36">
      <h1 className="text-3xl font-bold mb-4">ชำระเงินสินค้าประมูล</h1>

      {error && (
        <p className="mb-4 text-red-600">
          {error}
        </p>
      )}

      {win.PROstatus === 'payment_review' && (
  <p className="mb-4 text-blue-600 font-medium">
    ส่งสลิปแล้ว รอแอดมินตรวจสอบ...
  </p>
)}

{win.PROstatus === 'paid' && (
  <p className="mb-4 text-green-600 font-medium">
    ชำระเงินเรียบร้อยแล้ว
  </p>
)}


      <div className="grid grid-cols-12 gap-6">
        {/* LEFT — สินค้า */}
        <div className="col-span-5 bg-white p-4 rounded-xl shadow">
          {img && (
            <img
              src={img}
              className="w-full h-56 object-cover rounded"
              alt={win.PROname}
            />
          )}

          <h2 className="text-xl font-semibold mt-4">{win.PROname}</h2>

          <p className="mt-2 text-gray-700">
            ราคาชนะประมูล:{' '}
            <span className="text-red-600 font-bold text-lg">
              {win.current_price.toLocaleString()} บาท
            </span>
          </p>
        </div>

        {/* RIGHT — โอนเงิน + สลิป */}
        <div className="col-span-7 bg-white p-6 rounded-xl shadow">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* เลือกบัญชี */}
            <div>
              <h2 className="text-xl font-semibold mb-3">เลือกบัญชีธนาคาร</h2>

              <div className="space-y-4 mb-4">
                {transfers.map((t) => (
                  <label
                    key={t.Tid}
                    className="flex items-start justify-between border p-4 rounded-xl hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="transfer"
                        value={t.Tid}
                        checked={selectedTid === t.Tid}
                        onChange={() => setSelectedTid(t.Tid)}
                        className="mt-1"
                        disabled={win.PROstatus !== 'pending_payment'}
                      />
                      <div>
                        <p className="font-medium">
                          {t.Tname} – {t.Taccount} ({t.Tnum})
                        </p>
                        <p className="text-sm text-gray-600">
                          สาขา: {t.Tbranch}
                        </p>
                      </div>
                    </div>

                    {t.Tqr && (
                      <img
                        src={t.Tqr}
                        className="w-24 h-24 object-contain border rounded-lg"
                        alt="QR Code"
                      />
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* อัปสลิป */}
            <div>
              <h3 className="font-semibold mb-2">อัปโหลดสลิปการโอน</h3>
              <input
                type="file"
                accept="image/*"
                onChange={handleFile}
                className="border rounded p-2 w-full mb-3"
                disabled={win.PROstatus !== 'pending_payment'}
              />

              {preview && (
                <img
                  src={preview}
                  alt="slip preview"
                  className="w-full h-auto rounded-lg shadow mb-2"
                />
              )}
            </div>

            <button
  type="submit"
  disabled={submitting || win.PROstatus !== 'pending_payment'}
  className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
>
  {win.PROstatus === 'payment_review'
    ? 'รอแอดมินตรวจสอบ'
    : win.PROstatus === 'paid'
    ? 'ชำระเงินแล้ว'
    : submitting
    ? 'กำลังบันทึก...'
    : 'ยืนยันการชำระเงิน'}
</button>

          </form>
        </div>
      </div>
    </div>
  );
}
