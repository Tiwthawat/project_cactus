'use client';

// PaymentForm.tsx
import React, { useState } from 'react';

export default function PaymentForm() {
  const [image, setImage] = useState<string | undefined>(undefined);
  const [time, setTime] = useState<string>('');
  const [bank, setBank] = useState<string>('');
  const [sender, setSender] = useState<string>('');

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // ตรวจสอบว่ามีไฟล์ถูกเลือกหรือไม่
    if (file) {
      // อ่านข้อมูลจากไฟล์รูปภาพ
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // ตรวจสอบว่าทุกข้อมูลถูกกรอกหรือไม่
    if (image && time && bank && sender) {
      // ส่งข้อมูลไปยังเซิร์ฟเวอร์หรือทำการประมวลผลต่อไป
      console.log('Data submitted:', { image, time, bank, sender });
      // เพิ่มโค้ดเพื่อส่งข้อมูลไปยังเซิร์ฟเวอร์หรือทำการประมวลผลต่อไป
    } else {
      // ถ้าข้อมูลไม่ถูกกรอกให้แสดงข้อความแจ้งเตือน
      alert('Please fill in all fields');
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Payment Form</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block mb-2" htmlFor="image">Attach Image:</label>
          <input type="file" id="image" onChange={handleImageChange} accept="image/*" required />
        </div>
        {image && (
          <div className="mb-4">
            <img src={image} alt="Attached" className="max-w-xs mx-auto mb-2" />
          </div>
        )}
        <div className="mb-4">
          <label className="block mb-2" htmlFor="time">Time of Transfer:</label>
          <input type="text" id="time" value={time} onChange={(e) => setTime(e.target.value)} required />
        </div>
        <div className="mb-4">
          <label className="block mb-2" htmlFor="bank">Bank Name:</label>
          <input type="text" id="bank" value={bank} onChange={(e) => setBank(e.target.value)} required />
        </div>
        <div className="mb-4">
          <label className="block mb-2" htmlFor="sender">Sender's Name:</label>
          <input type="text" id="sender" value={sender} onChange={(e) => setSender(e.target.value)} required />
        </div>
        <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
          Submit
        </button>
      </form>
    </div>
  );
}
