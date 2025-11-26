'use client';

import React, { useEffect, useState } from 'react';
import CactusItems from './component/cactusitems';
import Navbar from './component/Navbar';
import AuctionItems from './component/AuctionItems';
import BannerSlider from './component/BannerSlider';
import Link from 'next/link';

type SearchEvent = CustomEvent<string>;

const HomePage = () => {
  const [username, setUsername] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const [selectedType, setSelectedType] = useState<number | null>(null);
const [selectedSubtype, setSelectedSubtype] = useState<number | null>(null);

useEffect(() => {
  const handleCategory = (e: Event) => {
    const custom = e as CustomEvent<{ typeid: number | null; subtypeid: number | null }>;
    setSelectedType(custom.detail.typeid);
    setSelectedSubtype(custom.detail.subtypeid);
    setKeyword("");
  };

  window.addEventListener("select-category", handleCategory);
  return () => window.removeEventListener("select-category", handleCategory);
}, []);



  // โหลด user
  const loadUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch('http://localhost:3000/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.user?.Cusername) {
        setUsername(data.user.Cusername);
      }
    } catch (err) {
      console.error('โหลด user ผิดพลาด:', err);
    }
  };

  useEffect(() => {
    if (localStorage.getItem('token')) loadUser();
    window.addEventListener('login-success', loadUser);
    window.addEventListener('logout-success', () => setUsername(null));

    return () => {
      window.removeEventListener('login-success', loadUser);
      window.removeEventListener('logout-success', () => setUsername(null));
    };
  }, []);

  // ฟัง event ค้นหา — ไม่มี any
  useEffect(() => {
    const handleSearch = (e: Event) => {
      const custom = e as SearchEvent;
      setKeyword(custom.detail || "");
    };

    window.addEventListener("do-search", handleSearch);
    return () => window.removeEventListener("do-search", handleSearch);
  }, []);

  return (
    <>
      <Navbar />

      <div className="!pt-16">
        <BannerSlider />
      </div>

      <main className="mt-16 flex flex-col min-h-screen bg-white text-black px-6 space-y-10">

  {/* 1) ถ้าค้นหา */}
  {keyword ? (
    <>
      <h2 className="text-2xl font-semibold mb-4">🔍 ผลการค้นหา: {keyword}</h2>
      <CactusItems search={keyword} />
    </>
  ) : /* 2) ถ้าเลือกหมวดหมู่ */ selectedType !== null || selectedSubtype !== null ? (
    <>
      <h2 className="text-2xl font-semibold mb-4">📂 หมวดหมู่สินค้า</h2>
      <CactusItems
        typeid={selectedType ?? undefined}
        subtypeid={selectedSubtype ?? undefined}
      />
    </>
  ) : (
    /* 3) หน้า default (หน้าแรกปกติ) */
    <>
      <section>
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-2xl font-semibold">🔥 กำลังประมูล</h2>

    <Link
      href="/auctions"
      className="text-green-600 text-sm hover:underline"
    >
      ดูทั้งหมด →
    </Link>
  </div>

  <AuctionItems limit={4} />
</section>


      <section>
        <h2 className="text-2xl font-semibold mb-4">🆕 สินค้ามาใหม่</h2>
        <CactusItems type="latest" />
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">🌵 แคคตัสหนามสั้น</h2>
        <CactusItems typeid={1} />
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">🌵 แคคตัสหนามยาว</h2>
        <CactusItems typeid={2} />
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">🪴 ไม้อวบน้ำ</h2>
        <CactusItems typeid={3} />
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">🪵 ของตกแต่งกระถาง</h2>
        <CactusItems typeid={4} />
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">📦 สินค้าทั้งหมด</h2>
        <CactusItems />
      </section>
    </>
  )}

</main>

    </>
  );
};

export default HomePage;
