'use client';

import {
  FaShoppingCart,
  FaClock,
  FaCreditCard,
  FaUserCircle,
  FaMoneyBillWave,
  FaTruck,
  FaBoxOpen,
  FaGavel,
  FaCheckCircle,
  FaMapMarkedAlt,
} from 'react-icons/fa';

type Step = {
  icon: any;
  title: string;
  desc: string;
  notes?: string[];
};

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-100 bg-emerald-50 text-emerald-800 text-xs font-semibold">
      {children}
    </span>
  );
}

function Card({
  title,
  subtitle,
  steps,
}: {
  title: string;
  subtitle: string;
  steps: Step[];
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
      <div className="p-5 md:p-6 border-b border-gray-100">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-lg md:text-xl font-extrabold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          </div>
          <Pill>Flow</Pill>
        </div>
      </div>

      <div className="p-5 md:p-6">
        <ol className="space-y-4">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            const no = String(idx + 1).padStart(2, '0');

            return (
              <li
                key={idx}
                className="group relative rounded-2xl border border-gray-200 bg-white hover:border-emerald-200 hover:shadow-sm transition"
              >
                <div className="p-5 md:p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shadow-sm">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="text-xs font-extrabold tracking-widest text-gray-300">
                        {no}
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <h3 className="text-base md:text-lg font-extrabold text-gray-900">
                          {s.title}
                        </h3>
                        <Pill>Step {idx + 1}</Pill>
                      </div>

                      <p className="text-gray-600 leading-relaxed mt-2">{s.desc}</p>

                      {s.notes?.length ? (
                        <div className="mt-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                          <p className="text-xs font-bold text-gray-700 mb-2">
                            เงื่อนไข/ข้อควรรู้
                          </p>
                          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                            {s.notes.map((n, i) => (
                              <li key={i}>{n}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      <div className="mt-4 h-px bg-gradient-to-r from-emerald-200/70 via-gray-100 to-transparent" />
                    </div>
                  </div>
                </div>

                <div className="pointer-events-none absolute inset-0 rounded-2xl ring-0 group-hover:ring-1 group-hover:ring-emerald-200 transition" />
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

export default function GuideFlowsPage() {
  // ✅ Flow 1: ซื้อปกติ (โอนเงิน)
  const normalTransfer: Step[] = [
    {
      icon: FaUserCircle,
      title: 'เข้าสู่ระบบ / สมัครสมาชิก',
      desc: 'เพื่อบันทึกที่อยู่ ประวัติคำสั่งซื้อ และติดตามสถานะได้ครบถ้วน',
      notes: ['แนะนำให้กรอกที่อยู่ให้ครบก่อนสั่งซื้อ เพื่อการจัดส่งที่ถูกต้อง'],
    },
    {
      icon: FaShoppingCart,
      title: 'เลือกสินค้า → ใส่ตะกร้า → ยืนยันคำสั่งซื้อ',
      desc: 'เลือกสินค้าในหน้าร้าน ใส่ตะกร้า แล้วไปที่หน้า Checkout เพื่อยืนยันรายการ',
      notes: ['ตรวจสอบจำนวนสินค้าและราคาก่อนกดยืนยันคำสั่งซื้อ'],
    },
    {
      icon: FaCreditCard,
      title: 'ชำระเงินแบบโอน',
      desc: 'ไปที่หน้า “คำสั่งซื้อ” แล้วกด “แจ้งชำระเงิน” เพื่ออัปโหลดสลิป/ข้อมูลการโอน',
      notes: [
        'สถานะช่วงแรก: “รอชำระเงิน” (โอนเท่านั้น)',
        'หลังแจ้งชำระ: สถานะจะเป็น “รอตรวจสอบ”',
      ],
    },
    {
      icon: FaCheckCircle,
      title: 'รอตรวจสอบการชำระเงิน',
      desc: 'แอดมินตรวจสอบสลิป เมื่อผ่านแล้วระบบจะอัปเดตสถานะเพื่อเตรียมจัดส่ง',
      notes: ['ถ้าสลิปไม่ผ่าน อาจต้องแจ้งชำระใหม่ (ขึ้นกับเงื่อนไขของระบบ/แอดมิน)'],
    },
    {
      icon: FaTruck,
      title: 'จัดส่งสินค้า → ติดตามสถานะ',
      desc: 'เมื่อจัดส่งแล้ว สถานะจะเปลี่ยนเป็น “รอรับสินค้า” และอัปเดตจนถึง “ได้รับแล้ว”',
      notes: ['ติดตามสถานะได้ในหน้า “คำสั่งซื้อ”'],
    },
  ];

  // ✅ Flow 2: ซื้อปกติ (COD)
  const normalCOD: Step[] = [
    {
      icon: FaUserCircle,
      title: 'เข้าสู่ระบบ / สมัครสมาชิก',
      desc: 'ใช้สำหรับบันทึกที่อยู่และติดต่อการจัดส่งแบบปลายทาง',
      notes: ['ต้องกรอกที่อยู่/เบอร์โทรให้ถูกต้อง เพราะใช้สำหรับจัดส่งและติดต่อปลายทาง'],
    },
    {
      icon: FaShoppingCart,
      title: 'เลือกสินค้า → ใส่ตะกร้า → เลือกชำระปลายทาง (COD)',
      desc: 'ยืนยันคำสั่งซื้อโดยเลือกวิธีชำระเงินแบบ COD',
      notes: [
        'COD ไม่ต้องแจ้งชำระเงิน',
        'สถานะจะไปทาง “รอจัดส่ง” (แทน “รอชำระเงิน”)',
      ],
    },
    {
      icon: FaTruck,
      title: 'รอจัดส่ง → รับสินค้า → ชำระเงินกับขนส่ง/ปลายทาง',
      desc: 'เมื่อได้รับสินค้าแล้วชำระเงินตามขั้นตอนของ COD',
      notes: [
        'โปรดเตรียมเงินปลายทางตามยอดในคำสั่งซื้อ',
        'ติดตามสถานะได้ในหน้า “คำสั่งซื้อ”',
      ],
    },
  ];

  // ✅ Flow 3: ประมูล (ผู้ชนะประมูล)
  const auctionFlow: Step[] = [
    {
      icon: FaUserCircle,
      title: 'เข้าสู่ระบบ / สมัครสมาชิก',
      desc: 'เพื่อเข้าร่วมประมูลและให้ระบบบันทึกผู้เสนอราคา/ผู้ชนะได้ถูกต้อง',
      notes: ['แนะนำให้กรอกที่อยู่ให้ครบก่อนเข้าประมูล เพื่อไม่ชะงักตอนชนะ'],
    },
    {
      icon: FaGavel,
      title: 'เข้าหน้าประมูล → เสนอราคา',
      desc: 'เลือกสินค้าที่เปิดประมูล ใส่ราคาที่ต้องการ แล้วกดเสนอราคา',
      notes: [
        'ต้องเสนอราคาสูงกว่าราคาปัจจุบันตามเงื่อนไขขั้นต่ำของระบบ (เช่น min increment)',
        'ประมูลไปแล้วไม่สามารถ “ยกเลิกบิด” ย้อนหลังได้ (ตามปกติของระบบประมูล)',
      ],
    },
    {
      icon: FaClock,
      title: 'รอเวลาปิดประมูล',
      desc: 'เมื่อถึงเวลาปิด หากคุณเป็นราคาสูงสุด ระบบจะบันทึกเป็น “ผู้ชนะประมูล”',
      notes: ['ตรวจสอบผลได้ที่หน้า “ผู้ชนะประมูล”'],
    },
    {
  icon: FaBoxOpen,
  title: 'ผู้ชนะต้องชำระเงินภายใน 24 ชั่วโมง',
  desc: 'เมื่อเป็นผู้ชนะประมูล ระบบจะสร้างรายการชำระเงิน ผู้ชนะต้องดำเนินการชำระภายใน 1 วัน (24 ชม.)',
  notes: [
    'หากไม่ชำระภายในเวลาที่กำหนด ระบบอาจยกเลิกสิทธิ์โดยอัตโนมัติ',
    'สถานะช่วงแรก: “รอชำระเงิน”',
    'หลังแจ้งชำระ: เปลี่ยนเป็น “รอตรวจสอบ” (ถ้ามีขั้นตอนตรวจสลิป)',
  ],
},

    {
      icon: FaTruck,
      title: 'จัดส่งสินค้า → ติดตามสถานะ',
      desc: 'เมื่อชำระผ่าน แอดมินเตรียมจัดส่งและอัปเดตเลขพัสดุ/บริษัทขนส่ง (ถ้ามี)',
      notes: ['ติดตามได้จากหน้า “ผู้ชนะประมูล” หรือหน้ารายละเอียดรายการนั้น'],
    },
    {
      icon: FaCheckCircle,
      title: 'ยืนยันรับสินค้า',
      desc: 'เมื่อได้รับสินค้าแล้ว กด “ยืนยันรับสินค้า” เพื่อปิดงานและบันทึกสถานะสำเร็จ',
      notes: ['การยืนยันรับสินค้าเป็นหลักฐานว่ารับของเรียบร้อยแล้ว'],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/60 via-gray-50 to-gray-50 text-black">
      <div className="max-w-5xl mx-auto pt-28 p-6">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur border border-emerald-100 rounded-3xl shadow-sm p-6 md:p-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold tracking-wide text-emerald-800">
              Guide & Conditions
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-3">
            คู่มือการสั่งซื้อ & การประมูล
          </h1>

          <p className="text-gray-500 mt-2 leading-relaxed">
            หน้านี้สรุปโฟลวการใช้งานให้ตรงกับระบบของเรา:
            <span className="font-semibold text-gray-700"> ซื้อปกติ (โอน)</span>,
            <span className="font-semibold text-gray-700"> ซื้อปกติ (COD)</span> และ
            <span className="font-semibold text-gray-700"> ประมูล (ผู้ชนะประมูล)</span>
          </p>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
              <div className="text-xs text-gray-500">ซื้อปกติ (โอน)</div>
              <div className="text-sm font-semibold text-gray-900 mt-1">
                รอชำระเงิน → รอตรวจสอบ → รอจัดส่ง → รอรับสินค้า → ได้รับแล้ว
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
              <div className="text-xs text-gray-500">ซื้อปกติ (COD)</div>
              <div className="text-sm font-semibold text-gray-900 mt-1">
                รอจัดส่ง → รอรับสินค้า → ได้รับแล้ว (ชำระปลายทาง)
              </div>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3">
              <div className="text-xs text-emerald-800/70">ประมูล</div>
              <div className="text-sm font-semibold text-emerald-900 mt-1">
                เสนอราคา → รอปิด → ผู้ชนะรอจ่าย → (ตรวจสลิป) → จัดส่ง → ยืนยันรับ
              </div>
            </div>
          </div>
        </div>

        {/* 3 flows */}
        <div className="mt-6 space-y-6">
          <Card
            title="ซื้อสินค้าแบบปกติ (โอนเงิน)"
            subtitle="เหมาะสำหรับคนที่ต้องการชำระด้วยการโอนและอัปโหลดสลิปเพื่อให้ระบบตรวจสอบ"
            steps={normalTransfer}
          />

          <Card
            title="ซื้อสินค้าแบบปกติ (ชำระปลายทาง / COD)"
            subtitle="ไม่ต้องแจ้งสลิป ระบบจะไปสถานะรอจัดส่ง และชำระเมื่อได้รับสินค้าตามขั้นตอน COD"
            steps={normalCOD}
          />

          <Card
            title="ประมูลสินค้า (สำหรับผู้ชนะประมูล)"
            subtitle="สรุปตั้งแต่เข้าร่วมประมูลจนถึงชำระเงินและยืนยันรับสินค้าให้จบงานแบบครบ flow"
            steps={auctionFlow}
          />
        </div>

        {/* Conditions (รวมเงื่อนไขแบบชัด ๆ) */}
        <div className="mt-6 bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-emerald-500/70 via-emerald-400/30 to-transparent" />
          <div className="p-5 md:p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
                <FaMapMarkedAlt className="w-5 h-5" />
              </div>

              <div className="flex-1">
                <h4 className="text-base font-extrabold text-gray-900">เงื่อนไขสำคัญ (อ่านให้จบ)</h4>
                <p className="text-gray-600 mt-1 leading-relaxed">
                  เพื่อให้ใช้งานลื่นและไม่พลาดขั้นตอน ระบบของเราจะแยกเงื่อนไขตามประเภทการซื้อดังนี้
                </p>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                    <p className="text-xs font-bold text-gray-700 mb-2">ซื้อปกติ (โอน)</p>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                      <li>มีปุ่ม “แจ้งชำระเงิน” เฉพาะตอนสถานะรอชำระเงิน</li>
                      <li>หลังแจ้งชำระ สถานะจะเป็น “รอตรวจสอบ”</li>
                      <li>ผ่านตรวจสอบแล้วจึงเข้าสู่ขั้นตอนจัดส่ง</li>
                    </ul>
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                    <p className="text-xs font-bold text-gray-700 mb-2">ซื้อปกติ (COD)</p>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                      <li>ไม่มีการอัปโหลดสลิป / ไม่มีขั้นตอนตรวจสลิป</li>
                      <li>สถานะจะไปทาง “รอจัดส่ง” แล้ว “รอรับสินค้า”</li>
                      <li>ชำระเงินเมื่อได้รับสินค้า (ปลายทาง)</li>
                    </ul>
                  </div>

                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3">
  <p className="text-xs font-bold text-emerald-900 mb-2">ประมูล</p>
  <ul className="list-disc pl-5 space-y-1 text-sm text-emerald-900/80">
    <li>เสนอราคาต้องสูงกว่าราคาปัจจุบันตามเงื่อนไขระบบ</li>
    <li>ผลผู้ชนะดูในหน้า “ผู้ชนะประมูล”</li>
    <li className="font-semibold">
      ผู้ชนะต้องชำระเงินภายใน 24 ชั่วโมง มิฉะนั้นระบบอาจยกเลิกสิทธิ์
    </li>
    <li>หลังชำระผ่านแล้วจึงเข้าสู่ขั้นตอนจัดส่ง</li>
    <li>รับสินค้าแล้วกด “ยืนยันรับสินค้า” เพื่อปิดงาน</li>
  </ul>
</div>
<div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
  <p className="text-sm font-semibold text-red-800">
    หมายเหตุ: ระบบกำหนดระยะเวลาชำระเงิน 24 ชั่วโมงสำหรับผู้ชนะประมูล
  </p>
  <p className="text-xs text-red-700 mt-1">
    หากพ้นกำหนด ระบบอาจยกเลิกรายการโดยอัตโนมัติ และถือว่าสละสิทธิ์
  </p>
</div>

                </div>

                <div className="mt-4 rounded-2xl border border-gray-200 bg-white px-4 py-3">
                  <p className="text-sm font-semibold text-gray-900">
                    ทิปให้ใช้งานไม่สะดุด:
                    <span className="text-gray-600 font-normal">
                      {' '}
                      ตรวจสอบที่อยู่และเบอร์โทรให้ถูกต้องก่อนสั่งซื้อ/ก่อนเข้าประมูล และติดตามสถานะจากเมนู “คำสั่งซื้อ”
                      หรือ “ผู้ชนะประมูล” เป็นระยะ
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="h-10" />
      </div>
    </div>
  );
}
