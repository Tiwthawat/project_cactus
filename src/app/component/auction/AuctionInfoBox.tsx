'use client';

import React from 'react';
import { Auction, Leader } from '@/app/types';

const baht = (n: number | string) =>
  new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(Number(n));

type Props = {
  data: Auction;
  cid: number | null;

  cur: number;
  step: number;
  requiredMin: number;

  left: string;
  closed: boolean;

  amount: number | '';
  setAmount: React.Dispatch<React.SetStateAction<number | ''>>;
  submitBid: (e: React.FormEvent) => void;
  posting: boolean;
  err: string;

  leader: Leader | null;
  isMeLeader: boolean;
  winnerName: string;
};

export default function AuctionInfoBox({
  data,
  cid,
  cur,
  step,
  requiredMin,
  left,
  closed,
  amount,
  setAmount,
  submitBid,
  posting,
  err,
  leader,
  isMeLeader,
  winnerName,
}: Props) {
  return (
    <div className="w-full flex flex-col gap-5">
      {/* Notice: ลดสีจัด ให้แพง */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        <div className="h-[2px] bg-emerald-700/70" />
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 h-9 w-9 rounded-xl border border-emerald-200 bg-emerald-50 flex items-center justify-center">
              <span className="text-emerald-800">i</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-extrabold text-gray-900">โปรดอ่านก่อนประมูล</p>
              <ul className="mt-2 text-sm text-gray-600 list-disc ml-5 space-y-1">
                <li>ตรวจรายละเอียดและภาพสินค้าให้ชัดเจนก่อนตัดสินใจ</li>
                <li>เมื่อชนะแล้ว ไม่สามารถยกเลิกได้</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

    

      {/* Auction box */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        <div className="h-[2px] bg-emerald-700/70" />

        <div className="p-4 space-y-4">
          {/* Leader (ตอนเปิด) */}
          {!closed && (
            leader ? (
              <div
                className={[
                  'rounded-xl border px-4 py-3 text-sm',
                  isMeLeader
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                    : 'border-red-200 bg-red-50 text-red-800',
                ].join(' ')}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold">
                    {isMeLeader ? 'คุณกำลังนำอยู่' : 'คุณถูกแซงแล้ว'}
                  </span>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full border
                    border-gray-200 bg-white text-gray-600">
                    LIVE
                  </span>
                </div>

                <div className="mt-2 text-sm">
                  ผู้ที่บิดสูงสุดตอนนี้: <b>{leader.username}</b>{' '}
                  <span className="font-extrabold">({baht(leader.amount)})</span>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                ยังไม่มีการบิด
              </div>
            )
          )}

          {/* Price / Timer */}
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-wide text-gray-500">CURRENT PRICE</p>
              <div className="mt-1 text-2xl font-extrabold tracking-tight text-gray-900">
                {baht(cur)}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                ขั้นต่ำเพิ่มครั้งละ <span className="font-semibold text-gray-800">{step.toLocaleString('th-TH')}</span> บาท
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs font-semibold tracking-wide text-gray-500">TIME LEFT</p>
              <div className={`mt-1 font-mono text-sm ${closed ? 'text-red-700' : 'text-emerald-800'}`}>
                {closed ? 'ปิดแล้ว' : left}
              </div>
            </div>
          </div>

          {/* Winner (ตอนปิด) */}
          {closed && (
            winnerName ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-extrabold text-emerald-900">🏆 ผู้ชนะรอบนี้</span>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full border border-emerald-200 bg-white text-emerald-800">
                    CLOSED
                  </span>
                </div>
                <div className="mt-2 text-sm text-emerald-900">
                  <b>{winnerName}</b> <span className="text-emerald-900/80">• ราคาปิด</span>{' '}
                  <span className="font-extrabold">{baht(cur)}</span>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                🛑 รอบนี้ไม่มีผู้ชนะ
              </div>
            )
          )}

          {/* Bid form */}
          {!closed && (
            <form onSubmit={submitBid} noValidate className="space-y-3">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>
                  ขั้นต่ำที่ต้องบิด:{" "}
                  <span className="font-semibold text-gray-900">
                    {requiredMin.toLocaleString('th-TH')} บาท
                  </span>
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-700/70" />
                  secure bid
                </span>
              </div>

              <div className="flex gap-2">
                <input
                  type="number"
                  min={requiredMin}
                  step={step}
                  required
                  value={amount}
                  onFocus={(e) => e.currentTarget.select()}
                  onChange={(e) => {
                    const v = Math.floor(Number(e.target.value));
                    if (Number.isNaN(v)) setAmount('');
                    else setAmount(v);
                  }}
                  disabled={posting}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900
                             focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600
                             disabled:opacity-50"
                />

                <button
                  type="submit"
                  disabled={posting}
                  className="shrink-0 px-4 py-2.5 rounded-xl text-sm font-extrabold
                             bg-emerald-900 text-white hover:bg-emerald-950
                             shadow-sm disabled:opacity-60"
                >
                  {posting ? 'กำลังบิด…' : 'ประมูลตอนนี้'}
                </button>
              </div>

              {err && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {err}
                </div>
              )}

              {!cid && (
                <p className="text-amber-700 text-xs">
                  (ยังไม่พบ Cid ในเครื่อง — โปรดเข้าสู่ระบบก่อน)
                </p>
              )}
            </form>
          )}

          {/* Footer meta */}
          <div className="pt-2 border-t border-gray-100 text-xs text-gray-500 space-y-1">
            <p>รหัสสินค้า: <span className="font-semibold text-gray-800">cac:{String(data.PROid).padStart(4, '0')}</span></p>
            <p>สถานะรอบ: <span className="font-semibold text-gray-800">{closed ? 'closed' : 'open'}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
