'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

interface AP {
  PROid: number;
  PROname: string;
}

export default function NewAuctionPage() {
  const router = useRouter();

  const [items, setItems] = useState<AP[]>([]);
  const [proid, setProid] = useState<number | ''>('');
  const [start, setStart] = useState('0.00');
  const [minIncrement, setMinIncrement] = useState<number>(1);

  const [localDT, setLocalDT] = useState<string>('');  
  const [end, setEnd] = useState<string>('');          

  const [msg, setMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingItems, setLoadingItems] = useState(true);

  // utils
  const pad2 = (n: number) => String(n).padStart(2, '0');
  const toMySQL = (val: string) => (val ? val.replace('T', ' ') + ':00' : '');

  const defaultLocalDateTime = useMemo(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 30);
    d.setSeconds(0, 0);
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(
      d.getDate()
    )}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  }, []);

  useEffect(() => {
    setLoadingItems(true);
    fetch(`${API}/auction-products?status=ready`)
      .then((r) => r.json())
      .then((rows: AP[]) => setItems(rows ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoadingItems(false));
  }, []);

  useEffect(() => {
    setLocalDT(defaultLocalDateTime);
    setEnd(toMySQL(defaultLocalDateTime));
  }, [defaultLocalDateTime]);

  const onLocalDTChange = (val: string) => {
    setLocalDT(val);
    setEnd(toMySQL(val));
  };

  const endIsFuture = useMemo(() => {
    if (!end) return false;
    const t = new Date(end.replace(' ', 'T')).getTime();
    return Number.isFinite(t) && t > Date.now();
  }, [end]);

  const valid =
    Boolean(proid) &&
    Number(start) > 0 &&
    Number.isInteger(minIncrement) &&
    minIncrement >= 1 &&
    Boolean(end) &&
    endIsFuture &&
    items.length > 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || submitting) return;

    setSubmitting(true);
    setMsg('');

    try {
      const res = await fetch(`${API}/auctions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          PROid: proid,
          start_price: Number(start),
          end_time: end,
          min_increment: Math.max(1, Math.floor(minIncrement)),
        }),
      });

      const body: { Aid?: number; message?: string; error?: string } =
        await res.json().catch(() => ({}));

      if (res.status === 409) {
        setMsg(body?.error || '❌ สินค้านี้มีรอบเปิดอยู่แล้ว');
        return;
      }
      if (!res.ok || !body?.Aid) {
        setMsg(body?.error || '❌ เปิดไม่สำเร็จ');
        return;
      }

      setMsg('✅ เปิดรอบประมูลสำเร็จ กำลังไปหน้าจัดการ…');
      router.push(`/admin/auctions/${body.Aid}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="max-w-xl mx-auto p-6 text-black">
      <h1 className="text-2xl font-bold mb-4">เปิดรอบประมูล</h1>

      <form
        onSubmit={submit}
        className="bg-white rounded-2xl shadow border p-5 space-y-5"
      >
        {/* เลือกสินค้า */}
        <div>
          <label className="block mb-1 font-medium">เลือกสินค้า</label>
          {loadingItems ? (
            <div className="text-sm text-gray-600 bg-gray-50 border rounded p-3">
              กำลังโหลด…
            </div>
          ) : items.length === 0 ? (
            <div className="text-sm text-gray-600 bg-gray-50 border rounded p-3">
              ยังไม่มี “สินค้าประมูล” หรือทุกชิ้นมีรอบแล้ว
              <a
                href="/admin/auction-products/new"
                className="text-blue-600 underline ml-1"
              >
                เพิ่มสินค้า
              </a>
            </div>
          ) : (
            <select
              className="border rounded w-full h-11 px-3 bg-white"
              value={proid}
              onChange={(e) =>
                setProid(e.target.value === '' ? '' : Number(e.target.value))
              }
              required
            >
              <option value="">-- เลือกสินค้า --</option>
              {items.map((it) => (
                <option key={it.PROid} value={it.PROid}>
                  {it.PROname}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* ราคาเริ่มต้น */}
        <div>
          <label className="block mb-1 font-medium">ราคาเริ่มต้น (บาท)</label>
          <div className="relative">
            <input
              className="border rounded w-full h-11 pl-10 pr-3"
              type="number"
              min={0}
              step="0.01"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              required
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              ฿
            </span>
          </div>
        </div>

        {/* ก้าวบิดขั้นต่ำ */}
        <div>
          <label className="block text-sm font-medium mb-1">
            ก้าวบิดขั้นต่ำ (บาท)
          </label>
          <input
            type="number"
            min={1}
            step={1}
            value={minIncrement}
            onChange={(e) =>
              setMinIncrement(Math.max(1, Math.floor(Number(e.target.value) || 1)))
            }
            className="border rounded px-3 py-2 w-full"
            required
          />
        </div>

        {/* เวลาปิด */}
        <div>
          <label className="block mb-1 font-medium">เวลาปิด</label>
          <input
            className="border rounded w-full h-11 px-3"
            type="datetime-local"
            value={localDT}
            onChange={(e) => onLocalDTChange(e.target.value)}
            required
          />
        </div>

        {/* ปุ่ม */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!valid || submitting}
            className="bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded shadow-sm"
          >
            {submitting ? 'กำลังบันทึก…' : 'เปิดรอบประมูล'}
          </button>
          <a
            href="/admin/auction-products"
            className="px-4 py-2 rounded border bg-white hover:bg-gray-50"
          >
            กลับไปสินค้าประมูล
          </a>
        </div>

        {msg && (
          <div
            className={`text-sm mt-1 ${
              msg.startsWith('✅')
                ? 'text-green-700'
                : msg.startsWith('❌')
                ? 'text-red-600'
                : 'text-gray-700'
            }`}
          >
            {msg}
          </div>
        )}
      </form>
    </main>
  );
}
