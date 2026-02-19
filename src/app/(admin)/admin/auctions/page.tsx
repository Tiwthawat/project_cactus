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
  if (status === 'closed') return { t: 'ปิดแล้ว', c: 'text-slate-500' };

  const diff = new Date(end).getTime() - nowTs;
  if (Number.isNaN(diff)) return { t: '—', c: 'text-slate-400' };
  if (diff <= 0) return { t: 'หมดเวลา', c: 'text-rose-700' };

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

  return { t: txt, c: 'text-slate-700' };
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
    'px-3 py-2 rounded-lg text-sm font-semibold transition shadow-sm hover:shadow-md whitespace-nowrap';
  const disabledCls = 'opacity-50 cursor-not-allowed hover:shadow-sm';

  return (
    <div className="min-h-screen bg-emerald-50">
      <div className="max-w-7xl mx-auto px-8 py-10">
        {/* Header */}
        <div className="mb-8 border-b border-emerald-100 pb-6">
          <p className="text-xs uppercase tracking-widest text-emerald-700 font-semibold">
            Auctions
          </p>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mt-2">
            <div>
              <h1 className="text-3xl font-semibold text-emerald-950 tracking-wide">
                จัดการสินค้าประมูล
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                จัดการรอบประมูล ปิดรอบ ลบรอบ และดูสถานะได้จากหน้านี้
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => fetchAuctions(filter)}
                disabled={loading || Boolean(busyId)}
                className={`bg-white text-slate-700 border border-emerald-200 hover:bg-emerald-50 ${btnBase} ${
                  loading || busyId ? disabledCls : ''
                }`}
              >
                รีเฟรช
              </button>

              <Link
                href="/admin/auction-products/new"
                className={`bg-emerald-800 text-white hover:bg-emerald-900 ${btnBase}`}
              >
                เพิ่มสินค้าประมูล
              </Link>

              <Link
                href="/admin/auctions/new"
                className={`bg-emerald-700 text-white hover:bg-emerald-800 ${btnBase}`}
              >
                เปิดรอบประมูล
              </Link>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-emerald-100">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="text-lg font-semibold text-emerald-950">ตัวกรอง</div>
              <div className="text-sm text-slate-600">เลือกสถานะและการเรียงลำดับ</div>
            </div>

            <div className="flex gap-2">
              {[
                { v: 'open' as StatusFilter, label: 'เปิดประมูล' },
                { v: 'closed' as StatusFilter, label: 'ปิดแล้ว' },
                { v: 'all' as StatusFilter, label: 'ทั้งหมด' },
              ].map((x) => {
                const active = filter === x.v;
                return (
                  <button
                    key={x.v}
                    type="button"
                    onClick={() => setFilter(x.v)}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold border transition ${
                      active
                        ? 'bg-emerald-800 text-white border-emerald-800'
                        : 'bg-white text-slate-700 border-emerald-200 hover:bg-emerald-50'
                    }`}
                  >
                    {x.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                เรียงลำดับ
              </label>
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="w-full border border-emerald-200 rounded-xl px-3 py-2 font-medium text-slate-700 bg-white hover:bg-emerald-50 transition"
              >
                <option value="admin">แนะนำ (open ก่อน → ใกล้หมดก่อน → closed ใหม่ก่อน)</option>
                <option value="aid_desc">รหัสประมูล (Aid) : ใหม่ → เก่า</option>
                <option value="aid_asc">รหัสประมูล (Aid) : เก่า → ใหม่</option>
                <option value="end_asc">เวลาปิด (end_time) : ใกล้สุด → ไกลสุด</option>
                <option value="end_desc">เวลาปิด (end_time) : ไกลสุด → ใกล้สุด</option>
                <option value="price_desc">ราคาปัจจุบัน : มาก → น้อย</option>
                <option value="price_asc">ราคาปัจจุบัน : น้อย → มาก</option>
              </select>
            </div>

            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
              <div className="text-xs uppercase tracking-widest text-emerald-700 font-semibold">
                Summary
              </div>
              <div className="mt-1 text-sm text-slate-700">
                แสดงผล: <span className="font-semibold">{sortedAuctions.length}</span> รายการ
              </div>
              <div className="text-xs text-slate-500 mt-1">อัปเดตอัตโนมัติทุก 30 วินาที</div>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm p-10 text-center border border-emerald-100">
            <div className="w-12 h-12 border-4 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600">กำลังโหลดข้อมูล...</p>
          </div>
        ) : sortedAuctions.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-10 text-center border border-emerald-100">
            <p className="text-emerald-950 text-2xl font-semibold mb-2">ไม่พบข้อมูล</p>
            <p className="text-slate-600">ลองเปลี่ยนตัวกรอง หรือสร้างรอบประมูลใหม่</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-emerald-950 text-emerald-50">
                    <th className="px-5 py-3 text-left text-xs uppercase tracking-wide font-semibold">#</th>
                    <th className="px-5 py-3 text-left text-xs uppercase tracking-wide font-semibold">รหัส</th>
                    <th className="px-5 py-3 text-left text-xs uppercase tracking-wide font-semibold hidden md:table-cell">
                      รูป
                    </th>
                    <th className="px-5 py-3 text-left text-xs uppercase tracking-wide font-semibold">สินค้า</th>
                    <th className="px-5 py-3 text-right text-xs uppercase tracking-wide font-semibold">เริ่มต้น</th>
                    <th className="px-5 py-3 text-right text-xs uppercase tracking-wide font-semibold">ปัจจุบัน</th>
                    <th className="px-5 py-3 text-center text-xs uppercase tracking-wide font-semibold hidden lg:table-cell">
                      ปิดประมูล
                    </th>
                    <th className="px-5 py-3 text-center text-xs uppercase tracking-wide font-semibold">สถานะ</th>
                    <th className="px-5 py-3 text-center text-xs uppercase tracking-wide font-semibold">จัดการ</th>
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

                    const meta = getMeta(AUCTION_STATUS, a.status);
                    const statusLabel = meta.label;

                    return (
                      <tr
                        key={a.Aid}
                        className="border-t border-emerald-100 hover:bg-emerald-50/60 transition-colors"
                      >
                        <td className="px-5 py-4 text-slate-700 font-medium">{idx + 1}</td>

                        <td className="px-5 py-4 font-mono text-xs text-slate-700 bg-emerald-50/50">
                          {`auc:${String(a.Aid).padStart(4, '0')}`}
                        </td>

                        <td className="px-5 py-4 hidden md:table-cell">
                          <img
                            src={img}
                            className="h-14 w-14 rounded-xl object-cover border border-emerald-100"
                            alt={a.PROname}
                          />
                        </td>

                        <td className="px-5 py-4">
                          <Link
                            href={`/admin/auctions/${a.Aid}`}
                            className="text-emerald-900 hover:text-emerald-700 font-semibold hover:underline"
                          >
                            {a.PROname}
                          </Link>
                        </td>

                        <td className="px-5 py-4 text-right font-medium text-slate-700">
                          {fmtPrice(a.start_price)}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="font-semibold text-emerald-800">{fmtPrice(a.current_price)}</div>
                          {hasBid && <div className="text-[11px] text-slate-500 mt-0.5">มีการบิดแล้ว</div>}
                        </td>

                        <td className="px-5 py-4 text-center hidden lg:table-cell">
                          <div className="text-xs text-slate-600">
                            {new Date(a.end_time).toLocaleString('th-TH')}
                          </div>
                          <div className={`text-xs font-semibold ${remain.c}`}>{remain.t}</div>
                        </td>

                        <td className="px-5 py-4 text-center">
                          <StatusBadge label={statusLabel} tone={meta.tone} />
                        </td>

                        <td className="px-5 py-4 text-center">
                          <div className="flex flex-col gap-2 items-center">
                            <button
                              onClick={() => closeAuction(a.Aid)}
                              disabled={!canClose || busyThisRow}
                              className={`bg-rose-700 text-white hover:bg-rose-800 ${btnBase} ${
                                !canClose || busyThisRow ? disabledCls : ''
                              }`}
                            >
                              {busyThisRow && busyAction === 'close' ? 'กำลังปิด...' : 'ปิดประมูล'}
                            </button>

                            <button
                              onClick={() => deleteAuction(a.Aid)}
                              disabled={!canDeleteAuction || busyThisRow}
                              title={hintDeleteAuction}
                              className={`bg-slate-700 text-white hover:bg-slate-800 ${btnBase} ${
                                !canDeleteAuction || busyThisRow ? disabledCls : ''
                              }`}
                            >
                              {busyThisRow && busyAction === 'delete-auction' ? 'กำลังลบ...' : 'ลบรอบ'}
                            </button>

                            {showDeleteProduct && (
                              <button
                                onClick={() => deleteAuctionProduct(a.PROid, a.Aid)}
                                disabled={busyThisRow}
                                className={`bg-slate-500 text-white hover:bg-slate-600 ${btnBase} ${
                                  busyThisRow ? disabledCls : ''
                                }`}
                              >
                                {busyThisRow && busyAction === 'delete-product' ? 'กำลังลบ...' : 'ลบสินค้า'}
                              </button>
                            )}

                            {!canDeleteAuction && (
                              <div className="text-[11px] text-slate-500 leading-snug max-w-[200px]">
                                {hintDeleteAuction}
                              </div>
                            )}

                            {hasBid && a.status === 'open' && (
                              <div className="text-[11px] text-slate-400 leading-snug max-w-[200px]">
                                รอบนี้มีการบิดแล้ว จึงซ่อนปุ่มลบสินค้า
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

            <div className="px-6 py-4 text-xs text-slate-500 border-t border-emerald-100 bg-emerald-50/60">
              ปุ่ม “ลบรอบ / ลบสินค้า” ทำได้เฉพาะรอบที่ยังเปิดและไม่มีคนบิด เพื่อป้องกันข้อมูลเสียหาย
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
