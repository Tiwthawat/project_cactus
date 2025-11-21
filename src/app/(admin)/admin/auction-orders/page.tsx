'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface AuctionOrder {
    Aid: number;
    PROid: number;
    PROname: string;
    Cname: string;
    current_price: number;
    PROstatus: string;
}

const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";




export default function AuctionOrdersPage() {
    const [orders, setOrders] = useState<AuctionOrder[]>([]);
    const [filterStatus, setFilterStatus] = useState("all");
    const statusColorMap: Record<string, string> = {
        auction: 'bg-gray-200 text-gray-800',
        pending_payment: 'bg-yellow-100 text-yellow-800',
        payment_review: 'bg-blue-100 text-blue-800',
        paid: 'bg-green-100 text-green-800',
        ready_to_ship: 'bg-purple-100 text-purple-800',
        shipped: 'bg-indigo-100 text-indigo-800',
        delivered: 'bg-emerald-100 text-emerald-800',
        returned: 'bg-red-100 text-red-800',
        payment_failed: 'bg-rose-100 text-rose-800',
        unsold: 'bg-slate-200 text-slate-700',
    };

    useEffect(() => {
        fetch(`${API}/auction-orders`)
            .then((res) => res.json())
            .then((data) => setOrders(data))
            .catch((err) => console.error(err));
    }, []);

    const updateStatus = async (Aid: number, status: string) => {
        await fetch(`${API}/auction-orders/${Aid}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
        });

        setOrders(prev =>
            prev.map(o => o.Aid === Aid ? { ...o, PROstatus: status } : o)
        );
    };

    const filtered = orders.filter(o =>
        filterStatus === 'all' ? true : o.PROstatus === filterStatus
    );

    return (
        <div className="p-6 text-black">
            <h2 className="text-xl font-bold mb-4">ออเดอร์ประมูล</h2>

            {/* Filter */}
            <div className="mb-4">
                <label className="mr-2 font-medium">กรองสถานะ:</label>
                <select
                    className="border px-2 py-1 rounded"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                >
                    <option value="all">ทั้งหมด</option>
                    <option value="pending_payment">pending_payment</option>
                    <option value="payment_review">payment_review</option>
                    <option value="paid">paid</option>
                    <option value="shipping">shipping</option>
                    <option value="delivered">delivered</option>
                </select>
            </div>

            {/* Table */}
            <table className="min-w-full bg-white border">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="p-2 border">รหัส</th>
                        <th className="p-2 border">สินค้า</th>
                        <th className="p-2 border">ผู้ชนะ</th>
                        <th className="p-2 border">ราคา</th>
                        <th className="p-2 border">สถานะ</th>
                        <th className="p-2 border">เปลี่ยนสถานะ</th>
                        <th className="p-2 border">รายละเอียด</th>
                    </tr>
                </thead>

                <tbody>
                    {filtered.map((o) => {
                        const code = `auc:${String(o.Aid).padStart(4, "0")}`;

                        return (
                            <tr key={o.Aid}>
                                <td className="p-2 border text-center">{code}</td>
                                <td className="p-2 border">{o.PROname}</td>
                                <td className="p-2 border">{o.Cname}</td>
                                <td className="p-2 border text-right">{o.current_price} บาท</td>
                                <td className="p-2 border text-center">{o.PROstatus}</td>

                                <td className="p-2 border text-center">
                                    <select
                                        className={`
      px-2 py-1 rounded border text-sm font-medium
      ${statusColorMap[o.PROstatus] ?? 'bg-gray-100 text-gray-800'}
    `}
                                        value={o.PROstatus}
                                        onChange={(e) => updateStatus(o.Aid, e.target.value)}
                                    >
                                        <option value="auction">auction</option>
                                        <option value="pending_payment">pending_payment</option>
                                        <option value="payment_review">payment_review</option>
                                        <option value="paid">paid</option>
                                        <option value="ready_to_ship">ready_to_ship</option>
                                        <option value="shipped">shipped</option>
                                        <option value="delivered">delivered</option>
                                        <option value="returned">returned</option>
                                        <option value="payment_failed">payment_failed</option>
                                        <option value="unsold">unsold</option>
                                    </select>
                                </td>



                                <td className="p-2 border text-center">
                                    <Link href={`/admin/auction-orders/${o.Aid}`}>
                                        <button className="bg-blue-500 text-white px-2 py-1 rounded">
                                            ดูรายละเอียด
                                        </button>
                                    </Link>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
