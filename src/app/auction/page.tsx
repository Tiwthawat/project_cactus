// Home.tsx
import React from "react";

export default function Home() {
  return (
    <main className="flex flex-col h-screen items-center bg-white">
      <div className="mx-5 w-full p-3 h-full text-black text-3xl flex-col overflow-hidden">
        <div className="h-full overflow-y-scroll">
          <div className="text-center my-8">
            <h1 className="text-4xl font-bold">วิธีการสมัครสมาชิก</h1>
            <p className="mt-4">
              สำหรับการสมัครสมาชิก กรุณาทำตามขั้นตอนดังนี้:
            </p>
            <ul className="list-disc mt-4 ml-8">
              <li>เข้าสู่ระบบเว็บไซต์ของเรา</li>
              <li>คลิกที่ปุ่ม "สมัครสมาชิก" ที่มุมบนขวาของหน้า</li>
              <li>กรอกข้อมูลส่วนตัวของคุณให้ครบถ้วน</li>
              <li>กดปุ่ม "ยืนยัน" เพื่อสมัครสมาชิก</li>
            </ul>
            <p className="mt-4">
              หากคุณมีคำถามเพิ่มเติมหรือต้องการความช่วยเหลือ โปรดติดต่อทีมงานของเรา
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};
