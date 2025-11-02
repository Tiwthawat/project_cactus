'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

interface FormState {
  PROname: string;
  PROprice: string;   // เก็บเป็น string ในฟอร์ม แล้วค่อย parse ก่อนส่ง
  PROpicture: string; // เก็บ path หลายรูป คั่นด้วย ,
  PROrenume: string;  // (ไม่บังคับ) เลขภายในถ้ามี
  PROdetail: string;


}

export default function AddAuctionProductPage() {
  const router = useRouter();

  const [form, setForm] = useState<FormState>({
    PROname: '',
    PROprice: '',
    PROpicture: '',
    PROrenume: '',
    PROdetail: '',

  });

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [msg, setMsg] = useState<string>('');

  // เปลี่ยนค่าในฟอร์ม
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // เลือกไฟล์หลายรูป
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setSelectedFiles(Array.from(files));
  };

  const removeSelectedFile = (idx: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const removeUploadedImage = (idx: number) => {
    const parts = form.PROpicture.split(',').filter(Boolean);
    parts.splice(idx, 1);
    setForm(prev => ({ ...prev, PROpicture: parts.join(',') }));
  };



  // อัปโหลดรูปที่เลือก (ทีละไฟล์) ไปที่ /upload → เก็บ path ที่ backend คืนมา
  const uploadSelectedImages = async () => {
    if (selectedFiles.length === 0) return;

    const uploaded: string[] = [];
    for (const file of selectedFiles) {
      const fd = new FormData();
      fd.append('image', file);

      try {
        const res = await fetch(`${API}/upload`, { method: 'POST', body: fd });
        const data = await res.json();
        // สมมติ backend ตอบ { url: "/uploads/products/xxxx.png" }
        // ใช้รูปแบบเดียวกับหน้าปกติ: ตัด "/uploads" ออกให้กลายเป็น "/products/xxxx.png"
        const path = String(data.url || '').replace('/uploads', '');
        if (path) uploaded.push(path);
      } catch {
        alert(`อัปโหลดรูป ${file.name} ไม่สำเร็จ`);
      }
    }

    setForm(prev => ({
      ...prev,
      PROpicture: prev.PROpicture
        ? `${prev.PROpicture},${uploaded.join(',')}`
        : uploaded.join(','),
    }));

    setSelectedFiles([]);
  };

  // ส่งฟอร์มไปสร้างสินค้า “เพื่อประมูล”
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const productData = {
      PROname: form.PROname,
      PROprice: parseFloat(form.PROprice),
      PROpicture: form.PROpicture,
      PROrenume: form.PROrenume || null,
      PROdetail: form.PROdetail || null,
    };

    const res = await fetch(`${API}/auction-products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productData),
    });

    if (res.ok) {
      alert("เพิ่มสินค้าสำเร็จ");
      router.push("/admin/auction-products");
    } else {
      const body = await res.json().catch(() => ({}));
      alert(body?.error || "เพิ่มสินค้าล้มเหลว");
    }
  };



  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg text-black">
      <h1 className="text-2xl font-bold mb-6 text-center">เพิ่มสินค้าสำหรับประมูล</h1>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow border">
        {/* ชื่อสินค้า */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อสินค้า</label>
          <input
            type="text"
            name="PROname"
            value={form.PROname}
            onChange={handleChange}
            required
            className="w-full bg-white text-gray-800 rounded-md border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500 placeholder-gray-400"
            placeholder="เช่น Astrophytum superkabuto"
          />
        </div>

        {/* ราคา (ของตัวสินค้า—not start_price) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ราคาอ้างอิง (บาท)</label>
          <input
            type="number"
            name="PROprice"
            value={form.PROprice}
            onChange={handleChange}
            min={0}
            step="0.01"
            required
            className="w-full rounded-md bg-white text-gray-800 border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500 placeholder-gray-400"
            placeholder="เช่น 350.00"
          />
        </div>




        {/* รายละเอียดสินค้า */}
        <div>
          <label className="block  mb-1">รายละเอียดสินค้า</label>
          <textarea
            name="PROdetail"
            value={form.PROdetail}
            onChange={handleChange}
            className="border rounded bg-white w-full p-2 h-24"
            placeholder="ใส่ข้อมูลรายละเอียดคร่าวๆ ของสินค้า"
          />
        </div>



        {/* อัปโหลดรูป */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">อัปโหลดรูปสินค้า</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="w-full rounded-md bg-white text-gray-800 border-gray-300"
          />

          {/* รายการไฟล์ที่เลือก (ยังไม่อัปโหลด) */}
          {selectedFiles.length > 0 && (
            <div className="mt-2 space-y-1">
              {selectedFiles.map((f, i) => (
                <div key={i} className="flex items-center justify-between text-sm text-gray-600">
                  <span>{f.name}</span>
                  <button type="button" onClick={() => removeSelectedFile(i)} className="text-red-500 hover:text-red-700">
                    ❌
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={uploadSelectedImages}
                className="mt-2 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
              >
                📤 เพิ่มรูปภาพ
              </button>
            </div>
          )}

          {/* แกลเลอรีรูปที่อัปโหลดแล้ว */}
          {form.PROpicture && (
            <div className="flex flex-wrap gap-3 mt-4 max-h-64 overflow-auto">
              {form.PROpicture.split(',').filter(Boolean).map((p, i) => (
                <div key={i} className="relative w-32 h-32">
                  <img
                    src={`${API}${p}`}
                    alt={`preview-${i}`}
                    className="w-full h-full object-cover rounded border"
                  />
                  <button
                    type="button"
                    onClick={() => removeUploadedImage(i)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full px-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>


        {/* สถานะ — ตรึงเป็น ready */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">สถานะ</label>
          <input
            type="text"
            value="ready"
            disabled
            className="w-full rounded-md bg-gray-100 text-gray-700 border-gray-300"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-green-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-green-700 transition"
        >
          บันทึก “สินค้าประมูล”
        </button>
      </form>
    </div>
  );
}
