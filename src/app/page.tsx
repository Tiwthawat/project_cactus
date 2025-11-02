'use client';

import React, { useEffect, useState } from 'react';
import CactusItems from './component/cactusitems';
import { useRouter } from 'next/navigation';
import Navigation from './component/Navigation';
import Navbar from './component/Navbar';
import AuctionItems from './component/AuctionItems';




const HomePage = () => {
  const [username, setUsername] = useState<string | null>(null);
  const router = useRouter();

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

  return (
    <>
      <Navbar />
      <Navigation />

      <main className="pt-36 flex flex-col min-h-screen bg-white text-black px-6 space-y-10">

        <section>
  <h2 className="text-2xl font-semibold mb-4">🔥 กำลังประมูล</h2>
  <AuctionItems />
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
      </main>
    </>
  );
};

export default HomePage;
