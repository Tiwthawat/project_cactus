'use client';
import React, { useState } from "react";

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      q: 'วิธีการเลือกและซื้อแคคตัสที่มีคุณภาพอย่างไร?',
      a: 'คำแนะนำเกี่ยวกับการเลือกและซื้อแคคตัสที่มีคุณภาพตามความต้องการของคุณ รวมถึงการตรวจสอบสุขภาพของต้น ลักษณะของรากและใบ'
    },
    {
      q: 'วิธีการรักษาแคคตัสให้สมบูรณ์และให้ผลผลิตที่ดี?',
      a: 'วิธีการดูแลแคคตัสเพื่อให้มีสุขภาพแข็งแรงและให้ผลผลิตที่ดี ต้องให้แสงแดดเพียงพอ รดน้ำอย่างเหมาะสม และใช้ดินที่ระบายน้ำได้ดี'
    },
    {
      q: 'มีวิธีการตรวจสอบความน่าเชื่อถือของผู้ขายแคคตัสออนไลน์อย่างไร?',
      a: 'วิธีการตรวจสอบความน่าเชื่อถือและความเป็นธรรมของผู้ขายแคคตัสออนไลน์ ดูจากรีวิว คะแนน และประวัติการขายของผู้ขาย'
    },
    {
      q: 'วิธีการป้องกันการปลอมแปลงแคคตัสในการซื้อขายออนไลน์?',
      a: 'วิธีการป้องกันแคคตัสปลอมในการทำธุรกรรมออนไลน์ ควรขอดูรูปถ่ายจริง ตรวจสอบรายละเอียดของสินค้า และซื้อจากผู้ขายที่เชื่อถือได้'
    },
    {
      q: 'มีกฎระเบียบหรือข้อจำกัดในการซื้อขายแคคตัสออนไลน์หรือไม่?',
      a: 'ข้อจำกัดและกฎระเบียบที่เกี่ยวข้องกับการซื้อขายแคคตัสออนไลน์ เช่น การขนส่งพืชข้ามจังหวัด และกฎหมายเกี่ยวกับพืชที่หายาก'
    }
  ];
  return (
    <div className="mt-16 bg-white rounded-3xl shadow-2xl p-8 md:p-12">
      <div className="text-center mb-12">
        <div className="inline-block bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-full text-sm font-semibold mb-4">
          ศูนย์ความช่วยเหลือ
        </div>
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">
          คำถามที่พบบ่อย
        </h1>
        <p className="text-gray-600 text-lg">เกี่ยวกับการซื้อขายแคคตัสออนไลน์</p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="border-2 border-gray-100 rounded-2xl overflow-hidden hover:border-emerald-300 transition-all duration-300"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full text-left p-6 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white hover:from-green-50 hover:to-emerald-50 transition-all duration-300"
            >

              <div className="flex items-center gap-4 flex-1">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
                  {index + 1}
                </div>
                <h3 className="text-lg font-semibold text-gray-800 pr-4">
                  {faq.q}
                </h3>
              </div>
              <div className={`transform transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''}`}>
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            {openIndex === index && (
              <div className="p-6 pt-0 bg-gradient-to-r from-green-50/30 to-emerald-50/30">
                <p className="text-gray-700 leading-relaxed pl-14">
                  {faq.a}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-10 bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-8 mb-8 border-2 border-emerald-200 text-center">
        <h4 className="font-bold text-green-800 mb-2">ยังมีคำถามอื่น ๆ อีกไหม?</h4>
        <p className="text-gray-700 mb-4">
          ติดต่อทีมสนับสนุนของเราได้ตลอด 24 ชั่วโมง
        </p>
        <button className="bg-green-700 text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-800 transition-all duration-300 border-2 border-white/30">
          ติดต่อเรา
        </button>
      </div>
    </div>
  );
}
