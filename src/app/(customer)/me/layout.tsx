// src/app/me/layout.tsx
export default function MeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pt-36 bg-gray-100 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {children}
      </div>
    </div>
  );
}
