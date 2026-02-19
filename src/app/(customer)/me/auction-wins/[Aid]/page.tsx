'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/app/lib/apiFetch';

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

interface TransferInfo {
  Tname: string;
  Tnum: string;
  Taccount: string;
  Tbranch: string;
  Tqr: string;
}

interface WinDetail {
  Aid: number;
  PROid: number;
  PROname: string;
  PROpicture: string;
  PROstatus: 'pending_payment' | 'payment_review' | 'paid';
  payment_status: 'pending_payment' | 'payment_review' | 'paid';
  current_price: number;
  end_time: string;

  shipping_company?: string | null;
  tracking_number?: string | null;
  shipping_status?: 'pending' | 'shipping' | 'delivered' | null;
  transfer?: TransferInfo | null;
}

function toImgUrl(path?: string) {
  if (!path) return '/no-image.png';
  const clean = String(path).trim();
  if (!clean) return '/no-image.png';
  if (clean.startsWith('http')) return clean;
  if (clean.startsWith('/')) return `${API}${clean}`;
  return `${API}/${clean}`;
}

function fmtMoney(n: number) {
  return Number(n || 0).toLocaleString('th-TH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function AuctionWinDetailPage() {
  const params = useParams();
  const Aid = (params as any)?.Aid as string;

  const [data, setData] = useState<WinDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState('');

  const [showQr, setShowQr] = useState(false);

  const load = async () => {
    try {
      setMsg('');
      const res = await apiFetch(`/me/my-auction-wins/${Aid}`);
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setMsg(json?.message || 'เกิดข้อผิดพลาด');
        setData(null);
        return;
      }

      setData(json);
    } catch {
      setMsg('โหลดข้อมูลไม่สำเร็จ');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!Aid) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Aid]);

  const uploadSlip = async () => {
    if (!file) {
      setMsg('กรุณาเลือกไฟล์สลิปก่อน');
      return;
    }

    const form = new FormData();
    form.append('Aid', String(Aid));
    form.append('slip', file);

    const res = await apiFetch(`/auction-checkout`, {
      method: 'POST',
      body: form,
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      setMsg(json?.message || 'อัปโหลดไม่สำเร็จ');
      return;
    }

    setMsg('✔ อัปโหลดสลิปสำเร็จ รอตรวจสอบ');
    setFile(null);
    await load();
  };

  const confirmDelivered = async () => {
    const res = await apiFetch(`/me/my-auction-wins/${Aid}/received`, {
      method: 'PATCH',
    });

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      alert(json?.error || 'อัปเดตไม่สำเร็จ');
      return;
    }

    alert('✔ ยืนยันได้รับสินค้าแล้ว');
    await load();
  };

  const paymentMeta = useMemo(() => {
    const s = data?.payment_status;
    if (s === 'pending_payment')
      return {
        label: 'รอชำระเงิน',
        cls: 'border-amber-200 bg-white text-amber-700',
        dot: 'bg-amber-500',
      };
    if (s === 'payment_review')
      return {
        label: 'รอตรวจสอบ',
        cls: 'border-sky-200 bg-white text-sky-700',
        dot: 'bg-sky-500',
      };
    if (s === 'paid')
      return {
        label: 'ชำระเงินแล้ว',
        cls: 'border-emerald-200 bg-white text-emerald-700',
        dot: 'bg-emerald-600',
      };
    return {
      label: '—',
      cls: 'border-gray-200 bg-white text-gray-700',
      dot: 'bg-gray-400',
    };
  }, [data?.payment_status]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-6 pt-24 pb-12">
          <div className="animate-pulse space-y-6">
            <div className="h-5 w-40 bg-gray-200 rounded" />
            <div className="h-10 w-72 bg-gray-200 rounded" />
            <div className="h-28 bg-gray-100 rounded-2xl border border-gray-200" />
            <div className="h-48 bg-gray-100 rounded-2xl border border-gray-200" />
            <div className="h-40 bg-gray-100 rounded-2xl border border-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-6 pt-24 pb-12">
          <div className="rounded-2xl border border-red-200 bg-white p-6">
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
              <p className="text-sm font-semibold text-red-700">{msg || 'ไม่พบข้อมูล'}</p>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              ลองย้อนกลับไปหน้า “สินค้าที่ชนะประมูล” แล้วเข้ามาใหม่อีกที
            </p>
          </div>
        </div>
      </div>
    );
  }

  const firstPic = (data.PROpicture?.split(',')[0] || '').trim();
  const productImg = toImgUrl(firstPic);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="max-w-4xl mx-auto px-6 pt-24 pb-12 space-y-6">
        {/* Header (Winner vibe) */}
        <div className="rounded-2xl border border-emerald-200 bg-white overflow-hidden">
          {/* accent line */}
          <div className="h-[3px] bg-emerald-600" />

          <div className="p-6 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-600" />
                  <span className="text-xs font-semibold tracking-wide text-emerald-800">
                    WINNER ORDER
                  </span>
                </div>

                <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
                  รายละเอียดผู้ชนะประมูล
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  รายการ #{data.Aid} • ปิดประมูล {fmtDate(data.end_time)}
                </p>
              </div>

              <span
                className={[
                  'shrink-0 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold',
                  paymentMeta.cls,
                ].join(' ')}
              >
                <span className={`h-2 w-2 rounded-full ${paymentMeta.dot}`} />
                {paymentMeta.label}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <MiniStat label="ราคาที่ชนะ" value={`${fmtMoney(data.current_price)} บาท`} />
              <MiniStat label="สถานะจัดส่ง" value={shipLabel(data.shipping_status)} />
              <MiniStat
                label="เลขพัสดุ"
                value={data.tracking_number ? data.tracking_number : '—'}
              />
            </div>
          </div>
        </div>

        {/* Product Card */}
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <div className="p-6 sm:p-7">
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-extrabold tracking-tight text-gray-900">
                ข้อมูลสินค้า
              </h2>
              <span className="text-xs text-gray-500">Auction Item</span>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row gap-5">
              <div className="w-full sm:w-44">
                <div className="aspect-square rounded-2xl overflow-hidden border border-gray-200 bg-gray-50">
                  <img
                    src={productImg}
                    alt={data.PROname}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-xl font-extrabold text-gray-900 line-clamp-2">
                  {data.PROname}
                </div>

                <div className="mt-2 text-sm text-gray-600">
                  ราคาชนะ:{' '}
                  <span className="font-semibold text-gray-900">
                    {fmtMoney(data.current_price)} บาท
                  </span>
                </div>

                <div className="mt-4 rounded-2xl border border-emerald-200 bg-white p-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-600" />
                    <p className="text-sm font-semibold text-emerald-800">
                      สิทธิ์ผู้ชนะของคุณได้รับการบันทึกแล้ว
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    ถ้าสถานะยัง “รอชำระเงิน” ให้โอนตามข้อมูลด้านล่างและแนบสลิปได้เลย
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transfer (Only pending) */}
        {data.payment_status === 'pending_payment' && data.transfer && (
          <div className="rounded-2xl border border-emerald-200 bg-white overflow-hidden">
            <div className="h-[3px] bg-emerald-600" />
            <div className="p-6 sm:p-7 space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-gray-900">
                    ชำระเงินผ่านบัญชีธนาคาร
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    โอนให้ตรงชื่อบัญชี แล้วแนบสลิปเพื่อให้แอดมินตรวจสอบ
                  </p>
                </div>
                <span className="rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800">
                  Bank Transfer
                </span>
              </div>

              {/* Bank info panel */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="ธนาคาร" value={data.transfer.Tname} />
                  <Field label="ชื่อบัญชี" value={data.transfer.Taccount} />
                  <div className="sm:col-span-2">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <div className="text-xs font-semibold tracking-wide text-gray-500">
                          เลขบัญชี
                        </div>
                        <div className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-widest text-emerald-900">
                          {data.transfer.Tnum}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(data.transfer!.Tnum);
                          setMsg('✔ คัดลอกเลขบัญชีแล้ว');
                        }}
                        className="shrink-0 rounded-xl bg-emerald-800 px-4 py-2 text-sm font-semibold text-white border border-emerald-900 hover:bg-emerald-900 transition"
                      >
                        คัดลอก
                      </button>
                    </div>
                  </div>
                  <Field label="สาขา" value={data.transfer.Tbranch || '—'} />
                  <Field label="หมายเหตุ" value="โอนยอดตามราคาชนะ แล้วแนบสลิป" />
                </div>
              </div>

              {/* QR */}
              {data.transfer.Tqr && (
                <div className="rounded-2xl border border-gray-200 bg-white p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">QR สำหรับโอน</div>
                      <div className="mt-1 text-xs text-gray-600">
                        แตะที่ QR เพื่อขยายให้สแกนง่าย ๆ
                      </div>
                    </div>
                    <span className="h-2 w-2 rounded-full bg-emerald-600 mt-2" />
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowQr(true)}
                    className="mt-4 mx-auto block rounded-2xl border border-emerald-200 bg-white p-3 hover:border-emerald-300 transition"
                    title="กดเพื่อขยาย QR"
                  >
                    <img
                      src={toImgUrl(data.transfer.Tqr)}
                      alt="QR Code"
                      className="w-56 sm:w-64 rounded-xl"
                    />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Upload Slip */}
        {data.payment_status === 'pending_payment' && (
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <div className="p-6 sm:p-7 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-extrabold text-gray-900">แนบสลิปการโอนเงิน</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    แนบภาพสลิปชัด ๆ แล้วกดอัปโหลด ระบบจะเปลี่ยนเป็น “รอตรวจสอบ”
                  </p>
                </div>
                <span className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700">
                  Slip Upload
                </span>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <input
                  type="file"
                  accept="image/*"
                  className="w-full text-sm file:mr-4 file:rounded-xl file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:font-semibold file:text-emerald-800 hover:file:bg-emerald-100"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />

                <button
                  type="button"
                  onClick={uploadSlip}
                  className="mt-4 w-full rounded-2xl bg-emerald-800 py-3 text-sm font-semibold text-white border border-emerald-900 hover:bg-emerald-900 transition disabled:opacity-50"
                  disabled={!file}
                >
                  อัปโหลดสลิป
                </button>

                {msg && (
                  <div className="mt-3 text-center text-sm text-emerald-700 font-semibold">
                    {msg}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Shipping Section */}
        {data.payment_status === 'paid' && (
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <div className="p-6 sm:p-7 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-extrabold text-gray-900">การจัดส่งสินค้า</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    เมื่อสถานะเป็น “กำลังจัดส่ง” คุณจะกดยืนยันรับสินค้าได้
                  </p>
                </div>

                <span className="rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800">
                  Shipping
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="ขนส่ง" value={data.shipping_company || '—'} />
                <Field label="เลขพัสดุ" value={data.tracking_number || '—'} />
                <div className="sm:col-span-2">
                  <div className="rounded-2xl border border-gray-200 bg-white p-4 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold tracking-wide text-gray-500">
                        สถานะ
                      </div>
                      <div className={`mt-1 text-sm font-semibold ${shipColor(data.shipping_status)}`}>
                        {shipLabel(data.shipping_status)}
                      </div>
                    </div>
                    <span className="h-2 w-2 rounded-full bg-emerald-600 opacity-70" />
                  </div>
                </div>
              </div>

              {data.shipping_status === 'shipping' && (
                <button
                  type="button"
                  onClick={confirmDelivered}
                  className="w-full rounded-2xl bg-emerald-800 py-3 text-sm font-semibold text-white border border-emerald-900 hover:bg-emerald-900 transition"
                >
                  ✔ ยืนยันได้รับสินค้าแล้ว
                </button>
              )}

              {data.shipping_status === 'delivered' && (
                <div className="rounded-2xl border border-emerald-200 bg-white p-4 text-center">
                  <div className="text-sm font-semibold text-emerald-800">
                    ✔ คุณยืนยันการรับสินค้าแล้ว
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* QR Modal */}
        {showQr && data.transfer?.Tqr && (
          <div
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => setShowQr(false)}
          >
            <div
              className="max-w-3xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="rounded-2xl overflow-hidden border border-white/10 bg-white">
                <div className="h-[3px] bg-emerald-600" />
                <div className="p-4 sm:p-6">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <div className="text-sm font-extrabold text-gray-900">QR สำหรับชำระเงิน</div>
                      <div className="mt-1 text-xs text-gray-600">
                        สแกนให้ตรงยอด {fmtMoney(data.current_price)} บาท
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowQr(false)}
                      className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 transition"
                    >
                      ปิด
                    </button>
                  </div>

                  <img
                    src={toImgUrl(data.transfer.Tqr)}
                    alt="QR Full"
                    className="w-full max-h-[75vh] object-contain rounded-xl bg-white"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  function MiniStat({ label, value }: { label: string; value: string }) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <div className="text-xs font-semibold tracking-wide text-gray-500">{label}</div>
        <div className="mt-1 text-sm font-semibold text-gray-900">{value}</div>
      </div>
    );
  }

  function Field({ label, value }: { label: string; value: string }) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <div className="text-xs font-semibold tracking-wide text-gray-500">{label}</div>
        <div className="mt-1 text-sm font-semibold text-gray-900 break-words">{value}</div>
      </div>
    );
  }

  function shipLabel(s?: WinDetail['shipping_status'] | null) {
    if (s === 'pending') return 'รอจัดส่ง';
    if (s === 'shipping') return 'กำลังจัดส่ง';
    if (s === 'delivered') return 'จัดส่งสำเร็จแล้ว';
    return '—';
  }

  function shipColor(s?: WinDetail['shipping_status'] | null) {
    if (s === 'shipping') return 'text-sky-700';
    if (s === 'delivered') return 'text-emerald-700';
    if (s === 'pending') return 'text-gray-700';
    return 'text-gray-600';
  }
}
