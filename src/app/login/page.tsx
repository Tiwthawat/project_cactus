'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navbar from '../component/Navbar';
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { getRole, isLoggedIn } from '../lib/authClient';

export default function Login() {
  const router = useRouter();

  useEffect(() => {
  if (isLoggedIn()) {
    const role = getRole();
    if (role === "admin") router.replace("/admin/dashboard");
    else router.replace("/");
  }
}, [router]);


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

  const [showPassword, setShowPassword] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

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
type LoginRole = "admin" | "user";

interface LoginResponse {
  token: string;
  role: LoginRole;
  user?: unknown;  // ถ้าตะเอ๊งมี interface user จริง ค่อยเปลี่ยนได้
  admin?: unknown; // เช่นกัน
  message?: string;
}

const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  if (isLoggedIn()) {
  alert("ตอนนี้มีผู้ใช้งานล็อกอินอยู่แล้ว กรุณาออกจากระบบก่อน");
  return;
} else {
  // token เก่าหมดอายุ/พัง ลบทิ้งได้
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("user");
  localStorage.removeItem("admin");
}
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ Cusername: email, Cpassword: password }),
    });

    const data: LoginResponse = await res.json();

    if (!res.ok) {
      alert(`❌ เข้าสู่ระบบไม่สำเร็จ: ${data.message || "เกิดข้อผิดพลาด"}`);
      return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("role", data.role);

    // เก็บ user/admin ถ้ามี (กันพัง)
    if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
    if (data.admin) localStorage.setItem("admin", JSON.stringify(data.admin));

    window.dispatchEvent(new Event("login-success"));

    if (data.role === "admin") {
      router.replace("/admin/dashboard"); // ✅ ไปหน้านี้ตามที่ตะเอ๊งต้องการ
    } else {
      router.replace("/");
    }
  } catch (error) {
    console.error("🔥 Error:", error);
    alert("เกิดข้อผิดพลาด");
  }
};

 function isLoggedIn() {
  const token = localStorage.getItem("token");
  if (!token) return false;

  try {
    const payloadPart = token.split(".")[1];
    const payload = JSON.parse(atob(payloadPart.replace(/-/g, "+").replace(/_/g, "/")));
    if (!payload?.exp) return true; // ถ้าไม่มี exp ก็ถือว่ามี token
    return Date.now() < payload.exp * 1000;
  } catch {
    return false;
  }
}



  // ================================
  //          UI STARTS HERE
  // ================================

  return (
    <>
      <Navbar />

      <div className="min-h-screen pt-40 bg-gradient-to-br from-green-50 to-emerald-50 flex flex-col justify-start items-center px-4">

        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-emerald-200">

          <div className="text-center mb-8">
            <div className="inline-block bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-full text-sm font-semibold mb-4">
              ยินดีต้อนรับกลับมา
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              เข้าสู่ระบบ
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ชื่อผู้ใช้ (Username)
              </label>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                รหัสผ่าน
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white shadow-sm 
      focus:ring-2 focus:ring-emerald-500 outline-none pr-12"
                />

                <span
                  className="absolute inset-y-0 right-4 flex items-center cursor-pointer text-gray-500"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:opacity-90 transition"
            >
              เข้าสู่ระบบ
            </button>

            <button
              type="button"
              onClick={() => setShowForgot(true)}
              className="text-sm text-emerald-700 hover:underline text-right w-full mt-2"
            >
              ลืมรหัสผ่าน?
            </button>

            {/* REGISTER BUTTON */}
            <a
              href="/register"
              className="block w-full text-center bg-white text-green-600 py-3 rounded-xl font-semibold border border-green-500 hover:bg-green-50 transition"
            >
              สมัครสมาชิก
            </a>
          </form>
        </div>
      </div>

      {/* -----------------------------
          MODAL 1 : ลืมรหัสผ่าน
      ------------------------------ */}
      {showForgot && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-80 relative animate-fadeIn border border-emerald-200">

            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-black"
              onClick={() => setShowForgot(false)}
            >
              ✕
            </button>

            <h2 className="text-lg font-bold mb-4 text-green-700">
              ลืมรหัสผ่าน
            </h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ชื่อผู้ใช้
              </label>
              <input
                type="text"
                placeholder="ชื่อผู้ใช้"
                value={fpUsername}
                onChange={(e) => setFpUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white shadow-sm 
    focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                เบอร์โทร
              </label>
              <input
                type="text"
                placeholder="เบอร์โทร"
                value={fpPhone}
                onChange={(e) => setFpPhone(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white shadow-sm 
    focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <button
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 rounded-xl shadow hover:opacity-90"
              onClick={handleForgotSubmit}
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
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-80 relative animate-fadeIn border border-emerald-200">

            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-black"
              onClick={() => setShowReset(false)}
            >
              ✕
            </button>

            <h2 className="text-lg font-bold mb-4 text-green-700">
              ตั้งรหัสผ่านใหม่
            </h2>

            {/* New Password */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                รหัสผ่านใหม่
              </label>

              <div className="relative">
                <input
                  type={showNewPass ? "text" : "password"}
                  placeholder="รหัสผ่านใหม่"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white shadow-sm 
      focus:ring-2 focus:ring-emerald-500 outline-none pr-12"
                />

                <span
                  className="absolute inset-y-0 right-4 flex items-center cursor-pointer text-gray-500"
                  onClick={() => setShowNewPass(!showNewPass)}
                >
                  {showNewPass ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ยืนยันรหัสผ่าน
              </label>

              <div className="relative">
                <input
                  type={showConfirmPass ? "text" : "password"}
                  placeholder="ยืนยันรหัสผ่าน"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white shadow-sm 
      focus:ring-2 focus:ring-emerald-500 outline-none pr-12"
                />

                <span
                  className="absolute inset-y-0 right-4 flex items-center cursor-pointer text-gray-500"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                >
                  {showConfirmPass ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>

            <button
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 rounded-xl shadow hover:opacity-90"
              onClick={handleResetPassword}
            >
              เปลี่ยนรหัสผ่าน
            </button>

          </div>
        </div>
      )}
    </>
  );
}
