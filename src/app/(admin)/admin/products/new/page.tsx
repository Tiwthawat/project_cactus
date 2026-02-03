'use client';
import { apiFetch } from '@/app/lib/apiFetch';
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
    apiFetch('http://localhost:3000/product-types')
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
        const res = await apiFetch('http://localhost:3000/upload', {
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

    const res = await apiFetch('http://localhost:3000/product', {
      method: 'POST',

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
      apiFetch(`http://localhost:3000/subtypes/${form.Typeid}`)
        .then((res) => res.json())
        .then((data) => setSubtypes(data))
        .catch((err) => console.error('โหลดประเภทย่อยไม่สำเร็จ:', err));
    } else {
      setSubtypes([]); // ถ้ายังไม่เลือก type ให้ล้าง subtypes
    }
  }, [form.Typeid]);



  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 py-8">
      <div className="w-full max-w-3xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-block bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-full text-sm font-semibold mb-4">
            เพิ่มสินค้า
          </div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            📦 เพิ่มสินค้าใหม่
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ประเภทสินค้า */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">ประเภทสินค้า</label>
              <select
                name="Typeid"
                value={form.Typeid}
                onChange={handleChange}
                required
                className="w-full p-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-700 focus:border-green-400 focus:outline-none transition-colors"
              >
                <option value="">-- กรุณาเลือกประเภท --</option>
                {types.map((type) => (
                  <option key={type.Typeid} value={type.Typeid}>
                    {type.typenproduct}
                  </option>
                ))}
              </select>
            </div>

            {/* ประเภทย่อย */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">ประเภทย่อย</label>
              <select
                name="Subtypeid"
                value={form.Subtypeid}
                onChange={handleChange}
                required
                className="w-full p-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-700 focus:border-green-400 focus:outline-none transition-colors"
              >
                <option value="">-- กรุณาเลือกประเภทย่อย --</option>
                {subtypes.map((sub) => (
                  <option key={sub.Subtypeid} value={sub.Subtypeid}>
                    {sub.subname}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ชื่อสินค้า */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">ชื่อสินค้า</label>
            <input
              type="text"
              name="Pname"
              value={form.Pname}
              onChange={handleChange}
              required
              className="w-full p-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-800 focus:border-green-400 focus:outline-none transition-colors placeholder-gray-400"
              placeholder="ชื่อสินค้า"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ราคา */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">ราคา (บาท)</label>
              <input
                type="number"
                name="Pprice"
                value={form.Pprice}
                onChange={handleChange}
                required
                className="w-full p-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-800 focus:border-green-400 focus:outline-none transition-colors placeholder-gray-400"
                placeholder="0.00"
              />
            </div>

            {/* จำนวนคงเหลือ */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">จำนวนคงเหลือ</label>
              <input
                type="number"
                name="Pnumproduct"
                value={form.Pnumproduct}
                onChange={handleChange}
                required
                className="w-full p-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-800 focus:border-green-400 focus:outline-none transition-colors placeholder-gray-400"
                placeholder="0"
              />
            </div>
          </div>

          {/* อัปโหลดรูป */}
          <div>
            <label className="flex items-center justify-between text-sm font-semibold text-gray-700 mb-2">
              <span>อัปโหลดรูปสินค้า</span>

              {selectedFiles.length > 0 && (
                <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full border border-blue-300">
                  เลือกแล้ว {selectedFiles.length} รูป
                </span>
              )}
            </label>

            <input
              type="file"
              onChange={handleFileChange}
              accept="image/*"
              multiple
              className="w-full p-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-800 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
            />

            {selectedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                {selectedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <span className="text-sm text-gray-700">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="text-red-500 hover:text-red-700 font-semibold"
                    >
                      ❌
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={uploadSelectedImages}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  📤 เพิ่มรูปภาพ
                </button>
              </div>
            )}

            {form.Ppicture && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">
                    รูปที่อัปโหลดแล้ว
                  </span>
                  <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full border border-green-300">
                    {form.Ppicture.split(',').length} รูป
                  </span>
                </div>

                <div className="flex flex-wrap gap-3 max-h-64 overflow-auto p-4 bg-gray-50 rounded-xl">
                  {form.Ppicture.split(',').map((path, idx) => (
                    <div key={idx} className="relative w-32 h-32 group">
                      <img
                        src={`http://localhost:3000${path}`}
                        alt={`preview-${idx}`}
                        className="w-full h-full object-cover rounded-lg border-2 border-gray-200 shadow-md"
                      />
                      <button
                        type="button"
                        onClick={() => removeUploadedImage(idx)}
                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center shadow-lg"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* รายละเอียดสินค้า */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">รายละเอียดสินค้า</label>
            <textarea
              name="Pdetail"
              value={form.Pdetail}
              onChange={handleChange}
              className="w-full p-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-800 focus:border-green-400 focus:outline-none transition-colors placeholder-gray-400"
              rows={4}
              placeholder="รายละเอียดเพิ่มเติมของสินค้า..."
            />
          </div>

          

          {/* ปุ่ม */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl text-lg"
          >
            💾 บันทึกสินค้า
          </button>
        </form>
      </div>
    </div>
  );
}
