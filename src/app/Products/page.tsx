
import React from "react";

export default function products() {
  return (
    <main className="flex flex-col h-screen items-center bg-white">
      <div className="mx-5 w-full p-3 h-full text-black text-3xl flex-col overflow-hidden">
        <div className="h-full overflow-y-scroll">
          <div className="text-center my-8">
            <h1 className="text-4xl font-bold">การรับประกันสินค้า</h1>
            <p className="mt-4">
              เรามุ่งมั่นที่จะให้บริการที่ดีที่สุดแก่ลูกค้าของเรา ดังนั้นเรามีการรับประกันสินค้าหลังจากการจัดส่งออกมาให้คุณ
            </p>
            <p className="mt-4">
              หากพบว่าสินค้ามีปัญหาหรือเสียหายในระหว่างการจัดส่ง โปรดติดต่อเราทันทีภายใน 7 วันหลังจากได้รับสินค้า เพื่อให้เราสามารถแก้ไขปัญหาหรือจัดการกับสินค้าให้คุณได้ทันที
            </p>
            <p className="mt-4">
              ขอบคุณที่เลือกใช้บริการของเรา
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};


// ProductDetailPage.tsx

// import React, { useEffect, useState } from "react";

// interface ProductDetail {
//   Pid: number;
//   Pname: string;
//   Pprice: number;
//   Pnumproduct: number;
//   Prenume: number;
//   Pstatus: string;
//   Ppicture: string;
//   Pdescription: string; 
// }

// interface ProductDetailProps {
//   productId: number; 
// }

// const ProductDetail: React.FC<ProductDetailProps> = ({ productId }) => {
//   const [product, setProduct] = useState<ProductDetail | null>(null);

//   useEffect(() => {
//     const fetchProductDetail = async () => {
//       try {
//         const res = await fetch(`http://localhost:3000/products/:${productId}`);
//         if (!res.ok) {
//           throw new Error("การดึงข้อมูลสินค้าล้มเหลว");
//         }
//         const productData = await res.json();
//         setProduct(productData);
//       } catch (error) {
//         console.error("เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า:", error);
        
//       }
//     };

//     fetchProductDetail();
//   }, [productId]);

//   if (!product) {
//     return <div>Loading...</div>; 
//   }

//   return (
//     <div>
//       <h2>{product.Pname}</h2>
//       <img src={product.Ppicture} alt={product.Pname} />
//       <p>{product.Pdescription}</p>
//       <p>Price: {product.Pprice} ฿</p>
//       {/* อื่น ๆ ตามความต้องการ */}
//     </div>
//   );
// };

// export default ProductDetail;
