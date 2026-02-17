'use client';
import React, { useState } from 'react';
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { apiFetch } from '../lib/apiFetch';

export default function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const handleSubmit = async () => {
    
    const res = await apiFetch('http://localhost:3000/change-password', {
      method: 'PATCH',
      body: JSON.stringify({ oldPassword, newPassword }),
    });

    const result = await res.json();

    if (res.ok) {
      alert('เปลี่ยนรหัสผ่านสำเร็จ');
      onClose();
    } else {
      alert(`เปลี่ยนรหัสผ่านไม่สำเร็จ: ${result.message}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-2xl shadow-2xl w-80 relative animate-fadeIn border border-emerald-200">

        {/* ปุ่มปิด */}
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-black"
          onClick={onClose}
        >
          ✕
        </button>

        <h2 className="text-lg font-bold mb-4 text-green-700 text-center">
          เปลี่ยนรหัสผ่าน
        </h2>

        {/* รหัสผ่านเดิม */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            รหัสผ่านเดิม
          </label>

          <div className="relative">
            <input
              type={showOld ? "text" : "password"}
              placeholder="รหัสผ่านเดิม"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white shadow-sm 
                focus:ring-2 focus:ring-emerald-500 outline-none pr-12"
            />

            <span
              className="absolute inset-y-0 right-4 flex items-center cursor-pointer text-gray-500"
              onClick={() => setShowOld(!showOld)}
            >
              {showOld ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
        </div>

        {/* รหัสผ่านใหม่ */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            รหัสผ่านใหม่
          </label>

          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              placeholder="รหัสผ่านใหม่"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white shadow-sm 
                focus:ring-2 focus:ring-emerald-500 outline-none pr-12"
            />

            <span
              className="absolute inset-y-0 right-4 flex items-center cursor-pointer text-gray-500"
              onClick={() => setShowNew(!showNew)}
            >
              {showNew ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
        </div>

        <button
          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 rounded-xl shadow hover:opacity-90"
          onClick={handleSubmit}
        >
          บันทึกรหัสผ่านใหม่
        </button>

      </div>
    </div>
  );
}
