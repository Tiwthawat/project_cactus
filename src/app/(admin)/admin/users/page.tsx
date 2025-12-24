'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type UserStatus = 'user' | 'banned';

interface Customer {
  Cid: number;
  Cname: string;
  Cphone: string;
  Cstatus: UserStatus;
  orderCount: number;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetch('http://localhost:3000/customers')
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => console.error('โหลดรายชื่อลูกค้าล้มเหลว:', err));
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("คุณแน่ใจว่าต้องการลบผู้ใช้นี้?")) return;
    await fetch(`http://localhost:3000/customers/delete/${id}`, {
      method: "PUT",
    });
    setUsers(prev => prev.filter(user => user.Cid !== id));
  };

  const toggleBan = async (id: number, status: UserStatus) => {
    const newStatus: UserStatus = status === 'banned' ? 'user' : 'banned';

    const res = await fetch(`http://localhost:3000/customers/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Cstatus: newStatus }),
    });

    if (res.ok) {
      setUsers(prev => prev.map(u => u.Cid === id ? { ...u, Cstatus: newStatus } : u));
    } else {
      alert('เปลี่ยนสถานะไม่สำเร็จ');
    }
  };

  const handleViewOrders = (id: number) => {
    router.push(`/admin/users/${id}/orders`);
  };

  const filteredUsers = users.filter(user =>
    user.Cname.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (statusFilter === 'all' || user.Cstatus === statusFilter)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
      <div className="p-6 pt-8">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-block bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-full text-sm font-semibold mb-4">
            จัดการผู้ใช้
          </div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            👥 จัดการบัญชีลูกค้า
          </h1>
        </div>

        {/* Search & Filter Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-2 border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl shadow-md">
              🔍
            </div>
            <h2 className="text-2xl font-bold text-gray-800">ค้นหาและกรอง</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">ค้นหาชื่อลูกค้า:</label>
              <input
                type="text"
                placeholder="พิมพ์ชื่อลูกค้า..."
                className="w-full p-3 border-2 border-gray-200 rounded-xl bg-gray-50 focus:border-green-400 focus:outline-none transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">กรองตามสถานะ:</label>
              <select
                className="w-full p-3 border-2 border-gray-200 rounded-xl bg-gray-50 focus:border-green-400 focus:outline-none transition-colors text-lg font-semibold"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">👥 ทั้งหมด</option>
                <option value="user">✅ ผู้ใช้ปกติ</option>
                <option value="banned">🚫 ถูกแบน</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table Card */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                  <th className="p-4 text-left">รหัส</th>
                  <th className="p-4 text-left">ชื่อ</th>
                  <th className="p-4 text-center hidden md:table-cell">เบอร์โทร</th>
                  <th className="p-4 text-center">ออเดอร์</th>
                  <th className="p-4 text-center">สถานะ</th>
                  <th className="p-4 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.Cid} className="border-b border-gray-200 hover:bg-green-50 transition-colors">
                    <td className="p-4 font-mono text-sm bg-gray-50">
                      <Link href={`/admin/users/${user.Cid}/orders`} className="text-blue-600 hover:underline font-semibold">
                        {`usr:${String(user.Cid).padStart(4, '0')}`}
                      </Link>
                    </td>
                    <td className="p-4 font-semibold text-gray-800">{user.Cname}</td>
                    <td className="p-4 text-center text-gray-600 hidden md:table-cell">{user.Cphone}</td>
                    <td className="p-4 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-700 border-2 border-blue-300">
                          {user.orderCount} รายการ
                        </span>
                        <button
                          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
                          onClick={() => handleViewOrders(user.Cid)}
                        >
                          ดูคำสั่งซื้อ
                        </button>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${user.Cstatus === 'banned'
                        ? 'bg-red-100 text-red-700 border-2 border-red-300'
                        : 'bg-green-100 text-green-700 border-2 border-green-300'
                        }`}>
                        {user.Cstatus === 'banned' ? '🚫 ถูกแบน' : '✅ ปกติ'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex flex-col md:flex-row gap-2 justify-center">
                        <button
                          className={`px-4 py-2 rounded-lg text-white font-semibold transition-all duration-300 shadow-md hover:shadow-lg ${user.Cstatus === 'banned'
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                            : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
                            }`}
                          onClick={() => toggleBan(user.Cid, user.Cstatus)}
                        >
                          {user.Cstatus === 'banned' ? 'ปลดแบน' : 'แบน'}
                        </button>
                        <button
                          onClick={() => handleDelete(user.Cid)}
                          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
                        >
                          ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
