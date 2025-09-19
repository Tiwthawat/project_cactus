'use client';
import React from "react";

export default function FAQ() {
  return (
    <main className="flex pt-36  flex-col items-center justify-start min-h-screen bg-white px-6 py-10">
      <div className="w-full max-w-4xl text-black">
        <h1 className="text-3xl sm:text-4xl font-bold text-center mb-8">
          คำถามที่พบบ่อยเกี่ยวกับการซื้อขายแคคตัสออนไลน์
        </h1>
        <ul className="space-y-6">
          <li>
            <h2 className="text-xl font-semibold mb-1">
              1. วิธีการเลือกและซื้อแคคตัสที่มีคุณภาพอย่างไร?
            </h2>
            <p className="text-base text-gray-700">
              คำแนะนำเกี่ยวกับการเลือกและซื้อแคคตัสที่มีคุณภาพตามความต้องการของคุณ
            </p>
          </li>
          <li>
            <h2 className="text-xl font-semibold mb-1">
              2. วิธีการรักษาแคคตัสให้สมบูรณ์และให้ผลผลิตที่ดี?
            </h2>
            <p className="text-base text-gray-700">
              วิธีการดูแลแคคตัสเพื่อให้มีสุขภาพแข็งแรงและให้ผลผลิตที่ดี
            </p>
          </li>
          <li>
            <h2 className="text-xl font-semibold mb-1">
              3. มีวิธีการตรวจสอบความน่าเชื่อถือของผู้ขายแคคตัสออนไลน์อย่างไร?
            </h2>
            <p className="text-base text-gray-700">
              วิธีการตรวจสอบความน่าเชื่อถือและความเป็นธรรมของผู้ขายแคคตัสออนไลน์
            </p>
          </li>
          <li>
            <h2 className="text-xl font-semibold mb-1">
              4. วิธีการป้องกันการปลอมแปลงแคคตัสในการซื้อขายออนไลน์?
            </h2>
            <p className="text-base text-gray-700">
              วิธีการป้องกันแคคตัสปลอมในการทำธุรกรรมออนไลน์
            </p>
          </li>
          <li>
            <h2 className="text-xl font-semibold mb-1">
              5. มีกฎระเบียบหรือข้อจำกัดในการซื้อขายแคคตัสออนไลน์หรือไม่?
            </h2>
            <p className="text-base text-gray-700">
              ข้อจำกัดและกฎระเบียบที่เกี่ยวข้องกับการซื้อขายแคคตัสออนไลน์
            </p>
          </li>
        </ul>
      </div>
    </main>
  );
}
