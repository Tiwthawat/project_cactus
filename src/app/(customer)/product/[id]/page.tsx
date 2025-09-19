'use client';
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Product {
  Pid: number;
  Pname: string;
  Pprice: number;
  Ppicture: string;
  Pstatus: string;
  Pnumproduct: number;
  Prenume: number;
  Pdetail: string;
}


export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [mainImage, setMainImage] = useState<string>("");



  useEffect(() => {
    const fetchProduct = async () => {
      const res = await fetch(`http://localhost:3000/product/${id}`);
      const data = await res.json();
      setProduct(data);
      setMainImage(data.Ppicture.split(",")[0].trim()); // ตั้งค่ารูปหลักเริ่มต้น
    };
    fetchProduct();
  }, [id]);


  if (!product) return <p className="text-center mt-10">กำลังโหลดข้อมูลสินค้า...</p>;

  return (
    <div className="p-10 pt-40 max-w-6xl mx-auto bg-white text-black space-y-8">



      <div className="flex flex-col lg:flex-row gap-10 items-start">

        {/* ✅ ฝั่งซ้าย */}
        <div className="w-full lg:w-1/2">

          {/* 🔠 ชื่อสินค้า */}
          <h1 className="text-2xl font-bold mb-4">{product.Pname}</h1>

          {/* 📷 รูปหลัก */}
          <div className="w-full aspect-[4/3] rounded-lg overflow-hidden shadow">
            <img
              src={`http://localhost:3000${mainImage}`}

              alt={product.Pname}
              className="w-full h-full object-cover"
            />
          </div>

          {/* 🖼️ Thumbnail */}
          <div className="flex gap-2 mt-4">
            {product.Ppicture.split(",").map((pic, i) => (
              <img
                key={i}
                src={`http://localhost:3000${pic.trim()}`}
                className="w-20 h-20 object-cover rounded cursor-pointer border hover:border-red-500"
                onClick={() => setMainImage(pic.trim())}
              />
            ))}
          </div>
        </div>
        {/* ✅ ฝั่งขวา */}


        {/* ✅ ฝั่งขวา (จัดแนวบนลงล่างแบบธรรมชาติ) */}
        <div className="w-full lg:w-1/2 flex flex-col gap-6">

          {/* 🟨 โปรดอ่าน */}
          <div className="bg-yellow-100 border border-yellow-300 p-4 rounded shadow">
            <p className="text-sm font-medium text-red-600">📌 โปรดอ่าน</p>
            <ul className="text-sm text-gray-700 list-disc ml-4 mt-1">
              <li>ผู้ประมูลจะต้องตรวจรายละเอียดก่อนตัดสินใจ</li>
              <li>รายละเอียดต้องเป็นข้อมูลจริงเท่านั้น</li>
            </ul>
          </div>

          {/* 🩷 ข้อมูลร้านค้า */}
          <div className="bg-pink-100 p-4 rounded border border-pink-300 shadow">
            <p className="font-medium text-gray-800 border-b pb-1 mb-2">ข้อมูลร้านค้า</p>
            <div className="flex items-center gap-2">
              <span>👥</span>
              <p>liew</p>
            </div>
          </div>

          {/* ❤️ ปุ่มซื้อ + รายละเอียด */}
          <div className="space-y-3">
            <button className="border border-red-500 text-red-500 px-4 py-2 rounded hover:bg-red-100 text-sm w-full">
              ❤️ เพิ่มรายการโปรด
            </button>

            <h2 className="text-[28px] font-extrabold text-black">
              ซื้อทันทีในราคา <span className="text-red-600 text-[36px] font-extrabold">{product.Pprice} บาท</span>
            </h2>
            <button className="bg-orange-400 text-white px-6 py-2 rounded hover:bg-orange-500 text-base">
              🛒 เพิ่มใส่ตะกร้า
            </button>

            <button className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 text-sm w-full">
              ซื้อเลย
            </button>

            <p className="text-xs text-gray-700">รหัสสินค้า: cac:{product.Pid.toString().padStart(4, "0")}</p>
            <p className="text-xs text-gray-700">สถานะ: {product.Pstatus}</p>
          </div>

        </div>





      </div>

      {/* 🔎 รายละเอียดสินค้า */}
      <div>
        <h2 className="font-semibold text-xl mb-2">รายละเอียดสินค้า</h2>
        <div className="whitespace-pre-line p-3 border bg-slate-50 rounded text-sm text-gray-800">
  {product.Pdetail}
</div>

      </div>
    </div>
  );


}
