'use client';

import { apiFetch } from '@/app/lib/apiFetch';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import StatusBadge from '@/app/component/StatusBadge';
import { AUCTION_STATUS, getMeta } from '@/app/lib/status';

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

type SortKey =
  | 'admin'
  | 'aid_asc'
  | 'aid_desc'
  | 'end_asc'
  | 'end_desc'
  | 'price_desc'
  | 'price_asc';

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

function fmtPrice(n: number) {
  return Number(n || 0).toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function safeImgUrl(raw: string) {
  const first = (raw || '').split(',')[0]?.trim() || '';
  if (!first) return '/no-image.png';
  if (first.startsWith('http')) return first;
  if (first.startsWith('/')) return `${API}${first}`;
  return `${API}/${first}`;
}

type RemainMeta = { t: string; c: string };

function remainLabel(end: string, status: Auction['status'], nowTs: number): RemainMeta {
  if (status === 'closed') return { t: 'ปิดแล้ว', c: 'text-gray-500' };

  const diff = new Date(end).getTime() - nowTs;
  if (Number.isNaN(diff)) return { t: '—', c: 'text-gray-400' };
  if (diff <= 0) return { t: 'หมดเวลาแล้ว', c: 'text-red-600' };

  let s = Math.floor(diff / 1000);
  const d = Math.floor(s / 86400);
  s %= 86400;
  const h = Math.floor(s / 3600);
  s %= 3600;
  const m = Math.floor(s / 60);
  s %= 60;

  const txt = [d ? `${d} วัน` : '', h ? `${h} ชม.` : '', m ? `${m} นาที` : '', `${s} วิ`]
    .filter(Boolean)
    .join(' ');

  return { t: txt, c: 'text-gray-700' };
}

function getErrMsg(err: unknown) {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'ทำรายการไม่สำเร็จ ลองใหม่อีกครั้ง';
}

export default function AdminAuctionsPage() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState<StatusFilter>('open');
  const [sortKey, setSortKey] = useState<SortKey>('admin');

  const [nowTs, setNowTs] = useState(() => Date.now());

  const [busyId, setBusyId] = useState<number | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setInterval(() => setNowTs(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const fetchAuctions = async (f: StatusFilter = filter) => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (f !== 'all') params.set('status', f);

      const res = await apiFetch(`${API}/auctions?${params.toString()}`, { cache: 'no-store' });
      if (!res.ok) {
        setAuctions([]);
        return;
      }

      const data: unknown = await res.json().catch(() => []);
      setAuctions(Array.isArray(data) ? (data as Auction[]) : []);
    } catch (e) {
      console.error(e);
      setAuctions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuctions(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  useEffect(() => {
    const t = window.setInterval(() => {
      if (busyId) return;
      fetchAuctions(filter);
    }, 30000);

    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, busyId]);

  const runAction = async (key: number, action: string, fn: () => Promise<void>) => {
    if (busyId) return;

    try {
      setBusyId(key);
      setBusyAction(action);

      await fn();
      await fetchAuctions(filter);
    } catch (e) {
      console.error(e);
      alert(getErrMsg(e));
    } finally {
      setBusyId(null);
      setBusyAction(null);
    }
  };

  const closeAuction = async (Aid: number) => {
    if (!confirm('ยืนยันปิดประมูลรอบนี้?')) return;

    await runAction(Aid, 'close', async () => {
      const res = await apiFetch(`${API}/auctions/${Aid}/close`, { method: 'PATCH' });
      const data = (await res.json().catch(() => null)) as { error?: string; message?: string } | null;
      if (!res.ok) throw new Error(data?.error || data?.message || 'ปิดประมูลไม่สำเร็จ');
    });
  };

  const deleteAuction = async (Aid: number) => {
    if (!confirm('ลบรอบประมูลนี้? (ลบได้เฉพาะรอบที่ยังเปิดและไม่มีคนบิด)')) return;

    await runAction(Aid, 'delete-auction', async () => {
      const res = await apiFetch(`${API}/auctions/${Aid}`, { method: 'DELETE' });
      const data = (await res.json().catch(() => null)) as { error?: string; message?: string } | null;
      if (!res.ok) throw new Error(data?.error || data?.message || 'ลบรอบไม่สำเร็จ');
    });
  };

  const deleteAuctionProduct = async (PROid: number, Aid: number) => {
    if (!confirm('ลบสินค้าประมูลนี้ออกจากระบบ?')) return;

    await runAction(Aid, 'delete-product', async () => {
      const res = await apiFetch(`${API}/auction-products/${PROid}`, { method: 'DELETE' });
      const data = (await res.json().catch(() => null)) as { error?: string; message?: string } | null;
      if (!res.ok) throw new Error(data?.error || data?.message || 'ลบสินค้าไม่สำเร็จ');
    });
  };

  const sortedAuctions = useMemo(() => {
    const arr = [...auctions];
    const endTs = (x: Auction) => new Date(x.end_time).getTime();

    const cmpAdmin = (a: Auction, b: Auction) => {
      if (a.status !== b.status) return a.status === 'open' ? -1 : 1;

      if (a.status === 'open') {
        const da = endTs(a);
        const db = endTs(b);
        if (da !== db) return da - db;
        return b.Aid - a.Aid;
      }
      return b.Aid - a.Aid;
    };

    const cmp = (a: Auction, b: Auction) => {
      switch (sortKey) {
        case 'admin':
          return cmpAdmin(a, b);
        case 'aid_asc':
          return a.Aid - b.Aid;
        case 'aid_desc':
          return b.Aid - a.Aid;
        case 'end_asc': {
          const da = endTs(a);
          const db = endTs(b);
          if (da !== db) return da - db;
          return b.Aid - a.Aid;
        }
        case 'end_desc': {
          const da = endTs(a);
          const db = endTs(b);
          if (da !== db) return db - da;
          return b.Aid - a.Aid;
        }
        case 'price_asc':
          return a.current_price - b.current_price;
        case 'price_desc':
          return b.current_price - a.current_price;
        default:
          return 0;
      }
    };

    arr.sort(cmp);
    return arr;
  }, [auctions, sortKey]);

  const btnBase =
    'text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-lg whitespace-nowrap';
  const disabledCls = 'opacity-50 cursor-not-allowed hover:shadow-md';

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
                onClick={() => fetchAuctions(filter)}
                disabled={loading || Boolean(busyId)}
                className={`bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300 px-4 py-2 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg ${
                  loading || busyId ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                🔄 รีเฟรช
              </button>

              <Link
                href="/admin/auction-products/new"
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                + เพิ่มสินค้าประมูล
              </Link>

              <Link
                href="/admin/auctions/new"
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
              >
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
              <div className="flex flex-wrap gap-2">
                {[
                  { v: 'open' as StatusFilter, label: '🟢 เปิดประมูล' },
                  { v: 'closed' as StatusFilter, label: '🔴 ปิดแล้ว' },
                  { v: 'all' as StatusFilter, label: '📦 ทั้งหมด' },
                ].map((x) => {
                  const active = filter === x.v;
                  return (
                    <button
                      key={x.v}
                      type="button"
                      onClick={() => setFilter(x.v)}
                      className={`px-3 py-2 rounded-xl font-semibold border transition text-sm ${
                        active
                          ? 'bg-green-600 text-white border-green-600 shadow'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-green-50'
                      }`}
                    >
                      {x.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* เรียงลำดับ */}
            <div className="lg:col-span-2">
              <label className="block text-gray-700 font-semibold mb-2">เรียงลำดับ:</label>
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="w-full border-2 border-gray-300 rounded-xl px-3 py-2 font-semibold text-gray-700 bg-white hover:bg-gray-50 transition"
              >
                <option value="admin">⭐ แนะนำ (open ก่อน → ใกล้หมดก่อน → closed ใหม่ก่อน)</option>
                <option value="aid_desc">รหัสประมูล (Aid) : ใหม่ → เก่า</option>
                <option value="aid_asc">รหัสประมูล (Aid) : เก่า → ใหม่</option>
                <option value="end_asc">เวลาปิด (end_time) : ใกล้สุด → ไกลสุด</option>
                <option value="end_desc">เวลาปิด (end_time) : ไกลสุด → ใกล้สุด</option>
                <option value="price_desc">ราคาปัจจุบัน : มาก → น้อย</option>
                <option value="price_asc">ราคาปัจจุบัน : น้อย → มาก</option>
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
        ) : sortedAuctions.length === 0 ? (
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
                    <th className="p-4 text-center">สถานะ</th>
                    <th className="p-4 text-center">จัดการ</th>
                  </tr>
                </thead>

                <tbody>
                  {sortedAuctions.map((a, idx) => {
                    const img = safeImgUrl(a.PROpicture);
                    const remain = remainLabel(a.end_time, a.status, nowTs);

                    const hasBid = Number(a.current_price) > Number(a.start_price);
                    const canClose = a.status === 'open';
                    const canDeleteAuction = a.status === 'open' && !hasBid;

                    const showDeleteProduct = canDeleteAuction;
                    const busyThisRow = busyId === a.Aid;

                    const hintDeleteAuction = !canDeleteAuction
                      ? a.status !== 'open'
                        ? 'ลบได้เฉพาะรอบที่ยังเปิดอยู่'
                        : 'ลบไม่ได้: รอบนี้มีคนบิดแล้ว'
                      : '';

                    // ✅ ใช้ status.ts (แก้สีจากที่เดียว)
                    const meta = getMeta(AUCTION_STATUS, a.status);
                    const statusLabel = a.status === 'open' ? `🟢 ${meta.label}` : `🔴 ${meta.label}`;

                    return (
                      <tr key={a.Aid} className="border-b border-gray-200 hover:bg-green-50 transition-colors">
                        <td className="p-4 text-center font-semibold text-gray-700">{idx + 1}</td>

                        <td className="p-4 text-center font-mono text-sm bg-gray-50">
                          {`auc:${String(a.Aid).padStart(4, '0')}`}
                        </td>

                        <td className="p-4 text-center hidden md:table-cell">
                          <img
                            src={img}
                            className="h-16 w-16 mx-auto rounded-lg object-cover shadow-md"
                            alt={a.PROname}
                          />
                        </td>

                        <td className="p-4">
                          <Link
                            href={`/admin/auctions/${a.Aid}`}
                            className="text-blue-600 hover:text-blue-800 font-semibold hover:underline"
                          >
                            {a.PROname}
                          </Link>
                        </td>

                        <td className="p-4 text-right font-semibold text-gray-700">{fmtPrice(a.start_price)}</td>

                        <td className="p-4 text-right font-semibold text-green-600">
                          {fmtPrice(a.current_price)}
                          {hasBid && <div className="text-xs text-gray-500 mt-0.5">มีการบิดแล้ว</div>}
                        </td>

                        <td className="p-4 text-center hidden lg:table-cell">
                          <div className="text-sm text-gray-600">{new Date(a.end_time).toLocaleString('th-TH')}</div>
                          <div className={`text-xs font-semibold ${remain.c}`}>{remain.t}</div>
                        </td>

                        {/* ✅ เปลี่ยนจาก span hardcode -> StatusBadge */}
                        <td className="p-4 text-center">
                          <StatusBadge label={statusLabel} tone={meta.tone} />
                        </td>

                        <td className="p-4 text-center">
                          <div className="flex flex-col gap-2 items-center">
                            <button
                              onClick={() => closeAuction(a.Aid)}
                              disabled={!canClose || busyThisRow}
                              title={!canClose ? 'ปิดแล้ว' : ''}
                              className={`bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 ${btnBase} ${
                                !canClose || busyThisRow ? disabledCls : ''
                              }`}
                            >
                              {busyThisRow && busyAction === 'close' ? 'กำลังปิด...' : 'ปิดประมูล'}
                            </button>

                            <button
                              onClick={() => deleteAuction(a.Aid)}
                              disabled={!canDeleteAuction || busyThisRow}
                              title={hintDeleteAuction}
                              className={`bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 ${btnBase} ${
                                !canDeleteAuction || busyThisRow ? disabledCls : ''
                              }`}
                            >
                              {busyThisRow && busyAction === 'delete-auction' ? 'กำลังลบ...' : 'ลบรอบ'}
                            </button>

                            {showDeleteProduct && (
                              <button
                                onClick={() => deleteAuctionProduct(a.PROid, a.Aid)}
                                disabled={busyThisRow}
                                className={`bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 ${btnBase} ${
                                  busyThisRow ? disabledCls : ''
                                }`}
                              >
                                {busyThisRow && busyAction === 'delete-product' ? 'กำลังลบ...' : 'ลบสินค้า'}
                              </button>
                            )}

                            {!canDeleteAuction && (
                              <div className="text-[11px] text-gray-500 leading-snug max-w-[170px]">{hintDeleteAuction}</div>
                            )}

                            {hasBid && a.status === 'open' && (
                              <div className="text-[11px] text-gray-400 leading-snug max-w-[170px]">
                                * รอบนี้มีคนบิดแล้ว จึงซ่อนปุ่มลบสินค้า
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 text-xs text-gray-500 border-t bg-gray-50">
              * ปุ่ม “ลบรอบ / ลบสินค้า” จะทำงานได้เฉพาะรอบที่ยังเปิดและไม่มีคนบิด เพื่อกันข้อมูลพัง
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
