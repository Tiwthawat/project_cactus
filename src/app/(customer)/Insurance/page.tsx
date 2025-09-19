// Insurance.tsx
'use client';
import React from "react";

export default function Insurance() {
  return (
    <main className="flex pt-36  flex-col items-center justify-center min-h-screen bg-white px-6 py-10">
      <div className="w-full max-w-3xl text-center">
        <h1 className="text-4xl font-bold text-black mb-6">การรับประกันสินค้า</h1>
        <p className="text-lg text-gray-800 mb-4 leading-relaxed">
          เรามุ่งมั่นที่จะให้บริการที่ดีที่สุดแก่ลูกค้าของเรา ดังนั้นเรามีการรับประกันสินค้าหลังจากการจัดส่งออกมาให้คุณ
        </p>
        <p className="text-lg text-gray-800 mb-4 leading-relaxed">
          หากพบว่าสินค้ามีปัญหาหรือเสียหายในระหว่างการจัดส่ง โปรดติดต่อเราทันทีภายใน 7 วันหลังจากได้รับสินค้า เพื่อให้เราสามารถแก้ไขปัญหาหรือจัดการกับสินค้าให้คุณได้ทันที
        </p>
        <p className="text-lg text-gray-800 leading-relaxed">
          ขอบคุณที่เลือกใช้บริการของเรา
        </p>
      </div>
    </main>
  );
}
