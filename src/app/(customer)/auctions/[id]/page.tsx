'use client';

import AuctionGallery from '@/app/component/auction/AuctionGallery';
import AuctionInfoBox from '@/app/component/auction/AuctionInfoBox';

import { Auction, Leader } from '@/app/types';
import { apiFetch } from '@/app/lib/apiFetch';
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

  const [leader, setLeader] = useState<Leader | null>(null);

  const isWinner = data?.winner_id && cid && data.winner_id === cid;

  // โหลด leader แยก + poll
  useEffect(() => {
    if (!id) return;
    const loadLeader = async () => {
      try {
        const res = await apiFetch(`${API}/auction/${id}/leader`);
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

  // clock tick
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

  // โหลดรายละเอียด + poll
  useEffect(() => {
    let t: any;
    const load = async () => {
      try {
        const res = await apiFetch(`${API}/auction/${id}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: Auction = await res.json();

        const cur = Number(json.current_price ?? 0);
        const step = Math.max(1, Number(json.min_increment ?? 1));
        const startBid = cur + step;

        setData(json);
        setErr('');
        setAmount((prev) => (prev === '' ? startBid : prev));

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

  const cur = Number(data?.current_price ?? 0);
  const step = Math.max(1, Number(data?.min_increment ?? 1));
  const requiredMin = cur + step;

  // นับถอยหลัง
  const left = useMemo(() => {
    if (!data) return '';
    const ms = Math.max(0, new Date(data.end_time).getTime() - now);
    const s = Math.floor(ms / 1000);

    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = s % 60;

    if (d > 0) {
      return `${d} วัน ${String(h).padStart(2, '0')}:${String(m).padStart(
        2,
        '0'
      )}:${String(ss).padStart(2, '0')}`;
    }
    return `${String(h).padStart(2, '0')}:${String(m).padStart(
      2,
      '0'
    )}:${String(ss).padStart(2, '0')}`;
  }, [data?.end_time, now]);

  const closedByTime = data
    ? new Date(data.end_time).getTime() <= Date.now()
    : false;
  const closed = data?.status === 'closed' || closedByTime;

  // ส่งบิด
  const submitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || amount === '') return;

    if (!cid) {
      setErr('กรุณาเข้าสู่ระบบก่อนบิด');
      return;
    }

    // ถ้ากำลังเป็นผู้นำอยู่แล้ว → ถามยืนยัน
    if (leader && cid && leader.user_id === cid) {
      const ok = window.confirm(
        'คุณเป็นผู้บิดสูงสุดอยู่แล้ว ต้องการบิดซ้ำเพื่อเพิ่มราคาจริงหรือไม่?'
      );
      if (!ok) return;
    }

    const min = cur + step;
    if (Number(amount) < min) {
      setErr(`ต้องบิดอย่างน้อย ${min.toLocaleString('th-TH')} บาท`);
      return;
    }

    try {
      setPosting(true);
      setErr('');
      const res = await apiFetch(`${API}/auctions/${data.Aid}/bid`, {
        method: 'POST',
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

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        {/* ลดช่องบน: pt-24 */}
        <div className="max-w-6xl mx-auto px-4 pt-24 pb-10">
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <div className="h-[2px] bg-emerald-700/70" />
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-6 w-1/2 bg-gray-100 rounded" />
                <div className="h-64 bg-gray-100 rounded-xl" />
                <div className="h-10 w-1/3 bg-gray-100 rounded" />
              </div>
              <p className="mt-4 text-sm text-gray-500">กำลังโหลด…</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-white">
        <div className="max-w-6xl mx-auto px-4 pt-24 pb-10">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
            {err || 'ไม่พบรอบนี้'}
          </div>
        </div>
      </main>
    );
  }

  const product = {
    Pname: data.PROname,
    Ppicture: data.PROpicture,
    Pdetail: data.PROdetail ?? '',
    Pprice: cur,
    Pid: data.PROid,
    Pstatus: data.status,
  };

  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* ลดช่องบนจากเดิม pt-40 → pt-24 */}
      <div className="max-w-6xl mx-auto px-4 pt-24 pb-12 space-y-8">
        {/* Header: minimal accent */}
        <div className="flex flex-col gap-2">
          <div className="inline-flex items-center gap-2 w-fit">
            <span className="h-2 w-2 rounded-full bg-emerald-700/70" />
            <span className="text-xs font-semibold tracking-widest text-gray-500">
              AUCTION DETAIL
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            {product.Pname}
          </h1>
          <div className="h-[2px] w-24 bg-emerald-700/70 rounded" />
        </div>

        {/* Winner / Loser banner */}
        {closed && isWinner && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 overflow-hidden">
            <div className="h-[2px] bg-emerald-700/70" />
            <div className="p-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-extrabold text-emerald-900">
                  🏆 คุณเป็นผู้ชนะการประมูลรายการนี้
                </p>
                <p className="text-sm text-emerald-900/80 mt-1">
                  ราคาปิด: <span className="font-extrabold">{cur.toLocaleString('th-TH')}</span> บาท
                </p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full border border-emerald-200 bg-white text-emerald-800">
                WINNER
              </span>
            </div>
          </div>
        )}

        {closed && !isWinner && data?.winner_id && (
          <div className="rounded-2xl border border-red-200 bg-red-50 overflow-hidden">
            <div className="h-[2px] bg-red-600/70" />
            <div className="p-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-extrabold text-red-800">
                  คุณแพ้การประมูลรายการนี้
                </p>
                <p className="text-sm text-red-800/80 mt-1">
                  ผู้ชนะ: <span className="font-extrabold">{data.winnerName ?? 'ไม่ทราบชื่อ'}</span>
                </p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full border border-red-200 bg-white text-red-700">
                LOST
              </span>
            </div>
          </div>
        )}

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left: Gallery */}
          <div className="space-y-4">
            <AuctionGallery
              pics={pics}
              mainImage={mainImage}
              setMainImage={setMainImage}
              productName={product.Pname}
            />

            {/* Detail box (premium) */}
            <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
              <div className="h-[2px] bg-emerald-700/70" />
              <div className="p-5">
                <p className="text-xs font-semibold tracking-widest text-gray-500">
                  PRODUCT DETAIL
                </p>
                <div className="mt-3 whitespace-pre-line text-sm leading-relaxed text-gray-700">
                  {product.Pdetail || '-'}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Info box */}
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
            winnerName={data.winnerName ?? ''}
          />
        </div>
      </div>
    </main>
  );
}
