'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/app/context/CartContext';

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

function getFirstPic(pic?: string) {
  const first = (pic ?? '').split(',')[0]?.trim() ?? '';
  if (!first) return '/no-image.png';
  if (/^https?:\/\//i.test(first)) return first;
  return `${API}${first.startsWith('/') ? '' : '/'}${first}`;
}

function fmtMoney(n: number) {
  return Number(n || 0).toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function CartPanel({
  variant = 'drawer',
}: {
  variant?: 'drawer' | 'page';
}) {
  const router = useRouter();
  const { items, cartCount, totalPrice, removeFromCart, setQty } = useCart();

  const FREE_SHIP_AT = 1000;
  const shippingFee = totalPrice >= FREE_SHIP_AT ? 0 : 50;
  const grandTotal = totalPrice + shippingFee;

  const leftToFree = Math.max(0, FREE_SHIP_AT - totalPrice);
  const progress = Math.min(100, (totalPrice / FREE_SHIP_AT) * 100);

  const wrapperCls =
    variant === 'page'
      ? 'min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50 text-black'
      : 'text-black';

  // ✅ helper: clamp qty by stock
  const getStock = (it: any) => {
    // context บางทีชื่อ stock บางที Pnumproduct
    const s =
      typeof it?.stock === 'number'
        ? it.stock
        : typeof it?.Pnumproduct === 'number'
        ? it.Pnumproduct
        : undefined;

    // ถ้าไม่มีข้อมูล stock เลย ให้ถือว่าไม่จำกัด (Infinity)
    if (s == null) return Infinity;
    return Math.max(0, Number(s) || 0);
  };

  const clampQty = (qty: number, stock: number) => {
    const q = Number.isFinite(qty) ? qty : 1;
    const min = 1;
    const max = stock === Infinity ? Infinity : Math.max(0, stock);
    if (max === 0) return 0; // หมดสต๊อก
    return Math.min(Math.max(min, q), max);
  };

  return (
    <div className={wrapperCls}>
      {variant === 'page' ? (
        <div className="max-w-5xl mx-auto p-6 pt-28">
          <Header />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7">
              <ShippingPromo />
              <div className="mt-4">
                <ItemsCard />
              </div>
            </div>

            <div className="lg:col-span-5">
              <SummaryCard />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-[12px] font-extrabold tracking-wide text-gray-900">
            CART
          </div>
          <ShippingPromo />
          <ItemsCard />
          <SummaryCard />
        </div>
      )}
    </div>
  );

  function Header() {
    return (
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/70 px-4 py-2 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-bold text-emerald-800">
            Premium Checkout
          </span>
        </div>

        <div className="mt-4">
          <div className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">
            ตะกร้าสินค้า
          </div>
          <div className="mt-1 text-sm text-gray-600">
            ตรวจสอบรายการและยอดชำระก่อนดำเนินการ
          </div>
        </div>
      </div>
    );
  }

  function ShippingPromo() {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-50 via-white to-emerald-50">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-extrabold text-gray-900">
                โปรค่าส่งเหมาจ่ายเริ่มต้น 50 บาท
              </div>
              <div className="mt-1 text-xs text-gray-600">
                ซื้อครบ{' '}
                <span className="font-extrabold text-emerald-700">
                  {FREE_SHIP_AT.toLocaleString('th-TH')} บาท
                </span>{' '}
                รับสิทธิ์ <span className="font-bold text-gray-900">ส่งฟรี</span>
              </div>
            </div>

            <div className="shrink-0 rounded-full border border-emerald-200 bg-white px-3 py-1 text-[11px] font-extrabold text-emerald-800">
              Shipping Offer
            </div>
          </div>

          <div className="mt-4">
            <div className="h-2 rounded-full bg-emerald-100 overflow-hidden">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-green-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="text-gray-600">
                ยอดปัจจุบัน:{' '}
                <span className="font-bold text-gray-900">
                  {fmtMoney(totalPrice)} บาท
                </span>
              </span>

              {totalPrice >= FREE_SHIP_AT ? (
                <span className="font-extrabold text-emerald-700">
                  คุณได้รับสิทธิ์ส่งฟรีแล้ว
                </span>
              ) : (
                <span className="text-gray-700">
                  เหลืออีก{' '}
                  <span className="font-extrabold text-gray-900">
                    {leftToFree.toLocaleString('th-TH')}
                  </span>{' '}
                  บาท
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-emerald-100 bg-white">
          <div className="text-[11px] text-gray-600">
            หมายเหตุ: ค่าจัดส่งจะแสดงอัตโนมัติตามเงื่อนไขโปรโมชัน
          </div>
        </div>
      </div>
    );
  }

  function ItemsCard() {
    if (!items || items.length === 0) {
      return (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm text-center">
          <div className="text-sm font-extrabold text-gray-900">
            ไม่มีสินค้าในตะกร้า
          </div>
          <div className="mt-1 text-sm text-gray-600">
            เลือกสินค้าแล้วกลับมาที่นี่เพื่อชำระเงิน
          </div>

          <button
            onClick={() => router.push('/')}
            className="mt-4 inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-900 hover:bg-gray-50 transition"
          >
            ไปเลือกซื้อสินค้า
          </button>
        </div>
      );
    }

    return (
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <div className="text-sm font-extrabold text-gray-900">รายการสินค้า</div>
            <div className="text-xs text-gray-500 mt-1">
              ทั้งหมด <span className="font-bold text-gray-900">{cartCount}</span> ชิ้น
            </div>
          </div>

          <div className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-[11px] font-extrabold text-gray-700">
            Item List
          </div>
        </div>

        <div className="p-4 space-y-3">
          {items.map((it: any) => {
            const qty = Number(it.quantity || 1);

            // ✅ ใช้ stock เป็นหลัก ถ้าไม่มีค่อยใช้ Pnumproduct
            const stock = getStock(it);
            const isOut = stock !== Infinity && stock <= 0;

            // ✅ clamp qty ให้ไม่เกิน stock (ป้องกัน state ที่หลุด)
            const safeQty = isOut ? 0 : clampQty(qty, stock);

            const reachedMax = stock !== Infinity ? safeQty >= stock : false;

            const onSetQtySafe = (nextQty: number) => {
              if (stock === Infinity) {
                setQty(it.Pid, Math.max(1, nextQty));
                return;
              }

              const clamped = clampQty(nextQty, stock);
              // ถ้าหมดสต๊อก ให้บังคับเป็น 0 (หรือจะคงเดิมแล้วโชว์หมดก็ได้)
              setQty(it.Pid, clamped);
            };

            return (
              <div
                key={it.Pid}
                className={`rounded-2xl border bg-gradient-to-r from-gray-50 to-white p-3 transition
                  ${isOut ? 'border-red-200' : 'border-gray-200 hover:border-emerald-200'}`}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={getFirstPic(it.Ppicture)}
                    className="w-16 h-16 rounded-xl object-cover bg-white border border-gray-200"
                    alt={it.Pname}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="font-extrabold text-gray-900 line-clamp-1">
                      {it.Pname}
                    </div>

                    <div className="mt-1 flex items-center gap-2">
                      <div className="text-sm font-bold text-emerald-700">
                        {fmtMoney(Number(it.Pprice))} บาท
                      </div>

                      {/* ✅ แสดงคงเหลือ */}
                      {stock !== Infinity && (
                        <div
                          className={`text-[11px] font-extrabold px-2 py-1 rounded-full border
                            ${isOut ? 'border-red-200 bg-red-50 text-red-700' : 'border-gray-200 bg-white text-gray-700'}`}
                        >
                          คงเหลือ {stock}
                        </div>
                      )}
                    </div>

                    {stock !== Infinity && stock > 0 && reachedMax && (
                      <div className="mt-1 text-[11px] font-bold text-gray-600">
                        จำนวนสูงสุดตามสต๊อกแล้ว
                      </div>
                    )}

                    {isOut && (
                      <div className="mt-1 text-[11px] font-extrabold text-red-700">
                        สินค้าหมด
                      </div>
                    )}
                  </div>

                  <button
                    className="shrink-0 rounded-xl bg-red-50 text-red-700 border border-red-100 px-3 py-2 text-xs font-extrabold hover:bg-red-100 transition"
                    onClick={() => removeFromCart(it.Pid)}
                  >
                    ลบ
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="text-xs text-gray-600">
                    ยอดรวมสินค้า:{' '}
                    <span className="font-extrabold text-gray-900">
                      {fmtMoney(Number(it.Pprice) * (isOut ? 0 : safeQty))} บาท
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      className="w-10 h-10 rounded-xl border border-gray-200 bg-white text-gray-900 font-extrabold hover:bg-gray-50 transition disabled:opacity-40"
                      onClick={() => onSetQtySafe(safeQty - 1)}
                      disabled={isOut || safeQty <= 1}
                    >
                      -
                    </button>

                    <input
                      type="number"
                      className="w-16 h-10 rounded-xl border border-gray-200 bg-white text-center font-extrabold text-gray-900 outline-none focus:ring-2 focus:ring-emerald-200 disabled:opacity-50"
                      min={isOut ? 0 : 1}
                      max={stock === Infinity ? undefined : stock}
                      value={isOut ? 0 : safeQty}
                      disabled={isOut}
                      onChange={(e) => {
                        let v = parseInt(e.target.value, 10);
                        if (!Number.isFinite(v) || isNaN(v)) v = 1;

                        // ✅ ถ้ากรอกเกิน → ปรับให้เป็นจำนวนที่เหลือทั้งหมด
                        onSetQtySafe(v);
                      }}
                      onBlur={(e) => {
                        // ✅ กันเคสพิมพ์ว่าง/0 แล้วค้าง
                        let v = parseInt(e.target.value, 10);
                        if (!Number.isFinite(v) || isNaN(v) || v < 1) v = 1;
                        onSetQtySafe(v);
                      }}
                    />

                    {/* ✅ ปุ่ม + แบบถูกต้อง: ห้ามเกินคงเหลือ */}
                    <button
                      className="w-10 h-10 rounded-xl border border-gray-200 bg-white text-gray-900 font-extrabold hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                      disabled={isOut || reachedMax}
                      onClick={() => onSetQtySafe(safeQty + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* ✅ แจ้งเตือนเมื่อ qty โดน clamp (optional แต่ช่วย UX) */}
                {stock !== Infinity && !isOut && qty > stock && (
                  <div className="mt-2 text-[11px] font-bold text-amber-700">
                    ปรับจำนวนเป็น {stock} ตามสต๊อกที่เหลือ
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function SummaryCard() {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <div className="text-sm font-extrabold text-gray-900">สรุปยอดชำระ</div>
            <div className="text-xs text-gray-500 mt-1">ตรวจสอบก่อนยืนยัน</div>
          </div>

          <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-extrabold text-emerald-800">
            Secure
          </div>
        </div>

        <div className="p-5 space-y-3 text-sm">
          <Row label="ยอดสินค้า" value={`${fmtMoney(totalPrice)} บาท`} />
          <Row
            label="ค่าจัดส่ง"
            value={shippingFee === 0 ? 'ส่งฟรี' : `${shippingFee.toLocaleString('th-TH')} บาท`}
            valueClass={shippingFee === 0 ? 'text-emerald-700' : 'text-gray-900'}
          />

          <div className="pt-3 mt-3 border-t border-gray-200 flex items-end justify-between">
            <div className="text-gray-900 font-extrabold">รวมทั้งหมด</div>
            <div className="text-xl font-extrabold bg-gradient-to-r from-emerald-700 to-green-600 bg-clip-text text-transparent">
              {fmtMoney(grandTotal)} บาท
            </div>
          </div>

          <button
            onClick={() => router.push('/checkout')}
            className="mt-4 w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 text-white py-3 font-extrabold shadow-lg hover:shadow-xl hover:from-emerald-700 hover:to-green-700 transition disabled:opacity-50"
            disabled={!items || items.length === 0}
          >
            ไปชำระเงิน
          </button>

          {variant === 'drawer' && (
            <button
              onClick={() => router.push('/cart')}
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white py-3 font-bold text-gray-900 hover:bg-gray-50 transition"
            >
              เปิดหน้าตะกร้าเต็ม
            </button>
          )}

          <div className="text-[11px] text-gray-500 leading-relaxed">
            ระบบคำนวณค่าจัดส่งตามเงื่อนไขโปรโมชันอัตโนมัติ
          </div>
        </div>
      </div>
    );

    function Row({
      label,
      value,
      valueClass = 'text-gray-900',
    }: {
      label: string;
      value: string;
      valueClass?: string;
    }) {
      return (
        <div className="flex items-center justify-between">
          <span className="text-gray-600">{label}</span>
          <span className={`font-extrabold ${valueClass}`}>{value}</span>
        </div>
      );
    }
  }
}
