'use client';

import AuctionGallery from '@/app/component/auction/AuctionGallery';
import AuctionInfoBox from '@/app/component/auction/AuctionInfoBox';

import { Auction, Leader } from '@/app/types';

import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';




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



export default function AuctionDetailPage() {
  const { id } = useParams<{ id: string }>();

  // ---- state หลัก ----
  const [data, setData] = useState<Auction | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [posting, setPosting] = useState(false);
  const [amount, setAmount] = useState<number | ''>(''); // ฟิลด์บิด

  // mock-auth (แผน A): Cid เอาจาก localStorage.user
  const [cid, setCid] = useState<number | null>(null);

  // gallery
  const pics = toPics(data?.PROpicture);
  const [mainImage, setMainImage] = useState<string>('');


  // clock สำหรับนับถอยหลังแบบวิ่งทุกวินาที
  const [now, setNow] = useState(() => Date.now());

  const [winnerName, setWinnerName] = useState<string>("");
  const [leader, setLeader] = useState<Leader | null>(null);
  



  useEffect(() => {
    if (!id) return;
    const loadLeader = async () => {
      try {
        const res = await fetch(`${API}/auction/${id}/leader`);
        if (!res.ok) throw new Error('โหลด leader ไม่สำเร็จ');
        const json = await res.json();
        setLeader(json.leader ?? null);
      } catch {
        setLeader(null);
      }
    };
    loadLeader();
    const t = setInterval(loadLeader, 3000);
    return () => clearInterval(t);
  }, [id]);









  
  useEffect(() => {
    if (!data) return;
    if (new Date(data.end_time).getTime() <= Date.now()) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [data?.end_time]);

  // โหลด Cid จาก localStorage (แผน A)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      if (raw) {
        const u = JSON.parse(raw);
        if (u?.Cid) setCid(Number(u.Cid));
      }
    } catch {
      // ignore
    }
  }, []);

  // โหลดรายละเอียด + poll ทุก 3 วิ
  useEffect(() => {
    let t: any;
    const load = async () => {
      try {
        const res = await fetch(`${API}/auction/${id}`, {
          // แผน A ไม่ต้องใช้คุกกี้
          // credentials: 'omit',
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

  // นับถอยหลัง (อัปเดตทุกวินาทีด้วย state now)
const left = useMemo(() => {
  if (!data) return '';
  const ms = Math.max(0, new Date(data.end_time).getTime() - now);
  const s = Math.floor(ms / 1000);

  const d = Math.floor(s / 86400);                // วัน
  const h = Math.floor((s % 86400) / 3600);       // ชั่วโมงที่เหลือ
  const m = Math.floor((s % 3600) / 60);          // นาที
  const ss = s % 60;                              // วินาที

  if (d > 0) {
    // ถ้ามีวัน โชว์เป็น "X วัน HH:MM:SS"
    return `${d} วัน ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  } else {
    // ถ้าวัน = 0 โชว์แค่ HH:MM:SS
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  }
}, [data?.end_time, now]);


  const closedByTime = data
    ? new Date(data.end_time).getTime() <= Date.now()
    : false;
  const closed = data?.status === 'closed' || closedByTime;

  // ส่งบิด (แผน A: ส่ง Cid ใน body)
  const submitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || amount === '') return;

    if (!cid) {
      setErr('กรุณาเข้าสู่ระบบก่อนบิด');
      return;
    }

    const min = cur + step;
    if (Number(amount) < min) {
      setErr(`ต้องบิดอย่างน้อย ${min.toLocaleString('th-TH')} บาท`);
      return;
    }

    try {
      setPosting(true);
      setErr('');
      const res = await fetch(`${API}/auctions/${data.Aid}/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // แผน A ไม่ใช้ cookie/token
        // credentials: 'omit',
        body: JSON.stringify({ amount, Cid: cid }),
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
          <AuctionGallery
            pics={pics}
            mainImage={mainImage}
            setMainImage={setMainImage}
            productName={product.Pname}
          />


        </div>

        {/* ✅ ฝั่งขวา */}
        <AuctionInfoBox
          data={data}
          cid={cid}
          cur={cur}
          step={step}
          requiredMin={requiredMin}
          left={left}
          closed={closed}
          amount={amount}
          setAmount={setAmount}
          submitBid={submitBid}
          posting={posting}
          err={err}
          leader={leader}
          isMeLeader={!!(leader && cid && leader.user_id === cid)}
          winnerName={data.winnerName ?? ""} 
        />
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
