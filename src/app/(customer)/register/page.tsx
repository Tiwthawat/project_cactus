'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

interface RegisterForm {
  Cname: string;
  Cusername: string;
  Cpassword: string;
  confirmPassword: string;
  Cphone: string;
  Cbirth: string;
  Czipcode: string;
  Caddress: string;
  Csubdistrict: string;
  Cdistrict: string;
  Cprovince: string;
}

export default function Register() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [birthDate, setBirthDate] = useState<Date | null>(null);

  const [form, setForm] = useState<RegisterForm>({
    Cname: '',
    Cusername: '',
    Cpassword: '',
    confirmPassword: '',
    Cphone: '',
    Cbirth: '',
    Czipcode: '',
    Caddress: '',
    Csubdistrict: '',
    Cdistrict: '',
    Cprovince: '',
  });

  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    if (profilePreview) {
      try {
        URL.revokeObjectURL(profilePreview);
      } catch {
        // no-op
      }
    }

    setForm({
      Cname: '',
      Cusername: '',
      Cpassword: '',
      confirmPassword: '',
      Cphone: '',
      Cbirth: '',
      Czipcode: '',
      Caddress: '',
      Csubdistrict: '',
      Cdistrict: '',
      Cprovince: '',
    });

    setBirthDate(null);
    setProfilePreview(null);
    setProfileFile(null);
  };

  const validatePassword = (password: string) => {
    if (password.length < 6) return 'รหัสผ่านต้องมีอย่างน้อย 6 ตัว';
    if (!/[a-zA-Z]/.test(password)) return 'รหัสผ่านต้องมีตัวอักษร';
    if (!/\d/.test(password)) return 'รหัสผ่านต้องมีตัวเลข';
    if (/[ก-๙]/.test(password)) return 'รหัสผ่านห้ามมีอักษรภาษาไทย';
    return null;
  };

  useEffect(() => {
    const fetchAddress = async () => {
      if (form.Czipcode.length === 5) {
        try {
          const res = await fetch(
            `http://localhost:3000/zipcode/${form.Czipcode}`
          );
          const data = await res.json();
          if (res.ok) {
            setForm((prev) => ({
              ...prev,
              Csubdistrict: data.subdistrict || '',
              Cdistrict: data.district || '',
              Cprovince: data.province || '',
            }));
          } else {
            setForm((prev) => ({
              ...prev,
              Csubdistrict: '',
              Cdistrict: '',
              Cprovince: '',
            }));
          }
        } catch (error) {
          console.error('โหลดข้อมูลไม่สำเร็จ:', error);
        }
      }
    };
    fetchAddress();
  }, [form.Czipcode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.Cpassword !== form.confirmPassword)
      return alert('❌ ยืนยันรหัสผ่านไม่ตรงกัน');

    const passwordError = validatePassword(form.Cpassword);
    if (passwordError) return alert(`❌ ${passwordError}`);

    try {
      setLoading(true);

      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => formData.append(key, value));
      if (profileFile) formData.append('profile', profileFile);

      const res = await fetch('http://localhost:3000/register', {
        method: 'POST',
        body: formData,
      });

      setLoading(false);

      if (!res.ok) {
        const err = await res.json();
        return alert(`❌ สมัครไม่สำเร็จ: ${err.message}`);
      }

      alert('✅ สมัครสมาชิกสำเร็จ!');
      router.push('/login');
    } catch (err) {
      setLoading(false);
      alert('เกิดข้อผิดพลาด');
    }
  };

  const BirthInput = React.forwardRef<HTMLInputElement, any>(
    ({ value, onClick }, ref) => (
      <button
        type="button"
        onClick={onClick}
        className="w-full h-12 flex items-center justify-between px-4 rounded-2xl border border-slate-200 bg-white text-slate-900
          font-semibold outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-300 transition"
      >
        <input
          ref={ref}
          value={value}
          readOnly
          className="w-full outline-none bg-transparent text-slate-900 placeholder:text-slate-400 cursor-pointer"
          placeholder="เลือกวันเกิด"
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5 text-emerald-700 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10m-11 8h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </button>
    )
  );
  BirthInput.displayName = 'BirthInput';

  return (
    <div className="min-h-screen pt-28 md:pt-32 bg-gradient-to-b from-white via-slate-50 to-emerald-50/40 text-slate-900 pb-20">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-56 bg-gradient-to-b from-emerald-100/45 to-transparent blur-3xl" />

      <div className="relative max-w-6xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-10 md:pt-14">
          {/* Left: info / guideline */}
          <div className="hidden lg:block lg:col-span-5">
            <div className="rounded-[28px] border border-slate-200 bg-white/70 backdrop-blur p-8 shadow-[0_20px_60px_-45px_rgba(2,6,23,0.55)]">
              <div className="text-xs font-semibold tracking-widest text-emerald-700">
                REGISTER
              </div>
              <div className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900">
                สร้างบัญชีใหม่
              </div>
              <div className="mt-3 text-slate-600 leading-relaxed">
                กรอกข้อมูลให้ครบเพื่อเริ่มใช้งานระบบได้ทันที พร้อมระบบเติมที่อยู่จากรหัสไปรษณีย์
              </div>

              <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
                <div className="text-sm font-extrabold text-slate-900">
                  เงื่อนไขรหัสผ่าน
                </div>
                <ul className="mt-3 space-y-2 text-sm text-slate-600 list-disc pl-5">
                  <li>อย่างน้อย 6 ตัวอักษร</li>
                  <li>ต้องมีตัวอักษรภาษาอังกฤษ (a-z)</li>
                  <li>ต้องมีตัวเลข (0-9)</li>
                  <li>ห้ามมีอักษรภาษาไทย</li>
                </ul>
              </div>

              <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
                <div className="text-sm font-extrabold text-slate-900">
                  หมายเหตุ
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  รูปโปรไฟล์เป็นตัวเลือก (ไม่บังคับ) • วันเกิดใช้เพื่อยืนยันตัวตนในอนาคต
                </div>
              </div>
            </div>
          </div>

          {/* Right: form */}
          <div className="lg:col-span-7">
            <div className="rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_60px_-45px_rgba(2,6,23,0.55)] overflow-hidden">
              {/* Header */}
              <div className="px-7 pt-7 pb-6 border-b border-slate-100">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3.5 py-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-[11px] font-extrabold tracking-wide text-emerald-800">
                    NEW ACCOUNT
                  </span>
                </div>

                <div className="mt-4">
                  <div className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
                    สมัครสมาชิก
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    กรอกข้อมูลให้ครบเพื่อสร้างบัญชีใหม่
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="px-7 py-6 space-y-8">
                {/* Profile */}
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/40 p-5">
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16 rounded-full overflow-hidden border border-slate-200 bg-white">
                      <img
                        src={profilePreview || '/default-profile.png'}
                        className="w-full h-full object-cover"
                        alt="profile"
                      />
                    </div>

                    <div>
                      <div className="text-sm font-extrabold text-slate-900">
                        รูปโปรไฟล์ (ไม่บังคับ)
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        แนะนำ: 1:1 • ไฟล์รูปทั่วไปได้
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="profile-upload"
                      className="inline-flex items-center justify-center h-11 px-4 rounded-2xl border border-slate-200 bg-white font-extrabold text-slate-900 hover:bg-slate-50 transition cursor-pointer"
                    >
                      เลือกรูป
                    </label>

                    {profilePreview && (
                      <button
                        type="button"
                        onClick={() => {
                          if (profilePreview) {
                            try { URL.revokeObjectURL(profilePreview); } catch {}
                          }
                          setProfilePreview(null);
                          setProfileFile(null);
                        }}
                        className="inline-flex items-center justify-center h-11 px-4 rounded-2xl border border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50 transition"
                      >
                        ลบรูป
                      </button>
                    )}

                    <input
                      id="profile-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setProfileFile(file);
                          setProfilePreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field
                    label="ชื่อผู้ใช้ (Username)"
                    required
                  >
                    <input
                      type="text"
                      name="Cusername"
                      required
                      value={form.Cusername}
                      onChange={handleChange}
                      className={inputCls}
                      placeholder="กรอกชื่อผู้ใช้"
                    />
                  </Field>

                  <Field
                    label="ชื่อจริง - นามสกุล"
                    required
                  >
                    <input
                      type="text"
                      name="Cname"
                      required
                      value={form.Cname}
                      onChange={handleChange}
                      className={inputCls}
                      placeholder="กรอกชื่อจริง - นามสกุล"
                    />
                  </Field>

                  <Field label="รหัสผ่าน" required hint={
                    <span className="text-[11px] text-slate-500">
                      ต้องมีอังกฤษ+ตัวเลข และอย่างน้อย 6 ตัว
                    </span>
                  }>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="Cpassword"
                        required
                        value={form.Cpassword}
                        onChange={handleChange}
                        className={`${inputCls} pr-12`}
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
                  </Field>

                  <Field label="ยืนยันรหัสผ่าน" required>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        required
                        value={form.confirmPassword}
                        onChange={handleChange}
                        className={`${inputCls} pr-12`}
                        placeholder="ยืนยันรหัสผ่าน"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-3 grid place-items-center w-10 text-slate-500 hover:text-slate-900 transition"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? 'ซ่อนยืนยันรหัสผ่าน' : 'แสดงยืนยันรหัสผ่าน'}
                      >
                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </Field>

                  <Field label="เบอร์โทรศัพท์" required>
                    <input
                      type="text"
                      name="Cphone"
                      required
                      value={form.Cphone}
                      onChange={handleChange}
                      className={inputCls}
                      placeholder="กรอกเบอร์โทรศัพท์"
                    />
                  </Field>

                  <Field label="วันเกิด" required>
                    <ReactDatePicker
                      selected={birthDate}
                      onChange={(date) => {
                        setBirthDate(date);
                        setForm({
                          ...form,
                          Cbirth: date?.toISOString().split('T')[0] || '',
                        });
                      }}
                      dateFormat="yyyy-MM-dd"
                      maxDate={new Date()}
                      showYearDropdown
                      showMonthDropdown
                      dropdownMode="select"
                      customInput={<BirthInput />}
                    />
                  </Field>

                  <Field label="รหัสไปรษณีย์" required hint={
                    <span className="text-[11px] text-slate-500">
                      กรอกครบ 5 หลัก ระบบจะเติมที่อยู่ให้
                    </span>
                  }>
                    <input
                      type="text"
                      name="Czipcode"
                      required
                      value={form.Czipcode}
                      onChange={handleChange}
                      className={inputCls}
                      placeholder="เช่น 10160"
                    />
                  </Field>

                  <Field label="บ้านเลขที่ / หมู่บ้าน" required>
                    <input
                      type="text"
                      name="Caddress"
                      required
                      value={form.Caddress}
                      onChange={handleChange}
                      className={inputCls}
                      placeholder="เช่น 99/1 หมู่บ้าน..."
                    />
                  </Field>

                  <Field label="ตำบล">
                    <input
                      type="text"
                      name="Csubdistrict"
                      value={form.Csubdistrict}
                      onChange={handleChange}
                      className={inputCls}
                      placeholder="ตำบล"
                    />
                  </Field>

                  <Field label="อำเภอ">
                    <input
                      type="text"
                      name="Cdistrict"
                      value={form.Cdistrict}
                      onChange={handleChange}
                      className={inputCls}
                      placeholder="อำเภอ"
                    />
                  </Field>

                  <Field label="จังหวัด" className="sm:col-span-2">
                    <input
                      type="text"
                      name="Cprovince"
                      value={form.Cprovince}
                      onChange={handleChange}
                      className={inputCls}
                      placeholder="จังหวัด"
                    />
                  </Field>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`h-12 rounded-2xl px-6 font-extrabold text-white shadow-lg transition w-full
                      ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800'}`}
                  >
                    {loading ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
                  </button>

                  <button
                    type="button"
                    onClick={resetForm}
                    className="h-12 rounded-2xl px-6 font-extrabold border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 transition w-full"
                  >
                    ล้างค่า
                  </button>
                </div>

                <div className="text-[11px] text-slate-500 leading-relaxed">
                  สมัครสมาชิกแล้ว?{' '}
                  <a href="/login" className="font-extrabold text-emerald-700 hover:underline">
                    ไปหน้าเข้าสู่ระบบ
                  </a>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- UI helpers ---------- */
const inputCls =
  'w-full h-12 px-4 rounded-2xl border border-slate-200 bg-white text-slate-900 font-semibold ' +
  'outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-300 transition ' +
  'placeholder:text-slate-400';

function Field({
  label,
  required,
  hint,
  className = '',
  children,
}: {
  label: string;
  required?: boolean;
  hint?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <div className="flex items-end justify-between gap-3 mb-1.5">
        <label className="block text-sm font-semibold text-slate-700">
          {label} {required && <span className="text-rose-600">*</span>}
        </label>
        {hint}
      </div>
      {children}
    </div>
  );
}
