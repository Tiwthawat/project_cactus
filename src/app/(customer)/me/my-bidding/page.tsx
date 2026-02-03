'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from "@/app/lib/apiFetch";

interface MyBiddingItem {
  Aid: number;
  PROid: number;
  PROname: string;
  PROpicture: string | null;
  current_price: number;
  my_last_bid: number | null;
  status: 'open' | 'closed';
  my_status: 'leading' | 'outbid' | 'won' | 'lost';
  end_time: string;
}

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

export default function MyBiddingPage() {
  const [items, setItems] = useState<MyBiddingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // ⭐ ลำดับน้ำหนักการเรียง
  const getSortWeight = (item: MyBiddingItem) => {
    // อันที่ยังเปิดอยู่มาก่อน
    if (item.status === 'open') {
      if (item.my_status === 'outbid') return 0; // ถูกแซงก่อน
      if (item.my_status === 'leading') return 1; // กำลังนำ
    }

    // ปิดแล้ว
    if (item.status === 'closed') {
      if (item.my_status === 'won') return 2; // ชนะ
      if (item.my_status === 'lost') return 3; // แพ้
    }

    return 99;
  };

  const getStatusText = (status: MyBiddingItem['my_status']) => {
    switch (status) {
      case 'leading': return 'กำลังนำ';
      case 'outbid': return 'ถูกแซงแล้ว';
      case 'won': return 'ชนะประมูล';
      case 'lost': return 'แพ้ประมูล';
    }
  };

  const getStatusColor = (status: MyBiddingItem['my_status']) => {
    switch (status) {
      case 'leading': return 'text-green-600';
      case 'outbid': return 'text-red-600';
      case 'won': return 'text-green-700 font-semibold';
      case 'lost': return 'text-gray-500';
      default: return '';
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
       if (!localStorage.getItem('token')) {
  setLoading(false);
  return;
}


        const res = await apiFetch(`${API}/me/my-bidding`, {
          
        });

        const data = await res.json();

        if (Array.isArray(data)) {
          const sorted = [...data].sort((a, b) => {
            const wa = getSortWeight(a);
            const wb = getSortWeight(b);

            if (wa !== wb) return wa - wb;

            // ถ้า weight เท่ากัน เรียงตามเวลาใกล้หมดก่อน
            return new Date(a.end_time).getTime() - new Date(b.end_time).getTime();
          });

          setItems(sorted);
        } else {
          setItems([]);
        }
      } catch (err) {
        console.error("FETCH ERROR:", err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    load();

    
    const interval = setInterval(load, 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <p className="p-6 text-center">กำลังโหลด...</p>;

  if (items.length === 0)
    return <p className="p-6 text-center text-gray-600">ยังไม่มีรายการที่กำลังบิดอยู่</p>;

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-xl font-bold mb-4">รายการประมูลที่กำลังบิดอยู่</h1>

      {/* ⭐ 2 คอลัมน์ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item) => (
          <div key={item.Aid} className="border rounded-lg p-3 flex gap-3 bg-white shadow-sm">

            {/* รูปสินค้า */}
            <div className="w-24 h-24 bg-gray-100 rounded overflow-hidden flex-shrink-0">
              {item.PROpicture ? (
                <img
                  src={item.PROpicture}
                  alt={item.PROname}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-xs">
                  No image
                </div>
              )}
            </div>

            {/* รายละเอียด */}
            <div className="flex-1">

              <p className="font-semibold">{item.PROname}</p>

              <p className="text-sm text-gray-500">
                ราคาปัจจุบัน:{' '}
                <span className="font-medium text-black">
                  {item.current_price.toLocaleString()}
                </span>{' '}
                บาท
              </p>

              <p className="text-sm text-gray-500">
                ราคาที่ฉันบิดล่าสุด:{' '}
                <span className="font-medium">
                  {item.my_last_bid?.toLocaleString()}
                </span>{' '}
                บาท
              </p>

              <p className={`text-sm mt-1 ${getStatusColor(item.my_status)}`}>
                สถานะของฉัน: {getStatusText(item.my_status)}
              </p>

              <p className="text-xs text-gray-400 mt-1">
                ปิดประมูล: {formatDate(item.end_time)}
              </p>

              <Link
                href={`/auctions/${item.Aid}`}
                className="inline-block mt-2 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
              >
                ไปหน้าประมูล
              </Link>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
