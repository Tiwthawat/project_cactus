'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Navbar from '../component/Navbar';
import Navigation from '../component/Navigation';

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // modal states
  const [showForgot, setShowForgot] = useState(false);
  const [showReset, setShowReset] = useState(false);

  // forgot form
  const [fpUsername, setFpUsername] = useState("");
  const [fpPhone, setFpPhone] = useState("");

  // reset password form
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  const [resetToken, setResetToken] = useState("");

  // -------------------------
  // ลืมรหัสผ่าน step1
  // -------------------------
  const handleForgotSubmit = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: fpUsername,
          phone: fpPhone
        })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "เกิดข้อผิดพลาด");
        return;
      }

      // save token
      setResetToken(data.resetToken);

      // close modal1 → open modal2
      setShowForgot(false);
      setShowReset(true);

    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาด");
    }
  };

  // -------------------------
  // reset password step2
  // -------------------------
  const handleResetPassword = async () => {
    if (newPass !== confirmPass) {
      alert("รหัสผ่านไม่ตรงกัน");
      return;
    }

    if (newPass.length < 6) {
      alert("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resetToken,
          newPassword: newPass
        })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "เกิดข้อผิดพลาด");
        return;
      }

      alert("เปลี่ยนรหัสผ่านสำเร็จ! กรุณาเข้าสู่ระบบใหม่");
      setShowReset(false);

    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาด");
    }
  };

  // -------------------------
  // login
  // -------------------------
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/login`, {
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
      localStorage.setItem('user', JSON.stringify(data.user));

      window.dispatchEvent(new Event('login-success'));
      router.push('/me');
    } catch (error) {
      console.error('🔥 Error:', error);
      alert('เกิดข้อผิดพลาด');
    }
  };

  // ================================
  //          UI STARTS HERE
  // ================================

  return (
    <>
      <Navbar />
      {/* <Navigation /> */}

      <div className="min-h-screen pt-48 bg-white flex flex-col justify-start items-center">
        <div className="w-full max-w-xs bg-white border border-gray-300 rounded-xl shadow-md p-6">
          <h1 className="text-xl font-bold text-center mb-6 text-green-600">
            เข้าสู่ระบบ
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                ชื่อผู้ใช้ (Username)
              </label>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block bg-white w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                รหัสผ่าน
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block bg-white w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition"
            >
              เข้าสู่ระบบ
            </button>

            <button
              type="button"
              onClick={() => setShowForgot(true)}
              className="text-sm text-blue-600 hover:underline text-right w-full mt-2"
            >
              ลืมรหัสผ่าน?
            </button>
          </form>
        </div>
      </div>

      {/* -----------------------------
          MODAL 1 : ลืมรหัสผ่าน
      ------------------------------ */}
      {showForgot && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-80 relative animate-fadeIn">

            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-black"
              onClick={() => setShowForgot(false)}
            >
              ✕
            </button>

            <h2 className="text-lg font-bold mb-4 text-green-700">ลืมรหัสผ่าน</h2>

            <input
              type="text"
              placeholder="ชื่อผู้ใช้"
              value={fpUsername}
              onChange={(e) => setFpUsername(e.target.value)}
              className="w-full border p-2 rounded mb-3"
            />

            <input
              type="text"
              placeholder="เบอร์โทร"
              value={fpPhone}
              onChange={(e) => setFpPhone(e.target.value)}
              className="w-full border p-2 rounded mb-3"
            />

            <button
              onClick={handleForgotSubmit}
              className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
            >
              ยืนยัน
            </button>
          </div>
        </div>
      )}

      {/* -----------------------------
          MODAL 2 : ตั้งรหัสผ่านใหม่
      ------------------------------ */}
      {showReset && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-80 relative animate-fadeIn">

            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-black"
              onClick={() => setShowReset(false)}
            >
              ✕
            </button>

            <h2 className="text-lg font-bold mb-4 text-green-700">
              ตั้งรหัสผ่านใหม่
            </h2>

            <input
              type="password"
              placeholder="รหัสผ่านใหม่"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              className="w-full border p-2 rounded mb-3"
            />

            <input
              type="password"
              placeholder="ยืนยันรหัสผ่าน"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              className="w-full border p-2 rounded mb-3"
            />

            <button
              onClick={handleResetPassword}
              className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
            >
              เปลี่ยนรหัสผ่าน
            </button>
          </div>
        </div>
      )}

    </>
  );
}
