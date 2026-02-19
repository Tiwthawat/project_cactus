'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/app/lib/apiFetch';

interface MyBiddingItem {
  Aid: number;
  PROid: number;
  PROname: string;
  PROpicture: string | null;
  current_price: number;
  my_last_bid: number | null;
  status: 'open' | 'closed';
  my_status: 'leading' | 'outbid' | 'won' | 'lost';
  end_time: string;
}

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

function fmtMoney(n: number) {
  return Number(n || 0).toLocaleString('th-TH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// ⭐ ลำดับน้ำหนักการเรียง
function getSortWeight(item: MyBiddingItem) {
  if (item.status === 'open') {
    if (item.my_status === 'outbid') return 0; // ถูกแซงก่อน
    if (item.my_status === 'leading') return 1; // กำลังนำ
  }
  if (item.status === 'closed') {
    if (item.my_status === 'won') return 2; // ชนะ
    if (item.my_status === 'lost') return 3; // แพ้
  }
  return 99;
}

function statusLabel(s: MyBiddingItem['my_status']) {
  switch (s) {
    case 'leading':
      return 'กำลังนำ';
    case 'outbid':
      return 'ถูกแซงแล้ว';
    case 'won':
      return 'ชนะประมูล';
    case 'lost':
      return 'แพ้ประมูล';
  }
}

function statusBadgeClass(s: MyBiddingItem['my_status']) {
  switch (s) {
    case 'leading':
      return 'border-emerald-300 bg-white text-emerald-700';
    case 'outbid':
      return 'border-rose-300 bg-white text-rose-700';
    case 'won':
      return 'border-emerald-600 bg-emerald-600 text-white';
    case 'lost':
      return 'border-red-600 bg-red-600 text-white';
  }
}

function pillStatusClass(status: MyBiddingItem['status']) {
  return status === 'open'
    ? 'border-emerald-200 bg-white text-emerald-800'
    : 'border-gray-200 bg-white text-gray-700';
}

function getImageUrl(path: string | null | undefined) {
  if (!path) return '/no-image.png';
  const clean = String(path).trim();
  if (!clean) return '/no-image.png';
  if (clean.startsWith('http')) return clean;
  if (clean.startsWith('/')) return `${API}${clean}`;
  return `${API}/${clean}`;
}

export default function MyBiddingPage() {
  const [items, setItems] = useState<MyBiddingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasToken, setHasToken] = useState(true);

  const headerMeta = useMemo(() => {
    const openCount = items.filter((x) => x.status === 'open').length;
    const outbidCount = items.filter((x) => x.status === 'open' && x.my_status === 'outbid').length;
    const leadingCount = items.filter((x) => x.status === 'open' && x.my_status === 'leading').length;
    return { openCount, outbidCount, leadingCount };
  }, [items]);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setHasToken(false);
          setItems([]);
          return;
        }
        setHasToken(true);

        const res = await apiFetch(`${API}/me/my-bidding`);
        const data = await res.json().catch(() => []);

        if (Array.isArray(data)) {
          const sorted = [...data].sort((a, b) => {
            const wa = getSortWeight(a);
            const wb = getSortWeight(b);
            if (wa !== wb) return wa - wb;
            return new Date(a.end_time).getTime() - new Date(b.end_time).getTime();
          });
          setItems(sorted);
        } else {
          setItems([]);
        }
      } catch (err) {
        console.error('FETCH ERROR:', err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    load();

    // ❗ 1000ms มันถี่ไปจริง ๆ (สั่น + server เหนื่อย)
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50 pt-24">
        <div className="max-w-5xl mx-auto px-4">
          <div className="rounded-2xl border border-emerald-200 bg-white/70 backdrop-blur p-8 shadow-sm">
            <div className="h-4 w-40 bg-gray-200 rounded mb-4 animate-pulse" />
            <div className="h-3 w-64 bg-gray-200 rounded mb-8 animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex gap-3">
                    <div className="w-24 h-24 rounded-xl bg-gray-200 animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
                      <div className="h-3 w-56 bg-gray-200 rounded animate-pulse" />
                      <div className="h-3 w-44 bg-gray-200 rounded animate-pulse" />
                      <div className="h-8 w-28 bg-gray-200 rounded-xl animate-pulse mt-3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 text-xs text-gray-500">กำลังโหลดรายการประมูลของคุณ…</div>
          </div>
        </div>
      </div>
    );
  }

  if (!hasToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50 pt-24">
        <div className="max-w-4xl mx-auto px-4">
          <div className="rounded-3xl border border-emerald-200 bg-white p-10 shadow-sm text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-extrabold text-emerald-800">
              โปรดเข้าสู่ระบบ
            </div>
            <div className="mt-4 text-2xl font-extrabold text-gray-900">ยังไม่พบการเข้าสู่ระบบ</div>
            <div className="mt-2 text-sm text-gray-600">
              เข้าสู่ระบบก่อน แล้วค่อยกลับมาดูรายการที่กำลังบิดอยู่
            </div>

            <Link
              href="/login"
              className="mt-6 inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 px-6 py-3 text-white font-extrabold shadow-lg hover:shadow-xl hover:from-emerald-700 hover:to-green-700 transition"
            >
              ไปหน้าเข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50 pt-24">
        <div className="max-w-4xl mx-auto px-4">
          <div className="rounded-3xl border border-gray-200 bg-white p-10 shadow-sm text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-xs font-extrabold text-emerald-800">
              My Bidding
            </div>
            <div className="mt-4 text-2xl font-extrabold text-gray-900">
              ยังไม่มีรายการที่กำลังบิดอยู่
            </div>
            <div className="mt-2 text-sm text-gray-600">
              ไปดูหน้าประมูลแล้วเริ่มบิดได้เลย
            </div>

            <Link
              href="/auctions"
              className="mt-6 inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 px-6 py-3 text-white font-extrabold shadow-lg hover:shadow-xl hover:from-emerald-700 hover:to-green-700 transition"
            >
              ไปหน้าเลือกประมูล
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50 text-black">


      <div className="max-w-5xl mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/70 px-4 py-2 shadow-sm backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-extrabold text-emerald-800">My Bidding</span>
          </div>

          <div className="mt-4 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
              <div className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">
                รายการประมูลที่กำลังบิดอยู่
              </div>
              <div className="mt-1 text-sm text-gray-600">
                เรียงตามความสำคัญ + ใกล้หมดเวลาก่อน
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-[11px] font-extrabold text-gray-700">
                เปิดอยู่ {headerMeta.openCount}
              </span>
              <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-extrabold text-rose-800">
                ถูกแซง {headerMeta.outbidCount}
              </span>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-extrabold text-emerald-800">
                กำลังนำ {headerMeta.leadingCount}
              </span>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => {
            const img = getImageUrl(item.PROpicture);
            const endTs = new Date(item.end_time).getTime();
            const now = Date.now();
            const msLeft = endTs - now;
            const isSoon = item.status === 'open' && msLeft > 0 && msLeft <= 10 * 60 * 1000; // 10 นาที
            const soonPill = isSoon
              ? 'border-amber-200 bg-amber-50 text-amber-800'
              : 'border-gray-200 bg-white text-gray-700';

            return (
              <div
                key={item.Aid}
                className="rounded-3xl border border-gray-200 bg-white shadow-sm hover:shadow-lg transition overflow-hidden"
              >
                {/* Top bar */}
                <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 via-white to-emerald-50"

>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-extrabold text-gray-900 line-clamp-1">
                        {item.PROname}
                      </div>
                      <div className="mt-1 text-xs text-gray-600">
                        ปิดประมูล: <span className="font-bold">{formatDate(item.end_time)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`rounded-full border px-3 py-1 text-[11px] font-extrabold ${pillStatusClass(
                          item.status
                        )}`}
                      >
                        {item.status === 'open' ? 'OPEN' : 'CLOSED'}
                      </span>

                      <span
                        className={`rounded-full border px-3 py-1 text-[11px] font-extrabold ${soonPill}`}
                        title="จะขึ้นเมื่อใกล้หมดเวลา (<= 10 นาที)"
                      >
                        {isSoon ? 'ใกล้หมดเวลา' : 'เวลา'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex gap-4">
                    {/* Image */}
                    <div className="w-24 h-24 rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 shrink-0">
                      <img src={img} alt={item.PROname} className="w-full h-full object-cover" />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-extrabold ${statusBadgeClass(
                            item.my_status
                          )}`}
                        >
                          สถานะ: {statusLabel(item.my_status)}
                        </span>

                        {item.my_last_bid != null && (
                          <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1 text-[11px] font-extrabold text-gray-700">
                            บิดล่าสุด {fmtMoney(item.my_last_bid)} ฿
                          </span>
                        )}
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-gray-200 bg-white p-3">
                          <div className="text-[11px] font-bold text-gray-500">ราคาปัจจุบัน</div>
                          <div className="mt-1 text-lg font-extrabold text-gray-900">
                            {fmtMoney(item.current_price)} ฿
                          </div>
                        </div>

                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3">
                          <div className="text-[11px] font-bold text-emerald-700">ลิงก์ประมูล</div>
                          <div className="mt-1 text-sm font-extrabold text-emerald-900 line-clamp-1">
                            #{item.Aid}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-2">
                        <div className="text-xs text-gray-500">
                          อัปเดตอัตโนมัติทุกไม่กี่วินาที
                        </div>

                        <Link
                          href={`/auctions/${item.Aid}`}
                          className="inline-flex items-center justify-center rounded-xl bg-emerald-800 px-4 py-2 text-sm font-semibold text-white border border-emerald-900 hover:bg-emerald-900 transition"

                        >
                          ไปหน้าประมูล
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Small note */}
                  {item.status === 'open' && item.my_status === 'outbid' && (
                    <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4">
                      <div className="text-sm font-extrabold text-rose-800">โดนแซงแล้วนะ</div>
                      <div className="mt-1 text-xs text-rose-800/80">
                        ถ้ายังอยากได้ ให้เข้าไปบิดเพิ่มก่อนหมดเวลา
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
