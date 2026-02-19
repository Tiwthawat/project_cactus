'use client';

import AuctionItems from '../../component/AuctionItems';

export default function AuctionPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* top spacing: ไม่เว้นสูงเว่อร์ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-10">
        {/* Header Card */}
        <div className="rounded-2xl border border-emerald-200 bg-white overflow-hidden">
          {/* accent line */}
          <div className="h-[3px] bg-emerald-600" />

          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-600" />
                  <span className="text-xs font-semibold tracking-wide text-emerald-800">
                    AUCTION LIST
                  </span>
                </div>

                <h1 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
                  รายการประมูล
                </h1>

                <p className="mt-2 text-sm text-gray-600">
                  เลือกชิ้นที่ใช่ แล้วกดบิดแบบมีคลาส 🌵
                </p>
              </div>

              {/* CTA / hint badge */}
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-600/70" />
                  อัปเดตเรียลไทม์ตามระบบ
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <section className="mt-8">
          {/* subtle section title */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-gray-900">
              กำลังเปิดประมูล
            </h2>
            <div className="h-px flex-1 bg-gray-100 mx-4" />
            <span className="text-xs text-gray-500">Explore</span>
          </div>

          {/* AuctionItems (ตัวหลัก) */}
          <AuctionItems />
        </section>
      </div>
    </main>
  );
}
