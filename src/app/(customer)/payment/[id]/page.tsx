'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/app/lib/apiFetch';

interface Transfer {
  Tid: number;
  Tname: string;
  Tnum: string;
  Taccount: string;
  Tbranch: string;
  Tqr: string; // path เช่น "/qrs/xxx.png"
}

interface Order {
  Oid: number;
  Oprice: number;
  Ostatus: string;
}

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

const getImageUrl = (path: string | null | undefined) => {
  if (!path) return '/no-image.png';
  const clean = String(path).trim();
  if (clean.startsWith('http')) return clean;
  if (clean.startsWith('/')) return `${API}${clean}`;
  return `${API}/${clean}`;
};

const fmtBaht = (n: number) =>
  Number(n || 0).toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();

  const id = useMemo(() => {
    const raw = (params as any)?.id;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);

  const [order, setOrder] = useState<Order | null>(null);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [selectedTid, setSelectedTid] = useState<number | null>(null);
  const [slip, setSlip] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  // modal QR
  const [zoomUrl, setZoomUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!zoomUrl) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoomUrl(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [zoomUrl]);

  // โหลด order + transfers
  useEffect(() => {
    if (!id) return;

    const load = async () => {
      setPageError(null);
      try {
        const [orderRes, transferRes] = await Promise.all([
          apiFetch(`${API}/orders/${id}`),
          apiFetch(`${API}/transfer`),
        ]);

        if (!orderRes.ok) {
          setOrder(null);
          setPageError('ไม่พบคำสั่งซื้อ หรือไม่มีสิทธิ์เข้าถึง');
        } else {
          const od = await orderRes.json();
          setOrder({
            Oid: Number(od.Oid),
            Oprice: Number(od.Oprice),
            Ostatus: String(od.Ostatus),
          });
        }

        if (!transferRes.ok) {
          setTransfers([]);
        } else {
          const ts = await transferRes.json();
          setTransfers(Array.isArray(ts) ? ts : []);
        }
      } catch (err) {
        console.error(err);
        setOrder(null);
        setTransfers([]);
        setPageError('โหลดข้อมูลไม่สำเร็จ');
      }
    };

    load();
  }, [id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;

    if (file && file.size > 3 * 1024 * 1024) {
      alert('ไฟล์ใหญ่เกิน 3MB');
      return;
    }

    setSlip(file);

    if (!file) {
      setPreview(null);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!order) return;
    if (!slip || !selectedTid) {
      alert('กรุณาเลือกช่องทางโอนและแนบสลิป');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('Oid', String(order.Oid));
      formData.append('Payprice', String(order.Oprice));
      formData.append('slip', slip);
      formData.append('Tid', String(selectedTid));

      const res = await apiFetch(`${API}/payment`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        alert('แจ้งชำระเงินสำเร็จ!');
        router.push('/me/orders');
      } else {
        alert(data?.message || 'เกิดข้อผิดพลาด');
      }
    } catch (err) {
      console.error(err);
      alert('เชื่อมต่อ server ไม่ได้');
    } finally {
      setLoading(false);
    }
  };

  // Loading / Error
  if (pageError) {
    return (
      <div className="min-h-screen bg-white grid place-items-center px-6">
        <div className="max-w-md w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_-45px_rgba(2,6,23,0.55)]">
          <p className="text-sm font-semibold text-rose-700">PAYMENT</p>
          <p className="mt-2 text-lg font-extrabold text-slate-900">เกิดปัญหา</p>
          <p className="mt-2 text-slate-600">{pageError}</p>
          <button
            onClick={() => router.push('/')}
            className="mt-6 w-full h-11 rounded-2xl bg-slate-900 text-white font-extrabold hover:bg-slate-800 transition-colors"
          >
            กลับหน้าแรก
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-white grid place-items-center px-6">
        <div className="max-w-md w-full rounded-3xl border border-slate-200 bg-white p-6">
          <p className="text-slate-600">กำลังโหลดข้อมูลคำสั่งซื้อ...</p>
        </div>
      </div>
    );
  }

  // บล็อกส่งซ้ำ
  if (order.Ostatus === 'payment_review') {
    return (
      <div className="min-h-screen bg-white grid place-items-center px-6">
        <div className="max-w-md w-full rounded-3xl border border-amber-200 bg-amber-50 p-6">
          <p className="text-sm font-semibold text-amber-800">PAYMENT</p>
          <p className="mt-2 text-lg font-extrabold text-slate-900">กำลังตรวจสอบสลิป</p>
          <p className="mt-2 text-slate-700">
            สลิปกำลังตรวจสอบ กรุณารอแอดมินยืนยัน
          </p>
          <button
            onClick={() => router.push('/me/orders')}
            className="mt-6 w-full h-11 rounded-2xl bg-slate-900 text-white font-extrabold hover:bg-slate-800 transition-colors"
          >
            ไปหน้าคำสั่งซื้อ
          </button>
        </div>
      </div>
    );
  }

  if (order.Ostatus === 'paid') {
    return (
      <div className="min-h-screen bg-white grid place-items-center px-6">
        <div className="max-w-md w-full rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
          <p className="text-sm font-semibold text-emerald-800">PAYMENT</p>
          <p className="mt-2 text-lg font-extrabold text-slate-900">ชำระเงินแล้ว</p>
          <p className="mt-2 text-slate-700">ไม่ต้องส่งสลิปซ้ำ</p>
          <button
            onClick={() => router.push('/me/orders')}
            className="mt-6 w-full h-11 rounded-2xl bg-slate-900 text-white font-extrabold hover:bg-slate-800 transition-colors"
          >
            ไปหน้าคำสั่งซื้อ
          </button>
        </div>
      </div>
    );
  }

  // UI
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-emerald-50/40 text-slate-900">
      {/* subtle glow */}
      <div className="pointer-events-none fixed inset-x-0 top-0 h-56 bg-gradient-to-b from-emerald-100/45 to-transparent blur-3xl" />

      <div className="relative max-w-6xl mx-auto pt-28 md:pt-32 px-4 md:px-6 pb-20">
        {/* Header */}
        <div className="mb-10 md:mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="text-sm font-semibold tracking-widest text-emerald-700">PAYMENT</p>
            <h1 className="mt-2 text-3xl md:text-5xl font-extrabold tracking-tight">
              แจ้งชำระเงิน
            </h1>
            <p className="mt-2 text-slate-600">
              ออเดอร์ <span className="font-bold text-slate-900">#{order.Oid}</span> • ยอดที่ต้องชำระ{' '}
              <span className="font-extrabold text-emerald-700">{fmtBaht(order.Oprice)}</span> บาท
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white/80 px-5 py-4 shadow-sm w-full md:w-auto">
            <p className="text-xs font-semibold text-slate-500">ยอดชำระ</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">
              {fmtBaht(order.Oprice)} บาท
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: main */}
          <div className="lg:col-span-2 space-y-6">
            {/* Choose transfer */}
            <section className="rounded-3xl border border-slate-200 bg-white/90 shadow-[0_10px_30px_-20px_rgba(2,6,23,0.35)] backdrop-blur">
              <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight">เลือกบัญชีสำหรับโอน</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    แตะที่ QR เพื่อขยายสแกนได้ชัดขึ้น
                  </p>
                </div>
                <div className="hidden md:block text-xs text-slate-500">
                  เลือก 1 บัญชีเท่านั้น
                </div>
              </div>

              <div className="p-6">
                {transfers.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-600">
                    ยังไม่มีบัญชีโอน
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {transfers.map((t) => {
                      const active = selectedTid === t.Tid;
                      const qrUrl = getImageUrl(t.Tqr);

                      return (
                        <button
                          key={t.Tid}
                          onClick={() => setSelectedTid(t.Tid)}
                          className={[
                            'text-left rounded-3xl border p-4 transition-all',
                            active
                              ? 'border-emerald-300 bg-emerald-50/60 ring-2 ring-emerald-200'
                              : 'border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/20',
                          ].join(' ')}
                          type="button"
                        >
                          <div className="flex items-start gap-4">
                            {/* QR zoom */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setZoomUrl(qrUrl);
                              }}
                              className="shrink-0 rounded-2xl border border-slate-200 bg-white p-2 hover:border-emerald-200 transition-colors"
                              aria-label="ขยาย QR"
                              title="ขยาย QR"
                            >
                              <img
                                src={qrUrl}
                                alt="QR"
                                className="w-[92px] h-[92px] object-cover rounded-xl cursor-zoom-in"
                              />
                            </button>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3">
                                <p className="font-extrabold text-slate-900 truncate">{t.Tname}</p>
                                <div
                                  className={[
                                    'h-5 w-5 rounded-full border flex items-center justify-center mt-0.5',
                                    active ? 'border-emerald-500' : 'border-slate-300',
                                  ].join(' ')}
                                >
                                  {active && <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />}
                                </div>
                              </div>

                              <div className="mt-2 space-y-1">
                                <p className="text-sm text-slate-600">
                                  เลขบัญชี:{' '}
                                  <span className="font-extrabold text-slate-900 tracking-wide">
                                    {t.Tnum}
                                  </span>
                                </p>
                                <p className="text-sm text-slate-600">
                                  ชื่อบัญชี: <span className="font-semibold text-slate-800">{t.Taccount}</span>
                                </p>
                                <p className="text-sm text-slate-600">
                                  สาขา: <span className="font-semibold text-slate-800">{t.Tbranch}</span>
                                </p>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            {/* Slip upload */}
            <section className="rounded-3xl border border-slate-200 bg-white/90 shadow-[0_10px_30px_-20px_rgba(2,6,23,0.35)] backdrop-blur">
              <div className="px-6 pt-6 pb-4 border-b border-slate-100">
                <h2 className="text-xl font-extrabold tracking-tight">แนบสลิป</h2>
                <p className="text-sm text-slate-500 mt-1">รองรับรูปภาพ ขนาดไม่เกิน 3MB</p>
              </div>

              <div className="p-6">
                <label className="block">
                  <span className="sr-only">เลือกไฟล์สลิป</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-slate-700
                      file:mr-4 file:py-2.5 file:px-4
                      file:rounded-2xl file:border file:border-slate-200
                      file:text-sm file:font-extrabold
                      file:bg-white file:text-slate-900
                      hover:file:bg-slate-50"
                  />
                </label>

                {preview && (
                  <div className="mt-5">
                    <p className="text-sm font-semibold text-slate-700 mb-2">ตัวอย่างสลิป</p>
                    <div className="rounded-3xl border border-slate-200 bg-white p-3">
                      <img
                        src={preview}
                        alt="slip preview"
                        className="w-full max-h-[520px] object-contain rounded-2xl"
                      />
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* RIGHT: action summary (premium) */}
          <aside className="lg:col-span-1">
            <div className="sticky top-28 space-y-6">
              <section className="rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_-45px_rgba(2,6,23,0.55)] overflow-hidden">
                <div className="px-6 pt-6 pb-5 bg-gradient-to-r from-emerald-700 to-green-700 text-white">
                  <p className="text-xs font-semibold tracking-widest opacity-90">CONFIRM</p>
                  <h3 className="mt-1 text-2xl font-extrabold tracking-tight">ยืนยันการชำระ</h3>
                  <p className="mt-1 text-sm opacity-90">เลือกบัญชี + แนบสลิป แล้วกดส่ง</p>
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>ออเดอร์</span>
                    <span className="font-extrabold text-slate-900">#{order.Oid}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>ยอดชำระ</span>
                    <span className="font-extrabold text-slate-900">{fmtBaht(order.Oprice)} บาท</span>
                  </div>

                  <div className="border-t border-slate-200 pt-4">
                    <button
                      onClick={handleSubmit}
                      disabled={loading || !selectedTid || !slip}
                      className="w-full h-12 rounded-2xl bg-slate-900 text-white font-extrabold shadow-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'กำลังส่ง...' : 'ยืนยันส่งสลิป'}
                    </button>

                    <p className="mt-3 text-xs text-slate-500 leading-relaxed">
                      หลังส่งสลิป ระบบจะเปลี่ยนสถานะเป็น <span className="font-semibold">รอตรวจสอบ</span>
                    </p>
                  </div>
                </div>
              </section>

              <button
                type="button"
                onClick={() => router.push('/me/orders')}
                className="w-full h-11 rounded-2xl border border-slate-200 bg-white font-extrabold text-slate-900 hover:bg-slate-50 transition-colors"
              >
                กลับไปหน้าคำสั่งซื้อ
              </button>
            </div>
          </aside>
        </div>
      </div>

      {/* QR Modal (premium, no emoji) */}
      {zoomUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setZoomUrl(null)}
        >
          <div
            className="relative max-w-md w-full rounded-3xl border border-white/10 bg-white shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold tracking-widest text-slate-500">QR PREVIEW</p>
                <p className="text-base font-extrabold text-slate-900">ขยาย QR</p>
              </div>

              <button
                type="button"
                onClick={() => setZoomUrl(null)}
                className="h-10 w-10 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors grid place-items-center"
                aria-label="ปิด"
                title="ปิด (Esc)"
              >
                <span className="text-xl leading-none">×</span>
              </button>
            </div>

            <div className="p-5">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3">
                <img src={zoomUrl} alt="QR" className="w-full h-auto rounded-2xl border border-slate-200 bg-white" />
              </div>
              <p className="mt-3 text-xs text-slate-500 text-center">
                กด Esc หรือคลิกนอกกรอบเพื่อปิด
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
