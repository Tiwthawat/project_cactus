'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import EditProfileModal from '../../component/EditProfileModal';
import ChangePasswordModal from '../../component/ChangePassword';
import Link from 'next/link';

interface UserInfo {
  Cid: number;
  Cname: string;
  Caddress: string;
  Csubdistrict: string;
  Cdistrict: string;
  Cprovince: string;
  Czipcode: string;
  Cusername: string;
  Cpassword: string;
  Cphone: string;
  Cstatus: string;
  Cdate: string;
  Cbirth: string;
  Cprofile: string | null;
}

const formatThaiDate = (isoDate: string) => {
  const date = new Date(isoDate);
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export default function MePage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const res = await fetch('http://localhost:3000/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) throw new Error('Unauthorized');
        const data = await res.json();

        setUser({
          ...data.user,
          Cpassword: '********',
        });

      } catch (err) {
        router.push('/login');
      }
    };

    fetchUser();
  }, [router]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-emerald-600 text-lg font-semibold">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4">

      <div className="mx-auto space-y-10">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-block bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-full text-sm font-semibold mb-4 shadow-lg">
            ข้อมูลส่วนตัว
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            บัญชีผู้ใช้งานของคุณ
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-green-500 to-emerald-500 mx-auto mt-3 rounded-full"></div>
        </div>

        <div className="grid gap-8 grid-cols-1 md:grid-cols-2">

          {/* Profile Card */}
          <div className="bg-white rounded-2xl shadow-xl border-2 border-emerald-100 p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl text-emerald-700 font-bold flex items-center gap-2">
                ข้อมูลผู้ใช้
              </h2>
              <button
                className="px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700 transition-all duration-300 shadow-md hover:shadow-lg font-semibold"
                onClick={() => setShowModal(true)}
              >
                ✏️ แก้ไขข้อมูล
              </button>
            </div>

            {/* Profile Image */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-36 h-36 rounded-full overflow-hidden shadow-2xl border-4 border-white ring-4 ring-emerald-200">
                  <img
                    src={user.Cprofile ? `http://localhost:3000/profiles/${user.Cprofile}` : '/default-profile.png'}
                    alt="โปรไฟล์"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* <InfoRow icon="🆔" label="รหัสผู้ใช้" value={user.Cid.toString()} /> */}
              <InfoRow icon="👤" label="ชื่อ-นามสกุล" value={user.Cname} />
              <InfoRow
                icon="📍"
                label="ที่อยู่"
                value={`${user.Caddress} ต.${user.Csubdistrict} อ.${user.Cdistrict} จ.${user.Cprovince} ${user.Czipcode}`}
                multiline
              />
              <InfoRow icon="🔑" label="ชื่อผู้ใช้" value={user.Cusername} />
              <InfoRow icon="🔒" label="รหัสผ่าน" value={user.Cpassword} />
              <InfoRow icon="📞" label="เบอร์โทร" value={user.Cphone} />
              <InfoRow icon="✅" label="สถานะบัญชี" value={user.Cstatus} badge />
              <InfoRow icon="📅" label="วันที่ลงทะเบียน" value={formatThaiDate(user.Cdate)} />
              <InfoRow icon="🎂" label="วันเกิด" value={formatThaiDate(user.Cbirth)} />
            </div>

            <button
              onClick={() => setShowPasswordModal(true)}
              className="mt-8 w-full bg-gradient-to-r from-emerald-600 to-green-700 text-white rounded-xl py-3.5 font-semibold hover:from-emerald-700 hover:to-green-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              🔒 เปลี่ยนรหัสผ่าน
            </button>
          </div>

          {/* Menu */}
          <div className="bg-white rounded-2xl shadow-xl border-2 border-emerald-100 p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">

            <h2 className="text-2xl font-bold text-emerald-700 mb-6 flex items-center gap-2">
              เมนูการใช้งาน
            </h2>

            <ul className="space-y-3">

              <li>
                <Link
                  href="/me/my-bidding"
                  className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 hover:from-emerald-100 hover:to-green-100 text-emerald-700 transition-all duration-300 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 group"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">📦</span>
                  <span className="font-semibold">รายการประมูลของฉัน</span>
                </Link>
              </li>

              <li>
                <Link
                  href="/me/orders"
                  className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 hover:from-emerald-100 hover:to-green-100 text-emerald-700 transition-all duration-300 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 group"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">🧾</span>
                  <span className="font-semibold">ประวัติคำสั่งซื้อ</span>
                </Link>
              </li>

              <li>
                <Link
                  href="/me/auction-wins"
                  className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 hover:from-emerald-100 hover:to-green-100 text-emerald-700 transition-all duration-300 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 group"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">🏆</span>
                  <span className="font-semibold">สินค้าที่ชนะประมูล</span>
                </Link>
              </li>

              <li className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 text-gray-400 cursor-not-allowed opacity-60">
                <span className="text-2xl">❌</span>
                <div className="flex-1">
                  <span className="font-semibold block">รายการยกเลิกสินค้า</span>
                  <span className="text-xs">(เร็วๆ นี้)</span>
                </div>
              </li>

              <li className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 text-gray-400 cursor-not-allowed opacity-60">
                <span className="text-2xl">💰</span>
                <div className="flex-1">
                  <span className="font-semibold block">ประวัติแจ้งชำระเงิน</span>
                  <span className="text-xs">(เร็วๆ นี้)</span>
                </div>
              </li>

            </ul>

          </div>

        </div>
      </div>

      {showModal && (
        <EditProfileModal user={user} onClose={() => setShowModal(false)} />
      )}

      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}

    </div>
  );
}

// InfoRow Component
function InfoRow({
  icon,
  label,
  value,
  multiline = false,
  badge = false
}: {
  icon: string;
  label: string;
  value: string;
  multiline?: boolean;
  badge?: boolean;
}) {
  return (
    <div className={`flex gap-3 pb-4 border-b border-emerald-50 ${multiline ? 'items-start' : 'items-center'}`}>
      {/* ถ้าอยากใส่ไอคอนให้เอาคอมเมนต์ข้างล่างออก */}
      {/* <span className="text-2xl">{icon}</span> */}
      <div className="flex-1">
        <p className="text-xs text-emerald-700 font-semibold mb-1 uppercase tracking-wide">{label}</p>
        {badge ? (
          <span className="inline-block bg-gradient-to-r from-emerald-500 to-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-md">
            {value}
          </span>
        ) : (
          <p className={`text-gray-800 font-semibold ${multiline ? 'leading-relaxed' : ''}`}>
            {value}
          </p>
        )}
      </div>
    </div>
  );
}