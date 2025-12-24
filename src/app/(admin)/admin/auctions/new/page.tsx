'use client';
import { apiFetch } from '@/app/lib/apiFetch';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

interface AuctionProduct {
  PROid: number;
  PROname: string;
  PROprice: number;
}

export default function NewAuctionPage() {
  const router = useRouter();

  const [products, setProducts] = useState<AuctionProduct[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);

  const [selectedProduct, setSelectedProduct] = useState<number | ''>('');
  const [startPrice, setStartPrice] = useState<string>('0.00');
  const [minIncrement, setMinIncrement] = useState<string>("1");


  const [localDT, setLocalDT] = useState('');
  const [end, setEnd] = useState('');
  const [msg, setMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const pad2 = (n: number) => String(n).padStart(2, '0');
  const toMySQL = (dt: string) => (dt ? dt.replace('T', ' ') + ':00' : '');

  // เวลา default
  const defaultLocalDT = useMemo(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 30);
    d.setSeconds(0, 0);
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(
      d.getHours()
    )}:${pad2(d.getMinutes())}`;
  }, []);

  useEffect(() => {
    setLocalDT(defaultLocalDT);
    setEnd(toMySQL(defaultLocalDT));
  }, [defaultLocalDT]);

  // โหลดสินค้าพร้อมราคา (สถานะ ready)
  useEffect(() => {
  setLoadingItems(true);

  const load = async () => {
    try {
      const res = await apiFetch(`${API}/auction-products?status=ready`);
      if (!res.ok) {
        setProducts([]);
        return;
      }

      const rows = await res.json();
      setProducts(Array.isArray(rows) ? rows : []);
    } catch {
      setProducts([]);
    } finally {
      setLoadingItems(false);
    }
  };

  load();
}, []);


  // เมื่อเลือกสินค้า → ตั้งราคาเริ่มต้นอัตโนมัติ
  const handleSelectProduct = (value: string) => {
    if (value === '') {
      setSelectedProduct('');
      setStartPrice('0.00');
      return;
    }

    const id = Number(value);
    setSelectedProduct(id);

    const product = products.find(p => p.PROid === id);
    if (product) {
      setStartPrice(Number(product.PROprice).toFixed(2));

    }
  };

  // เวลาเปลี่ยน
  const handleDateChange = (val: string) => {
    setLocalDT(val);
    setEnd(toMySQL(val));
  };

  const endIsFuture = (() => {
    if (!end) return false;
    const t = new Date(end.replace(' ', 'T')).getTime();
    return Number.isFinite(t) && t > Date.now();
  })();

const valid =
  Boolean(selectedProduct) &&
  Number(startPrice) > 0 &&
  Number(minIncrement) >= 1 &&
  Boolean(end) &&
  endIsFuture &&
  products.length > 0;


  // Submit
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || submitting) return;

    setSubmitting(true);
    setMsg('');

    try {
      const res = await apiFetch(`${API}/auctions`, {
        method: 'POST',
        body: JSON.stringify({
          PROid: selectedProduct,
          start_price: Number(startPrice),
          end_time: end,
          min_increment: Math.max(1, parseInt(minIncrement) || 1),

        }),
      });

      const json = await res.json().catch(() => ({} as any));

      if (res.status === 409) {
        setMsg(json.error || '❌ สินค้านี้มีรอบเปิดอยู่แล้ว');
        return;
      }
      if (!res.ok || !json.Aid) {
        setMsg(json.error || '❌ เปิดรอบประมูลไม่สำเร็จ');
        return;
      }

      setMsg('✅ เปิดรอบประมูลสำเร็จ! กำลังไปหน้าจัดการ…');
      router.push(`/admin/auctions/${json.Aid}`);
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
          <label className="block mb-1  font-medium">เลือกสินค้า</label>

          {loadingItems ? (
            <div className="text-gray-600 border p-3 rounded bg-gray-50">
              กำลังโหลด…
            </div>
          ) : products.length === 0 ? (
            <div className="text-gray-600 border p-3 rounded bg-gray-50">
              ยังไม่มีสินค้าที่พร้อมเปิดรอบ
              <a href="/admin/auction-products/new" className="text-blue-600 underline ml-1">
                เพิ่มสินค้า
              </a>
            </div>
          ) : (
            <select
              className="border bg-white  rounded w-full h-11 px-3"
              value={selectedProduct}
              onChange={(e) => handleSelectProduct(e.target.value)}
              required
            >
              <option value="">-- เลือกสินค้า --</option>
              {products.map((p) => (
                <option key={p.PROid} value={p.PROid}>
                  {p.PROname} (ราคา {p.PROprice} บาท)
                </option>
              ))}
            </select>
          )}
        </div>

        {/* ราคาเริ่มต้น */}
        <div >
          <label className="block mb-1  font-medium">ราคาเริ่มต้น (บาท)</label>
          <div className=" relative">
            <input
              type="number"
              step="0.01"
              min={0}
              className="border bg-white  rounded w-full h-11 pl-10 pr-3"
              value={startPrice}
              onChange={(e) => setStartPrice(e.target.value)}
              required
            />
            <span className="absolute  left-3 top-1/2 -translate-y-1/2 text-gray-500">฿</span>
          </div>
        </div>

        {/* ก้าวบิดขั้นต่ำ */}
        <div>
          <label className="block mb-1  font-medium">ก้าวบิดขั้นต่ำ (บาท)</label>
          <input
  type="number"
  min={1}
  step={1}
  value={minIncrement}
  onChange={(e) => setMinIncrement(e.target.value)}
  className="border bg-white   rounded px-3 py-2 w-full"
  required
/>

        </div>

        {/* เวลาปิด */}
        <div>
          <label className="block mb-1 font-medium">เวลาปิด</label>
          <input
            type="datetime-local"
            className="border bg-slate-300  rounded w-full h-11 px-3"
            value={localDT}
            onChange={(e) => handleDateChange(e.target.value)}
            required
          />
        </div>

        {/* ปุ่ม */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!valid || submitting}
            className="bg-blue-600 text-white px-4 py-2 rounded shadow disabled:bg-blue-300"
          >
            {submitting ? 'กำลังบันทึก…' : 'เปิดรอบประมูล'}
          </button>

          <a
            href="/admin/auction-products"
            className="px-4 py-2 rounded border  hover:bg-gray-50"
          >
            กลับไปสินค้าประมูล
          </a>
        </div>

        {msg && (
          <p
            className={`text-sm ${
              msg.includes('สำเร็จ') ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {msg}
          </p>
        )}
      </form>
    </main>
  );
}
