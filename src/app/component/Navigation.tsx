// Navigation.tsx
import React from 'react';

const Navigation = () => {
    return (
        <div className="fixed top-20 left-0 w-full z-40 bg-green-500 flex items-center justify-between py-4 px-6 shadow">

            <div className="flex space-x-4  ml-28 mr-28 ">
                <label htmlFor="category">เลือกหมวดหมู่:</label>
                <select className="form-select" aria-label="Default select example" defaultValue="1">
                    <option value="1"> select menu</option>
                    <option value="1">ทั้งหมด</option>
                    <option value="2">cuctus</option>
                    <option value="3">ดิน</option>
                </select>

                <a href="/auctionguide" className="text-white" >
                    ขั้นตอนการประมูล
                </a>
                <a href="/FAQ" className="text-white" >
                    คำถามที่พบบ่อย
                </a>
                <a href="/Insurance" className="text-white" >
                    การรับประกันสินค้า
                </a>
                <a href="/About" className="text-white" >
                    รีวิวเกี่ยวกับเรา
                </a>
            </div>
        </div>
    );
}

export default Navigation;
