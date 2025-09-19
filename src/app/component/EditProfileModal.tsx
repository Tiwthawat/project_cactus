'use client';
import React, { useEffect, useState } from 'react';

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
        } catch (error) {
          console.error('❌ โหลดที่อยู่ไม่สำเร็จ:', error);
        }
      }
    };

    fetchAddress();
  }, [formData.Czipcode]);

  const handleSubmit = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('กรุณาเข้าสู่ระบบอีกครั้ง');
    return;
  }

  try {
    const form = new FormData();
    form.append('Cid', user.Cid.toString());
    form.append('Cname', formData.Cname);
    form.append('Cphone', formData.Cphone);
    form.append('Caddress', formData.Caddress);
    form.append('Csubdistrict', formData.Csubdistrict);
    form.append('Cdistrict', formData.Cdistrict);
    form.append('Cprovince', formData.Cprovince);
    form.append('Czipcode', formData.Czipcode);
    if (profileFile) {
  form.append('profile', profileFile);
}


    const res = await fetch('http://localhost:3000/update', {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    });

    if (res.ok) {
      alert('อัปเดตสำเร็จ');
      onClose();
      location.reload();
    } else {
      alert('อัปเดตไม่สำเร็จ');
    }
  } catch (err) {
    console.error(err);
    alert('เกิดข้อผิดพลาด');
  }
};


  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl shadow w-full max-w-2xl relative">
        {/* ปุ่มปิด */}
        <button
          className="absolute top-2 right-3 text-xl font-bold text-gray-700 hover:text-red-500"
          onClick={onClose}
        >
          ×
        </button>

        <h2 className="text-lg font-semibold  text-black mb-4">แก้ไขข้อมูลส่วนตัว</h2>

        {/* ฟอร์ม */}
        <div className="col-span-2">
  <label className="block text-sm font-medium text-gray-700 mb-1">รูปโปรไฟล์</label>
  <input
    type="file"
    accept="image/*"
    onChange={handleProfileChange}
    className="w-full p-2 border border-gray-300 rounded bg-white text-black"
  />
  {previewUrl && (
    <img
      src={previewUrl}
      alt="Preview"
      className="mt-2 w-28 h-28 object-cover rounded-full border"
    />
  )}
</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ-นามสกุล</label>
            <input
              name="Cname"
              value={formData.Cname}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded bg-white text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทรศัพท์</label>
            <input
              name="Cphone"
              value={formData.Cphone}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded bg-white text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">บ้านเลขที่</label>
            <input
              name="Caddress"
              value={formData.Caddress}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded bg-white text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">รหัสไปรษณีย์</label>
            <input
              name="Czipcode"
              value={formData.Czipcode}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded bg-white text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ตำบล</label>
            <input
              name="Csubdistrict"
              value={formData.Csubdistrict}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded bg-white text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">อำเภอ</label>
            <input
              name="Cdistrict"
              value={formData.Cdistrict}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded bg-white text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">จังหวัด</label>
            <input
              name="Cprovince"
              value={formData.Cprovince}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded bg-white text-black"
            />
          </div>
        </div>


        <div className="mt-6 text-right">
          <button
            onClick={handleSubmit}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            บันทึกการเปลี่ยนแปลง
          </button>
        </div>
      </div>
    </div>
  );
}