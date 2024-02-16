// About/page.tsx
import React from "react";

export default function AboutPage() {
  return (
    <main className="flex flex-col h-screen items-center bg-white">
      <div className="mx-5 w-full p-3 h-full text-black text-3xl flex-col overflow-hidden">
        <div className="h-full overflow-y-scroll">
          <div className="text-center my-8">
            <h1 className="text-4xl font-bold">รีวิวเกี่ยวกับเรา</h1>
            <p className="mt-4">
              เรามุ่งมั่นที่จะให้บริการที่ดีที่สุดแก่ลูกค้าของเรา ดังนั้นเรามีการรับประกันสินค้าหลังจากการจัดส่งออกมาให้คุณ
            </p>
            <textarea className="mt-4 border rounded-lg w-full h-40 p-2" placeholder="เขียนรีวิวของคุณที่นี่..."></textarea>
            <div className="mt-4">
              <label htmlFor="rating" className="block text-lg">ให้คะแนน:</label>
              <input type="number" id="rating" name="rating" min="1" max="5" className="border rounded-lg px-3 py-2 mt-1" placeholder="ให้คะแนนระหว่าง 1 ถึง 5" />
            </div>
            <button className="bg-blue-500 text-white px-4 py-2 rounded-lg mt-4 hover:bg-blue-600">ส่งรีวิว</button>
          </div>
        </div>
      </div>
    </main>
  );
};
