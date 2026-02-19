'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import EditProfileModal from '../../component/EditProfileModal';
import ChangePasswordModal from '../../component/ChangePassword';
import { apiFetch } from '@/app/lib/apiFetch';

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

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

const formatThaiDate = (isoDate: string) => {
  if (!isoDate) return '-';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const getProfileUrl = (filename: string | null) => {
  if (!filename) return '/default-profile.png';
  // ถ้า backend เสิร์ฟ /profiles/:file
  if (filename.startsWith('http')) return filename;
  return `${API}/profiles/${filename}`;
};

export default function MePage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const res = await apiFetch(`${API}/me`);
        if (!res.ok) throw new Error('Unauthorized');
        const data = await res.json();

        setUser({
          ...data.user,
          Cpassword: '********',
        });
      } catch {
        router.push('/login');
      }
    };

    fetchUser();
  }, [router]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border border-emerald-100 bg-white/80 backdrop-blur p-8 shadow-xl">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-emerald-600" />
          </div>
          <div className="mt-4 text-center text-sm font-semibold text-emerald-700">
            กำลังโหลดข้อมูลบัญชี...
          </div>
        </div>
      </div>
    );
  }

  const fullAddress = [
    user.Caddress,
    user.Csubdistrict ? `ต.${user.Csubdistrict}` : '',
    user.Cdistrict ? `อ.${user.Cdistrict}` : '',
    user.Cprovince ? `จ.${user.Cprovince}` : '',
    user.Czipcode || '',
  ]
    .filter((x) => typeof x === 'string' && x.trim().length > 0)
    .join(' ');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50 text-black px-4">
      <div className="max-w-4xl mx-auto pt-16 pb-16">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/70 px-4 py-2 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-600" />
            <span className="text-xs font-extrabold tracking-wide text-emerald-800">
              ACCOUNT PROFILE
            </span>
          </div>

          <h1 className="mt-4 text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">
            บัญชีผู้ใช้งาน
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            ข้อมูลนี้ใช้สำหรับจัดส่งและการยืนยันคำสั่งซื้อ
          </p>
        </div>

        {/* Main Card */}
        <div className="rounded-3xl border border-emerald-100 bg-white shadow-xl overflow-hidden">
          {/* Card Top */}
          <div className="px-6 md:px-10 py-6 md:py-7 border-b border-emerald-50 bg-gradient-to-r from-emerald-50/70 via-white to-emerald-50/70">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl overflow-hidden border border-emerald-100 bg-white shadow-sm">
                    <img
                      src={getProfileUrl(user.Cprofile)}
                      alt="โปรไฟล์"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <span className="absolute -bottom-2 -right-2 inline-flex items-center rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-[11px] font-extrabold text-emerald-800 shadow-sm">
                    {user.Cstatus || 'active'}
                  </span>
                </div>

                <div className="min-w-0">
                  <div className="text-lg md:text-xl font-extrabold text-gray-900 line-clamp-1">
                    {user.Cname}
                  </div>
                  <div className="mt-1 text-sm text-gray-600">
                    Username: <span className="font-bold text-gray-900">{user.Cusername}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowModal(true)}
                  className="h-11 px-5 rounded-2xl border-2 border-emerald-500 bg-white text-emerald-700 font-extrabold hover:bg-emerald-50 transition"
                  type="button"
                >
                  แก้ไขข้อมูล
                </button>

                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="h-11 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 text-white font-extrabold shadow-lg hover:shadow-xl hover:from-emerald-700 hover:to-green-700 transition"
                  type="button"
                >
                  เปลี่ยนรหัสผ่าน
                </button>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="px-6 md:px-10 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
              <InfoRow label="ชื่อ-นามสกุล" value={user.Cname} />
              <InfoRow label="เบอร์โทรศัพท์" value={user.Cphone || '-'} />

              <InfoRow label="ที่อยู่จัดส่ง" value={fullAddress || '-'} multiline />
              <InfoRow label="รหัสไปรษณีย์" value={user.Czipcode || '-'} />

              <InfoRow label="วันเกิด" value={formatThaiDate(user.Cbirth)} />
              <InfoRow label="วันที่ลงทะเบียน" value={formatThaiDate(user.Cdate)} />

              <InfoRow label="รหัสผ่าน" value={user.Cpassword} />
              <InfoRow label="สถานะบัญชี" value={user.Cstatus || '-'} badge />
            </div>

            <div className="mt-8 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 text-sm text-gray-700">
              หากต้องการแก้ที่อยู่/เบอร์โทร ให้กด “แก้ไขข้อมูล” เพื่อให้ระบบใช้ข้อมูลใหม่กับการจัดส่ง
            </div>
          </div>
        </div>
      </div>

      {showModal && <EditProfileModal user={user} onClose={() => setShowModal(false)} />}
      {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}
    </div>
  );
}

function InfoRow({
  label,
  value,
  multiline = false,
  badge = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
  badge?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="text-[11px] font-extrabold tracking-wide text-emerald-800 uppercase">
        {label}
      </div>

      <div className="mt-2">
        {badge ? (
          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-extrabold text-emerald-800">
            {value}
          </span>
        ) : (
          <div
            className={[
              'text-gray-900 font-bold',
              multiline ? 'leading-relaxed whitespace-pre-line' : 'line-clamp-1',
            ].join(' ')}
            title={value}
          >
            {value}
          </div>
        )}
      </div>
    </div>
  );
}
