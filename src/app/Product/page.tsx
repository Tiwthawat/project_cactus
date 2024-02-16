"use client" 
// product/page.tsx
import React from "react";
import { useParams } from "react-router-dom";

export default function ProductPage() {
  
  const { productId } = useParams<{ productId: string }>();

  return (
    <main className="flex flex-col h-screen items-center bg-white">
      <div className="mx-5 w-full p-3 h-full text-black text-3xl flex-col overflow-hidden">
        <div className="h-full overflow-y-scroll">
          
          <h2>Product Details</h2>
          <p>Product ID: {productId}</p>
         
        </div>
      </div>
    </main>
  );
};
