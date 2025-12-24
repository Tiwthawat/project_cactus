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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
      <div className="w-full max-w-3xl mx-auto p-6 pt-8">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-block bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-full text-sm font-semibold mb-4">
            เพิ่มสินค้าประมูล
          </div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            🏺 เพิ่มสินค้าสำหรับประมูล
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8 space-y-6">
          {/* ชื่อสินค้า */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">ชื่อสินค้า *</label>
            <input
              type="text"
              name="PROname"
              value={form.PROname}
              onChange={handleChange}
              required
              className="w-full p-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-800 focus:border-green-400 focus:outline-none transition-colors placeholder-gray-400"
              placeholder="เช่น Astrophytum superkabuto"
            />
          </div>

          {/* ราคาอ้างอิง */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">ราคาอ้างอิง (บาท) *</label>
            <input
              type="number"
              name="PROprice"
              value={form.PROprice}
              onChange={handleChange}
              min={0}
              step="0.01"
              required
              className="w-full p-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-800 focus:border-green-400 focus:outline-none transition-colors placeholder-gray-400"
              placeholder="เช่น 350.00"
            />
          </div>

          {/* รายละเอียด */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">รายละเอียดสินค้า</label>
            <textarea
              name="PROdetail"
              value={form.PROdetail}
              onChange={handleChange}
              className="w-full p-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-800 focus:border-green-400 focus:outline-none transition-colors placeholder-gray-400 h-32"
              placeholder="ใส่ข้อมูลรายละเอียดคร่าวๆ ของสินค้า"
            />
          </div>

          {/* อัปโหลดรูป */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">อัปโหลดรูปสินค้า</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="w-full p-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-800 focus:border-green-400 focus:outline-none transition-colors"
            />

            {/* รายการไฟล์ที่เลือก */}
            {selectedFiles.length > 0 && (
              <div className="mt-4 bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
                <p className="text-sm font-semibold text-blue-700 mb-2">📁 ไฟล์ที่เลือก ({selectedFiles.length})</p>
                <div className="space-y-2">
                  {selectedFiles.map((f, i) => (
                    <div key={i} className="flex items-center justify-between text-sm text-gray-700 bg-white p-2 rounded-lg">
                      <span className="truncate">{f.name}</span>
                      <button type="button" onClick={() => removeSelectedFile(i)} className="text-red-500 hover:text-red-700 ml-2">
                        ❌
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={uploadSelectedImages}
                  className="mt-3 w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  📤 อัปโหลดรูปภาพ
                </button>
              </div>
            )}

            {/* แกลเลอรีรูปที่อัปโหลดแล้ว */}
            {form.PROpicture && (
              <div className="mt-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">🖼️ รูปที่อัปโหลดแล้ว</p>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {form.PROpicture.split(',').filter(Boolean).map((p, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={`${API}${p}`}
                        alt={`preview-${i}`}
                        className="w-full h-32 object-cover rounded-xl border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeUploadedImage(i)}
                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* สถานะ */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">สถานะ</label>
            <input
              type="text"
              value="✅ ready (พร้อมเปิดรอบ)"
              disabled
              className="w-full p-3 rounded-xl bg-gray-100 text-gray-700 border-2 border-gray-200 font-semibold"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl text-lg"
          >
            💾 บันทึกสินค้าประมูล
          </button>
        </form>
      </div>
    </div>
  );
}
