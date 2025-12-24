'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface AuctionOrder {
    Aid: number;
    PROid: number;
    PROname: string;
    Cname: string;
    current_price: number;
    payment_status: string;
}

const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";

export default function AuctionOrdersPage() {
    const [orders, setOrders] = useState<AuctionOrder[]>([]);
    const [filterStatus, setFilterStatus] = useState("all");

    const statusColorMap: Record<string, string> = {
        pending_payment: 'bg-yellow-100 text-yellow-800',
        payment_review: 'bg-blue-100 text-blue-800',
        paid: 'bg-green-100 text-green-800',
        shipping: 'bg-purple-100 text-purple-800',
        delivered: 'bg-emerald-100 text-emerald-800',
        returned: 'bg-red-100 text-red-800',
        payment_failed: 'bg-rose-100 text-rose-800',
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
            prev.map(o => o.Aid === Aid ? { ...o, payment_status: status } : o)
        );
    };

    const filtered = orders.filter(o =>
        filterStatus === 'all' ? true : o.payment_status === filterStatus
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
            <div className="p-6 pt-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="inline-block bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-full text-sm font-semibold mb-4">
                        จัดการออเดอร์ประมูล
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        🔨 ออเดอร์ประมูล
                    </h1>
                </div>

                {/* Filter Card */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-2 border-gray-200">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl shadow-md">
                            🔍
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">กรองสถานะ</h2>
                    </div>
                    <select
                        className="w-full md:w-64 p-3 border-2 border-gray-200 rounded-xl bg-gray-50 focus:border-green-400 focus:outline-none transition-colors text-base font-semibold"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="all">📦 ทั้งหมด</option>
                        <option value="pending_payment">⏳ รอชำระเงิน</option>
                        <option value="payment_review">🔍 ตรวจสอบการชำระ</option>
                        <option value="paid">✅ ชำระแล้ว</option>
                        <option value="shipping">🚚 กำลังจัดส่ง</option>
                        <option value="delivered">📦 จัดส่งแล้ว</option>
                    </select>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                                    <th className="p-4 text-center w-28">รหัส</th>
                                    <th className="p-4 text-left">สินค้า</th>
                                    <th className="p-4 text-left">ผู้ชนะ</th>
                                    <th className="p-4 text-right w-32">ราคา</th>
                                    <th className="p-4 text-center w-40">สถานะ</th>
                                    <th className="p-4 text-center w-48">เปลี่ยนสถานะ</th>
                                    <th className="p-4 text-center w-40">จัดการ</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filtered.map((o) => {
                                    const code = `auc:${String(o.Aid).padStart(4, "0")}`;

                                    return (
                                        <tr key={o.Aid} className="border-b border-gray-200 hover:bg-green-50 transition-colors">
                                            <td className="p-4 text-center font-mono text-sm bg-gray-50">{code}</td>
                                            <td className="p-4 font-semibold text-gray-900">{o.PROname}</td>
                                            <td className="p-4 text-gray-700">{o.Cname}</td>
                                            <td className="p-4 text-right font-bold text-lg text-green-600">
                                                {Number(o.current_price).toLocaleString('th-TH', {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })} ฿
                                            </td>

                                            <td className="p-4 text-center">
                                                <span className={`px-3 py-1.5 rounded-full text-sm font-semibold border-2 ${o.payment_status === 'pending_payment' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                                                        o.payment_status === 'payment_review' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                                                            o.payment_status === 'paid' ? 'bg-green-100 text-green-700 border-green-300' :
                                                                o.payment_status === 'shipping' ? 'bg-purple-100 text-purple-700 border-purple-300' :
                                                                    o.payment_status === 'delivered' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' :
                                                                        'bg-red-100 text-red-700 border-red-300'
                                                    }`}>
                                                    {o.payment_status}
                                                </span>
                                            </td>

                                            <td className="p-4 text-center">
                                                <select
                                                    className="w-full p-2 rounded-lg border-2 border-gray-200 bg-gray-50 focus:border-green-400 focus:outline-none transition-colors text-sm font-semibold"
                                                    value={o.payment_status}
                                                    onChange={(e) => updateStatus(o.Aid, e.target.value)}
                                                >
                                                    <option value="pending_payment">⏳ รอชำระเงิน</option>
                                                    <option value="payment_review">🔍 ตรวจสอบ</option>
                                                    <option value="paid">✅ ชำระแล้ว</option>
                                                    <option value="shipping">🚚 จัดส่ง</option>
                                                    <option value="delivered">📦 ส่งแล้ว</option>
                                                </select>
                                            </td>

                                            <td className="p-4 text-center">
                                                <Link href={`/admin/auction-orders/${o.Aid}`}>
                                                    <button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 shadow-md hover:shadow-lg whitespace-nowrap">
                                                        📋 ดูรายละเอียด
                                                    </button>
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
