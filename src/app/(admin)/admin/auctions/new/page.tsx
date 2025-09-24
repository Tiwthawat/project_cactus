'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

interface AP { PROid: number; PROname: string; }

export default function NewAuctionPage() {
  const router = useRouter();

  // ====== state ======
  const [items, setItems] = useState<AP[]>([]);
  const [proid, setProid] = useState<number | ''>('');
  const [start, setStart] = useState('0.00');
  const [minIncrement, setMinIncrement] = useState(1);

  // datetime-local (ค่าที่โชว์ใน UI) + end (รูปแบบ MySQL DATETIME)
  const [localDT, setLocalDT] = useState<string>('');          // e.g. 2025-09-25T23:59
  const [end, setEnd] = useState<string>('');                  // e.g. 2025-09-25 23:59:00

  const [msg, setMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingItems, setLoadingItems] = useState(true);

  // ====== utils ======
  const pad2 = (n: number) => String(n).padStart(2, '0');
  const toMySQL = (val: string) => (val ? val.replace('T', ' ') + ':00' : '');

  // สร้างเวลาเริ่มต้นอีก 30 นาทีข้างหน้า (แสดงใน input)
  const defaultLocalDateTime = useMemo(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 30);
    d.setSeconds(0, 0);
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  }, []);

  // โหลดเฉพาะสินค้าที่ "ยังไม่มีรอบ open"
  useEffect(() => {
    setLoadingItems(true);
    fetch(`${API}/auction-products?available=1`)
      .then(r => r.json())
      .then((rows: AP[]) => setItems(rows ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoadingItems(false));
  }, []);

  // ตั้งค่าเวลาเริ่มต้นให้ทั้ง UI และ end (เพื่อให้ valid แม้ผู้ใช้ไม่แตะเวลา)
  useEffect(() => {
    setLocalDT(defaultLocalDateTime);
    setEnd(toMySQL(defaultLocalDateTime));
  }, [defaultLocalDateTime]);

  // เมื่อผู้ใช้เปลี่ยนค่า datetime-local
  const onLocalDTChange = (val: string) => {
    setLocalDT(val);
    setEnd(toMySQL(val));
  };

  // ฟอร์ม valid เมื่อเลือกสินค้าครบ, ราคามากกว่า 0, minIncrement > 0 และเวลาปิดไม่ว่าง
  const valid =
    Boolean(proid) &&
    Number(start) > 0 &&
    minIncrement > 0 &&
    Boolean(end) &&
    items.length > 0;

  // submit
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
          end_time: end,              // YYYY-MM-DD HH:mm:ss
          min_increment: minIncrement // 👈 สำคัญ
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

      <form onSubmit={submit} className="bg-white rounded-2xl shadow border p-5 space-y-5">
        {/* เลือกสินค้า */}
        <div>
          <label className="block mb-1 font-medium">เลือกสินค้า</label>

          {loadingItems ? (
            <div className="text-sm text-gray-600 bg-gray-50 border rounded p-3">กำลังโหลด…</div>
          ) : items.length === 0 ? (
            <div className="text-sm text-gray-600 bg-gray-50 border rounded p-3">
              ตอนนี้ทุกชิ้นมีรอบเปิดอยู่แล้ว หรือยังไม่มี “สินค้าประมูล”
              <a href="/admin/auction-products/new" className="text-blue-600 underline ml-1">
                เพิ่มสินค้า
              </a>
            </div>
          ) : (
            <select
              className="border rounded w-full h-11 px-3 bg-white"
              value={proid}
              onChange={(e) => setProid(e.target.value === '' ? '' : Number(e.target.value))}
              required
            >
              <option value="">-- เลือกสินค้า --</option>
              {items.map(it => (
                <option key={it.PROid} value={it.PROid}>{it.PROname}</option>
              ))}
            </select>
          )}

          <p className="text-xs text-gray-500 mt-1">
            แสดงเฉพาะสินค้าที่ “ยังไม่มีรอบเปิดอยู่”
          </p>
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
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">฿</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">ต้องมากกว่า 0</p>
        </div>

        {/* ก้าวบิดขั้นต่ำ */}
        <div>
          <label className="block text-sm font-medium mb-1">ก้าวบิดขั้นต่ำ (บาท)</label>
          <input
            type="number"
            min={1}
            step={1}
            value={minIncrement}
            onChange={(e) => setMinIncrement(Number(e.target.value))}
            className="border rounded px-3 py-2 w-full"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            เช่น 1 / 5 / 10 บาท (ขั้นต่ำที่ผู้เข้าร่วมต้องบิดเพิ่มจากราคาปัจจุบัน)
          </p>
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
          <p className="text-xs text-gray-500 mt-1">
            จะส่งเป็นรูปแบบ: <code>YYYY-MM-DD HH:mm:ss</code>
          </p>
        </div>

        {/* ปุ่ม */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!valid || submitting}
            className="bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded shadow-sm"
          >
            {submitting ? 'กำลังเปิด…' : 'เปิดรอบประมูล'}
          </button>

          <a
            href="/admin/auction-products"
            className="px-4 py-2 rounded border bg-white hover:bg-gray-50"
          >
            กลับไปสินค้าประมูล
          </a>
        </div>

        {/* ข้อความแจ้งผล */}
        {msg && (
          <div
            className={`text-sm mt-1 ${
              msg.startsWith('✅') ? 'text-green-700' : msg.startsWith('❌') ? 'text-red-600' : 'text-gray-700'
            }`}
          >
            {msg}
          </div>
        )}
      </form>
    </main>
  );
}
