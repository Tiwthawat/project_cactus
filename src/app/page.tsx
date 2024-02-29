// page.tsx
'use client';
import React from "react";

import CactusItems from "./cactusitems";
import Navbar from "./component/Navbar";
import Navigation from "./component/Navigation";
import Footer from "./component/footer";

export default function Page() {
  return (
    
    <main className="flex flex-col h-screen items-center bg-white">
      
      <div className="w-full text-black text-3xl flex-col overflow-x-hidden">
        <h2 className=" pl-10 pt-2 pb-3 bg-lime-200">สินค้าที่ขายดี</h2>
        <CactusItems />
        <section className="w-full flex flex-wrap mx-auto ">
        <h2 className=" pl-10 pt-2 w-full   pb-3 bg-lime-200">แคคตัสสวยงาม</h2>
          <CactusItems />
        </section>
        <section className="w-full bg-black flex flex-wrap mx-auto text-center">
          {/* เพิ่มเนื้อหาในส่วนนี้ */}<Footer/>
        </section>
      </div>
    </main>
  );
}