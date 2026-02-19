'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navbar from '../component/Navbar';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { getRole, isLoggedIn } from '../lib/authClient';

export default function Login() {
  const router = useRouter();

  useEffect(() => {
    if (isLoggedIn()) {
      const role = getRole();
      if (role === 'admin') router.replace('/admin/dashboard');
      else router.replace('/');
    }
  }, [router]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // modal states
  const [showForgot, setShowForgot] = useState(false);
  const [showReset, setShowReset] = useState(false);

  // forgot form
  const [fpUsername, setFpUsername] = useState('');
  const [fpPhone, setFpPhone] = useState('');

  // reset password form
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [resetToken, setResetToken] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // -------------------------
  // ลืมรหัสผ่าน step1
  // -------------------------
  const handleForgotSubmit = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/auth/forgot-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: fpUsername,
            phone: fpPhone,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || 'เกิดข้อผิดพลาด');
        return;
      }

      setResetToken(data.resetToken);

      setShowForgot(false);
      setShowReset(true);
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาด');
    }
  };

  // -------------------------
  // reset password step2
  // -------------------------
  const handleResetPassword = async () => {
    if (newPass !== confirmPass) {
      alert('รหัสผ่านไม่ตรงกัน');
      return;
    }

    if (newPass.length < 6) {
      alert('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/auth/reset-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resetToken,
            newPassword: newPass,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || 'เกิดข้อผิดพลาด');
        return;
      }

      alert('เปลี่ยนรหัสผ่านสำเร็จ! กรุณาเข้าสู่ระบบใหม่');
      setShowReset(false);
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาด');
    }
  };

  // -------------------------
  // login
  // -------------------------
  type LoginRole = 'admin' | 'user';

  interface LoginResponse {
    token: string;
    role: LoginRole;
    user?: unknown;
    admin?: unknown;
    message?: string;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isLoggedIn()) {
      alert('ตอนนี้มีผู้ใช้งานล็อกอินอยู่แล้ว กรุณาออกจากระบบก่อน');
      return;
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('user');
      localStorage.removeItem('admin');
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Cusername: email, Cpassword: password }),
      });

      const data: LoginResponse = await res.json();

      if (!res.ok) {
        alert(`เข้าสู่ระบบไม่สำเร็จ: ${data.message || 'เกิดข้อผิดพลาด'}`);
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);

      if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
      if (data.admin) localStorage.setItem('admin', JSON.stringify(data.admin));

      window.dispatchEvent(new Event('login-success'));

      if (data.role === 'admin') router.replace('/admin/dashboard');
      else router.replace('/');
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

      {/* background */}
      <div className="min-h-screen pt-28 md:pt-32 bg-gradient-to-b from-white via-slate-50 to-emerald-50/40 text-slate-900">
        <div className="pointer-events-none fixed inset-x-0 top-0 h-56 bg-gradient-to-b from-emerald-100/45 to-transparent blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-10 md:pt-14">
            {/* Left: Brand panel */}
            <div className="hidden lg:block lg:col-span-6">
              <div className="rounded-[28px] border border-slate-200 bg-white/70 backdrop-blur p-10 shadow-[0_20px_60px_-45px_rgba(2,6,23,0.55)]">
                <div className="text-xs font-semibold tracking-widest text-emerald-700">
                  AUTH
                </div>
                <div className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900">
                  เข้าสู่ระบบเพื่อดำเนินการต่อ
                </div>
                <div className="mt-3 text-slate-600 leading-relaxed">
                  จัดการคำสั่งซื้อ ตรวจสอบสถานะ และใช้งานระบบได้ครบทุกฟีเจอร์
                  แบบปลอดภัย
                </div>

                <div className="mt-8 grid grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="text-xs font-semibold text-slate-500">
                      Security
                    </div>
                    <div className="mt-1 text-sm font-extrabold text-slate-900">
                      Token-based
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="text-xs font-semibold text-slate-500">
                      Checkout
                    </div>
                    <div className="mt-1 text-sm font-extrabold text-slate-900">
                      Fast & Clean
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="text-xs font-semibold text-slate-500">
                      Support
                    </div>
                    <div className="mt-1 text-sm font-extrabold text-slate-900">
                      Real system
                    </div>
                  </div>
                </div>

                <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
                  <div className="text-sm font-extrabold text-slate-900">
                    Tip
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    ถ้าลืมรหัสผ่าน ใช้เมนู “ลืมรหัสผ่าน” เพื่อยืนยันตัวตนแล้วตั้งใหม่ได้เลย
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Login card */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_60px_-45px_rgba(2,6,23,0.55)] overflow-hidden">
                {/* header */}
                <div className="px-7 pt-7 pb-6 border-b border-slate-100">
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3.5 py-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-[11px] font-extrabold tracking-wide text-emerald-800">
                      SECURE LOGIN
                    </span>
                  </div>

                  <div className="mt-4">
                    <div className="text-2xl font-extrabold tracking-tight text-slate-900">
                      เข้าสู่ระบบ
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      ใส่ชื่อผู้ใช้และรหัสผ่านเพื่อดำเนินการต่อ
                    </div>
                  </div>
                </div>

                {/* form */}
                <form onSubmit={handleSubmit} className="px-7 py-6 space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      ชื่อผู้ใช้ (Username)
                    </label>
                    <input
                      type="text"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-12 px-4 rounded-2xl border border-slate-200 bg-white text-slate-900 font-semibold
                        outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-300 transition"
                      placeholder="กรอกชื่อผู้ใช้"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      รหัสผ่าน
                    </label>

                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full h-12 px-4 rounded-2xl border border-slate-200 bg-white text-slate-900 font-semibold
                          outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-300 transition pr-12"
                        placeholder="กรอกรหัสผ่าน"
                      />

                      <button
                        type="button"
                        className="absolute inset-y-0 right-3 grid place-items-center w-10 text-slate-500 hover:text-slate-900 transition"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full h-12 rounded-2xl bg-slate-900 text-white font-extrabold shadow-lg hover:bg-slate-800 transition"
                  >
                    เข้าสู่ระบบ
                  </button>

                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setShowForgot(true)}
                      className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                    >
                      ลืมรหัสผ่าน?
                    </button>

                    <a
                      href="/register"
                      className="text-sm font-extrabold text-slate-900 hover:underline"
                    >
                      สมัครสมาชิก
                    </a>
                  </div>

                  <div className="pt-2">
                    <a
                      href="/register"
                      className="block w-full text-center h-12 leading-[48px] rounded-2xl border border-slate-200 bg-white font-extrabold text-slate-900 hover:bg-slate-50 transition"
                    >
                      สร้างบัญชีใหม่
                    </a>
                  </div>

                  <div className="text-[11px] text-slate-500 leading-relaxed">
                    การเข้าสู่ระบบหมายถึงคุณยอมรับเงื่อนไขการใช้งานและนโยบายความเป็นส่วนตัวของระบบ
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* -----------------------------
          MODAL 1 : ลืมรหัสผ่าน
      ------------------------------ */}
      {showForgot && (
        <ModalShell
          title="ยืนยันตัวตน"
          subtitle="กรอกข้อมูลเพื่อขอรหัสสำหรับตั้งรหัสผ่านใหม่"
          onClose={() => setShowForgot(false)}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                ชื่อผู้ใช้
              </label>
              <input
                type="text"
                placeholder="กรอกชื่อผู้ใช้"
                value={fpUsername}
                onChange={(e) => setFpUsername(e.target.value)}
                className="w-full h-12 px-4 rounded-2xl border border-slate-200 bg-white text-slate-900 font-semibold
                  outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-300 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                เบอร์โทร
              </label>
              <input
                type="text"
                placeholder="กรอกเบอร์โทร"
                value={fpPhone}
                onChange={(e) => setFpPhone(e.target.value)}
                className="w-full h-12 px-4 rounded-2xl border border-slate-200 bg-white text-slate-900 font-semibold
                  outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-300 transition"
              />
            </div>

            <button
              className="w-full h-12 rounded-2xl bg-slate-900 text-white font-extrabold hover:bg-slate-800 transition disabled:opacity-50"
              onClick={handleForgotSubmit}
              disabled={!fpUsername.trim() || !fpPhone.trim()}
            >
              ขอรหัสรีเซ็ต
            </button>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              หากข้อมูลถูกต้อง ระบบจะส่ง <span className="font-semibold">reset token</span> ให้เพื่อใช้ตั้งรหัสผ่านใหม่
            </p>
          </div>
        </ModalShell>
      )}

      {/* -----------------------------
          MODAL 2 : ตั้งรหัสผ่านใหม่
      ------------------------------ */}
      {showReset && (
        <ModalShell
          title="ตั้งรหัสผ่านใหม่"
          subtitle="ตั้งรหัสผ่านใหม่อย่างน้อย 6 ตัวอักษร"
          onClose={() => setShowReset(false)}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                รหัสผ่านใหม่
              </label>
              <div className="relative">
                <input
                  type={showNewPass ? 'text' : 'password'}
                  placeholder="กรอกรหัสผ่านใหม่"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  className="w-full h-12 px-4 rounded-2xl border border-slate-200 bg-white text-slate-900 font-semibold
                    outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-300 transition pr-12"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-3 grid place-items-center w-10 text-slate-500 hover:text-slate-900 transition"
                  onClick={() => setShowNewPass(!showNewPass)}
                  aria-label={showNewPass ? 'ซ่อนรหัสผ่านใหม่' : 'แสดงรหัสผ่านใหม่'}
                >
                  {showNewPass ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                ยืนยันรหัสผ่าน
              </label>
              <div className="relative">
                <input
                  type={showConfirmPass ? 'text' : 'password'}
                  placeholder="ยืนยันรหัสผ่าน"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  className="w-full h-12 px-4 rounded-2xl border border-slate-200 bg-white text-slate-900 font-semibold
                    outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-300 transition pr-12"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-3 grid place-items-center w-10 text-slate-500 hover:text-slate-900 transition"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  aria-label={showConfirmPass ? 'ซ่อนยืนยันรหัสผ่าน' : 'แสดงยืนยันรหัสผ่าน'}
                >
                  {showConfirmPass ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <button
              className="w-full h-12 rounded-2xl bg-slate-900 text-white font-extrabold hover:bg-slate-800 transition disabled:opacity-50"
              onClick={handleResetPassword}
              disabled={!newPass || !confirmPass}
            >
              เปลี่ยนรหัสผ่าน
            </button>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              เมื่อเปลี่ยนสำเร็จ กรุณาเข้าสู่ระบบใหม่อีกครั้ง
            </p>
          </div>
        </ModalShell>
      )}
    </>
  );
}

/* -----------------------------
   Reusable Modal Shell (premium)
------------------------------ */
function ModalShell({
  title,
  subtitle,
  children,
  onClose,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md rounded-[26px] border border-white/10 bg-white shadow-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold tracking-widest text-emerald-700">
              AUTH
            </div>
            <div className="mt-1 text-lg font-extrabold text-slate-900">
              {title}
            </div>
            {subtitle && <div className="mt-1 text-sm text-slate-600">{subtitle}</div>}
          </div>

          <button
            className="h-10 w-10 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition grid place-items-center text-slate-700"
            onClick={onClose}
            aria-label="ปิด"
            title="ปิด"
            type="button"
          >
            <span className="text-xl leading-none">×</span>
          </button>
        </div>

        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
