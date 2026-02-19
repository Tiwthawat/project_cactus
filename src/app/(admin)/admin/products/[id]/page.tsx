'use client';

import { apiFetch } from '@/app/lib/apiFetch';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface Product {
  Pname: string;
  Pprice: string;
  Pnumproduct: string;
  Pdetail: string;
  Ppicture: string;
  Pstatus: string;
  Typeid: number | '';
  Subtypeid: number | '';
}

interface ProductType {
  Typeid: number;
  typenproduct: string;
}

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

export default function EditProducts() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [types, setTypes] = useState<ProductType[]>([]);
  const [subtypes, setSubtypes] = useState<{ Subtypeid: number; subname: string }[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<string>('');

  const [form, setForm] = useState<Product>({
    Pname: '',
    Pprice: '',
    Pnumproduct: '',
    Pdetail: '',
    Ppicture: '',
    Pstatus: 'In stock',
    Typeid: '',
    Subtypeid: '',
  });

  // ---- derived ----
  const uploadedList = useMemo(() => {
    const s = String(form.Ppicture || '').trim();
    if (!s) return [];
    return s
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
  }, [form.Ppicture]);

  // ---- init load ----
  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        setLoading(true);

        const [pRes, tRes] = await Promise.all([
          apiFetch(`${API}/product/${id}`),
          apiFetch(`${API}/product-types`),
        ]);

        const data: any = await pRes.json().catch(() => null);
        const typesData: ProductType[] = await tRes.json().catch(() => []);

        if (!alive) return;

        if (pRes.ok && data) {
          setForm({
            Pname: data.Pname ?? '',
            Pprice: String(data.Pprice ?? ''),
            Pnumproduct: String(data.Pnumproduct ?? ''),
            Pdetail: data.Pdetail ?? '',
            Ppicture: data.Ppicture ?? '',
            Pstatus: data.Pstatus ?? 'In stock',
            Typeid: data.Typeid ?? '',
            Subtypeid: data.Subtypeid ?? '',
          });
        }

        setTypes(Array.isArray(typesData) ? typesData : []);
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, [id]);

  // ---- load subtypes when Type changes ----
  useEffect(() => {
    if (!form.Typeid) {
      setSubtypes([]);
      return;
    }

    apiFetch(`${API}/subtypes/${form.Typeid}`)
      .then((res) => res.json())
      .then((data) => setSubtypes(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error('โหลด subtypes ไม่สำเร็จ:', err);
        setSubtypes([]);
      });
  }, [form.Typeid]);

  // ---- handlers ----
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // ✅ เปลี่ยน type แล้ว reset subtype เพื่อกัน Subtypeid ค้างผิดหมวด
    if (name === 'Typeid') {
      setForm((prev) => ({
        ...prev,
        Typeid: value === '' ? '' : Number(value),
        Subtypeid: '', // reset
      }));
      return;
    }

    if (name === 'Subtypeid') {
      setForm((prev) => ({
        ...prev,
        Subtypeid: value === '' ? '' : Number(value),
      }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setMsg('');

    const payload = {
      ...form,
      Pprice: parseFloat(form.Pprice),
      Pnumproduct: parseInt(form.Pnumproduct),
      Typeid: form.Typeid === '' ? null : Number(form.Typeid),
      Subtypeid: form.Subtypeid === '' ? null : Number(form.Subtypeid),
    };

    try {
      const res = await apiFetch(`${API}/product/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push('/admin/products');
      } else {
        alert('อัปเดตไม่สำเร็จ');
        setMsg('อัปเดตไม่สำเร็จ');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit =
    String(form.Pname || '').trim().length > 0 &&
    Number(form.Pprice) > 0 &&
    Number(form.Pnumproduct) >= 0 &&
    Boolean(form.Typeid) &&
    Boolean(form.Subtypeid);

  if (loading) {
    return (
      <div className="min-h-screen bg-emerald-50 text-black">
        <div className="max-w-6xl mx-auto px-8 py-12">
          <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-10 text-center">
            <div className="w-12 h-12 border-4 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <div className="text-slate-700 font-semibold">กำลังโหลดข้อมูลสินค้า...</div>
          </div>
        </div>
      </div>
    );
  }

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
                แก้ไขสินค้า
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                แก้ไขข้อมูลสินค้า และจัดการรูปภาพก่อนบันทึก
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

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: form */}
          <section className="lg:col-span-2 bg-white rounded-2xl border border-emerald-100 shadow-sm">
            <div className="p-6 border-b border-emerald-100">
              <div className="text-lg font-semibold text-emerald-950">ข้อมูลสินค้า</div>
              <div className="text-sm text-slate-600">
                เปลี่ยนประเภทแล้วระบบจะบังคับให้เลือกประเภทย่อยใหม่ (กันข้อมูลมั่ว)
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
                    <option value="">
                      {form.Typeid ? 'เลือกประเภทย่อย' : 'เลือกประเภทก่อน'}
                    </option>
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
                  name="Pname"
                  value={form.Pname}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-slate-900 font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                  placeholder="ชื่อสินค้า"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    ราคา (บาท) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    name="Pprice"
                    type="number"
                    step="1"
                    min={0}
                    value={form.Pprice}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-slate-900 font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    จำนวนคงเหลือ <span className="text-rose-600">*</span>
                  </label>
                  <input
                    name="Pnumproduct"
                    type="number"
                    step="1"
                    min={0}
                    value={form.Pnumproduct}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-slate-900 font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                    placeholder="0"
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
                  className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                  placeholder="รายละเอียดสินค้า"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    สถานะสินค้า
                  </label>
                  <select
                    name="Pstatus"
                    value={form.Pstatus}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-slate-800 font-semibold focus:outline-none focus:ring-4 focus:ring-emerald-100"
                  >
                    <option value="In stock">In stock</option>
                    <option value="Out of stock">Out of stock</option>
                  </select>
                </div>
              </div>

              {/* actions */}
              <div className="pt-2 flex flex-col md:flex-row gap-3">
                <button
                  type="submit"
                  disabled={!canSubmit || submitting}
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-800 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-900 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
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
                เลือกรูปหลายไฟล์ → กด “เพิ่มรูปภาพ” เพื่ออัปโหลด
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
                  multiple
                  accept="image/*"
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
                  <div className="text-sm font-semibold text-emerald-950">รูปที่มีอยู่</div>
                  <div className="text-xs font-bold rounded-full px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-900">
                    {uploadedList.length}
                  </div>
                </div>

                {uploadedList.length === 0 ? (
                  <div className="p-4 text-sm text-slate-600">ยังไม่มีรูป</div>
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
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
}
