'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/app/lib/apiFetch';

interface AuctionWin {
  Aid: number;
  PROid: number;
  PROname: string;
  PROpicture: string;
  PROstatus: string; // pending_payment | payment_review | paid | ...
  current_price: number;
}

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

function toImgUrl(pic?: string) {
  if (!pic) return '/no-image.png';
  const clean = String(pic).trim();
  if (!clean) return '/no-image.png';
  if (clean.startsWith('http')) return clean;
  if (clean.startsWith('/')) return `${API}${clean}`;
  return `${API}/${clean}`;
}

function fmtMoney(n: number) {
  return Number(n || 0).toLocaleString('th-TH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export default function AuctionWinsPage() {
  const [wins, setWins] = useState<AuctionWin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('ยังไม่ได้เข้าสู่ระบบ');
          setLoading(false);
          return;
        }

        const res = await apiFetch(`/me/my-auction-wins`, {});
        const json = await res.json().catch(() => null);

        if (!res.ok) {
          setError(json?.message || 'Error');
          return;
        }

        setWins(Array.isArray(json) ? json : []);
      } catch {
        setError('โหลดข้อมูลไม่สำเร็จ');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const badgeMeta = (s: string) => {
    if (s === 'pending_payment')
      return {
        label: 'รอชำระเงิน',
        cls: 'border-amber-200 bg-white text-amber-700',
        dot: 'bg-amber-500',
      };
    if (s === 'payment_review')
      return {
        label: 'รอตรวจสอบ',
        cls: 'border-sky-200 bg-white text-sky-700',
        dot: 'bg-sky-500',
      };
    if (s === 'paid')
      return {
        label: 'ชำระแล้ว',
        cls: 'border-emerald-200 bg-white text-emerald-700',
        dot: 'bg-emerald-600',
      };

    return {
      label: s,
      cls: 'border-gray-200 bg-white text-gray-700',
      dot: 'bg-gray-400',
    };
  };

  const headerStats = useMemo(() => {
    const total = wins.length;
    const pending = wins.filter((w) => w.PROstatus === 'pending_payment').length;
    const review = wins.filter((w) => w.PROstatus === 'payment_review').length;
    const paid = wins.filter((w) => w.PROstatus === 'paid').length;
    return { total, pending, review, paid };
  }, [wins]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-6 pt-24 pb-10">
          <div className="animate-pulse">
            <div className="h-5 w-44 bg-gray-200 rounded mb-3" />
            <div className="h-10 w-72 bg-gray-200 rounded mb-6" />
            <div className="h-4 w-64 bg-gray-100 rounded mb-10" />

            <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-gray-200 bg-white overflow-hidden"
                >
                  <div className="aspect-square bg-gray-100" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-6 bg-gray-100 rounded w-1/2" />
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                    <div className="h-10 bg-gray-200 rounded-xl w-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-6 pt-24 pb-10">
          <div className="rounded-2xl border border-red-200 bg-white p-6">
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
              <p className="text-sm font-semibold text-red-700">{error}</p>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              ถ้ายังไม่ได้เข้าสู่ระบบ ให้ลองไปหน้า Login ก่อนนะ
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="max-w-7xl mx-auto px-6 pt-24 pb-12">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2">
            <span className="h-2 w-2 rounded-full bg-emerald-600" />
            <span className="text-xs font-semibold tracking-wide text-emerald-800">
              AUCTION WINS
            </span>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">
                สินค้าที่ชนะประมูล
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                ดูสถานะการชำระเงิน และเข้าไปจัดการออเดอร์ได้จากรายละเอียดแต่ละรายการ
              </p>
            </div>

            {/* Mini stats (เงียบๆ แต่แพง) */}
            <div className="flex items-center gap-2 text-xs">
              <StatPill label="ทั้งหมด" value={headerStats.total} />
              <StatPill label="รอชำระ" value={headerStats.pending} />
              <StatPill label="รอตรวจ" value={headerStats.review} />
              <StatPill label="ชำระแล้ว" value={headerStats.paid} />
            </div>
          </div>
        </div>

        {wins.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
            <div className="mx-auto h-10 w-10 rounded-full border border-emerald-200 flex items-center justify-center">
              <span className="h-2 w-2 rounded-full bg-emerald-600" />
            </div>
            <div className="mt-4 text-sm font-semibold text-gray-900">
              ยังไม่มีรายการที่ชนะประมูล
            </div>
            <div className="mt-1 text-sm text-gray-600">
              ถ้าชนะแล้ว รายการจะขึ้นมาแสดงที่หน้านี้อัตโนมัติ
            </div>

            <Link
              href="/"
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white border border-emerald-900 hover:bg-emerald-900 transition"
            >
              กลับไปเลือกสินค้า
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {wins.map((w) => {
              const img = toImgUrl(w.PROpicture);
              const meta = badgeMeta(w.PROstatus);

              return (
                <div
                  key={w.Aid}
                  className="group rounded-2xl border border-gray-200 bg-white overflow-hidden transition hover:border-emerald-200"
                >
                  {/* accent line */}
                  <div className="h-[3px] bg-emerald-600" />

                  {/* Image */}
                  <div className="w-full aspect-square overflow-hidden bg-gray-50">
                    <img
                      src={img}
                      className="w-full h-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      alt={w.PROname}
                      loading="lazy"
                    />
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">
                        {w.PROname}
                      </p>
                      <span className="shrink-0 h-2 w-2 rounded-full bg-emerald-600 mt-1.5 opacity-70" />
                    </div>

                    {/* Status pill */}
                    <div className="mt-3">
                      <span
                        className={[
                          'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold',
                          meta.cls,
                        ].join(' ')}
                      >
                        <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                        {meta.label}
                      </span>
                    </div>

                    {/* Price */}
                    <div className="mt-3 text-sm text-gray-700">
                      ราคาชนะ:{' '}
                      <span className="font-semibold text-gray-900">
                        {fmtMoney(w.current_price)} บาท
                      </span>
                    </div>

                    {/* Button */}
                    <Link
                      href={`/me/auction-wins/${w.Aid}`}
                      className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-emerald-800 px-3 py-2.5 text-sm font-semibold text-white border border-emerald-900 hover:bg-emerald-900 transition"
                    >
                      ดูรายละเอียด
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  function StatPill({ label, value }: { label: string; value: number }) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold text-gray-900">{value}</span>
      </div>
    );
  }
}
