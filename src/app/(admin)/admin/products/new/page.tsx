'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ProductForm {
  Pname: string;
  Pprice: string;
  Pnumproduct: string;
  Ppicture: string;
  Pdetail: string;
  Pstatus: string;
   Typeid: number | '';
  Subtypeid: number | '';
}

interface ProductType {
  Typeid: number;
  typenproduct: string;
}

export default function AddProductPage() {
  const router = useRouter();
  const [subtypes, setSubtypes] = useState<{ Subtypeid: number; subname: string }[]>([]);


  const [form, setForm] = useState<ProductForm>({
    Pname: '',
    Pprice: '',
    Pnumproduct: '',
    Ppicture: '',
    Pdetail: '',
    Pstatus: 'In stock',
    Typeid: '',
    Subtypeid: '',
  });

  const [types, setTypes] = useState<ProductType[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  useEffect(() => {
    fetch('http://localhost:3000/product-types')
      .then((res) => res.json())
      .then((data: ProductType[]) => setTypes(data))
      .catch((err) => console.error('Failed to fetch types:', err));
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'Pprice' || name === 'Pnumproduct' || name === 'Typeid' ? Number(value) : value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files;
  if (!files) return;
  setSelectedFiles(Array.from(files)); // แปลงเป็น Array
};
const removeFile = (index: number) => {
  setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
};
const removeUploadedImage = (index: number) => {
  const paths = form.Ppicture.split(',');
  paths.splice(index, 1); // ลบ index ที่เลือก
  setForm((prev) => ({ ...prev, Ppicture: paths.join(',') }));
};



  const uploadSelectedImages = async () => {
    if (!selectedFiles) return;

    const uploadedPaths: string[] = [];
    const fileArray = Array.from(selectedFiles);

    for (const file of fileArray) {
      const formData = new FormData();
      formData.append('image', file);

      try {
        const res = await fetch('http://localhost:3000/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        const correctPath = data.url.replace('/uploads', '');
        uploadedPaths.push(correctPath);
      } catch (err) {
        alert(`อัปโหลดรูป ${file.name} ไม่สำเร็จ`);
      }
    }

    setForm((prev) => ({
      ...prev,
      Ppicture: prev.Ppicture
        ? prev.Ppicture + ',' + uploadedPaths.join(',')
        : uploadedPaths.join(','),
    }));

    setSelectedFiles([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const productData = {
      ...form,
      Pprice: parseFloat(form.Pprice),
      Pnumproduct: parseInt(form.Pnumproduct),
      Prenume: 0,
    };

    const res = await fetch('http://localhost:3000/product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData),
    });

    if (res.ok) {
      router.push('/admin/products');
    } else {
      alert('เพิ่มสินค้าล้มเหลว');
    }
  };
  useEffect(() => {
  if (form.Typeid) {
    fetch(`http://localhost:3000/subtypes/${form.Typeid}`)
      .then((res) => res.json())
      .then((data) => setSubtypes(data))
      .catch((err) => console.error('โหลดประเภทย่อยไม่สำเร็จ:', err));
  } else {
    setSubtypes([]); // ถ้ายังไม่เลือก type ให้ล้าง subtypes
  }
}, [form.Typeid]);


  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg text-black">
      <h1 className="text-2xl font-bold mb-6 text-center">เพิ่มสินค้าใหม่</h1>
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow border">
        {/* ประเภทสินค้า */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ประเภทสินค้า</label>
          <select
            name="Typeid"
            value={form.Typeid}
            onChange={handleChange}
            required
            className="w-full rounded-md border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500 text-gray-700 bg-white"
          >
            <option value="">-- กรุณาเลือกประเภท --</option>
            {types.map((type) => (
              <option key={type.Typeid} value={type.Typeid}>
                {type.typenproduct}
              </option>
            ))}
          </select>
        </div>{/* ประเภทย่อย */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">ประเภทย่อย</label>
  <select
    name="Subtypeid"
    value={form.Subtypeid}
    onChange={handleChange}
    required
    className="w-full rounded-md border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500 bg-white text-gray-700"
  >
    <option value="">-- กรุณาเลือกประเภทย่อย --</option>
    {subtypes.map((sub) => (
      <option key={sub.Subtypeid} value={sub.Subtypeid}>
        {sub.subname}
      </option>
    ))}
  </select>
</div>


        {/* ชื่อสินค้า */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อสินค้า</label>
          <input
            type="text"
            name="Pname"
            value={form.Pname}
            onChange={handleChange}
            required
            className="w-full bg-white text-gray-800 rounded-md border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500 placeholder-gray-400"
            placeholder="ชื่อสินค้า"
          />
        </div>

        {/* ราคา */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ราคา</label>
          <input
            type="number"
            name="Pprice"
            value={form.Pprice}
            onChange={handleChange}
            required
            className="w-full rounded-md bg-white text-gray-800 border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500 placeholder-gray-400"
            placeholder="ราคา"
          />
        </div>

        {/* จำนวนคงเหลือ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนคงเหลือ</label>
          <input
            type="number"
            name="Pnumproduct"
            value={form.Pnumproduct}
            onChange={handleChange}
            required
            className="w-full rounded-md bg-white text-gray-800 border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500 placeholder-gray-400"
            placeholder="จำนวนสินค้า"
          />
        </div>

        {/* อัปโหลดรูป */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">อัปโหลดรูปสินค้า</label>
          <input
            type="file"
            onChange={handleFileChange}
            accept="image/*"
            multiple
            className="w-full rounded-md bg-white text-gray-800 border-gray-300"
          />

          {selectedFiles.length > 0 && (
  <div className="mt-2 space-y-1">
    {selectedFiles.map((file, idx) => (
      <div key={idx} className="flex items-center bg-white  justify-between text-sm text-gray-600">
        <span>{file.name}</span>
        <button
          type="button"
          onClick={() => removeFile(idx)}
          className="text-red-500 hover:text-red-700"
        >
          ❌
        </button>
      </div>
    ))}
    <button
      type="button"
      onClick={uploadSelectedImages}
      className="mt-2 bg-blue-500  text-white px-3 py-1 rounded hover:bg-blue-600"
    >
      📤 เพิ่มรูปภาพ
    </button>
  </div>
)}


         {form.Ppicture && (
  <div className="flex flex-wrap gap-3 mt-4 max-h-64 overflow-auto">
    {form.Ppicture.split(',').map((path, idx) => (
      <div key={idx} className="relative w-32 h-32">
        <img
          src={`http://localhost:3000${path}`}
          alt={`preview-${idx}`}
          className="w-full h-full bg-white text-gray-800 object-cover rounded border"
        />
        <button
          type="button"
          onClick={() => removeUploadedImage(idx)}
          className="absolute top-1 right-1 bg-red-500 text-white rounded-full px-1"
        >
          ×
        </button>
      </div>
    ))}
  </div>
)}


        </div>

        {/* รายละเอียดสินค้า */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียดสินค้า</label>
          <textarea
            name="Pdetail"
            value={form.Pdetail}
            onChange={handleChange}
            className="w-full rounded-md bg-white text-gray-800 border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500 placeholder-gray-400"
            rows={3}
            placeholder="รายละเอียดเพิ่มเติมของสินค้า..."
          />
        </div>

        {/* สถานะสินค้า */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">สถานะสินค้า</label>
          <select
            name="Pstatus"
            value={form.Pstatus}
            onChange={handleChange}
            className="w-full rounded-md border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500 bg-white text-gray-700"
          >
            <option value="In stock">In stock</option>
            <option value="Out of stock">Out of stock</option>
          </select>
        </div>

        {/* ปุ่ม */}
        <button
          type="submit"
          className="w-full bg-green-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-green-700 transition"
        >
          บันทึกสินค้า
        </button>
      </form>
    </div>
  );
}
