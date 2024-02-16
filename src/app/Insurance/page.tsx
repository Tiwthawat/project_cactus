// Home.tsx
import React from "react";

export default function Home() {
  return (
    <main className="flex flex-col h-screen items-center bg-white">
      <div className="mx-5 w-full p-3 h-full text-black text-3xl flex-col overflow-hidden">
        <div className="h-full overflow-y-scroll">
          <div className="text-center my-8">
            <h1 className="text-4xl font-bold">การรับประกันสินค้า</h1>
            <p className="mt-4">
              เรามุ่งมั่นที่จะให้บริการที่ดีที่สุดแก่ลูกค้าของเรา ดังนั้นเรามีการรับประกันสินค้าหลังจากการจัดส่งออกมาให้คุณ
            </p>
            <p className="mt-4">
              หากพบว่าสินค้ามีปัญหาหรือเสียหายในระหว่างการจัดส่ง โปรดติดต่อเราทันทีภายใน 7 วันหลังจากได้รับสินค้า เพื่อให้เราสามารถแก้ไขปัญหาหรือจัดการกับสินค้าให้คุณได้ทันที
            </p>
            <p className="mt-4">
              ขอบคุณที่เลือกใช้บริการของเรา
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};
