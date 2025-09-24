'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface AuctionDetail {
  Aid: number;
  start_price: number;
  current_price: number;
  end_time: string;
  status: 'open' | 'closed';
  PROid: number;
  PROname: string;
  PROpicture: string; // เก็บหลายรูปคั่นด้วย ,
}

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';
const fmt = (n: number) =>
  Number(n ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2 });

export default function AdminAuctionDetailPage() {
  const { Aid } = useParams<{ Aid: string }>();
  const router = useRouter();
  const [data, setData] = useState<AuctionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState(0); // index ของรูปที่เลือก

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/auction/${Aid}`);
      const d: AuctionDetail = await res.json();
      setData(d);
      setSel(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Aid]);

  // แตกเป็นอาเรย์รูป + ทำ URL ให้มี / เสมอ
  const imageUrls = useMemo(() => {
    if (!data?.PROpicture) return [] as string[];
    return data.PROpicture
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((p) => `${API}${p.startsWith('/') ? '' : '/'}${p}`);
  }, [data?.PROpicture]);

  const closeAuction = async () => {
    if (!confirm('ต้องการปิดประมูลนี้?')) return;
    const res = await fetch(`${API}/auctions/${Aid}/close`, { method: 'PATCH' });
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      alert(b?.error || 'ปิดประมูลไม่สำเร็จ');
      return;
    }
    alert('ปิดประมูลแล้ว');
    fetchDetail();
  };

  const deleteProduct = async () => {
    if (!data) return;
    if (!confirm('ลบ “สินค้า” นี้ออกจากคลังประมูล?\n(หากมีรอบอ้างอิงอยู่ อาจลบไม่สำเร็จ)')) return;
    const res = await fetch(`${API}/auction-products/${data.PROid}`, { method: 'DELETE' });
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      alert(b?.error || 'ลบสินค้าไม่สำเร็จ');
      return;
    }
    alert('ลบสินค้าแล้ว');
    router.push('/admin/auction-products');
  };

  if (loading || !data) return <main className="p-6 text-black">กำลังโหลด...</main>;

  return (
    <main className="p-6 text-black">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">รายละเอียดประมูล</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* กล่องรูป: รูปใหญ่ + แถบรูปย่อ */}
          <div className="bg-white rounded-xl shadow p-4">
            <div className="w-full aspect-[4/3] bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden">
              {imageUrls[sel] ? (
                <img
                  key={imageUrls[sel]}
                  src={imageUrls[sel]}
                  alt={`${data.PROname}-${sel}`}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-gray-400">ไม่มีรูป</div>
              )}
            </div>

            {imageUrls.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {imageUrls.map((u, i) => (
                  <button
                    key={u + i}
                    type="button"
                    onClick={() => setSel(i)}
                    className={`flex-shrink-0 w-20 h-20 rounded border overflow-hidden ${
                      sel === i ? 'ring-2 ring-orange-500' : 'hover:ring-1 hover:ring-gray-300'
                    }`}
                    title={`รูปที่ ${i + 1}`}
                  >
                    <img src={u} alt={`thumb-${i}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ข้อมูลรายละเอียด + ปุ่ม */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="mb-4">
              <div className="text-sm text-gray-500">สินค้า</div>
              <div className="text-2xl font-semibold">{data.PROname}</div>
            </div>

            <div className="space-y-2 text-[15px]">
              <div className="flex justify-between border-b py-2">
                <span className="text-gray-600">ราคาเริ่มต้น</span>
                <b>{fmt(data.start_price)} ฿</b>
              </div>
              <div className="flex justify-between border-b py-2">
                <span className="text-gray-600">ราคาปัจจุบัน</span>
                <b className="text-red-600">{fmt(data.current_price)} ฿</b>
              </div>
              <div className="flex justify-between border-b py-2">
                <span className="text-gray-600">ปิดประมูล</span>
                <span>{new Date(data.end_time).toLocaleString('th-TH')}</span>
              </div>
              <div className="flex items-center gap-2 py-2">
                <span className="text-gray-600">สถานะ</span>
                <span
                  className={`px-2 py-0.5 rounded text-white ${
                    data.status === 'open' ? 'bg-green-500' : 'bg-gray-500'
                  }`}
                >
                  {data.status}
                </span>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => router.push('/admin/auctions')}
                className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-50"
              >
                ← กลับ
              </button>

              {data.status === 'open' && (
                <button
                  onClick={closeAuction}
                  className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                >
                  ปิดประมูล
                </button>
              )}

              <button
                onClick={deleteProduct}
                className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-800"
                title="ลบสินค้าออกจากคลังประมูล (ไม่ใช่ลบรอบ)"
              >
                ลบสินค้า
              </button>
            </div>

            <p className="mt-3 text-xs text-gray-500">
              * ถ้าลบสินค้าไม่สำเร็จ อาจเพราะยังมีรอบประมูลที่อ้างอิงอยู่ ให้ปิด/ลบรอบก่อน
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
