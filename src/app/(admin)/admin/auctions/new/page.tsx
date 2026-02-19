'use client';

import { apiFetch } from '@/app/lib/apiFetch';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
  const [minIncrement, setMinIncrement] = useState<string>('1');

  const [localDT, setLocalDT] = useState('');
  const [end, setEnd] = useState('');
  const [msg, setMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const pad2 = (n: number) => String(n).padStart(2, '0');
  const toMySQL = (dt: string) => (dt ? dt.replace('T', ' ') + ':00' : '');

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

  useEffect(() => {
    setLoadingItems(true);

    const load = async () => {
      try {
        const res = await apiFetch(`${API}/auction-products?status=ready&available=1`, {
          cache: 'no-store',
        });

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

  const handleSelectProduct = (value: string) => {
    if (value === '') {
      setSelectedProduct('');
      setStartPrice('0.00');
      return;
    }

    const id = Number(value);
    setSelectedProduct(id);

    const product = products.find((p) => p.PROid === id);
    if (product) {
      setStartPrice(Number(product.PROprice).toFixed(2));
    }
  };

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
        setMsg(json.error || 'สินค้านี้มีรอบเปิดอยู่แล้ว');
        return;
      }
      if (!res.ok || !json.Aid) {
        setMsg(json.error || 'เปิดรอบประมูลไม่สำเร็จ');
        return;
      }

      setMsg('เปิดรอบประมูลสำเร็จ กำลังไปหน้าจัดการ...');
      router.push(`/admin/auctions/${json.Aid}`);
    } finally {
      setSubmitting(false);
    }
  };

  const Field = ({
    label,
    hint,
    children,
  }: {
    label: string;
    hint?: string;
    children: React.ReactNode;
  }) => (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <label className="text-sm font-semibold text-emerald-950">{label}</label>
        {hint && <div className="text-xs text-slate-500">{hint}</div>}
      </div>
      {children}
    </div>
  );

  const inputCls =
    'w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-slate-800 ' +
    'placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-300';

  return (
    <div className="min-h-screen bg-emerald-50">
      <main className="max-w-2xl mx-auto px-8 py-10">
        {/* Header */}
        <div className="mb-8 border-b border-emerald-100 pb-6">
          <p className="text-xs uppercase tracking-widest text-emerald-700 font-semibold">
            Auctions
          </p>
          <h1 className="text-3xl font-semibold text-emerald-950 tracking-wide mt-2">
            เปิดรอบประมูลใหม่
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            เลือกสินค้าประมูล ตั้งราคาเริ่มต้น ก้าวบิดขั้นต่ำ และเวลาปิดรอบ
          </p>
        </div>

        {/* Form Card */}
        <form
          onSubmit={submit}
          className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-8 space-y-6"
        >
          {/* Product select */}
          <Field label="เลือกสินค้า" hint="เฉพาะสินค้าที่พร้อมเปิดรอบและยังไม่มีรอบเปิดอยู่">
            {loadingItems ? (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
                  <div className="text-sm text-slate-600">กำลังโหลดรายการสินค้า...</div>
                </div>
              </div>
            ) : products.length === 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="text-sm font-semibold text-amber-800">
                  ยังไม่มีสินค้าที่พร้อมเปิดรอบ
                </div>
                <div className="text-sm text-amber-800/80 mt-1">
                  ไปเพิ่มสินค้าประมูลก่อน แล้วค่อยกลับมาเปิดรอบ
                </div>
                <div className="mt-3">
                  <Link
                    href="/admin/auction-products/new"
                    className="inline-flex items-center justify-center rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900"
                  >
                    เพิ่มสินค้าประมูล
                  </Link>
                </div>
              </div>
            ) : (
              <select
                className={inputCls}
                value={selectedProduct}
                onChange={(e) => handleSelectProduct(e.target.value)}
                required
              >
                <option value="">เลือกสินค้า</option>
                {products.map((p) => (
                  <option key={p.PROid} value={p.PROid}>
                    {p.PROname} (ราคา {Number(p.PROprice).toLocaleString('th-TH')} บาท)
                  </option>
                ))}
              </select>
            )}
          </Field>

          {/* Start price */}
          <Field label="ราคาเริ่มต้น (บาท)" hint="ต้องมากกว่า 0">
            <input
              type="number"
              step="1"
              min={0}
              value={startPrice}
              onChange={(e) => setStartPrice(e.target.value)}
              className={inputCls}
              required
            />
          </Field>

          {/* Min increment */}
          <Field label="ก้าวบิดขั้นต่ำ (บาท)" hint="ขั้นต่ำ 1 บาท">
            <input
              type="number"
              min={1}
              step={1}
              value={minIncrement}
              onChange={(e) => setMinIncrement(e.target.value)}
              className={inputCls}
              required
            />
          </Field>

          {/* End time */}
          <Field label="เวลาปิดรอบ" hint={!endIsFuture && end ? 'เวลาปิดต้องอยู่ในอนาคต' : undefined}>
            <input
              type="datetime-local"
              value={localDT}
              onChange={(e) => handleDateChange(e.target.value)}
              className={inputCls}
              required
            />
          </Field>

          {/* Action bar */}
          <div className="pt-2 flex flex-col gap-3">
            <button
              type="submit"
              disabled={!valid || submitting}
              className={[
                'w-full rounded-xl px-6 py-3 font-semibold transition shadow-sm',
                'bg-emerald-800 text-white hover:bg-emerald-900',
                'disabled:bg-slate-300 disabled:text-slate-600 disabled:cursor-not-allowed disabled:hover:bg-slate-300',
              ].join(' ')}
            >
              {submitting ? 'กำลังบันทึก...' : 'เปิดรอบประมูล'}
            </button>

            <button
              type="button"
              onClick={() => router.back()}
              className="w-full rounded-xl px-6 py-3 font-semibold border border-emerald-200 bg-white text-slate-700 hover:bg-emerald-50 transition"
            >
              ย้อนกลับ
            </button>
          </div>

          {/* Message */}
          {msg && (
            <div
              className={[
                'rounded-xl border px-4 py-3 text-sm',
                msg.includes('สำเร็จ')
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                  : 'border-rose-200 bg-rose-50 text-rose-900',
              ].join(' ')}
            >
              {msg}
            </div>
          )}

          {/* Tiny helper */}
          <div className="text-xs text-slate-500">
            หมายเหตุ: ระบบจะกันไม่ให้เปิดรอบซ้ำกับสินค้าที่มีรอบเปิดอยู่แล้ว
          </div>
        </form>
      </main>
    </div>
  );
}
