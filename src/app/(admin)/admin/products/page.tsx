'use client';

import { apiFetch } from '@/app/lib/apiFetch';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import StatusBadge from '@/app/component/StatusBadge';
import { getMeta, PRODUCT_STATUS } from '@/app/lib/status';

interface Product {
  Pid: number;
  Pname: string;
  Pprice: number;
  Pnumproduct: number;
  Prenume: number;
  Pstatus: string;
  Pdetail: string;
  Ppicture: string;
  Typeid: number;
  typenproduct: string;
  subname: string;
}

type TypeFilter = number | 'all';

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

/** --------------------------
 *  Image helpers (รองรับหลายรูปแบบ)
 * -------------------------- */
type PictureLike = string | string[] | null | undefined;

const getImageUrl = (path: string | null | undefined) => {
  if (!path) return '/no-image.png';
  const clean = String(path).trim();
  if (!clean) return '/no-image.png';
  if (clean.startsWith('http')) return clean;
  if (clean.startsWith('/')) return `${API}${clean}`;
  return `${API}/${clean}`;
};

const toPictures = (raw: PictureLike): string[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.filter((x): x is string => typeof x === 'string' && x.trim().length > 0);
  }

  const s = String(raw).trim();
  if (!s) return [];

  if (s.startsWith('[')) {
    try {
      const arr: unknown = JSON.parse(s);
      if (Array.isArray(arr)) {
        return arr.filter((x): x is string => typeof x === 'string' && x.trim().length > 0);
      }
    } catch {
      // ignore
    }
  }

  if (s.includes(',')) {
    return s
      .split(',')
      .map((x) => x.trim())
      .filter((x) => x.length > 0);
  }

  return [s];
};

const firstPicture = (raw: PictureLike) => toPictures(raw)[0] ?? null;

const fmtMoney = (n: number) =>
  Number(n || 0).toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function typeLabel(typeId: number) {
  switch (typeId) {
    case 1:
      return 'แคคตัสหนามสั้น';
    case 2:
      return 'แคคตัสหนามยาว';
    case 3:
      return 'ไม้อวบน้ำ';
    case 4:
      return 'ของตกแต่งกระถาง';
    default:
      return 'อื่น ๆ';
  }
}

export default function AdminProducts() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [loading, setLoading] = useState(true);

  const fetchAllProducts = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`${API}/product`);
      if (!res.ok) {
        setAllProducts([]);
        return;
      }
      const data: unknown = await res.json().catch(() => []);
      setAllProducts(Array.isArray(data) ? (data as Product[]) : []);
    } catch (err) {
      console.error('โหลด products fail:', err);
      setAllProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllProducts();
  }, []);

  const products = useMemo(() => {
    if (typeFilter === 'all') return allProducts;
    return allProducts.filter((p) => p.Typeid === typeFilter);
  }, [allProducts, typeFilter]);

  const counts = useMemo(() => {
    const byType = (t: number) => allProducts.filter((p) => p.Typeid === t).length;
    return {
      total: allProducts.length,
      t1: byType(1),
      t2: byType(2),
      t3: byType(3),
      t4: byType(4),
    };
  }, [allProducts]);

  const deleteProduct = async (id: number) => {
    if (!confirm('คุณแน่ใจว่าต้องการลบสินค้านี้?')) return;

    const res = await apiFetch(`${API}/product/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      alert('ลบสินค้าไม่สำเร็จ');
      return;
    }
    setAllProducts((prev) => prev.filter((p) => p.Pid !== id));
  };

  const Chip = ({
    active,
    onClick,
    label,
    count,
  }: {
    active: boolean;
    onClick: () => void;
    label: string;
    count: number;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={[
        'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition',
        active
          ? 'bg-emerald-800 text-white'
          : 'bg-white text-slate-700 border border-emerald-200 hover:bg-emerald-50',
      ].join(' ')}
    >
      <span>{label}</span>
      <span
        className={[
          'text-xs font-bold rounded-full px-2 py-0.5',
          active ? 'bg-white/90 text-emerald-900' : 'bg-emerald-100 text-emerald-900',
        ].join(' ')}
      >
        {count}
      </span>
    </button>
  );

  return (
    <div className="min-h-screen bg-emerald-50 text-black">
      <div className="max-w-6xl mx-auto px-8 py-10">
        {/* Header */}
        <div className="mb-8 border-b border-emerald-100 pb-6">
          <p className="text-xs uppercase tracking-widest text-emerald-700 font-semibold">
            Products
          </p>

          <div className="mt-2 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold text-emerald-950 tracking-wide">
                รายการสินค้า
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                จัดการสินค้า ดูสต๊อก และสถานะการขาย
              </p>
            </div>

            <Link
              href="/admin/products/new"
              className="inline-flex items-center justify-center rounded-xl bg-emerald-800 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-900 transition shadow-sm"
            >
              เพิ่มสินค้าใหม่
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="text-lg font-semibold text-emerald-950">กรองสินค้า</div>
              <div className="text-sm text-slate-600">
                เลือกหมวดเพื่อดูรายการเฉพาะหมวด
              </div>
            </div>

            {loading ? (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <div className="w-4 h-4 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
                กำลังโหลด
              </div>
            ) : null}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Chip
              active={typeFilter === 'all'}
              onClick={() => setTypeFilter('all')}
              label="ทั้งหมด"
              count={counts.total}
            />
            <Chip
              active={typeFilter === 1}
              onClick={() => setTypeFilter(1)}
              label="แคคตัสหนามสั้น"
              count={counts.t1}
            />
            <Chip
              active={typeFilter === 2}
              onClick={() => setTypeFilter(2)}
              label="แคคตัสหนามยาว"
              count={counts.t2}
            />
            <Chip
              active={typeFilter === 3}
              onClick={() => setTypeFilter(3)}
              label="ไม้อวบน้ำ"
              count={counts.t3}
            />
            <Chip
              active={typeFilter === 4}
              onClick={() => setTypeFilter(4)}
              label="ของตกแต่งกระถาง"
              count={counts.t4}
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white mt-6 rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-emerald-900 text-white">
                  <th className="p-4 text-left w-16">#</th>
                  <th className="p-4 text-left w-24">รูป</th>
                  <th className="p-4 text-left min-w-[320px]">สินค้า</th>
                  <th className="p-4 text-right w-32">ราคา</th>
                  <th className="p-4 text-center w-28">คงเหลือ</th>
                  <th className="p-4 text-center w-28">ขายแล้ว</th>
                  <th className="p-4 text-center w-32">สถานะ</th>
                  <th className="p-4 text-center w-44">จัดการ</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-slate-600">
                      กำลังโหลดข้อมูล...
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-slate-600">
                      ไม่พบข้อมูล
                    </td>
                  </tr>
                ) : (
                  products.map((p, index) => {
                    const main = firstPicture(p.Ppicture);
                    const code = `pro:${String(p.Pid).padStart(4, '0')}`;
                    const st = getMeta(PRODUCT_STATUS, p.Pstatus);

                    const stockTone =
                      p.Pnumproduct > 10
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                        : p.Pnumproduct > 0
                        ? 'bg-amber-50 text-amber-800 border-amber-100'
                        : 'bg-rose-50 text-rose-800 border-rose-100';

                    return (
                      <tr
                        key={p.Pid}
                        className="border-b border-emerald-100/70 hover:bg-emerald-50/60 transition"
                      >
                        <td className="p-4 text-slate-700 font-semibold">
                          {index + 1}
                        </td>

                        <td className="p-4">
                          {main ? (
                            <img
                              src={getImageUrl(main)}
                              className="h-16 w-16 rounded-xl object-cover border border-emerald-100"
                              alt={p.Pname}
                            />
                          ) : (
                            <div className="h-16 w-16 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-slate-400 text-sm">
                              —
                            </div>
                          )}
                        </td>

                        <td className="p-4">
                          <div className="space-y-1">
                            <div className="text-base font-semibold text-emerald-950">
                              {p.Pname}
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[12px] font-mono px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-900">
                                {code}
                              </span>

                              <span className="text-[12px] px-2 py-0.5 rounded-lg bg-white border border-emerald-100 text-slate-700">
                                {typeLabel(p.Typeid)}
                                {p.subname ? ` • ${p.subname}` : ''}
                              </span>
                            </div>

                            {p.Pdetail ? (
                              <div className="text-sm text-slate-600 max-w-[520px] truncate">
                                {p.Pdetail}
                              </div>
                            ) : null}
                          </div>
                        </td>

                        <td className="p-4 text-right">
                          <div className="text-sm font-semibold text-slate-900">
                            {fmtMoney(p.Pprice)}
                          </div>
                          <div className="text-xs text-slate-500">บาท</div>
                        </td>

                        <td className="p-4 text-center">
                          <span
                            className={[
                              'inline-flex items-center justify-center min-w-[54px] px-3 py-2 rounded-xl text-sm font-bold border',
                              stockTone,
                            ].join(' ')}
                          >
                            {p.Pnumproduct}
                          </span>
                        </td>

                        <td className="p-4 text-center">
                          <span className="inline-flex items-center justify-center min-w-[54px] px-3 py-2 rounded-xl text-sm font-bold border bg-slate-50 text-slate-800 border-slate-200">
                            {p.Prenume}
                          </span>
                        </td>

                        <td className="p-4 text-center">
                          <StatusBadge label={st.label} tone={st.tone} />
                        </td>

                        <td className="p-4">
                          <div className="flex flex-col gap-2">
                            <Link
                              href={`/admin/products/${p.Pid}`}
                              className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold bg-emerald-800 text-white hover:bg-emerald-900 transition shadow-sm"
                            >
                              แก้ไข
                            </Link>

                            <button
                              type="button"
                              onClick={() => deleteProduct(p.Pid)}
                              className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold border border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100 transition"
                            >
                              ลบ
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 text-xs text-slate-500 border-t border-emerald-100 bg-emerald-50/50">
            หมายเหตุ: ตัวเลขบนตัวกรองคือจำนวนสินค้าในหมวดนั้นจากข้อมูลทั้งหมด
          </div>
        </div>
      </div>
    </div>
  );
}
