'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CartPanel from '../(customer)/cart/CartPanel';
import { TbBellRingingFilled } from 'react-icons/tb';

import {
  X,
  Search,
  ShoppingCart,
  List,
  User,
  Gavel,
  History,
  Trophy,
  LogOut,
  HelpCircle,
  BookOpen,
  MessagesSquare,
  ShieldCheck,
  Info,
  Home,
  ChevronRight,
  Sprout,
  Leaf,
  Flower2,
  Sparkles,
  LayoutDashboard,
} from 'lucide-react';

type SidebarMode = 'user' | 'categories' | 'search' | 'cart' | 'menu' | 'notifications' | null;

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  mode: SidebarMode;
  username: string | null;
  cartCount: number;
  handleLogout: () => void;
  setMode: (mode: SidebarMode) => void;
  profile: string | null;
  role: 'user' | 'admin' | null;
}

type NotiItem = {
  Nid: number;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: 0 | 1;
  created_at: string;
};

type NotiListResponse = { items: NotiItem[] };

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

const getProfileUrl = (filename: string | null) => {
  if (!filename) return '/default-profile.png';
  if (filename.startsWith('http')) return filename;
  return `${API}/profiles/${filename}`;
};

const categories = [
  { id: 1, label: 'แคคตัสหนามสั้น', icon: Leaf },
  { id: 2, label: 'แคคตัสหนามยาว', icon: Sprout },
  { id: 3, label: 'ไม้อวบน้ำ', icon: Flower2 },
  { id: 4, label: 'ของตกแต่งกระถาง', icon: Sparkles },
] as const;

function IconBadge({
  children,
  tone = 'emerald',
}: {
  children: React.ReactNode;
  tone?: 'emerald' | 'blue' | 'amber' | 'purple' | 'gray' | 'red';
}) {
  const map = {
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    blue: 'bg-blue-50 text-blue-700 ring-blue-100',
    amber: 'bg-amber-50 text-amber-700 ring-amber-100',
    purple: 'bg-purple-50 text-purple-700 ring-purple-100',
    gray: 'bg-gray-50 text-gray-700 ring-gray-100',
    red: 'bg-red-50 text-red-600 ring-red-100',
  } as const;

  return (
    <span
      className={[
        'inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1',
        map[tone],
      ].join(' ')}
    >
      {children}
    </span>
  );
}

function Row({
  href,
  onClick,
  icon,
  label,
  tone,
}: {
  href?: string;
  onClick?: () => void;
  icon: React.ReactNode;
  label: string;
  tone?: Parameters<typeof IconBadge>[0]['tone'];
}) {
  const content = (
    <div className="flex items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-gray-50 active:scale-[0.99]">
      <IconBadge tone={tone}>{icon}</IconBadge>
      <span className="flex-1 text-[14px] font-medium text-gray-700">{label}</span>
      <ChevronRight className="h-5 w-5 text-gray-300" />
    </div>
  );

  if (href) {
    return (
      <Link href={href} onClick={onClick} className="block">
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className="w-full text-left">
      {content}
    </button>
  );
}

function Header({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-3 px-2 pt-6 pb-3">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 shadow-sm">
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-[16px] font-extrabold text-gray-900">{title}</div>
        <div className="text-[12px] font-medium text-gray-400">{subtitle}</div>
      </div>
    </div>
  );
}

function safeDateLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('th-TH');
}
function emitNotificationsChanged() {
  window.dispatchEvent(new Event('notifications-changed'));
}

export default function Sidebar({
  isOpen,
  onClose,
  mode,
  username,
  cartCount,
  handleLogout,
  setMode,
  profile,
  role,
}: SidebarProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [notis, setNotis] = useState<NotiItem[]>([]);
  const [notiLoading, setNotiLoading] = useState(false);

  useEffect(() => {
    if (isOpen && mode === 'search') {
      const t = setTimeout(() => inputRef.current?.focus(), 250);
      return () => clearTimeout(t);
    }
  }, [isOpen, mode]);

  useEffect(() => {
    if (isOpen && mode === 'notifications') {
      void loadNotis();
    }
  }, [isOpen, mode]);

  const loadNotis = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setNotis([]);
      return;
    }

    setNotiLoading(true);
    try {
      const res = await fetch(`${API}/notifications?limit=40`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        setNotis([]);
        return;
      }

      const data = (await res.json()) as NotiListResponse;
      setNotis(Array.isArray(data?.items) ? data.items : []);
    } catch {
      setNotis([]);
    } finally {
      setNotiLoading(false);
    }
  };

const markRead = async (Nid: number) => {
  const token = localStorage.getItem('token');
  if (!token) return;

  setNotis((prev) => prev.map((n) => (n.Nid === Nid ? { ...n, is_read: 1 } : n)));
  emitNotificationsChanged();

  try {
    await fetch(`${API}/notifications/${Nid}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    setNotis((prev) => prev.map((n) => (n.Nid === Nid ? { ...n, is_read: 0 } : n)));
    emitNotificationsChanged();
  }
};

const readAll = async () => {
  const token = localStorage.getItem('token');
  if (!token) return;

  setNotis((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
  emitNotificationsChanged();

  try {
    await fetch(`${API}/notifications/read-all`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    void loadNotis();
    emitNotificationsChanged();
  }
};

  const goCategory = (typeid: number | null, subtypeid: number | null = null) => {
    const qs = new URLSearchParams();
    if (typeid !== null) qs.set('typeid', String(typeid));
    if (subtypeid !== null) qs.set('subtypeid', String(subtypeid));

    router.push(qs.toString() ? `/?${qs.toString()}` : '/');
    onClose();
  };

  const UserHero = () => (
    <div className="relative overflow-hidden px-4 pt-8 pb-6 text-center">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(220,252,231,1)_0%,rgba(255,255,255,0)_70%)]" />
      <div className="relative mx-auto mb-3 inline-flex rounded-full bg-gradient-to-br from-emerald-200 via-emerald-600 to-emerald-300 p-[3px] shadow-[0_10px_30px_rgba(16,185,129,0.25)]">
        <div className="h-16 w-16 overflow-hidden rounded-full bg-white ring-2 ring-white">
          <img
            src={getProfileUrl(profile)}
            alt="โปรไฟล์"
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/default-profile.png';
            }}
          />
        </div>
      </div>

      <div className="relative">
        <div className="text-[11px] font-bold tracking-[0.18em] text-emerald-700 uppercase">
          ยินดีต้อนรับกลับมา
        </div>
        <div className="mt-1 text-[16px] font-extrabold text-gray-900">{username || 'ผู้ใช้งาน'}</div>

        {role === 'admin' && (
          <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white/70 px-3 py-1 text-[11px] font-bold text-emerald-800">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            ADMIN
          </div>
        )}
      </div>
    </div>
  );

  const content = () => {
    switch (mode) {
      case 'user':
        return (
          <div className="px-2 pb-2">
            <UserHero />

            <div className="space-y-1">
              <Row href="/me" onClick={onClose} icon={<User className="h-5 w-5" />} label="โปรไฟล์ของฉัน" tone="blue" />
              <Row href="/me/my-bidding" onClick={onClose} icon={<Gavel className="h-5 w-5" />} label="รายการประมูลของฉัน" tone="amber" />
              <Row href="/me/orders" onClick={onClose} icon={<History className="h-5 w-5" />} label="ประวัติคำสั่งซื้อ" tone="purple" />
              <Row href="/me/auction-wins" onClick={onClose} icon={<Trophy className="h-5 w-5" />} label="สินค้าที่ชนะประมูล" tone="amber" />

              {role === 'admin' && (
                <Row
                  href="/admin/dashboard"
                  onClick={onClose}
                  icon={<LayoutDashboard className="h-5 w-5" />}
                  label="กลับไปยังแดชบอร์ด"
                  tone="emerald"
                />
              )}
            </div>

            <div className="my-4 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

            <button
              type="button"
              onClick={() => {
                handleLogout();
                onClose();
              }}
              className="w-full"
            >
              <div className="flex items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-red-50 active:scale-[0.99]">
                <IconBadge tone="red">
                  <LogOut className="h-5 w-5" />
                </IconBadge>
                <span className="flex-1 text-[14px] font-semibold text-red-600">ออกจากระบบ</span>
              </div>
            </button>
          </div>
        );

      case 'categories':
        return (
          <div className="px-2 pb-2">
            <Header icon={<List className="h-5 w-5" />} title="หมวดหมู่" subtitle="เลือกประเภทสินค้า" />

            <button
              type="button"
              onClick={() => goCategory(null, null)}
              className="mx-2 mb-3 flex w-[calc(100%-16px)] items-center gap-3 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-white px-4 py-3 text-left shadow-sm transition hover:shadow"
            >
              <IconBadge tone="emerald">
                <ShoppingCart className="h-5 w-5" />
              </IconBadge>
              <span className="flex-1 text-[14px] font-bold text-emerald-800">สินค้าทั้งหมด</span>
              <ChevronRight className="h-5 w-5 text-emerald-200" />
            </button>

            <div className="space-y-1">
              {categories.map((cat) => {
                const CatI = cat.icon;
                return (
                  <button key={cat.id} type="button" onClick={() => goCategory(cat.id, null)} className="w-full">
                    <div className="flex items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-emerald-50 active:scale-[0.99]">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white ring-1 ring-emerald-100">
                        <CatI className="h-5 w-5 text-emerald-700" />
                      </span>
                      <span className="flex-1 text-[14px] font-medium text-gray-700">{cat.label}</span>
                      <ChevronRight className="h-5 w-5 text-gray-300" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'search':
        return (
          <div className="px-2 pb-2">
            <Header icon={<Search className="h-5 w-5" />} title="ค้นหาสินค้า" subtitle="พิมพ์ชื่อที่ต้องการ" />

            <div className="mx-2 mt-2">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Lophophora, หนามเหลือง..."
                  className="h-12 w-full rounded-2xl border border-gray-200 bg-gray-50 pl-11 pr-4 text-[14px] text-gray-900 outline-none transition focus:border-emerald-200 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                  onChange={(e) => {
                    window.dispatchEvent(new CustomEvent<string>('do-search', { detail: e.target.value }));
                  }}
                />
              </div>

              <div className="mt-3 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-[12px] leading-relaxed text-amber-800">
                ลองค้นหาด้วยชื่อสายพันธุ์ เช่น <span className="font-bold">Lophophora</span> หรือคำบรรยายเช่น{' '}
                <span className="font-bold">หนามเหลือง</span>
              </div>
            </div>
          </div>
        );

      case 'cart':
        return (
          <div className="h-full px-2 pb-2 pt-3">
            <CartPanel variant="drawer" />
          </div>
        );

      case 'notifications':
        return (
          <div className="px-2 pb-2">
            <div className="flex items-center justify-between px-2 pt-6 pb-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 shadow-sm">
                  <TbBellRingingFilled />
                </span>
                <div className="min-w-0">
                  <div className="text-[16px] font-extrabold text-gray-900">แจ้งเตือน</div>
                  <div className="text-[12px] font-medium text-gray-400">อัปเดตล่าสุดของบัญชีคุณ</div>
                </div>
              </div>

              <button
                type="button"
                onClick={readAll}
                className="rounded-full border border-emerald-100 bg-white px-3 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-50"
              >
                อ่านทั้งหมด
              </button>
            </div>

            {notiLoading ? (
              <div className="space-y-2 px-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-2xl bg-gray-50 ring-1 ring-gray-100 animate-pulse" />
                ))}
              </div>
            ) : notis.length === 0 ? (
              <div className="mx-2 mt-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-[13px] text-gray-600">
                ยังไม่มีแจ้งเตือน
              </div>
            ) : (
              <div className="space-y-2 px-2">
                {notis.map((n) => {
                  const unread = n.is_read === 0;

                  return (
                    <button
                      key={n.Nid}
                      type="button"
                      onClick={() => {
                        if (unread) void markRead(n.Nid);
                        if (n.link) router.push(n.link);
                        onClose();
                      }}
                      className={[
                        'w-full text-left rounded-2xl border px-4 py-3 transition',
                        unread
                          ? 'border-emerald-100 bg-emerald-50/60 hover:bg-emerald-50'
                          : 'border-gray-200 bg-white hover:bg-gray-50 opacity-80',
                      ].join(' ')}
                    >
                      <div className="flex items-start gap-3">
                        {unread ? (
                          <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-emerald-600" />
                        ) : (
                          <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-gray-300" />
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] font-extrabold text-gray-900 truncate">{n.title}</div>

                          {n.body && <div className="mt-1 text-[12px] text-gray-600 line-clamp-2">{n.body}</div>}

                          <div className="mt-2 text-[11px] font-medium text-gray-400">
                            {safeDateLabel(n.created_at)}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );

      case 'menu':
        return (
          <div className="px-2 pb-2">
            <Header icon={<Home className="h-5 w-5" />} title="เมนูหลัก" subtitle="สำรวจเว็บไซต์ของเรา" />

            <div className="space-y-1">
              <Row href="/" onClick={onClose} icon={<Home className="h-5 w-5" />} label="หน้าแรก" tone="emerald" />
              <Row onClick={() => setMode('categories')} icon={<List className="h-5 w-5" />} label="หมวดหมู่สินค้า" tone="emerald" />
              <Row href="/auctions" onClick={onClose} icon={<Gavel className="h-5 w-5" />} label="สินค้าประมูล" tone="amber" />
              <Row href="/forum" onClick={onClose} icon={<MessagesSquare className="h-5 w-5" />} label="กระทู้พูดคุย" tone="blue" />
              <Row href="/auctionguide" onClick={onClose} icon={<BookOpen className="h-5 w-5" />} label="ขั้นตอนการประมูล" tone="purple" />

              <div className="my-4 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

              <Row href="/FAQ" onClick={onClose} icon={<HelpCircle className="h-5 w-5" />} label="คำถามที่พบบ่อย" tone="gray" />
              <Row href="/Insurance" onClick={onClose} icon={<ShieldCheck className="h-5 w-5" />} label="การรับประกันสินค้า" tone="emerald" />
              <Row href="/About" onClick={onClose} icon={<Info className="h-5 w-5" />} label="รีวิวเกี่ยวกับเรา" tone="emerald" />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <div
        className={[
          'fixed inset-0 z-[60] bg-black/40 backdrop-blur-md transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        ].join(' ')}
        onClick={onClose}
      />

      <div
        className={[
          'fixed right-0 top-0 z-[70] flex h-full w-[360px] flex-col bg-white',
          'sm:w-[400px] md:w-[420px]',
          'shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
        style={{
          borderRadius: '28px 0 0 28px',
          boxShadow: '-24px 0 80px -12px rgba(0,0,0,0.12), -4px 0 24px -6px rgba(0,0,0,0.07)',
          borderLeft: '1px solid rgba(229,231,235,0.6)',
        }}
      >
        <div className="flex-1 overflow-y-auto px-2 pb-2 [scrollbar-width:thin]">{content()}</div>

        <div className="flex items-center justify-center border-t border-gray-100 bg-gradient-to-t from-white to-transparent p-5">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-400 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-500 active:scale-95"
            aria-label="ปิด"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </>
  );
}