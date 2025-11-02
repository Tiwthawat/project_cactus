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
    <div className="w-full lg:w-1/2 flex flex-col gap-6">
      {/* โปรดอ่าน */}
      <div className="bg-yellow-100 border border-yellow-300 p-4 rounded shadow">
        <p className="text-sm font-medium text-red-600">📌 โปรดอ่าน</p>
        <ul className="text-sm text-gray-700 list-disc ml-4 mt-1">
          <li>ผู้ประมูลควรตรวจรายละเอียดและภาพสินค้าให้ชัดเจนก่อนตัดสินใจ</li>
          <li>เมื่อชนะการประมูลแล้ว ไม่สามารถยกเลิกได้</li>
        </ul>
      </div>

      {/* ข้อมูลร้านค้า */}
      <div className="bg-pink-100 p-4 rounded border border-pink-300 shadow">
        <p className="font-medium text-gray-800 border-b pb-1 mb-2">ข้อมูลร้านค้า</p>
        <div className="flex items-center gap-2">
          <span>👥</span>
          <p>{data.seller_name ?? 'ไม่ระบุ'}</p>
        </div>
      </div>

      {/* กล่องประมูล */}
      <div className="space-y-3 rounded-lg border p-4">
        {/* แสดงตอนเปิดประมูล */}
        {!closed && (
          leader ? (
            <div className={`p-3 rounded border ${isMeLeader ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
              🥇 ผู้ที่บิดสูงสุดตอนนี้:{' '}
              <b>{leader.username} ({baht(leader.amount)})</b>
              {isMeLeader && <span className="ml-2 text-green-700">คุณนำอยู่!</span>}
            </div>
          ) : (
            <div className="p-3 rounded border bg-gray-50 text-gray-600">ยังไม่มีการบิด</div>
          )
        )}

        {/* ราคา/เวลา */}
        <h2 className="text-xl font-bold">
          ประมูลตอนนี้ที่ <span className="text-red-600 text-2xl">{baht(cur)}</span>
        </h2>
        <div className="text-sm text-gray-700">
          เวลาคงเหลือ:{' '}
          <span className={`font-mono ${closed ? 'text-red-600' : ''}`}>
            {closed ? 'ปิดแล้ว' : left}
          </span>
        </div>

        {/* ผู้ชนะเมื่อปิดประมูล */}
        {closed && (
          winnerName ? (
            <div className="p-3 rounded border bg-green-50 border-green-200">
              🏆 ผู้ชนะรอบนี้: <b>{winnerName}</b>
              <span className="ml-2 text-red-600">ราคาปิด: {baht(cur)}</span>
            </div>
          ) : (
            <p className="text-sm text-gray-500">🛑 รอบนี้ไม่มีผู้ชนะ</p>
          )
        )}

        {/* ฟอร์มบิด (ซ่อนถ้าปิดแล้ว) */}
        {!closed && (
          <form onSubmit={submitBid} noValidate className="space-y-2">
            <div className="flex flex-col gap-2">
              <p className="text-sm text-gray-700">
                ต้องบิดขั้นต่ำ: <b className="text-red-600">≥ {step} บาท</b>
              </p>

              <div className="flex gap-2">
                <input
                  type="number"
                  min={requiredMin}
                  step={step}
                  required
                  value={amount}
                  onChange={(e) => {
                    const v = Math.floor(Number(e.target.value));
                    if (Number.isNaN(v)) setAmount('');
                    else setAmount(v);
                  }}
                  disabled={posting}
                  className="w-full px-3 py-2 rounded border bg-white text-black
                             focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500
                             disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={posting}
                  className="shrink-0 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
                >
                  {posting ? 'กำลังบิด…' : 'ประมูลตอนนี้'}
                </button>
              </div>
            </div>

            {err && <p className="text-red-600 text-sm">{err}</p>}
            {!cid && <p className="text-amber-700 text-xs">(ยังไม่พบ Cid ในเครื่อง — โปรดเข้าสู่ระบบก่อน)</p>}
          </form>
        )}

        <div className="text-sm text-gray-700">
          ขั้นต่ำต้อง ≥ {requiredMin.toLocaleString('th-TH')} บาท
        </div>
        <p className="text-xs text-gray-700">
          รหัสสินค้า: cac:{String(data.PROid).padStart(4, '0')}
        </p>
        <p className="text-xs text-gray-700">สถานะ: {closed ? 'closed' : 'open'}</p>
      </div>
    </div>
  );
}
