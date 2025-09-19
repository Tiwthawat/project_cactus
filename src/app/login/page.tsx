'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Navbar from '../component/Navbar';
import Navigation from '../component/Navigation';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const res = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Cusername: email, Cpassword: password }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(`❌ เข้าสู่ระบบไม่สำเร็จ: ${err.message}`);
        return;
      }

      const data = await res.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      window.dispatchEvent(new Event('login-success'));

      router.push('/me');
    } catch (error) {
      console.error('🔥 เกิดข้อผิดพลาด:', error);
      alert('เกิดข้อผิดพลาด');
    }
  };

  return (
    <>
      <Navbar />
      <Navigation />
      <div className="min-h-screen pt-48 bg-white flex flex-col justify-start items-center">
        <div className="w-full max-w-xs bg-white border border-gray-300 rounded-lg shadow-md p-6">
          <h1 className="text-xl font-bold text-center mb-6 text-green-600">เข้าสู่ระบบ</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">ชื่อผู้ใช้ (Username)</label>
              <input
                id="email"
                name="email"
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block bg-white w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">รหัสผ่าน</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 bg-white block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition duration-200"
            >
              เข้าสู่ระบบ
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
