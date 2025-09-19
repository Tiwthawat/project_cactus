'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TbBellRingingFilled } from 'react-icons/tb';
import Link from 'next/link';
import { FaShoppingCart } from 'react-icons/fa';

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

  return (
    <nav className="fixed top-0 left-0 w-full z-50 navbar flex-row justify-between bg-green-500 items-center h-20 shadow-md">

      <div className="ml-16 rounded-full overflow-hidden">
        <a href="/" className="rounded-full">
          <picture className="flex">
            <img src="/favicon.png" alt="Logo" className="w-20 h-20  rounded-full object-cover border-4 border-white shadow-lg" />
          </picture>
        </a>
      </div>

      <div className="flex items-center p-2 bg-white rounded-xl shadow-sm">
        <input className="bg-gray-100 w-80 h-8 text-gray-900 ring-0" type="text" placeholder="ค้นหา..." />
        <div className="bg-green-400 ml-3 py-3 px-5 text-gray-900 font-semibold rounded-lg hover:shadow-lg transition cursor-pointer">
          <span>Search</span>
        </div>
      </div>

      <div className="user-actions  flex items-center space-x-4 mr-16 text-white">
        {username ? (

          <>
            <Link href="/cart">
            <FaShoppingCart className="text-xl hover:text-yellow-300 cursor-pointer" title="ดูตะกร้าสินค้า" />
          </Link>
            <div className=' bg-orange-200'> <Link href="/me" className="font-bold text-white hover:underline">
              {username}
            </Link></div>

            <button
              onClick={handleLogout}
              className="bg-white text-green-600 px-3 py-1 rounded hover:bg-gray-100 transition"
            >
              ออกจากระบบ
            </button>
          </>
        ) : (
          <>
            <a href="/login"><button type="button">เข้าสู่ระบบ</button></a>
            <a href="/register"><button type="button">สมัครสมาชิก</button></a>
          </>
        )}
        <button type="button" className="w-10 h-10">
          <TbBellRingingFilled className="text-2xl" />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
