'use client';

import { apiFetch } from '@/app/lib/apiFetch';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

import StatusBadge from '@/app/component/StatusBadge';
import { getMeta, ORDER_STATUS, type OrderStatusKey } from '@/app/lib/status';

interface Order {
  Oid: number;
  Odate: string;
  Ostatus: string; // มาจาก API อาจเป็น string กว้าง ๆ
  Oprice: number;
  products: string;
}

type FilterStatus = 'all' | OrderStatusKey | 'unknown';

const makeCode = (prefix: string, id: number) => `${prefix}:${String(id).padStart(4, '0')}`;

function fmtDateTH(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
}

function fmtBaht(n: unknown) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '—';
  return v.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function isOrderStatusKey(x: string): x is OrderStatusKey {
  return Object.prototype.hasOwnProperty.call(ORDER_STATUS, x);
}

export default function OrdersOfUserPage() {
  const params = useParams();
  const id = params?.id?.toString();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  useEffect(() => {
    let alive = true;

    const load = async () => {
      if (!id) return;

      setLoading(true);
      try {
        // ✅ ไม่ hardcode host — apiFetch จัดการ base ให้แล้ว (ตามโปรเจกต์ตะเอง)
        const res = await apiFetch(`/orders/customer/${id}`);
        if (!res.ok) {
          if (!alive) return;
          setOrders([]);
          return;
        }

        const data: unknown = await res.json();
        if (!alive) return;

        setOrders(Array.isArray(data) ? (data as Order[]) : []);
      } catch {
        if (!alive) return;
        setOrders([]);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, [id]);

  const statusOptions = useMemo(() => {
    // เอา key จาก ORDER_STATUS ทั้งหมด
    return Object.keys(ORDER_STATUS) as OrderStatusKey[];
  }, []);

  const filteredOrders = useMemo(() => {
    if (filterStatus === 'all') return orders;

    if (filterStatus === 'unknown') {
      // โชว์เฉพาะสถานะที่ไม่อยู่ใน ORDER_STATUS (เผื่อมีหลุดจาก backend)
      return orders.filter((o) => !isOrderStatusKey(String(o.Ostatus || '').trim()));
    }

    // filterStatus เป็น OrderStatusKey
    return orders.filter((o) => String(o.Ostatus || '').trim() === filterStatus);
  }, [orders, filterStatus]);

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl text-black font-bold">
          คำสั่งซื้อของลูกค้า ID: {id ?? '—'}
        </h1>

        <div className="flex items-center gap-2">
          <label className="text-black font-semibold">กรองสถานะ:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
            className="border border-gray-300 rounded px-3 py-1 bg-white text-black"
          >
            <option value="all">ทั้งหมด</option>
            {statusOptions.map((k) => (
              <option key={k} value={k}>
                {ORDER_STATUS[k].label}
              </option>
            ))}
            <option value="unknown">ไม่ทราบสถานะ</option>
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="border-b text-black p-3 text-left">รหัสคำสั่งซื้อ</th>
              <th className="border-b text-black p-3 text-left">วันที่</th>
              <th className="border-b text-black p-3 text-left">สถานะ</th>
              <th className="border-b text-black p-3 text-right">ยอดรวม</th>
              <th className="border-b text-black p-3 text-left">สินค้า</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center text-gray-500 p-6">
                  ⏳ กำลังโหลด...
                </td>
              </tr>
            ) : filteredOrders.length > 0 ? (
              filteredOrders.map((order) => {
                const meta = getMeta(ORDER_STATUS, order.Ostatus); // ✅ ยึด status.ts
                return (
                  <tr key={order.Oid} className="hover:bg-gray-50">
                    <td className="border-b text-black p-3 font-mono text-sm">
                      <Link href={`/admin/orders/${order.Oid}`} className="text-blue-600 hover:underline">
                        {makeCode('ord', order.Oid)}
                      </Link>
                    </td>

                    <td className="border-b text-black p-3">{fmtDateTH(order.Odate)}</td>

                    <td className="border-b text-black p-3">
                      <div className="flex items-center gap-2">
                        <StatusBadge label={meta.label} tone={meta.tone} />
                        {/* เผื่ออยากโชว์คีย์ดิบด้วย (ลบได้) */}
                        <span className="text-[11px] text-gray-400">{String(order.Ostatus || '').trim() || '—'}</span>
                      </div>
                    </td>

                    <td className="border-b text-black p-3 text-right">{fmtBaht(order.Oprice)} บาท</td>

                    <td className="border-b text-black p-3">{order.products}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="text-center text-black p-6">
                  ไม่มีข้อมูลคำสั่งซื้อ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-gray-500">
        * สี/ข้อความสถานะอิงจาก <span className="font-mono">src/app/lib/status.ts</span> (ORDER_STATUS) เท่านั้น
      </p>
    </div>
  );
}
