'use client';

import { apiFetch } from '@/app/lib/apiFetch';
import StatusBadge from '@/app/component/StatusBadge';
import { getMeta, AUCTION_PRODUCT_STATUS } from '@/app/lib/status';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

type UploadResponse = {
  url?: string; // backend ควรคืน { url: "/uploads/products/xxx.png" }
};

interface FormState {
  PROname: string;
  PROprice: string;    // เก็บเป็น string ในฟอร์ม แล้วค่อย parse ก่อนส่ง
  PROpicture: string;  // path หลายรูป คั่นด้วย ,
  PROrenume: string;   // (ไม่บังคับ) เลขภายในถ้ามี
  PROdetail: string;
}

function clampMoneyString(v: string) {
  // อนุญาตตัวเลข + จุดทศนิยม 1 จุด
  const cleaned = v.replace(/[^\d.]/g, '');
  const parts = cleaned.split('.');
  if (parts.length <= 1) return cleaned;
  return `${parts[0]}.${parts.slice(1).join('')}`; // รวมจุดเกินให้เหลือ 1 จุด
}

function parsePriceOrNull(s: string) {
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

function joinPictures(prev: string, nextOnes: string[]) {
  const a = prev.split(',').map(x => x.trim()).filter(Boolean);
  const b = nextOnes.map(x => x.trim()).filter(Boolean);
  return [...a, ...b].join(',');
}

function splitPictures(s: string) {
  return s.split(',').map(x => x.trim()).filter(Boolean);
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
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const readyMeta = useMemo(() => getMeta(AUCTION_PRODUCT_STATUS, 'ready'), []);

  const priceNumber = useMemo(() => parsePriceOrNull(form.PROprice), [form.PROprice]);
  const isPriceValid = useMemo(() => priceNumber !== null && priceNumber >= 0, [priceNumber]);

  // เปลี่ยนค่าในฟอร์ม
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === 'PROprice') {
      setForm(prev => ({ ...prev, PROprice: clampMoneyString(value) }));
      return;
    }

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
    const parts = splitPictures(form.PROpicture);
    parts.splice(idx, 1);
    setForm(prev => ({ ...prev, PROpicture: parts.join(',') }));
  };

  // อัปโหลดรูปที่เลือก (ทีละไฟล์) ไปที่ /upload → เก็บ path ที่ backend คืนมา
  const uploadSelectedImages = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    const uploaded: string[] = [];

    for (const file of selectedFiles) {
      const fd = new FormData();
      fd.append('image', file);

      try {
        const res = await apiFetch(`${API}/upload`, { method: 'POST', body: fd });
        if (!res.ok) {
          alert(`อัปโหลดรูป ${file.name} ไม่สำเร็จ`);
          continue;
        }

        const data = (await res.json().catch(() => ({}))) as UploadResponse;
        const rawUrl = String(data.url || '').trim();
        if (!rawUrl) continue;

        // backend ตอบ /uploads/... → หน้าเว็บใช้ /products/... (ตามระบบเดิมของตะเอ๊ง)
        const path = rawUrl.replace('/uploads', '');
        if (path) uploaded.push(path);
      } catch {
        alert(`อัปโหลดรูป ${file.name} ไม่สำเร็จ`);
      }
    }

    setForm(prev => ({
      ...prev,
      PROpicture: joinPictures(prev.PROpicture, uploaded),
    }));

    setSelectedFiles([]);
    setUploading(false);
  };

  // ส่งฟอร์มไปสร้างสินค้า “เพื่อประมูล”
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.PROname.trim()) return alert('กรอกชื่อสินค้า');
    if (!isPriceValid) return alert('กรอกราคาให้ถูกต้อง');

    const productData: {
      PROname: string;
      PROprice: number;
      PROpicture: string;
      PROrenume: string | null;
      PROdetail: string | null;
    } = {
      PROname: form.PROname.trim(),
      PROprice: priceNumber ?? 0,
      PROpicture: form.PROpicture,
      PROrenume: form.PROrenume.trim() ? form.PROrenume.trim() : null,
      PROdetail: form.PROdetail.trim() ? form.PROdetail.trim() : null,
    };

    setSubmitting(true);

    const res = await apiFetch(`${API}/auction-products`, {
      method: 'POST',
      body: JSON.stringify(productData),
    });

    setSubmitting(false);

    if (res.ok) {
      alert('เพิ่มสินค้าสำเร็จ');
      router.push('/admin/auction-products');
      return;
    }

    const body = (await res.json().catch(() => ({}))) as { error?: string };
    alert(body?.error || 'เพิ่มสินค้าล้มเหลว');
  };

  const uploadedPictures = useMemo(() => splitPictures(form.PROpicture), [form.PROpicture]);

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
          <p className="text-sm text-gray-500 mt-2">
            เพิ่มสินค้าเข้าคลังประมูล (สถานะเริ่มต้น: <span className="font-semibold">ready</span>)
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8 space-y-6"
        >
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
              type="text"
              inputMode="decimal"
              name="PROprice"
              value={form.PROprice}
              onChange={handleChange}
              required
              className={[
                'w-full p-3 rounded-xl border-2 bg-gray-50 text-gray-800 focus:outline-none transition-colors placeholder-gray-400',
                isPriceValid ? 'border-gray-200 focus:border-green-400' : 'border-red-300 focus:border-red-400',
              ].join(' ')}
              placeholder="เช่น 350.00"
            />
            {!isPriceValid ? (
              <div className="mt-1 text-xs font-semibold text-red-600">กรุณากรอกราคาให้ถูกต้อง</div>
            ) : null}
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
                <p className="text-sm font-semibold text-blue-700 mb-2">
                  📁 ไฟล์ที่เลือก ({selectedFiles.length})
                </p>

                <div className="space-y-2">
                  {selectedFiles.map((f, i) => (
                    <div
                      key={`${f.name}-${i}`}
                      className="flex items-center justify-between text-sm text-gray-700 bg-white p-2 rounded-lg"
                    >
                      <span className="truncate">{f.name}</span>
                      <button
                        type="button"
                        onClick={() => removeSelectedFile(i)}
                        className="text-red-500 hover:text-red-700 ml-2"
                        aria-label="ลบไฟล์ที่เลือก"
                      >
                        ❌
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={uploading}
                  onClick={uploadSelectedImages}
                  className="mt-3 w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? '⏳ กำลังอัปโหลด...' : '📤 อัปโหลดรูปภาพ'}
                </button>
              </div>
            )}

            {/* แกลเลอรีรูปที่อัปโหลดแล้ว */}
            {uploadedPictures.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">🖼️ รูปที่อัปโหลดแล้ว</p>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {uploadedPictures.map((p, i) => (
                    <div key={`${p}-${i}`} className="relative group">
                      <img
                        src={`${API}${p}`}
                        alt={`preview-${i}`}
                        className="w-full h-32 object-cover rounded-xl border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeUploadedImage(i)}
                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="ลบรูปที่อัปโหลดแล้ว"
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
          <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-gray-50 border-2 border-gray-200">
            <div>
              <div className="text-sm font-semibold text-gray-700">สถานะเริ่มต้น</div>
              <div className="text-xs text-gray-500">ระบบจะตั้งเป็น ready อัตโนมัติ</div>
            </div>

            <StatusBadge label={`✅ ${readyMeta.label}`} tone={readyMeta.tone} />
          </div>

          <button
            type="submit"
            disabled={submitting || uploading}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? '⏳ กำลังบันทึก...' : '💾 บันทึกสินค้าประมูล'}
          </button>
        </form>
      </div>
    </div>
  );
}
