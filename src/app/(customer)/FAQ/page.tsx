'use client';

import React, { useMemo, useState } from 'react';

type Category = 'all' | 'order' | 'cod' | 'auction' | 'status' | 'shipping' | 'cancel';

type FAQItem = {
  cat: Category;
  q: string;
  bullets: string[];
  highlight?: string; // 1 บรรทัดสั้น ๆ เอาไว้ทำตัวหนา/เตือน
};

function cx(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(' ');
}

const CAT_LABEL: Record<Category, string> = {
  all: 'ทั้งหมด',
  order: 'สั่งซื้อปกติ',
  cod: 'COD',
  auction: 'ประมูล',
  status: 'สถานะ',
  shipping: 'จัดส่ง',
  cancel: 'ยกเลิก',
};

export default function FAQ() {
  const [activeCat, setActiveCat] = useState<Category>('all');
  const [q, setQ] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FAQItem[] = useMemo(
    () => [
      // ----- ORDER (transfer) -----
      {
        cat: 'order',
        q: 'ซื้อปกติแบบโอนเงิน ทำยังไง?',
        highlight: 'ปุ่ม “แจ้งชำระเงิน” จะขึ้นเฉพาะตอน “รอชำระเงิน”',
        bullets: [
          'เลือกสินค้า → ใส่ตะกร้า → ยืนยันคำสั่งซื้อ',
          'ไปหน้า “คำสั่งซื้อ” → กด “แจ้งชำระเงิน” → อัปโหลดสลิป/ข้อมูลโอน',
          'หลังแจ้งชำระ: สถานะเป็น “รอตรวจสอบ”',
          'ตรวจผ่านแล้ว: ไป “รอจัดส่ง” → “รอรับสินค้า” → “ได้รับแล้ว”',
        ],
      },

      // ----- COD -----
      {
        cat: 'cod',
        q: 'ซื้อแบบ COD ต้องแจ้งสลิปไหม?',
        highlight: 'ไม่ต้องแจ้งสลิป (จ่ายตอนรับสินค้า)',
        bullets: [
          'เลือก COD ตอน Checkout',
          'สถานะจะไปทาง “รอจัดส่ง” (ไม่ใช่ “รอชำระเงิน”)',
          'เตรียมเงินให้ครบตามยอดในออเดอร์ตอนรับสินค้า',
          'เช็กสถานะได้ที่หน้า “คำสั่งซื้อ”',
        ],
      },

      // ----- AUCTION -----
      {
        cat: 'auction',
        q: 'ประมูลทำงานยังไง แบบสั้น ๆ?',
        bullets: [
          'เข้าหน้าประมูล → เสนอราคา → รอเวลาปิด',
          'ถ้าคุณเป็นราคาสูงสุด: ระบบขึ้น “ผู้ชนะประมูล”',
          'ไปหน้า “ผู้ชนะประมูล” เพื่อชำระเงิน/อัปโหลดสลิป',
          'ชำระผ่านแล้วถึงจะเข้าส่ง',
        ],
      },
      {
        cat: 'auction',
        q: 'ผู้ชนะประมูลต้องชำระภายในกี่วัน?',
        highlight: 'ต้องชำระภายใน 24 ชั่วโมง (1 วัน)',
        bullets: [
          'เมื่อชนะ ระบบจะให้ทำรายการชำระเงิน',
          'ต้องชำระ/แจ้งชำระภายใน 24 ชม. ตามเงื่อนไขระบบ',
          'หากพ้นกำหนด: ระบบอาจยกเลิกสิทธิ์ (ถือว่าสละสิทธิ์)',
        ],
      },

      // ----- STATUS -----
      {
        cat: 'status',
        q: 'ทำไมปุ่ม “แจ้งชำระเงิน” ไม่ขึ้น?',
        bullets: [
          'ซื้อแบบโอน: ปุ่มขึ้นเฉพาะ “รอชำระเงิน”',
          'COD: ไม่มีปุ่มแจ้งชำระ (จ่ายปลายทาง)',
          'ประมูล: ชำระที่หน้า “ผู้ชนะประมูล”',
        ],
      },
      {
        cat: 'status',
        q: '“รอตรวจสอบ” คืออะไร?',
        bullets: [
          'แอดมินกำลังตรวจสลิป/ยอดโอน',
          'ผ่านแล้วจะไป “รอจัดส่ง/จัดส่ง”',
          'ถ้ามีปัญหา อาจต้องแจ้งชำระใหม่ (ตามที่ระบบ/แอดมินแจ้ง)',
        ],
      },

      // ----- SHIPPING -----
      {
        cat: 'shipping',
        q: 'ติดตามจัดส่ง/เลขพัสดุดูตรงไหน?',
        bullets: [
          'ซื้อปกติ: ดูในหน้า “คำสั่งซื้อ”',
          'ประมูล: ดูในหน้า “ผู้ชนะประมูล”',
          'ถ้ามีเลขพัสดุ/บริษัทขนส่ง ระบบจะแสดงในรายละเอียด',
        ],
      },
      {
        cat: 'shipping',
        q: '“รอจัดส่ง” กับ “รอรับสินค้า” ต่างกันยังไง?',
        bullets: [
          'รอจัดส่ง = กำลังแพ็ก/เตรียมส่ง',
          'รอรับสินค้า = ส่งออกแล้ว กำลังอยู่ระหว่างขนส่ง',
          'ได้รับแล้ว = งานปิดเรียบร้อย',
        ],
      },

      // ----- CANCEL -----
      {
        cat: 'cancel',
        q: 'ยกเลิกคำสั่งซื้อได้ตอนไหน?',
        highlight: 'ส่วนใหญ่ยกเลิกได้ก่อนเข้าขั้นตอนจัดส่ง',
        bullets: [
          'ซื้อแบบโอน: มักยกเลิกได้ตอน “รอชำระเงิน”',
          'COD: ถ้าส่งแล้วอาจยกเลิกไม่ได้ (กันพัสดุตีกลับ/สต๊อกมั่ว)',
          'ประมูล: ชนะแล้วต้องทำตามเงื่อนไขชำระภายใน 24 ชม.',
        ],
      },
    ],
    []
  );

  const categories: Category[] = ['all', 'order', 'cod', 'auction', 'status', 'shipping', 'cancel'];

  const filtered = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    return faqs.filter((item) => {
      const inCat = activeCat === 'all' || item.cat === activeCat;
      if (!inCat) return false;
      if (!keyword) return true;

      const hay = [
        item.q,
        item.highlight ?? '',
        ...item.bullets,
        CAT_LABEL[item.cat],
      ]
        .join(' ')
        .toLowerCase();

      return hay.includes(keyword);
    });
  }, [faqs, activeCat, q]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/60 via-gray-50 to-gray-50 text-black">
      <div className="max-w-5xl mx-auto pt-28 p-6">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur border border-emerald-100 rounded-3xl shadow-sm p-6 md:p-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold tracking-wide text-emerald-800">Help Center</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-3">
            คำถามที่พบบ่อย
          </h1>
          <p className="text-gray-500 mt-2">
            โฟกัสเรื่อง “ซื้อปกติ / COD / ประมูล (24 ชม.) / สถานะ / จัดส่ง / ยกเลิก” แบบอ่านจบไว
          </p>

          {/* Search */}
          <div className="mt-5">
            <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setOpenIndex(0);
                }}
                placeholder="ค้นหา เช่น 24 ชั่วโมง, สลิป, COD, ยกเลิก..."
                className="w-full outline-none text-sm text-gray-900 placeholder:text-gray-400"
              />
              {q && (
                <button
                  type="button"
                  onClick={() => {
                    setQ('');
                    setOpenIndex(0);
                  }}
                  className="text-xs font-semibold px-3 py-1 rounded-full border border-gray-200 bg-gray-50 hover:bg-gray-100"
                >
                  ล้าง
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' as any }}>
            <style>{`div::-webkit-scrollbar{display:none;}`}</style>
            {categories.map((c) => {
              const active = activeCat === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setActiveCat(c);
                    setOpenIndex(0);
                  }}
                  className={cx(
                    'shrink-0 h-10 px-4 rounded-2xl border text-sm font-semibold transition',
                    active
                      ? 'border-emerald-500 bg-emerald-600 text-white shadow-sm'
                      : 'border-gray-200 bg-white text-gray-800 hover:bg-emerald-50 hover:border-emerald-200'
                  )}
                >
                  {CAT_LABEL[c]}
                </button>
              );
            })}
          </div>
        </div>

        {/* FAQ List */}
        <div className="mt-6 space-y-3">
          {filtered.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-8 text-center">
              <p className="text-gray-900 font-extrabold text-lg">ไม่พบคำถามที่ตรงกับคำค้นหา</p>
              <p className="text-gray-500 mt-2 text-sm">ลองเปลี่ยนคำค้น หรือเปลี่ยนหมวดด้านบน</p>
            </div>
          ) : (
            filtered.map((item, idx) => {
              const open = openIndex === idx;
              return (
                <div
                  key={`${item.cat}-${idx}`}
                  className={cx(
                    'bg-white border rounded-3xl shadow-sm overflow-hidden transition',
                    open ? 'border-emerald-200' : 'border-gray-200 hover:border-emerald-200'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(open ? null : idx)}
                    className="w-full text-left px-5 py-5 md:px-6 md:py-6 flex items-start justify-between gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-3 py-1 rounded-full border border-gray-200 bg-gray-50 text-gray-700">
                          {CAT_LABEL[item.cat]}
                        </span>
                        {item.highlight && (
                          <span className="text-xs font-semibold px-3 py-1 rounded-full border border-emerald-100 bg-emerald-50 text-emerald-800">
                            สำคัญ
                          </span>
                        )}
                      </div>

                      <h3 className="text-base md:text-lg font-extrabold text-gray-900 mt-2">
                        {item.q}
                      </h3>
                    </div>

                    <div
                      className={cx(
                        'w-10 h-10 rounded-2xl border flex items-center justify-center transition',
                        open
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-gray-200 bg-white text-gray-500'
                      )}
                      aria-hidden="true"
                    >
                      <svg
                        className={cx('w-5 h-5 transition-transform duration-300', open && 'rotate-180')}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {open && (
                    <div className="px-5 pb-5 md:px-6 md:pb-6">
                      <div className="rounded-2xl border border-gray-200 bg-gray-50/70 px-4 py-4 md:px-5 md:py-5 space-y-3">
                        {item.highlight && (
                          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                            <p className="text-sm font-semibold text-red-800">{item.highlight}</p>
                          </div>
                        )}

                        <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                          {item.bullets.map((b, i) => (
                            <li key={i}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Contact */}
        <div className="mt-6 bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-emerald-500/70 via-emerald-400/30 to-transparent" />
          <div className="p-6 md:p-8 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h4 className="text-lg font-extrabold text-gray-900">ยังไม่หายงง?</h4>
              <p className="text-gray-600 mt-2 text-sm">
                ติดต่อทีมงานได้จากช่องทางที่ตะเองมีในระบบ (ปุ่มนี้ไว้ค่อยผูกกับฟอร์มหรือแชททีหลัง)
              </p>
              <p className="text-xs text-gray-500 mt-3">
                * ประมูล: ผู้ชนะต้องชำระภายใน 24 ชั่วโมง
              </p>
            </div>

            <button
              type="button"
              className="h-11 px-6 rounded-2xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition shadow-sm"
              onClick={() => alert('TODO: ผูกปุ่มนี้กับฟอร์ม/แชท/Line OA ในระบบ')}
            >
              ติดต่อเรา
            </button>
          </div>
        </div>

        <div className="h-10" />
      </div>
    </div>
  );
}
