interface ReceiptItem {
  name: string
  qty: number
  price: number
}

interface ReceiptProps {
  receiptNo: string
  date: string

  customer: {
    name: string
    phone: string
    address: string
  }

  items: ReceiptItem[]

  total: number
  paymentMethod: string
}
export default function ReceiptTemplate(props: ReceiptProps) {
  return (
    <div className="max-w-3xl mx-auto bg-white p-6">
      <h1 className="text-xl font-bold text-center mb-4">
        ใบเสร็จรับเงิน
      </h1>

      <div className="text-sm mb-4">
        <p>เลขที่: {props.receiptNo}</p>
        <p>วันที่: {props.date}</p>
      </div>

      <div className="mb-4">
        <p><b>ลูกค้า:</b> {props.customer.name}</p>
        <p><b>โทร:</b> {props.customer.phone}</p>
        <p><b>ที่อยู่:</b> {props.customer.address}</p>
      </div>

      <table className="w-full text-sm border">
        <thead>
          <tr>
            <th>สินค้า</th>
            <th>จำนวน</th>
            <th>ราคา</th>
            <th>รวม</th>
          </tr>
        </thead>
        <tbody>
          {props.items.map((it, i) => (
            <tr key={i}>
              <td>{it.name}</td>
              <td>{it.qty}</td>
              <td>{it.price.toLocaleString()}</td>
              <td>{(it.qty * it.price).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="text-right font-bold mt-4">
        รวมทั้งสิ้น {props.total.toLocaleString()} บาท
      </div>
    </div>
  )
}
