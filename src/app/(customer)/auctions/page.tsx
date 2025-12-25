'use client';

import AuctionItems from '../../component/AuctionItems';  

export default function AuctionPage() {
  return (
    <main className="pt-36 px-6 min-h-screen bg-white text-black">
      <div className="inline-block bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-full text-sm font-semibold mb-4">
          รายการประมูล
        </div>

      
      <AuctionItems />
    </main>
  );
}
