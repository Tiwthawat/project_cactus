'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch } from '@/app/lib/apiFetch';

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

interface CartItem {
  Pid: number;
  Pname: string;
  Ppicture: string;
  Pprice: number;
  quantity: number;
  Pnumproduct: number;
}

interface User {
  Cid: number;
  Cname: string;
  Cphone: string;
  Caddress: string;
  Csubdistrict: string;
  Cdistrict: string;
  Cprovince: string;
  Czipcode: string;
}

const getImageUrl = (path: string) => {
  if (!path) return '/no-image.png';
  const clean = String(path).trim();
  const first = clean.split(',')[0]?.trim() || '';
  if (!first) return '/no-image.png';
  if (first.startsWith('http')) return first;
  if (first.startsWith('/')) return `${API}${first}`;
  return `${API}/${first}`;
};

const fmtBaht = (n: number) =>
  Number(n || 0).toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get('type');
  const isBuyNow = type === 'buynow';

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [Cid, setCid] = useState<number | null>(null);
  const [payment, setPayment] = useState<'transfer' | 'cod'>('transfer');
  const [loading, setLoading] = useState(false);

  const totalPrice = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.Pprice * item.quantity, 0),
    [cartItems]
  );
  const shippingFee = totalPrice >= 1000 ? 0 : 50;
  const grandTotal = totalPrice + shippingFee;

  const fullAddress = useMemo(() => {
    if (!user) return '';
    return [user.Caddress, user.Csubdistrict, user.Cdistrict, user.Cprovince, user.Czipcode]
      .filter((x) => typeof x === 'string' && x.trim().length > 0)
      .join(', ');
  }, [user]);

  // Load profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await apiFetch(`${API}/me`);
        if (!res.ok) return;

        const data = await res.json();
        const u: User | null = (data?.user ?? data) || null;

        if (u?.Cid) {
          setUser(u);
          setCid(u.Cid);
          localStorage.setItem('user', JSON.stringify(u));
        }
      } catch (err) {
        console.error('โหลดข้อมูลผู้ใช้ล้มเหลว:', err);
      }
    };

    loadProfile();
  }, []);

  // Load items
  useEffect(() => {
    const loadItems = async () => {
      try {
        if (isBuyNow) {
          const data = JSON.parse(localStorage.getItem('buynow') || '{}') as { pid?: number; qty?: number };
          if (!data?.pid) {
            setCartItems([]);
            return;
          }

          const res = await apiFetch(`${API}/product/${data.pid}`);
          if (!res.ok) {
            setCartItems([]);
            return;
          }

          const product = await res.json();
          const pic = typeof product?.Ppicture === 'string' ? product.Ppicture.split(',')[0] : '';

          setCartItems([
            {
              Pid: product.Pid,
              Pname: product.Pname,
              Ppicture: pic,
              Pprice: Number(product.Pprice) || 0,
              quantity: data.qty || 1,
              Pnumproduct: Number(product.Pnumproduct) || 0,
            },
          ]);
        } else {
          const cart = JSON.parse(localStorage.getItem('cart') || '[]') as CartItem[];
          setCartItems(Array.isArray(cart) ? cart : []);
        }
      } catch (err) {
        console.error('โหลดรายการสินค้าล้มเหลว:', err);
        setCartItems([]);
      }
    };

    loadItems();
  }, [isBuyNow]);

  // Sync stock from DB
  useEffect(() => {
    const syncStockFromDB = async () => {
      if (cartItems.length === 0) return;

      try {
        const results = await Promise.all(
          cartItems.map(async (it) => {
            const res = await apiFetch(`${API}/product/${it.Pid}`, { cache: 'no-store' });
            if (!res.ok) return { Pid: it.Pid, stock: it.Pnumproduct ?? 0 };
            const data = await res.json();
            return { Pid: it.Pid, stock: Number(data?.Pnumproduct) || 0 };
          })
        );

        const stockMap = new Map(results.map((r) => [r.Pid, r.stock]));

        setCartItems((prev) =>
          prev.map((it) => {
            const stock = stockMap.get(it.Pid);
            if (!Number.isFinite(stock)) return it;

            return {
              ...it,
              Pnumproduct: stock as number,
              quantity: Math.min(it.quantity, stock as number) || 1,
            };
          })
        );
      } catch {
        // เงียบได้
      }
    };

    syncStockFromDB();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartItems.map((x) => x.Pid).join(',')]);

  // Update LocalStorage (cart only)
  const updateCartLS = (items: CartItem[]) => {
    setCartItems(items);
    if (!isBuyNow) localStorage.setItem('cart', JSON.stringify(items));
  };

  const increaseQty = (pid: number) => {
    const updated = cartItems.map((item) => {
      if (item.Pid !== pid) return item;
      const max = item.Pnumproduct ?? Infinity;
      return { ...item, quantity: Math.min(item.quantity + 1, max) };
    });
    updateCartLS(updated);
  };

  const decreaseQty = (pid: number) => {
    const updated = cartItems.map((item) =>
      item.Pid === pid ? { ...item, quantity: Math.max(1, item.quantity - 1) } : item
    );
    updateCartLS(updated);
  };

  const deleteItem = (pid: number) => {
    const updated = cartItems.filter((item) => item.Pid !== pid);
    updateCartLS(updated);
    if (updated.length === 0) router.push('/');
  };

  const handleOrder = async () => {
    if (!Cid || cartItems.length === 0) {
      alert('ไม่มีข้อมูลลูกค้าหรือสินค้า');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch(`${API}/orders`, {
        method: 'POST',
        body: JSON.stringify({
          Cid,
          payment,
          totalPrice: grandTotal,
          items: cartItems.map((item) => ({
            Pid: item.Pid,
            price: item.Pprice,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert('สั่งซื้อสำเร็จ!');
        localStorage.removeItem('cart');
        localStorage.removeItem('buynow');

        if (payment === 'cod') router.push('/me/orders');
        else router.push(`/payment/${data.orderId}`);
      } else {
        alert(data?.message || 'เกิดข้อผิดพลาด');
      }
    } catch (err) {
      console.error(err);
      alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setLoading(false);
    }
  };

  const hasItems = cartItems.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-emerald-50/40 text-slate-900">
      {/* subtle top highlight (premium, not loud) */}
      <div className="pointer-events-none fixed inset-x-0 top-0 h-56 bg-gradient-to-b from-emerald-100/50 to-transparent blur-3xl" />

      <div className="relative max-w-6xl mx-auto pt-28 md:pt-32 px-4 md:px-6 pb-20">
        {/* Header */}
        <div className="mb-10 md:mb-12">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-emerald-700 tracking-wide">CHECKOUT</p>
              <h1 className="mt-1 text-3xl md:text-5xl font-extrabold tracking-tight">
                ยืนยันคำสั่งซื้อ
              </h1>
              <p className="mt-2 text-slate-600">
                หน้านี้เน้นสรุปให้ชัด ๆ แล้วกดจบให้สวย ไม่ต้องโชว์เยอะให้รก
              </p>
            </div>

            <div className="hidden md:flex items-center gap-2">
              <div className="h-10 w-10 rounded-2xl border border-emerald-200 bg-white/70 shadow-sm" />
              <div className="h-10 w-10 rounded-2xl border border-slate-200 bg-white/60 shadow-sm" />
              <div className="h-10 w-10 rounded-2xl border border-slate-200 bg-white/60 shadow-sm" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping info (muted, not a main card) */}
            <section className="rounded-3xl border border-slate-200/70 bg-white/70 backdrop-blur-sm">
              <div className="px-6 pt-5 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-base font-extrabold tracking-tight text-slate-900">
                      ข้อมูลการจัดส่ง
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                      แสดงเพื่อยืนยันเท่านั้น (แก้ไขไม่ได้ที่หน้านี้)
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => router.push('/me')}
                    className="text-sm font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
                  >
                    ไปแก้ในโปรไฟล์ →
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <p className="text-xs font-semibold text-slate-500">ชื่อผู้รับ</p>
                    <p className="mt-1 font-bold text-slate-900">{user?.Cname || '-'}</p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <p className="text-xs font-semibold text-slate-500">เบอร์โทร</p>
                    <p className="mt-1 font-bold text-slate-900">{user?.Cphone || '-'}</p>
                  </div>

                  <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <p className="text-xs font-semibold text-slate-500">ที่อยู่</p>
                    <p className="mt-1 font-bold text-slate-900 leading-relaxed">
                      {user ? fullAddress : 'กำลังโหลดข้อมูลที่อยู่จากระบบ...'}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Payment (premium segmented) */}
            <section className="rounded-3xl border border-slate-200 bg-white/90 shadow-[0_10px_30px_-20px_rgba(2,6,23,0.35)] backdrop-blur">
              <div className="px-6 pt-6 pb-4 border-b border-slate-100">
                <h2 className="text-xl font-extrabold tracking-tight">วิธีชำระเงิน</h2>
                <p className="text-sm text-slate-500 mt-1">เลือกแบบเดียวพอ แล้วไปต่อให้จบ</p>
              </div>

              <div className="p-6">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-1 grid grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setPayment('transfer')}
                    className={[
                      'h-11 rounded-2xl font-extrabold transition-all',
                      payment === 'transfer'
                        ? 'bg-white shadow-sm border border-slate-200 text-slate-900'
                        : 'text-slate-600 hover:text-slate-900',
                    ].join(' ')}
                  >
                    โอนเงิน
                  </button>

                  <button
                    type="button"
                    onClick={() => setPayment('cod')}
                    className={[
                      'h-11 rounded-2xl font-extrabold transition-all',
                      payment === 'cod'
                        ? 'bg-white shadow-sm border border-slate-200 text-slate-900'
                        : 'text-slate-600 hover:text-slate-900',
                    ].join(' ')}
                  >
                    COD
                  </button>
                </div>

                <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-900">
                  {payment === 'transfer'
                    ? 'โอนเงินแล้วระบบจะพาไปหน้าชำระเงินเพื่ออัปโหลดสลิป'
                    : 'COD: ระบบจะพาไปหน้าคำสั่งซื้อ และชำระกับขนส่งตอนรับสินค้า'}
                </div>
              </div>
            </section>

            {/* Items */}
            <section className="rounded-3xl border border-slate-200 bg-white/90 shadow-[0_10px_30px_-20px_rgba(2,6,23,0.35)] backdrop-blur">
              <div className="px-6 pt-6 pb-4 border-b border-slate-100">
                <h2 className="text-xl font-extrabold tracking-tight">รายการสินค้า</h2>
                <p className="text-sm text-slate-500 mt-1">จัดให้ดูโล่ง แต่ข้อมูลครบ</p>
              </div>

              <div className="p-6 space-y-4">
                {cartItems.map((item) => {
                  const outOfStock = (item.Pnumproduct ?? 0) <= 0;
                  const lowStock = !outOfStock && (item.Pnumproduct ?? 0) <= 10;

                  return (
                    <div
                      key={item.Pid}
                      className="rounded-3xl border border-slate-200 bg-white hover:shadow-md transition-shadow"
                    >
                      <div className="p-4 md:p-5 flex flex-col md:flex-row gap-4">
                        <img
                          src={getImageUrl(item.Ppicture)}
                          className="w-full md:w-[120px] h-[170px] md:h-[120px] object-cover rounded-2xl border border-slate-100"
                          alt={item.Pname}
                          loading="lazy"
                        />

                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-lg font-extrabold text-slate-900 leading-snug">
                                {item.Pname}
                              </p>
                              <p className="text-sm text-slate-500 mt-1">
                                ราคา <span className="font-bold text-emerald-700">{fmtBaht(item.Pprice)} บาท</span>
                              </p>

                              <div className="mt-2">
                                <span
                                  className={[
                                    'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-extrabold border',
                                    outOfStock
                                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                                      : lowStock
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : 'bg-slate-50 text-slate-700 border-slate-200',
                                  ].join(' ')}
                                >
                                  {outOfStock ? 'หมดสต็อก' : `คงเหลือ ${item.Pnumproduct}`}
                                </span>
                              </div>
                            </div>

                            <div className="text-right">
                              <p className="text-xs text-slate-500">ยอดรวม</p>
                              <p className="text-xl font-extrabold text-emerald-700">
                                {fmtBaht(item.Pprice * item.quantity)} บาท
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
                            <div className="inline-flex items-center rounded-2xl border border-slate-200 bg-slate-50/70 p-1">
                              <button
                                onClick={() => decreaseQty(item.Pid)}
                                className="h-10 w-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors font-extrabold"
                              >
                                -
                              </button>

                              <input
                                type="number"
                                min={1}
                                max={Math.max(1, item.Pnumproduct ?? 1)}
                                value={item.quantity}
                                onChange={(e) => {
                                  let val = parseInt(e.target.value, 10);
                                  if (isNaN(val) || val < 1) val = 1;

                                  const max = item.Pnumproduct ?? val;
                                  val = Math.min(val, Math.max(1, max));

                                  const updated = cartItems.map((x) =>
                                    x.Pid === item.Pid ? { ...x, quantity: val } : x
                                  );
                                  updateCartLS(updated);
                                }}
                                className="h-10 w-20 mx-2 rounded-xl border border-slate-200 bg-white text-center font-extrabold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-200"
                              />

                              <button
                                onClick={() => increaseQty(item.Pid)}
                                disabled={outOfStock || item.quantity >= item.Pnumproduct}
                                className="h-10 w-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors font-extrabold disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                +
                              </button>
                            </div>

                            <div className="flex-1" />

                            <button
                              onClick={() => deleteItem(item.Pid)}
                              className="h-10 px-4 rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 font-extrabold hover:bg-rose-100 transition-colors"
                            >
                              ลบ
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {!hasItems && <p className="text-slate-500">ไม่มีสินค้าในรายการ</p>}
              </div>
            </section>
          </div>

          {/* RIGHT: Invoice-like summary (main hero) */}
          <aside className="lg:col-span-1">
            <div className="sticky top-28 space-y-6">
              <section className="rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_-40px_rgba(2,6,23,0.5)]">
                {/* premium header strip */}
                <div className="rounded-t-3xl px-6 pt-6 pb-5 bg-gradient-to-r from-emerald-700 to-green-700 text-white">
                  <p className="text-xs font-semibold tracking-widest opacity-90">ORDER SUMMARY</p>
                  <h2 className="mt-1 text-2xl font-extrabold tracking-tight">สรุปยอด</h2>
                  <p className="mt-1 text-sm opacity-90">พร้อมกดจ่าย/จบออเดอร์</p>
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>ยอดสินค้า</span>
                    <span className="font-extrabold text-slate-900">{fmtBaht(totalPrice)} บาท</span>
                  </div>

                  <div className="flex justify-between text-sm text-slate-600">
                    <span>ค่าจัดส่ง</span>
                    <span className="font-extrabold text-slate-900">
                      {shippingFee === 0 ? '0 บาท' : `${fmtBaht(shippingFee)} บาท`}
                    </span>
                  </div>

                  {shippingFee === 0 && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-900">
                      ได้สิทธิ์จัดส่งฟรี (ครบ 1,000 บาท)
                    </div>
                  )}

                  <div className="border-t border-slate-200 pt-4 flex items-end justify-between">
                    <div>
                      <p className="text-sm text-slate-600">รวมทั้งหมด</p>
                      <p className="text-3xl font-extrabold text-slate-900">{fmtBaht(grandTotal)} บาท</p>
                    </div>
                    <div className="h-10 w-10 rounded-2xl bg-emerald-50 border border-emerald-100" />
                  </div>

                  <button
                    onClick={handleOrder}
                    disabled={loading || !user || !hasItems}
                    className="w-full h-12 rounded-2xl bg-slate-900 text-white font-extrabold shadow-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'กำลังสั่งซื้อ...' : 'ยืนยันคำสั่งซื้อ'}
                  </button>

                  <div className="text-xs text-slate-500 leading-relaxed">
                    {payment === 'transfer'
                      ? 'หลังยืนยัน ระบบจะพาไปหน้าชำระเงินเพื่ออัปโหลดสลิป'
                      : 'หลังยืนยัน ระบบจะพาไปหน้าคำสั่งซื้อ (COD)'}
                  </div>
                </div>
              </section>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
