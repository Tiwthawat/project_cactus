'use client';

import React, { useEffect, useMemo, useState } from 'react';
import CactusItems from './component/cactusitems';
import Navbar from './component/Navbar';
import AuctionItems from './component/AuctionItems';
import BannerSlider from './component/BannerSlider';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

type SearchEvent = CustomEvent<string>;

type CategoryDetail = {
  typeid: number | null;
  subtypeid: number | null;
};

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(' ');
}

function toNumOrNull(v: string | null): number | null {
  if (v === null || v.trim() === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/* ---------------------------
  Premium Section Header
----------------------------*/
function SectionHeader({
  title,
  subtitle,
  badge,
  right,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4 mb-4">
      <div className="min-w-0">
        {badge ? (
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold border border-emerald-100 bg-emerald-50 text-emerald-700">
              {badge}
            </span>
          </div>
        ) : null}

        <div className="flex items-center gap-3">
          <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 truncate">
            {title}
          </h2>
          <span className="hidden md:block h-1 w-10 rounded-full bg-gradient-to-r from-emerald-500 to-green-500" />
        </div>

        {subtitle ? (
          <p className="mt-1 text-sm md:text-base text-gray-600">
            {subtitle}
          </p>
        ) : null}
      </div>

      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

/* ---------------------------
  Premium Card Wrapper
----------------------------*/
function SectionCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'bg-white rounded-3xl border border-gray-200 shadow-sm',
        'px-4 sm:px-6 py-5 sm:py-6',
        className
      )}
    >
      {children}
    </section>
  );
}

/* ---------------------------
  Home Page
----------------------------*/
const HomePage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [username, setUsername] = useState<string | null>(null);

  const [keyword, setKeyword] = useState('');
  const [selectedType, setSelectedType] = useState<number | null>(null);
  const [selectedSubtype, setSelectedSubtype] = useState<number | null>(null);

  const [showFavorites, setShowFavorites] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);

  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  /* -----------------------------------------
    ✅ 1) Sync filter from URL (?typeid=&subtypeid=)
    - ทำให้กดจากหน้าอื่นแล้วกลับมาฟิลเตอร์ได้
  ------------------------------------------*/
  useEffect(() => {
    const t = toNumOrNull(searchParams.get('typeid'));
    const st = toNumOrNull(searchParams.get('subtypeid'));

    // ถ้ามี query หมวด -> เปิดโหมด category filter
    if (t !== null || st !== null) {
      setSelectedType(t);
      setSelectedSubtype(st);
      setKeyword('');
      setShowFavorites(false);
      return;
    }

    // ถ้าไม่มี query หมวด -> ไม่บังคับ reset ทุกอย่าง
    // (ปล่อยให้ event search/favorites คุมเอง)
    // แต่ถ้าตะเองอยากให้กลับหน้า home แล้ว reset เสมอ ค่อยเปิดบล็อกนี้
    // setSelectedType(null);
    // setSelectedSubtype(null);
  }, [searchParams]);

  /* -----------------------------------------
    2) เลือกหมวดหมู่จาก Navbar/Sidebar (event เดิม)
    - ทำให้ Navbar ที่ยัง dispatch event อยู่ ใช้ได้เหมือนเดิม
    - และอัปเดต URL ด้วย (ให้เป็นระบบเดียวกัน)
  ------------------------------------------*/
  useEffect(() => {
    const handleCategory = (e: Event) => {
      const custom = e as CustomEvent<CategoryDetail>;
      const typeid = custom.detail.typeid;
      const subtypeid = custom.detail.subtypeid;

      // set state
      setSelectedType(typeid);
      setSelectedSubtype(subtypeid);
      setKeyword('');
      setShowFavorites(false);

      // ✅ update URL ให้ shareable + ทำให้มาจากหน้าไหนก็เหมือนกัน
      const qs = new URLSearchParams();
      if (typeid !== null) qs.set('typeid', String(typeid));
      if (subtypeid !== null) qs.set('subtypeid', String(subtypeid));
      router.push(qs.toString() ? `/?${qs.toString()}` : '/');
    };

    window.addEventListener('select-category', handleCategory);
    return () => window.removeEventListener('select-category', handleCategory);
  }, [router]);

  // โหลด user
  const loadUser = async () => {
    const t = localStorage.getItem('token');
    if (!t) return;

    try {
      const res = await fetch(`${API}/me`, {
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
    if (localStorage.getItem('token')) loadUser();
    window.addEventListener('login-success', loadUser);
    const onLogout = () => setUsername(null);
    window.addEventListener('logout-success', onLogout);

    return () => {
      window.removeEventListener('login-success', loadUser);
      window.removeEventListener('logout-success', onLogout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ฟัง event ค้นหา (ยังใช้แบบเดิม)
  useEffect(() => {
    const handleSearch = (e: Event) => {
      const custom = e as SearchEvent;
      setKeyword(custom.detail || '');
      setShowFavorites(false);
      setSelectedType(null);
      setSelectedSubtype(null);

      // ล้าง query หมวดออกจาก URL (กันสับสน)
      router.replace('/');
    };

    window.addEventListener('do-search', handleSearch);
    return () => window.removeEventListener('do-search', handleSearch);
  }, [router]);

  // ไปหน้า Home (reset filter)
  useEffect(() => {
    const handleGoHome = () => {
      setKeyword('');
      setSelectedType(null);
      setSelectedSubtype(null);
      setShowFavorites(false);

      router.push('/');
    };

    window.addEventListener('go-home', handleGoHome);
    return () => window.removeEventListener('go-home', handleGoHome);
  }, [router]);

  // โชว์รายการโปรด
  useEffect(() => {
    const handleShowFavorites = async () => {
      setKeyword('');
      setSelectedType(null);
      setSelectedSubtype(null);
      setShowFavorites(false);

      // ล้าง query หมวดออกจาก URL
      router.replace('/');

      if (!token) {
        alert('กรุณาเข้าสู่ระบบก่อนดูรายการโปรด');
        return;
      }

      const res = await fetch(`${API}/favorites`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data: unknown = await res.json();
      if (Array.isArray(data)) {
        setFavoriteIds(
          data
            .map((item: any) => Number(item?.product_id))
            .filter((n) => Number.isFinite(n))
        );

        setTimeout(() => setShowFavorites(true), 0);
      }
    };

    window.addEventListener('show-favorites', handleShowFavorites);
    return () =>
      window.removeEventListener('show-favorites', handleShowFavorites);
  }, [token, router]);

  const isFiltered =
    showFavorites ||
    !!keyword ||
    selectedType !== null ||
    selectedSubtype !== null;

  const topTitle = useMemo(() => {
    if (showFavorites)
      return { title: 'รายการโปรดของคุณ', subtitle: 'FAVORITES', badge: 'รายการโปรด' };
    if (keyword)
      return { title: `ผลการค้นหา: ${keyword}`, subtitle: 'SEARCH', badge: 'ค้นหา' };
    if (selectedType !== null || selectedSubtype !== null)
      return { title: 'หมวดหมู่สินค้า', subtitle: 'CATEGORY', badge: 'หมวดหมู่' };
    return null;
  }, [showFavorites, keyword, selectedType, selectedSubtype]);

  return (
    <>
      <Navbar />

      <main className="pt-16 min-h-screen bg-gradient-to-b from-emerald-50/60 via-white to-white text-black">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {!isFiltered && (
            <div className="rounded-3xl overflow-hidden border border-emerald-100 bg-white shadow-sm">
              <BannerSlider />
            </div>
          )}

          {showFavorites ? (
            <SectionCard>
              <SectionHeader
                title="รายการโปรดของคุณ"
                subtitle="รายการที่คุณกดหัวใจไว้"
                badge="Favorites"
              />
              <CactusItems filterFavorites={favoriteIds} />
            </SectionCard>
          ) : keyword ? (
            <SectionCard>
              <SectionHeader
                title={`ผลการค้นหา: ${keyword}`}
                subtitle="ค้นหาสินค้าที่เกี่ยวข้อง"
                badge="Search"
                right={
                  <button
                    type="button"
                    onClick={() => {
                      setKeyword('');
                    }}
                    className="px-4 py-2 rounded-full text-sm font-semibold border border-gray-200 bg-white hover:bg-gray-50 transition"
                  >
                    ล้างการค้นหา
                  </button>
                }
              />
              <CactusItems search={keyword} />
            </SectionCard>
          ) : selectedType !== null || selectedSubtype !== null ? (
            <SectionCard>
              <SectionHeader
                title="หมวดหมู่สินค้า"
                subtitle="เลือกดูเฉพาะหมวดที่ต้องการ"
                badge="Category"
                right={
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedType(null);
                      setSelectedSubtype(null);
                      router.push('/'); // ✅ ล้าง query ด้วย
                    }}
                    className="px-4 py-2 rounded-full text-sm font-semibold border border-gray-200 bg-white hover:bg-gray-50 transition"
                  >
                    ล้างตัวกรอง
                  </button>
                }
              />
              <CactusItems
                typeid={selectedType ?? undefined}
                subtypeid={selectedSubtype ?? undefined}
              />
            </SectionCard>
          ) : (
            <>
              <SectionCard className="border-emerald-100">
                <SectionHeader
                  title="กำลังประมูล"
                  subtitle="รายการที่กำลังเปิดให้เสนอราคา"
                  badge="Auction"
                  right={
                    <Link
                      href="/auctions"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-600 text-white text-sm font-semibold shadow-sm hover:bg-emerald-700 transition"
                    >
                      ดูทั้งหมด
                      <span className="opacity-90">→</span>
                    </Link>
                  }
                />

                <AuctionItems limit={4} />

                <div className="mt-6 flex justify-center">
                  <Link
                    href="/auctions"
                    className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold shadow-md shadow-emerald-200 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition"
                  >
                    ดูรายการประมูลทั้งหมด
                    <span className="text-white/90">→</span>
                  </Link>
                </div>
              </SectionCard>

              <SectionCard>
                <SectionHeader title="สินค้ามาใหม่" subtitle="NEW ARRIVALS" badge="New" />
                <CactusItems type="latest" />
              </SectionCard>

              <SectionCard>
                <SectionHeader title="แคคตัสหนามสั้น" subtitle="CACTUS SHORT SPINE" badge="Collection" />
                <CactusItems typeid={1} />
              </SectionCard>

              <SectionCard>
                <SectionHeader title="แคคตัสหนามยาว" subtitle="CACTUS LONG SPINE" badge="Collection" />
                <CactusItems typeid={2} />
              </SectionCard>

              <SectionCard>
                <SectionHeader title="ไม้อวบน้ำ" subtitle="SUCCULENT" badge="Collection" />
                <CactusItems typeid={3} />
              </SectionCard>

              <SectionCard>
                <SectionHeader title="ของตกแต่งกระถาง" subtitle="POT DECOR" badge="Decor" />
                <CactusItems typeid={4} />
              </SectionCard>

              <SectionCard>
                <SectionHeader title="สินค้าทั้งหมด" subtitle="ALL PRODUCTS" badge="All" />
                <CactusItems />
              </SectionCard>
            </>
          )}

          {topTitle ? (
            <div className="sr-only">
              {topTitle.title} {topTitle.subtitle} {topTitle.badge}
            </div>
          ) : null}
        </div>
      </main>
    </>
  );
};

export default HomePage;