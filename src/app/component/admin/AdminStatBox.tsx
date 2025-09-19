'use client'

interface Props {
  label: string
  value: string | number
}

export default function AdminStatBox({ label, value }: Props) {
  return (
    <div className="bg-white shadow-md rounded-xl p-4 border border-gray-200 hover:shadow-lg transition">
      <p className="text-sm text-black">{label}</p>
      <p className="text-xl font-semibold text-blue-600">{value}</p>
    </div>
  )
}
