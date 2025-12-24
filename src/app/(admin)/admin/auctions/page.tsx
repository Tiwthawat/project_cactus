'use client';

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

      const res = await fetch(`${API}/auctions?${params.toString()}`, {
        cache: 'no-store'
      });

      const data = await res.json();
      setAuctions(data ?? []);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
      <div className="p-6 pt-8">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-block bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-full text-sm font-semibold mb-4">
            จัดการประมูล
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              🔨 จัดการสินค้าประมูล
            </h1>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => fetchAuctions(filter, resultFilter, payFilter, shipFilter)}
                className="bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300 px-4 py-2 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
              >
                🔄 รีเฟรช
              </button>

              <Link href="/admin/auction-products/new" className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl">
                + เพิ่มสินค้าประมูล
              </Link>

              <Link href="/admin/auctions/new" className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl">
                + เปิดรอบประมูล
              </Link>
            </div>
          </div>
        </div>

        {/* Filters Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-2 border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl shadow-md">
              🔍
            </div>
            <h2 className="text-2xl font-bold text-gray-800">กรองรายการ</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* สถานะประมูล */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">สถานะประมูล:</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as StatusFilter)}
                className="w-full p-3 border-2 border-gray-200 rounded-xl bg-gray-50 focus:border-green-400 focus:outline-none transition-colors font-semibold"
              >
                <option value="all">📦 ทั้งหมด</option>
                <option value="open">🟢 เปิดประมูล</option>
                <option value="closed">🔴 ปิดแล้ว</option>
              </select>
            </div>

            {/* ผลลัพธ์ */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">ผลลัพธ์:</label>
              <select
                value={resultFilter}
                onChange={(e) => setResultFilter(e.target.value as ResultFilter)}
                className="w-full p-3 border-2 border-gray-200 rounded-xl bg-gray-50 focus:border-green-400 focus:outline-none transition-colors font-semibold"
              >
                <option value="">📋 ทั้งหมด</option>
                <option value="won">🏆 มีผู้ชนะ</option>
                <option value="unsold">❌ ไม่มีผู้ชนะ</option>
              </select>
            </div>

            {/* ชำระเงิน */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">ชำระเงิน:</label>
              <select
                value={payFilter}
                onChange={(e) => setPayFilter(e.target.value as PayFilter)}
                className="w-full p-3 border-2 border-gray-200 rounded-xl bg-gray-50 focus:border-green-400 focus:outline-none transition-colors font-semibold"
              >
                <option value="">💳 ทั้งหมด</option>
                <option value="pending_payment">💰 รอชำระเงิน</option>
                <option value="payment_review">⌛ รอตรวจสอบ</option>
                <option value="paid">✅ ชำระเงินแล้ว</option>
              </select>
            </div>

            {/* จัดส่ง */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">สถานะจัดส่ง:</label>
              <select
                value={shipFilter}
                onChange={(e) => setShipFilter(e.target.value as ShipFilter)}
                className="w-full p-3 border-2 border-gray-200 rounded-xl bg-gray-50 focus:border-green-400 focus:outline-none transition-colors font-semibold"
              >
                <option value="">🚚 ทั้งหมด</option>
                <option value="pending">📦 รอจัดส่ง</option>
                <option value="shipped">🚛 กำลังจัดส่ง</option>
                <option value="delivered">📬 จัดส่งสำเร็จ</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow-lg p-10 text-center border-2 border-gray-200">
            <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">กำลังโหลด...</p>
          </div>
        ) : auctions.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-10 text-center border-2 border-gray-200">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl">
              🔨
            </div>
            <p className="text-gray-800 text-2xl md:text-3xl font-bold mb-3">ไม่พบข้อมูล</p>
            <p className="text-gray-500 text-base md:text-lg">ลองปรับเปลี่ยนตัวกรองหรือเพิ่มรอบประมูลใหม่</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                    <th className="p-4 text-center">#</th>
                    <th className="p-4 text-center">รหัส</th>
                    <th className="p-4 text-center hidden md:table-cell">รูป</th>
                    <th className="p-4 text-left">สินค้า</th>
                    <th className="p-4 text-right">เริ่มต้น</th>
                    <th className="p-4 text-right">ปัจจุบัน</th>
                    <th className="p-4 text-center hidden lg:table-cell">ปิดประมูล</th>
                    <th className="p-4 text-center hidden lg:table-cell">ผู้ชนะ</th>
                    <th className="p-4 text-center">สถานะ</th>
                    <th className="p-4 text-center hidden xl:table-cell">การชำระเงิน</th>
                    <th className="p-4 text-center hidden xl:table-cell">สถานะจัดส่ง</th>
                    <th className="p-4 text-center">จัดการ</th>
                  </tr>
                </thead>

                <tbody>
                  {auctions.map((a, idx) => {
                    const firstImg = a.PROpicture?.split(',')[0] ?? '';
                    const img = `${API}${firstImg}`;
                    const remain = remainLabel(a.end_time, a.status);

                    return (
                      <tr key={a.Aid} className="border-b border-gray-200 hover:bg-green-50 transition-colors">
                        <td className="p-4 text-center font-semibold text-gray-700">{idx + 1}</td>
                        <td className="p-4 text-center font-mono text-sm bg-gray-50">{a.Aid}</td>

                        {/* รูป */}
                        <td className="p-4 text-center hidden md:table-cell">
                          <img src={img} className="h-16 w-16 mx-auto rounded-lg object-cover shadow-md" alt={a.PROname} />
                        </td>

                        {/* ชื่อสินค้า */}
                        <td className="p-4">
                          <Link href={`/admin/auctions/${a.Aid}`} className="text-blue-600 hover:text-blue-800 font-semibold hover:underline">
                            {a.PROname}
                          </Link>
                        </td>

                        <td className="p-4 text-right font-semibold text-gray-700">{fmtPrice(a.start_price)}</td>
                        <td className="p-4 text-right font-semibold text-green-600">{fmtPrice(a.current_price)}</td>

                        {/* ปิดประมูล */}
                        <td className="p-4 text-center hidden lg:table-cell">
                          <div className="text-sm text-gray-600">{new Date(a.end_time).toLocaleString('th-TH')}</div>
                          <div className={`text-xs font-semibold ${remain.c}`}>{remain.t}</div>
                        </td>

                        {/* ผู้ชนะ */}
                        <td className="p-4 text-center hidden lg:table-cell">
                          {a.status === 'closed' ? (
                            a.winnerName ? (
                              <span className="px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-700 border-2 border-yellow-300">
                                🏆 {a.winnerName}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>

                        {/* สถานะ open/closed */}
                        <td className="p-4 text-center">
                          {a.status === 'open' ? (
                            <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700 border-2 border-green-300">
                              🟢 เปิด
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-700 border-2 border-gray-300">
                              🔴 ปิด
                            </span>
                          )}
                        </td>

                        {/* การชำระเงิน */}
                        <td className="p-4 text-center hidden xl:table-cell">
                          {a.winnerName ? (
                            a.payment_status ? (
                              <>
                                {a.payment_status === 'pending_payment' && (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-orange-100 text-orange-700 border-2 border-orange-300">
                                    💰 รอชำระ
                                  </span>
                                )}
                                {a.payment_status === 'payment_review' && (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-700 border-2 border-blue-300">
                                    ⌛ รอตรวจ
                                  </span>
                                )}
                                {a.payment_status === 'paid' && (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700 border-2 border-green-300">
                                    ✅ ชำระแล้ว
                                  </span>
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
                        <td className="p-4 text-center hidden xl:table-cell">
                          {a.winnerName ? (
                            a.shipping_status ? (
                              <>
                                {a.shipping_status === 'pending' && (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-orange-100 text-orange-700 border-2 border-orange-300">
                                    📦 รอจัดส่ง
                                  </span>
                                )}
                                {a.shipping_status === 'shipped' && (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-700 border-2 border-blue-300">
                                    🚛 กำลังส่ง
                                  </span>
                                )}
                                {a.shipping_status === 'delivered' && (
                                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700 border-2 border-green-300">
                                    📬 สำเร็จ
                                  </span>
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
                        <td className="p-4 text-center">
                          <div className="flex flex-col gap-2">
                            {a.status === 'open' && (
                              <button className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-lg whitespace-nowrap">
                                ปิดประมูล
                              </button>
                            )}
                            <button className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-lg whitespace-nowrap">
                              ลบรอบ
                            </button>
                            <button className="bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-lg whitespace-nowrap">
                              ลบสินค้า
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
