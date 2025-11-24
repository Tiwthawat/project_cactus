'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TbBellRingingFilled } from 'react-icons/tb';
import Link from 'next/link';
import { FaHeart, FaShoppingCart } from 'react-icons/fa';
import { usePathname } from 'next/navigation';

const Navbar = () => {
  const [username, setUsername] = useState<string | null>(null);
  const router = useRouter();

  const loadUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUsername(null);
      return;
    }

    try {
      const res = await fetch('http://localhost:3000/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        if (res.status !== 401) {
          console.warn('⚠️ /me ล้มเหลว:', res.status);
        }
        setUsername(null);
        return;
      }

      const data = await res.json();
      if (data?.user?.Cusername) {
        setUsername(data.user.Cusername);
      }
    } catch (err) {
      console.error('❌ โหลด user ผิดพลาด:', err);
      setUsername(null);
    }
  };

  useEffect(() => {
    const handleLogin = () => {
      loadUser();
    };

    const handleLogout = () => {
      setUsername(null);
    };

    // ✅ โหลด user ถ้ามี token ตอน mount
    if (localStorage.getItem('token')) {
      loadUser();
    }

    // ✅ ฟัง event จาก login/logout
    window.addEventListener('login-success', handleLogin);
    window.addEventListener('logout-success', handleLogout);

    return () => {
      window.removeEventListener('login-success', handleLogin);
      window.removeEventListener('logout-success', handleLogout);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.dispatchEvent(new Event('logout-success'));
    router.push('/');
  };

  const pathname = usePathname();

  const isActive = (path: any) => {
    if (path === '/products') {
      return pathname.startsWith('/products');
    }
    return pathname === path;
  };

  const activeClass = "!bg-green-100 !text-green-600 font-semibold";
  const inactiveClass = "hover:!bg-green-50 hover:!text-green-600 active:!bg-green-100 focus:!bg-green-100 focus:!text-green-600";

  return (
    <div className="navbar bg-white shadow-sm fixed top-0 left-0 w-full z-50 text-sm">
      <div className="navbar-start">
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden btn-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none"
              viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
          </div>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content bg-white rounded-box mt-3 w-52 p-2 shadow text-xs">
            <li>
              <a className={`${pathname.startsWith('/products') ? activeClass : inactiveClass}`}>
                หมวดหมู่สินค้า
              </a>
              <ul className="p-2">
                <li><Link href="/products?cat=all" className={`${isActive('/products') ? activeClass : inactiveClass}`}>ทั้งหมด</Link></li>
                <li><Link href="/products?cat=cactus" className={inactiveClass}>แคคตัส</Link></li>
                <li><Link href="/products?cat=soil" className={inactiveClass}>ดิน</Link></li>
              </ul>
            </li>
            <li><Link href="/auctions" className={`${isActive('/auctions') ? activeClass : inactiveClass}`}>สินค้าประมูล</Link></li>
            <li><Link href="/auctionguide" className={`${isActive('/auctionguide') ? activeClass : inactiveClass}`}>ขั้นตอนการประมูล</Link></li>
            <li><Link href="/FAQ" className={`${isActive('/FAQ') ? activeClass : inactiveClass}`}>คำถามที่พบบ่อย</Link></li>
            <li><Link href="/Insurance" className={`${isActive('/Insurance') ? activeClass : inactiveClass}`}>การรับประกันสินค้า</Link></li>
            <li><Link href="/About" className={`${isActive('/About') ? activeClass : inactiveClass}`}>รีวิวเกี่ยวกับเรา</Link></li>
            {username ? (
              <>
                <li><Link href="/me" className={`${isActive('/me') ? activeClass : inactiveClass}`}>{username}</Link></li>
                <li><button onClick={handleLogout} className={inactiveClass}>ออกจากระบบ</button></li>
              </>
            ) : (
              <>
                <li><Link href="/login" className={`${isActive('/login') ? activeClass : inactiveClass}`}>เข้าสู่ระบบ</Link></li>
                <li><Link href="/register" className={`${isActive('/register') ? activeClass : inactiveClass}`}>สมัครสมาชิก</Link></li>
              </>
            )}
          </ul>
        </div>
        <Link href="/" className="btn btn-ghost btn-sm hover:bg-green-50">
          <img src="/favicon.png" className="w-8 h-8 rounded-full" />
        </Link>
      </div>

      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1 text-xs">
          <li>
            <details>
              <summary className={`${pathname.startsWith('/products') ? activeClass : inactiveClass}`}>
                หมวดหมู่สินค้า
              </summary>
              <ul className="p-2 bg-white shadow rounded-box text-xs">
                <li><Link href="/products?cat=all" className={inactiveClass}>ทั้งหมด</Link></li>
                <li><Link href="/products?cat=cactus" className={inactiveClass}>แคคตัส</Link></li>
                <li><Link href="/products?cat=soil" className={inactiveClass}>ดิน</Link></li>
              </ul>
            </details>
          </li>
          <li><Link href="/auctions" className={`${isActive('/auctions') ? activeClass : inactiveClass}`}>สินค้าประมูล</Link></li>
          <li><Link href="/auctionguide" className={`${isActive('/auctionguide') ? activeClass : inactiveClass}`}>ขั้นตอนการประมูล</Link></li>
          <li><Link href="/FAQ" className={`${isActive('/FAQ') ? activeClass : inactiveClass}`}>คำถามที่พบบ่อย</Link></li>
          <li><Link href="/Insurance" className={`${isActive('/Insurance') ? activeClass : inactiveClass}`}>การรับประกันสินค้า</Link></li>
          <li><Link href="/About" className={`${isActive('/About') ? activeClass : inactiveClass}`}>รีวิวเกี่ยวกับเรา</Link></li>
        </ul>
      </div>

      <div className="navbar-end gap-2">
        <button className="btn btn-ghost btn-circle btn-sm hover:bg-green-50 hover:text-green-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none"
            viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>

        <Link href="/cart" className={`btn btn-ghost btn-circle btn-sm ${isActive('/cart') ? 'bg-green-100 text-green-600' : 'hover:bg-green-50 hover:text-green-600'}`}>
          <FaShoppingCart className="text-base" />
        </Link>
        <Link href="/favorites" className={`btn btn-ghost btn-circle btn-sm ${isActive('/favorites') ? 'bg-green-100 text-green-600' : 'hover:bg-green-50 hover:text-green-600'}`}>
          <FaHeart className="text-base" />
        </Link>

        <button className="btn btn-ghost btn-circle btn-sm hover:bg-green-50 hover:text-green-600">
          <div className="indicator">
            <TbBellRingingFilled className="text-lg" />
            <span className="badge badge-xs badge-primary indicator-item"></span>
          </div>
        </button>

        {username ? (
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className={`btn btn-ghost btn-sm text-xs ${isActive('/me') ? 'bg-green-100 text-green-600' : 'hover:bg-green-50 hover:text-green-600'}`}>
              {username}
            </label>
            <ul
              tabIndex={0}
              className="dropdown-content bg-white rounded-box shadow w-40 p-2 text-xs"
            >
              <li><Link href="/me" className={`${isActive('/me') ? activeClass : inactiveClass}`}>โปรไฟล์</Link></li>
              <li><button onClick={handleLogout} className={inactiveClass}>ออกจากระบบ</button></li>
            </ul>
          </div>
        ) : (
          <Link href="/login" className={`text-xs border-[#e5e5e5] px-4 py-2 rounded-lg transition-colors ${isActive('/login') ? 'text-green-600 border-green-600 bg-green-50' : 'text-black hover:text-green-600 hover:border-green-600'}`}>
            เข้าสู่ระบบ
          </Link>
        )}
      </div>
    </div>
  );
};

export default Navbar;
