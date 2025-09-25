'use client';

import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type Status = 'open' | 'closed';


interface Auction {
  Aid: number;
  start_price: number | string;
  current_price: number | string;
  min_increment?: number | string;
  end_time: string; // ISO
  status: Status;

  PROid: number;
  PROname: string;
  PROpicture: string; // "a.jpg,b.jpg"
  PROdetail?: string;
  PROdesc?: string;

  seller_name?: string;
}

const API = process.env.NEXT_PUBLIC_API_BASE as string;

// แปลงสตริงรูปเป็นลิสต์ URL เต็ม
const toPics = (s?: string) =>
  (s || '')
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) =>
      /^https?:\/\//.test(p) ? p : `${API}${p.startsWith('/') ? '' : '/'}${p}`
    );

const baht = (n: number) =>
  new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
  }).format(n);

export default function AuctionDetailPage() {
  const { id } = useParams<{ id: string }>();

  // ---- state หลัก ----
  const [data, setData] = useState<Auction | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [posting, setPosting] = useState(false);
  const [amount, setAmount] = useState<number | ''>(''); // ฟิลด์บิด

  // gallery
  const pics = toPics(data?.PROpicture);
  const [mainImage, setMainImage] = useState<string>('');
  const mainImgFull = mainImage || pics[0] || '';
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!data) return;
    if (new Date(data.end_time).getTime() <= Date.now()) return; // หมดเวลาแล้ว ไม่ต้องวิ่ง
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [data?.end_time]);


  // โหลดรายละเอียด + poll ทุก 3 วิ
  useEffect(() => {
    let t: any;
    const load = async () => {
      try {
        const res = await fetch(`${API}/auction/${id}`, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: Auction = await res.json();

        // แปลงค่า numeric ที่มาจาก backend
        const cur = Number(json.current_price ?? 0);
        const step = Math.max(1, Number(json.min_increment ?? 1));
        const startBid = cur + step;

        setData(json);
        setErr('');
        setAmount((prev) => (prev === '' ? startBid : prev));

        // ตั้งรูปหลัก
        const arr = toPics(json.PROpicture);
        setMainImage(arr[0] || '');
      } catch (e: any) {
        setErr(e.message || 'โหลดข้อมูลไม่สำเร็จ');
      } finally {
        setLoading(false);
      }
    };
    load();
    t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, [id]);

  // ค่า numeric ที่ใช้ใน UI
  const cur = Number(data?.current_price ?? 0);
  const step = Math.max(1, Number(data?.min_increment ?? 1));
  const requiredMin = cur + step;


  // นับถอยหลัง (วิ่งทุกวินาที)
  const left = useMemo(() => {
    if (!data) return '';
    const ms = Math.max(0, new Date(data.end_time).getTime() - now);
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  }, [data?.end_time, now]);


  const closedByTime = data
    ? new Date(data.end_time).getTime() <= Date.now()
    : false;
  const closed = data?.status === 'closed' || closedByTime;

  // ส่งบิด
  const submitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || amount === '') return;

    const min = cur + step;
    if (Number(amount) < min) {
      setErr(`ต้องบิดอย่างน้อย ${min.toLocaleString()} บาท`);
      return;
    }

    try {
      setPosting(true);
      setErr('');
      const res = await fetch(`${API}/auctions/${data.Aid}/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ amount }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.ok === false) {
        throw new Error(json?.error || json?.message || 'บิดไม่สำเร็จ');
      }

      const newPrice: number = Number(
        json.new_price ?? json.current_price ?? amount
      );

      setData({ ...data, current_price: newPrice });
      setAmount(newPrice + step);
    } catch (e: any) {
      setErr(e.message || 'บิดไม่สำเร็จ');
    } finally {
      setPosting(false);
    }
  };

  if (loading) return <main className="pt-36 px-6">กำลังโหลด…</main>;
  if (!data)
    return (
      <main className="pt-36 px-6 text-red-600">
        {err || 'ไม่พบรอบนี้'}
      </main>
    );

  const product = {
    Pname: data.PROname,
    Ppicture: data.PROpicture,
    Pdetail: data.PROdetail ?? '',
    Pprice: cur,
    Pid: data.PROid,
    Pstatus: data.status,
  };

  return (
    <div className="p-10 pt-40 max-w-6xl mx-auto bg-white text-black space-y-8">
      <div className="flex flex-col lg:flex-row gap-10 items-start">
        {/* ✅ ฝั่งซ้าย */}
        <div className="w-full lg:w-1/2">
          <h1 className="text-2xl font-bold mb-4">{product.Pname}</h1>

          {/* รูปหลัก */}
          <div className="w-full aspect-[4/3] rounded-lg overflow-hidden shadow">
            {mainImgFull ? (
              <img
                src={mainImgFull}
                alt={product.Pname}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                ไม่มีรูป
              </div>
            )}
          </div>

          {/* Thumbnail */}
          {pics.length > 0 && (
            <div className="flex gap-2 mt-4">
              {pics.map((full, i) => (
                <img
                  key={i}
                  src={full}
                  className={`w-20 h-20 object-cover rounded cursor-pointer border hover:border-red-500 ${mainImgFull === full ? 'ring-2 ring-red-500' : ''
                    }`}
                  onClick={() => setMainImage(full)}
                  alt={`thumb-${i}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* ✅ ฝั่งขวา */}
        <div className="w-full lg:w-1/2 flex flex-col gap-6">
          {/* โปรดอ่าน */}
          <div className="bg-yellow-100 border border-yellow-300 p-4 rounded shadow">
            <p className="text-sm font-medium text-red-600">📌 โปรดอ่าน</p>
            <ul className="text-sm text-gray-700 list-disc ml-4 mt-1">
              <li>
                ผู้ประมูลต้องตรวจรายละเอียดและภาพสินค้าให้ชัดเจนก่อนตัดสินใจ
              </li>
              <li>เมื่อชนะการประมูลแล้ว ไม่สามารถยกเลิกได้</li>
            </ul>
          </div>

          {/* ข้อมูลร้านค้า */}
          <div className="bg-pink-100 p-4 rounded border border-pink-300 shadow">
            <p className="font-medium text-gray-800 border-b pb-1 mb-2">
              ข้อมูลร้านค้า
            </p>
            <div className="flex items-center gap-2">
              <span>👥</span>
              <p>{data.seller_name ?? 'ไม่ระบุ'}</p>
            </div>
          </div>

          {/* ❤️ ประมูลตอนนี้ */}
          <div className="space-y-3">
            <button className="border border-red-500 text-red-500 px-4 py-2 rounded hover:bg-red-100 text-sm w-full">
              ❤️ เพิ่มรายการโปรด
            </button>

            <h2 className="text-[28px] font-extrabold text-black">
              ประมูลตอนนี้ที่{' '}
              <span className="text-red-600 text-[36px] font-extrabold">
                {baht(product.Pprice)}
              </span>
            </h2>

            <div className="text-sm text-gray-700">
              เวลาคงเหลือ:{' '}
              <span className={`font-mono ${closed ? 'text-red-600' : ''}`}>
                {closed ? 'ปิดแล้ว' : left}
              </span>
            </div>


           <form onSubmit={submitBid} noValidate className="space-y-2">
  <div className="flex flex-col gap-2">
    
     
      <p className="text-sm text-gray-700">
  ต้องบิดขั้นต่ำ: ≥ <span className="font-bold text-red-600">{step} บาท</span>
</p>
    

    <div className="flex gap-2">
      <input
        type="number"
        min={requiredMin}
        step={step}
        required
        value={amount}
        onChange={(e) => setAmount(Math.floor(Number(e.target.value)))}
        disabled={posting || closed}
        className="w-full px-3 py-2 rounded border
          bg-white text-black placeholder-gray-400
          focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500
          disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={posting || closed}
        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded whitespace-nowrap"
      >
        {posting ? 'กำลังบิด…' : 'ประมูลตอนนี้'}
      </button>
    </div>
  </div>

  {err && <p className="text-red-600 text-sm">{err}</p>}
</form>


            <div className="text-sm text-gray-700">
              ขั้นต่ำต้องมากกว่า {requiredMin.toLocaleString('th-TH')} บาท
            </div>

            <p className="text-xs text-gray-700">
              รหัสสินค้า: cac:{String(product.Pid).padStart(4, '0')}
            </p>
            <p className="text-xs text-gray-700">
              สถานะ: {closed ? 'closed' : 'open'}
            </p>
          </div>
        </div>
      </div>

      {/* รายละเอียดสินค้า */}
      <div>
        <h2 className="font-semibold text-xl mb-2">รายละเอียดสินค้า</h2>
        <div className="whitespace-pre-line p-3 border bg-slate-50 rounded text-sm text-gray-800">
          {product.Pdetail || '-'}
        </div>
      </div>
    </div>
  );
}
