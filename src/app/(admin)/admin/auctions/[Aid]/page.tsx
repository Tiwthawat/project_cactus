"use client";

import { apiFetch } from "@/app/lib/apiFetch";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import StatusBadge from "@/app/component/StatusBadge";
import { getMeta, AUCTION_STATUS } from "@/app/lib/status";

type AuctionStatus = "open" | "closed";

interface AuctionDetail {
  Aid: number;
  start_price: number;
  current_price: number;
  close_price?: number;
  end_time: string;
  status: AuctionStatus;

  PROid: number;
  PROname: string;
  PROpicture: string;
  PROdetail?: string;

  winner_id?: number;
  winnerName?: string | null;
}

const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";

const fmt = (n: number) =>
  Number(n ?? 0).toLocaleString("th-TH", { minimumFractionDigits: 2 });

export default function AdminAuctionDetailPage() {
  const { Aid } = useParams<{ Aid: string }>();
  const router = useRouter();

  const [data, setData] = useState<AuctionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDetail = async () => {
    try {
      setLoading(true);

      const res = await apiFetch(`${API}/auction/${Aid}`, { cache: "no-store" });
      if (!res.ok) {
        setData(null);
        return;
      }

      const d: AuctionDetail = await res.json();
      setData(d);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Aid]);

  const imageUrls = useMemo(() => {
    if (!data?.PROpicture) return [];
    return data.PROpicture
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((p) => `${API}${p.startsWith("/") ? "" : "/"}${p}`);
  }, [data?.PROpicture]);

  const [sel, setSel] = useState(0);

  const closeAuction = async () => {
    if (!confirm("ต้องการปิดประมูลนี้?")) return;

    const res = await apiFetch(`${API}/auctions/${Aid}/close`, {
      method: "PATCH",
    });

    if (!res.ok) {
      alert("ปิดประมูลไม่สำเร็จ");
      return;
    }

    alert("ปิดประมูลแล้ว");
    fetchDetail();
  };

  const deleteProduct = async () => {
    if (!data) return;
    if (!confirm("ลบสินค้าออกจากคลัง?")) return;

    const res = await apiFetch(`${API}/auction-products/${data.PROid}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      alert("ลบสินค้าไม่สำเร็จ");
      return;
    }

    alert("ลบสินค้าแล้ว");
    router.push("/admin/auction-products");
  };

  if (loading || !data) {
    return <main className="p-6 text-black">กำลังโหลด...</main>;
  }

  const closePrice = data.close_price ?? data.current_price;

  // ✅ ใช้ status.ts คุม label + สี
  const st = getMeta(AUCTION_STATUS, data.status);

  return (
    <main className="p-6 text-black">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">รายละเอียดประมูล #{Aid}</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* รูปสินค้า */}
          <div className="bg-white rounded-xl shadow p-4">
            <div className="w-full aspect-[4/3] bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden">
              {imageUrls[sel] ? (
                <img
                  src={imageUrls[sel]}
                  className="w-full h-full object-contain"
                  alt={data.PROname}
                />
              ) : (
                <div className="text-gray-400">ไม่มีรูป</div>
              )}
            </div>

            {imageUrls.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {imageUrls.map((u, i) => (
                  <button
                    key={`${u}-${i}`}
                    type="button"
                    className={`w-20 h-20 rounded border overflow-hidden ${
                      sel === i
                        ? "ring-2 ring-orange-500"
                        : "hover:ring-1 hover:ring-gray-300"
                    }`}
                    onClick={() => setSel(i)}
                  >
                    <img
                      src={u}
                      className="w-full h-full object-cover"
                      alt={`${data.PROname}-${i + 1}`}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ข้อมูลประมูล */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="mb-4">
              <div className="text-sm text-gray-500">สินค้า</div>
              <div className="text-2xl font-semibold">{data.PROname}</div>
            </div>

            <div className="space-y-2 text-[15px]">
              <div className="flex justify-between border-b py-2">
                <span className="text-gray-600">ราคาเริ่มต้น</span>
                <b>{fmt(data.start_price)} ฿</b>
              </div>

              <div className="flex justify-between border-b py-2">
                <span className="text-gray-600">ราคาปัจจุบัน</span>
                <b className="text-red-600">{fmt(data.current_price)} ฿</b>
              </div>

              <div className="flex justify-between border-b py-2">
                <span className="text-gray-600">ราคาปิด</span>
                <b className="text-blue-600">{fmt(closePrice)} ฿</b>
              </div>

              <div className="flex justify-between border-b py-2">
                <span className="text-gray-600">ปิดประมูล</span>
                <span>{new Date(data.end_time).toLocaleString("th-TH")}</span>
              </div>

              <div className="flex items-center gap-2 py-2">
                <span className="text-gray-600">สถานะ</span>
                <StatusBadge label={st.label} tone={st.tone} />
              </div>

              {data.status === "closed" && (
                <>
                  <div className="flex justify-between border-b py-2">
                    <span className="text-gray-600">ผู้ชนะ</span>
                    <b>{data.winnerName || "—"}</b>
                  </div>

                  {data.winner_id ? (
                    <button
                      type="button"
                      onClick={() => router.push(`/admin/auction-orders/${data.Aid}`)}
                      className="mt-4 px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                    >
                      ดูออเดอร์ประมูล
                    </button>
                  ) : null}
                </>
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => router.push("/admin/auctions")}
                className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-50"
              >
                ← กลับ
              </button>

              {data.status === "open" && (
                <button
                  type="button"
                  onClick={closeAuction}
                  className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                >
                  ปิดประมูล
                </button>
              )}

              <button
                type="button"
                onClick={deleteProduct}
                className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-800"
              >
                ลบสินค้า
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
