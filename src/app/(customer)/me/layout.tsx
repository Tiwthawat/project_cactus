// src/app/me/layout.tsx
export default function MeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pt-36 bg-gray-100 px-4 py-8">
      <div className="w-full max-w-[1600px] mx-auto px-6">

        {children}
      </div>
    </div>
  );
}
