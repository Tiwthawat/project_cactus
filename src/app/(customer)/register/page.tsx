'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FaEye, FaEyeSlash } from "react-icons/fa";

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
    Cname: '', Cusername: '', Cpassword: '', confirmPassword: '',
    Cphone: '', Cbirth: '', Czipcode: '',
    Caddress: '', Csubdistrict: '', Cdistrict: '', Cprovince: ''
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
      try { URL.revokeObjectURL(profilePreview); } catch (e) { /* no-op */ }
    }

    setForm({
      Cname: '', Cusername: '', Cpassword: '', confirmPassword: '',
      Cphone: '', Cbirth: '', Czipcode: '',
      Caddress: '', Csubdistrict: '', Cdistrict: '', Cprovince: ''
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
          const res = await fetch(`http://localhost:3000/zipcode/${form.Czipcode}`);
          const data = await res.json();
          if (res.ok) {
            setForm(prev => ({
              ...prev,
              Csubdistrict: data.subdistrict || '',
              Cdistrict: data.district || '',
              Cprovince: data.province || ''
            }));
          } else {
            setForm(prev => ({ ...prev, Csubdistrict: '', Cdistrict: '', Cprovince: '' }));
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
    if (form.Cpassword !== form.confirmPassword) return alert('❌ ยืนยันรหัสผ่านไม่ตรงกัน');

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
      <div
        className="w-full flex items-center px-4 py-3 border border-gray-300 rounded-xl bg-white shadow-sm
        cursor-pointer hover:border-emerald-400 transition
        focus-within:ring-2 focus-within:ring-emerald-500"
        onClick={onClick}
      >
        <input
          ref={ref}
          value={value}
          readOnly
          className="flex-1 outline-none bg-transparent text-gray-700"
          placeholder="เลือกวันเกิด"
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5 text-emerald-600"
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
      </div>
    )
  );
  BirthInput.displayName = "BirthInput";

  return (
    <div className="min-h-screen pt-28 bg-gradient-to-br from-green-50 to-emerald-50 flex justify-center items-start pb-20">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl p-8 md:p-12">

        <div className="text-center mb-10">
          <div className="inline-block bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-full text-sm font-semibold mb-4">
            สมัครสมาชิก
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-3">
            สร้างบัญชีใหม่
          </h1>
          <div className="w-20 h-1 bg-gradient-to-r from-green-500 to-emerald-500 mx-auto rounded-full"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">

          <div className="flex justify-center">
            <div className="flex flex-col items-center border-2 border-emerald-300 rounded-2xl p-6 w-full max-w-xs bg-emerald-50">
              <span className="mb-3 text-emerald-800 font-medium">รูปโปรไฟล์</span>

              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-emerald-300 shadow">
                <img
                  src={profilePreview || "/default-profile.png"}
                  className="w-full h-full object-cover"
                />
              </div>

              <label htmlFor="profile-upload" className="mt-4">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-5 py-2 rounded-xl cursor-pointer hover:shadow-lg transition">
                  เลือกรูป
                </div>
              </label>

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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ชื่อผู้ใช้ (Username) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="Cusername"
                required
                value={form.Cusername}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white shadow-sm
                 focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="กรอกชื่อผู้ใช้"
              />
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ชื่อจริง - นามสกุล <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="Cname"
                required
                value={form.Cname}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white shadow-sm
                 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                รหัสผ่าน <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="Cpassword"
                  required
                  value={form.Cpassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white shadow-sm
      focus:ring-2 focus:ring-emerald-500 outline-none pr-12"
                />

                <span
                  className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div><p className="mt-1 text-xs text-gray-400">
                ตัวอย่าง:  รหัสผ่านต้องมีอย่างน้อย 6 ตัว
                รหัสผ่านต้องมีตัวอักษรภาษาอังกฤษ
                รหัสผ่านต้องมีตัวเลข
                รหัสผ่านห้ามมีอักษรภาษาไทย

              </p>

            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ยืนยันรหัสผ่าน <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  required
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white shadow-sm
      focus:ring-2 focus:ring-emerald-500 outline-none pr-12"
                />

                <span
                  className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-gray-600"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                เบอร์โทรศัพท์ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="Cphone"
                required
                value={form.Cphone}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white shadow-sm
                 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* Zipcode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                รหัสไปรษณีย์ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="Czipcode"
                required
                value={form.Czipcode}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white shadow-sm
                 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                บ้านเลขที่ / หมู่บ้าน <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="Caddress"
                required
                value={form.Caddress}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white shadow-sm
                 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* Subdistrict */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ตำบล
              </label>
              <input
                type="text"
                name="Csubdistrict"
                value={form.Csubdistrict}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white shadow-sm
                 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* District */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                อำเภอ
              </label>
              <input
                type="text"
                name="Cdistrict"
                value={form.Cdistrict}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white shadow-sm
                 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* Province */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                จังหวัด
              </label>
              <input
                type="text"
                name="Cprovince"
                value={form.Cprovince}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white shadow-sm
                 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* Birthdate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                วันเกิด <span className="text-red-500">*</span>
              </label>

              <ReactDatePicker
                selected={birthDate}
                onChange={(date) => {
                  setBirthDate(date);
                  setForm({ ...form, Cbirth: date?.toISOString().split("T")[0] || "" });
                }}
                dateFormat="yyyy-MM-dd"
                maxDate={new Date()}
                showYearDropdown
                showMonthDropdown
                dropdownMode="select"
                customInput={<BirthInput />}
              />
            </div>
          </div>

          <div className="flex justify-center gap-6">
            <button
              type="submit"
              disabled={loading}
              className={`px-8 py-3 rounded-xl font-semibold text-white shadow-md transition ${loading
                ? "bg-emerald-400 cursor-not-allowed"
                : "bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-lg"
                }`}
            >
              {loading ? "กำลังสมัคร..." : "สมัครสมาชิก"}
            </button>

            <button
              type="button"
              onClick={resetForm}
              className="px-8 py-3 rounded-xl font-semibold border border-emerald-500 text-emerald-700 hover:bg-emerald-50 transition"
            >
              ล้างค่า
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}