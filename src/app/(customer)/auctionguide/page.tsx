'use client';

export default function AuctionGuidePage() {
  return (
    <main className="pt-36 flex flex-col items-center min-h-screen bg-white px-4 sm:px-6">
      <div className="max-w-3xl w-full py-10">
        <h1 className="text-3xl font-bold mb-6 text-center text-green-700">
          🛎️ ขั้นตอนการประมูลสินค้าแคคตัส
        </h1>

        <ol className="list-decimal space-y-4 text-lg text-gray-800 px-4">
          <li>
            <strong>เข้าสู่ระบบ / สมัครสมาชิก:</strong> ต้องเข้าสู่ระบบก่อนเพื่อสามารถเข้าร่วมการประมูล
          </li>
          <li>
            <strong>เลือกสินค้า:</strong> ไปที่หน้า <span className="text-green-600 font-semibold">"ประมูล"</span> เพื่อดูรายการสินค้าที่เปิดประมูลอยู่
          </li>
          <li>
            <strong>เสนอราคา:</strong> ใส่ราคาที่ต้องการประมูล และกดปุ่ม <span className="text-red-600 font-semibold">“เสนอราคา”</span>
          </li>
          <li>
            <strong>รอผล:</strong> หากไม่มีใครประมูลสูงกว่าคุณจนถึงเวลาปิดประมูล คุณจะเป็นผู้ชนะ
          </li>
          <li>
            <strong>ชำระเงิน:</strong> ไปที่หน้า <span className="font-semibold">"คำสั่งซื้อ"</span> แล้วชำระเงินตามรายละเอียดที่ระบบแจ้ง
          </li>
          <li>
            <strong>รับสินค้า:</strong> รอรับสินค้าได้ที่บ้านตามที่อยู่ที่ลงทะเบียนไว้
          </li>
        </ol>

        <p className="mt-8 text-center text-gray-500 italic px-4">
          💡 หมายเหตุ: ระบบจะอัปเดตสถานะการประมูลแบบเรียลไทม์ โปรดตรวจสอบบ่อย ๆ
        </p>
      </div>
    </main>
  );
}
