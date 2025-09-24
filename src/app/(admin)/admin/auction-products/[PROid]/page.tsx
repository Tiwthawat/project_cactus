'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

interface ProductDetail {
  PROid: number;
  PROname: string;
  PROprice: number;
  PROstatus: 'auction' | 'inactive' | string;
  PROpicture: string;          // รูปหลายรูปคั่นด้วย ,
  PROdetail: string | null;
  active_aid: number | null;
  active_end_time: string | null;
  active_current_price: number | null;
}

export default function ProductDetailPage() {
  const { PROid } = useParams<{ PROid: string }>();
  const router = useRouter();
  const [data, setData] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/auction-products/${PROid}`, { cache: 'no-store' });
        if (!res.ok) throw new Error();
        const row: ProductDetail = await res.json();
        setData(row);
        setIdx(0);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [PROid]);

  const pics = useMemo(
    () => (data?.PROpicture ? data.PROpicture.split(',').map(s => s.trim()).filter(Boolean) : []),
    [data]
  );
  const mainImg = useMemo(() => {
    const p = pics[idx] ?? pics[0] ?? '';
    return p ? `${API}${p.startsWith('/') ? '' : '/'}${p}` : '';
  }, [pics, idx]);

  const fmtBaht = (n: number) =>
    n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const deleteProduct = async () => {
    if (!data) return;
    if (!confirm('ลบสินค้าออกจากคลังประมูล?')) return;
    const res = await fetch(`${API}/auction-products/${data.PROid}`, { method: 'DELETE' });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return alert(body?.error || 'ลบสินค้าไม่สำเร็จ');
    alert('ลบสินค้าสำเร็จ');
    router.push('/admin/auction-products');
  };

  if (loading) return <main className="p-6">กำลังโหลด…</main>;
  if (!data) return <main className="p-6">ไม่พบสินค้า</main>;

  return (
    <main className="p-6 text-black">
      <h1 className="text-3xl font-extrabold mb-6">รายละเอียดสินค้า</h1>

      <div className="grid lg:grid-cols-[1.2fr,1fr] gap-6">
        {/* ซ้าย: รูปใหญ่ + แกลเลอรี */}
        <section className="bg-white rounded-2xl shadow border p-4">
          <div className="flex justify-center">
  <div className="w-full max-w-md aspect-[4/3] overflow-hidden rounded-xl border">
    {mainImg ? (
      <img src={mainImg} alt={data.PROname} className="w-full h-full object-cover" />
    ) : (
      <div className="w-full h-full grid place-items-center text-gray-400">ไม่มีรูป</div>
    )}
  </div>
</div>


          {/* รูปย่อแนวนอน */}
          {pics.length > 0 && (
            <div className="flex gap-3 mt-3 overflow-x-auto">
              {pics.map((p, i) => {
                const url = `${API}${p.startsWith('/') ? '' : '/'}${p}`;
                const active = i === idx;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIdx(i)}
                    className={`w-28 h-28 rounded-lg border overflow-hidden shrink-0 ${
                      active ? 'ring-2 ring-orange-400 border-orange-400' : 'hover:opacity-90'
                    }`}
                    title={`รูป ${i + 1}`}
                  >
                    <img src={url} alt={`thumb-${i}`} className="w-full h-full object-cover" />
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* ขวา: การ์ดรายละเอียด */}
        <section className="bg-white rounded-2xl shadow border p-6">
          <div className="text-sm text-gray-500">สินค้า</div>
          <div className="text-2xl font-semibold mb-4">{data.PROname}</div>

          <div className="divide-y">
            <div className="py-3 flex items-center justify-between">
              <span className="text-gray-600">ราคาอ้างอิง</span>
              <span className="font-medium">{fmtBaht(data.PROprice)} ฿</span>
            </div>
            <div className="py-3">
              <div className="text-gray-600 mb-1">รายละเอียด</div>
              <div className="whitespace-pre-line">{data.PROdetail || '-'}</div>
            </div>
            <div className="py-3 flex items-center gap-2">
              <span className="text-gray-600">สถานะ</span>
              <span
                className={`px-2 py-1 rounded text-white ${
                  data.PROstatus === 'auction' ? 'bg-green-600' : 'bg-gray-500'
                }`}
              >
                {data.PROstatus}
              </span>
            </div>
          </div>

          <div className="pt-5 flex flex-wrap gap-3">
            <Link href="/admin/auction-products" className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">
              ← กลับ
            </Link>

            {data.active_aid ? (
              <Link
                href={`/admin/auctions/${data.active_aid}`}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                ดูรอบประมูล
              </Link>
            ) : (
              <Link
                href={`/admin/auctions/new?proid=${data.PROid}`}
                className="px-4 py-2 rounded bg-orange-600 text-white hover:bg-orange-700"
              >
                เปิดรอบประมูล
              </Link>
            )}

            <button
              onClick={deleteProduct}
              className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
            >
              ลบสินค้า
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
