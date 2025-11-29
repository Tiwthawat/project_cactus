'use client';
import { FaShoppingCart, FaClock, FaCreditCard, FaUserCircle, FaMoneyBillWave, FaTruck } from 'react-icons/fa';

export default function AuctionGuidePage() {
  const steps = [
    {
      icon: <FaUserCircle className="w-8 h-8" />,
      title: 'เข้าสู่ระบบ / สมัครสมาชิก',
      desc: 'ต้องเข้าสู่ระบบก่อนเพื่อสามารถเข้าร่วมการประมูล',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: <FaShoppingCart className="w-8 h-8" />,
      title: 'เลือกสินค้า',
      desc: 'ไปที่หน้า "ประมูล" เพื่อดูรายการสินค้าที่เปิดประมูลอยู่',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: <FaMoneyBillWave className="w-8 h-8" />,
      title: 'เสนอราคา',
      desc: 'ใส่ราคาที่ต้องการประมูล และกดปุ่ม "เสนอราคา"',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: <FaClock className="w-8 h-8" />,
      title: 'รอผล',
      desc: 'หากไม่มีใครประมูลสูงกว่าคุณจนถึงเวลาปิดประมูล คุณจะเป็นผู้ชนะ',
      color: 'from-orange-500 to-orange-600'
    },
    {
      icon: <FaCreditCard className="w-8 h-8" />,
      title: 'ชำระเงิน',
      desc: 'ไปที่หน้า "คำสั่งซื้อ" แล้วชำระเงินตามรายละเอียดที่ระบบแจ้ง',
      color: 'from-red-500 to-red-600'
    },
    {
      icon: <FaTruck className="w-8 h-8" />,
      title: 'รับสินค้า',
      desc: 'รอรับสินค้าได้ที่บ้านตามที่อยู่ที่ลงทะเบียนไว้',
      color: 'from-pink-500 to-pink-600'
    }
  ];
  return (
    <div className="mt-16 bg-white rounded-3xl shadow-2xl p-8 md:p-12">
      <div className="text-center mb-12">
        <div className="inline-block bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-full text-sm font-semibold mb-4">
          แนะนำสำหรับผู้เริ่มต้น
        </div>
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">
          ขั้นตอนการประมูลสินค้าแคคตัส
        </h1>
        <p className="text-gray-600 text-lg">ทำตามขั้นตอนง่าย ๆ เหล่านี้เพื่อเริ่มประมูล</p>
      </div>

      <div className="space-y-6">
        {steps.map((step, index) => (
          <div
            key={index}
            className="group relative bg-gradient-to-r from-gray-50 to-white rounded-2xl p-6 border-2 border-gray-100 hover:border-green-300 hover:shadow-lg transition-all duration-300"
          >
            <div className="flex items-start gap-6">
              <div className={`flex-shrink-0 w-16 h-16 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                {step.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl font-bold text-gray-300">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h3 className="text-xl font-bold text-gray-800">
                    {step.title}
                  </h3>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200">
        <div className="flex items-start gap-4">
          <div className="text-3xl">💡</div>
          <div>
            <h4 className="font-bold text-green-800 mb-2">หมายเหตุสำคัญ</h4>
            <p className="text-gray-700">
              ระบบจะอัปเดตสถานะการประมูลแบบเรียลไทม์ โปรดตรวจสอบบ่อย ๆ เพื่อไม่พลาดโอกาสในการประมูล
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
