'use client';

import { apiFetch } from '@/app/lib/apiFetch';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ProductForm {
  Pname: string;
  Pprice: string;
  Pnumproduct: string;
  Ppicture: string;
  Pdetail: string;
  Pstatus: string;
  Typeid: number | '';
  Subtypeid: number | '';
}

interface ProductType {
  Typeid: number;
  typenproduct: string;
}

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

export default function AddProductPage() {
  const router = useRouter();

  const [subtypes, setSubtypes] = useState<{ Subtypeid: number; subname: string }[]>([]);
  const [types, setTypes] = useState<ProductType[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<string>('');

  const [form, setForm] = useState<ProductForm>({
    Pname: '',
    Pprice: '',
    Pnumproduct: '',
    Ppicture: '',
    Pdetail: '',
    Pstatus: 'In stock',
    Typeid: '',
    Subtypeid: '',
  });

  // ---------- data ----------
  useEffect(() => {
    apiFetch(`${API}/product-types`)
      .then((res) => res.json())
      .then((data: ProductType[]) => setTypes(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Failed to fetch types:', err));
  }, []);

  useEffect(() => {
    if (form.Typeid) {
      apiFetch(`${API}/subtypes/${form.Typeid}`)
        .then((res) => res.json())
        .then((data) => setSubtypes(Array.isArray(data) ? data : []))
        .catch((err) => console.error('โหลดประเภทย่อยไม่สำเร็จ:', err));
    } else {
      setSubtypes([]);
    }
  }, [form.Typeid]);

  // ---------- helpers ----------
  const uploadedList = useMemo(() => {
    const s = String(form.Ppicture || '').trim();
    if (!s) return [];
    return s
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
  }, [form.Ppicture]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        name === 'Pprice' || name === 'Pnumproduct' || name === 'Typeid' || name === 'Subtypeid'
          ? (value === '' ? '' : Number(value))
          : value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setSelectedFiles(Array.from(files));
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeUploadedImage = (index: number) => {
    const paths = uploadedList.slice();
    paths.splice(index, 1);
    setForm((prev) => ({ ...prev, Ppicture: paths.join(',') }));
  };

  const uploadSelectedImages = async () => {
    if (!selectedFiles.length || uploading) return;

    setUploading(true);
    setMsg('');

    const uploadedPaths: string[] = [];

    for (const file of selectedFiles) {
      const formData = new FormData();
      formData.append('image', file);

      try {
        const res = await apiFetch(`${API}/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) throw new Error('upload failed');

        const data = await res.json().catch(() => ({} as any));
        const correctPath = String(data?.url || '').replace('/uploads', '');
        if (correctPath) uploadedPaths.push(correctPath);
      } catch {
        alert(`อัปโหลดรูป ${file.name} ไม่สำเร็จ`);
      }
    }

    setForm((prev) => ({
      ...prev,
      Ppicture: prev.Ppicture
        ? `${prev.Ppicture},${uploadedPaths.join(',')}`
        : uploadedPaths.join(','),
    }));

    setSelectedFiles([]);
    setUploading(false);
    if (uploadedPaths.length) setMsg('อัปโหลดรูปเรียบร้อยแล้ว');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setMsg('');

    const productData = {
      ...form,
      Pprice: parseFloat(form.Pprice),
      Pnumproduct: parseInt(form.Pnumproduct),
      Prenume: 0,
    };

    try {
      const res = await apiFetch(`${API}/product`, {
        method: 'POST',
        body: JSON.stringify(productData),
      });

      if (res.ok) {
        router.push('/admin/products');
      } else {
        setMsg('เพิ่มสินค้าล้มเหลว');
        alert('เพิ่มสินค้าล้มเหลว');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit =
    Boolean(form.Typeid) &&
    Boolean(form.Subtypeid) &&
    String(form.Pname || '').trim().length > 0 &&
    Number(form.Pprice) > 0 &&
    Number(form.Pnumproduct) >= 0;

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
                เพิ่มสินค้าใหม่
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                กรอกข้อมูลสินค้า อัปโหลดรูป แล้วบันทึกเข้าระบบ
              </p>
            </div>

            <button
              type="button"
              onClick={() => router.push('/admin/products')}
              className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-white px-5 py-3 text-sm font-semibold text-emerald-950 hover:bg-emerald-50 transition"
            >
              กลับไปหน้ารายการสินค้า
            </button>
          </div>
        </div>

        {/* Layout: form + image */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: form */}
          <section className="lg:col-span-2 bg-white rounded-2xl border border-emerald-100 shadow-sm">
            <div className="p-6 border-b border-emerald-100">
              <div className="text-lg font-semibold text-emerald-950">ข้อมูลสินค้า</div>
              <div className="text-sm text-slate-600">
                เลือกประเภท/ประเภทย่อยให้ถูกก่อน แล้วค่อยกรอกชื่อ ราคา และจำนวน
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    ประเภทสินค้า <span className="text-rose-600">*</span>
                  </label>
                  <select
                    name="Typeid"
                    value={form.Typeid}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-slate-800 font-semibold focus:outline-none focus:ring-4 focus:ring-emerald-100"
                  >
                    <option value="">เลือกประเภท</option>
                    {types.map((type) => (
                      <option key={type.Typeid} value={type.Typeid}>
                        {type.typenproduct}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    ประเภทย่อย <span className="text-rose-600">*</span>
                  </label>
                  <select
                    name="Subtypeid"
                    value={form.Subtypeid}
                    onChange={handleChange}
                    required
                    disabled={!form.Typeid}
                    className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-slate-800 font-semibold focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:opacity-60"
                  >
                    <option value="">{form.Typeid ? 'เลือกประเภทย่อย' : 'เลือกประเภทก่อน'}</option>
                    {subtypes.map((sub) => (
                      <option key={sub.Subtypeid} value={sub.Subtypeid}>
                        {sub.subname}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  ชื่อสินค้า <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  name="Pname"
                  value={form.Pname}
                  onChange={handleChange}
                  required
                  placeholder="เช่น Astrophytum asterias"
                  className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-slate-900 font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    ราคา (บาท) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="number"
                    name="Pprice"
                    value={form.Pprice}
                    onChange={handleChange}
                    required
                    min={0}
                    step="1"
                    placeholder="0"
                    className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-slate-900 font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    จำนวนคงเหลือ <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="number"
                    name="Pnumproduct"
                    value={form.Pnumproduct}
                    onChange={handleChange}
                    required
                    min={0}
                    step="1"
                    placeholder="0"
                    className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-slate-900 font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  รายละเอียดสินค้า
                </label>
                <textarea
                  name="Pdetail"
                  value={form.Pdetail}
                  onChange={handleChange}
                  rows={5}
                  placeholder="รายละเอียดเพิ่มเติม เช่น ขนาด สภาพ วิธีดูแล"
                  className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              {/* actions */}
              <div className="pt-2 flex flex-col md:flex-row gap-3">
                <button
                  type="submit"
                  disabled={!canSubmit || submitting}
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-800 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-900 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? 'กำลังบันทึก...' : 'บันทึกสินค้า'}
                </button>

                <button
                  type="button"
                  onClick={() => router.push('/admin/products')}
                  className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-white px-6 py-3 text-sm font-semibold text-emerald-950 hover:bg-emerald-50 transition"
                >
                  ยกเลิก
                </button>
              </div>

              {msg ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                  {msg}
                </div>
              ) : null}
            </div>
          </section>

          {/* RIGHT: images */}
          <aside className="bg-white rounded-2xl border border-emerald-100 shadow-sm">
            <div className="p-6 border-b border-emerald-100">
              <div className="text-lg font-semibold text-emerald-950">รูปสินค้า</div>
              <div className="text-sm text-slate-600">
                อัปโหลดรูปได้หลายรูป แล้วกด “เพิ่มรูปภาพ” เพื่อบันทึก path เข้าแบบฟอร์ม
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  เลือกรูป (หลายไฟล์ได้)
                </label>

                <input
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*"
                  multiple
                  className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-emerald-900 hover:file:bg-emerald-100"
                />
              </div>

              {selectedFiles.length > 0 ? (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-semibold text-emerald-950">
                      ไฟล์ที่เลือก ({selectedFiles.length})
                    </div>
                    <button
                      type="button"
                      onClick={uploadSelectedImages}
                      disabled={uploading}
                      className="rounded-xl bg-emerald-800 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-900 transition disabled:opacity-60"
                    >
                      {uploading ? 'กำลังอัปโหลด...' : 'เพิ่มรูปภาพ'}
                    </button>
                  </div>

                  <div className="space-y-2">
                    {selectedFiles.map((file, idx) => (
                      <div
                        key={`${file.name}-${idx}`}
                        className="flex items-center justify-between rounded-xl border border-emerald-100 bg-white px-3 py-2"
                      >
                        <div className="text-sm text-slate-700 truncate max-w-[220px]">
                          {file.name}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-800 hover:bg-rose-100 transition"
                        >
                          ลบ
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 text-sm text-slate-600">
                  ยังไม่ได้เลือกรูป
                </div>
              )}

              <div className="rounded-2xl border border-emerald-100 bg-white">
                <div className="px-4 py-3 border-b border-emerald-100 flex items-center justify-between">
                  <div className="text-sm font-semibold text-emerald-950">รูปที่อัปโหลดแล้ว</div>
                  <div className="text-xs font-bold rounded-full px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-900">
                    {uploadedList.length}
                  </div>
                </div>

                {uploadedList.length === 0 ? (
                  <div className="p-4 text-sm text-slate-600">ยังไม่มีรูปที่อัปโหลด</div>
                ) : (
                  <div className="p-4 grid grid-cols-2 gap-3 max-h-80 overflow-auto">
                    {uploadedList.map((path, idx) => (
                      <div key={`${path}-${idx}`} className="relative group">
                        <img
                          src={`${API}${path}`}
                          alt={`uploaded-${idx}`}
                          className="w-full aspect-square object-cover rounded-xl border border-emerald-100"
                        />
                        <button
                          type="button"
                          onClick={() => removeUploadedImage(idx)}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition
                                     rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-800 hover:bg-rose-100"
                        >
                          ลบ
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* hidden raw */}
              {/* ถ้าอยากเช็ค path ดิบ ๆ เปิดดูได้ */}
              {/* <pre className="text-xs text-slate-500 whitespace-pre-wrap break-all">{form.Ppicture}</pre> */}
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
}
