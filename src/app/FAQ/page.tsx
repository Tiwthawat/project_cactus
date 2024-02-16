import React from "react";

export default function Home() {
  return (
    <main className="flex flex-col h-screen items-center bg-white">
      <div className="mx-5 w-full p-3 h-full text-black text-3xl flex-col overflow-hidden">
        <div className="h-full overflow-y-scroll">
          <div className="text-center my-8">
            <h1 className="text-4xl font-bold">คำถามที่พบบ่อยเกี่ยวกับการซื้อขายแคคตัสออนไลน์</h1>
            <ul className="mt-4 text-left">
              <li className="mb-4">
                <h2 className="text-2xl font-semibold">1. วิธีการเลือกและซื้อแคคตัสที่มีคุณภาพอย่างไร?</h2>
                <p>คำแนะนำเกี่ยวกับการเลือกและซื้อแคคตัสที่มีคุณภาพตามความต้องการของคุณ</p>
              </li>
              <li className="mb-4">
                <h2 className="text-2xl font-semibold">2. วิธีการรักษาแคคตัสให้สมบูรณ์และให้ผลผลิตที่ดี?</h2>
                <p>วิธีการดูแลแคคตัสเพื่อให้มีสุขภาพแข็งแรงและให้ผลผลิตที่ดี</p>
              </li>
              {/* เพิ่มข้อความเพิ่มเติมที่นี่ */}
              <li className="mb-4">
                <h2 className="text-2xl font-semibold">3. มีวิธีการตรวจสอบความน่าเชื่อถือของผู้ขายแคคตัสออนไลน์อย่างไร?</h2>
                <p>วิธีการตรวจสอบความน่าเชื่อถือและความเป็นธรรมของผู้ขายแคคตัสออนไลน์</p>
              </li>
              <li className="mb-4">
                <h2 className="text-2xl font-semibold">4. วิธีการป้องกันการปลอมแปลงแคคตัสในการซื้อขายออนไลน์?</h2>
                <p>วิธีการป้องกันแคคตัสปลอมในการทำธุรกรรมออนไลน์</p>
              </li>
              <li className="mb-4">
                <h2 className="text-2xl font-semibold">5. มีกฎระเบียบหรือข้อจำกัดในการซื้อขายแคคตัสออนไลน์หรือไม่?</h2>
                <p>ข้อจำกัดและกฎระเบียบที่เกี่ยวข้องกับการซื้อขายแคคตัสออนไลน์</p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
