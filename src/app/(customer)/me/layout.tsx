'use client';
import { usePathname } from 'next/navigation';
export default function MeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isOrdersPage = pathname?.includes('/orders');
  // For orders pages, render without wrapper
  if (isOrdersPage) {
    return <>{children}</>;
  }
  // For other /me pages, use the original layout
  return (
    <div className="min-h-screen pt-36 px-4 py-8">
      <div className="w-full max-w-[1600px] mx-auto px-6">
        {children}
      </div>
    </div>
  );
}