// src/app/layout.tsx
import { Inter } from "next/font/google";
import "@/app/globals.css";


const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  
  title: "Cactus Auction",
  description: "ระบบประมูลต้นไม้แคคตัสสุดเทพ",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <head>
        <link rel="icon" href="/logoauction.png" />
      </head>

      <body className={`${inter.className} bg-white text-black min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
