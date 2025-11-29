// src/app/layout.tsx
import { Inter } from "next/font/google";
import "@/app/globals.css";
import { Providers } from "./providers";


const inter = Inter({ subsets: ["latin"] });

export const metadata = {

  title: "Cactus Auction",
  description: "ระบบประมูลต้นไม้แคคตัส",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <head>
        <link rel="icon" href="/logoauction.png" />
      </head>

      <body className={`${inter.className} bg-white text-black min-h-screen`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
