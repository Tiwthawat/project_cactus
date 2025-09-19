'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';


interface Customer {
  Cid: number;
  Cname: string;
  Cphone: string;
  Cstatus: string;
  orderCount: number;
}

interface Order {
  Oid: number;
  Odate: string;
  Ostatus: string;
  Ototal: number;
  products: string; // หรือ Array<string> ถ้าเก็บเป็น JSON array จริง ๆ
}

export default function AdminUsersPage() {
  const router = useRouter();


  const [users, setUsers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  
const handleViewOrders = (id: number) => {
  router.push(`/admin/users/${id}/orders`);
};




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
    // ดึงข้อมูลใหม่ หรือ filter ทิ้งจาก list
    setUsers(prev => prev.filter(user => user.Cid !== id));
  };
  const [searchTerm, setSearchTerm] = useState('');


  const [statusFilter, setStatusFilter] = useState('all');


  const filteredUsers = users.filter(user =>
    user.Cname.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (statusFilter === 'all' || user.Cstatus === statusFilter)
  );



  return (
    <div className="p-6 text-black">
      <h1 className="text-2xl font-bold mb-4">จัดการบัญชีลูกค้า</h1>
      <input
        type="text"
        placeholder="ค้นหาชื่อลูกค้า..."
        className="border bg-white rounded px-2 py-1 mb-4 w-1/3"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      /><select
        className="border bg-white rounded px-2 py-1 ml-4"
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
      >
        <option value="all">ทั้งหมด</option>
        <option value="user">user</option>
        <option value="banned">banned</option>
      </select>

      <table className="w-full border bg-white">
        <thead>
          <tr>
            <th className="border p-2">รหัส</th>
            <th className="border p-2">ชื่อ</th>
            <th className="border p-2">คำสั่งซื้อ</th>



            <th className="border p-2">เบอร์โทร</th>
            <th className="border p-2">สถานะ</th>
            <th className="p-2 border">ออเดอร์</th>
            <th className="border p-2">จัดการ</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map(user => (
            <tr key={user.Cid}>
              <td className="border p-2 text-center">{user.Cid}</td>

              <td className="border p-2">{user.Cname}</td>
              <td className="border p-2 text-center">
                <button
                  className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                  onClick={() => handleViewOrders(user.Cid)}
                >
                  ดูคำสั่งซื้อ
                </button>
              </td>

              <td className="border p-2">{user.Cphone}</td>
              <td className="border p-2 text-center">
                <span className={`px-2 py-1 rounded text-white ${user.Cstatus === 'banned' ? 'bg-red-500' : 'bg-green-500'}`}>
                  {user.Cstatus}
                </span>
              </td>
              <td className="p-2 border text-black text-center">{user.orderCount}</td>

              <td className="border p-2 text-center">
                <div className="flex justify-between items-center w-full">
                  <div className="mx-auto">
                    <button
                      className={`px-3 py-1 rounded text-white ${user.Cstatus === 'banned' ? 'bg-blue-500' : 'bg-red-500'}`}
                      onClick={() => toggleBan(user.Cid, user.Cstatus)}
                    >
                      {user.Cstatus === 'banned' ? 'ปลดแบน' : 'แบน'}
                    </button>
                  </div>

                  <div className="ml-auto">
                    <button
                      onClick={() => handleDelete(user.Cid)}
                      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                    >
                      ลบ
                    </button>
                  </div>
                </div>
              </td>


            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  async function toggleBan(id: number, status: string) {
    const newStatus = status === 'banned' ? 'active' : 'banned';

    const res = await fetch(`http://localhost:3000/customers/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Cstatus: newStatus })
    });

    if (res.ok) {
      setUsers(prev => prev.map(u => u.Cid === id ? { ...u, Cstatus: newStatus } : u));
    } else {
      alert('เปลี่ยนสถานะไม่สำเร็จ');
    }
  }
}

