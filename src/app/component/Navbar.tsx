'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TbBellRingingFilled } from 'react-icons/tb';
import Link from 'next/link';
import { FaHeart, FaShoppingCart } from 'react-icons/fa';
import { usePathname } from 'next/navigation';
import { useCart } from '../context/CartContext';


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
              <div className="flex gap-6 text-sm font-medium">

                {/* หมวด 1: หนามสั้น */}
                <button
                  onClick={() => emitCategory({ typeid: 1, subtypeid: null })}
                  className="hover:text-green-600"
                >
                  หนามสั้น
                </button>

                {/* หมวด 2: หนามยาว */}
                <button
                  onClick={() => emitCategory({ typeid: 2, subtypeid: null })}
                  className="hover:text-green-600"
                >
                  หนามยาว
                </button>

                {/* หมวด 3: ไม้อวบน้ำ */}
                <button
                  onClick={() => emitCategory({ typeid: 3, subtypeid: null })}
                  className="hover:text-green-600"
                >
                  ไม้อวบน้ำ
                </button>

                {/* หมวด 4: ของตกแต่งกระถาง */}
                <button
                  onClick={() => emitCategory({ typeid: 4, subtypeid: null })}
                  className="hover:text-green-600"
                >
                  ของตกแต่ง
                </button>

                {/* หมวดพิเศษ: แสดงทั้งหมด */}
                <button
                  onClick={() => emitCategory({ typeid: null, subtypeid: null })}
                  className="hover:text-green-600"
                >
                  สินค้าทั้งหมด
                </button>
              </div>

            </li>
            <li><Link href="/auctions" className={`${isActive('/auctions') ? activeClass : inactiveClass}`}>สินค้าประมูล</Link></li>
            <li><Link href="/auctionguide" className={`${isActive('/auctionguide') ? activeClass : inactiveClass}`}>ขั้นตอนการประมูล</Link></li>
            <li><Link href="/FAQ" className={`${isActive('/FAQ') ? activeClass : inactiveClass}`}>คำถามที่พบบ่อย</Link></li>
            <li>
              <Link href="/forum" className={`${isActive('/forum') ? activeClass : inactiveClass}`}>
                กระทู้
              </Link>
            </li>

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

                <li>
                  <button
                    onClick={() => emitCategory({ typeid: 1, subtypeid: null })}
                    className="w-full text-left hover:text-green-600"
                  >
                    แคคตัสหนามสั้น
                  </button>
                </li>

                <li>
                  <button
                    onClick={() => emitCategory({ typeid: 2, subtypeid: null })}
                    className="w-full text-left hover:text-green-600"
                  >
                    แคคตัสหนามยาว
                  </button>
                </li>

                <li>
                  <button
                    onClick={() => emitCategory({ typeid: 3, subtypeid: null })}
                    className="w-full text-left hover:text-green-600"
                  >
                    ไม้อวบน้ำ
                  </button>
                </li>

                <li>
                  <button
                    onClick={() => emitCategory({ typeid: 4, subtypeid: null })}
                    className="w-full text-left hover:text-green-600"
                  >
                    ของตกแต่งกระถาง
                  </button>
                </li>

                {/* ปุ่มดูทั้งหมด */}
                <li>
                  <button
                    onClick={() => emitCategory({ typeid: null, subtypeid: null })}
                    className="w-full text-left hover:text-green-600"
                  >
                    สินค้าทั้งหมด
                  </button>
                </li>

              </ul>


            </details>
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
            onClick={() => setShowSearch(prev => !prev)}
            className="btn btn-ghost btn-circle btn-sm hover:bg-green-50 hover:text-green-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none"
              viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          {/* popup ค้นหา */}
          {showSearch && (
            <div className="absolute right-0 top-10 w-52 bg-white p-3 rounded-lg shadow-lg z-50">
              <input
                type="text"
                placeholder="ค้นหา..."
                value={searchKeyword}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchKeyword(val);

                  window.dispatchEvent(
                    new CustomEvent("do-search", { detail: val })
                  );
                }}
                className="w-full border p-2 rounded-lg text-sm"
              />



              <button
                onClick={() => {
                  window.dispatchEvent(
                    new CustomEvent("do-search", { detail: searchKeyword })
                  );
                  setShowSearch(false);
                }}
                className="mt-2 w-full bg-green-600 text-white py-1 rounded-lg text-sm"
              >
                ค้นหา
              </button>
            </div>
          )}

        </div>


        <Link href="/cart" className={`btn btn-ghost btn-circle btn-sm ${isActive('/cart') ? 'bg-green-100 text-green-600' : 'hover:bg-green-50 hover:text-green-600'}`}>
          <div className="indicator">
            <FaShoppingCart className="text-base" />
            {cartCount > 0 && (
              <span className="badge badge-sm badge-error indicator-item text-white text-[10px] h-4 w-4 p-0 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </div>
        </Link>
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
