'use client';

import React, { useEffect, useState } from 'react';
import CactusItems from './component/cactusitems';
import Navbar from './component/Navbar';
import AuctionItems from './component/AuctionItems';
import BannerSlider from './component/BannerSlider';
import Link from 'next/link';

type SearchEvent = CustomEvent<string>;

type CategoryDetail = {
  typeid: number | null;
  subtypeid: number | null;
};

const SectionTitle = ({
  title,
  subtitle,
  badge,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
}) => (
  <div className="text-center my-14 md:my-16">
    {badge && (
      <div className="inline-block bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-full text-sm font-semibold shadow mb-4">
        {badge}
      </div>
    )}
    <h2 className="text-4xl md:text-5xl font-extrabold text-green-600 tracking-wide">
      {title}
    </h2>
    {subtitle && (
      <p className="mt-2 text-lg md:text-xl text-gray-700 tracking-widest">
        {subtitle}
      </p>
    )}
  </div>
);

const HomePage = () => {
  const [username, setUsername] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [selectedType, setSelectedType] = useState<number | null>(null);
  const [selectedSubtype, setSelectedSubtype] = useState<number | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);

  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    const handleCategory = (e: Event) => {
      const custom = e as CustomEvent<CategoryDetail>;
      setSelectedType(custom.detail.typeid);
      setSelectedSubtype(custom.detail.subtypeid);
      setKeyword('');
      setShowFavorites(false);
    };

    window.addEventListener('select-category', handleCategory);
    return () => window.removeEventListener('select-category', handleCategory);
  }, []);

  // โหลด user
  const loadUser = async () => {
    const t = localStorage.getItem('token');
    if (!t) return;

    try {
      const res = await fetch('http://localhost:3000/me', {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (!res.ok) return;
      const data: unknown = await res.json();

      const u = (data as any)?.user?.Cusername as string | undefined;
      if (u) setUsername(u);
    } catch (err) {
      console.error('โหลด user ผิดพลาด:', err);
    }
  };

  useEffect(() => {
    const handleShowFavorites = async () => {
      // reset ทุก state ก่อน
      setKeyword('');
      setSelectedType(null);
      setSelectedSubtype(null);
      setShowFavorites(false); // reset ก่อนเพื่อบังคับ re-render

      if (!token) {
        alert('กรุณาเข้าสู่ระบบก่อนดูรายการโปรด ❤️');
        return;
      }

      const res = await fetch('http://localhost:3000/favorites', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data: unknown = await res.json();
      if (Array.isArray(data)) {
        setFavoriteIds(
          data
            .map((item: any) => Number(item?.product_id))
            .filter((n) => Number.isFinite(n))
        );

        // ⭐ สำคัญ — ต้อง delay setShowFavorites
        setTimeout(() => setShowFavorites(true), 0);
      }
    };

    window.addEventListener('show-favorites', handleShowFavorites);
    return () => window.removeEventListener('show-favorites', handleShowFavorites);
  }, [token]);

  useEffect(() => {
    if (localStorage.getItem('token')) loadUser();
    window.addEventListener('login-success', loadUser);
    const onLogout = () => setUsername(null);
    window.addEventListener('logout-success', onLogout);

    return () => {
      window.removeEventListener('login-success', loadUser);
      window.removeEventListener('logout-success', onLogout);
    };
  }, []);

  // ฟัง event ค้นหา — ไม่มี any
  useEffect(() => {
    const handleSearch = (e: Event) => {
      const custom = e as SearchEvent;
      setKeyword(custom.detail || '');
      setShowFavorites(false);
      setSelectedType(null);
      setSelectedSubtype(null);
    };

    window.addEventListener('do-search', handleSearch);
    return () => window.removeEventListener('do-search', handleSearch);
  }, []);

  const isFiltered =
    showFavorites || !!keyword || selectedType !== null || selectedSubtype !== null;

    useEffect(() => {
  const handleGoHome = () => {
    setKeyword("");
    setSelectedType(null);
    setSelectedSubtype(null);
    setShowFavorites(false);
  };

  window.addEventListener("go-home", handleGoHome);
  return () => window.removeEventListener("go-home", handleGoHome);
}, []);


  return (
    <>
      <Navbar />

 

      <main className="pt-16 flex flex-col min-h-screen bg-white text-black px-6 space-y-10">
      {!isFiltered && <BannerSlider />}

      {showFavorites ? (
        <>
          <SectionTitle title="รายการโปรดของคุณ" subtitle="FAVORITES" badge="❤️ รายการโปรด" />
          <CactusItems filterFavorites={favoriteIds} />
        </>
        ) : keyword ? (
          <>
            <SectionTitle
              title={`ผลการค้นหา: ${keyword}`}
              subtitle="SEARCH RESULTS"
              badge="🔍 ค้นหา"
            />
            <CactusItems search={keyword} />
          </>
        ) : selectedType !== null || selectedSubtype !== null ? (
          <>
            <SectionTitle title="หมวดหมู่สินค้า" subtitle="PRODUCT CATEGORY" badge="📦 หมวดหมู่" />
            <CactusItems
              typeid={selectedType ?? undefined}
              subtypeid={selectedSubtype ?? undefined}
            />
          </>
        ) : (
          <>
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold">🔥 กำลังประมูล</h2>

                <Link href="/auctions" className="text-green-600 text-sm hover:underline">
                  ดูทั้งหมด →
                </Link>
              </div>

              <AuctionItems limit={4} />
            </section>

            <section>
              <SectionTitle title="สินค้ามาใหม่" subtitle="NEW ARRIVALS" />
              <CactusItems type="latest" />
            </section>

            <section>
              <SectionTitle title="แคคตัสหนามสั้น" subtitle="CACTUS SHORT SPINE" />
              <CactusItems typeid={1} />
            </section>

            <section>
              <SectionTitle title="แคคตัสหนามยาว" subtitle="CACTUS LONG SPINE" />
              <CactusItems typeid={2} />
            </section>

            <section>
              <SectionTitle title="ไม้อวบน้ำ" subtitle="SUCCULENT" />
              <CactusItems typeid={3} />
            </section>

            <section>
              <SectionTitle title="ของตกแต่งกระถาง" subtitle="POT DECOR" />
              <CactusItems typeid={4} />
            </section>

            <section>
              <SectionTitle title="สินค้าทั้งหมด" subtitle="ALL PRODUCTS" />
              <CactusItems />
            </section>
          </>
        )}
      </main>
    </>
  );
};

export default HomePage;
