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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
      <main className="max-w-2xl mx-auto p-6 pt-8">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-block bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-full text-sm font-semibold mb-4">
            เปิดรอบประมูล
          </div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            🔨 เปิดรอบประมูลใหม่
          </h1>
        </div>

        <form
          onSubmit={submit}
          className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8 space-y-6"
        >
          {/* เลือกสินค้า */}
          <div>
            <label className="block mb-2 font-semibold text-gray-700">เลือกสินค้า *</label>

            {loadingItems ? (
              <div className="text-gray-600 border-2 border-gray-200 p-4 rounded-xl bg-gray-50 text-center">
                <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                กำลังโหลด…
              </div>
            ) : products.length === 0 ? (
              <div className="text-gray-600 border-2 border-yellow-200 p-4 rounded-xl bg-yellow-50">
                <p className="font-semibold text-yellow-700 mb-2">⚠️ ยังไม่มีสินค้าที่พร้อมเปิดรอบ</p>
                <a href="/admin/auction-products/new" className="text-blue-600 hover:underline font-semibold">
                  → เพิ่มสินค้าประมูล
                </a>
              </div>
            ) : (
              <select
                className="w-full p-3 rounded-xl border-2 border-gray-200 bg-gray-50 focus:border-green-400 focus:outline-none transition-colors text-gray-800 font-semibold"
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
          <div>
            <label className="block mb-2 font-semibold text-gray-700">ราคาเริ่มต้น (บาท) *</label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min={0}
                className="w-full p-3 pl-12 rounded-xl border-2 border-gray-200 bg-gray-50 focus:border-green-400 focus:outline-none transition-colors text-gray-800 font-semibold"
                value={startPrice}
                onChange={(e) => setStartPrice(e.target.value)}
                required
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">฿</span>
            </div>
          </div>

          {/* ก้าวบิดขั้นต่ำ */}
          <div>
            <label className="block mb-2 font-semibold text-gray-700">ก้าวบิดขั้นต่ำ (บาท) *</label>
            <input
              type="number"
              min={1}
              step={1}
              value={minIncrement}
              onChange={(e) => setMinIncrement(e.target.value)}
              className="w-full p-3 rounded-xl border-2 border-gray-200 bg-gray-50 focus:border-green-400 focus:outline-none transition-colors text-gray-800 font-semibold"
              required
            />
          </div>

          {/* เวลาปิด */}
          <div>
            <label className="block mb-2 font-semibold text-gray-700">เวลาปิดรอบ *</label>
            <input
              type="datetime-local"
              className="w-full p-3 rounded-xl border-2 border-gray-200 bg-gray-50 focus:border-green-400 focus:outline-none transition-colors text-gray-800 font-semibold"
              value={localDT}
              onChange={(e) => handleDateChange(e.target.value)}
              required
            />
            {!endIsFuture && end && (
              <p className="text-sm text-red-600 mt-2">⚠️ เวลาปิดต้องอยู่ในอนาคต</p>
            )}
          </div>

          {/* ปุ่ม */}
          <div className="flex flex-col md:flex-row items-center gap-3 pt-4">
            <button
              type="submit"
              disabled={!valid || submitting}
              className="w-full md:flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
            >
              {submitting ? '⏳ กำลังบันทึก…' : '🔨 เปิดรอบประมูล'}
            </button>

            <a
              href="/admin/auction-products"
              className="w-full md:w-auto px-6 py-3 rounded-xl border-2 border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-center transition-colors"
            >
              ← กลับ
            </a>
          </div>

          {msg && (
            <div className={`p-4 rounded-xl border-2 ${msg.includes('สำเร็จ')
                ? 'bg-green-50 border-green-300 text-green-700'
                : 'bg-red-50 border-red-300 text-red-700'
              }`}>
              <p className="font-semibold">{msg}</p>
            </div>
          )}
        </form>
      </main>
    </div>
  );
}
