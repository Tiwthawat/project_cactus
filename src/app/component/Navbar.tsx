'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { TbBellRingingFilled } from 'react-icons/tb';
import Link from 'next/link';
import { FaHeart, FaShoppingCart, FaSearch } from 'react-icons/fa';
import { useCart } from '../context/CartContext';
import Sidebar from './Sidebar';

interface CategoryEventDetail {
  typeid: number | null;
  subtypeid: number | null;
}

type SidebarMode = 'user' | 'categories' | 'search' | 'cart' | 'menu' | 'notifications' | null;

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

const emitCategory = (detail: CategoryEventDetail) => {
  window.dispatchEvent(new CustomEvent('select-category', { detail }));
};

type UnreadCountResponse = { unread: number };

const Navbar = () => {
  const [username, setUsername] = useState<string | null>(null);
  const [role, setRole] = useState<'user' | 'admin' | null>(null);
  const [profile, setProfile] = useState<string | null>(null);

  const router = useRouter();
  const pathname = usePathname();
  const { cartCount } = useCart();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [unreadNoti, setUnreadNoti] = useState<number>(0);

  const openSidebar = (mode: Exclude<SidebarMode, null>) => {
    setSidebarMode(mode);
    setIsSidebarOpen(true);
  };

  const getProfileUrl = (filename: string | null) => {
    if (!filename) return '/default-profile.png';
    if (filename.startsWith('http')) return filename;
    return `${API}/profiles/${filename}`;
  };

  const loadUnreadNoti = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUnreadNoti(0);
      return;
    }

    try {
      const res = await fetch(`${API}/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;

      const data = (await res.json()) as UnreadCountResponse;
setUnreadNoti(Number(data?.unread || 0));
    } catch {
    }
  };

  const loadUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUsername(null);
      setRole(null);
      setProfile(null);
      setUnreadNoti(0);
      return;
    }

    try {
      const res = await fetch(`${API}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        setUsername(null);
        setRole(null);
        setProfile(null);
        setUnreadNoti(0);
        return;
      }

      const data = await res.json();

      if (data?.role === 'user') {
        setUsername(data.user.Cusername);
        setRole('user');
        setProfile(data.user.Cprofile ?? null);
      } else if (data?.role === 'admin') {
        setUsername(data.user.Cname);
        setRole('admin');
        setProfile(data.user.Cprofile ?? null);
      } else {
        setUsername(null);
        setRole(null);
        setProfile(null);
      }

      await loadUnreadNoti();
    } catch (err) {
      console.error('โหลด user ผิดพลาด:', err);
      setUsername(null);
      setRole(null);
      setProfile(null);
      setUnreadNoti(0);
    }
  };

  useEffect(() => {
    const handleLogin = () => {
      loadUser();
    };

    const handleLogout = () => {
      setUsername(null);
      setRole(null);
      setProfile(null);
      setUnreadNoti(0);
    };

      const handleNotiChanged = () => {
    if (localStorage.getItem('token')) void loadUnreadNoti();
  };

    if (localStorage.getItem('token')) {
      loadUser();
    }

    window.addEventListener('login-success', handleLogin);
    window.addEventListener('logout-success', handleLogout);
     window.addEventListener('notifications-changed', handleNotiChanged);
    

    const t = setInterval(() => {
      if (localStorage.getItem('token')) loadUnreadNoti();
    }, 15000);

    return () => {
      window.removeEventListener('login-success', handleLogin);
      window.removeEventListener('logout-success', handleLogout);
       window.removeEventListener('notifications-changed', handleNotiChanged);
      clearInterval(t);
    };
  }, []);

  const handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('user');
  localStorage.removeItem('admin'); // เผื่อมี

  setRole(null);
  setUsername(null);
  setProfile(null);
  setUnreadNoti(0);

  window.dispatchEvent(new Event('logout-success'));
  router.push('/');
};

  const isActive = (path: string) => pathname === path;

  const activeClass = '!bg-green-100 !text-green-600 font-semibold';
  const inactiveClass =
    'hover:!bg-green-50 hover:!text-green-600 active:!bg-green-100 focus:!bg-green-100 focus:!text-green-600';

  const goHome = (e: React.MouseEvent) => {
    e.preventDefault();
    window.dispatchEvent(new Event('go-home'));
    router.push('/');
  };

  return (
    <div className="navbar bg-white shadow-sm fixed top-0 left-0 w-full z-[9999] text-sm">
      <div className="navbar-start">
        <button
          onClick={() => openSidebar('menu')}
          className="btn btn-ghost lg:hidden btn-sm"
        >
          ☰
        </button>

        <Link
          href="/"
          onClick={goHome}
          className="btn btn-ghost btn-sm hover:bg-green-50"
        >
          <img src="/favicon.png" className="w-8 h-8 rounded-full" />
        </Link>
      </div>

      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1 text-xs">
          <li>
            <button
              onClick={() => openSidebar('categories')}
              className={`${pathname.startsWith('/products') ? activeClass : inactiveClass}`}
            >
              หมวดหมู่สินค้า
            </button>
          </li>

          <li>
            <Link
              href="/auctions"
              className={`${isActive('/auctions') ? activeClass : inactiveClass}`}
            >
              สินค้าประมูล
            </Link>
          </li>

          <li>
            <Link
              href="/auctionguide"
              className={`${isActive('/auctionguide') ? activeClass : inactiveClass}`}
            >
              ขั้นตอนการประมูล
            </Link>
          </li>

          <li>
            <Link href="/FAQ" className={`${isActive('/FAQ') ? activeClass : inactiveClass}`}>
              คำถามที่พบบ่อย
            </Link>
          </li>

          <li>
            <Link
              href="/Insurance"
              className={`${isActive('/Insurance') ? activeClass : inactiveClass}`}
            >
              การรับประกันสินค้า
            </Link>
          </li>

          <li>
            <Link href="/forum" className={`${isActive('/forum') ? activeClass : inactiveClass}`}>
              กระทู้
            </Link>
          </li>

          <li>
            <Link href="/About" className={`${isActive('/About') ? activeClass : inactiveClass}`}>
              รีวิวเกี่ยวกับเรา
            </Link>
          </li>

          {role === 'admin' && (
            <li>
              <Link
                href="/admin/dashboard"
                className={[
                  'px-3 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition',
                  pathname.startsWith('/admin') ? activeClass : inactiveClass,
                ].join(' ')}
              >
                กลับไปยังแดชบอร์ด
              </Link>
            </li>
          )}
        </ul>
      </div>

      <div className="navbar-end gap-2">
        <button
          onClick={() => openSidebar('search')}
          className="btn btn-ghost btn-circle btn-sm hover:bg-green-50 hover:text-green-600"
          aria-label="ค้นหา"
          title="ค้นหา"
        >
          <FaSearch />
        </button>

        <button
          onClick={() => window.dispatchEvent(new Event('show-favorites'))}
          className="btn btn-ghost btn-circle btn-sm hover:bg-green-50 hover:text-green-600"
          aria-label="รายการโปรด"
          title="รายการโปรด"
        >
          <FaHeart />
        </button>

        <div className="indicator">
          {mounted && cartCount > 0 && (
            <span
              className="
                indicator-item
                badge badge-error
                border-2 border-white
                text-[10px] font-bold
                min-w-[18px] h-[18px]
                px-1
              "
            >
              {cartCount > 99 ? '99+' : cartCount}
            </span>
          )}

          <button
            onClick={() => openSidebar('cart')}
            className="btn btn-ghost btn-circle btn-sm hover:bg-green-50 hover:text-green-600"
            aria-label="ตะกร้าสินค้า"
            title="ตะกร้าสินค้า"
          >
            <FaShoppingCart />
          </button>
        </div>

        <div className="indicator">
          {mounted && unreadNoti > 0 && (
            <span
              className="
                indicator-item
                badge badge-error
                border-2 border-white
                text-[10px] font-bold
                min-w-[18px] h-[18px]
                px-1
              "
            >
              {unreadNoti > 99 ? '99+' : unreadNoti}
            </span>
          )}

          <button
  onClick={() => openSidebar('notifications')}
  className="btn btn-ghost btn-circle btn-sm hover:bg-green-50 hover:text-green-600"
  aria-label="แจ้งเตือน"
  title="แจ้งเตือน"
>
  <TbBellRingingFilled />
</button>
        </div>

        {username ? (
          <button
            onClick={() => openSidebar('user')}
            className="btn btn-ghost btn-sm text-xs px-3 rounded-lg flex items-center gap-2 hover:bg-green-50 hover:text-green-600"
          >
            <div className="w-7 h-7 rounded-full overflow-hidden ring-1 ring-gray-200 bg-white">
              <img
                src={getProfileUrl(profile)}
                alt="profile"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/default-profile.png';
                }}
              />
            </div>
            {username}
          </button>
        ) : (
          <Link
            href="/login"
            className="text-xs px-4 py-2 rounded-lg border text-black border-gray-300 hover:text-green-600 hover:border-green-600"
          >
            เข้าสู่ระบบ
          </Link>
        )}
      </div>

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        mode={sidebarMode}
        setMode={setSidebarMode}
        username={username}
        profile={profile}
        cartCount={cartCount}
        handleLogout={handleLogout}
        role={role}
      />
    </div>
  );
};

export default Navbar;