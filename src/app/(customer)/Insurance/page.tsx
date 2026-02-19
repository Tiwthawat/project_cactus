// Insurance.tsx
'use client';

import React from 'react';
import { FaShieldAlt } from 'react-icons/fa';

export default function Insurance() {
  const benefits = [
    { title: 'รับประกันหลังการจัดส่ง', desc: 'ดูแลกรณีสินค้าชำรุด/เสียหายจากการขนส่งตามเงื่อนไข' },
    { title: 'แจ้งปัญหาภายใน 7 วัน', desc: 'นับจากวันที่ได้รับสินค้า เพื่อให้ตรวจสอบและดำเนินการได้รวดเร็ว' },
    { title: 'ทีมงานช่วยประสานงาน', desc: 'ตรวจสอบหลักฐานและช่วยแก้ปัญหาตามขั้นตอนอย่างเป็นระบบ' },
    { title: 'บริการลูกค้ามืออาชีพ', desc: 'สื่อสารชัดเจน ติดตามเคสให้จนจบ' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/60 via-gray-50 to-gray-50 text-black">
      <div className="max-w-5xl mx-auto pt-28 p-6">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur border border-emerald-100 rounded-3xl shadow-sm p-6 md:p-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold tracking-wide text-emerald-800">
              Purchase Protection
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-3">การรับประกันสินค้า</h1>
          <p className="text-gray-500 mt-2 leading-relaxed">
            เราดูแลประสบการณ์หลังการสั่งซื้อ เพื่อให้คุณมั่นใจตั้งแต่ชำระเงินจนถึงได้รับสินค้า
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: main card */}
          <div className="lg:col-span-3">
            <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
              <div className="p-6 md:p-8 border-b border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shadow-sm">
                    <FaShieldAlt className="w-7 h-7" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg md:text-xl font-extrabold text-gray-900">
                      มั่นใจได้ทุกการสั่งซื้อ
                    </h2>
                    <p className="text-gray-600 mt-1 leading-relaxed">
                      หากสินค้ามีปัญหาจากการขนส่งหรือความผิดปกติที่เข้าข่ายการรับประกัน
                      สามารถแจ้งทีมงานเพื่อให้ตรวจสอบและแก้ไขตามเงื่อนไขได้
                    </p>
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div className="p-6 md:p-8">
                <div className="grid md:grid-cols-2 gap-4">
                  {benefits.map((b, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-gray-200 bg-white p-5 hover:border-emerald-200 hover:shadow-sm transition"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        </div>
                        <div className="flex-1">
                          <p className="font-extrabold text-gray-900">{b.title}</p>
                          <p className="text-sm text-gray-600 mt-1 leading-relaxed">{b.desc}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-3xl border border-emerald-100 bg-emerald-50/60 p-5">
                  <p className="text-sm font-semibold text-emerald-900">สรุปสั้น ๆ</p>
                  <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-emerald-900/80">
                    <li>แจ้งปัญหาภายใน 7 วันหลังได้รับสินค้า</li>
                    <li>แนบหลักฐานเพื่อให้ตรวจสอบได้เร็ว (รูป/วิดีโอ/สภาพกล่อง)</li>
                    <li>ทีมงานติดตามเคสจนปิดงาน</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Right: policy + actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Policy */}
            <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-emerald-500/70 via-emerald-400/30 to-transparent" />
              <div className="p-6">
                <h3 className="text-base font-extrabold text-gray-900">เงื่อนไขการรับประกัน</h3>
                <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                  หากพบความเสียหายหรือความผิดปกติที่เกี่ยวข้องกับการจัดส่ง โปรดแจ้งภายใน{' '}
                  <span className="font-extrabold text-emerald-700">7 วัน</span> นับจากวันที่ได้รับสินค้า
                  เพื่อให้ทีมงานตรวจสอบและดำเนินการได้ทันที
                </p>

                <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <p className="text-xs font-semibold text-gray-700">สิ่งที่ควรแนบตอนแจ้งปัญหา</p>
                  <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-gray-600">
                    <li>รูปสินค้า/ตำหนิ/จุดเสียหายแบบชัด ๆ</li>
                    <li>รูปกล่องพัสดุ และฉลาก/เลขพัสดุ (ถ้ามี)</li>
                    <li>วิดีโอแกะกล่อง (ถ้ามี) ช่วยให้เคสเดินเร็วมาก</li>
                  </ul>
                </div>

                <p className="text-xs text-gray-500 mt-4">
                  หมายเหตุ: การรับประกันเป็นไปตามเงื่อนไขของร้านและระบบ เพื่อความเป็นธรรมทั้งผู้ซื้อและผู้ขาย
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-6">
              <h3 className="text-base font-extrabold text-gray-900">ต้องการความช่วยเหลือ?</h3>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                หากคุณต้องการแจ้งปัญหาเกี่ยวกับสินค้า หรือสอบถามขั้นตอนเพิ่มเติม สามารถติดต่อทีมงานได้
              </p>

              <div className="mt-4 grid grid-cols-1 gap-3">
                <button
                  type="button"
                  className="h-11 rounded-2xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition shadow-sm"
                  onClick={() => alert('TODO: ผูกปุ่มนี้กับช่องทางติดต่อ/ฟอร์มแจ้งปัญหา')}
                >
                  ติดต่อฝ่ายบริการลูกค้า
                </button>

                <button
                  type="button"
                  className="h-11 rounded-2xl border border-gray-300 bg-white text-gray-900 font-semibold hover:bg-gray-50 transition"
                  onClick={() => alert('TODO: เปิดหน้า/โมดอล “เงื่อนไขทั้งหมด”')}
                >
                  ดูเงื่อนไขทั้งหมด
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="h-10" />
      </div>
    </div>
  );
}
