'use client';
import { apiFetch } from '@/app/lib/apiFetch';
import { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface Product {
  Pname: string;
  Pprice: string;
  Pnumproduct: string;
  Pdetail: string;
  Ppicture: string;
  Pstatus: string;
  Typeid: number | '';
  Subtypeid: number | '';
}

interface ProductType {
  Typeid: number;
  typenproduct: string;
}

export default function EditProducts() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [types, setTypes] = useState<ProductType[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [subtypes, setSubtypes] = useState<{ Subtypeid: number; subname: string }[]>([]);


  const [form, setForm] = useState<Product>({
    Pname: '',
    Pprice: '',
    Pnumproduct: '',
    Pdetail: '',
    Ppicture: '',
    Pstatus: 'In stock',
    Typeid: '',
    Subtypeid: '',
  });

  useEffect(() => {
    apiFetch(`http://localhost:3000/product/${id}`)
      .then((res) => res.json())
      .then((data: any) => {
        setForm({
          Pname: data.Pname,
          Pprice: data.Pprice.toString(),
          Pnumproduct: data.Pnumproduct.toString(),
          Pdetail: data.Pdetail,
          Ppicture: data.Ppicture,
          Pstatus: data.Pstatus,
          Typeid: data.Typeid || '',
          Subtypeid: data.Subtypeid || '',

        });
        setLoading(false);
      });

    apiFetch('http://localhost:3000/product-types')
      .then((res) => res.json())
      .then((data: ProductType[]) => setTypes(data));
  }, [id]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'Typeid' ? Number(value) : value,
    }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setSelectedFiles(Array.from(files));
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeUploadedImage = (index: number) => {
    const paths = form.Ppicture.split(',');
    paths.splice(index, 1);
    setForm((prev) => ({ ...prev, Ppicture: paths.join(',') }));
  };

  const uploadSelectedImages = async () => {
    const uploadedPaths: string[] = [];
    for (const file of selectedFiles) {
      const formData = new FormData();
      formData.append('image', file);
      const res = await apiFetch('http://localhost:3000/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      const correctPath = data.url.replace('/uploads', '');
      uploadedPaths.push(correctPath);
    }
    setForm((prev) => ({
      ...prev,
      Ppicture: prev.Ppicture ? prev.Ppicture + ',' + uploadedPaths.join(',') : uploadedPaths.join(','),
    }));
    setSelectedFiles([]);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const res = await apiFetch(`http://localhost:3000/product/${id}`, {
      method: 'PUT',
     
      body: JSON.stringify({
        ...form,
        Pprice: parseFloat(form.Pprice),
        Pnumproduct: parseInt(form.Pnumproduct),
        Typeid: Number(form.Typeid),
        Subtypeid: Number(form.Subtypeid),

      }),
    });
    if (res.ok) {
      router.push('/admin/products');
    } else {
      alert('อัปเดตไม่สำเร็จ');
    }
  };
  useEffect(() => {
    if (form.Typeid) {
      apiFetch(`http://localhost:3000/subtypes/${form.Typeid}`)
        .then((res) => res.json())
        .then((data) => setSubtypes(data))
        .catch((err) => console.error('โหลด subtypes ไม่สำเร็จ:', err));
    } else {
      setSubtypes([]);
    }
  }, [form.Typeid]);


  if (loading) return <p className="text-center text-gray-500">กำลังโหลดข้อมูลสินค้า...</p>;

  return (
    <div className="p-6 max-w-xl mx-auto text-black">
      <h1 className="text-2xl font-bold mb-4 text-center">แก้ไขสินค้า</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <select name="Typeid" value={form.Typeid} onChange={handleChange} className="w-full bg-white border px-3 py-2">
          <option value="">-- เลือกประเภทสินค้า --</option>
          {types.map((type) => (
            <option key={type.Typeid} value={type.Typeid}>{type.typenproduct}</option>
          ))}
        </select>
        <select
          name="Subtypeid"
          value={form.Subtypeid}
          onChange={handleChange}
          required
          className="w-full bg-white border px-3 py-2"
        >
          <option value="">-- เลือกประเภทย่อย --</option>
          {subtypes.map((sub) => (
            <option key={sub.Subtypeid} value={sub.Subtypeid}>
              {sub.subname}
            </option>
          ))}
        </select>

        <input name="Pname" value={form.Pname} onChange={handleChange} className="w-full bg-white border px-3 py-2" />
        <input name="Pprice" value={form.Pprice} onChange={handleChange} className="w-full bg-white border px-3 py-2" />
        <input name="Pnumproduct" value={form.Pnumproduct} onChange={handleChange} className="w-full bg-white border px-3 py-2" />
        <textarea name="Pdetail" value={form.Pdetail} onChange={handleChange} className="w-full bg-white border px-3 py-2" />
        <select name="Pstatus" value={form.Pstatus} onChange={handleChange} className="w-full bg-white border px-3 py-2">
          <option value="In stock">In stock</option>
          <option value="Out of stock">Out of stock</option>
        </select>

        <input type="file" onChange={handleFileChange} multiple className="w-full bg-white" />
        {selectedFiles.length > 0 && (
          <div className="space-y-1">
            {selectedFiles.map((file, i) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <span>{file.name}</span>
                <button type="button" onClick={() => removeFile(i)} className="text-red-500">❌</button>
              </div>
            ))}
            <button type="button" onClick={uploadSelectedImages} className="bg-blue-500 text-white px-3 py-1 rounded">📤 เพิ่มรูป</button>
          </div>
        )}

        {form.Ppicture.split(',').map((path, idx) => (
          <div key={idx} className="relative w-20 h-20">
            <img src={`http://localhost:3000${path}`} className="w-full h-full object-cover rounded border" />
            <button type="button" onClick={() => removeUploadedImage(idx)} className="absolute top-0 right-0 text-white bg-red-500 rounded-full px-1">×</button>
          </div>
        ))}

        <button type="submit" className="w-full bg-yellow-500 text-white py-2 rounded">บันทึก</button>
      </form>
    </div>
  );
}