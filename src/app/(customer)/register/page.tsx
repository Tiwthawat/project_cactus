'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';


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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setForm({
      Cname: '', Cusername: '', Cpassword: '', confirmPassword: '',
      Cphone: '', Cbirth: '', Czipcode: '',
      Caddress: '', Csubdistrict: '', Cdistrict: '', Cprovince: ''
    });
    setBirthDate(null);
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

  return (
    <div className="max-w-4xl mx-auto pt-28 p-6">
      <h2 className="text-2xl font-bold text-center mb-6">สมัครสมาชิก</h2>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="flex justify-center">
          <div className="flex flex-col items-center border-2 border-dashed border-gray-300 rounded-xl p-4 w-full max-w-xs bg-gray-50">
            <span className="mb-2 text-gray-700">รูปโปรไฟล์</span>
            <div className="w-36 h-36 rounded-full overflow-hidden border-2 border-gray-300 bg-white">
              <img
                src={profilePreview || '/default-profile.png'}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            <label htmlFor="profile-upload" className="mt-3">
              <div className="bg-red-600 text-white px-4 py-1 rounded cursor-pointer hover:bg-red-700 text-sm font-medium">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { name: "Cusername", placeholder: "* username" },
            { name: "Cname", placeholder: "* ชื่อจริง - นามสกุล" },
            { name: "Cpassword", type: "password", placeholder: "* รหัสผ่าน" },
            { name: "confirmPassword", type: "password", placeholder: "* ยืนยันรหัสผ่าน" },
            { name: "Cphone", placeholder: "* เบอร์โทรศัพท์" },
            { name: "Czipcode", placeholder: "* รหัสไปรษณีย์" },
            { name: "Caddress", placeholder: "* บ้านเลขที่ / หมู่บ้าน" },
            { name: "Csubdistrict", placeholder: "แขวง/ตำบล" },
            { name: "Cdistrict", placeholder: "เขต/อำเภอ" },
            { name: "Cprovince", placeholder: "จังหวัด" },
          ].map(({ name, placeholder, type = "text" }) => (
            <input
              key={name}
              type={type}
              name={name}
              required
              placeholder={placeholder}
              value={(form as any)[name]}
              onChange={handleChange}
              className="bg-gray-100 border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          ))}

          {/* ✅ ช่องวันเกิด (ReactDatePicker) */}
          <ReactDatePicker
            selected={birthDate}
            onChange={(date) => {
              setBirthDate(date);
              setForm({ ...form, Cbirth: date?.toISOString().split('T')[0] || '' });
            }}
            dateFormat="yyyy-MM-dd"
            placeholderText="* เลือกวันเกิด"
            maxDate={new Date()}
            showMonthDropdown
            
            showYearDropdown
            dropdownMode="select" 
            yearDropdownItemNumber={75}
            customInput={
              <input
                readOnly
                className="input bg-gray-100"
                value={form.Cbirth}
                placeholder="เลือกวันเกิด"
                required
              />
            }
          />

        </div>

        <div className="flex justify-center gap-4 mt-6">
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-2 rounded-lg font-semibold border border-red-600 ${loading
              ? 'bg-red-300 text-white cursor-not-allowed'
              : 'bg-red-600 text-white hover:bg-red-700'
              }`}
          >
            {loading ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
          </button>
          <button
            type="button"
            onClick={resetForm}
            className="px-6 py-2 rounded-lg font-semibold border border-red-600 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            ล้างค่า
          </button>
        </div>
      </form>

    </div>
  );
}