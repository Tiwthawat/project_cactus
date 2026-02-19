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
    return raw.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
  }

  const s = String(raw).trim();
  if (!s) return [];

  if (s.startsWith("[")) {
    try {
      const arr: unknown = JSON.parse(s);
      if (Array.isArray(arr)) {
        return arr.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
      }
    } catch {
      // ignore
    }
  }

  if (s.includes(",")) {
    return s
      .split(",")
      .map((x) => x.trim())
      .filter((x) => x.length > 0);
  }

  return [s];
};


const firstPicture = (raw: PictureLike) => toPictures(raw)[0] ?? null;

export default function AdminProducts() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [loading, setLoading] = useState(true);

  // โหลดทั้งหมดครั้งเดียว
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
      console.error('❌ โหลด products fail:', err);
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
    return {
      total: allProducts.length,
      t1: allProducts.filter((p) => p.Typeid === 1).length,
      t2: allProducts.filter((p) => p.Typeid === 2).length,
      t3: allProducts.filter((p) => p.Typeid === 3).length,
      t4: allProducts.filter((p) => p.Typeid === 4).length,
    };
  }, [allProducts]);

  const deleteProduct = async (id: number) => {
    if (!confirm('คุณแน่ใจว่าต้องการลบสินค้านี้?')) return;

    const res = await apiFetch(`${API}/product/${id}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      alert('ลบสินค้าไม่สำเร็จ');
      return;
    }

    // ลบออกจาก allProducts ด้วย จะได้รีเฟรชจำนวนบนปุ่มทันที
    setAllProducts((prev) => prev.filter((p) => p.Pid !== id));
  };

  const FilterBtn = ({
    active,
    onClick,
    label,
    count,
  }: {
    active: boolean;
    onClick: () => void;
    label: React.ReactNode;
    count: number;
  }) => {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold border transition
          ${
            active
              ? 'bg-green-600 text-white border-green-600 shadow'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-green-50'
          }`}
      >
        <span>{label}</span>
        <span
          className={`text-xs font-bold px-2 py-0.5 rounded-full
            ${active ? 'bg-white text-green-700' : 'bg-gray-200 text-gray-700'}`}
        >
          {count}
        </span>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
      <div className="p-6 pt-8">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-block bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-full text-sm font-semibold mb-4">
            จัดการสินค้า
          </div>
          <div className="flex justify-between items-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              🌵 รายการสินค้า
            </h1>
            <Link href="/admin/products/new">
              <button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl">
                + เพิ่มสินค้าใหม่
              </button>
            </Link>
          </div>
        </div>

        {/* Filter title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl shadow-md">
            🔍
          </div>
          <h2 className="text-2xl font-bold text-gray-800">กรองสินค้า</h2>
          {loading ? <span className="text-sm text-gray-400">กำลังโหลด...</span> : null}
        </div>

        {/* Filter buttons + counts */}
        <div className="flex flex-wrap gap-3">
          <FilterBtn
            active={typeFilter === 'all'}
            onClick={() => setTypeFilter('all')}
            label="📦 ทั้งหมด"
            count={counts.total}
          />
          <FilterBtn
            active={typeFilter === 1}
            onClick={() => setTypeFilter(1)}
            label="🌵 แคคตัสหนามสั้น"
            count={counts.t1}
          />
          <FilterBtn
            active={typeFilter === 2}
            onClick={() => setTypeFilter(2)}
            label="🌵 แคคตัสหนามยาว"
            count={counts.t2}
          />
          <FilterBtn
            active={typeFilter === 3}
            onClick={() => setTypeFilter(3)}
            label="🪴 ไม้อวบน้ำ"
            count={counts.t3}
          />
          <FilterBtn
            active={typeFilter === 4}
            onClick={() => setTypeFilter(4)}
            label="🎨 ของตกแต่งกระถาง"
            count={counts.t4}
          />
        </div>

        {/* Products Table Card */}
        <div className="bg-white mt-8 rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                  <th className="p-4 text-center w-20">#</th>
                  <th className="p-4 text-center w-24">รูป</th>
                  <th className="p-4 text-left min-w-[250px]">ข้อมูลสินค้า</th>
                  <th className="p-4 text-right w-32">ราคา</th>
                  <th className="p-4 text-center w-28">คงเหลือ</th>
                  <th className="p-4 text-center w-28">ขายแล้ว</th>
                  <th className="p-4 text-center w-32">สถานะ</th>
                  <th className="p-4 text-center w-48">จัดการ</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-500">
                      ⏳ กำลังโหลด...
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-500">
                      ไม่พบข้อมูล
                    </td>
                  </tr>
                ) : (
                  products.map((p, index) => {
                    const main = firstPicture(p.Ppicture);
                    const code = `pro:${String(p.Pid).padStart(4, '0')}`;

                    // ✅ ใช้ status กลาง
                    const st = getMeta(PRODUCT_STATUS, p.Pstatus);

                    return (
                      <tr
                        key={p.Pid}
                        className="border-b border-gray-200 hover:bg-green-50 transition-colors"
                      >
                        <td className="p-4 text-center font-semibold text-gray-700">
                          {index + 1}
                        </td>

                        <td className="p-4 text-center">
                          {main ? (
                            <img
                              src={getImageUrl(main)}
                              className="h-20 w-20 mx-auto object-cover rounded-xl shadow-md"
                              alt={p.Pname}
                            />
                          ) : (
                            <div className="h-20 w-20 mx-auto rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
                              —
                            </div>
                          )}
                        </td>

                        <td className="p-4">
                          <div className="space-y-1">
                            <div className="font-bold text-gray-900 text-base">
                              {p.Pname}
                            </div>
                            <div className="text-xs text-gray-500">
                              <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
                                {code}
                              </span>
                            </div>
                            <div className="text-xs text-gray-600">
                              {p.typenproduct} {p.subname && `• ${p.subname}`}
                            </div>
                            {p.Pdetail && (
                              <div className="text-xs text-gray-500 max-w-[300px] truncate">
                                {p.Pdetail}
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="p-4 text-right">
                          <span className="font-bold text-lg text-green-600">
                            {Number(p.Pprice).toLocaleString('th-TH', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                          <span className="text-sm text-gray-500 ml-1">฿</span>
                        </td>

                        <td className="p-4 text-center">
                          <span
                            className={`inline-block px-3 py-2 rounded-lg font-bold text-base ${
                              p.Pnumproduct > 10
                                ? 'bg-green-100 text-green-700'
                                : p.Pnumproduct > 0
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {p.Pnumproduct}
                          </span>
                        </td>

                        <td className="p-4 text-center">
                          <span className="inline-block px-3 py-2 rounded-lg font-bold text-base bg-blue-100 text-blue-700">
                            {p.Prenume}
                          </span>
                        </td>

                        <td className="p-4 text-center">
                          <StatusBadge label={st.label} tone={st.tone} />
                        </td>

                        <td className="p-4">
                          <div className="flex flex-col gap-2">
                            <Link href={`/admin/products/${p.Pid}`}>
                              <button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 shadow-md hover:shadow-lg whitespace-nowrap">
                                ✏️ แก้ไข
                              </button>
                            </Link>
                            <button
                              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 shadow-md hover:shadow-lg whitespace-nowrap"
                              onClick={() => deleteProduct(p.Pid)}
                            >
                              🗑️ ลบ
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

          <div className="px-6 py-4 text-xs text-gray-500 border-t bg-gray-50">
            * ตัวเลขบนปุ่มคือจำนวนสินค้าในหมวดนั้น (นับจากข้อมูลทั้งหมด)
          </div>
        </div>
      </div>
    </div>
  );
}
