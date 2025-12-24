'use client';
import { apiFetch } from '@/app/lib/apiFetch';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

interface Auction {
  Aid: number;
  start_price: number;
  current_price: number;
  end_time: string;
  status: 'open' | 'closed';
  PROid: number;
  PROname: string;
  PROpicture: string;
  winnerName?: string | null;
  payment_status?: string;
  shipping_status?: string;
}

type StatusFilter = 'all' | 'open' | 'closed';
type ResultFilter = '' | 'won' | 'unsold';
type PayFilter = '' | 'pending_payment' | 'payment_review' | 'paid';
type ShipFilter = '' | 'pending' | 'shipped' | 'delivered';

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

export default function AdminAuctionsPage() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState<StatusFilter>('all');
  const [resultFilter, setResultFilter] = useState<ResultFilter>('');
  const [payFilter, setPayFilter] = useState<PayFilter>('');
  const [shipFilter, setShipFilter] = useState<ShipFilter>('');

  const [nowTs, setNowTs] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // โหลดข้อมูลจาก backend
  const fetchAuctions = async (
    f: StatusFilter = filter,
    r: ResultFilter = resultFilter,
    p: PayFilter = payFilter,
    s: ShipFilter = shipFilter
  ) => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (f !== 'all') params.append('status', f);
      if (r) params.append('result', r);
      if (p) params.append('payment_status', p);
      if (s) params.append('shipping_status', s);

      const res = await apiFetch(`${API}/auctions?${params.toString()}`, {
        cache: 'no-store'
      });

      if (!res.ok) {
  setAuctions([]);
  return;
}

const data = await res.json();
setAuctions(Array.isArray(data) ? data : []);

    } catch (e) {
      console.error(e);
      setAuctions([]);
    } finally {
      setLoading(false);
    }
  };

  // โหลดครั้งแรก + โหลดเมื่อฟิลเตอร์เปลี่ยน
  useEffect(() => {
    fetchAuctions(filter, resultFilter, payFilter, shipFilter);
  }, [filter, resultFilter, payFilter, shipFilter]);

  // Auto-refresh ทุก 30 วิ
  useEffect(() => {
    const t = setInterval(
      () => fetchAuctions(filter, resultFilter, payFilter, shipFilter),
      30000
    );
    return () => clearInterval(t);
  }, [filter, resultFilter, payFilter, shipFilter]);

  const fmtPrice = (n: number) =>
    n.toLocaleString('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

  const remainLabel = (end: string, status: string) => {
    if (status === 'closed') return { t: 'ปิดแล้ว', c: 'text-gray-500' };

    const diff = new Date(end).getTime() - nowTs;
    if (diff <= 0) return { t: 'หมดเวลาแล้ว', c: 'text-red-600' };

    let s = Math.floor(diff / 1000);
    const d = Math.floor(s / 86400);
    s %= 86400;
    const h = Math.floor(s / 3600);
    s %= 3600;
    const m = Math.floor(s / 60);
    s %= 60;

    const txt = [
      d ? `${d} วัน` : '',
      h ? `${h} ชม.` : '',
      m ? `${m} นาที` : '',
      `${s} วิ`
    ]
      .filter(Boolean)
      .join(' ');

    return { t: txt, c: 'text-gray-700' };
  };

  return (
    <div className="p-6 text-black">
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-xl font-bold">จัดการสินค้าประมูล</h1>

        <div className="flex gap-2">
          <button
            onClick={() => fetchAuctions(filter, resultFilter, payFilter, shipFilter)}
            className="border bg-white px-3 py-2 rounded"
          >
            รีเฟรช
          </button>

          <Link href="/admin/auction-products/new" className="bg-green-600 text-white px-4 py-2 rounded">
            + เพิ่มสินค้าประมูล
          </Link>

          <Link href="/admin/auctions/new" className="bg-blue-600 text-white px-4 py-2 rounded">
            + เปิดรอบประมูล
          </Link>
        </div>
      </div>

      {/* ฟิลเตอร์ */}
      <div className="flex gap-6 mb-5 flex-wrap">
        {/* สถานะประมูล */}
        <div>
          <label>สถานะประมูล:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as StatusFilter)}
            className="border px-3  bg-white py-2 rounded ml-2"
          >
            <option value="all">ทั้งหมด</option>
            <option value="open">open</option>
            <option value="closed">closed</option>
          </select>
        </div>

        {/* ผลลัพธ์ */}
        <div>
          <label>ผลลัพธ์:</label>
          <select
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value as ResultFilter)}
            className="border px-3  bg-white py-2 rounded ml-2"
          >
            <option value="">ทั้งหมด</option>
            <option value="won">มีผู้ชนะ</option>
            <option value="unsold">ไม่มีผู้ชนะ</option>
          </select>
        </div>

        {/* ชำระเงิน */}
        <div>
          <label>ชำระเงิน:</label>
          <select
            value={payFilter}
            onChange={(e) => setPayFilter(e.target.value as PayFilter)}
            className="border px-3 py-2  bg-white rounded ml-2"
          >
            <option value="">ทั้งหมด</option>
            <option value="pending_payment">รอชำระเงิน</option>
            <option value="payment_review">รอตรวจสอบ</option>
            <option value="paid">ชำระเงินแล้ว</option>
          </select>
        </div>

        {/* จัดส่ง */}
        <div>
          <label>สถานะจัดส่ง:</label>
          <select
            value={shipFilter}
            onChange={(e) => setShipFilter(e.target.value as ShipFilter)}
            className="border px-3  bg-white py-2 rounded ml-2"
          >
            <option value="">ทั้งหมด</option>
            <option value="pending">รอจัดส่ง</option>
            <option value="shipped">กำลังจัดส่ง</option>
            <option value="delivered">จัดส่งสำเร็จ</option>
          </select>
        </div>
      </div>

      {/* ตาราง */}
      {loading ? (
        <div className="p-4 bg-white border rounded">กำลังโหลด...</div>
      ) : auctions.length === 0 ? (
        <div className="p-4 bg-white border rounded">ไม่พบข้อมูล</div>
      ) : (
        <table className="w-full bg-white border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">#</th>
              <th className="p-2 border">รหัส</th>
              <th className="p-2 border">รูป</th>
              <th className="p-2 border">สินค้า</th>
              <th className="p-2 border">เริ่มต้น</th>
              <th className="p-2 border">ปัจจุบัน</th>
              <th className="p-2 border">ปิดประมูล</th>
              <th className="p-2 border">ผู้ชนะ</th>
              <th className="p-2 border">สถานะ</th>
              <th className="p-2 border">การชำระเงิน</th>
              <th className="p-2 border">สถานะจัดส่ง</th>
              <th className="p-2 border">จัดการ</th>
            </tr>
          </thead>

          <tbody>
            {auctions.map((a, idx) => {
              const firstImg = a.PROpicture?.split(',')[0] ?? '';
              const img = `${API}${firstImg}`;
              const remain = remainLabel(a.end_time, a.status);

              return (
                <tr key={a.Aid} className="even:bg-gray-50">
                  <td className="p-2 border text-center">{idx + 1}</td>
                  <td className="p-2 border text-center">{a.Aid}</td>

                  {/* รูป */}
                  <td className="p-2 border text-center">
                    <img src={img} className="h-12 mx-auto rounded" />
                  </td>

                  {/* ชื่อสินค้า */}
                  <td className="p-2 border">
                    <Link href={`/admin/auctions/${a.Aid}`} className="text-blue-600 underline">
                      {a.PROname}
                    </Link>
                  </td>

                  <td className="p-2 border text-right">{fmtPrice(a.start_price)}</td>
                  <td className="p-2 border text-right">{fmtPrice(a.current_price)}</td>

                  {/* ปิดประมูล */}
                  <td className="p-2 border text-center">
                    {new Date(a.end_time).toLocaleString('th-TH')}
                    <div className={`text-xs ${remain.c}`}>{remain.t}</div>
                  </td>

                  {/* ผู้ชนะ */}
                  <td className="p-2 border text-center">
                    {a.status === 'closed' ? a.winnerName ?? '-' : '-'}
                  </td>

                  {/* สถานะ open/closed */}
                  <td className="p-2 border text-center">
                    {a.status === 'open' ? (
                      <span className="text-green-600 font-semibold">open</span>
                    ) : (
                      <span className="text-gray-600 font-semibold">closed</span>
                    )}
                  </td>

                  {/* การชำระเงิน */}
                  <td className="p-2 border text-center">
                    {a.winnerName ? (
                      a.payment_status ? (
                        <>
                          {a.payment_status === 'pending_payment' && (
                            <span className="text-orange-600">รอชำระเงิน</span>
                          )}
                          {a.payment_status === 'payment_review' && (
                            <span className="text-blue-600">รอตรวจ</span>
                          )}
                          {a.payment_status === 'paid' && (
                            <span className="text-green-600">ชำระเงินแล้ว</span>
                          )}
                        </>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>

                  {/* สถานะจัดส่ง */}
                  <td className="p-2 border text-center">
                    {a.winnerName ? (
                      a.shipping_status ? (
                        <>
                          {a.shipping_status === 'pending' && (
                            <span className="text-orange-600">รอจัดส่ง</span>
                          )}
                          {a.shipping_status === 'shipped' && (
                            <span className="text-blue-600">กำลังส่ง</span>
                          )}
                          {a.shipping_status === 'delivered' && (
                            <span className="text-green-600">สำเร็จ</span>
                          )}
                        </>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>

                  {/* ปุ่มจัดการ */}
                  <td className="p-2 border text-center">
                    {a.status === 'open' && (
                      <button
                        className="bg-red-500 text-white px-2 py-1 rounded mr-2"
                      >
                        ปิดประมูล
                      </button>
                    )}
                    <button className="bg-gray-700 text-white px-2 py-1 rounded mr-2">
                      ลบรอบ
                    </button>
                    <button className="bg-gray-300 px-2 py-1 rounded">
                      ลบสินค้า
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
