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


export default function adminProducts() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetch("http://localhost:3000/product") 
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error("โหลดสินค้าล้มเหลว:", err));
  }, []);

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
      <table className="w-full bg-white border border-gray-300">
        <thead>
          <tr className="bg-white">
            <th className="p-2 border">ลำดับ</th>
            
            <th className="p-2 border">รูป</th>
            <th className="p-2 border">ชื่อสินค้า</th>
            <th className="p-2 border">ประเภท</th>
           <th className="p-2 border">ประเภทย่อย</th>
            <th className="p-2 border">ราคา</th>
            <th className="p-2 border">คงเหลือ</th>
            <th className="p-2 border">ขายแล้ว</th>
            <th className="p-2 border">สถานะ</th>
            <th className="p-2 border">รายละเอียด</th>
            <th className="p-2 border">จัดการ</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p, index) => {
            const firstPic = p.Ppicture.split(',')[0]; 


            return (
              <tr key={p.Pid}>
                <td className="p-2 border text-center">{index + 1}</td>
                <td className="p-2 border text-center">
                  <img src={`http://localhost:3000${firstPic}`} className="h-12 mx-auto" alt={p.Pname} />

                </td>
                <td className="p-2 bg-white border">{p.Pname}</td>
                <td className="p-2 bg-white border">{p.typenproduct}</td>
                <td className="p-2 bg-white text-black border">{p.subname}</td>
                <td className="p-2 bg-white border text-right">{p.Pprice} บาท</td>
                <td className="p-2 bg-white border text-center">{p.Pnumproduct}</td>
                <td className="p-2 bg-white border text-center">{p.Prenume}</td>
                <td className="p-2 bg-white border text-center"><span className={`px-2 py-1 rounded text-white ${p.Pstatus === 'In stock' ? 'bg-green-500' : 'bg-gray-400'
                  }`}>
                  {p.Pstatus}
                </span>
                </td>
                <td className="p-2 bg-white border text-sm max-w-[250px] whitespace-nowrap overflow-hidden text-ellipsis">
                  {p.Pdetail}
                </td>

                <td className="p-2 border text-center">
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
