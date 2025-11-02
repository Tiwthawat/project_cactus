'use client';

import AuctionItems from '../../component/AuctionItems';  

export default function AuctionPage() {
  return (
    <main className="pt-36 px-6 min-h-screen bg-white text-black">
      <h1 className="text-2xl font-bold mb-6">🌵 รายการประมูล</h1>

      
      <AuctionItems />
    </main>
  );
}
