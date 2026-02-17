'use client';
import React, { useEffect, useState } from 'react';
import { apiFetch } from '../lib/apiFetch';

interface UserInfo {
  Csubdistrict: string;
  Cdistrict: string;
  Cprovince: string;
  Czipcode: string;
  Cid: number;
  Cname: string;
  Caddress: string;
  Cusername: string;
  Cpassword: string;
  Cphone: string;
  Cstatus: string;
  Cdate: string;
  Cbirth: string;
  Cprofile: string | null;
}

interface Props {
  user: UserInfo;
  onClose: () => void;
}

export default function EditProfileModal({ user, onClose }: Props) {
  const [formData, setFormData] = useState({
    Cname: user.Cname,
    Cphone: user.Cphone,
    Caddress: user.Caddress,
    Csubdistrict: user.Csubdistrict,
    Cdistrict: user.Cdistrict,
    Cprovince: user.Cprovince,
    Czipcode: user.Czipcode,
    Cprofile: user.Cprofile || null,
  });

  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  useEffect(() => {
    const fetchAddress = async () => {
      if ((formData.Czipcode ?? '').length === 5) {
        try {
          const res = await fetch(`http://localhost:3000/zipcode/${formData.Czipcode}`);
          if (res.ok) {
            const data = await res.json();
            setFormData((prev) => ({
              ...prev,
              Csubdistrict: data.subdistrict || '',
              Cdistrict: data.district || '',
              Cprovince: data.province || '',
            }));
          }
        } catch (err) {
          console.error("โหลดข้อมูลที่อยู่ล้มเหลว", err);
        }
      }
    };
    fetchAddress();
  }, [formData.Czipcode]);

  const handleSubmit = async () => {
    const token = localStorage.getItem('token');
    if (!token) return alert("กรุณาเข้าสู่ระบบใหม่");

    const form = new FormData();
    form.append("Cid", user.Cid.toString());
    form.append("Cname", formData.Cname);
    form.append("Cphone", formData.Cphone);
    form.append("Caddress", formData.Caddress);
    form.append("Csubdistrict", formData.Csubdistrict);
    form.append("Cdistrict", formData.Cdistrict);
    form.append("Cprovince", formData.Cprovince);
    form.append("Czipcode", formData.Czipcode);

    if (profileFile) form.append("profile", profileFile);

    const res = await apiFetch("/update", { method:"PATCH", body: form });


    if (res.ok) {
      alert("อัปเดตสำเร็จ");
      onClose();
      location.reload();
    } else {
      alert("อัปเดตไม่สำเร็จ");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl p-8 relative animate-fadeIn">

        {/* ปุ่มปิด */}
        <button
          className="absolute top-4 right-4 text-gray-600 hover:text-red-500 text-3xl font-bold"
          onClick={onClose}
        >
          ×
        </button>

        <h2 className="text-2xl font-bold text-emerald-700 mb-6 text-center">
          ✏️ แก้ไขข้อมูลส่วนตัว
        </h2>

        {/* รูปโปรไฟล์ */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-32 h-32 rounded-full overflow-hidden shadow-lg ring-4 ring-emerald-200">
            <img
              src={previewUrl || (user.Cprofile ? `http://localhost:3000/profiles/${user.Cprofile}` : `/default-profile.png`)}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>

          <label className="mt-4 cursor-pointer bg-emerald-600 text-white px-4 py-2 rounded-lg shadow hover:bg-emerald-700 transition">
            เปลี่ยนรูปโปรไฟล์
            <input type="file" accept="image/*" onChange={handleProfileChange} className="hidden" />
          </label>
        </div>

        {/* ฟอร์มข้อมูล */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {[
            { label: "ชื่อ-นามสกุล", name: "Cname" },
            { label: "เบอร์โทรศัพท์", name: "Cphone" },
            { label: "บ้านเลขที่", name: "Caddress" },
            { label: "รหัสไปรษณีย์", name: "Czipcode" },
            { label: "ตำบล", name: "Csubdistrict" },
            { label: "อำเภอ", name: "Cdistrict" },
            { label: "จังหวัด", name: "Cprovince" },
          ].map((field) => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
              </label>
              <input
                name={field.name}
                value={(formData as any)[field.name]}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-xl bg-white text-gray-800 
                focus:ring-2 focus:ring-emerald-400 focus:border-emerald-500 transition"
              />
            </div>
          ))}

        </div>

        {/* ปุ่มบันทึก */}
        <div className="mt-8 text-center">
          <button
            onClick={handleSubmit}
            className="w-full md:w-1/2 bg-emerald-600 text-white py-3 rounded-xl shadow 
            font-semibold hover:bg-emerald-700 transition text-lg"
          >
            บันทึก
          </button>
        </div>

      </div>
    </div>
  );
}
