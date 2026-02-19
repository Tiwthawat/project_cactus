"use client";

import { apiFetch } from "@/app/lib/apiFetch";
import StatusBadge from "@/app/component/StatusBadge";
import { getMeta, AUCTION_PRODUCT_STATUS } from "@/app/lib/status";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";

type UploadResponse = {
  url?: string; // backend ควรคืน { url: "/uploads/products/xxx.png" }
};

interface FormState {
  PROname: string;
  PROprice: string; // เก็บเป็น string ในฟอร์ม แล้วค่อย parse ก่อนส่ง
  PROpicture: string; // path หลายรูป คั่นด้วย ,
  PROrenume: string; // (ไม่บังคับ) เลขภายในถ้ามี
  PROdetail: string;
}

function clampMoneyString(v: string) {
  const cleaned = v.replace(/[^\d.]/g, "");
  const parts = cleaned.split(".");
  if (parts.length <= 1) return cleaned;
  return `${parts[0]}.${parts.slice(1).join("")}`;
}

function parsePriceOrNull(s: string) {
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

function joinPictures(prev: string, nextOnes: string[]) {
  const a = prev.split(",").map((x) => x.trim()).filter(Boolean);
  const b = nextOnes.map((x) => x.trim()).filter(Boolean);
  return [...a, ...b].join(",");
}

function splitPictures(s: string) {
  return s.split(",").map((x) => x.trim()).filter(Boolean);
}

function toImgUrl(path: string) {
  const clean = String(path || "").trim();
  if (!clean) return "/no-image.png";
  if (clean.startsWith("http")) return clean;
  if (clean.startsWith("/")) return `${API}${clean}`;
  return `${API}/${clean}`;
}

function fmtBaht(n: number) {
  return Number(n || 0).toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function AddAuctionProductPage() {
  const router = useRouter();

  const [form, setForm] = useState<FormState>({
    PROname: "",
    PROprice: "",
    PROpicture: "",
    PROrenume: "",
    PROdetail: "",
  });

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const readyMeta = useMemo(() => getMeta(AUCTION_PRODUCT_STATUS, "ready"), []);
  const uploadedPictures = useMemo(() => splitPictures(form.PROpicture), [form.PROpicture]);

  const priceNumber = useMemo(() => parsePriceOrNull(form.PROprice), [form.PROprice]);
  const isPriceValid = useMemo(() => priceNumber !== null && priceNumber >= 0, [priceNumber]);

  const canSubmit = useMemo(() => {
    return (
      form.PROname.trim().length > 0 &&
      isPriceValid &&
      !submitting &&
      !uploading
    );
  }, [form.PROname, isPriceValid, submitting, uploading]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === "PROprice") {
      setForm((prev) => ({ ...prev, PROprice: clampMoneyString(value) }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setSelectedFiles(Array.from(files));
  };

  const removeSelectedFile = (idx: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const removeUploadedImage = (idx: number) => {
    const parts = splitPictures(form.PROpicture);
    parts.splice(idx, 1);
    setForm((prev) => ({ ...prev, PROpicture: parts.join(",") }));
  };

  const uploadSelectedImages = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    const uploaded: string[] = [];

    for (const file of selectedFiles) {
      const fd = new FormData();
      fd.append("image", file);

      try {
        const res = await apiFetch(`${API}/upload`, { method: "POST", body: fd });
        if (!res.ok) continue;

        const data = (await res.json().catch(() => ({}))) as UploadResponse;
        const rawUrl = String(data.url || "").trim();
        if (!rawUrl) continue;

        // backend ตอบ /uploads/... → หน้าเว็บใช้ /products/... (ตามระบบเดิม)
        const path = rawUrl.replace("/uploads", "");
        if (path) uploaded.push(path);
      } catch {
        // ignore per-file
      }
    }

    setForm((prev) => ({
      ...prev,
      PROpicture: joinPictures(prev.PROpicture, uploaded),
    }));

    setSelectedFiles([]);
    setUploading(false);

    if (uploaded.length === 0) alert("อัปโหลดไม่สำเร็จ");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.PROname.trim()) return alert("กรอกชื่อสินค้า");
    if (!isPriceValid) return alert("กรอกราคาให้ถูกต้อง");

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
      method: "POST",
      body: JSON.stringify(productData),
    });

    setSubmitting(false);

    if (res.ok) {
      router.push("/admin/auction-products");
      return;
    }

    const body = (await res.json().catch(() => ({}))) as { error?: string };
    alert(body?.error || "เพิ่มสินค้าล้มเหลว");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/40 to-slate-50">
      <div className="w-full max-w-3xl mx-auto p-6 pt-8">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/70 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm">
            Auction Product
          </div>

          <div className="mt-4 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
                เพิ่มสินค้าสำหรับประมูล
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                สถานะเริ่มต้น:{" "}
                <span className="inline-flex align-middle">
                  <StatusBadge label={readyMeta.label} tone={readyMeta.tone} />
                </span>
              </p>
            </div>

            <button
              type="button"
              onClick={() => router.push("/admin/auction-products")}
              className="px-4 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold shadow-sm transition"
            >
              กลับไปหน้ารายการ
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white/80 backdrop-blur rounded-2xl shadow-lg border border-slate-200 p-6 md:p-8 space-y-6"
        >
          {/* ชื่อสินค้า */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              ชื่อสินค้า <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              name="PROname"
              value={form.PROname}
              onChange={handleChange}
              required
              className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:border-emerald-400 focus:outline-none transition placeholder:text-slate-400"
              placeholder="เช่น Astrophytum superkabuto"
            />
          </div>

          {/* ราคา */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              ราคาอ้างอิง (บาท) <span className="text-rose-600">*</span>
            </label>

            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                name="PROprice"
                value={form.PROprice}
                onChange={handleChange}
                required
                className={[
                  "w-full p-3 pr-24 rounded-xl border bg-white focus:outline-none transition placeholder:text-slate-400",
                  isPriceValid ? "border-slate-200 focus:border-emerald-400" : "border-rose-300 focus:border-rose-400",
                ].join(" ")}
                placeholder="เช่น 350.00"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 border border-slate-200 bg-slate-50 rounded-lg px-2 py-1">
                THB
              </div>
            </div>

            <div className="mt-1 flex items-center justify-between">
              {!isPriceValid ? (
                <div className="text-xs font-semibold text-rose-600">กรุณากรอกราคาให้ถูกต้อง</div>
              ) : (
                <div className="text-xs text-slate-500">
                  {priceNumber !== null ? `แสดงผล: ${fmtBaht(priceNumber)} บาท` : ""}
                </div>
              )}

              <div className="text-xs text-slate-400">
                ใส่เฉพาะตัวเลข และจุดทศนิยม
              </div>
            </div>
          </div>

          {/* รายละเอียด */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              รายละเอียดสินค้า
            </label>
            <textarea
              name="PROdetail"
              value={form.PROdetail}
              onChange={handleChange}
              className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:border-emerald-400 focus:outline-none transition placeholder:text-slate-400 h-32"
              placeholder="ใส่รายละเอียดคร่าวๆ ของสินค้า"
            />
          </div>

          {/* เลขภายใน */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              เลขภายใน (ถ้ามี)
            </label>
            <input
              type="text"
              name="PROrenume"
              value={form.PROrenume}
              onChange={handleChange}
              className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:border-emerald-400 focus:outline-none transition placeholder:text-slate-400"
              placeholder="เช่น A-102"
            />
          </div>

          {/* Upload */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-slate-700">
                รูปสินค้า
              </label>

              <span className="text-xs font-semibold text-slate-500">
                {uploadedPictures.length > 0 ? `อัปโหลดแล้ว ${uploadedPictures.length} รูป` : "ยังไม่มีรูป"}
              </span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="w-full text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
              />

              {selectedFiles.length > 0 ? (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-semibold text-slate-700">
                      ไฟล์ที่เลือก ({selectedFiles.length})
                    </div>
                    <button
                      type="button"
                      disabled={uploading}
                      onClick={uploadSelectedImages}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploading ? "กำลังอัปโหลด" : "อัปโหลด"}
                    </button>
                  </div>

                  <div className="space-y-2">
                    {selectedFiles.map((f, i) => (
                      <div
                        key={`${f.name}-${i}`}
                        className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                      >
                        <div className="text-sm text-slate-700 truncate">{f.name}</div>
                        <button
                          type="button"
                          onClick={() => removeSelectedFile(i)}
                          className="px-3 py-1 rounded-lg border border-rose-200 bg-white text-rose-700 hover:bg-rose-50 text-sm font-semibold transition"
                        >
                          ลบ
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            {uploadedPictures.length > 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {uploadedPictures.map((p, i) => (
                    <div key={`${p}-${i}`} className="group relative">
                      <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm">
                        <img
                          src={toImgUrl(p)}
                          alt={`preview-${i}`}
                          className="w-full h-28 object-cover"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => removeUploadedImage(i)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition px-2 py-1 rounded-lg bg-white border border-rose-200 text-rose-700 text-xs font-bold shadow-sm hover:bg-rose-50"
                      >
                        ลบ
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-3 text-xs text-slate-500">
                  แนะนำ: อัปโหลดรูปให้ครบก่อน แล้วค่อยกดบันทึก
                </div>
              </div>
            ) : null}
          </div>

          {/* Actions */}
          <div className="pt-2 space-y-3">
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "กำลังบันทึก" : "บันทึกสินค้า"}
            </button>

            <div className="text-xs text-slate-500 text-center">
              เมื่อบันทึกแล้ว ระบบจะเพิ่มเข้าสถานะ <span className="font-semibold">ready</span> และไปที่หน้ารายการ
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
