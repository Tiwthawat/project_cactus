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
    <div className="p-6 text-black">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">จัดการสินค้า</h1>
        <Link href="/admin/products/new">
          <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            + เพิ่มสินค้าใหม่
          </button>
        </Link>
      </div>

      {/* ✅ ตัวเลือกกรองตามประเภท */}
      <div className="mb-4">
        <label className="mr-2">กรองตามประเภท:</label>
       <select
  value={typeFilter}
  onChange={(e) =>
    setTypeFilter(e.target.value === "all" ? "all" : parseInt(e.target.value))
  }
  className="border border-gray-300 bg-gray-50 px-3 py-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
>
  <option value="all">ทั้งหมด</option>
  <option value="1">แคคตัสหนามสั้น</option>
  <option value="2">แคคตัสหนามยาว</option>
  <option value="3">ไม้อวบน้ำ</option>
  <option value="4">ของตกแต่งกระถาง</option>
</select>

      </div>

      {/* ตารางสินค้า */}
     <table className="w-full border border-gray-200 shadow-sm rounded-md overflow-hidden">
  <thead>
    <tr className="bg-orange-100 text-black">
      <th className="p-2 border border-gray-200">ลำดับ</th>
      <th className="p-2 border text-center">รหัสสินค้า</th>
      <th className="p-2 border border-gray-200">รูป</th>
      <th className="p-2 border border-gray-200">ชื่อสินค้า</th>
      <th className="p-2 border border-gray-200">ประเภท</th>
      <th className="p-2 border border-gray-200">ประเภทย่อย</th>
      <th className="p-2 border border-gray-200">ราคา</th>
      <th className="p-2 border border-gray-200">คงเหลือ</th>
      <th className="p-2 border border-gray-200">ขายแล้ว</th>
      <th className="p-2 border border-gray-200">สถานะ</th>
      <th className="p-2 border border-gray-200">รายละเอียด</th>
      <th className="p-2 border border-gray-200">จัดการ</th>
    </tr>
  </thead>
  <tbody>
    {products.map((p, index) => {
      const firstPic = p.Ppicture.split(',')[0];
      const code = `pro:${String(p.Pid).padStart(4, '0')}`;
      return (
        <tr key={p.Pid} className="odd:bg-white even:bg-gray-50 hover:bg-orange-50">
          <td className="p-2 border border-gray-200 text-center">{index + 1}</td>
          <td className="p-2 border text-center font-mono text-sm">{code}</td>
          <td className="p-2 border border-gray-200 text-center">
            <img src={`http://localhost:3000${firstPic}`} className="h-12 mx-auto rounded" alt={p.Pname} />
          </td>
          <td className="p-2 border border-gray-200">{p.Pname}</td>
          <td className="p-2 border border-gray-200">{p.typenproduct}</td>
          <td className="p-2 border border-gray-200">{p.subname}</td>
          <td className="p-2 border border-gray-200 text-right">{p.Pprice} บาท</td>
          <td className="p-2 border border-gray-200 text-center">{p.Pnumproduct}</td>
          <td className="p-2 border border-gray-200 text-center">{p.Prenume}</td>
          <td className="p-2 border border-gray-200 text-center">
            <span
              className={`px-2 py-1 rounded text-white ${
                p.Pstatus === "In stock" ? "bg-green-500" : "bg-gray-400"
              }`}
            >
              {p.Pstatus}
            </span>
          </td>
          <td className="p-2 border border-gray-200 text-sm max-w-[250px] truncate">{p.Pdetail}</td>
          <td className="p-2 border border-gray-200 text-center">
            <Link href={`/admin/products/${p.Pid}`}>
              <button className="bg-yellow-500 text-white px-2 py-1 rounded mr-2 hover:bg-yellow-600">
                แก้ไข
              </button>
            </Link>
            <button
              className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
              onClick={() => deleteProduct(p.Pid)}
            >
              ลบ
            </button>
          </td>
        </tr>
      );
    })}
  </tbody>
</table>

    </div>
  );
}
