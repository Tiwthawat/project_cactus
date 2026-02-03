'use client';

import { apiFetch } from '@/app/lib/apiFetch';
import { useState } from 'react';

type Summary = {
  Aid: number;
  PROname: string;
  PROpicture: string; // อาจเป็น "/uploads/xxx.jpg"
  status: string;
  current_price: number;
  winner_name: string;
  bid_count: number;
};

type BidRow = {
  Bidid: number;
  username: string;
  amount: number;
  created_at: string;
  is_winner: 0 | 1 | boolean;
};

type Props = {
  aid: number | null; // ได้มาจากหน้าออเดอร์ (อย่าให้กรอกเอง)
};

export default function BiddingLogsPanel({ aid }: Props) {
  const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [bids, setBids] = useState<BidRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadedOnce, setLoadedOnce] = useState(false);

  const loadData = async () => {
    if (!aid) return;

    setLoading(true);
    try {
      const res = await apiFetch(`${API}/admin/bidding-logs?Aid=${aid}`, { cache: 'no-store' });

      if (res.status === 401 || res.status === 403) {
        window.location.href = '/';
        return;
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data?.message || 'โหลดข้อมูลไม่สำเร็จ');
        return;
      }

      setSummary(data.summary || null);
      setBids(Array.isArray(data.bids) ? data.bids : []);
      setLoadedOnce(true);
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  const toggle = async () => {
    const next = !open;
    setOpen(next);

    // ✅ lazy load: โหลดครั้งแรกตอนกดเปิด
    if (next && !loadedOnce) {
      await loadData();
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-50 to-gray-50 hover:from-slate-100 hover:to-gray-100 transition"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center shadow">
            📜
          </div>
          <div className="text-left">
            <div className="text-lg font-bold text-gray-800">ประวัติการบิด </div>
            <div className="text-sm text-gray-500">
              ใช้ตรวจสอบย้อนหลังของรอบประมูล{aid ? ` #${aid}` : ''}
            </div>
          </div>
        </div>
        <div className="text-gray-600 font-semibold">{open ? 'ซ่อน ▲' : 'ดู ▼'}</div>
      </button>

      {open && (
        <div className="p-6">
          {!aid ? (
            <div className="text-gray-500">ยังไม่มี Aid สำหรับออเดอร์นี้</div>
          ) : loading ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <div className="text-gray-600">กำลังโหลด...</div>
            </div>
          ) : (
            <>
              {summary && (
                <div className="border-2 border-gray-200 rounded-2xl p-5 mb-6 bg-gradient-to-br from-white to-indigo-50">
                  <div className="flex flex-col md:flex-row gap-5">
                    <img
                      src={`${API}${summary.PROpicture}`}
                      alt="product"
                      className="w-28 h-28 rounded-xl border object-cover"
                    />
                    <div className="space-y-1 text-gray-800">
                      <div className="text-lg font-bold">รอบประมูล #{summary.Aid}</div>
                      <div>สินค้า: <b>{summary.PROname}</b></div>
                      <div>สถานะรอบ: {summary.status}</div>
                      <div>ราคาปิด: <b>{summary.current_price}</b> บาท</div>
                      <div>ผู้ชนะ: <b>{summary.winner_name}</b></div>
                      <div>จำนวนบิดทั้งหมด: <b>{summary.bid_count}</b></div>
                    </div>
                  </div>
                </div>
              )}

              {bids.length === 0 ? (
                <div className="text-gray-500">ไม่พบรายการบิด</div>
              ) : (
                <div className="overflow-x-auto border-2 border-gray-200 rounded-2xl">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-left">
                        <th className="p-3">#</th>
                        <th className="p-3">ผู้บิด</th>
                        <th className="p-3">ราคา</th>
                        <th className="p-3">เวลา</th>
                        <th className="p-3 text-center">ผู้ชนะ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bids.map((b) => (
                        <tr key={b.Bidid} className="border-t border-gray-200 hover:bg-indigo-50">
                          <td className="p-3 font-mono text-sm">{b.Bidid}</td>
                          <td className="p-3">{b.username}</td>
                          <td className="p-3 font-semibold">{b.amount} บาท</td>
                          <td className="p-3 text-sm">
                            {new Date(b.created_at).toLocaleString('th-TH')}
                          </td>
                          <td className="p-3 text-center text-xl">
                            {b.is_winner ? '🏆' : ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-4 text-xs text-gray-400">
                *ฟีเจอร์เสริมเพื่อการตรวจสอบย้อนหลัง ไม่กระทบการทำงานหลักของระบบ
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
