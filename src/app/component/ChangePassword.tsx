'use client';
import React, { useState } from 'react';

export default function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const handleSubmit = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:3000/change-password', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ oldPassword, newPassword }),
    });

    if (res.ok) {
      alert('เปลี่ยนรหัสผ่านสำเร็จ');
      
      onClose();
    } else {
      alert('เปลี่ยนรหัสผ่านไม่สำเร็จ');
    }
    if (!res.ok) {
  const errData = await res.json();
  alert(`เปลี่ยนรหัสผ่านไม่สำเร็จ: ${errData.message}`);
}
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl shadow w-full max-w-md relative">
        <button className="absolute top-2 text-gray-700 right-3 text-xl" onClick={onClose}>×</button>
        <h2 className="text-lg font-semibold text-black mb-4">เปลี่ยนรหัสผ่าน</h2>

        {/* รหัสผ่านเดิม */}
        <div className="relative mb-3">
          <input
            type={showOld ? 'text' : 'password'}
            placeholder="รหัสผ่านเดิม"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded pr-10"
          />
          <button
            type="button"
            className="absolute right-2 top-2 text-sm text-gray-600"
            onClick={() => setShowOld(!showOld)}
          >
            {showOld ? '🙈' : '👁️'}
          </button>
        </div>

        {/* รหัสผ่านใหม่ */}
        <div className="relative mb-3">
          <input
            type={showNew ? 'text' : 'password'}
            placeholder="รหัสผ่านใหม่"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded pr-10"
          />
          <button
            type="button"
            className="absolute right-2 top-2 text-sm text-gray-600"
            onClick={() => setShowNew(!showNew)}
          >
            {showNew ? '🙈' : '👁️'}
          </button>
        </div>

        <div className="mt-4 text-right">
          <button onClick={handleSubmit} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
            บันทึกรหัสผ่านใหม่
          </button>
        </div>
      </div>
    </div>
  );
}
