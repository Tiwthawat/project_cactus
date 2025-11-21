'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

interface Transfer {
  Tid: number;
  Tname: string;
  Tnum: string;
  Taccount: string;
  Tbranch: string;
  Tqr: string;
}

interface AuctionPayInfo {
  Aid: number;
  PROid: number;
  PROname: string;
  PROprice: number;
  current_price: number;
  PROstatus: string;
  winner_id: number | null;
}

export default function AuctionPaymentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [auction, setAuction] = useState<AuctionPayInfo | null>(null);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [selectedTid, setSelectedTid] = useState<number | null>(null);
  const [slip, setSlip] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // โหลดข้อมูลรอบประมูล + บัญชีโอน
  useEffect(() => {
    if (!id) return;

    // ข้อมูลประมูล
    fetch(`${API}/auction/${id}`)
      .then((res) => res.json())
      .then((data) => {
        const info: AuctionPayInfo = {
          Aid: data.Aid,
          PROid: data.PROid,
          PROname: data.PROname,
          PROprice: data.PROprice,
          current_price: data.current_price,
          PROstatus: data.PROstatus,
          winner_id: data.winner_id,
        };
        setAuction(info);
      })
      .catch(() => setAuction(null));

    // บัญชีโอน
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
    if (!slip || !selectedTid || !auction) {
      alert('กรุณาเลือกช่องทางโอนและแนบสลิป');
      return;
    }

    // ✅ ฝั่ง backend แนะนำให้ใช้ Cid จาก token แทน ไม่ต้องส่ง user_id จากฟร้อน
    const formData = new FormData();
    formData.append('slip', slip);
    formData.append('Tid', String(selectedTid));

    setLoading(true);
    try {
      const res = await fetch(`${API}/auction/${auction.Aid}/pay`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        alert('แจ้งชำระเงินสำเร็จ!');
        router.push('/me/auctions'); // หรือหน้าอื่นที่ตะเองใช้โชว์ประวัติ
      } else {
        alert(data.error || data.message || 'เกิดข้อผิดพลาด');
      }
    } catch {
      alert('เชื่อมต่อ server ไม่ได้');
    } finally {
      setLoading(false);
    }
  };

  if (!auction) {
    return (
      <p className="text-center bg-white p-10">
        กำลังโหลดข้อมูลรายการประมูล...
      </p>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="max-w-3xl pt-44 mx-auto p-6 bg-white text-black">
        <h1 className="text-2xl font-bold mb-6">ชำระเงินสินค้าประมูล</h1>

        <div className="mb-4">
          <p>
            รหัสรอบประมูล:{' '}
            <span className="font-semibold">#{auction.Aid}</span>
          </p>
          <p className="mt-1">
            สินค้า:{' '}
            <span className="font-semibold">{auction.PROname}</span>
          </p>
          <p className="mt-1">
            ยอดที่ต้องชำระ:{' '}
            <span className="text-red-600 font-bold">
              {auction.current_price.toLocaleString('th-TH')} บาท
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
            disabled={loading || !slip || !selectedTid}
            className="bg-green-600 text-white px-8 py-2 text-lg rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'กำลังส่งข้อมูล...' : 'แจ้งชำระเงินสำหรับสินค้าประมูล'}
          </button>
        </div>
      </div>
    </div>
  );
}
