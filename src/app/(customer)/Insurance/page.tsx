// Insurance.tsx
'use client';
import React from "react";
import { FaShieldAlt } from 'react-icons/fa';


export default function Insurance() {
  const benefits = [
    { icon: '✓', text: 'รับประกันสินค้าหลังการจัดส่ง' },
    { icon: '✓', text: 'แจ้งปัญหาได้ภายใน 7 วัน' },
    { icon: '✓', text: 'ทีมงานพร้อมแก้ไขปัญหา' },
    { icon: '✓', text: 'บริการลูกค้าอย่างเป็นมืออาชีพ' }
  ];
  return (
    <div className="mt-16 bg-white rounded-3xl shadow-2xl p-8 md:p-12">
      <div className="text-center mb-12">
        <div className="inline-block bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-full text-sm font-semibold mb-4">
          มั่นใจได้ทุกการสั่งซื้อ
        </div>
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">
          การรับประกันสินค้า
        </h1>
        <div className="w-24 h-1 bg-gradient-to-r from-green-500 to-emerald-500 mx-auto rounded-full"></div>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-8 mb-8 border-2 border-emerald-200">
          <div className="flex items-center justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white shadow-xl">
              <FaShieldAlt className="w-10 h-10" />
            </div>
          </div>
          <p className="text-gray-800 text-lg leading-relaxed text-center mb-6">
            เรามุ่งมั่นที่จะให้บริการที่ดีที่สุดแก่ลูกค้าของเรา ดังนั้นเรามีการรับประกันสินค้าหลังจากการจัดส่งออกมาให้คุณ
          </p>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                  {benefit.icon}
                </div>
                <span className="text-gray-700 font-medium">{benefit.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 border-2 border-orange-200 mb-6">
          <div className="flex items-start gap-4">
            <div className="text-3xl">⚠️</div>
            <div>
              <h4 className="font-bold text-orange-800 mb-2">เงื่อนไขการรับประกัน</h4>
              <p className="text-gray-700 leading-relaxed">
                หากพบว่าสินค้ามีปัญหาหรือเสียหายในระหว่างการจัดส่ง โปรดติดต่อเราทันทีภายใน <span className="font-bold text-orange-600">7 วัน</span> หลังจากได้รับสินค้า เพื่อให้เราสามารถแก้ไขปัญหาหรือจัดการกับสินค้าให้คุณได้ทันที
              </p>
            </div>
          </div>
        </div>

        <div className="text-center bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-8 text-white">
          <h3 className="text-2xl font-bold mb-3">ขอบคุณที่เลือกใช้บริการของเรา</h3>
          <p className="text-emerald-50 mb-6">
            เราพร้อมดูแลคุณในทุกขั้นตอนของการซื้อขาย
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button className="bg-white text-green-600 px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300">
              ติดต่อฝ่ายบริการลูกค้า
            </button>
            <button className="bg-green-700 text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-800 transition-all duration-300 border-2 border-white/30">
              ดูเงื่อนไขทั้งหมด
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
