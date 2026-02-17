'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TbBellRingingFilled } from 'react-icons/tb';
import Link from 'next/link';
import { FaHeart, FaShoppingCart, FaSearch, FaUser } from 'react-icons/fa';
import { usePathname } from 'next/navigation';
import { useCart } from '../context/CartContext';
import Sidebar from './Sidebar';


interface CategoryEventDetail {
  typeid: number | null;
  subtypeid: number | null;
}

// ฟังก์ชันส่ง event
const emitCategory = (detail: CategoryEventDetail) => {
  window.dispatchEvent(
    new CustomEvent("select-category", { detail })
  );
};
const Navbar = () => {
  const [username, setUsername] = useState<string | null>(null);
  const router = useRouter();
  const [showSearch, setShowSearch] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const { cartCount } = useCart();

  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarMode, setSidebarMode] = useState<'user' | 'categories' | 'search' | 'cart' | 'menu' | null>(null);

  const openSidebar = (mode: 'user' | 'categories' | 'search' | 'cart' | 'menu') => {
    setSidebarMode(mode);
    setIsSidebarOpen(true);
  };




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

  const isActive = (path: string) => pathname === path;


  const activeClass = "!bg-green-100 !text-green-600 font-semibold";
  const inactiveClass = "hover:!bg-green-50 hover:!text-green-600 active:!bg-green-100 focus:!bg-green-100 focus:!text-green-600";

  return (
    <div className="navbar bg-white shadow-sm fixed top-0 left-0 w-full z-50 text-sm">
      <div className="navbar-start">
        <div>
          <button
            onClick={() => openSidebar('menu')}
            className="btn btn-ghost lg:hidden btn-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none"
              viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
          </button>
        </div>
        <Link href="/" className="btn btn-ghost btn-sm hover:bg-green-50">
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
          <li><Link href="/auctions" className={`${isActive('/auctions') ? activeClass : inactiveClass}`}>สินค้าประมูล</Link></li>
          <li><Link href="/auctionguide" className={`${isActive('/auctionguide') ? activeClass : inactiveClass}`}>ขั้นตอนการประมูล</Link></li>
          <li><Link href="/FAQ" className={`${isActive('/FAQ') ? activeClass : inactiveClass}`}>คำถามที่พบบ่อย</Link></li>
          <li><Link href="/Insurance" className={`${isActive('/Insurance') ? activeClass : inactiveClass}`}>การรับประกันสินค้า</Link></li>
          <li>
            <Link href="/forum" className={`${isActive('/forum') ? activeClass : inactiveClass}`}>
              กระทู้
            </Link>
          </li>

          <li><Link href="/About" className={`${isActive('/About') ? activeClass : inactiveClass}`}>รีวิวเกี่ยวกับเรา</Link></li>
        </ul>
      </div>

      <div className="navbar-end gap-2">
        <div className="relative">

          {/* ปุ่มค้นหา */}
          <button
            onClick={() => openSidebar('search')}
            className="btn btn-ghost btn-circle btn-sm hover:bg-green-50 hover:text-green-600"
          >
            <FaSearch className="text-base" />
          </button>

        </div>


        <button
          onClick={() => openSidebar('cart')}
          className={`btn btn-ghost btn-circle btn-sm ${isActive('/cart') ? 'bg-green-100 text-green-600' : 'hover:bg-green-50 hover:text-green-600'}`}
        >
          <div className="indicator">
            <FaShoppingCart className="text-base" />
            {cartCount > 0 && (
              <span className="badge badge-sm badge-error indicator-item text-white text-[10px] h-4 w-4 p-0 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </div>
        </button>
        <Link
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.dispatchEvent(new CustomEvent("show-favorites"));
          }}
          className={`btn btn-ghost btn-circle btn-sm ${isActive('/favorites') ? 'bg-green-100 text-green-600' : 'hover:bg-green-50 hover:text-green-600'}`}
        >
          <FaHeart className="text-base" />
        </Link>


        <button className="btn btn-ghost btn-circle btn-sm hover:bg-green-50 hover:text-green-600">
          <div className="indicator">
            <TbBellRingingFilled className="text-lg" />
            <span className="badge badge-xs badge-primary indicator-item"></span>
          </div>
        </button>

        {username ? (
          <button
            onClick={() => openSidebar('user')}
            className={`btn btn-ghost btn-sm text-xs px-3 rounded-lg flex items-center gap-2
      ${isActive('/me')
                ? 'bg-green-100 text-green-600 shadow-sm'
                : 'hover:bg-green-50 hover:text-green-600'}`}
          >
            <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
              {username.charAt(0).toUpperCase()}
            </div>
            {username}
          </button>
        ) : (
          <Link
            href="/login"
            className={`
      text-xs px-4 py-2 rounded-lg border transition 
      ${isActive('/login')
                ? 'text-green-600 border-green-600 bg-green-50'
                : 'text-black border-gray-300 hover:text-green-600 hover:border-green-600'}
    `}
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
        cartCount={cartCount}
        handleLogout={handleLogout}
      />
    </div>
  );
};

export default Navbar;
