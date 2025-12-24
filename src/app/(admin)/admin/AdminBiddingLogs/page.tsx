'use client';
import { apiFetch } from '@/app/lib/apiFetch';

import { useState } from "react";

export default function AdminBiddingLogsPage() {
  const [aid, setAid] = useState<string>("");
  const [summary, setSummary] = useState<any>(null);
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";

  const loadData = async () => {
    if (!aid) {
      alert("กรุณากรอกหมายเลขประมูล");
      return;
    }

    setLoading(true);

    try {
      const res = await apiFetch(`${API}/admin/bidding-logs?Aid=${aid}`);
      const data = await res.json();
       if (res.status === 401 || res.status === 403) {
      // ไม่ใช่แอดมิน → เด้งไป login (หรือจะไปหน้า / ก็ได้)
      window.location.href = "/";
      return;
    }

      if (!res.ok) {
        alert(data.message || "โหลดข้อมูลไม่สำเร็จ");
        setLoading(false);
        return;
      }

      setSummary(data.summary || null);
      setBids(data.bids || []);
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาด");
    }

    setLoading(false);
  };

  return (
    <div className=" p-8 min-h-screen">

      {/* หัวข้อ */}
      <h1 className="text-2xl font-bold mb-6">
        ประวัติการบิด (Admin)
      </h1>

      {/* โหลดข้อมูล */}
      <div className="gap-3 mb-6 justify-center">
        <input
          type="number"
          placeholder="ใส่ Aid เช่น 65"
          value={aid}
          onChange={(e) => setAid(e.target.value)}
          className=" bg-white  border p-2 rounded w-48"
        />
        <button
          onClick={loadData}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          {loading ? "กำลังโหลด..." : "โหลดข้อมูล"}
        </button>
      </div>

      {/* กล่องสรุปสินค้า */}
      {summary && (
        <div className="bg-white p-6 rounded shadow mb-8 w-full">

          <h2 className="text-lg font-bold mb-4">
            รายละเอียดประมูล #{summary.Aid}
          </h2>

          <div className="flex gap-6">

            <img
              src={`${API}${summary.PROpicture}`}
              alt="product"
              className="w-32 h-32 rounded border object-cover"
            />

            <div className="space-y-1">
              <p>สินค้า: <b>{summary.PROname}</b></p>
              <p>สถานะ: {summary.status}</p>
              <p>ราคาปิด: {summary.current_price} บาท</p>
              <p>ผู้ชนะ: <b>{summary.winner_name}</b></p>
              <p>จำนวนบิดทั้งหมด: {summary.bid_count}</p>
            </div>

          </div>
        </div>
      )}

      {/* ตารางประมูล */}
      {bids.length > 0 && (
        <div className="bg-white p-6 rounded shadow w-full">

          <h2 className="text-lg font-bold mb-4">รายการบิดทั้งหมด</h2>

          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-200 text-left">
                <th className="p-2 border">#</th>
                <th className="p-2 border">ผู้บิด</th>
                <th className="p-2 border">ราคา</th>
                <th className="p-2 border">เวลา</th>
                <th className="p-2 border">ผู้ชนะ</th>
              </tr>
            </thead>

            <tbody>
              {bids.map((b: any) => (
                <tr key={b.Bidid} className="border-b hover:bg-gray-50">
                  <td className="p-2 border">{b.Bidid}</td>
                  <td className="p-2 border">{b.username}</td>
                  <td className="p-2 border">{b.amount} บาท</td>
                  <td className="p-2 border">
                    {new Date(b.created_at).toLocaleString("th-TH")}
                  </td>
                  <td className="p-2 border text-center text-xl">
                    {b.is_winner ? "🏆" : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

        </div>
      )}

    </div>
  );
}
