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
        const raw = data.user;

        setUser({
          Cid: raw.Cid,
          Cname: raw.Cname,
          Caddress: raw.Caddress,
          Csubdistrict: raw.Csubdistrict, // ✅ ต้องมี
          Cdistrict: raw.Cdistrict,       // ✅
          Cprovince: raw.Cprovince,       // ✅
          Czipcode: raw.Czipcode,         // ✅
          Cusername: raw.Cusername,
          Cpassword: '********',
          Cphone: raw.Cphone,
          Cstatus: raw.Cstatus,
          Cdate: raw.Cdate,
          Cbirth: raw.Cbirth,
          Cprofile: raw.Cprofile

        });


      } catch (err) {
        console.error('ไม่สามารถโหลดข้อมูลผู้ใช้:', err);
        router.push('/login');
      }
    };

    fetchUser();
  }, [router]);

  if (!user) return <div>Loading...</div>;


  return (
    <div className="min-h-screen bg-gray-100 px-4 py-8">
      <div className="max-w-4xl mx-auto grid gap-8 grid-cols-1 md:grid-cols-2">
        {/* ข้อมูลส่วนตัว */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg text-gray-800 font-semibold border-b pb-2">ข้อมูลผู้ใช้ </h2>
            <button
              className="text-blue-600 hover:underline text-sm"
              onClick={() => setShowModal(true)}
            >
              ✏️ แก้ไข
            </button>
          </div>

          {/* ✅ รูปโปรไฟล์ */}
          <div className="flex items-center justify-center mb-4">
            <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-gray-300">
              <img
                src={user.Cprofile ? `http://localhost:3000/profiles/${user.Cprofile}` : '/default-profile.png'}
                alt="โปรไฟล์"
                className="w-full h-full object-cover"
              />

            </div>
          </div>


          <div className="space-y-2 text-sm text-gray-800">
            <div><strong>รหัสผู้ใช้:</strong> {user.Cid}</div>
            <div><strong>ชื่อ-นามสกุล:</strong> {user.Cname}</div>
            <div><strong>ที่อยู่:</strong> {user.Caddress} ต.{user.Csubdistrict} อ.{user.Cdistrict} จ.{user.Cprovince} {user.Czipcode}</div>
            <div><strong>ชื่อผู้ใช้:</strong> {user.Cusername}</div>
            <div><strong>รหัสผ่าน:</strong> {user.Cpassword}</div>
            <div><strong>เบอร์โทร:</strong> {user.Cphone}</div>
            <div><strong>สถานะบัญชี:</strong> {user.Cstatus}</div>
            <div><strong>วันที่ลงทะเบียน:</strong> {formatThaiDate(user.Cdate)}</div>
            <div><strong>วันเกิด:</strong> {formatThaiDate(user.Cbirth)}</div>
          </div><br />

          <button onClick={() => setShowPasswordModal(true)} className="text-blue-600 hover:underline">
            เปลี่ยนรหัสผ่าน
          </button>
        </div>


        {/* เมนูเพิ่มเติม */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold border-b pb-2 mb-3">เมนูการใช้งาน</h2>
          <ul className="space-y-1 text-sm text-gray-800 list-disc list-inside">
            

            
            <li>
              <Link href="/me/my-bidding" className="text-blue-600 hover:underline">
                รายการประมูลสินค้า
              </Link>
            </li>
            <li>
              <Link href="/me/orders" className="text-blue-600 hover:underline">
                ดูประวัติคำสั่งซื้อ
              </Link>
            </li>

            <li>
              <Link href="/me/auction-wins" className="text-blue-600 hover:underline">
                สินค้าที่ชนะแล้ว
              </Link>
            </li>
            <li>รายการยกเลิกสินค้า</li>
            <li>ประวัติการแจ้งการชำระเงิน</li>
          </ul>
        </div>
      </div>

      {/* Modal แก้ไขข้อมูล */}
      {showModal && user && (
        <EditProfileModal
          user={user}
          onClose={() => setShowModal(false)}
        />
      )}
      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}

    </div>

  );
}
