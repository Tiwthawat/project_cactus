'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Product {
  Pid: number;
  Pname: string;
  Pprice: number;
  Pnumproduct: number;
  Prenume: number;
  Pstatus: string;
  Pdetail: string;
  Ppicture: string;
  typenproduct: string;
  subname: string;
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [typeFilter, setTypeFilter] = useState<number | "all">("all");

  const fetchProducts = async (typeid?: number) => {
    const url = typeid ? `http://localhost:3000/product?typeid=${typeid}` : "http://localhost:3000/product";
    const res = await fetch(url);
    const data = await res.json();
    setProducts(data);
  };

  useEffect(() => {
    if (typeFilter === "all") {
      fetchProducts();
    } else {
      fetchProducts(typeFilter as number);
    }
  }, [typeFilter]);

  const deleteProduct = async (id: number) => {
    if (!confirm('คุณแน่ใจว่าต้องการลบสินค้านี้?')) return;
    await fetch(`http://localhost:3000/product/${id}`, { method: 'DELETE' });
    setProducts(products.filter((p) => p.Pid !== id));
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

        {/* Filter Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-2 border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl shadow-md">
              🔍
            </div>
            <h2 className="text-2xl font-bold text-gray-800">กรองสินค้า</h2>
          </div>
          <select
            value={typeFilter}
            onChange={(e) =>
              setTypeFilter(e.target.value === "all" ? "all" : parseInt(e.target.value))
            }
            className="w-full p-3 border-2 border-gray-200 rounded-xl bg-gray-50 focus:border-green-400 focus:outline-none transition-colors text-lg font-semibold"
          >
            <option value="all">📦 ทั้งหมด</option>
            <option value="1">🌵 แคคตัสหนามสั้น</option>
            <option value="2">🌵 แคคตัสหนามยาว</option>
            <option value="3">🪴 ไม้อวบน้ำ</option>
            <option value="4">🎨 ของตกแต่งกระถาง</option>
          </select>
        </div>

        {/* Products Table Card */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
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
                {products.map((p, index) => {
                  const firstPic = p.Ppicture.split(',')[0];
                  const code = `pro:${String(p.Pid).padStart(4, '0')}`;
                  return (
                    <tr key={p.Pid} className="border-b border-gray-200 hover:bg-green-50 transition-colors">
                      <td className="p-4 text-center font-semibold text-gray-700">{index + 1}</td>

                      <td className="p-4 text-center">
                        <img
                          src={`http://localhost:3000${firstPic}`}
                          className="h-20 w-20 mx-auto object-cover rounded-xl shadow-md"
                          alt={p.Pname}
                        />
                      </td>

                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="font-bold text-gray-900 text-base">{p.Pname}</div>
                          <div className="text-xs text-gray-500">
                            <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{code}</span>
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
                        <span className={`inline-block px-3 py-2 rounded-lg font-bold text-base ${p.Pnumproduct > 10
                          ? 'bg-green-100 text-green-700'
                          : p.Pnumproduct > 0
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                          }`}>
                          {p.Pnumproduct}
                        </span>
                      </td>

                      <td className="p-4 text-center">
                        <span className="inline-block px-3 py-2 rounded-lg font-bold text-base bg-blue-100 text-blue-700">
                          {p.Prenume}
                        </span>
                      </td>

                      <td className="p-4 text-center">
                        {p.Pstatus === "In stock" ? (
                          <span className="px-3 py-1.5 rounded-full text-sm font-semibold bg-green-100 text-green-700 border-2 border-green-300 whitespace-nowrap">
                            ✅ มีสินค้า
                          </span>
                        ) : (
                          <span className="px-3 py-1.5 rounded-full text-sm font-semibold bg-red-100 text-red-700 border-2 border-red-300 whitespace-nowrap">
                            ❌ หมด
                          </span>
                        )}
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
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
