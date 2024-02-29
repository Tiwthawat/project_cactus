//CactusItems.tsx
'use client';
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";


interface Product {
  Pid: number;
  Pname: string;
  Pprice: number;
  Pnumproduct: number;
  Prenume: number;
  Pstatus: string;
  Ppicture: string;
}

interface CactusItemsProps {
  id: number;
  imageSrc: string;
  name: string;
  price: number;
}

const CactusItems: React.FC<CactusItemsProps> = ({ id, imageSrc, name, price }) => {
  

  return (
    <div className="card mt-2 w-56 mr-10 ml-6 mb-5">
    <figure>
        {/* ใช้ Link component เพื่อสร้างลิงก์ไปยังหน้า Product */}
        <a href={`/products/${id} `}>

          <picture className="flex">
            <img
              src={imageSrc}
              alt={name}
              className="w-56 h-56 object-cover border-4 border-white rounded-xl"
            />
          </picture>
        </a>
      </figure>
      <div className="card-body">
        <p className="text-sm text-black">{name}</p>
        <p className="text-2xl text-red-600 pl-16">{price} ฿</p>
        <p className="text-sm text-black">รหัสสินค้า: {id}</p>
        <div className="justify-end">
          <button className="btn w-full bg-red-500 btn-error">ซื้อเลยตอนนี้</button>
        </div>
      </div>
    </div>
  );
};

async function getData() {
  try {
    const res = await fetch("http://localhost:3000/Product");

    if (!res.ok) {
      throw new Error("การดึงข้อมูลล้มเหลว");
    }

    const responseData = await res.json();
    return responseData;
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการดึงข้อมูล:", error);
    throw error;
  }
}

const CactusItemsContainer: React.FC = () => {
  const [products, setProducts] = useState<Product[][]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const responseData = await getData();
        if (Array.isArray(responseData)) {
          const groupedProducts = responseData.reduce((accumulator, currentValue, index) => {
            const groupIndex = Math.floor(index / 5);
            if (!accumulator[groupIndex]) {
              accumulator[groupIndex] = [];
            }
            accumulator[groupIndex].push(currentValue);
            return accumulator;
          }, [] as Product[][]);
          setProducts(groupedProducts);
        } else {
          throw new Error("ข้อมูลที่ได้ไม่ใช่รูปแบบของอาร์เรย์");
        }
      } catch (error) {
        console.error("เกิดข้อผิดพลาดในการดึงข้อมูล:", error);
        // Redirect to error page or handle error as needed
         // For example, redirect to an error page
      }
    };
    fetchData();
  }, []);

  return (
    <div className="flex flex-wrap items-center justify-start">
      {products.map((productGroup, index) => (
        <div key={index} className="flex ml-10 flex-wrap">
          {productGroup.map((product) => (
            <CactusItems
              key={product.Pid}
              id={product.Pid}
              imageSrc={product.Ppicture}
              name={product.Pname}
              price={product.Pprice}
            
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default CactusItemsContainer;