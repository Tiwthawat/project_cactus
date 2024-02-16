// Home.tsx
import React from "react";
import AuctionItem from "./cactusitems";
import itemscac, { CactusItem } from "./itemcac";


export default function Home() {
  return (
    <main className="flex flex-col h-screen items-center bg-white">
      <div className="ml-5 w-full p-3 h-full text-black text-3xl flex-col overflow-hidden">
        <div className="h-full overflow-scroll-y "> <h2>สินค้าที่ขายดี</h2>
        
          <section className="w-full flex flex-wrap mx-auto text-center">
           
            {itemscac.map((item: CactusItem) => (
              <AuctionItem
                key={item.Idauction}
                Idauction={item.Idauction}
                imageSrc={item.imageSrc}
                name={item.name}
                pricenow={item.pricenow}
                Time={item.Time} link={""}                
              />
            ))}<h2>แคคตัสสวยงาม
            </h2>
          </section><section className="w-full flex flex-wrap mx-auto text-center">
            
            {itemscac.map((item: CactusItem) => (
              <AuctionItem
                key={item.Idauction}
                Idauction={item.Idauction}
                imageSrc={item.imageSrc}
                name={item.name}
                pricenow={item.pricenow}
                Time={item.Time} link={""}                
              />
            ))}
          </section>
        </div>
      </div>
    </main>
  );
};