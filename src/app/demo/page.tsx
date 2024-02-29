// page.tsx
'use client';
import React, { useEffect, useState } from "react";


interface Customer {
  Cid: number;
  Cname: string;
  Caddress: string;
  Cusername: string;
  Cpassword: string;
  Cphone: string;
  Cstatus: string;
  Cdate: string;
  Cbirth: string;
}

async function getData() {
  try {
    const res = await fetch("http://localhost:3000/customers");
    if (!res.ok) {
      throw new Error("การดึงข้อมูลล้มเหลว");
    }
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการดึงข้อมูล:", error);
    throw error;
  }
}

export default function Home() {
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const responseData = await getData();
        if (Array.isArray(responseData)) {
          setCustomers(responseData);
        } else {
          throw new Error("ข้อมูลที่ได้ไม่ใช่รูปแบบของอาร์เรย์");
        }
      } catch (error) {
        console.error("เกิดข้อผิดพลาดในการดึงข้อมูล:", error);
      }
    };
    fetchData();
  }, []);

  return (
    <main className="flex flex-col h-screen items-center bg-white">
      <div className="ml-5 w-full p-3 h-full text-black text-3xl flex-col overflow-hidden">
        <div className="h-full overflow-scroll-y ">
          <h2>รายชื่อลูกค้า</h2>
          <section className="w-full bg-gray-700 flex flex-wrap mx-auto text-center">
            {customers.map((customer) => (
              <div key={customer.Cid} className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 p-4">
                <div className="bg-white rounded-lg p-4 shadow-lg">
                  <h3 className="text-xl font-semibold mb-2">{customer.Cname}</h3>
                  <p className="text-gray-600">ที่อยู่: {customer.Caddress}</p>
                  <p className="text-gray-600">ชื่อผู้ใช้: {customer.Cusername}</p>
                  <p className="text-gray-600">รหัสผ่าน: {customer.Cpassword}</p>
                  <p className="text-gray-600">โทรศัพท์: {customer.Cphone}</p>
                  <p className="text-gray-600">สถานะ: {customer.Cstatus}</p>
                  <p className="text-gray-600">วันที่: {customer.Cdate}</p>
                  <p className="text-gray-600">วันเกิด: {customer.Cbirth}</p>
                </div>
              </div>
            ))}

          </section>
        </div>
      </div>
    </main>
  );
}



// //page.tsx
// "use client";
// import React, { useEffect, useState } from "react";
// import ListItem from "./listitem";
// import MenuItem from "./MenuItem";

// export interface Product {
//     index: number;
//     quantity: number;
//     imageSrc: string | undefined;
//     id: number;
//     name: string;
//     description: string | null;
//     price: number;
//     size: string | null;
//     category: string | null;
//     store_id: number;
//     imageFileName: string | null;
// }




//     const handleItemClick = (itemName: string) => {
//         const clickedItem = data.find((item) => item.name === itemName);

//         if (clickedItem) {
//             const existingItemIndex = selectedItems.findIndex((item) => item.name === itemName);

//             if (existingItemIndex !== -1) {
//                 // ถ้ารายการสินค้าที่ถูกเลือกไว้แล้วอยู่ในรายการสั่งซื้อ
//                 // ให้เพิ่มจำนวนสินค้าที่เลือกไว้เท่านั้น
//                 const updatedItems = [...selectedItems];
//                 updatedItems[existingItemIndex].quantity++;
//                 setSelectedItems(updatedItems);
//             } else {
//                 // ถ้ารายการสินค้ายังไม่มีอยู่ในรายการสั่งซื้อ
//                 // เพิ่มรายการสินค้าใหม่เข้าไปในรายการสั่งซื้อ
//                 clickedItem.quantity = 1;
//                 setSelectedItems([...selectedItems, clickedItem]);
//             }
//         }
//     };

//     return (
//         <main className="flex">
//             <div className="w-[1000px] h-screen p-4 overflow-y-scroll flex-col">
//                 <p className="ml-5 text-3xl mt-5 mb-5 text-[rgb(79,86,94)] flex-col">
//                     รายการอาหาร
//                 </p>
//                 <div className="flex">
//                     <div className="grid grid-cols-4 gap-4">
//                         {data.map((item) => (
//                             <MenuItem
//                                 key={item.id}
//                                 item={item}
//                                 onClick={handleItemClick}
//                             />
//                         ))}
//                     </div>
//                 </div>
//             </div>
//             <ListItem selectedItems={selectedItems} setSelectedItems={setSelectedItems} />
//         </main>
//     );
// }


