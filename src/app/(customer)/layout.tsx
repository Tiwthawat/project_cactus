// src/app/(customer)/layout.tsx
import { Inter } from "next/font/google";
import Navbar from "../component/Navbar";
import Navigation from "../component/Navigation";
import "@/app/globals.css";




const inter = Inter({ subsets: ["latin"] });

// src/app/(customer)/layout.tsx
export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <Navigation />
      {children}
    </>
  );
}